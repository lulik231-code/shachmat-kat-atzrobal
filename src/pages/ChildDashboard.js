import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChessGame from '../components/ChessGame';
import OnlineGame from '../components/OnlineGame';

export default function ChildDashboard() {
  const { signOut, profile } = useAuth();
  const [mode, setMode] = useState('home'); // home | bot | online

  if (!profile.is_approved) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h2 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 28 }}>ממתינה לאישור</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif' }}>הגננת שלך עדיין לא אישרה את ההרשמה. שאל/י אותה שתאשר!</p>
        <button onClick={signOut} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#f4a261', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>יציאה</button>
      </div>
    </div>
  );

  if (profile.is_suspended) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: '#f72585', fontFamily: 'Fredoka One, sans-serif', fontSize: 28 }}>החשבון מושהה</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif' }}>דבר עם הגננת שלך.</p>
        <button onClick={signOut} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#f4a261', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>יציאה</button>
      </div>
    </div>
  );

  if (mode === 'bot') return <ChessGame onBack={() => setMode('home')} vsBot={true} />;

  if (mode === 'online') {
    if (!profile.group_id) return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👥</div>
          <h2 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 24 }}>עדיין לא בקבוצה</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif' }}>בקש מהגננת שלך להכניס אותך לקבוצה כדי לשחק עם חברים!</p>
          <button onClick={() => setMode('home')} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: '#4cc9f0', color: 'white', cursor: 'pointer', fontFamily: 'Fredoka One, sans-serif', fontSize: 16 }}>← חזרה</button>
        </div>
      </div>
    );
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e, #0f3460)', direction: 'rtl', padding: 20 }}>
        <button onClick={() => setMode('home')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, color: 'white', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Varela Round, sans-serif', marginBottom: 16 }}>← חזרה</button>
        <OnlineGame groupId={profile.group_id} onBack={() => setMode('home')} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, direction: 'rtl' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 72, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>♟️</div>
        <h1 style={{ color: '#ffd700', fontFamily: 'Fredoka One, sans-serif', fontSize: 36, margin: '8px 0 4px' }}>שלום, {profile.full_name}! 👋</h1>
        <p style={{ color: '#a0c4ff', fontFamily: 'Varela Round, sans-serif', fontSize: 16, margin: 0 }}>
          גן {profile.kindergarten_name} {profile.group_id ? '🌟' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 320 }}>
        <button onClick={() => setMode('bot')}
          style={{ padding: '24px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg, #4cc9f0, #4361ee)', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transition: 'transform 0.15s' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
          <div style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 24 }}>שחק נגד רובוט</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif', fontSize: 14, marginTop: 4 }}>תתאמן לבד בכל זמן!</div>
        </button>

        <button onClick={() => setMode('online')}
          style={{ padding: '24px', borderRadius: 20, border: 'none', background: profile.group_id ? 'linear-gradient(135deg, #48c78e, #06a77d)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transition: 'transform 0.15s' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
          <div style={{ color: 'white', fontFamily: 'Fredoka One, sans-serif', fontSize: 24 }}>שחק עם חברים</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Varela Round, sans-serif', fontSize: 14, marginTop: 4 }}>
            {profile.group_id ? 'משחק אונליין עם הקבוצה!' : 'בקש מהגננת להכניס אותך לקבוצה'}
          </div>
        </button>
      </div>

      <button onClick={signOut} style={{ marginTop: 32, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Varela Round, sans-serif', fontSize: 14 }}>
        יציאה
      </button>

      <style>{`button:hover { transform: translateY(-3px) !important; }`}</style>
    </div>
  );
}