import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const WaitingApprovalPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isSuspended = params.get('suspended') === 'true';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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
          border: `1px solid ${isSuspended ? 'rgba(224,92,92,0.3)' : 'var(--border)'}`,
          borderRadius: '24px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '460px',
          textAlign: 'center',
          boxShadow: isSuspended
            ? '0 0 30px rgba(224,92,92,0.1)'
            : '0 0 30px rgba(244,196,48,0.08)'
        }}
      >
        <motion.div
          animate={{ rotate: isSuspended ? [0] : [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ fontSize: '5rem', marginBottom: '20px' }}
        >
          {isSuspended ? '🚫' : '⏳'}
        </motion.div>

        <h1 style={{
          fontFamily: 'Fredoka One, cursive',
          fontSize: '1.8rem',
          color: isSuspended ? 'var(--accent-red)' : 'var(--accent-gold)',
          marginBottom: '12px'
        }}>
          {isSuspended ? 'החשבון הושהה' : 'ממתין/ת לאישור'}
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          fontSize: '1rem',
          marginBottom: '32px'
        }}>
          {isSuspended
            ? 'החשבון שלך הושהה זמנית. פני/ה לגננת או למנהל לקבלת מידע נוסף.'
            : 'הרשמתך התקבלה בהצלחה! 🎉\n\nאנחנו ממתינים שהגננת או המנהל יאשרו את חשבונך. תוכל/י להתחבר ולשחק שחמט לאחר האישור.'}
        </p>

        {/* Bouncing chess pieces while waiting */}
        {!isSuspended && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
            {['♟', '♞', '♝'].map((p, i) => (
              <motion.span
                key={i}
                style={{ fontSize: '2rem' }}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
              >
                {p}
              </motion.span>
            ))}
          </div>
        )}

        <button
          onClick={handleSignOut}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-bright)',
            borderRadius: '12px',
            padding: '12px 28px',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.target.style.color = 'var(--accent-blue)'}
          onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}
        >
          🚪 יציאה
        </button>
      </motion.div>
    </div>
  );
};

export default WaitingApprovalPage;
