import React, { useState, useCallback } from 'react';

const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const initialBoard = () => {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  backRank.forEach((p, i) => {
    board[0][i] = 'b' + p;
    board[7][i] = 'w' + p;
  });
  for (let i = 0; i < 8; i++) {
    board[1][i] = 'bP';
    board[6][i] = 'wP';
  }
  return board;
};

const isWhite = (piece) => piece && piece[0] === 'w';
const isBlack = (piece) => piece && piece[0] === 'b';

const getLegalMoves = (board, row, col, currentTurn) => {
  const piece = board[row][col];
  if (!piece) return [];
  const color = piece[0];
  if (color !== currentTurn) return [];
  const type = piece[1];
  const moves = [];
  const enemy = color === 'w' ? isBlack : isWhite;
  const friend = color === 'w' ? isWhite : isBlack;

  const addMove = (r, c) => {
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && !friend(board[r][c])) {
      moves.push([r, c]);
      return !board[r][c];
    }
    return false;
  };

  const slide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (friend(board[r][c])) break;
      moves.push([r, c]);
      if (board[r][c]) break;
      r += dr; c += dc;
    }
  };

  switch (type) {
    case 'P': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (row + dir >= 0 && row + dir < 8 && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
      }
      [[row + dir, col - 1], [row + dir, col + 1]].forEach(([r, c]) => {
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && enemy(board[r][c])) moves.push([r, c]);
      });
      break;
    }
    case 'N':
      [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => addMove(row+dr, col+dc));
      break;
    case 'B': [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([dr,dc]) => slide(dr,dc)); break;
    case 'R': [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc)); break;
    case 'Q': [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => slide(dr,dc)); break;
    case 'K': [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => addMove(row+dr,col+dc)); break;
    default: break;
  }
  return moves;
};

const ChessGame = ({ playerColor = 'w', onMove, disabled = false }) => {
  const [board, setBoard] = useState(initialBoard());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('w');
  const [status, setStatus] = useState('');
  const [capturedW, setCapturedW] = useState([]);
  const [capturedB, setCapturedB] = useState([]);

  const handleSquareClick = useCallback((row, col) => {
    if (disabled) return;
    if (playerColor !== currentTurn) return;

    if (selected) {
      const isLegal = legalMoves.some(([r, c]) => r === row && c === col);
      if (isLegal) {
        const newBoard = board.map(r => [...r]);
        const moved = newBoard[selected[0]][selected[1]];
        const captured = newBoard[row][col];

        if (captured) {
          if (isWhite(captured)) setCapturedW(prev => [...prev, captured]);
          else setCapturedB(prev => [...prev, captured]);
        }

        // Pawn promotion
        if (moved === 'wP' && row === 0) newBoard[row][col] = 'wQ';
        else if (moved === 'bP' && row === 7) newBoard[row][col] = 'bQ';
        else newBoard[row][col] = moved;

        newBoard[selected[0]][selected[1]] = null;
        const nextTurn = currentTurn === 'w' ? 'b' : 'w';
        setBoard(newBoard);
        setCurrentTurn(nextTurn);
        setSelected(null);
        setLegalMoves([]);
        setStatus(nextTurn === 'w' ? 'תור הלבן' : 'תור השחור');
        if (onMove) onMove({ from: selected, to: [row, col], board: newBoard });
      } else {
        const piece = board[row][col];
        if (piece && piece[0] === currentTurn) {
          setSelected([row, col]);
          setLegalMoves(getLegalMoves(board, row, col, currentTurn));
        } else {
          setSelected(null);
          setLegalMoves([]);
        }
      }
    } else {
      const piece = board[row][col];
      if (piece && piece[0] === currentTurn) {
        setSelected([row, col]);
        setLegalMoves(getLegalMoves(board, row, col, currentTurn));
      }
    }
  }, [board, selected, legalMoves, currentTurn, disabled, playerColor, onMove]);

  const isSelected = (r, c) => selected && selected[0] === r && selected[1] === c;
  const isLegal = (r, c) => legalMoves.some(([lr, lc]) => lr === r && lc === c);
  const isLight = (r, c) => (r + c) % 2 === 0;

  return (
    <div style={styles.wrapper}>
      <div style={styles.statusBar}>
        <span style={styles.turnIndicator}>
          {currentTurn === 'w' ? '♔ תור לבן' : '♚ תור שחור'}
        </span>
        {status && <span style={styles.status}>{status}</span>}
      </div>

      <div style={styles.captured}>
        {capturedW.map((p, i) => <span key={i} style={styles.capturedPiece}>{PIECES[p]}</span>)}
      </div>

      <div style={styles.board}>
        {board.map((row, r) =>
          row.map((piece, c) => {
            const light = isLight(r, c);
            const sel = isSelected(r, c);
            const legal = isLegal(r, c);
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                style={{
                  ...styles.square,
                  background: sel ? '#f6f669' : legal ? (light ? '#cdd96e' : '#aaa23a') : light ? '#f0d9b5' : '#b58863',
                  cursor: piece && piece[0] === currentTurn && !disabled ? 'pointer' : 'default',
                }}
              >
                {legal && !piece && <div style={styles.dot} />}
                {legal && piece && <div style={styles.captureDot} />}
                {piece && (
                  <span style={{
                    ...styles.piece,
                    color: isWhite(piece) ? '#fff' : '#1a1a1a',
                    textShadow: isWhite(piece) ? '0 0 2px #000, 0 1px 3px rgba(0,0,0,0.5)' : '0 0 2px #fff5',
                  }}>
                    {PIECES[piece]}
                  </span>
                )}
                {c === 0 && <span style={styles.rankLabel}>{8 - r}</span>}
                {r === 7 && <span style={styles.fileLabel}>{'abcdefgh'[c]}</span>}
              </div>
            );
          })
        )}
      </div>

      <div style={styles.captured}>
        {capturedB.map((p, i) => <span key={i} style={styles.capturedPiece}>{PIECES[p]}</span>)}
      </div>

      <button style={styles.resetBtn} onClick={() => {
        setBoard(initialBoard());
        setSelected(null);
        setLegalMoves([]);
        setCurrentTurn('w');
        setStatus('');
        setCapturedW([]);
        setCapturedB([]);
      }}>
        מחק משחק
      </button>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', userSelect: 'none' },
  statusBar: { display: 'flex', gap: '16px', alignItems: 'center' },
  turnIndicator: { background: '#2d2d2d', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '16px' },
  status: { color: '#666', fontSize: '14px' },
  board: { display: 'grid', gridTemplateColumns: 'repeat(8, 60px)', gridTemplateRows: 'repeat(8, 60px)', border: '3px solid #4a3728', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  square: { width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'background 0.1s' },
  piece: { fontSize: '42px', lineHeight: 1, zIndex: 2, transition: 'transform 0.1s' },
  dot: { width: '20px', height: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%' },
  captureDot: { position: 'absolute', inset: 0, border: '4px solid rgba(0,0,0,0.2)', borderRadius: '50%', zIndex: 1 },
  rankLabel: { position: 'absolute', top: '2px', right: '3px', fontSize: '10px', color: 'rgba(0,0,0,0.4)', fontWeight: 600 },
  fileLabel: { position: 'absolute', bottom: '2px', left: '3px', fontSize: '10px', color: 'rgba(0,0,0,0.4)', fontWeight: 600 },
  captured: { display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '28px', width: '480px' },
  capturedPiece: { fontSize: '22px' },
  resetBtn: { marginTop: '4px', padding: '8px 24px', background: '#e94560', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 },
};

export default ChessGame;