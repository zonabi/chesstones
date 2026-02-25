import { useState, useCallback, useEffect } from "react";
import type {
  Board, CastlingRights, CapturedPieces, Color,
  GameMode, GameStatus, Move, PieceType, PulseType, Square,
} from "@/types";
import { AudioEngine } from "@/audio";
import type { RootNote } from "@/audio";
import type { AudioSettings } from "./useAudioSettings";
import {
  createInitialBoard, makeMove, parseSquare, sqStr,
  getLegalMoves, isInCheck,
} from "@/engine";
import { squareToFreq } from "@/constants";
import { getAIMove } from "@/ai";

interface UseChessGameReturn {
  board: Board;
  turn: Color;
  selected: Square | null;
  legalSquares: Move[];
  gameStatus: GameStatus;
  mode: GameMode;
  lastMove: Move | null;
  capturedPieces: CapturedPieces;
  moveNotation: string[];
  aiThinking: boolean;
  squarePulse: Record<string, PulseType>;
  showPromotion: Move | null;
  castling: CastlingRights;
  enPassant: Square | null;
  handleSquareClick: (sq: Square) => void;
  handlePromotion: (promoType: PieceType) => void;
  executeMove: (move: Move) => void;
  newGame: () => void;
  setMode: (mode: GameMode) => void;
  /** Reset the game state to match replay mode entry */
  enterReplayMode: () => void;
  /** Restore board to a specific state (used by replay) */
  restoreState: (state: {
    board: Board;
    turn: Color;
    castling: CastlingRights;
    enPassant: Square | null;
    lastMove: Move | null;
    moveNotation: string[];
    capturedPieces: CapturedPieces;
    squarePulse: Record<string, PulseType>;
  }) => void;
}

/**
 * Core chess game logic hook.
 * Handles move execution, validation, AI, promotion, and game status.
 */
export function useChessGame(
  audioRef: React.RefObject<AudioEngine | null>,
  _audioStarted: boolean,
  audioSettings?: AudioSettings,
  onlineColor?: Color | null,
): UseChessGameReturn {
  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [turn, setTurn] = useState<Color>("w");
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalSquares, setLegalSquares] = useState<Move[]>([]);
  const [enPassant, setEnPassant] = useState<Square | null>(null);
  const [castling, setCastling] = useState<CastlingRights>({ wK: true, wQ: true, bK: true, bQ: true });
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [mode, setMode] = useState<GameMode>("play");
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ w: [], b: [] });
  const [moveNotation, setMoveNotation] = useState<string[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [squarePulse, setSquarePulse] = useState<Record<string, PulseType>>({});
  const [showPromotion, setShowPromotion] = useState<Move | null>(null);

  // Extract scale params for audio calls
  const rootNote: RootNote = audioSettings?.data.rootNote ?? "C";
  const scale = audioSettings?.scale;
  const clickSoundEnabled = audioSettings?.data.clickSoundEnabled ?? true;

  // ─── SAN NOTATION ─────────────────────────────────────

  function moveToSAN(currentBoard: Board, move: Move, currentCastling: CastlingRights): string {
    const piece = currentBoard[move.from];
    if (!piece) return "";
    if (move.castling === "K") return "O-O";
    if (move.castling === "Q") return "O-O-O";

    let san = "";
    if (piece.type !== "p") san += piece.type.toUpperCase();

    const isCapture = !!currentBoard[move.to] || move.enPassant;
    if (piece.type === "p" && isCapture) san += move.from[0];
    if (isCapture) san += "x";
    san += move.to;
    if (move.promotion) san += "=" + move.promotion.toUpperCase();

    const newBoard = makeMove(currentBoard, move);
    const enemy: Color = piece.color === "w" ? "b" : "w";
    if (isInCheck(newBoard, enemy)) {
      const enemyMoves = getLegalMoves(newBoard, enemy, null, currentCastling);
      san += enemyMoves.length === 0 ? "#" : "+";
    }

    return san;
  }

  // ─── MOVE EXECUTION ───────────────────────────────────

  const executeMove = useCallback((move: Move) => {
    const piece = board[move.from];
    if (!piece) return;

    const captured = board[move.to];
    const isCapture = !!captured || move.enPassant;
    const newBoard = makeMove(board, move);
    const enemy: Color = piece.color === "w" ? "b" : "w";
    const inCheck = isInCheck(newBoard, enemy);

    // Play sounds — now with scale params
    if (audioRef.current?.isInitialized) {
      audioRef.current.playMove(
        move.from, move.to, piece.type,
        isCapture, !!move.castling, inCheck,
        rootNote, scale
      );
    }

    // Update castling rights
    const newCastling = { ...castling };
    if (piece.type === "k") {
      newCastling[`${piece.color}K` as keyof CastlingRights] = false;
      newCastling[`${piece.color}Q` as keyof CastlingRights] = false;
    }
    if (piece.type === "r") {
      if (move.from === "a1") newCastling.wQ = false;
      if (move.from === "h1") newCastling.wK = false;
      if (move.from === "a8") newCastling.bQ = false;
      if (move.from === "h8") newCastling.bK = false;
    }

    // En passant target
    let newEP: Square | null = null;
    if (piece.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2) {
      newEP = sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2);
    }

    // Track captures
    if (captured) {
      setCapturedPieces((prev) => ({
        ...prev,
        [captured.color]: [...prev[captured.color], captured.type],
      }));
    }
    if (move.enPassant) {
      const capturedColor: Color = enemy === "w" ? "b" : "w";
      setCapturedPieces((prev) => ({
        ...prev,
        [capturedColor]: [...prev[capturedColor], "p" as PieceType],
      }));
    }

    // SAN
    const san = moveToSAN(board, move, castling);
    setMoveNotation((prev) => [...prev, san]);

    // Visual pulse (longer to match smoother audio)
    setSquarePulse({ [move.from]: "departure", [move.to]: "arrival" });
    setTimeout(() => setSquarePulse({}), 900);

    // Apply state
    setBoard(newBoard);
    setCastling(newCastling);
    setEnPassant(newEP);
    setLastMove(move);
    setSelected(null);
    setLegalSquares([]);

    // Check game status
    const enemyMoves = getLegalMoves(newBoard, enemy, newEP, newCastling);
    if (enemyMoves.length === 0) {
      if (inCheck) {
        setGameStatus("checkmate");
        audioRef.current?.playCheckmateSound();
      } else {
        setGameStatus("stalemate");
      }
    } else if (inCheck) {
      setGameStatus("check");
    } else {
      setGameStatus("playing");
    }

    setTurn(enemy);
  }, [board, castling, audioRef, rootNote, scale]);

  // ─── SQUARE CLICK ─────────────────────────────────────

  const handleSquareClick = useCallback((sq: Square) => {
    if (mode === "replay" || gameStatus === "checkmate" || gameStatus === "stalemate" || aiThinking) return;
    // In "play" (vs AI) mode, only white can move. In "local" both colors can.
    // In "online" mode, the multiplayer hook controls which color can move (via onlineColor).
    if (mode === "play" && turn !== "w") return;
    if (mode === "online" && onlineColor && turn !== onlineColor) return;

    if (selected) {
      const move = legalSquares.find((m) => m.to === sq);
      if (move) {
        if (move.promotion) {
          setShowPromotion(move);
          return;
        }
        executeMove(move);
        return;
      }
    }

    const piece = board[sq];
    if (piece && piece.color === turn) {
      setSelected(sq);
      const moves = getLegalMoves(board, turn, enPassant, castling).filter((m) => m.from === sq);
      setLegalSquares(moves);

      // Preview tone for own piece selection (always plays)
      if (audioRef.current?.isInitialized) {
        const { file, rank } = parseSquare(sq);
        const freq = squareToFreq(file, rank, rootNote, scale);
        audioRef.current.playNote(freq, piece.type, 0.1, 0);
      }
    } else {
      // Click sound on any square (enemy or empty) — if enabled
      if (clickSoundEnabled && audioRef.current?.isInitialized) {
        const { file, rank } = parseSquare(sq);
        const freq = squareToFreq(file, rank, rootNote, scale);
        const pieceType = piece?.type ?? "p";
        audioRef.current.playNote(freq, pieceType, 0.15, 0);
      }

      setSelected(null);
      setLegalSquares([]);
    }
  }, [selected, legalSquares, board, turn, enPassant, castling, mode, gameStatus, aiThinking, executeMove, audioRef, rootNote, scale, clickSoundEnabled, onlineColor]);

  // ─── PROMOTION ────────────────────────────────────────

  const handlePromotion = useCallback((promoType: PieceType) => {
    if (showPromotion) {
      executeMove({ ...showPromotion, promotion: promoType });
      setShowPromotion(null);
    }
  }, [showPromotion, executeMove]);

  // ─── AI OPPONENT ──────────────────────────────────────

  useEffect(() => {
    if (mode !== "play" || turn !== "b" || (gameStatus !== "playing" && gameStatus !== "check") || aiThinking) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const aiMove = getAIMove(board, enPassant, castling);
      if (aiMove) executeMove(aiMove);
      setAiThinking(false);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode, gameStatus]);

  // ─── NEW GAME ─────────────────────────────────────────

  const newGame = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn("w");
    setSelected(null);
    setLegalSquares([]);
    setEnPassant(null);
    setCastling({ wK: true, wQ: true, bK: true, bQ: true });
    setGameStatus("playing");
    setLastMove(null);
    setMode("play");
    setCapturedPieces({ w: [], b: [] });
    setMoveNotation([]);
    setSquarePulse({});
    setShowPromotion(null);
    setAiThinking(false);
    if (audioRef.current?.isInitialized) audioRef.current.startAmbient(0, 0, 32);
  }, [audioRef]);

  // ─── REPLAY HELPERS ───────────────────────────────────

  const enterReplayMode = useCallback(() => {
    setBoard(createInitialBoard());
    setMoveNotation([]);
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setTurn("w");
    setGameStatus("playing");
    setMode("replay");
    setSelected(null);
    setLegalSquares([]);
  }, []);

  const restoreState = useCallback((state: {
    board: Board;
    turn: Color;
    castling: CastlingRights;
    enPassant: Square | null;
    lastMove: Move | null;
    moveNotation: string[];
    capturedPieces: CapturedPieces;
    squarePulse: Record<string, PulseType>;
  }) => {
    setBoard(state.board);
    setTurn(state.turn);
    setCastling(state.castling);
    setEnPassant(state.enPassant);
    setLastMove(state.lastMove);
    setMoveNotation(state.moveNotation);
    setCapturedPieces(state.capturedPieces);
    setSquarePulse(state.squarePulse);
    setTimeout(() => setSquarePulse({}), 600);
  }, []);

  return {
    board, turn, selected, legalSquares, gameStatus, mode, lastMove,
    capturedPieces, moveNotation, aiThinking, squarePulse, showPromotion,
    castling, enPassant,
    handleSquareClick, handlePromotion, newGame, setMode,
    enterReplayMode, restoreState, executeMove,
  };
}
