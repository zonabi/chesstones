import Peer, { DataConnection } from "peerjs";
import type { PeerMessage, PlayerRole } from "@/types";

/** Prefix for room IDs to avoid PeerJS namespace collisions */
const ROOM_PREFIX = "chesstones-";

/** Generate a random 6-char alphanumeric room code */
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1 for clarity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type PeerEventHandler = (peerId: string) => void;
export type MessageHandler = (msg: PeerMessage, fromPeerId: string) => void;

/**
 * Manages WebRTC peer connections via PeerJS.
 * Handles room creation, joining, spectating, and message broadcasting.
 */
export class PeerManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private role: PlayerRole = "host";
  private roomCode = "";

  // Event handlers
  private onMessageHandler: MessageHandler | null = null;
  private onPeerConnectHandler: PeerEventHandler | null = null;
  private onPeerDisconnectHandler: PeerEventHandler | null = null;
  private onErrorHandler: ((error: string) => void) | null = null;
  private onOpenHandler: ((roomCode: string) => void) | null = null;

  get connectedPeerCount(): number {
    return this.connections.size;
  }

  get currentRoomCode(): string {
    return this.roomCode;
  }

  get currentRole(): PlayerRole {
    return this.role;
  }

  get isConnected(): boolean {
    return this.peer !== null && !this.peer.destroyed;
  }

  // ─── EVENT REGISTRATION ────────────────────────────────

  onMessage(handler: MessageHandler): void {
    this.onMessageHandler = handler;
  }

  onPeerConnect(handler: PeerEventHandler): void {
    this.onPeerConnectHandler = handler;
  }

  onPeerDisconnect(handler: PeerEventHandler): void {
    this.onPeerDisconnectHandler = handler;
  }

  onError(handler: (error: string) => void): void {
    this.onErrorHandler = handler;
  }

  onOpen(handler: (roomCode: string) => void): void {
    this.onOpenHandler = handler;
  }

  // ─── ROOM MANAGEMENT ──────────────────────────────────

  /** Create a new room as host */
  createRoom(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.role = "host";
      this.roomCode = generateRoomCode();
      const peerId = ROOM_PREFIX + this.roomCode;

      this.peer = new Peer(peerId, {
        debug: 0, // silent
      });

      this.peer.on("open", () => {
        this.onOpenHandler?.(this.roomCode);
        resolve(this.roomCode);
      });

      this.peer.on("connection", (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on("error", (err) => {
        const msg = err.type === "unavailable-id"
          ? "Room code already in use. Try again."
          : `Connection error: ${err.message}`;
        this.onErrorHandler?.(msg);
        reject(new Error(msg));
      });
    });
  }

  /** Join an existing room as a player */
  joinRoom(code: string): Promise<void> {
    return this.connectToRoom(code, "guest");
  }

  /** Join an existing room as a spectator */
  spectateRoom(code: string): Promise<void> {
    return this.connectToRoom(code, "spectator");
  }

  private connectToRoom(code: string, role: PlayerRole): Promise<void> {
    return new Promise((resolve, reject) => {
      this.role = role;
      this.roomCode = code.toUpperCase();

      // Generate a unique peer ID for this client
      const clientId = `${ROOM_PREFIX}${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      this.peer = new Peer(clientId, {
        debug: 0,
      });

      this.peer.on("open", () => {
        // Connect to the host
        const hostId = ROOM_PREFIX + this.roomCode;
        const conn = this.peer!.connect(hostId, {
          reliable: true,
          metadata: { role: this.role },
        });

        conn.on("open", () => {
          this.setupConnection(conn);
          // Send player info to host
          this.send(conn, {
            type: "player-info",
            payload: { name: role === "guest" ? "Opponent" : "Spectator", role },
            timestamp: Date.now(),
          });
          resolve();
        });

        conn.on("error", (err) => {
          const msg = `Failed to connect: ${err.message}`;
          this.onErrorHandler?.(msg);
          reject(new Error(msg));
        });

        // Handle case where host doesn't exist
        setTimeout(() => {
          if (conn.open === false) {
            const msg = "Could not find room. Check the code and try again.";
            this.onErrorHandler?.(msg);
            reject(new Error(msg));
          }
        }, 10000);
      });

      this.peer.on("error", (err) => {
        const msg = err.type === "peer-unavailable"
          ? "Room not found. Check the code and try again."
          : `Connection error: ${err.message}`;
        this.onErrorHandler?.(msg);
        reject(new Error(msg));
      });

      // Also accept incoming connections (for mesh relay from host)
      this.peer.on("connection", (conn) => {
        this.setupConnection(conn);
      });
    });
  }

  // ─── CONNECTION MANAGEMENT ─────────────────────────────

  private setupConnection(conn: DataConnection): void {
    const peerId = conn.peer;

    conn.on("open", () => {
      this.connections.set(peerId, conn);
      this.onPeerConnectHandler?.(peerId);
    });

    conn.on("data", (rawData) => {
      const msg = rawData as PeerMessage;
      this.onMessageHandler?.(msg, peerId);

      // Host relays messages to all other peers (star topology)
      if (this.role === "host" && msg.type === "move") {
        this.broadcastExcept(msg, peerId);
      }
    });

    conn.on("close", () => {
      this.connections.delete(peerId);
      this.onPeerDisconnectHandler?.(peerId);
    });

    conn.on("error", () => {
      this.connections.delete(peerId);
      this.onPeerDisconnectHandler?.(peerId);
    });

    // If connection is already open (e.g. host receives), register immediately
    if (conn.open) {
      this.connections.set(peerId, conn);
      this.onPeerConnectHandler?.(peerId);
    }
  }

  // ─── MESSAGING ─────────────────────────────────────────

  /** Send a message to a specific connection */
  private send(conn: DataConnection, msg: PeerMessage): void {
    if (conn.open) {
      conn.send(msg);
    }
  }

  /** Broadcast a message to all connected peers */
  broadcast(msg: PeerMessage): void {
    this.connections.forEach((conn) => {
      this.send(conn, msg);
    });
  }

  /** Broadcast to all peers except one (used for relaying) */
  private broadcastExcept(msg: PeerMessage, excludePeerId: string): void {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId) {
        this.send(conn, msg);
      }
    });
  }

  /** Send a typed message to all peers */
  sendMove(move: { from: string; to: string; promotion?: string; enPassant?: boolean; castling?: "K" | "Q" }, san: string): void {
    this.broadcast({
      type: "move",
      payload: { move, san },
      timestamp: Date.now(),
    });
  }

  /** Send full game state to all peers (for new joiners) */
  sendStateSync(state: unknown): void {
    this.broadcast({
      type: "state-sync",
      payload: state,
      timestamp: Date.now(),
    });
  }

  /** Send state sync to a specific peer */
  sendStateSyncTo(peerId: string, state: unknown): void {
    const conn = this.connections.get(peerId);
    if (conn) {
      this.send(conn, {
        type: "state-sync",
        payload: state,
        timestamp: Date.now(),
      });
    }
  }

  /** Send audio settings to all peers */
  sendAudioSettings(settings: { rootNote: string; scaleId: string; themeId: string }): void {
    this.broadcast({
      type: "audio-settings",
      payload: settings,
      timestamp: Date.now(),
    });
  }

  /** Signal a new game to all peers */
  sendGameReset(): void {
    this.broadcast({
      type: "game-reset",
      payload: null,
      timestamp: Date.now(),
    });
  }

  // ─── CLEANUP ───────────────────────────────────────────

  /** Destroy all connections and the peer */
  destroy(): void {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.roomCode = "";
  }
}
