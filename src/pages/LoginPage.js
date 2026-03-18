import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (authError) throw authError;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile) {
          throw new Error('לא נמצא פרופיל משתמש');
        }

        // Update online status
        await supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', data.user.id);

        if (!profile.is_approved) {
          navigate('/waiting');
          return;
        }

        if (profile.is_suspended) {
          navigate('/waiting?suspended=true');
          return;
        }

        if (profile.role === 'admin') navigate('/admin');
        else if (profile.role === 'teacher') navigate('/teacher');
        else navigate('/child');
      }
    } catch (err) {
      console.error(err);
      setError(err.message === 'Invalid login credentials'
        ? 'אימייל או סיסמה שגויים'
        : err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
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
        transition={{ duration: 0.4 }}
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '3.5rem' }}>♟️</span>
          <h1 style={{
            fontFamily: 'Fredoka One, cursive',
            fontSize: '2rem',
            color: 'var(--accent-blue)',
            marginTop: '8px'
          }}>
            כניסה למערכת
          </h1>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              אימייל 📧
            </label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              סיסמה 🔒
            </label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(224,92,92,0.15)',
                border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
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
              marginTop: '8px',
              boxShadow: '0 4px 15px rgba(74,158,255,0.3)'
            }}
          >
            {loading ? '⏳ מתחבר...' : '🚀 כניסה'}
          </motion.button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <Link to="/register/child" style={{
            color: 'var(--accent-gold)',
            fontSize: '0.9rem',
            transition: 'opacity 0.2s'
          }}>
            🧒 אני ילד/ה — הרשמה
          </Link>
          <Link to="/register/teacher" style={{
            color: 'var(--accent-purple)',
            fontSize: '0.9rem',
            transition: 'opacity 0.2s'
          }}>
            👩‍🏫 אני גננת — הרשמה
          </Link>
          <Link to="/" style={{
            color: 'var(--text-dim)',
            fontSize: '0.85rem'
          }}>
            ← חזרה
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
