import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // המשתמש הגיע מקישור האיפוס — מוכן לעדכון
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להיות לפחות 6 תווים');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--accent-green)', fontSize: '2rem' }}>
            הסיסמה עודכנה!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
            מעביר אותך לדף הכניסה...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '3rem' }}>🔐</span>
          <h1 style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--accent-blue)', marginTop: '8px' }}>
            סיסמה חדשה
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            בחר/י סיסמה חדשה לחשבון שלך
          </p>
        </div>

        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              סיסמה חדשה 🔒
            </label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              אימות סיסמה 🔒
            </label>
            <input
              className="input-field"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="הכנס/י שוב את הסיסמה"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'rgba(224,92,92,0.15)',
                border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: '10px',
                padding: '12px',
                color: 'var(--accent-red)',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '1.1rem',
              fontFamily: 'Fredoka One, cursive',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: '0 4px 15px rgba(74,158,255,0.3)'
            }}
          >
            {loading ? '⏳ מעדכן...' : '✅ עדכן סיסמה'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;