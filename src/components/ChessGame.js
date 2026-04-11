import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

const PIECE_UNICODE = { wK: '♔', wQ: '▕', wR: '♖', wB: '♗', wN: '▘', wP: '♙', bK: '♚', bQ: '▛', bR: '♜', bB: '♝', bN: '▞', bP: '♟' };

function getBotMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  const captures = moves.filter(m => m.captured);
  const pool = captures.length > 0 && Math.random() > 0.4 ? captures : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function ChessGame({ onBack, vsBot = false, gameData = null, onMove = null, playerColor = 'w' }) {
  const [chess] = useState(() => { const c = new Chess(); if (gameData?.fen) c.load(gameData.fen); return c; });
  const [board, setBoard] = useState(chess.board());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [status, setStatus] = useState('');
  const [lastMove, setLastMove] = useState(null);
  const [thinking, setThinking] = useState(false);

  const updateStatus = useCallback(() => {
    if (chess.isCheckmate()) setStatus(chess.turn() === 'w' ? '🏆 שחור ניצח!' : '🏆 לבן ניצח!');
    else if (chess.isDraw()) setStatus('✝ תישו!');
    else if (chess.isCheck()) setStatus(chess.turn() === 'w' ? '⚠️ שאח ⌜' : '⚠️ ובח⌛');
    else setStatus(chess.turn() === 'w' ? '⬜ תור לבן' : '⬛ תור לשחור');
  }, [chess]);

  useEffect(() => { updateStatus(); }, [updateStatus]);
  useEffect(() => {
    if (gameData?.fen && gameData.fen !== chess.fen()) { chess.load(gameData.fen); setBoard(chess.board()); updateStatus(); }
  }, [gameData?.fen]);

  async function handleBotMove() {
    setThinking(true);
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    const move = getBotMove(chess);
    if (move) { chess.move(move); setBoard(chess.board()); setLastMove({ from: move.from, to: move.to }); updateStatus(); }
    setThinking(false);
  }

  function handleSquareClick(row, col) {
    if (chess.isGameOver() || thinking) return;
    if (vsBot && chess.turn() !== 'w') return;
    if (!vsBot && onMove && chess.turn() !== playerColor) return;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const square = files[col] + (8 - row);
    if (selected) {
      if (legalMoves.includes(square)) {
        const move = chess.move({ from: selected, to: square, promotion: 'q' });
        if (move) {
          setBoard(chess.board()); setLastMove({ from: selected, to: square });
          setSelected(null); setLegalMoves([]); updateStatus();
          if (onMove) onMove(chess.fen(), move);
          if (vsBot && !chess.isGameOver()) handleBotMove();
          return;
        }
      }
      setSelected(null); setLegalMoves([]);
    }
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelected(square);
      setLegalMoves(chess.moves({ square, verbose: true }).map(m => m.to));
    }
  }

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: 'white', padding: '8px 16px', cursor: 'pointer' }}>→ חזור</button>
          <div style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 22 }}>{vsBot ? '🤖 נגד רובוט' : '👥 אותליין</div>
          <div style={{ width: 80 }} />
        </div>
        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '4px solid #c9a84c' }}>
          {board.map((rowPieces, row) => (
            <div key={row} style={{ display: 'flex' }}>
              {rowPieces.map((piece, col) => {
                const sq = files[col] + (8 - row);
                const isLight = (row + col) % 2 === 0;
                const isSel = selected === sq;
                const isLegal = legalMoves.includes(sq);
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                const pk = piece ? piece.color + piece.type.toUpperCase() : null;
                return (
                  <div key={col} onClick={() => handleSquareClick(row, col)} style={{ width: '12.5%', paddingBottom: '12.5%', position: 'relative', cursor: 'pointer', background: isSel ? '#f6f669' : isLast ? (isLight ? '#cdd26a' : '#aaa23a') : isLight ? '#f0d9b5' : '#b58863' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isLegal && <div style={{ width: piece ? '85%' : '30%', height: piece ? '85%' : '30%', borderRadius: '50%', background: piece ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.18)', position: 'absolute' }} />}
                      {piece && <span style={{ fontSize: 'clamp(18px,4vw, 36px)', color: piece.color === 'w' ? '#fff' : '#1a1a1a', position: 'relative', zIndex: 1, userSelect: 'none' }}>{PIECE_UNICODE[pk]}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 12 }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 16px', color: '#ffd700' }}>{vsBot ? '⬜ אתה' : playerColor === 'w' ? '⬜ אתה' : '⬛ אתה'}</span>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 20px' }}>
          <div style={{ color: thinking ? '#4cc9f0' : '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 20 }}>{thinking ? '🤔 הובוט חושב...' : status}</div>
          {chess.isGameOver() && <button onClick={() => { chess.reset(); setBoard(chess.board()); setSelected(null); setLegalMoves([]); setLastMove(null); updateStatus(); }} style={{ marginTop: 12, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#48c78e', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>🔄 משחק חדש</button>}
        </div>
      </div>
    </div>
  );
}
