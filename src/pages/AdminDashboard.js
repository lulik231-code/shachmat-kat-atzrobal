import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [tab, setTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'child').order('created_at', { ascending: false }),
    ]);
    setTeachers(t || []);
    setChildren(c || []);
    setLoading(false);
  }

  async function approve(id, current) {
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id);
    fetchData();
  }

  async function suspend(id, current) {
    await supabase.from('profiles').update({ is_suspended: !current }).eq('id', id);
    fetchData();
  }

  async function deleteUser(id) {
    if (!window.confirm('למחוק משתמש זה?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    fetchData();
  }

  const list = tab === 'teachers' ? teachers : children;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', direction: 'rtl', padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 32, margin: 0 }}>👑 פאנל מנהלת</h1>
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: 'white', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Varela Round, sans-serif' }}>יציאה</button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'גננות', count: teachers.length, color: '#48c78e', emoji: '👩‍🏫' },
            { label: 'ממתינור לאישור', count: teachers.filter(t => !t.is_approved).length, color: '#f4a261', emoji: '⏳' },
            { label: 'ילדים', count: children.length, color: '#4cc9f0', emoji: '👦' },
            { label: 'ממתינור לאיששו', count: children.filter(c => !c.is_approved).length, color: '#f72585', emoji: '⏳' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 24px', flex: 1, minWidth: 140, border: `1px solid ${s.color}40` }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{s.emoji�</div>
              <div style={{ color: s.color, fontFamily: 'Fredoka One, sans-serif', fontSize: 28 }}>{s.count}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['teachers', '👩‍🏫 גננות'], ['children', '👦 ילדים']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: tab === t ? '#ffd700' : 'rgba(255,255,255,0.1)', color: tab === t ? '#2c1810' : 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>{label}</button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'white', padding: 40, fontFamily: 'Varela Round, sans-serif' }}>טוען...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40, fontFamily: 'Varela Round, sans-serif' }}>אין {tab === 'teachers' ? 'גאנור' : 'יובים'} עביין</div>}
            {list.map(u => (
              <div key={u.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, border: u.is_approved ? '1px solid rgba(72,199,142,0.3)' : '1px solid rgba(244,162,97,0.3)' }}>
                <div>
                  <div style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>{u.full_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>{u.email}</div>
                  {u.kindergarten_name && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>גכ: {u.kindergarten_name}</div>}
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, background: u.is_approved ? 'rgba(72,199,142,0.2)' : 'rgba(244,162,97,0.2)', color: u.is_approved ? '#48c78e' : '#f4a261' }}>
                      {u.is_approved ? '✓ מאוחר' : '⏳ ממתיל'}
                    </span>
                    {u.is_suspended && <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, background: 'rgba(247,37,133,0.2)', color: '#f72585' }}>מושהה</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => approve(u.id, u.is_approved)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: u.is_approved ? 'rgba(255,255,255,0.1)' : '#48c78e', color: 'white' }}>
                    {u.is_approved ? 'בטל אישור' : '✓ אשר'}
                  </button>
                  <button onClick={() => suspend(u.id, u.is_suspended)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: u.is_suspended ? '#48c78e' : '#f4a261', color: 'white' }}>
                    {u.is_suspended ? 'בטל השהיה' : 'השהה'}
                  </button>
                  <button onClick={() => deleteUser(u.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f72585', color: 'white' }}>🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
