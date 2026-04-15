import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChessGame from './ChessGame';

export default function OnlineGame({ groupId, onBack }) {
  const { profile } = useAuth();
  const [peers, setPeers] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const [opponentName, setOpponentName] = useState('');

  useEffect(() => {
    fetchPeers();
    const channel = supabase.channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_invitations', filter: `to_player_id=eq.${profile.id}` }, handleInvite)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_games', filter: `group_id=eq.${groupId}` }, handleGameUpdate)
      .subscribe();

    // Update presence
    supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', profile.id);

    return () => {
      supabase.removeChannel(channel);
      supabase.from('profiles').update({ is_online: false }).eq('id', profile.id);
    };
  }, [groupId]);

  async function fetchPeers() {
    const { data } = await supabase.from('profiles').select('id, full_name, is_online, last_seen')
      .eq('group_id', groupId).eq('is_approved', true).neq('id', profile.id);
    setPeers(data || []);
  }

  function handleInvite(payload) {
    if (payload.eventType === 'INSERT') {
      setPendingInvite(payload.new);
    }
  }

  async function handleGameUpdate(payload) {
    if (payload.new?.status === 'active') {
      const game = payload.new;
      if (game.white_player_id === profile.id || game.black_player_id === profile.id) {
        const color = game.white_player_id === profile.id ? 'w' : 'b';
        setPlayerColor(color);
        setActiveGame(game);
        setPendingInvite(null);
      }
    } else if (payload.new?.status === 'finished' || payload.new?.status === 'cancelled') {
      if (activeGame?.id === payload.new.id) setActiveGame(null);
    } else if (activeGame && payload.new?.id === activeGame.id) {
      setActiveGame(payload.new);
    }
  }

  async function invitePeer(peer) {
    const { error } = await supabase.from('game_invitations').insert({
      from_player_id: profile.id,
      to_player_id: peer.id,
      group_id: groupId,
      status: 'pending',
    });
    if (!error) setOpponentName(peer.full_name);
  }

  async function acceptInvite() {
    if (!pendingInvite) return;
    // Create the game
    const { data: game } = await supabase.from('chess_games').insert({
      group_id: groupId,
      white_player_id: pendingInvite.from_player_id,
      black_player_id: profile.id,
      status: 'active',
    }).select().single();

    await supabase.from('game_invitations').update({ status: 'accepted' }).eq('id', pendingInvite.id);

    // Fetch inviter name
    const { data: inviter } = await supabase.from('profiles').select('full_name').eq('id', pendingInvite.from_player_id).single();
    setOpponentName(inviter?.full_name || 'יריב');
    setPlayerColor('b');
    setActiveGame(game);
    setPendingInvite(null);
  }

  async function declineInvite() {
    if (!pendingInvite) return;
    await supabase.from('game_invitations').update({ status: 'declined' }).eq('id', pendingInvite.id);
    setPendingInvite(null);
  }

  async function handleMove(fen, move) {
    if (!activeGame) return;
    const moves = [...(activeGame.moves || []), { from: move.from, to: move.to, san: move.san }];
    await supabase.from('chess_games').update({ fen, moves, updated_at: new Date().toISOString() }).eq('id', activeGame.id);
  }

  async function resignGame() {
    if (!activeGame) return;
    await supabase.from('chess_games').update({ status: 'finished', result: 'resign', winner_id: playerColor === 'w' ? activeGame.black_player_id : activeGame.white_player_id }).eq('id', activeGame.id);
    setActiveGame(null);
  }

  if (activeGame) return (
    <ChessGame
      onBack={() => { if (window.confirm('לוותר על המשחק?')) resignGame(); }}
      vsBot={false}
      gameData={activeGame}
      onMove={handleMove}
      playerColor={playerColor}
      playerName={profile.full_name}
    />
  );

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', margin: 0 }}>👥 משחק אונליין</h2>
        <button onClick={() => { fetchPeers(); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: 'white', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Varela Round, sans-serif', fontSize: 13 }}>🔄 רענן</button>
      </div>

      {/* Pending invite banner */}
      {pendingInvite && (
        <div style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 22, marginBottom: 12 }}>🎮 הזמנה למשחק!</div>
          <div style={{ color: 'white', fontFamily: 'Varela Round, sans-serif', marginBottom: 16 }}>מישהו מהקבוצה מזמין אותך לשחמט!</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={acceptInvite} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#48c78e', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>✅ בוא נשחק!</button>
            <button onClick={declineInvite} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>❌ לא עכשיו</button>
          </div>
        </div>
      )}

      <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif', marginBottom: 12 }}>
        חברים בקבוצה — לחץ על שם כדי להזמין:
      </div>

      {peers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40, fontFamily: 'Varela Round, sans-serif' }}>
          אין חברים בקבוצה כרגע 😕<br />בקש מהגננת להוסיף חברים!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {peers.map(peer => (
            <div key={peer.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: peer.is_online ? '#48c78e' : 'rgba(255,255,255,0.2)' }} />
                <span style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>{peer.full_name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Varela Round, sans-serif', fontSize: 12 }}>{peer.is_online ? 'מחובר' : 'לא מחובר'}</span>
              </div>
              <button onClick={() => invitePeer(peer)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: peer.is_online ? '#4cc9f0' : 'rgba(255,255,255,0.1)', color: 'white', cursor: peer.is_online ? 'pointer' : 'not-allowed', fontFamily: 'Fredoka One, sans-serif', fontSize: 15 }}>
                🎮 הזמן
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}