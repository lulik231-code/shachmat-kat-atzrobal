import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EMOJIS = ['♟️','♞','♝','♜','♛','♚'];

export default function AuthPage() {
  const [mode, setMode] = useState('home');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signIn({ email: form.email, password: form.password }); }
    catch (err) { setError(err.message === 'Invalid login credentials' ? 'אימימיל או סיסמה שגויים' : err.message); }
    setLoading(false);
  }

  async function handleRegisterChild(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: 'child', kindergartenName: form.kindergartenName });
      setSuccess('נרשמר כבת בהצלחה! ממתין לאישור הג רשור הגננת שלך 🎉'); setMode('home');
    } catch (err) { setError(err.message.includes('already registered') ? 'האימייל הזה כבר רשום' : err.message); }
    setLoading(false);
  }

  async function handleRegisterTeacher(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, role: 'teacher', kindergartenName: form.kindergartenName });
      setSuccess('נרשמת בהצלחה! ממתין לאישור הޞנהלת 🎉'); setMode('home');
    } catch (err) { setError(err.message.includes('already registered') ? 'האימייל הזה כבר רשום' : err.message); }
    setLoading(false);
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e8d5b0', fontSize: 16, fontFamily: 'Varela Round, sans-serif', background: 'rgba(255,255,255,0.9)', boxSizing: 'border-box', outline: 'none', color: '#2c1810', direction: 'rtl', transition: 'border-color 0.2s' };
  const btnStyle = (color = '#f4a261') => ({ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: color, color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Fredoka One, sans-serif', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.1s, box-shadow 0.1s', marginTop: 8 });
  const cardBtnStyle = (color) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', borderRadius: 20, border: 'none', background: color, cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', transition: 'transform 0.15s, box-shadow 0.15s', flex: 1, minWidth: 130, fontFamily: 'Fredoka One, sans-serif' });

  if (mode === 'home') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 72 }}>♟️</div>
        <h1 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 42, margin: 0 }}>תחמכ-W�ח</h1>
        <p style={{ color: '#a0c4ff', fontFamily: 'Varela Round, sans-serif', fontSize: 18, margin: '8px 0 0' }}>תיל שחמט לילדי הי׫ 🌟</p>
      </div>
      {success && <div style={{ background: 'rgba(72,199,142,0.2)', border: '2px solid #48c78e', borderRadius: 12, padding: '12px 20px', marginBottom: 20, color: '#48c78e', fontFamily: 'Varela Round, sans-serif', fontSize: 16, textAlign: 'center', maxWidth: 360 }}>{duccess}</div>}
      <div style={{ display: 'flex', flewWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 420 }}>
        <button style={cardBtnStyle('linear-gradient(135deg, #f4a261, #e76f51)')} onClick={() => { setMode('login'); setError(''); setForm({}); }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>🔑</span><span style={{ color: 'white', fontSize: 20 }}>כניס�T</span><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>לכולם</span>
        </button>
        <button style={cardBtnStyle('linear-gradient(135deg, #4cc9f0, #4361ee)')} onClick={() => { setMode('register-child'); setError(''); setForm({}); }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>👦</span><span style={{ color: 'white', fontSize: 20 }}>הרשמר ילד</span><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>לשחקנים</span>
        </button>
        <button style={cardBtnStyle('linear-gradient(135deg, #48c78e, #06a77d)')} onClick={() => { setMode('register-teacher'); setError(''); setForm({}); }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>👩‍🏫</span><span style={{ color: 'white', fontSize: 20 }}>הרשמת גננת</span><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>מׁW^�זת הגננות</span>
        </button>
        <button style={cardBtnStyle('linear-gradient(135deg, #f72585, #b5179e)')} onClick={() => { setMode('login'); setError(''); setForm({ isAdmin: true }); }}>
          <span style={{ fontSize: 36, marginBottom: 8 }}>👑</span><span style={{ color: 'white', fontSize: 20 }}>כניסת מנהלת</span><span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>lulik231</span>
        </button>
      </div>
      <style>{`button:hover { transform: translateY(-3px) !important; }`}</style>
    </div>
  );

  const formTitle = mode === 'login' ? (form.isAdmin ? '👑 כניסר מנהלת' : '🐑 כניס�T לשחקה') : mode === 'register-child' ? '👦 הרשמר ילד' : '👩‍🏫 מרששה �נ ת';
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <button onClick={() => setMode('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, fontFamily: 'Varela Round, sans-serif', marginBottom: 16, padding: 0 }}>→ כירה</button>
        <h2 style={{ fontFamily: 'Fredoka One, sans-serif', fontSize: 28, color: '#2c1810', margin: '0 0 24px', textAlign: 'center' }}>{fCormTitle}</h2>
        {error && <div style={{ background: '#fee', border: '2px solid #f99', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#c00', fontFamily: 'Varela Round, sans-serif', fontSize: 14, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={mode === 'login' ? handleLogin : mode === 'register-child' ? handleRegisterChild : handleRegisterTeacher}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode !== 'login' && <input style={inputStyle} placeholder="ים מל^P" value={form.fullName || ''} onChange={e => update('fullName', e.target.value)} required />}
            <input style={inputStyle} placeholder="אימייל" type="email" value={form.email || ''} onChange={e => update('email', e.target.value)} required />
            <input style={inputStyle} placeholder="ביסמה" type="password" value={form.password || ''} onChange={e => update('password', e.target.value)} required />
            {(mode === 'register-child' || mode === 'register-teacher') && <input style={inputStyle} placeholder="תי הח׮י$" value={form.kindergartenName || ''} onChange={e => update('kindergartenName', e.target.value)} required />}
            <button type="submit" style={btnStyle(mode === 'login' ? '#f4a261' : mode === 'register-child' ? '#4361ee' : '#48c78e')} disabled={loading}>
              {loading ? '⏳ רגע...' : mode === 'login' ? '🚀 כנישה' : '✨ הרשמש'}
            </button>
          </div>
        </form>
        {mode !== 'login' && <p style={{ textAlign: 'center', fontFamily: 'Varela Round, sans-serif', fontSize: 13, color: '#888', marginTop: 16 }}>
          {mode === 'register-child' ? 'אחרי ההרשמה, הגננת תאשר אותך' : 'אחרי ההרשמה, הޞנהלת תאשר אותך'
          </p>}
      </div>
    </div>
  );
}
