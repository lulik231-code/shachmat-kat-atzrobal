import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('groups');
  const [groups, setGroups] = useState([]);
  const [children, setChildren] = useState([]);
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);

    const [gardenRes, groupsRes] = await Promise.all([
      supabase.from('gardens').select('*').eq('teacher_id', profile.id).single(),
      supabase.from('groups').select('*').eq('teacher_id', profile.id).order('created_at')
    ]);

    setGarden(gardenRes.data);
    const groupList = groupsRes.data || [];
    setGroups(groupList);

    if (groupList.length > 0) {
      const groupIds = groupList.map(g => g.id);
      const { data: childrenData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'child')
        .eq('garden_id', gardenRes.data?.id)
        .order('full_name');
      setChildren(childrenData || []);
    }

    setLoading(false);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    if (groups.length >= 3) {
      showToast('לא ניתן לפתוח יותר מ-3 קבוצות', 'error');
      return;
    }
    setCreatingGroup(true);
    const { error } = await supabase.from('groups').insert({
      name: newGroupName.trim(),
      garden_id: garden?.id,
      teacher_id: profile.id,
      is_open: true
    });
    if (!error) {
      setNewGroupName('');
      showToast('הקבוצה נוצרה ✅');
      fetchData();
    } else {
      showToast('שגיאה ביצירת קבוצה', 'error');
    }
    setCreatingGroup(false);
  };

  const approveChild = async (childId, groupId) => {
    await supabase.from('profiles').update({ is_approved: true, group_id: groupId }).eq('id', childId);
    showToast('הילד אושר ✅');
    fetchData();
  };

  const suspendChild = async (childId) => {
    await supabase.from('profiles').update({ is_suspended: true, is_approved: false }).eq('id', childId);
    showToast('הילד הושהה');
    fetchData();
  };

  const deleteChild = async (childId) => {
    if (!window.confirm('למחוק ילד זה?')) return;
    await supabase.from('profiles').delete().eq('id', childId);
    showToast('הילד נמחק', 'error');
    fetchData();
  };

  const toggleGroup = async (groupId, isOpen) => {
    await supabase.from('groups').update({ is_open: !isOpen }).eq('id', groupId);
    showToast(isOpen ? 'הקבוצה נסגרה' : 'הקבוצה נפתחה ✅');
    fetchData();
  };

  const pendingChildren = children.filter(c => !c.is_approved && !c.is_suspended);
  const approvedChildren = children.filter(c => c.is_approved);

  return (
    <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontFamily: 'Fredoka One', fontSize: '2rem', color: 'var(--accent-purple)' }}>
            👩‍🏫 לוח גננת
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            שלום {profile?.full_name} · גן {garden?.name || ''}
            {!garden?.is_approved && (
              <span className="badge badge-dim" style={{ marginRight: '8px' }}>ממתין לאישור מנהל</span>
            )}
          </p>
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
              padding: '10px 18px',
              fontFamily: 'Fredoka One',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            ♟️ שחמט
          </motion.button>
          <button onClick={signOut} className="btn btn-ghost" style={{ padding: '10px 14px' }}>
            🚪 יציאה
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'groups', label: 'קבוצות', emoji: '👥', badge: groups.length },
          { id: 'pending', label: 'ממתינים', emoji: '⏳', badge: pendingChildren.length, alert: pendingChildren.length > 0 },
          { id: 'children', label: 'ילדים', emoji: '🧒', badge: approvedChildren.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'var(--accent-purple)' : 'var(--bg-card)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? 'var(--accent-purple)' : t.alert ? 'rgba(244,196,48,0.4)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: 'Varela Round',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {t.emoji} {t.label}
            {t.badge > 0 && (
              <span style={{
                background: t.alert ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)',
                color: t.alert ? '#1a1200' : 'inherit',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

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
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* GROUPS TAB */}
            {tab === 'groups' && (
              <div>
                {/* Create group */}
                {garden?.is_approved && groups.length < 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      padding: '20px',
                      marginBottom: '20px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <input
                      className="input-field"
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="שם קבוצה חדשה..."
                      style={{ flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && createGroup()}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={createGroup}
                      disabled={creatingGroup || !newGroupName.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #9b6dff, #6b3dd4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 20px',
                        fontFamily: 'Fredoka One',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + צור קבוצה
                    </motion.button>
                  </motion.div>
                )}

                {!garden?.is_approved && (
                  <div style={{
                    background: 'rgba(244,196,48,0.1)',
                    border: '1px solid rgba(244,196,48,0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    color: 'var(--accent-gold)'
                  }}>
                    ⏳ הגן שלך ממתין לאישור מנהל לפני שתוכלי לפתוח קבוצות
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {groups.map(g => {
                    const groupChildren = children.filter(c => c.group_id === g.id && c.is_approved);
                    return (
                      <motion.div
                        key={g.id}
                        whileHover={{ y: -3 }}
                        style={{
                          background: 'var(--bg-card)',
                          border: `1px solid ${g.is_open ? 'rgba(76,175,130,0.3)' : 'var(--border)'}`,
                          borderRadius: '16px',
                          padding: '20px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontFamily: 'Fredoka One', fontSize: '1.3rem', color: 'var(--accent-purple)' }}>
                              👥 {g.name}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '3px' }}>
                              {groupChildren.length} ילדים
                            </p>
                          </div>
                          <span className={`badge ${g.is_open ? 'badge-green' : 'badge-red'}`}>
                            {g.is_open ? 'פתוחה' : 'סגורה'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleGroup(g.id, g.is_open)}
                          style={{
                            background: g.is_open ? 'rgba(224,92,92,0.15)' : 'rgba(76,175,130,0.15)',
                            color: g.is_open ? 'var(--accent-red)' : 'var(--accent-green)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '7px 14px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontFamily: 'Varela Round'
                          }}
                        >
                          {g.is_open ? '🔒 סגור קבוצה' : '🔓 פתח קבוצה'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {groups.length === 0 && garden?.is_approved && (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)' }}>
                    עדיין אין קבוצות — צרי קבוצה ראשונה! 🌟
                  </div>
                )}
              </div>
            )}

            {/* PENDING TAB */}
            {tab === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingChildren.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)' }}>
                    אין ילדים ממתינים לאישור ✅
                  </div>
                ) : (
                  pendingChildren.map(child => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(244,196,48,0.2)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{child.full_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', direction: 'ltr', textAlign: 'right' }}>
                          {child.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                          className="input-field"
                          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.88rem' }}
                          defaultValue=""
                          id={`group-select-${child.id}`}
                        >
                          <option value="">בחר קבוצה</option>
                          {groups.filter(g => g.is_open).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const sel = document.getElementById(`group-select-${child.id}`);
                            if (!sel.value) { showToast('בחרי קבוצה תחילה', 'error'); return; }
                            approveChild(child.id, sel.value);
                          }}
                          style={{
                            background: 'rgba(76,175,130,0.15)',
                            color: 'var(--accent-green)',
                            border: '1px solid rgba(76,175,130,0.3)',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontFamily: 'Varela Round'
                          }}
                        >
                          ✅ אשר
                        </motion.button>
                        <button
                          onClick={() => deleteChild(child.id)}
                          style={{
                            background: 'rgba(224,92,92,0.15)',
                            color: 'var(--accent-red)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.88rem',
                            fontFamily: 'Varela Round'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* CHILDREN TAB */}
            {tab === 'children' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {approvedChildren.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)' }}>
                    אין ילדים מאושרים עדיין
                  </div>
                ) : (
                  approvedChildren.map(child => {
                    const childGroup = groups.find(g => g.id === child.group_id);
                    return (
                      <motion.div
                        key={child.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '14px',
                          padding: '14px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {child.is_online && <span className="online-dot" />}
                          <div>
                            <div style={{ fontWeight: 600 }}>{child.full_name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                              {childGroup ? `👥 ${childGroup.name}` : 'ללא קבוצה'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => suspendChild(child.id)}
                            style={{
                              background: 'rgba(244,196,48,0.1)',
                              color: 'var(--accent-gold)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontFamily: 'Varela Round'
                            }}
                          >
                            ⏸️ השהה
                          </button>
                          <button
                            onClick={() => deleteChild(child.id)}
                            style={{
                              background: 'rgba(224,92,92,0.1)',
                              color: 'var(--accent-red)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              fontFamily: 'Varela Round'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

export default TeacherDashboard;
