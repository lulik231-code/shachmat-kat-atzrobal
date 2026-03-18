import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';

const ChildDashboard = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [groupmates, setGroupmates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!profile?.group_id) { setLoading(false); return; }

    const [matesRes, invRes] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, is_online, last_seen')
        .eq('group_id', profile.group_id)
        .neq('id', profile.id)
        .eq('is_approved', true),
      supabase.from('game_invitations')
        .select('*, from_player:profiles!from_player_id(full_name)')
        .eq('to_player_id', profile.id)
        .eq('status', 'pending')
    ]);

    setGroupmates(matesRes.data || []);
    setInvitations(invRes.data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    // Set online
    supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', profile.id);
    fetchData();

    // Heartbeat
    const heartbeat = setInterval(() => {
      supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', profile.id);
    }, 30000);

    // Realtime subscriptions
    const profilesSub = supabase.channel('profiles-online')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();

    const invSub = supabase.channel('invitations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_invitations',
        filter: `to_player_id=eq.${profile.id}`
      }, (payload) => {
        showToast('🎮 הוזמנת למשחק!');
        fetchData();
      })
      .subscribe();

    const gameSub = supabase.channel('games-child')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `white_player_id=eq.${profile.id}`
      }, (payload) => {
        if (payload.new.status === 'active') {
          navigate(`/game/${payload.new.id}`);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `black_player_id=eq.${profile.id}`
      }, (payload) => {
        if (payload.new.status === 'active') {
          navigate(`/game/${payload.new.id}`);
        }
      })
      .subscribe();

    return () => {
      clearInterval(heartbeat);
      supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
      profilesSub.unsubscribe();
      invSub.unsubscribe();
      gameSub.unsubscribe();
    };
  }, [profile, fetchData, navigate]);

  const invitePlayer = async (toPlayerId) => {
    const { error } = await supabase.from('game_invitations').insert({
      from_player_id: profile.id,
      to_player_id: toPlayerId,
      group_id: profile.group_id,
      status: 'pending'
    });
    if (!error) showToast('הזמנה נשלחה! ✈️');
    else showToast('שגיאה בשליחת הזמנה', 'error');
  };

  const acceptInvitation = async (inv) => {
    // Create a game
    const { data: game, error } = await supabase.from('chess_games').insert({
      group_id: inv.group_id,
      white_player_id: inv.from_player_id,
      black_player_id: profile.id,
      status: 'active'
    }).select().single();

    if (error) { showToast('שגיאה', 'error'); return; }

    // Update invitation status
    await supabase.from('game_invitations').update({ status: 'accepted' }).eq('id', inv.id);

    navigate(`/game/${game.id}`);
  };

  const declineInvitation = async (invId) => {
    await supabase.from('game_invitations').update({ status: 'declined' }).eq('id', invId);
    fetchData();
  };

  const onlineCount = groupmates.filter(m => m.is_online).length;

  return (
    <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
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
          <h1 style={{
            fontFamily: 'Fredoka One',
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #f4c430, #9b6dff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🧒 שלום, {profile?.full_name}!
          </h1>
          {profile?.group_id && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '3px' }}>
              {onlineCount > 0 && <><span className="online-dot" style={{ marginLeft: '6px' }} />{onlineCount} חברים מחוברים</>}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/game/robot')}
            style={{
              background: 'linear-gradient(135deg, #f4c430, #c9a227)',
              color: '#1a1200',
              border: 'none',
              borderRadius: '14px',
              padding: '12px 22px',
              fontFamily: 'Fredoka One',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(244,196,48,0.3)'
            }}
          >
            🤖 משחק עם רובוט
          </motion.button>
          <button onClick={signOut} className="btn btn-ghost" style={{ padding: '10px 14px' }}>
            🚪
          </button>
        </div>
      </div>

      {/* Pending Invitations */}
      <AnimatePresence>
        {invitations.map(inv => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, rgba(74,158,255,0.1), rgba(155,109,255,0.1))',
              border: '1px solid rgba(74,158,255,0.3)',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>♟️</span>
              <div>
                <div style={{ fontFamily: 'Fredoka One', fontSize: '1.2rem', color: 'var(--accent-blue)' }}>
                  הזמנה למשחק!
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {inv.from_player?.full_name} מזמין/ת אותך לשחמט
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => acceptInvitation(inv)}
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
                ✅ קבל
              </motion.button>
              <button
                onClick={() => declineInvitation(inv.id)}
                style={{
                  background: 'rgba(224,92,92,0.15)',
                  color: 'var(--accent-red)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontFamily: 'Varela Round'
                }}
              >
                ❌ דחה
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* No group assigned */}
      {!profile?.group_id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'rgba(244,196,48,0.08)',
            border: '1px solid rgba(244,196,48,0.2)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⏳</div>
          <h3 style={{ fontFamily: 'Fredoka One', color: 'var(--accent-gold)', marginBottom: '8px' }}>
            ממתין/ת לאישור הגננת
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            הגננת עדיין לא שייכה אותך לקבוצה. בינתיים תוכל/י לשחק עם הרובוט!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/game/robot')}
            style={{
              background: 'linear-gradient(135deg, #f4c430, #c9a227)',
              color: '#1a1200',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              fontFamily: 'Fredoka One',
              fontSize: '1.1rem',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            🤖 משחק עם רובוט
          </motion.button>
        </motion.div>
      )}

      {/* Groupmates */}
      {profile?.group_id && (
        <div>
          <h2 style={{
            fontFamily: 'Fredoka One',
            fontSize: '1.4rem',
            color: 'var(--text-secondary)',
            marginBottom: '14px'
          }}>
            👥 חברי הקבוצה שלי
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : groupmates.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--text-dim)'
            }}>
              אין עדיין חברים אחרים בקבוצה
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {groupmates.map((mate, i) => (
                <motion.div
                  key={mate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(74,158,255,0.15)' }}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${mate.is_online ? 'rgba(76,175,130,0.3)' : 'var(--border)'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    textAlign: 'center'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${['#4a9eff', '#9b6dff', '#f4c430', '#4caf82', '#e05c5c'][i % 5]}, ${['#2563eb', '#6b3dd4', '#c9a227', '#2d8f5e', '#c04040'][i % 5]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    position: 'relative'
                  }}>
                    {mate.full_name[0]}
                    {mate.is_online && (
                      <span style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'var(--accent-green)',
                        border: '2px solid var(--bg-card)',
                        boxShadow: '0 0 6px var(--accent-green)'
                      }} />
                    )}
                  </div>

                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{mate.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: mate.is_online ? 'var(--accent-green)' : 'var(--text-dim)', marginTop: '2px' }}>
                      {mate.is_online ? '● מחובר/ת' : '○ לא מחובר/ת'}
                    </div>
                  </div>

                  {mate.is_online && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => invitePlayer(mate.id)}
                      style={{
                        background: 'linear-gradient(135deg, #4a9eff, #2563eb)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontFamily: 'Fredoka One',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      ♟️ הזמן למשחק
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

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
            background: toast.type === 'error' ? 'rgba(224,92,92,0.95)' : 'rgba(76,175,130,0.95)',
            color: 'white',
            padding: '12px 28px',
            borderRadius: '14px',
            fontWeight: 600,
            zIndex: 9999,
            backdropFilter: 'blur(10px)',
            fontSize: '1rem'
          }}
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  );
};

export default ChildDashboard;
