import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth.js';
import shpLogoWhite from '../assets/SHP/SHP_Logo_2025 white.png';

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

  return <TrackerV3 />;
}

/* ── PocketBase LED (header compact) ────────────────────── */
function PbLed() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(1500) });
        if (alive) setOnline(r.ok);
      } catch { if (alive) setOnline(false); }
    }
    check();
    const id = setInterval(check, 3000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const color = online === null ? '#94a3b8' : online ? '#22c55e' : '#ef4444';
  const label = online === null ? 'PB…' : online ? 'PocketBase' : 'PocketBase off';

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6,
                  padding:'3px 10px', borderRadius:6,
                  background:'#1e293b', border:'1px solid #334155' }}>
      <div style={{
        width:7, height:7, borderRadius:'50%', flexShrink:0,
        background: color,
        boxShadow: online ? `0 0 6px ${color}` : 'none',
        transition: 'background .4s, box-shadow .4s',
      }} />
      <span style={{ fontSize:11, fontWeight:600, color: online ? '#86efac' : '#94a3b8',
                     fontFamily:'sans-serif', whiteSpace:'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

/* ── PocketBase status + start/stop ───────────────────────── */
function PbControl() {
  const [online, setOnline] = useState(null); // null=checking, true=up, false=down
  const [busy,   setBusy]   = useState(false);
  const F = "'DM Sans','Inter',system-ui,sans-serif";

  useEffect(() => {
    let alive = true;
    async function check() {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(1500) });
        if (alive) setOnline(r.ok);
      } catch {
        if (alive) setOnline(false);
      }
    }
    check();
    const id = setInterval(check, 2000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      await fetch(online ? '/pb-control/stop' : '/pb-control/start', { method: 'POST' });
    } catch { /* ignore */ }
    setTimeout(() => setBusy(false), 1800);
  }

  const ledColor = online === null ? '#94a3b8' : online ? '#22c55e' : '#ef4444';
  const label    = online === null ? 'Vérification…'
                 : online          ? 'PocketBase · en ligne'
                 :                   'PocketBase · hors ligne';

  return (
    <div style={{ marginTop:20, padding:'11px 14px', background:'#f8fafc',
                  border:'1px solid #e2e8f0', borderRadius:10,
                  display:'flex', alignItems:'center', gap:10, fontFamily:F }}>
      {/* LED */}
      <div style={{
        width:9, height:9, borderRadius:'50%', flexShrink:0,
        background: ledColor,
        boxShadow: online ? `0 0 7px ${ledColor}` : 'none',
        transition: 'background .4s, box-shadow .4s',
      }} />
      <span style={{ fontSize:12, fontWeight:600, flex:1,
                     color: online ? '#15803d' : online === null ? '#64748b' : '#dc2626' }}>
        {label}
      </span>
      <button
        disabled={busy || online === null}
        onClick={toggle}
        style={{
          padding:'4px 13px', borderRadius:6, border:'none',
          cursor: (busy || online === null) ? 'not-allowed' : 'pointer',
          background: online ? '#fee2e2' : '#dcfce7',
          color:      online ? '#dc2626' : '#15803d',
          fontWeight:700, fontSize:11, fontFamily:F,
          opacity: (busy || online === null) ? 0.5 : 1,
          transition: 'all .2s',
        }}>
        {busy ? '…' : online ? '⏹ Stop' : '▶ Start'}
      </button>
    </div>
  );
}

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
    <div style={{ minHeight:'100vh', background:'#0F172A', fontFamily:F,
                  display:'grid', gridTemplateColumns:'1fr auto',
                  alignItems:'flex-start', overflow:'hidden' }}>

      {/* ── gauche : logo + branding ── */}
      <div style={{ padding:'52px 56px', display:'flex', flexDirection:'column',
                    gap:40, position:'relative', overflow:'hidden' }}>

        {/* halo décoratif derrière le logo */}
        <div style={{ position:'absolute', top:-80, left:-80, width:420, height:420,
                      borderRadius:'50%', background:'radial-gradient(circle, #A3103522 0%, transparent 70%)',
                      pointerEvents:'none' }} />

        {/* logo SHP */}
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <img src={shpLogoWhite} alt="SHP"
               style={{ width:260, objectFit:'contain', opacity:.97,
                        filter:'drop-shadow(0 4px 24px rgba(163,16,53,.35))' }} />
        </div>

        {/* séparateur */}
        <div style={{ width:48, height:3, borderRadius:2,
                      background:'linear-gradient(90deg,#A31035,#e11d4800)' }} />

        <div>
          <div style={{ fontSize:42, fontWeight:900, color:'#F8FAFC', lineHeight:1.05,
                        letterSpacing:-.8 }}>BuildTracker</div>
          <div style={{ fontSize:15, color:'#94a3b8', marginTop:10, fontWeight:500,
                        letterSpacing:.2 }}>
            Building C &nbsp;·&nbsp; 12W LOA
          </div>
        </div>

        <div style={{ marginTop:'auto', fontSize:11, color:'#334155', letterSpacing:.3 }}>
          © {new Date().getFullYear()} SHP · United Nations Geneva
        </div>
      </div>

      {/* ── droite : formulaire ── */}
      <div style={{ minHeight:'100vh', background:'#F8FAFC', width:380,
                    padding:'52px 36px', display:'flex', flexDirection:'column',
                    justifyContent:'flex-start', gap:0,
                    boxShadow:'-8px 0 40px rgba(0,0,0,.25)' }}>

        <div style={{ marginBottom:32 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#0F172A', letterSpacing:-.3 }}>
            Connexion
          </div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Meeting Minutes Tracker</div>
        </div>

        <form onSubmit={submit}>
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

        <PbControl />
      </div>
    </div>
  );
}
