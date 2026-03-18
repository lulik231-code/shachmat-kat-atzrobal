import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const RegisterTeacherPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', kindergartenName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('שגיאה ביצירת משתמש');

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: form.email.trim().toLowerCase(),
        full_name: form.fullName.trim(),
        role: 'teacher',
        is_approved: false,
        kindergarten_name: form.kindergartenName.trim()
      });

      if (profileError) throw profileError;

      // Create the garden entry (pending approval)
      const { error: gardenError } = await supabase.from('gardens').insert({
        name: form.kindergartenName.trim(),
        teacher_id: authData.user.id,
        teacher_name: form.fullName.trim(),
        is_approved: false
      });

      if (gardenError) throw gardenError;

      setSuccess(true);
      setTimeout(() => navigate('/waiting'), 2000);
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('האימייל הזה כבר רשום במערכת');
      } else {
        setError(err.message || 'שגיאה בהרשמה');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🎊</div>
          <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--accent-green)', fontSize: '2rem' }}>
            נרשמת בהצלחה!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
            ממתינה לאישור המנהל...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 0 30px rgba(155,109,255,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '3rem' }}>👩‍🏫</span>
          <h1 style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '1.8rem',
            color: 'var(--accent-purple)',
            marginTop: '8px'
          }}>
            הרשמת גננת
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            מלאי את הפרטים ותמתיני לאישור מנהל
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              שם מלא 👤
            </label>
            <input
              className="input-field"
              type="text"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              placeholder="שרה לוי"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              אימייל 📧
            </label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              סיסמה 🔒
            </label>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="לפחות 6 תווים"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              שם הגן 🏫
            </label>
            <input
              className="input-field"
              type="text"
              value={form.kindergartenName}
              onChange={e => setForm({ ...form, kindergartenName: e.target.value })}
              placeholder="גן אצטרובל"
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
                padding: '10px 14px',
                color: 'var(--accent-red)',
                fontSize: '0.88rem'
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
              background: 'linear-gradient(135deg, #9b6dff, #6b3dd4)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '1.1rem',
              fontFamily: 'Fredoka One, cursive',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '6px',
              boxShadow: '0 4px 15px rgba(155,109,255,0.3)'
            }}
          >
            {loading ? '⏳ נרשמת...' : '✅ הרשמה'}
          </motion.button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            כבר רשומה? התחברי →
          </Link>
        </div>
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>← חזרה</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterTeacherPage;
