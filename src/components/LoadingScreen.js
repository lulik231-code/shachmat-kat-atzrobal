import React from 'react';
import { motion } from 'framer-motion';

const CHESS_PIECES = ['♟', '♞', '♝', '♜', '♛', '♚'];

const LoadingScreen = ({ message = 'טוען...' }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep)',
      gap: '32px'
    }}>
      {/* Animated chess pieces */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {CHESS_PIECES.map((piece, i) => (
          <motion.span
            key={i}
            style={{ fontSize: '2.5rem', display: 'block' }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.4, 1, 0.4],
              color: ['#4a9eff', '#f4c430', '#9b6dff', '#4caf82', '#f4c430', '#4a9eff'][i]
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {piece}
          </motion.span>
        ))}
      </div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          fontFamily: 'Fredoka One, cursive',
          fontSize: '1.5rem',
          color: 'var(--text-secondary)',
          letterSpacing: '1px'
        }}
      >
        {message}
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
