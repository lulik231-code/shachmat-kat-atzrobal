import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: usersData }, { data: gamesData }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('games').select('*, white_player:profiles!games_white_player_id_fkey(full_name), black_player:profiles!games_black_player_id_fkey(full_name)').order('created_at', { ascending: false }).limit(20),
      ]);
      setUsers(usersData || []);
      setGames(gamesData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('האם למחוק משתמש זה?')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const roleLabel = (role) => ({ admin: 'מנהל', teacher: 'מורה', child: 'תלמיד' }[role] || role);
  const roleColor = (role) => ({ admin: '#e94560', teacher: '#f0a500', child: '#2ed573' }[role] || '#666');

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}><span style={styles.logoIcon}>♔</span><span>שחמט כת</span></div>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{profile?.full_name?.[0] || 'A'}</div>
          <div>
            <div style={styles.userName}>{profile?.full_name}</div>
            <div style={styles.userRole}>מנהל</div>
          </div>
        </div>
        <nav style={styles.nav}>
          {[['users', 'משתמשים', '👥'], ['games', 'משחקים', '♟️']].map(([id, label, icon]) => (
            <button key={id} style={{ ...styles.navBtn, ...(tab === id ? styles.activeNavBtn : {}) }} onClick={() => setTab(id)}>
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </nav>
        <button style={styles.signOutBtn} onClick={signOut}>התנתקות</button>
      </div>

      <div style={styles.main}>
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <div style={styles.statNum}>{users.length}</div>
            <div style={styles.statLabel}>משתמשים</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{users.filter(u => u.role === 'teacher').length}</div>
            <div style={styles.statLabel}>מורים</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{users.filter(u => u.role === 'child').length}</div>
            <div style={styles.statLabel}>תלמידים</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statNum}>{games.length}</div>
            <div style={styles.statLabel}>משחקים</div>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>טוען...</div>
        ) : tab === 'users' ? (
          <div style={styles.tableWrap}>
            <h2 style={styles.tableTitle}>ניהול משתמשים</h2>
            <table style={styles.table}>
              <thead>
                <tr>{['שם', 'אימייל', 'תפקיד', 'תאריך הצטרפות', 'פעולות'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={styles.tr}>
                    <td style={styles.td}>{u.full_name}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}><span style={{ ...styles.roleBadge, background: roleColor(u.role) + '33', color: roleColor(u.role) }}>{roleLabel(u.role)}</span></td>
                    <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
                    <td style={styles.td}>
                      {u.role !== 'admin' && (
                        <button style={styles.deleteBtn} onClick={() => deleteUser(u.id)}>מחק</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <h2 style={styles.tableTitle}>משחקים אחרונים</h2>
            <table style={styles.table}>
              <thead>
                <tr>{['לבן', 'שחור', 'תורות', 'תאריך'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {games.map(g => (
                  <tr key={g.id} style={styles.tr}>
                    <td style={styles.td}>{g.white_player?.full_name || '-'}</td>
                    <td style={styles.td}>{g.black_player?.full_name || '-'}</td>
                    <td style={styles.td}>{g.moves?.length || 0}</td>
                    <td style={styles.td}>{new Date(g.created_at).toLocaleDateString('he-IL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#0f0f1a', color: '#fff', fontFamily: "'Segoe UI', Arial, sans-serif", direction: 'rtl' },
  sidebar: { width: '240px', background: 'rgba(255,255,255,0.03)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: '24px' },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700, color: '#fff' },
  logoIcon: { fontSize: '28px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  avatar: { width: '40px', height: '40px', background: '#e94560', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700 },
  userName: { fontSize: '14px', fontWeight: 600, color: '#fff' },
  userRole: { fontSize: '12px', color: '#e94560' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  navBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'transparent', border: 'none', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '15px', textAlign: 'right' },
  activeNavBtn: { background: 'rgba(233,69,96,0.15)', color: '#e94560' },
  signOutBtn: { padding: '10px', background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: '10px', color: '#e94560', cursor: 'pointer', fontSize: '14px' },
  main: { flex: 1, padding: '32px', overflowY: 'auto' },
  statsRow: { display: 'flex', gap: '16px', marginBottom: '32px' },
  stat: { flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  statNum: { fontSize: '32px', fontWeight: 700, color: '#e94560' },
  statLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' },
  tableWrap: { background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' },
  tableTitle: { fontSize: '18px', fontWeight: 700, margin: '0 0 20px', color: '#fff' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'right', padding: '10px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.05)' },
  td: { padding: '12px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.85)' },
  roleBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  deleteBtn: { padding: '4px 12px', background: 'rgba(233,69,96,0.2)', border: '1px solid rgba(233,69,96,0.4)', borderRadius: '6px', color: '#e94560', cursor: 'pointer', fontSize: '13px' },
  loading: { textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)', fontSize: '18px' },
};

export default AdminDashboard;