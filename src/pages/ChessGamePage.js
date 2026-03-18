import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chess } from 'chess.js';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import ChessBoard from '../components/ChessBoard';

// Simple chess AI
const getRandomMove = (chess) => {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
};

const getSmartMove = (chess) => {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Prioritize captures and checks
  const captures = moves.filter(m => m.captured);
  const checks = moves.filter(m => {
    const clone = new Chess(chess.fen());
    clone.move(m);
    return clone.isCheck();
  });

  if (checks.length > 0) return checks[Math.floor(Math.random() * checks.length)];
  if (captures.length > 0) {
    // Prefer higher value captures
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    captures.sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
    return captures[0];
  }
  return moves[Math.floor(Math.random() * moves.length)];
};

const chessPosToObj = (chess) => {
  const pos = {};
  const board = chess.board();
  board.forEach((row, rankIdx) => {
    row.forEach((sq, fileIdx) => {
      if (sq) {
        const file = 'abcdefgh'[fileIdx];
        const rank = 8 - rankIdx;
        const key = `${file}${rank}`;
        pos[key] = `${sq.color}${sq.type.toUpperCase()}`;
      }
    });
  });
  return pos;
};

const ChessGamePage = ({ robotMode: robotModeProp }) => {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isRobotMode = robotModeProp || location.pathname === '/game/robot';

  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(chessPosToObj(chess));
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [status, setStatus] = useState('playing'); // playing, check, checkmate, stalemate, draw, resigned
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState(null); // null = not chosen yet
  const [playerColor, setPlayerColor] = useState('w');
  const [moveHistory, setMoveHistory] = useState([]);
  const [hints, setHints] = useState([]);
  const [promotionPending, setPromotionPending] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [opponentName, setOpponentName] = useState('');
  const [thinking, setThinking] = useState(false);
  const [toast, setToast] = useState(null);
  const robotTimerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateGameState = useCallback(() => {
    setPosition(chessPosToObj(chess));

    // Compute legal moves for current turn
    const moves = chess.moves({ verbose: true });
    setLegalMoves(moves);

    // Check status
    if (chess.isCheckmate()) {
      const loser = chess.turn();
      const w = loser === 'b' ? 'white' : 'black';
      setWinner(w);
      setStatus('checkmate');
      if ((w === 'white' && playerColor === 'w') || (w === 'black' && playerColor === 'b')) {
        fireConfetti();
      }
    } else if (chess.isStalemate()) {
      setStatus('stalemate');
    } else if (chess.isDraw()) {
      setStatus('draw');
    } else if (chess.isCheck()) {
      setStatus('check');
    } else {
      setStatus('playing');
    }

    setMoveHistory(chess.history({ verbose: true }));
  }, [chess, playerColor]);

  // Load online game
  useEffect(() => {
    if (!isRobotMode && gameId) {
      loadOnlineGame();
    }
  }, [gameId, isRobotMode]);

  const loadOnlineGame = async () => {
    const { data } = await supabase.from('chess_games')
      .select('*, white_player:profiles!white_player_id(full_name), black_player:profiles!black_player_id(full_name)')
      .eq('id', gameId)
      .single();

    if (!data) { navigate(-1); return; }
    setGameData(data);

    const myColor = data.white_player_id === profile.id ? 'w' : 'b';
    setPlayerColor(myColor);

    const oppName = myColor === 'w' ? data.black_player?.full_name : data.white_player?.full_name;
    setOpponentName(oppName);

    // Load FEN
    chess.load(data.fen);
    updateGameState();

    // Subscribe to game updates
    const sub = supabase.channel(`game-${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const newData = payload.new;
        chess.load(newData.fen);
        updateGameState();

        if (newData.status === 'finished') {
          if (newData.winner_id === profile.id) fireConfetti();
          setStatus(newData.result === 'draw' ? 'draw' : 'checkmate');
        }
      })
      .subscribe();

    return () => sub.unsubscribe();
  };

  // Robot AI
  useEffect(() => {
    if (!isRobotMode || !difficulty || status !== 'playing' && status !== 'check') return;
    if (chess.turn() === playerColor) return; // not robot's turn

    setThinking(true);
    const delay = difficulty === 'easy' ? 600 : 1200;

    robotTimerRef.current = setTimeout(() => {
      const move = difficulty === 'easy' ? getRandomMove(chess) : getSmartMove(chess);
      if (move) {
        chess.move(move);
        setLastMove({ from: move.from, to: move.to });
        updateGameState();
      }
      setThinking(false);
    }, delay);

    return () => clearTimeout(robotTimerRef.current);
  }, [chess, isRobotMode, difficulty, status, playerColor, updateGameState]);

  const handleMove = useCallback(async (move) => {
    if (status === 'checkmate' || status === 'stalemate' || status === 'draw') return;

    // Check if it's player's turn
    if (chess.turn() !== playerColor) return;

    // Check promotion
    const piece = chess.get(move.from);
    if (piece?.type === 'p') {
      const destRank = move.to[1];
      if ((piece.color === 'w' && destRank === '8') || (piece.color === 'b' && destRank === '1')) {
        if (!move.promotion) {
          setPromotionPending({ ...move, color: piece.color });
          return;
        }
      }
    }

    setPromotionPending(null);
    setHints([]);

    try {
      const result = chess.move(move);
      if (!result) return;

      setLastMove({ from: move.from, to: move.to });
      updateGameState();

      // Save to Supabase (online game)
      if (!isRobotMode && gameId) {
        const isGameOver = chess.isCheckmate() || chess.isDraw() || chess.isStalemate();
        const winnerId = chess.isCheckmate()
          ? (chess.turn() === 'b' ? gameData?.white_player_id : gameData?.black_player_id)
          : null;

        await supabase.from('chess_games').update({
          fen: chess.fen(),
          moves: chess.history({ verbose: true }),
          status: isGameOver ? 'finished' : 'active',
          winner_id: winnerId,
          result: chess.isCheckmate() ? (chess.turn() === 'b' ? 'white' : 'black') : chess.isDraw() ? 'draw' : null
        }).eq('id', gameId);
      }
    } catch (err) {
      console.error('Invalid move:', err);
    }
  }, [chess, playerColor, status, isRobotMode, gameId, gameData, updateGameState]);

  const undoMove = () => {
    if (!isRobotMode) return;
    chess.undo();
    if (chess.turn() !== playerColor) chess.undo(); // undo robot move too
    setLastMove(null);
    setHints([]);
    updateGameState();
    showToast('↩️ המהלך בוטל');
  };

  const showHint = () => {
    const moves = chess.moves({ verbose: true }).filter(m => m.color === playerColor);
    if (moves.length === 0) return;
    // Find a good hint move
    const hint = getSmartMove(chess);
    if (hint) {
      setHints([hint.from, hint.to]);
      setTimeout(() => setHints([]), 3000);
      showToast('💡 רמז: בדוק את הכלים המסומנים');
    }
  };

  const resignGame = async () => {
    if (!window.confirm('להכנע במשחק?')) return;
    const winner = playerColor === 'w' ? 'black' : 'white';
    setWinner(winner);
    setStatus('resigned');

    if (!isRobotMode && gameId) {
      await supabase.from('chess_games').update({
        status: 'finished',
        result: winner,
        winner_id: playerColor === 'w' ? gameData?.black_player_id : gameData?.white_player_id
      }).eq('id', gameId);
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f4c430', '#4a9eff', '#9b6dff', '#4caf82']
    });
    setTimeout(() => confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } }), 300);
    setTimeout(() => confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } }), 500);
  };

  const newGame = () => {
    chess.reset();
    setLastMove(null);
    setHints([]);
    setWinner(null);
    setStatus('playing');
    setPromotionPending(null);
    if (isRobotMode) setDifficulty(null);
    updateGameState();
  };

  const orientation = playerColor === 'w' ? 'white' : 'black';
  const isMyTurn = chess.turn() === playerColor;
  const isGameOver = ['checkmate', 'stalemate', 'draw', 'resigned'].includes(status);

  // Difficulty selection screen (robot mode)
  if (isRobotMode && !difficulty) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '48px 40px',
            textAlign: 'center',
            maxWidth: '440px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🤖</div>
          <h1 style={{ fontFamily: 'Fredoka One', fontSize: '2rem', color: 'var(--accent-blue)', marginBottom: '8px' }}>
            משחק עם רובוט
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            בחר/י רמת קושי
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <motion.button
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setDifficulty('easy'); setPlayerColor('w'); }}
              style={{
                background: 'linear-gradient(135deg, #4caf82, #2d8f5e)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '20px',
                fontFamily: 'Fredoka One',
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 6px 20px rgba(76,175,130,0.3)'
              }}
            >
              <span>😊</span> קל — מתחיל/ת
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setDifficulty('hard'); setPlayerColor('w'); }}
              style={{
                background: 'linear-gradient(135deg, #e05c5c, #c04040)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '20px',
                fontFamily: 'Fredoka One',
                fontSize: '1.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 6px 20px rgba(224,92,92,0.3)'
              }}
            >
              <span>😤</span> קשה — מתקדם/ת
            </motion.button>
          </div>

          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: '24px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'Varela Round'
            }}
          >
            ← חזרה
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'Varela Round'
          }}
        >
          ← חזרה
        </button>

        <h1 style={{
          fontFamily: 'Fredoka One',
          fontSize: '1.5rem',
          color: 'var(--accent-gold)'
        }}>
          {isRobotMode ? `♟️ נגד רובוט ${difficulty === 'easy' ? '😊' : '😤'}` : `♟️ נגד ${opponentName}`}
        </h1>

        <div style={{ width: '80px' }} />
      </div>

      {/* Game layout */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '900px'
      }}>
        {/* Board area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Opponent label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            minWidth: '200px'
          }}>
            <span style={{ fontSize: '1.5rem' }}>{isRobotMode ? '🤖' : '👤'}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {isRobotMode ? `רובוט (${difficulty === 'easy' ? 'קל' : 'קשה'})` : opponentName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {playerColor === 'w' ? '♟ שחור' : '♙ לבן'}
              </div>
            </div>
            {thinking && (
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', marginRight: 'auto' }}
              >
                חושב...
              </motion.span>
            )}
          </div>

          {/* Chess Board */}
          <div style={{ position: 'relative' }}>
            <ChessBoard
              position={position}
              onMove={handleMove}
              legalMoves={isMyTurn && !isGameOver ? legalMoves : []}
              lastMove={lastMove}
              orientation={orientation}
              disabled={!isMyTurn || isGameOver || thinking}
              hints={hints}
              promotionPending={promotionPending}
              onPromotion={(from, to) => setPromotionPending({ from, to, color: playerColor })}
              checkSquare={chess.isCheck() ? chess.board().flat().find(sq => sq?.type === 'k' && sq?.color === chess.turn())?.square : null}
            />

            {/* Game over overlay */}
            <AnimatePresence>
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '2px solid var(--border-bright)',
                      borderRadius: '20px',
                      padding: '28px 36px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>
                      {status === 'checkmate' && (winner === 'white' && playerColor === 'w' || winner === 'black' && playerColor === 'b') ? '🏆' :
                       status === 'draw' || status === 'stalemate' ? '🤝' : '😞'}
                    </div>
                    <h2 style={{ fontFamily: 'Fredoka One', fontSize: '1.8rem', marginBottom: '8px',
                      color: status === 'checkmate' && (winner === 'white' && playerColor === 'w' || winner === 'black' && playerColor === 'b')
                        ? 'var(--accent-gold)' : status === 'draw' ? 'var(--accent-blue)' : 'var(--accent-red)'
                    }}>
                      {status === 'checkmate' && (winner === 'white' && playerColor === 'w' || winner === 'black' && playerColor === 'b')
                        ? '🎉 ניצחת!' :
                       status === 'checkmate' ? 'הפסדת 😔' :
                       status === 'stalemate' ? 'פט — תיקו!' :
                       status === 'draw' ? 'תיקו! 🤝' :
                       status === 'resigned' ? 'נכנעת' : ''}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={newGame}
                      style={{
                        background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 28px',
                        fontFamily: 'Fredoka One',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      🔄 משחק חדש
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: isMyTurn && !isGameOver ? 'rgba(74,158,255,0.1)' : 'var(--bg-card)',
            borderRadius: '10px',
            border: `1px solid ${isMyTurn && !isGameOver ? 'rgba(74,158,255,0.4)' : 'var(--border)'}`,
            minWidth: '200px',
            transition: 'all 0.3s'
          }}>
            <span style={{ fontSize: '1.5rem' }}>👤</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{profile?.full_name} (אתה/את)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {playerColor === 'w' ? '♙ לבן' : '♟ שחור'}
              </div>
            </div>
            {isMyTurn && !isGameOver && !thinking && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ color: 'var(--accent-green)', fontSize: '0.85rem', marginRight: 'auto' }}
              >
                ● תורך!
              </motion.span>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minWidth: '200px',
          flex: '0 0 auto'
        }}>
          {/* Status */}
          {status === 'check' && !isGameOver && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                background: 'rgba(224,92,92,0.15)',
                border: '1px solid rgba(224,92,92,0.4)',
                borderRadius: '12px',
                padding: '12px 16px',
                textAlign: 'center',
                color: 'var(--accent-red)',
                fontFamily: 'Fredoka One',
                fontSize: '1.1rem'
              }}
            >
              ⚠️ שאח!
            </motion.div>
          )}

          {/* Controls */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              פעולות
            </h3>

            {isRobotMode && (
              <ControlBtn onClick={undoMove} emoji="↩️" label="בטל מהלך" color="var(--accent-blue)" disabled={isGameOver || chess.history().length < 2} />
            )}

            <ControlBtn onClick={showHint} emoji="💡" label="רמז" color="var(--accent-purple)" disabled={isGameOver || !isMyTurn} />
            <ControlBtn onClick={resignGame} emoji="🏳️" label="הכנע" color="var(--accent-red)" disabled={isGameOver} />
            <ControlBtn onClick={newGame} emoji="🔄" label="משחק חדש" color="var(--accent-green)" />
          </div>

          {/* Move history */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            maxHeight: '240px',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              📋 מהלכים
            </h3>
            {moveHistory.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>עדיין אין מהלכים</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const white = moveHistory[i * 2];
                  const black = moveHistory[i * 2 + 1];
                  return (
                    <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-dim)', minWidth: '20px' }}>{i + 1}.</span>
                      <span style={{ color: 'var(--text-primary)' }}>{white?.san}</span>
                      {black && <span style={{ color: 'var(--text-secondary)' }}>{black.san}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'error' ? 'rgba(224,92,92,0.95)' : 'rgba(76,175,130,0.95)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            zIndex: 9999,
            backdropFilter: 'blur(10px)'
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
};

const ControlBtn = ({ onClick, emoji, label, color, disabled }) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.02, x: disabled ? 0 : -3 }}
    whileTap={{ scale: disabled ? 1 : 0.97 }}
    onClick={disabled ? undefined : onClick}
    style={{
      background: disabled ? 'transparent' : `${color}18`,
      color: disabled ? 'var(--text-dim)' : color,
      border: `1px solid ${disabled ? 'var(--border)' : `${color}44`}`,
      borderRadius: '10px',
      padding: '10px 14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'Varela Round',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s'
    }}
  >
    <span>{emoji}</span> {label}
  </motion.button>
);

export default ChessGamePage;
