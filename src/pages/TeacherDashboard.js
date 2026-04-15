import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChessGame from '../components/ChessGame';

export default function TeacherDashboard() {
  const { signOut, profile } = useAuth();
  const [tab, setTab] = useState('children');
  const [children, setChildren] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingBot, setPlayingBot] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: c }, { data: g }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'child').eq('kindergarten_name', profile.kindergarten_name).order('created_at', { ascending: false }),
      supabase.from('groups').select('*').eq('teacher_id', profile.id),
    ]);
    setChildren(c || []);
    setGroups(g || []);
    setLoading(false);
  }

  async function approveChild(id, current) {
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id);
    fetchData();
  }

  async function suspendChild(id, current) {
    await supabase.from('profiles').update({ is_suspended: !current }).eq('id', id);
    fetchData();
  }

  async function deleteChild(id) {
    if (!window.confirm('למחוק ילד זה?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    fetchData();
  }

  async function createGroup() {
    if (!newGroupName.trim()) return;
    if (groups.length >= 3) { alert('ניתן לפתוח עד 3 קבוצות בלבד'); return; }
    await supabase.from('groups').insert({ name: newGroupName, teacher_id: profile.id, garden_id: null });
    setNewGroupName('');
    fetchData();
  }

  async function deleteGroup(id) {
    if (!window.confirm('למחוק קבוצה זו?')) return;
    await supabase.from('groups').delete().eq('id', id);
    fetchData();
  }

  async function assignToGroup(childId, groupId) {
    await supabase.from('profiles').update({ group_id: groupId || null }).eq('id', childId);
    fetchData();
  }

  if (playingBot) return <ChessGame onBack={() => setPlayingBot(false)} vsBot={true} />;

  if (!profile.is_approved) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 28 }}>ממתינה לאישור</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif' }}>בקשת ההרשמה שלך נשלחה למנהלת. תוכלי להיכנס לאחר האישור.</p>
        <button onClick={signOut} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#f4a261', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>יציאה</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', direction: 'rtl', padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 28, margin: 0 }}>👩‍🏫 שלום, {profile.full_name}!</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Varela Round, sans-serif', margin: '4px 0 0', fontSize: 14 }}>גן {profile.kindergarten_name}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPlayingBot(true)} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4cc9f0', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 15 }}>♟️ שחק נגד רובוט</button>
            <button onClick={signOut} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', cursor: 'pointer', fontFamily: 'Varela Round, sans-serif' }}>יציאה</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['children', '👦 ילדים'], ['groups', '👥 קבוצות']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', background: tab === t ? '#ffd700' : 'rgba(255,255,255,0.1)', color: tab === t ? '#2c1810' : 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>{label}</button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', color: 'white', padding: 40 }}>טוען...</div> : (
          <>
            {tab === 'children' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {children.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40, fontFamily: 'Varela Round, sans-serif' }}>אין ילדים רשומים מגן זה עדיין</div>}
                {children.map(child => (
                  <div key={child.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>{child.full_name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>{child.email}</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'Varela Round, sans-serif', background: child.is_approved ? 'rgba(72,199,142,0.2)' : 'rgba(244,162,97,0.2)', color: child.is_approved ? '#48c78e' : '#f4a261' }}>
                          {child.is_approved ? '✓ מאושר' : '⏳ ממתין'}
                        </span>
                        {child.group_id && <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 12, fontFamily: 'Varela Round, sans-serif', background: 'rgba(76,201,240,0.2)', color: '#4cc9f0' }}>
                          {groups.find(g => g.id === child.group_id)?.name || 'קבוצה'}
                        </span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select onChange={e => assignToGroup(child.id, e.target.value)} value={child.group_id || ''} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>
                        <option value="">ללא קבוצה</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <button onClick={() => approveChild(child.id, child.is_approved)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: child.is_approved ? 'rgba(255,255,255,0.1)' : '#48c78e', color: 'white', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>
                        {child.is_approved ? 'בטל' : '✓ אשר'}
                      </button>
                      <button onClick={() => suspendChild(child.id, child.is_suspended)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f4a261', color: 'white', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>
                        {child.is_suspended ? 'שחרר' : 'השהה'}
                      </button>
                      <button onClick={() => deleteChild(child.id)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f72585', color: 'white', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'groups' && (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <h3 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', margin: '0 0 12px' }}>יצירת קבוצה חדשה ({groups.length}/3)</h3>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="שם הקבוצה" style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: 'Varela Round, sans-serif', outline: 'none', direction: 'rtl' }} />
                    <button onClick={createGroup} disabled={groups.length >= 3} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: groups.length >= 3 ? 'rgba(255,255,255,0.1)' : '#48c78e', color: 'white', cursor: groups.length >= 3 ? 'not-allowed' : 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>+ צור</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {groups.map(g => (
                    <div key={g.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 20 }}>👥 {g.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>
                          {children.filter(c => c.group_id === g.id).length} ילדים
                        </div>
                      </div>
                      <button onClick={() => deleteGroup(g.id)} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#f72585', color: 'white', fontFamily: 'Varela Round, sans-serif' }}>🗑️ מחק</button>
                    </div>
                  ))}
                  {groups.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 40, fontFamily: 'Varela Round, sans-serif' }}>אין קבוצות עדיין</div>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}