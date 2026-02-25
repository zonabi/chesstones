import type { Board, CapturedPieces, CastlingRights, Color, GameStatus, Move, PulseType, Square } from "./chess";

/** Role of this client in an online game */
export type PlayerRole = "host" | "guest" | "spectator";

/** Types of messages sent between peers */
export type MessageType =
  | "move"
  | "state-sync"
  | "game-reset"
  | "audio-settings"
  | "player-info"
  | "chat";

/** Base peer message envelope */
export interface PeerMessage {
  type: MessageType;
  payload: unknown;
  timestamp: number;
}

/** Move message payload */
export interface MovePayload {
  move: Move;
  san: string;
}

/** Full game state for syncing new joiners */
export interface StateSyncPayload {
  board: Board;
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  lastMove: Move | null;
  moveNotation: string[];
  capturedPieces: CapturedPieces;
  gameStatus: GameStatus;
  squarePulse: Record<string, PulseType>;
}

/** Audio settings sync payload */
export interface AudioSettingsPayload {
  rootNote: string;
  scaleId: string;
  themeId: string;
}

/** Player info payload */
export interface PlayerInfoPayload {
  name: string;
  role: PlayerRole;
}

/** Online game state */
export interface OnlineState {
  roomCode: string;
  role: PlayerRole;
  playerColor: Color;
  connectedPeers: number;
  opponentName?: string;
  isConnected: boolean;
  error?: string;
}
