import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChessGame from './ChessGame';

export default function OnlineGame({ groupId, onBack }) {
  const { profile } = useAuth();
  const [peers, setPeers] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');

  useEffect(() => {
    fetchPeers();
    const channel = supabase.channel(`group-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_invitations', filter: `to_player_id=eq.${profile.id}` }, p => {
        if (p.eventType === 'INSERT') setPendingInvite(p.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chess_games', filter: `group_id=eq.${groupId}` }, p => {
        const g = p.new;
        if (g?.status === 'active' && (g.white_player_id === profile.id || g.black_player_id === profile.id)) {
          setPlayerColor(g.white_player_id === profile.id ? 'w' : 'b');
          setActiveGame(g); setPendingInvite(null);
        } else if ((g?.status === 'finished' || g?.status === 'cancelled') && activeGame?.id === g.id) {
          setActiveGame(null);
        } else if (activeGame && g?.id === activeGame.id) {
          setActiveGame(g);
        }
      }).subscribe();
    supabase.from('profiles').update({ is_online: true }).eq('id', profile.id);
    return () => { supabase.removeChannel(channel); supabase.from('profiles').update({ is_online: false }).eq('id', profile.id); };
  }, [groupId]);

  async function fetchPeers() {
    const { data } = await supabase.from('profiles').select('id,full_name,is_online')
      .eq('group_id', groupId).eq('is_approved', true).neq('id', profile.id);
    setPeers(data || []);
  }

  async function invitePeer(peer) {
    await supabase.from('game_invitations').insert({ from_player_id: profile.id, to_player_id: peer.id, group_id: groupId, status: 'pending' });
  }

  async function acceptInvite() {
    if (!pendingInvite) return;
    const { data: game } = await supabase.from('chess_games').insert({
      group_id: groupId, white_player_id: pendingInvite.from_player_id,
      black_player_id: profile.id, status: 'active'
    }).select().single();
    await supabase.from('game_invitations').update({ status: 'accepted' }).eq('id', pendingInvite.id);
    setPlayerColor('b'); setActiveGame(game); setPendingInvite(null);
  }

  async function declineInvite() {
    if (!pendingInvite) return;
    await supabase.from('game_invitations').update({ status: 'declined' }).eq('id', pendingInvite.id);
    setPendingInvite(null);
  }

  async function handleMove(fen, move) {
    if (!activeGame) return;
    const moves = [...(activeGame.moves || []), { from: move.from, to: move.to, san: move.san }];
    await supabase.from('chess_games').update({ fen, moves }).eq('id', activeGame.id);
  }

  async function resignGame() {
    if (!activeGame) return;
    await supabase.from('chess_games').update({ status: 'finished', result: 'resign', winner_id: playerColor === 'w' ? activeGame.black_player_id : activeGame.white_player_id }).eq('id', activeGame.id);
    setActiveGame(null);
  }

  if (activeGame) return (
    <ChessGame onBack={() => { if (window.confirm('שזמקה כלר המשחק?')) resignGame(); }}
      vsBot={false} gameData={activeGame} onMove={handleMove} playerColor={playerColor} />
  );

  return (
    <div style={{ padding: 20, direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', margin: 0 }}>👥 משחק אונליין</h2>
        <button onClick={fetchPeers} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: 'white', padding: '8px 14px', cursor: 'pointer' }}>🔄 רענ</button>
      </div>
      {pendingInvite && (<div style={{ background: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'center' }}><div style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 22, marginBottom: 12 }}>🎮 ששםק ןזתתכ!</div><div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={acceptInvite} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#48c78e', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>✅  בות חסם!</button><button onClick={declineInvite} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>❌ לא חסי</button></div></div> !== true)}
      <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>חברים בקבוצה ב� — לחץ על שו כד להזׄים:</div>
      {peers.length === 0 ? (<div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>אים ןברים בקבוצה יעע 😕<br />בקש מהגננת להוסי ןברים!</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{peers.map(peer => (<div key={peer.id} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: peer.is_online ? '#48c78e' : 'rgba(255,255,255,0.2)' }} /><span style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 18 }}>{peer.full_name}</span></div><button onClick={() => invitePeer(peer)} style={{ padding: '8px 18px', borderRadius: 10, border: 'none', background: peer.is_online ? '#4cc9f0' : 'rgba(255,255,255,0.1)', color: 'white', cursor: peer.is_online ? 'pointer' : 'not-allowed', fontFamily: 'Fredoka One, sans-serif', fontSize: 15 }}>🎮 משחק</button></div>))}</div>) }
    </div>
  );
}
