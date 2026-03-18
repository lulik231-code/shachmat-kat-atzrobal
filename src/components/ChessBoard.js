import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PIECE_UNICODE = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const PIECE_COLORS = {
  w: '#f0e6cc',
  b: '#1a1a2e'
};

const PIECE_SHADOW = {
  w: '0 2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(240,230,204,0.2)',
  b: '0 2px 8px rgba(0,0,0,0.8), 0 0 12px rgba(26,26,46,0.3)'
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const ChessBoard = ({
  position,
  onMove,
  legalMoves = [],
  lastMove = null,
  orientation = 'white',
  disabled = false,
  hints = [],
  promotionPending = null,
  onPromotion,
  checkSquare = null,
}) => {
  const [selected, setSelected] = useState(null);
  const [hoveredSquare, setHoveredSquare] = useState(null);

  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  const getSquareColor = (file, rank) => {
    const fileIdx = FILES.indexOf(file);
    const rankIdx = parseInt(rank) - 1;
    return (fileIdx + rankIdx) % 2 === 0 ? 'dark' : 'light';
  };

  const getSquare = (file, rank) => `${file}${rank}`;

  const handleSquareClick = useCallback((square) => {
    if (disabled) return;

    const piece = position[square];

    if (selected) {
      const move = legalMoves.find(m => m.from === selected && m.to === square);
      if (move) {
        // Check promotion
        if (move.promotion) {
          if (onPromotion) {
            onPromotion(selected, square);
          } else {
            onMove({ from: selected, to: square, promotion: 'q' });
          }
        } else {
          onMove({ from: selected, to: square });
        }
        setSelected(null);
        return;
      }

      if (piece) {
        setSelected(square);
        return;
      }

      setSelected(null);
    } else {
      if (piece && legalMoves.some(m => m.from === square)) {
        setSelected(square);
      }
    }
  }, [selected, legalMoves, position, disabled, onMove, onPromotion]);

  const selectedMoves = selected ? legalMoves.filter(m => m.from === selected).map(m => m.to) : [];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        border: '3px solid #2a3a55',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(74,158,255,0.08)',
        width: 'min(75vw, 480px)',
        height: 'min(75vw, 480px)',
        position: 'relative'
      }}>
        {ranks.map(rank =>
          files.map(file => {
            const square = getSquare(file, rank);
            const color = getSquareColor(file, rank);
            const piece = position[square];
            const isSelected = selected === square;
            const isLegal = selectedMoves.includes(square);
            const isLastMoveFrom = lastMove?.from === square;
            const isLastMoveTo = lastMove?.to === square;
            const isHint = hints.includes(square);
            const isCheck = checkSquare === square;
            const isHovered = hoveredSquare === square;

            let bg;
            if (color === 'light') bg = '#e8d5b7';
            else bg = '#8b6a3e';

            if (isLastMoveFrom || isLastMoveTo) {
              bg = color === 'light' ? '#cdd374' : '#9da850';
            }
            if (isSelected) {
              bg = color === 'light' ? '#f6f64a' : '#c8c830';
            }
            if (isCheck) {
              bg = '#e05c5c';
            }

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onMouseEnter={() => setHoveredSquare(square)}
                onMouseLeave={() => setHoveredSquare(null)}
                style={{
                  background: bg,
                  position: 'relative',
                  cursor: disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
              >
                {/* Legal move indicator */}
                {isLegal && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}>
                    {piece ? (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '3px solid rgba(0,180,0,0.7)',
                        borderRadius: '2px'
                      }} />
                    ) : (
                      <div style={{
                        width: '30%',
                        height: '30%',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.25)'
                      }} />
                    )}
                  </div>
                )}

                {/* Hint */}
                {isHint && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(155,109,255,0.3)',
                    border: '2px solid rgba(155,109,255,0.8)',
                    pointerEvents: 'none',
                    zIndex: 1,
                    animation: 'pulse-hint 1s infinite'
                  }} />
                )}

                {/* Piece */}
                {piece && (
                  <motion.div
                    key={`${piece}-${square}`}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: isSelected ? 1.15 : 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontSize: 'min(7.5vw, 48px)',
                      lineHeight: 1,
                      color: PIECE_COLORS[piece[0]],
                      textShadow: PIECE_SHADOW[piece[0]],
                      userSelect: 'none',
                      zIndex: 3,
                      position: 'relative',
                      filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,220,0,0.8))' : 'none',
                      transform: isSelected ? 'translateY(-4px)' : 'none'
                    }}
                  >
                    {PIECE_UNICODE[piece]}
                  </motion.div>
                )}

                {/* Coordinates */}
                {file === (orientation === 'white' ? 'a' : 'h') && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '3px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: color === 'light' ? '#8b6a3e' : '#e8d5b7',
                    lineHeight: 1,
                    userSelect: 'none'
                  }}>
                    {rank}
                  </span>
                )}
                {rank === (orientation === 'white' ? '1' : '8') && (
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '3px',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: color === 'light' ? '#8b6a3e' : '#e8d5b7',
                    lineHeight: 1,
                    userSelect: 'none'
                  }}>
                    {file}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Promotion dialog */}
      <AnimatePresence>
        {promotionPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              zIndex: 100,
              backdropFilter: 'blur(4px)'
            }}
          >
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-bright)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontFamily: 'Fredoka One', marginBottom: '16px', color: 'var(--accent-gold)' }}>
                בחר/י כלי!
              </h3>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {['q', 'r', 'b', 'n'].map(p => {
                  const color = promotionPending.color;
                  const pieceKey = `${color}${p.toUpperCase()}`;
                  return (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onMove({ ...promotionPending, promotion: p })}
                      style={{
                        background: 'var(--bg-card2)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '2.5rem',
                        cursor: 'pointer',
                        color: PIECE_COLORS[color],
                        textShadow: PIECE_SHADOW[color]
                      }}
                    >
                      {PIECE_UNICODE[pieceKey]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ChessBoard;
