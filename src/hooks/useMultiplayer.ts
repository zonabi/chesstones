import { useState, useCallback, useRef, useEffect } from "react";
import { PeerManager } from "@/multiplayer";
import type { Color, Move, PeerMessage, MovePayload, StateSyncPayload, AudioSettingsPayload, PlayerRole } from "@/types";

interface UseMultiplayerReturn {
  // State
  roomCode: string;
  role: PlayerRole | null;
  playerColor: Color | null;
  connectedPeers: number;
  isConnected: boolean;
  error: string | null;
  opponentName: string;

  // Actions
  hostGame: () => Promise<void>;
  joinGame: (code: string) => Promise<void>;
  spectateGame: (code: string) => Promise<void>;
  sendMove: (move: Move, san: string) => void;
  sendStateSync: (state: StateSyncPayload) => void;
  sendAudioSettings: (settings: AudioSettingsPayload) => void;
  sendGameReset: () => void;
  disconnect: () => void;

  // Callbacks (set by consumer)
  onRemoteMove: React.MutableRefObject<((payload: MovePayload) => void) | null>;
  onStateSync: React.MutableRefObject<((payload: StateSyncPayload) => void) | null>;
  onAudioSettingsSync: React.MutableRefObject<((payload: AudioSettingsPayload) => void) | null>;
  onGameReset: React.MutableRefObject<(() => void) | null>;
  onNewPeer: React.MutableRefObject<((peerId: string) => void) | null>;
}

/**
 * React hook for managing multiplayer connections.
 * Wraps PeerManager with React state and lifecycle.
 */
export function useMultiplayer(): UseMultiplayerReturn {
  const [roomCode, setRoomCode] = useState("");
  const [role, setRole] = useState<PlayerRole | null>(null);
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");

  const peerRef = useRef<PeerManager | null>(null);

  // Callback refs — set by the consumer to handle remote events
  const onRemoteMove = useRef<((payload: MovePayload) => void) | null>(null);
  const onStateSync = useRef<((payload: StateSyncPayload) => void) | null>(null);
  const onAudioSettingsSync = useRef<((payload: AudioSettingsPayload) => void) | null>(null);
  const onGameReset = useRef<(() => void) | null>(null);
  const onNewPeer = useRef<((peerId: string) => void) | null>(null);

  // ─── MESSAGE HANDLER ───────────────────────────────────

  const handleMessage = useCallback((msg: PeerMessage, _fromPeerId: string) => {
    switch (msg.type) {
      case "move":
        onRemoteMove.current?.(msg.payload as MovePayload);
        break;
      case "state-sync":
        onStateSync.current?.(msg.payload as StateSyncPayload);
        break;
      case "audio-settings":
        onAudioSettingsSync.current?.(msg.payload as AudioSettingsPayload);
        break;
      case "game-reset":
        onGameReset.current?.();
        break;
      case "player-info": {
        const info = msg.payload as { name: string; role: PlayerRole };
        if (info.role === "guest") {
          setOpponentName(info.name || "Opponent");
        }
        break;
      }
    }
  }, []);

  // ─── SETUP PEER MANAGER ────────────────────────────────

  const setupPeer = useCallback(() => {
    const pm = new PeerManager();

    pm.onMessage(handleMessage);

    pm.onPeerConnect((peerId) => {
      setConnectedPeers(pm.connectedPeerCount);
      onNewPeer.current?.(peerId);
    });

    pm.onPeerDisconnect(() => {
      // Update peer count and mark the session as disconnected so the game can react appropriately.
      setConnectedPeers(pm.connectedPeerCount);
      setIsConnected(false);
      setError("Peer disconnected");
    });

    pm.onError((err) => {
      setError(err);
    });

    peerRef.current = pm;
    return pm;
  }, [handleMessage]);

  // ─── ACTIONS ───────────────────────────────────────────

  const hostGame = useCallback(async () => {
    setError(null);
    const pm = setupPeer();
    try {
      const code = await pm.createRoom();
      setRoomCode(code);
      setRole("host");
      setPlayerColor("w");
      setIsConnected(true);
      // Update URL hash for sharing
      window.location.hash = `room=${code}`;
    } catch {
      setIsConnected(false);
    }
  }, [setupPeer]);

  const joinGame = useCallback(async (code: string) => {
    setError(null);
    const pm = setupPeer();
    try {
      await pm.joinRoom(code);
      setRoomCode(code.toUpperCase());
      setRole("guest");
      setPlayerColor("b");
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, [setupPeer]);

  const spectateGame = useCallback(async (code: string) => {
    setError(null);
    const pm = setupPeer();
    try {
      await pm.spectateRoom(code);
      setRoomCode(code.toUpperCase());
      setRole("spectator");
      setPlayerColor(null);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, [setupPeer]);

  const sendMove = useCallback((move: Move, san: string) => {
    peerRef.current?.sendMove(move, san);
  }, []);

  const sendStateSync = useCallback((state: StateSyncPayload) => {
    peerRef.current?.sendStateSync(state);
  }, []);

  const sendAudioSettings = useCallback((settings: AudioSettingsPayload) => {
    peerRef.current?.sendAudioSettings(settings);
  }, []);

  const sendGameReset = useCallback(() => {
    peerRef.current?.sendGameReset();
  }, []);

  const disconnect = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    setRoomCode("");
    setRole(null);
    setPlayerColor(null);
    setConnectedPeers(0);
    setIsConnected(false);
    setError(null);
    setOpponentName("Opponent");
    // Clear URL hash
    if (window.location.hash.includes("room=")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return {
    roomCode, role, playerColor, connectedPeers, isConnected, error, opponentName,
    hostGame, joinGame, spectateGame,
    sendMove, sendStateSync, sendAudioSettings, sendGameReset, disconnect,
    onRemoteMove, onStateSync, onAudioSettingsSync, onGameReset, onNewPeer,
  };
}
