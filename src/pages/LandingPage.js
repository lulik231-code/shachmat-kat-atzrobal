import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PIECES_DECO = ['♟', '♞', '♝', '♜', '♛', '♚', '♙', '♘', '♗', '♖', '♕', '♔'];

const LandingPage = () => {
  const navigate = useNavigate();

  const buttons = [
    {
      label: 'כניסה למערכת',
      emoji: '🔑',
      path: '/login',
      color: 'linear-gradient(135deg, #4a9eff, #2563eb)',
      glow: 'rgba(74, 158, 255, 0.4)',
      delay: 0.2
    },
    {
      label: 'הרשמת ילד',
      emoji: '🧒',
      path: '/register/child',
      color: 'linear-gradient(135deg, #f4c430, #c9a227)',
      glow: 'rgba(244, 196, 48, 0.4)',
      delay: 0.35,
      textColor: '#1a1200'
    },
    {
      label: 'הרשמת גננת',
      emoji: '👩‍🏫',
      path: '/register/teacher',
      color: 'linear-gradient(135deg, #9b6dff, #6b3dd4)',
      glow: 'rgba(155, 109, 255, 0.4)',
      delay: 0.5
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* Background floating pieces */}
      {PIECES_DECO.map((piece, i) => (
        <motion.span
          key={i}
          style={{
            position: 'absolute',
            fontSize: `${Math.random() * 2 + 1.5}rem`,
            color: `rgba(${Math.random() > 0.5 ? '74,158,255' : '244,196,48'}, 0.08)`,
            left: `${(i / PIECES_DECO.length) * 100}%`,
            top: `${Math.random() * 100}%`,
            pointerEvents: 'none',
            userSelect: 'none'
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.05, 0.12, 0.05]
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {piece}
        </motion.span>
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          textAlign: 'center',
          marginBottom: '60px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Chess board icon */}
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: '5rem', marginBottom: '16px', display: 'block' }}
        >
          ♟️
        </motion.div>

        <h1 style={{
          fontFamily: 'Fredoka One, cursive',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          background: 'linear-gradient(135deg, #4a9eff, #f4c430, #9b6dff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
          marginBottom: '12px'
        }}>
          שחמט-קט אצטרובל
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '400px',
            lineHeight: 1.6
          }}
        >
          לומדים, משחקים ומתחרים! 🌟
        </motion.p>
      </motion.div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '400px',
        position: 'relative',
        zIndex: 1
      }}>
        {buttons.map((btn) => (
          <motion.button
            key={btn.path}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: btn.delay, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(btn.path)}
            style={{
              background: btn.color,
              color: btn.textColor || 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '20px 32px',
              fontSize: '1.4rem',
              fontFamily: 'Fredoka One, cursive',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: `0 8px 30px ${btn.glow}`,
              letterSpacing: '0.5px'
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>{btn.emoji}</span>
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: '48px',
          fontSize: '0.85rem',
          color: 'var(--text-dim)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        שחמט-קט אצטרובל — ממשק שחמט מותאם לילדי גן ⭐
      </motion.p>
    </div>
  );
};

export default LandingPage;
