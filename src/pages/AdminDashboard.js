import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const TABS = [
  { id: 'teachers', label: 'גננות', emoji: '👩‍🏫' },
  { id: 'children', label: 'ילדים', emoji: '🧒' },
  { id: 'gardens', label: 'גנים', emoji: '🏫' },
  { id: 'groups', label: 'קבוצות', emoji: '👥' },
];

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('teachers');
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [gardens, setGardens] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    const [t, c, g, gr] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'teacher').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, gardens(name)').eq('role', 'child').order('created_at', { ascending: false }),
      supabase.from('gardens').select('*, profiles!teacher_id(full_name)').order('created_at', { ascending: false }),
      supabase.from('groups').select('*, gardens(name)').order('created_at', { ascending: false })
    ]);
    setTeachers(t.data || []);
    setChildren(c.data || []);
    setGardens(g.data || []);
    setGroups(gr.data || []);
    setLoading(false);
  };

  const approveTeacher = async (id) => {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
    // Also approve their garden
    await supabase.from('gardens').update({ is_approved: true }).eq('teacher_id', id);
    showToast('הגננת אושרה בהצלחה! ✅');
    fetchAll();
  };

  const suspendUser = async (id) => {
    await supabase.from('profiles').update({ is_suspended: true, is_approved: false }).eq('id', id);
    showToast('המשתמש הושהה');
    fetchAll();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('למחוק משתמש זה?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    showToast('המשתמש נמחק', 'error');
    fetchAll();
  };

  const approveChild = async (id) => {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
    showToast('הילד אושר ✅');
    fetchAll();
  };

  const openGroup = async (gId) => {
    await supabase.from('groups').update({ is_open: true }).eq('id', gId);
    showToast('הקבוצה נפתחה ✅');
    fetchAll();
  };

  const closeGroup = async (gId) => {
    await supabase.from('groups').update({ is_open: false }).eq('id', gId);
    showToast('הקבוצה נסגרה');
    fetchAll();
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        padding: '0 4px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'Fredoka One', fontSize: '2rem', color: 'var(--accent-blue)' }}>
            🛡️ לוח מנהל
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>שלום, {profile?.full_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/game/robot')}
            style={{
              background: 'linear-gradient(135deg, #4caf82, #2d8f5e)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontFamily: 'Fredoka One',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ♟️ שחק שחמט
          </motion.button>
          <button
            onClick={signOut}
            className="btn btn-ghost"
            style={{ padding: '10px 16px' }}
          >
            🚪 יציאה
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '28px'
      }}>
        {[
          { label: 'גננות', count: teachers.length, emoji: '👩‍🏫', color: '#9b6dff' },
          { label: 'ילדים', count: children.length, emoji: '🧒', color: '#f4c430' },
          { label: 'גנים', count: gardens.length, emoji: '🏫', color: '#4a9eff' },
          { label: 'קבוצות', count: groups.length, emoji: '👥', color: '#4caf82' },
        ].map(s => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3 }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
            <div style={{ fontFamily: 'Fredoka One', fontSize: '1.8rem', color: s.color }}>{s.count}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'var(--accent-blue)' : 'var(--bg-card)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '8px 18px',
              cursor: 'pointer',
              fontFamily: 'Varela Round',
              fontSize: '0.95rem',
              transition: 'all 0.2s'
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'teachers' && (
              <UserTable
                data={teachers}
                cols={['שם', 'אימייל', 'שם גן', 'סטטוס']}
                renderRow={(t) => (
                  <tr key={t.id}>
                    <td>{t.full_name}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{t.email}</td>
                    <td>{t.kindergarten_name || '—'}</td>
                    <td>
                      {t.is_suspended
                        ? <span className="badge badge-red">מושהה</span>
                        : t.is_approved
                        ? <span className="badge badge-green">מאושר</span>
                        : <span className="badge badge-dim">ממתין</span>
                      }
                    </td>
                    <td>
                      <ActionButtons
                        item={t}
                        onApprove={!t.is_approved && !t.is_suspended ? () => approveTeacher(t.id) : null}
                        onSuspend={t.is_approved ? () => suspendUser(t.id) : null}
                        onDelete={() => deleteUser(t.id)}
                      />
                    </td>
                  </tr>
                )}
              />
            )}
            {tab === 'children' && (
              <UserTable
                data={children}
                cols={['שם', 'אימייל', 'גן', 'סטטוס']}
                renderRow={(c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{c.email}</td>
                    <td>{c.gardens?.name || '—'}</td>
                    <td>
                      {c.is_suspended
                        ? <span className="badge badge-red">מושהה</span>
                        : c.is_approved
                        ? <span className="badge badge-green">מאושר</span>
                        : <span className="badge badge-dim">ממתין</span>
                      }
                    </td>
                    <td>
                      <ActionButtons
                        item={c}
                        onApprove={!c.is_approved && !c.is_suspended ? () => approveChild(c.id) : null}
                        onSuspend={c.is_approved ? () => suspendUser(c.id) : null}
                        onDelete={() => deleteUser(c.id)}
                      />
                    </td>
                  </tr>
                )}
              />
            )}
            {tab === 'gardens' && (
              <UserTable
                data={gardens}
                cols={['שם גן', 'גננת', 'סטטוס']}
                renderRow={(g) => (
                  <tr key={g.id}>
                    <td>🏫 {g.name}</td>
                    <td>{g.teacher_name}</td>
                    <td>
                      {g.is_approved
                        ? <span className="badge badge-green">מאושר</span>
                        : <span className="badge badge-dim">ממתין</span>
                      }
                    </td>
                    <td />
                  </tr>
                )}
              />
            )}
            {tab === 'groups' && (
              <UserTable
                data={groups}
                cols={['שם קבוצה', 'גן', 'סטטוס']}
                renderRow={(g) => (
                  <tr key={g.id}>
                    <td>👥 {g.name}</td>
                    <td>{g.gardens?.name || '—'}</td>
                    <td>
                      {g.is_open
                        ? <span className="badge badge-green">פתוחה</span>
                        : <span className="badge badge-red">סגורה</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {g.is_open
                          ? <SmallBtn label="סגור" color="var(--accent-red)" onClick={() => closeGroup(g.id)} />
                          : <SmallBtn label="פתח" color="var(--accent-green)" onClick={() => openGroup(g.id)} />
                        }
                      </div>
                    </td>
                  </tr>
                )}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'error' ? 'rgba(224,92,92,0.9)' : 'rgba(76,175,130,0.9)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            zIndex: 9999,
            backdropFilter: 'blur(10px)'
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
};

const UserTable = ({ data, cols, renderRow }) => (
  <div style={{ overflowX: 'auto' }}>
    {data.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '48px',
        color: 'var(--text-dim)',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        אין נתונים להצגה
      </div>
    ) : (
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0 6px'
      }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{
                textAlign: 'right',
                padding: '8px 12px',
                color: 'var(--text-dim)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {c}
              </th>
            ))}
            <th style={{ width: '120px' }} />
          </tr>
        </thead>
        <tbody>
          {data.map(item => {
            const row = renderRow(item);
            return React.cloneElement(row, {
              style: {
                background: 'var(--bg-card)',
                ...row.props.style
              },
              children: React.Children.map(row.props.children, (td, i) =>
                React.cloneElement(td, {
                  style: {
                    padding: '12px 12px',
                    fontSize: '0.93rem',
                    borderTop: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    ...(i === 0 && { borderRight: '1px solid var(--border)', borderRadius: '0 10px 10px 0' }),
                    ...(i === (row.props.children.filter(Boolean).length - 1) && {
                      borderLeft: '1px solid var(--border)',
                      borderRadius: '10px 0 0 10px'
                    }),
                    ...td.props.style
                  }
                })
              )
            });
          })}
        </tbody>
      </table>
    )}
  </div>
);

const ActionButtons = ({ item, onApprove, onSuspend, onDelete }) => (
  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
    {onApprove && <SmallBtn label="✅ אשר" color="var(--accent-green)" onClick={onApprove} />}
    {onSuspend && <SmallBtn label="⏸️ השהה" color="var(--accent-gold)" textColor="#1a1200" onClick={onSuspend} />}
    {onDelete && <SmallBtn label="🗑️" color="var(--accent-red)" onClick={onDelete} />}
  </div>
);

const SmallBtn = ({ label, color, textColor, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      background: `${color}22`,
      color: textColor || color,
      border: `1px solid ${color}44`,
      borderRadius: '8px',
      padding: '5px 10px',
      fontSize: '0.82rem',
      cursor: 'pointer',
      fontFamily: 'Varela Round',
      whiteSpace: 'nowrap'
    }}
  >
    {label}
  </motion.button>
);

export default AdminDashboard;
