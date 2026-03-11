import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';

// Importe le tracker existant (sera adapté pour utiliser useActions + useAuth)
// Pour l'instant on le sert tel quel
import TrackerV3 from '../tracker_v3.jsx';   // chemin relatif depuis src/

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                    height:'100vh', fontFamily:'sans-serif', color:'#64748b' }}>
        Chargement…
      </div>
    );
  }

  if (!user) return <LoginPage onSignIn={signIn} />;

  return (
    <>
      {/* Bandeau utilisateur */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 20px',
                    background:'#0f172a', color:'#e2e8f0', fontSize:13, fontFamily:'sans-serif' }}>
        <span style={{ flex:1 }}>
          <strong>{user.full_name}</strong>
          &nbsp;·&nbsp;
          <span style={{ color:'#94a3b8' }}>{user.org}</span>
          &nbsp;·&nbsp;
          <span style={{ color: user.role==='admin' ? '#f97316' :
                                 user.role==='editor'? '#22c55e' : '#94a3b8' }}>
            {user.role}
          </span>
        </span>
        <button
          onClick={signOut}
          style={{ background:'#1e293b', border:'1px solid #334155', color:'#cbd5e1',
                   padding:'3px 12px', borderRadius:5, cursor:'pointer', fontSize:12 }}>
          Déconnexion
        </button>
      </div>

      <TrackerV3 />
    </>
  );
}

/* ── Page de connexion ─────────────────────────────────────── */
function LoginPage({ onSignIn }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSignIn(email, password);
    } catch (err) {
      setError(err.message ?? 'Identifiants invalides');
    } finally {
      setBusy(false);
    }
  };

  const F = "'DM Sans','Inter',system-ui,sans-serif";

  return (
    <div style={{ minHeight:'100vh', background:'#F2F4F7', display:'flex',
                  alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <form onSubmit={submit}
            style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12,
                     padding:'40px 36px', width:340, boxShadow:'0 4px 24px #0001' }}>
        <div style={{ marginBottom:28, textAlign:'center' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'#A31035', letterSpacing:-.5 }}>
            Meeting Minutes
          </div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Building C – Tracker</div>
        </div>

        <label style={{ display:'block', marginBottom:16 }}>
          <span style={{ fontSize:12, color:'#64748b', fontWeight:600,
                         display:'block', marginBottom:6 }}>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                 required autoFocus
                 style={{ width:'100%', padding:'9px 12px', borderRadius:7,
                          border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box',
                          outline:'none', fontFamily:F }} />
        </label>

        <label style={{ display:'block', marginBottom:24 }}>
          <span style={{ fontSize:12, color:'#64748b', fontWeight:600,
                         display:'block', marginBottom:6 }}>Mot de passe</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                 required
                 style={{ width:'100%', padding:'9px 12px', borderRadius:7,
                          border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box',
                          outline:'none', fontFamily:F }} />
        </label>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
                        borderRadius:6, padding:'8px 12px', fontSize:13, marginBottom:16 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={busy}
                style={{ width:'100%', padding:'11px', background: busy ? '#94a3b8' : '#A31035',
                         color:'#fff', border:'none', borderRadius:8, fontSize:15,
                         fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer',
                         fontFamily:F, transition:'background .2s' }}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
