import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('child');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
      } else {
        const { error } = await signUp(email, password, fullName, role);
        if (error) setError(error.message);
        else setMessage('ההרשמה הצליחה! כעת תוכל/י להתחבר.');
      }
    } catch (err) {
      setError('שגיאה בלתי צפויה. אנא נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.chessPiece}>♔</span>
          <h1 style={styles.title}>שחמט כת אצרובל</h1>
          <p style={styles.subtitle}>פלטפורמת לימוד שחמט</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
          >
            התחברות
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
            onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>שם מלא</label>
                <input
                  style={styles.input}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="הכנס/י שם מלא"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>תפקיד</label>
                <select style={styles.input} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="child">תלמיד/ה</option>
                  <option value="teacher">מורה</option>
                  <option value="admin">מנהל/ת</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.field}>
            <label style={styles.label}>אימייל</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>סיסמה</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {message && <div style={styles.success}>{message}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'טוען...' : isLogin ? 'התחברות' : 'הרשמה'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    direction: 'rtl',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  chessPiece: { fontSize: '48px', display: 'block', marginBottom: '12px' },
  title: { color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 },
  tabs: { display: 'flex', marginBottom: '28px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px' },
  tab: {
    flex: 1, padding: '10px', border: 'none', background: 'transparent',
    color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '8px',
    fontSize: '15px', transition: 'all 0.2s',
  },
  activeTab: { background: '#e94560', color: '#fff', fontWeight: 600 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 },
  input: {
    padding: '12px 16px', background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px',
    color: '#fff', fontSize: '15px', outline: 'none',
    direction: 'ltr', textAlign: 'left',
  },
  button: {
    marginTop: '8px', padding: '14px', background: '#e94560',
    border: 'none', borderRadius: '10px', color: '#fff',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  error: {
    background: 'rgba(233,69,96,0.2)', border: '1px solid rgba(233,69,96,0.5)',
    borderRadius: '8px', padding: '10px 14px', color: '#ff6b8a', fontSize: '14px',
  },
  success: {
    background: 'rgba(46,213,115,0.2)', border: '1px solid rgba(46,213,115,0.5)',
    borderRadius: '8px', padding: '10px 14px', color: '#2ed573', fontSize: '14px',
  },
};

export default AuthPage;