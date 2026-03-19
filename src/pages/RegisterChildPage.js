import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const RegisterChildPage = () => {
  const navigate = useNavigate();
  const [gardens, setGardens] = useState([]);
  const [form, setForm] = useState({ fullName: '', username: '', password: '', gardenId: '' });
  const [loading, setLoading] = useState(false);
  const [loadingGardens, setLoadingGardens] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchGardens(); }, []);

  const fetchGardens = async () => {
    const { data } = await supabase.from('gardens').select('id, name, teacher_name').eq('is_approved', true).order('name');
    setGardens(data || []);
    setLoadingGardens(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fakeEmail = `${form.username.trim().toLowerCase().replace(/\s+/g, '.')}@shachmat-kat.local`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: form.password,
        options: { emailRedirectTo: null }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('שגיאה ביצירת משתמש');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: fakeEmail,
        full_name: form.fullName.trim(),
        role: 'child',
        is_approved: false,
        garden_id: form.gardenId
      });

      if (profileError) throw profileError;

      setSuccess(true);
      setTimeout(() => navigate('/waiting'), 2000);
    } catch (err) {
      if (err.message.includes('already registered') || err.message.includes('User already registered')) {
        setError('שם המשתמש הזה כבר תפוס — בחר/י שם אחר');
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
          <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--accent-green)', fontSize: '2rem' }}>נרשמת בהצלחה!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>ממתין לאישור הגננת שלך...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
          boxShadow: '0 0 30px rgba(244,196,48,0.1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '3rem' }}>🧒</span>
          <h1 style={{ fontFamily: 'Fredoka One, cursive', fontSize: '1.8rem', color: 'var(--accent-gold)', marginTop: '8px' }}>
            הרשמת ילד
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            מלא/י את הפרטים ותמתין/י לאישור הגננת
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>שם מלא 👤</label>
            <input className="input-field" type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="ישראל ישראלי" required disabled={loading} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>שם משתמש 🔤</label>
            <input className="input-field" type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="israel123" required disabled={loading} />
            <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>באנגלית בלבד, ללא רווחים</p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>סיסמה 🔒</label>
            <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="לפחות 6 תווים" required minLength={6} disabled={loading} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>בחר/י גן 🏫</label>
            {loadingGardens ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', padding: '10px' }}>טוען גנים...</div>
            ) : gardens.length === 0 ? (
              <div style={{ color: 'var(--accent-red)', fontSize: '0.9rem', padding: '10px' }}>אין גנים מאושרים כרגע</div>
            ) : (
              <select className="input-field" value={form.gardenId} onChange={e => setForm({ ...form, gardenId: e.target.value })} required disabled={loading}>
                <option value="">-- בחר/י גן --</option>
                {gardens.map(g => (
                  <option key={g.id} value={g.id}>גן {g.name} — {g.teacher_name}</option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: 'rgba(224,92,92,0.15)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: '10px', padding: '10px 14px', color: 'var(--accent-red)', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </motion.div>
          )}

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading || gardens.length === 0}
            style={{ background: 'linear-gradient(135deg, #f4c430, #c9a227)', color: '#1a1200', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '1.1rem', fontFamily: 'Fredoka One, cursive', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '6px', boxShadow: '0 4px 15px rgba(244,196,48,0.3)' }}>
            {loading ? '⏳ נרשם...' : '✅ הרשמה'}
          </motion.button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>כבר רשום/ה? התחבר/י →</Link>
        </div>
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>← חזרה</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterChildPage;