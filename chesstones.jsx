import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ════════════════════════════════════════════════════════════════
// ██████╗██╗  ██╗███████╗███████╗███████╗████████╗ ██████╗ ███╗   ██╗███████╗███████╗
// ██╔════╝██║  ██║██╔════╝██╔════╝██╔════╝╚══██╔══╝██╔═══██╗████╗  ██║██╔════╝██╔════╝
// ██║     ███████║█████╗  ███████╗███████╗   ██║   ██║   ██║██╔██╗ ██║█████╗  ███████╗
// ██║     ██╔══██║██╔══╝  ╚════██║╚════██║   ██║   ██║   ██║██║╚██╗██║██╔══╝  ╚════██║
// ╚██████╗██║  ██║███████╗███████║███████║   ██║   ╚██████╔╝██║ ╚████║███████╗███████║
//  ╚═════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝
// Where every move is music.
// ════════════════════════════════════════════════════════════════

// ─── CONSTANTS ───────────────────────────────────────────────
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];

const PIECE_TYPES = { PAWN: "p", KNIGHT: "n", BISHOP: "b", ROOK: "r", QUEEN: "q", KING: "k" };
const COLORS = { WHITE: "w", BLACK: "b" };

const PIECE_SYMBOLS = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// ─── MUSIC THEORY ───────────────────────────────────────────
// C major scale across files a-h, octaves across ranks 1-8
const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B", "C"];
const BASE_OCTAVE = 2;

// Frequencies for chromatic scale (A4 = 440Hz)
function noteToFreq(noteName, octave) {
  const noteMap = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
  const semitonesFromA4 = noteMap[noteName] + (octave - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

function squareToFreq(file, rank) {
  const fileIdx = FILES.indexOf(file);
  const noteName = NOTE_NAMES[fileIdx];
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8); // spread across ~5 octaves
  return noteToFreq(noteName, octave);
}

function squareToNote(file, rank) {
  const fileIdx = FILES.indexOf(file);
  const noteName = NOTE_NAMES[fileIdx];
  const octave = BASE_OCTAVE + Math.floor((rank - 1) * 5 / 8);
  return `${noteName}${octave}`;
}

// ─── PIECE WAVEFORMS & AUDIO CHARACTERISTICS ─────────────────
const PIECE_AUDIO = {
  p: { wave: "sine", attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2, gain: 0.3 },
  n: { wave: "triangle", attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.3, gain: 0.35 },
  b: { wave: "sawtooth", attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.4, gain: 0.15 },
  r: { wave: "square", attack: 0.005, decay: 0.5, sustain: 0.4, release: 0.3, gain: 0.12 },
  q: { wave: "sawtooth", attack: 0.02, decay: 0.6, sustain: 0.5, release: 0.5, gain: 0.2 },
  k: { wave: "sine", attack: 0.05, decay: 0.8, sustain: 0.3, release: 0.6, gain: 0.35 },
};

// ─── CHESS ENGINE ─────────────────────────────────────────────
function createInitialBoard() {
  const board = {};
  // White pieces
  board["a1"] = { type: "r", color: "w" }; board["b1"] = { type: "n", color: "w" };
  board["c1"] = { type: "b", color: "w" }; board["d1"] = { type: "q", color: "w" };
  board["e1"] = { type: "k", color: "w" }; board["f1"] = { type: "b", color: "w" };
  board["g1"] = { type: "n", color: "w" }; board["h1"] = { type: "r", color: "w" };
  for (let i = 0; i < 8; i++) board[FILES[i] + "2"] = { type: "p", color: "w" };
  // Black pieces
  board["a8"] = { type: "r", color: "b" }; board["b8"] = { type: "n", color: "b" };
  board["c8"] = { type: "b", color: "b" }; board["d8"] = { type: "q", color: "b" };
  board["e8"] = { type: "k", color: "b" }; board["f8"] = { type: "b", color: "b" };
  board["g8"] = { type: "n", color: "b" }; board["h8"] = { type: "r", color: "b" };
  for (let i = 0; i < 8; i++) board[FILES[i] + "7"] = { type: "p", color: "b" };
  return board;
}

function parseSquare(sq) {
  return { file: sq[0], rank: parseInt(sq[1]) };
}

function sqStr(file, rank) {
  return file + rank;
}

function isOnBoard(file, rank) {
  return FILES.includes(file) && rank >= 1 && rank <= 8;
}

function fileOffset(file, offset) {
  const idx = FILES.indexOf(file) + offset;
  return idx >= 0 && idx < 8 ? FILES[idx] : null;
}

function cloneBoard(board) {
  const newBoard = {};
  for (const sq in board) newBoard[sq] = { ...board[sq] };
  return newBoard;
}

function findKing(board, color) {
  for (const sq in board) {
    if (board[sq] && board[sq].type === "k" && board[sq].color === color) return sq;
  }
  return null;
}

function isSquareAttacked(board, square, byColor) {
  const { file, rank } = parseSquare(square);
  // Pawn attacks
  const pawnDir = byColor === "w" ? -1 : 1;
  for (const df of [-1, 1]) {
    const f = fileOffset(file, df);
    const r = rank + pawnDir;
    if (f && isOnBoard(f, r)) {
      const p = board[sqStr(f, r)];
      if (p && p.type === "p" && p.color === byColor) return true;
    }
  }
  // Knight attacks
  const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [df, dr] of knightMoves) {
    const f = fileOffset(file, df);
    const r = rank + dr;
    if (f && isOnBoard(f, r)) {
      const p = board[sqStr(f, r)];
      if (p && p.type === "n" && p.color === byColor) return true;
    }
  }
  // King attacks
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const f = fileOffset(file, df);
      const r = rank + dr;
      if (f && isOnBoard(f, r)) {
        const p = board[sqStr(f, r)];
        if (p && p.type === "k" && p.color === byColor) return true;
      }
    }
  }
  // Sliding pieces (bishop/rook/queen)
  const directions = [
    { df: 0, dr: 1, types: ["r", "q"] }, { df: 0, dr: -1, types: ["r", "q"] },
    { df: 1, dr: 0, types: ["r", "q"] }, { df: -1, dr: 0, types: ["r", "q"] },
    { df: 1, dr: 1, types: ["b", "q"] }, { df: 1, dr: -1, types: ["b", "q"] },
    { df: -1, dr: 1, types: ["b", "q"] }, { df: -1, dr: -1, types: ["b", "q"] },
  ];
  for (const { df, dr, types } of directions) {
    let f = file, r = rank;
    while (true) {
      f = fileOffset(f, df);
      r = r + dr;
      if (!f || !isOnBoard(f, r)) break;
      const p = board[sqStr(f, r)];
      if (p) {
        if (p.color === byColor && types.includes(p.type)) return true;
        break;
      }
    }
  }
  return false;
}

function isInCheck(board, color) {
  const kingSq = findKing(board, color);
  if (!kingSq) return false;
  return isSquareAttacked(board, kingSq, color === "w" ? "b" : "w");
}

function generatePseudoLegalMoves(board, color, enPassantTarget, castlingRights) {
  const moves = [];
  const dir = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 2 : 7;
  const promoRank = color === "w" ? 8 : 1;

  for (const sq in board) {
    const piece = board[sq];
    if (!piece || piece.color !== color) continue;
    const { file, rank } = parseSquare(sq);

    if (piece.type === "p") {
      // Forward
      const f1 = sqStr(file, rank + dir);
      if (!board[f1]) {
        if (rank + dir === promoRank) {
          for (const promo of ["q", "r", "b", "n"]) moves.push({ from: sq, to: f1, promotion: promo });
        } else {
          moves.push({ from: sq, to: f1 });
        }
        // Double push
        if (rank === startRank) {
          const f2 = sqStr(file, rank + 2 * dir);
          if (!board[f2]) moves.push({ from: sq, to: f2 });
        }
      }
      // Captures
      for (const df of [-1, 1]) {
        const cf = fileOffset(file, df);
        if (!cf) continue;
        const csq = sqStr(cf, rank + dir);
        if (board[csq] && board[csq].color !== color) {
          if (rank + dir === promoRank) {
            for (const promo of ["q", "r", "b", "n"]) moves.push({ from: sq, to: csq, promotion: promo });
          } else {
            moves.push({ from: sq, to: csq });
          }
        }
        // En passant
        if (enPassantTarget && csq === enPassantTarget) {
          moves.push({ from: sq, to: csq, enPassant: true });
        }
      }
    } else if (piece.type === "n") {
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [df, dr] of knightMoves) {
        const f = fileOffset(file, df), r = rank + dr;
        if (f && isOnBoard(f, r)) {
          const tsq = sqStr(f, r);
          if (!board[tsq] || board[tsq].color !== color) moves.push({ from: sq, to: tsq });
        }
      }
    } else if (piece.type === "k") {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df === 0 && dr === 0) continue;
          const f = fileOffset(file, df), r = rank + dr;
          if (f && isOnBoard(f, r)) {
            const tsq = sqStr(f, r);
            if (!board[tsq] || board[tsq].color !== color) moves.push({ from: sq, to: tsq });
          }
        }
      }
      // Castling
      const cr = castlingRights || {};
      const homeRank = color === "w" ? 1 : 8;
      const enemy = color === "w" ? "b" : "w";
      if (rank === homeRank && file === "e") {
        // Kingside
        if (cr[color + "K"] && !board[sqStr("f", homeRank)] && !board[sqStr("g", homeRank)]
          && board[sqStr("h", homeRank)]?.type === "r" && board[sqStr("h", homeRank)]?.color === color
          && !isSquareAttacked(board, sq, enemy)
          && !isSquareAttacked(board, sqStr("f", homeRank), enemy)
          && !isSquareAttacked(board, sqStr("g", homeRank), enemy)) {
          moves.push({ from: sq, to: sqStr("g", homeRank), castling: "K" });
        }
        // Queenside
        if (cr[color + "Q"] && !board[sqStr("d", homeRank)] && !board[sqStr("c", homeRank)] && !board[sqStr("b", homeRank)]
          && board[sqStr("a", homeRank)]?.type === "r" && board[sqStr("a", homeRank)]?.color === color
          && !isSquareAttacked(board, sq, enemy)
          && !isSquareAttacked(board, sqStr("d", homeRank), enemy)
          && !isSquareAttacked(board, sqStr("c", homeRank), enemy)) {
          moves.push({ from: sq, to: sqStr("c", homeRank), castling: "Q" });
        }
      }
    } else {
      // Sliding pieces
      const dirs = [];
      if (piece.type === "r" || piece.type === "q") dirs.push([0,1],[0,-1],[1,0],[-1,0]);
      if (piece.type === "b" || piece.type === "q") dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
      for (const [df, dr] of dirs) {
        let f = file, r = rank;
        while (true) {
          f = fileOffset(f, df); r = r + dr;
          if (!f || !isOnBoard(f, r)) break;
          const tsq = sqStr(f, r);
          if (board[tsq]) {
            if (board[tsq].color !== color) moves.push({ from: sq, to: tsq });
            break;
          }
          moves.push({ from: sq, to: tsq });
        }
      }
    }
  }
  return moves;
}

function makeMove(board, move) {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from];
  if (!piece) return newBoard;

  // Handle en passant capture
  if (move.enPassant) {
    const { file } = parseSquare(move.to);
    const capturedRank = piece.color === "w" ? parseInt(move.to[1]) - 1 : parseInt(move.to[1]) + 1;
    delete newBoard[sqStr(file, capturedRank)];
  }

  // Handle castling
  if (move.castling) {
    const rank = piece.color === "w" ? 1 : 8;
    if (move.castling === "K") {
      newBoard[sqStr("f", rank)] = newBoard[sqStr("h", rank)];
      delete newBoard[sqStr("h", rank)];
    } else {
      newBoard[sqStr("d", rank)] = newBoard[sqStr("a", rank)];
      delete newBoard[sqStr("a", rank)];
    }
  }

  // Move piece
  newBoard[move.to] = { ...piece };
  delete newBoard[move.from];

  // Handle promotion
  if (move.promotion) {
    newBoard[move.to].type = move.promotion;
  }

  return newBoard;
}

function getLegalMoves(board, color, enPassantTarget, castlingRights) {
  const pseudoMoves = generatePseudoLegalMoves(board, color, enPassantTarget, castlingRights);
  return pseudoMoves.filter(move => {
    const newBoard = makeMove(board, move);
    return !isInCheck(newBoard, color);
  });
}

// ─── GAME STATE ANALYSIS (for music) ─────────────────────────
function getMaterialBalance(board) {
  let white = 0, black = 0;
  for (const sq in board) {
    const p = board[sq];
    if (p.color === "w") white += PIECE_VALUES[p.type];
    else black += PIECE_VALUES[p.type];
  }
  return { white, black, balance: white - black };
}

function getTension(board, color) {
  // Tension = how many pieces are attacked + checks + material imbalance
  let tension = 0;
  const enemy = color === "w" ? "b" : "w";

  if (isInCheck(board, color)) tension += 5;

  for (const sq in board) {
    const p = board[sq];
    if (p && p.color === color) {
      if (isSquareAttacked(board, sq, enemy)) {
        tension += PIECE_VALUES[p.type];
      }
    }
  }
  return Math.min(tension, 20);
}

function getPieceCount(board) {
  let count = 0;
  for (const sq in board) count++;
  return count;
}

// ─── SIMPLE AI (Minimax with Alpha-Beta) ──────────────────────
function evaluateBoard(board) {
  let score = 0;
  const centerFiles = ["d", "e"];
  const centerRanks = [4, 5];

  for (const sq in board) {
    const p = board[sq];
    const { file, rank } = parseSquare(sq);
    const val = PIECE_VALUES[p.type];
    const sign = p.color === "w" ? 1 : -1;

    score += sign * val * 100;

    // Center control bonus
    if (centerFiles.includes(file) && centerRanks.includes(rank)) {
      score += sign * 10;
    }

    // Pawn advancement
    if (p.type === "p") {
      score += sign * (p.color === "w" ? rank - 2 : 7 - rank) * 5;
    }

    // King safety (prefer castled position)
    if (p.type === "k") {
      const homeRank = p.color === "w" ? 1 : 8;
      if (rank === homeRank && (file === "g" || file === "c")) score += sign * 30;
    }
  }
  return score;
}

function minimax(board, depth, alpha, beta, maximizing, color, enPassant, castling) {
  if (depth === 0) return { score: evaluateBoard(board), move: null };

  const currentColor = maximizing ? "w" : "b";
  const moves = getLegalMoves(board, currentColor, enPassant, castling);

  if (moves.length === 0) {
    if (isInCheck(board, currentColor)) {
      return { score: maximizing ? -99999 : 99999, move: null };
    }
    return { score: 0, move: null }; // stalemate
  }

  // Sort moves for better pruning (captures first)
  moves.sort((a, b) => {
    const aCapture = board[a.to] ? PIECE_VALUES[board[a.to].type] : 0;
    const bCapture = board[b.to] ? PIECE_VALUES[board[b.to].type] : 0;
    return bCapture - aCapture;
  });

  let bestMove = moves[0];

  if (maximizing) {
    let maxScore = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEP = board[move.from]?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2)
        : null;
      const { score } = minimax(newBoard, depth - 1, alpha, beta, false, color, newEP, castling);
      if (score > maxScore) { maxScore = score; bestMove = move; }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      const newEP = board[move.from]?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2)
        : null;
      const { score } = minimax(newBoard, depth - 1, alpha, beta, true, color, newEP, castling);
      if (score < minScore) { minScore = score; bestMove = move; }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return { score: minScore, move: bestMove };
  }
}

function getAIMove(board, enPassant, castling) {
  const pieceCount = getPieceCount(board);
  const depth = pieceCount < 10 ? 4 : pieceCount < 20 ? 3 : 3;
  const result = minimax(board, depth, -Infinity, Infinity, false, "b", enPassant, castling);
  return result.move;
}

// ─── PGN PARSER ───────────────────────────────────────────────
function parsePGN(pgn) {
  // Strip headers
  let moveText = pgn.replace(/\[.*?\]\s*/g, "").trim();
  // Strip comments and variations
  moveText = moveText.replace(/\{[^}]*\}/g, "").replace(/\([^)]*\)/g, "");
  // Strip result
  moveText = moveText.replace(/\s*(1-0|0-1|1\/2-1\/2|\*)?\s*$/, "");
  // Extract individual moves
  const tokens = moveText.split(/\s+/).filter(t => !t.match(/^\d+\.+$/));
  return tokens;
}

function sanToMove(san, board, color, enPassant, castling) {
  const legalMoves = getLegalMoves(board, color, enPassant, castling);
  let cleanSan = san.replace(/[+#!?]+$/, "");

  // Castling
  if (cleanSan === "O-O" || cleanSan === "0-0") {
    return legalMoves.find(m => m.castling === "K");
  }
  if (cleanSan === "O-O-O" || cleanSan === "0-0-0") {
    return legalMoves.find(m => m.castling === "Q");
  }

  let promotion = null;
  if (cleanSan.includes("=")) {
    promotion = cleanSan.split("=")[1].toLowerCase();
    cleanSan = cleanSan.split("=")[0];
  }

  const isCapture = cleanSan.includes("x");
  cleanSan = cleanSan.replace("x", "");

  let pieceType, toFile, toRank, disambigFile, disambigRank;

  if (cleanSan[0] >= "A" && cleanSan[0] <= "Z") {
    pieceType = cleanSan[0].toLowerCase();
    if (pieceType === "o") pieceType = "k"; // shouldn't happen but safety
    cleanSan = cleanSan.slice(1);
  } else {
    pieceType = "p";
  }

  // Target square is always the last two characters
  toFile = cleanSan[cleanSan.length - 2];
  toRank = parseInt(cleanSan[cleanSan.length - 1]);
  const disambig = cleanSan.slice(0, cleanSan.length - 2);

  if (disambig.length >= 1) {
    if (disambig[0] >= "a" && disambig[0] <= "h") disambigFile = disambig[0];
    else if (disambig[0] >= "1" && disambig[0] <= "8") disambigRank = parseInt(disambig[0]);
  }
  if (disambig.length >= 2) {
    disambigRank = parseInt(disambig[1]);
  }

  const target = sqStr(toFile, toRank);

  return legalMoves.find(m => {
    const piece = board[m.from];
    if (!piece || piece.type !== pieceType) return false;
    if (m.to !== target) return false;
    if (promotion && m.promotion !== promotion) return false;
    if (disambigFile && m.from[0] !== disambigFile) return false;
    if (disambigRank && parseInt(m.from[1]) !== disambigRank) return false;
    return true;
  });
}

// ─── AUDIO ENGINE ─────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNodes = [];
    this.isInitialized = false;
    this.currentTension = 0;
    this.ambientInterval = null;
  }

  init() {
    if (this.isInitialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    // Create reverb convolver
    this.reverb = this.ctx.createConvolver();
    const rate = this.ctx.sampleRate;
    const length = rate * 2;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    this.reverb.buffer = impulse;
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.15;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    this.isInitialized = true;
  }

  playNote(freq, pieceType, duration = 0.5, pan = 0) {
    if (!this.isInitialized) return;
    const t = this.ctx.currentTime;
    const audio = PIECE_AUDIO[pieceType];

    const osc = this.ctx.createOscillator();
    osc.type = audio.wave;
    osc.frequency.value = freq;

    // Add slight vibrato for king
    if (pieceType === "k") {
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      vibrato.frequency.value = 5;
      vibratoGain.gain.value = 3;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start(t);
      vibrato.stop(t + duration + audio.release);
    }

    // For queen, add a second oscillator at a fifth above
    let osc2 = null;
    if (pieceType === "q") {
      osc2 = this.ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = freq * 1.5;
    }

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(audio.gain, t + audio.attack);
    env.gain.linearRampToValueAtTime(audio.gain * audio.sustain, t + audio.attack + audio.decay);
    env.gain.linearRampToValueAtTime(0, t + duration + audio.release);

    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;

    osc.connect(env);
    if (osc2) osc2.connect(env);
    env.connect(panner);
    panner.connect(this.masterGain);
    panner.connect(this.reverb);

    osc.start(t);
    osc.stop(t + duration + audio.release + 0.1);
    if (osc2) {
      osc2.start(t);
      osc2.stop(t + duration + audio.release + 0.1);
    }
  }

  playMove(fromSq, toSq, pieceType, isCapture = false, isCastling = false, isCheck = false) {
    if (!this.isInitialized) return;
    const { file: ff, rank: fr } = parseSquare(fromSq);
    const { file: tf, rank: tr } = parseSquare(toSq);

    const fromFreq = squareToFreq(ff, fr);
    const toFreq = squareToFreq(tf, tr);
    const pan = (FILES.indexOf(tf) - 3.5) / 3.5; // -1 to 1

    // Play departure note (quick)
    this.playNote(fromFreq, pieceType, 0.15, pan * 0.5);

    // Play arrival note (sustained)
    setTimeout(() => {
      this.playNote(toFreq, pieceType, 0.4, pan);
    }, 150);

    // Capture: play dissonant descending tone
    if (isCapture) {
      setTimeout(() => {
        this.playCaptureSound(toFreq);
      }, 100);
    }

    // Castling: play harmonic resolution
    if (isCastling) {
      setTimeout(() => {
        this.playCastlingSound(toFreq);
      }, 200);
    }

    // Check: sharp dissonant interval
    if (isCheck) {
      setTimeout(() => {
        this.playCheckSound(toFreq);
      }, 300);
    }
  }

  playCaptureSound(baseFreq) {
    if (!this.isInitialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(baseFreq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.25, t + 0.6);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    // Add noise burst
    const bufferSize = this.ctx.sampleRate * 0.1;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(env);
    env.connect(this.masterGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.7);
    noise.start(t);
    noise.stop(t + 0.15);
  }

  playCastlingSound(baseFreq) {
    if (!this.isInitialized) return;
    const t = this.ctx.currentTime;
    // Perfect fifth resolution
    [1, 1.5, 2].forEach((ratio, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq * ratio;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t + i * 0.1);
      env.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.05);
      env.gain.linearRampToValueAtTime(0, t + i * 0.1 + 0.6);
      osc.connect(env);
      env.connect(this.masterGain);
      env.connect(this.reverb);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.7);
    });
  }

  playCheckSound(baseFreq) {
    if (!this.isInitialized) return;
    const t = this.ctx.currentTime;
    // Tritone interval - most dissonant
    [1, Math.sqrt(2)].forEach((ratio) => {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = baseFreq * ratio;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.15, t);
      env.gain.linearRampToValueAtTime(0, t + 0.4);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playCheckmateSound() {
    if (!this.isInitialized) return;
    const t = this.ctx.currentTime;
    // Dramatic descending cadence
    const notes = [523.25, 493.88, 440, 392, 349.23, 329.63, 293.66, 261.63];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i < 4 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0, t + i * 0.15);
      env.gain.linearRampToValueAtTime(0.2, t + i * 0.15 + 0.05);
      env.gain.linearRampToValueAtTime(0.05, t + i * 0.15 + 0.3);
      env.gain.linearRampToValueAtTime(0, t + (i + 1) * 0.15 + 0.5);
      osc.connect(env);
      env.connect(this.masterGain);
      env.connect(this.reverb);
      osc.start(t + i * 0.15);
      osc.stop(t + (i + 1) * 0.15 + 0.6);
    });
  }

  // ─── AMBIENT SYSTEM ────────────────────────────────────
  startAmbient(tension = 0, materialBalance = 0, pieceCount = 32) {
    if (!this.isInitialized) return;
    this.currentTension = tension;
    this.stopAmbient();

    const baseFreq = materialBalance >= 0 ? 130.81 : 123.47; // C3 major vs B2 minor feel

    const playAmbientNote = () => {
      if (!this.isInitialized) return;
      const t = this.ctx.currentTime;
      const tensionFactor = this.currentTension / 20;

      // Base drone
      const drone = this.ctx.createOscillator();
      drone.type = "sine";
      drone.frequency.value = baseFreq * (1 + tensionFactor * 0.05);
      const droneEnv = this.ctx.createGain();
      const droneVol = 0.04 + tensionFactor * 0.04;
      droneEnv.gain.setValueAtTime(droneVol, t);
      droneEnv.gain.linearRampToValueAtTime(droneVol * 0.7, t + 2);
      droneEnv.gain.linearRampToValueAtTime(0, t + 3.5);
      drone.connect(droneEnv);
      droneEnv.connect(this.masterGain);
      droneEnv.connect(this.reverb);
      drone.start(t);
      drone.stop(t + 4);

      // Tension adds higher dissonant harmonics
      if (tensionFactor > 0.3) {
        const tensionOsc = this.ctx.createOscillator();
        tensionOsc.type = "triangle";
        tensionOsc.frequency.value = baseFreq * (2 + tensionFactor);
        const tensionEnv = this.ctx.createGain();
        tensionEnv.gain.setValueAtTime(0, t);
        tensionEnv.gain.linearRampToValueAtTime(tensionFactor * 0.03, t + 0.5);
        tensionEnv.gain.linearRampToValueAtTime(0, t + 2.5);
        tensionOsc.connect(tensionEnv);
        tensionEnv.connect(this.masterGain);
        tensionEnv.connect(this.reverb);
        tensionOsc.start(t);
        tensionOsc.stop(t + 3);
      }

      // Sparse notes in endgame
      if (pieceCount < 12 && Math.random() > 0.5) {
        const sparkle = this.ctx.createOscillator();
        sparkle.type = "sine";
        sparkle.frequency.value = baseFreq * (4 + Math.random() * 4);
        const sparkleEnv = this.ctx.createGain();
        sparkleEnv.gain.setValueAtTime(0, t + 0.5);
        sparkleEnv.gain.linearRampToValueAtTime(0.03, t + 0.7);
        sparkleEnv.gain.linearRampToValueAtTime(0, t + 2);
        sparkle.connect(sparkleEnv);
        sparkleEnv.connect(this.reverb);
        sparkle.start(t + 0.5);
        sparkle.stop(t + 2.5);
      }
    };

    playAmbientNote();
    const interval = Math.max(1500, 4000 - tension * 150);
    this.ambientInterval = setInterval(playAmbientNote, interval);
  }

  updateTension(tension) {
    this.currentTension = tension;
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  setVolume(vol) {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }

  destroy() {
    this.stopAmbient();
    if (this.ctx) this.ctx.close();
    this.isInitialized = false;
  }
}

// ─── SAMPLE GAMES ─────────────────────────────────────────────
const SAMPLE_GAMES = {
  "Immortal Game (1851)": `1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#`,
  "Opera Game (1858)": `1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#`,
  "Scholar's Mate": `1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#`,
};

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function ChessTones() {
  const [board, setBoard] = useState(createInitialBoard());
  const [turn, setTurn] = useState("w");
  const [selected, setSelected] = useState(null);
  const [legalSquares, setLegalSquares] = useState([]);
  const [enPassant, setEnPassant] = useState(null);
  const [castling, setCastling] = useState({ wK: true, wQ: true, bK: true, bQ: true });
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState("playing"); // playing, check, checkmate, stalemate
  const [lastMove, setLastMove] = useState(null);
  const [mode, setMode] = useState("play"); // play, replay
  const [replayMoves, setReplayMoves] = useState([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [pgnInput, setPgnInput] = useState("");
  const [audioStarted, setAudioStarted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [tension, setTension] = useState(0);
  const [showPromotion, setShowPromotion] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [squarePulse, setSquarePulse] = useState({});
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [capturedPieces, setCapturedPieces] = useState({ w: [], b: [] });
  const [moveNotation, setMoveNotation] = useState([]);

  const audioRef = useRef(null);
  const replayTimerRef = useRef(null);

  // Initialize audio engine
  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => {
      if (audioRef.current) audioRef.current.destroy();
    };
  }, []);

  const startAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.init();
      audioRef.current.setVolume(volume);
      audioRef.current.startAmbient(0, 0, 32);
      setAudioStarted(true);
    }
  }, [volume]);

  // Update ambient music when board state changes
  useEffect(() => {
    if (!audioStarted || !audioRef.current) return;
    const mat = getMaterialBalance(board);
    const t = getTension(board, turn);
    const pc = getPieceCount(board);
    setTension(t);
    audioRef.current.updateTension(t);

    // Restart ambient with updated parameters periodically
    const restartTimer = setTimeout(() => {
      if (audioRef.current?.isInitialized) {
        audioRef.current.startAmbient(t, mat.balance, pc);
      }
    }, 500);
    return () => clearTimeout(restartTimer);
  }, [board, turn, audioStarted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.setVolume(volume);
  }, [volume]);

  // Generate SAN notation for a move
  function moveToSAN(board, move) {
    const piece = board[move.from];
    if (!piece) return "";
    if (move.castling === "K") return "O-O";
    if (move.castling === "Q") return "O-O-O";

    let san = "";
    if (piece.type !== "p") san += piece.type.toUpperCase();

    const isCapture = !!board[move.to] || move.enPassant;
    if (piece.type === "p" && isCapture) san += move.from[0];

    if (isCapture) san += "x";
    san += move.to;
    if (move.promotion) san += "=" + move.promotion.toUpperCase();

    // Check detection on resulting board
    const newBoard = makeMove(board, move);
    const enemy = piece.color === "w" ? "b" : "w";
    if (isInCheck(newBoard, enemy)) {
      const enemyMoves = getLegalMoves(newBoard, enemy, null, castling);
      san += enemyMoves.length === 0 ? "#" : "+";
    }

    return san;
  }

  // Execute a move
  const executeMove = useCallback((move) => {
    const piece = board[move.from];
    if (!piece) return;

    const captured = board[move.to];
    const isCapture = !!captured || move.enPassant;
    const newBoard = makeMove(board, move);
    const enemy = piece.color === "w" ? "b" : "w";
    const inCheck = isInCheck(newBoard, enemy);

    // Play sounds
    if (audioRef.current?.isInitialized) {
      audioRef.current.playMove(move.from, move.to, piece.type, isCapture, !!move.castling, inCheck);
    }

    // Update castling rights
    const newCastling = { ...castling };
    if (piece.type === "k") {
      newCastling[piece.color + "K"] = false;
      newCastling[piece.color + "Q"] = false;
    }
    if (piece.type === "r") {
      if (move.from === "a1") newCastling.wQ = false;
      if (move.from === "h1") newCastling.wK = false;
      if (move.from === "a8") newCastling.bQ = false;
      if (move.from === "h8") newCastling.bK = false;
    }

    // En passant target
    let newEP = null;
    if (piece.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2) {
      newEP = sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2);
    }

    // Update captured pieces
    if (captured) {
      setCapturedPieces(prev => ({
        ...prev,
        [captured.color]: [...prev[captured.color], captured.type]
      }));
    }
    if (move.enPassant) {
      setCapturedPieces(prev => ({
        ...prev,
        [enemy === "w" ? "b" : "w"]: [...prev[enemy === "w" ? "b" : "w"], "p"]
      }));
    }

    // SAN notation
    const san = moveToSAN(board, move);
    setMoveNotation(prev => [...prev, san]);

    // Visual pulse
    setSquarePulse({ [move.from]: "departure", [move.to]: "arrival" });
    setTimeout(() => setSquarePulse({}), 600);

    setBoard(newBoard);
    setCastling(newCastling);
    setEnPassant(newEP);
    setLastMove(move);
    setMoveHistory(prev => [...prev, { move, board: newBoard }]);
    setSelected(null);
    setLegalSquares([]);

    // Check game status
    const enemyMoves = getLegalMoves(newBoard, enemy, newEP, newCastling);
    if (enemyMoves.length === 0) {
      if (inCheck) {
        setGameStatus("checkmate");
        if (audioRef.current?.isInitialized) audioRef.current.playCheckmateSound();
      } else {
        setGameStatus("stalemate");
      }
    } else if (inCheck) {
      setGameStatus("check");
    } else {
      setGameStatus("playing");
    }

    setTurn(enemy);
  }, [board, castling]);

  // Handle square click
  const handleSquareClick = useCallback((sq) => {
    if (mode === "replay" || gameStatus === "checkmate" || gameStatus === "stalemate" || aiThinking) return;
    if (turn !== "w") return; // Player is always white in play mode

    if (selected) {
      // Try to make a move
      const move = legalSquares.find(m => m.to === sq);
      if (move) {
        if (move.promotion) {
          setShowPromotion(move);
          return;
        }
        executeMove(move);
        return;
      }
    }

    // Select a piece
    const piece = board[sq];
    if (piece && piece.color === turn) {
      setSelected(sq);
      const moves = getLegalMoves(board, turn, enPassant, castling).filter(m => m.from === sq);
      setLegalSquares(moves);

      // Play a soft preview tone
      if (audioRef.current?.isInitialized) {
        const { file, rank } = parseSquare(sq);
        const freq = squareToFreq(file, rank);
        audioRef.current.playNote(freq, piece.type, 0.1, 0);
      }
    } else {
      setSelected(null);
      setLegalSquares([]);
    }
  }, [selected, legalSquares, board, turn, enPassant, castling, mode, gameStatus, aiThinking, executeMove]);

  // Promotion handler
  const handlePromotion = useCallback((promoType) => {
    if (showPromotion) {
      executeMove({ ...showPromotion, promotion: promoType });
      setShowPromotion(null);
    }
  }, [showPromotion, executeMove]);

  // AI move
  useEffect(() => {
    if (mode !== "play" || turn !== "b" || gameStatus !== "playing" && gameStatus !== "check" || aiThinking) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      const aiMove = getAIMove(board, enPassant, castling);
      if (aiMove) {
        executeMove(aiMove);
      }
      setAiThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [turn, mode, gameStatus]);

  // ─── REPLAY MODE ────────────────────────────────────────
  const loadPGN = useCallback((pgn) => {
    const sanMoves = parsePGN(pgn);
    let currentBoard = createInitialBoard();
    let currentColor = "w";
    let currentEP = null;
    let currentCastling = { wK: true, wQ: true, bK: true, bQ: true };
    const movesResolved = [];

    for (const san of sanMoves) {
      const move = sanToMove(san, currentBoard, currentColor, currentEP, currentCastling);
      if (!move) {
        console.warn("Failed to parse move:", san);
        break;
      }
      movesResolved.push({ san, move, boardBefore: currentBoard });

      // Update state
      const piece = currentBoard[move.from];
      currentBoard = makeMove(currentBoard, move);
      if (piece?.type === "k") {
        currentCastling[currentColor + "K"] = false;
        currentCastling[currentColor + "Q"] = false;
      }
      if (piece?.type === "r") {
        if (move.from === "a1") currentCastling.wQ = false;
        if (move.from === "h1") currentCastling.wK = false;
        if (move.from === "a8") currentCastling.bQ = false;
        if (move.from === "h8") currentCastling.bK = false;
      }
      currentEP = piece?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2) : null;
      currentColor = currentColor === "w" ? "b" : "w";
    }

    setReplayMoves(movesResolved);
    setReplayIndex(0);
    setBoard(createInitialBoard());
    setMoveNotation([]);
    setCapturedPieces({ w: [], b: [] });
    setLastMove(null);
    setTurn("w");
    setGameStatus("playing");
    setMode("replay");
    setIsReplaying(false);
  }, []);

  const stepReplay = useCallback((idx) => {
    if (idx < 0 || idx > replayMoves.length) return;

    // Rebuild board up to idx
    let currentBoard = createInitialBoard();
    let currentCastling = { wK: true, wQ: true, bK: true, bQ: true };
    let currentEP = null;
    const notations = [];
    const caps = { w: [], b: [] };

    for (let i = 0; i < idx; i++) {
      const { move } = replayMoves[i];
      const piece = currentBoard[move.from];
      const captured = currentBoard[move.to];

      notations.push(replayMoves[i].san);
      if (captured) caps[captured.color].push(captured.type);

      // Play sound for the most recent move
      if (i === idx - 1 && audioRef.current?.isInitialized) {
        const inCheck = false; // simplified
        audioRef.current.playMove(move.from, move.to, piece?.type || "p", !!captured, !!move.castling, inCheck);
      }

      currentBoard = makeMove(currentBoard, move);
      if (piece?.type === "k") { currentCastling[piece.color + "K"] = false; currentCastling[piece.color + "Q"] = false; }
      if (piece?.type === "r") {
        if (move.from === "a1") currentCastling.wQ = false;
        if (move.from === "h1") currentCastling.wK = false;
        if (move.from === "a8") currentCastling.bQ = false;
        if (move.from === "h8") currentCastling.bK = false;
      }
      currentEP = piece?.type === "p" && Math.abs(parseInt(move.to[1]) - parseInt(move.from[1])) === 2
        ? sqStr(move.from[0], (parseInt(move.from[1]) + parseInt(move.to[1])) / 2) : null;
    }

    setBoard(currentBoard);
    setReplayIndex(idx);
    setMoveNotation(notations);
    setCapturedPieces(caps);
    setLastMove(idx > 0 ? replayMoves[idx - 1].move : null);
    setTurn(idx % 2 === 0 ? "w" : "b");
    setCastling(currentCastling);
    setEnPassant(currentEP);

    setSquarePulse(idx > 0 ? { [replayMoves[idx - 1].move.from]: "departure", [replayMoves[idx - 1].move.to]: "arrival" } : {});
    setTimeout(() => setSquarePulse({}), 600);
  }, [replayMoves]);

  const toggleAutoReplay = useCallback(() => {
    if (isReplaying) {
      clearInterval(replayTimerRef.current);
      setIsReplaying(false);
    } else {
      setIsReplaying(true);
      let idx = replayIndex;
      replayTimerRef.current = setInterval(() => {
        idx++;
        if (idx > replayMoves.length) {
          clearInterval(replayTimerRef.current);
          setIsReplaying(false);
          return;
        }
        stepReplay(idx);
      }, 1500);
    }
  }, [isReplaying, replayIndex, replayMoves, stepReplay]);

  useEffect(() => {
    return () => { if (replayTimerRef.current) clearInterval(replayTimerRef.current); };
  }, []);

  // New game
  const newGame = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn("w");
    setSelected(null);
    setLegalSquares([]);
    setEnPassant(null);
    setCastling({ wK: true, wQ: true, bK: true, bQ: true });
    setMoveHistory([]);
    setGameStatus("playing");
    setLastMove(null);
    setMode("play");
    setReplayMoves([]);
    setReplayIndex(0);
    setIsReplaying(false);
    setCapturedPieces({ w: [], b: [] });
    setMoveNotation([]);
    if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    if (audioRef.current?.isInitialized) audioRef.current.startAmbient(0, 0, 32);
  }, []);

  // ─── RENDER ─────────────────────────────────────────────
  const ranks = boardFlipped ? [...RANKS] : [...RANKS].reverse();
  const files = boardFlipped ? [...FILES].reverse() : [...FILES];

  const tensionColor = useMemo(() => {
    const t = tension / 20;
    const r = Math.round(40 + t * 80);
    const g = Math.round(35 - t * 20);
    const b = Math.round(55 - t * 30);
    return `rgb(${r}, ${g}, ${b})`;
  }, [tension]);

  const materialDiff = useMemo(() => getMaterialBalance(board), [board]);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${tensionColor} 0%, #0a0a12 40%, #0f0f1a 100%)`,
      color: "#e0e0e0",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      transition: "background 1s ease",
    }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{
          fontSize: 36, fontWeight: 300, letterSpacing: 8,
          background: "linear-gradient(90deg, #c9a84c, #f0d878, #c9a84c)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          margin: 0, textTransform: "uppercase"
        }}>
          ♔ ChessTones ♕
        </h1>
        <p style={{ fontSize: 13, color: "#888", letterSpacing: 3, margin: "4px 0 0" }}>
          WHERE EVERY MOVE IS MUSIC
        </p>
      </div>

      {/* Audio start overlay */}
      {!audioStarted && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, flexDirection: "column", gap: 20,
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: 4, color: "#c9a84c" }}>♔ ChessTones</h2>
          <p style={{ color: "#aaa", fontSize: 14, maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
            Experience chess as a living musical composition. Every piece, every move, every moment of tension
            becomes part of the soundtrack.
          </p>
          <button onClick={startAudio} style={{
            padding: "14px 40px", fontSize: 16, background: "linear-gradient(135deg, #c9a84c, #a07830)",
            border: "none", color: "#fff", borderRadius: 8, cursor: "pointer", letterSpacing: 2,
            fontWeight: 300, transition: "all 0.3s",
          }}>
            ▶ BEGIN
          </button>
        </div>
      )}

      {/* Mode tabs & controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 15, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={newGame} style={tabStyle(mode === "play")}>
          ♟ Play vs AI
        </button>
        <button onClick={() => setMode(mode === "replay" ? "play" : "replay")} style={tabStyle(mode === "replay")}>
          📼 Replay
        </button>
        <button onClick={() => setBoardFlipped(!boardFlipped)} style={smallBtnStyle}>
          🔄 Flip
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#888" }}>🔊</span>
          <input type="range" min="0" max="1" step="0.05" value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ width: 80, accentColor: "#c9a84c" }} />
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        marginBottom: 12, padding: "6px 20px", borderRadius: 20,
        background: gameStatus === "checkmate" ? "rgba(200,50,50,0.3)"
          : gameStatus === "check" ? "rgba(200,150,50,0.3)"
          : gameStatus === "stalemate" ? "rgba(100,100,100,0.3)"
          : "rgba(60,60,80,0.3)",
        fontSize: 13, letterSpacing: 1, textAlign: "center",
        border: `1px solid ${gameStatus === "check" ? "#c9a84c44" : "#ffffff10"}`,
        transition: "all 0.5s",
      }}>
        {gameStatus === "checkmate" ? `♚ CHECKMATE — ${turn === "w" ? "Black" : "White"} wins!`
          : gameStatus === "stalemate" ? "½ STALEMATE — Draw"
          : gameStatus === "check" ? `⚠ ${turn === "w" ? "White" : "Black"} is in CHECK`
          : aiThinking ? "🤔 AI is thinking..."
          : mode === "replay" ? `📼 Replay — Move ${replayIndex}/${replayMoves.length}`
          : `${turn === "w" ? "White" : "Black"} to move`}
        {mode === "play" && <span style={{ marginLeft: 12, color: "#888", fontSize: 11 }}>
          Material: W{materialDiff.white} / B{materialDiff.black}
        </span>}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Captured pieces & board */}
        <div>
          {/* Captured by black (shown on top) */}
          <div style={{ height: 28, marginBottom: 4, display: "flex", gap: 2, justifyContent: "center" }}>
            {capturedPieces.w.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]).map((t, i) => (
              <span key={i} style={{ fontSize: 18, opacity: 0.6 }}>{PIECE_SYMBOLS["w" + t]}</span>
            ))}
          </div>

          {/* Board */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(8, 60px)", gridTemplateRows: "repeat(8, 60px)",
            border: "2px solid #c9a84c44", borderRadius: 4, overflow: "hidden",
            boxShadow: `0 0 ${20 + tension * 3}px rgba(201,168,76,${0.1 + tension * 0.02})`,
            transition: "box-shadow 1s ease",
          }}>
            {ranks.map(rank => files.map(file => {
              const sq = sqStr(file, rank);
              const piece = board[sq];
              const isLight = (FILES.indexOf(file) + rank) % 2 === 1;
              const isSelected = selected === sq;
              const isLegalTarget = legalSquares.some(m => m.to === sq);
              const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const pulse = squarePulse[sq];

              // Dynamic square color based on tension
              let bgColor;
              if (isSelected) {
                bgColor = "#c9a84c88";
              } else if (isLastMoveSquare) {
                bgColor = isLight ? "#b8c96c55" : "#8aa84c55";
              } else if (pulse === "arrival") {
                bgColor = "#c9a84caa";
              } else if (pulse === "departure") {
                bgColor = "#c9a84c44";
              } else {
                const tensionShift = tension / 20;
                if (isLight) {
                  bgColor = `rgb(${180 + tensionShift * 30}, ${170 - tensionShift * 30}, ${150 - tensionShift * 40})`;
                } else {
                  bgColor = `rgb(${80 + tensionShift * 40}, ${60 - tensionShift * 20}, ${70 - tensionShift * 20})`;
                }
              }

              // Piece tension glow
              let pieceGlow = "none";
              if (piece && audioStarted) {
                const enemy = piece.color === "w" ? "b" : "w";
                if (isSquareAttacked(board, sq, enemy)) {
                  pieceGlow = piece.type === "k"
                    ? "0 0 15px rgba(255,50,50,0.8)"
                    : "0 0 8px rgba(255,150,50,0.5)";
                }
              }

              return (
                <div key={sq} onClick={() => handleSquareClick(sq)} style={{
                  width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center",
                  background: bgColor, cursor: mode === "play" ? "pointer" : "default",
                  position: "relative", transition: "background 0.3s ease",
                  animation: pulse ? "pulse 0.6s ease" : undefined,
                }}>
                  {/* Legal move indicator */}
                  {isLegalTarget && (
                    <div style={{
                      position: "absolute",
                      width: board[sq] ? 54 : 18,
                      height: board[sq] ? 54 : 18,
                      borderRadius: "50%",
                      background: board[sq] ? "transparent" : "rgba(201,168,76,0.4)",
                      border: board[sq] ? "3px solid rgba(201,168,76,0.5)" : "none",
                    }} />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span style={{
                      fontSize: 40, lineHeight: 1, userSelect: "none",
                      textShadow: pieceGlow,
                      filter: isSelected ? "brightness(1.3)" : "none",
                      transition: "all 0.3s",
                      cursor: mode === "play" && piece.color === turn ? "grab" : "default",
                    }}>
                      {PIECE_SYMBOLS[piece.color + piece.type]}
                    </span>
                  )}

                  {/* Square label */}
                  {((rank === (boardFlipped ? 8 : 1) && file === (boardFlipped ? "h" : "a")) ||
                    (rank === (boardFlipped ? 8 : 1)) || (file === (boardFlipped ? "h" : "a"))) && (
                    <span style={{
                      position: "absolute", fontSize: 9, color: isLight ? "#66605090" : "#aa9a8090",
                      bottom: rank === (boardFlipped ? 8 : 1) ? 1 : undefined,
                      right: rank === (boardFlipped ? 8 : 1) ? 2 : undefined,
                      left: file === (boardFlipped ? "h" : "a") ? 2 : undefined,
                      top: file === (boardFlipped ? "h" : "a") ? 1 : undefined,
                    }}>
                      {rank === (boardFlipped ? 8 : 1) ? file : ""}
                      {file === (boardFlipped ? "h" : "a") ? rank : ""}
                    </span>
                  )}

                  {/* Musical note label */}
                  {isLastMoveSquare && lastMove.to === sq && (
                    <span style={{
                      position: "absolute", top: 1, right: 2, fontSize: 8,
                      color: "#c9a84c", opacity: 0.7, fontFamily: "monospace",
                    }}>
                      {squareToNote(file, rank)}
                    </span>
                  )}
                </div>
              );
            }))}
          </div>

          {/* Captured by white (shown below) */}
          <div style={{ height: 28, marginTop: 4, display: "flex", gap: 2, justifyContent: "center" }}>
            {capturedPieces.b.sort((a, b) => PIECE_VALUES[b] - PIECE_VALUES[a]).map((t, i) => (
              <span key={i} style={{ fontSize: 18, opacity: 0.6 }}>{PIECE_SYMBOLS["b" + t]}</span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Tension meter */}
          <div style={{
            background: "rgba(30,30,45,0.6)", borderRadius: 8, padding: 12,
            border: "1px solid #ffffff08",
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6, letterSpacing: 1 }}>TENSION</div>
            <div style={{
              height: 6, background: "#1a1a2a", borderRadius: 3, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${(tension / 20) * 100}%`,
                background: tension > 12 ? "linear-gradient(90deg, #c9a84c, #e04040)"
                  : tension > 6 ? "linear-gradient(90deg, #4c8ac9, #c9a84c)"
                  : "linear-gradient(90deg, #4cc94c, #4c8ac9)",
                transition: "width 0.5s, background 0.5s",
                borderRadius: 3,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#666" }}>
              <span>Calm</span><span>Intense</span>
            </div>
          </div>

          {/* Musical mapping info */}
          <div style={{
            background: "rgba(30,30,45,0.6)", borderRadius: 8, padding: 12,
            border: "1px solid #ffffff08", fontSize: 11, color: "#999",
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>PIECE VOICES</div>
            {Object.entries(PIECE_AUDIO).map(([type, audio]) => (
              <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span>{PIECE_SYMBOLS["w" + type]} {type.toUpperCase()}</span>
                <span style={{ color: "#666" }}>{audio.wave}</span>
              </div>
            ))}
          </div>

          {/* Move history */}
          <div style={{
            background: "rgba(30,30,45,0.6)", borderRadius: 8, padding: 12,
            border: "1px solid #ffffff08", maxHeight: 200, overflowY: "auto",
          }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>MOVES</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
              {moveNotation.reduce((acc, san, i) => {
                if (i % 2 === 0) {
                  acc.push({ num: Math.floor(i / 2) + 1, white: san, black: "" });
                } else {
                  acc[acc.length - 1].black = san;
                }
                return acc;
              }, []).map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span style={{ color: "#555", width: 24 }}>{row.num}.</span>
                  <span style={{ width: 52, color: "#ccc" }}>{row.white}</span>
                  <span style={{ color: "#aaa" }}>{row.black}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Replay controls */}
          {mode === "replay" && (
            <div style={{
              background: "rgba(30,30,45,0.6)", borderRadius: 8, padding: 12,
              border: "1px solid #ffffff08",
            }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>REPLAY</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8 }}>
                <button onClick={() => stepReplay(0)} style={smallBtnStyle}>⏮</button>
                <button onClick={() => stepReplay(Math.max(0, replayIndex - 1))} style={smallBtnStyle}>◀</button>
                <button onClick={toggleAutoReplay} style={smallBtnStyle}>{isReplaying ? "⏸" : "▶"}</button>
                <button onClick={() => stepReplay(Math.min(replayMoves.length, replayIndex + 1))} style={smallBtnStyle}>▶</button>
                <button onClick={() => stepReplay(replayMoves.length)} style={smallBtnStyle}>⏭</button>
              </div>
              <input type="range" min={0} max={replayMoves.length} value={replayIndex}
                onChange={e => stepReplay(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#c9a84c" }} />
            </div>
          )}

          {/* PGN import */}
          {mode === "replay" && (
            <div style={{
              background: "rgba(30,30,45,0.6)", borderRadius: 8, padding: 12,
              border: "1px solid #ffffff08",
            }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8, letterSpacing: 1 }}>LOAD GAME</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(SAMPLE_GAMES).map(([name, pgn]) => (
                  <button key={name} onClick={() => loadPGN(pgn)} style={{
                    ...smallBtnStyle, width: "100%", fontSize: 11, padding: "6px 8px",
                    textAlign: "left",
                  }}>
                    🎵 {name}
                  </button>
                ))}
              </div>
              <textarea
                value={pgnInput}
                onChange={e => setPgnInput(e.target.value)}
                placeholder="Paste PGN here..."
                style={{
                  width: "100%", height: 60, marginTop: 8, background: "#1a1a2a",
                  border: "1px solid #333", color: "#ccc", borderRadius: 4, padding: 6,
                  fontSize: 11, fontFamily: "monospace", resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <button onClick={() => loadPGN(pgnInput)} style={{
                ...smallBtnStyle, width: "100%", marginTop: 6, padding: "6px",
              }}>
                Load PGN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Promotion dialog */}
      {showPromotion && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 999,
        }}>
          <div style={{
            background: "#1e1e2e", borderRadius: 12, padding: 20,
            border: "1px solid #c9a84c44", textAlign: "center",
          }}>
            <p style={{ marginBottom: 12, fontSize: 14, color: "#c9a84c" }}>Promote pawn to:</p>
            <div style={{ display: "flex", gap: 10 }}>
              {["q", "r", "b", "n"].map(type => (
                <button key={type} onClick={() => handlePromotion(type)} style={{
                  width: 56, height: 56, fontSize: 36, background: "#2a2a3a",
                  border: "1px solid #c9a84c44", borderRadius: 8, cursor: "pointer",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {PIECE_SYMBOLS["w" + type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
        input[type="range"] { height: 4px; }
      `}</style>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────
function tabStyle(active) {
  return {
    padding: "8px 18px", fontSize: 13, background: active ? "rgba(201,168,76,0.2)" : "rgba(30,30,45,0.4)",
    border: `1px solid ${active ? "#c9a84c66" : "#ffffff10"}`, color: active ? "#c9a84c" : "#888",
    borderRadius: 6, cursor: "pointer", letterSpacing: 1, fontWeight: 300,
    transition: "all 0.3s",
  };
}

const smallBtnStyle = {
  padding: "6px 12px", fontSize: 12, background: "rgba(30,30,45,0.6)",
  border: "1px solid #ffffff10", color: "#aaa", borderRadius: 4, cursor: "pointer",
  transition: "all 0.3s",
};
