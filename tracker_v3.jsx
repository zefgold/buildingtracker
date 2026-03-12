import { useState, useMemo, useRef, useEffect } from "react";
import { useSession } from "./src/hooks/useSession";
import { useAuth } from "./src/hooks/useAuth";
import { useActions } from "./src/hooks/useActions";
import { importFromExcel, exportToExcel } from "./src/lib/excelIO";
import * as XLSX from 'xlsx';
import shpLogo from "./assets/SHP/SHP_Logo_2025.png";

/* ─── PbBottomStatus : LED + start/stop pour la bottom bar ─── */
function PbBottomStatus(){
  const [online,setOnline]=useState(null);
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let alive=true;
    async function check(){
      try{ const r=await fetch('/api/health',{signal:AbortSignal.timeout(1500)}); if(alive)setOnline(r.ok); }
      catch{ if(alive)setOnline(false); }
    }
    check();
    const id=setInterval(check,3000);
    return()=>{ alive=false; clearInterval(id); };
  },[]);
  async function pbToggle(){
    setBusy(true);
    try{ await fetch(online?'/pb-control/stop':'/pb-control/start',{method:'POST'}); }
    catch{}
    setTimeout(()=>setBusy(false),1800);
  }
  const col=online===null?'#94a3b8':online?'#22c55e':'#ef4444';
  const lbl=online===null?'PocketBase…':online?'PocketBase · en ligne':'PocketBase · hors ligne';
  return(
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <div style={{width:7,height:7,borderRadius:'50%',background:col,
        boxShadow:online?`0 0 6px ${col}`:'none',transition:'background .4s,box-shadow .4s',flexShrink:0}}/>
      <span style={{fontSize:11,fontWeight:600,color:online?'#86efac':'#94a3b8',
        fontFamily:'monospace',whiteSpace:'nowrap'}}>{lbl}</span>
      <button
        disabled={busy||online===null}
        onClick={pbToggle}
        style={{padding:'3px 10px',borderRadius:5,
          border:`1px solid ${online?'#ef444466':'#22c55e66'}`,
          cursor:(busy||online===null)?'not-allowed':'pointer',
          background:online?'#450a0a':'#052e16',
          color:online?'#fca5a5':'#86efac',
          fontWeight:700,fontSize:10,fontFamily:'monospace',
          opacity:(busy||online===null)?.5:1,transition:'all .2s'}}>
        {busy?'…':online?'⏹ Stop':'▶ Start'}
      </button>
    </div>
  );
}

/* ─── DEV OVERLAY — tag definitions ─────────────────────────────────────── */
const DEV_TAGS = [
  {tag:'div',    color:'#3b82f6'},
  {tag:'header', color:'#f97316'},
  {tag:'main',   color:'#c084fc'},
  {tag:'section',color:'#a3e635'},
  {tag:'form',   color:'#34d399'},
  {tag:'nav',    color:'#fbbf24'},
  {tag:'aside',  color:'#f87171'},
  {tag:'footer', color:'#94a3b8'},
];

/* ─── BRAND ──────────────────────────────────────────────────────────────── */
// SHP crimson + UN blue
const BRAND = { shp:"#A31035", shpDark:"#7A0C26", shpLight:"#C4184A", shpBg:"#FDF0F3", shpBorder:"#F0ABBE", un:"#009EDB", unDark:"#007BB5", unBg:"#E6F6FD", unBorder:"#80CFEE" };

/* ─── TOKENS ─────────────────────────────────────────────────────────────── */
const C = {
  bg:"#F2F4F7", surface:"#FFFFFF", surfaceHover:"#F8FAFC",
  border:"#E2E8F0", borderFocus:"#94A3B8",
  text:"#0F172A", textMid:"#475569", textMuted:"#94A3B8", textDim:"#CBD5E1",
  blue:"#009EDB", blueBg:"#E6F6FD", blueBorder:"#80CFEE",
  TOP:"#EF4444", TOPbg:"#FEF2F2", TOPborder:"#FECACA",
  High:"#F97316", Highbg:"#FFF7ED", Highborder:"#FED7AA",
  Medium:"#EAB308", Mediumbg:"#FEFCE8", Mediumborder:"#FEF08A",
  Low:"#22C55E", Lowbg:"#F0FDF4", Lowborder:"#BBF7D0",
  openColor:"#2563EB", openBg:"#EFF6FF",
  closedColor:"#16A34A", closedBg:"#F0FDF4",
  actionColor:"#EA580C", actionBg:"#FFF7ED",
  infoColor:"#64748B", infoBg:"#F8FAFC",
  present:"#16A34A", presentBg:"#F0FDF4", presentBorder:"#BBF7D0",
  absent:"#DC2626",  absentBg:"#FEF2F2",  absentBorder:"#FECACA",
  excused:"#D97706", excusedBg:"#FFFBEB", excusedBorder:"#FDE68A",
};
const F = "'DM Sans','Inter',system-ui,sans-serif";
const M = "'DM Mono','JetBrains Mono',monospace";

/* ─── MASTER PARTICIPANTS LIST ───────────────────────────────────────────── */
const MASTER_PARTICIPANTS = [
  { id:"p01", name:"Lorenzo Barnini",           org:"RPN",   role:"Project Manager (PM)" },
  { id:"p02", name:"Matteo Naldi",              org:"RPN",   role:"Construction Manager" },
  { id:"p03", name:"Jessica Donatelli",         org:"RPN",   role:"Cost Control Manager" },
  { id:"p04", name:"Federica Brunone",          org:"RPN",   role:"Engineering Chief & Move Manager" },
  { id:"p05", name:"Chiara Re Depaolini",       org:"RPN",   role:"Arch Design Specialist" },
  { id:"p06", name:"Simone Conti",              org:"RPN",   role:"Schedule Manager" },
  { id:"p07", name:"Martina Maffioletti",       org:"RPN",   role:"Move Specialist / Doc Controller" },
  { id:"p08", name:"Hacir Degirmencioglu",      org:"RPN",   role:"Electrical Engineer" },
  { id:"p09", name:"Leonardo Valentinotti",     org:"RPN",   role:"Deputy Quality Manager" },
  { id:"p10", name:"MariaCristina Menozzi",     org:"RPN",   role:"HSE & Security Manager" },
  { id:"p11", name:"Zeynep Onen",               org:"SHP",   role:"Architectural Manager" },
  { id:"p12", name:"Neil Bradley",              org:"SHP",   role:"Chief Design and Construction" },
  { id:"p13", name:"Patrick Fowler",            org:"SHP",   role:"Project Manager (PM)" },
  { id:"p14", name:"Cedric Kusendova",          org:"SHP",   role:"MEP Manager" },
  { id:"p15", name:"Maryna Chernova",           org:"SHP",   role:"Change Manager" },
  { id:"p16", name:"Jean-Mathieu Ferre",        org:"SHP",   role:"Design Manager (DM)" },
  { id:"p17", name:"Kateryna Starykova",        org:"SHP",   role:"Senior Electrical Engineer" },
  { id:"p18", name:"Benoit Renault",            org:"SHP",   role:"Senior Electrical Engineer" },
  { id:"p19", name:"Didier Dequatre",           org:"SHP",   role:"Quality Manager" },
  { id:"p20", name:"Cedric Erard",              org:"SOMBP", role:"MEP Manager" },
  { id:"p21", name:"Lucille Treille de Grandsaigne", org:"SOMBP", role:"Architect" },
  { id:"p22", name:"Rosario Marino",            org:"SOMBP", role:"Architect" },
];

const ORGS = ["RPN","SHP","SOMBP","G&T"];
const ORG_COLORS = { RPN:"#009EDB", SHP:"#A31035", SOMBP:"#7C3AED", "G&T":"#0D9488" };

/* ─── ACTION DATA ────────────────────────────────────────────────────────── */
const PRIORITIES = ["TOP","High","Medium","Low"];
const STATUSES   = ["OPEN","CLOSED"];
const PRIO_ORDER = {TOP:0,High:1,Medium:2,Low:3};
const TODAY      = new Date("2026-03-11");
function overdue(d){ return d && new Date(d)<TODAY; }
function fmt(d){ if(!d)return "—"; return new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}); }
function initials(n){ return n.split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase(); }

const SEED_ACTIONS = [
  { id:1, section:"C2", topic:"GENERAL", title:"Substantial Completion", type:"INFO", status:"OPEN", priority:"High", due:"2026-03-06", org:"RPN", owner:"Simone Conti",
    log:[
      { id:101,week:7, date:"2026-02-11",org:"RPN",author:"Simone Conti",   type:"note",  text:"SC pending EGGTELSA manpower. 8-10 people missing on site." },
      { id:102,week:9, date:"2026-02-25",org:"RPN",author:"Lorenzo Barnini",type:"note",  text:"Official S.C. 24.04 confirmed — no exclusions." },
    ]},
  { id:2, section:"C2", topic:"GENERAL", title:"Fire Matrix", type:"INFO", status:"OPEN", priority:"TOP", due:"2026-03-05", org:"RPN", owner:"Federica Brunone",
    log:[
      { id:201,week:1, date:"2025-12-03",org:"RPN",  author:"Federica Brunone",  type:"note",  text:"Meeting took place with SBIS / ENERGY MANAGEMENT." },
      { id:202,week:1, date:"2025-12-03",org:"RPN",  author:"Federica Brunone",  type:"note",  text:"EGGTELSA needs 2 months of works after Fire Matrix is approved." },
      { id:203,week:2, date:"2025-12-09",org:"SOMBP",author:"Cedric Erard",      type:"note",  text:"ENERGY MANAGEMENT provided info — pending SBIS response." },
      { id:204,week:5, date:"2026-01-07",org:"RPN",  author:"Federica Brunone",  type:"note",  text:"Fire Matrix uploaded on PMweb. MEP approved as noted." },
      { id:205,week:6, date:"2026-01-14",org:"SHP",  author:"Jean-Mathieu Ferre",type:"note",  text:"Approved as noted — some doors still missing." },
      { id:206,week:8, date:"2026-02-17",org:"RPN",  author:"Federica Brunone",  type:"note",  text:"Fire Matrix revised version uploaded." },
      { id:207,week:9, date:"2026-02-25",org:"RPN",  author:"Federica Brunone",  type:"change",text:"Phase 14 comments uploaded. Status R&R.", field:"status", from:"PENDING",to:"R&R" },
    ]},
  { id:3, section:"C2", topic:"LIFTS", title:"Lift 5, 6, 23 – Platform C6, C5", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-02-18", org:"RPN", owner:"Matteo Naldi",
    log:[
      { id:301,week:5, date:"2026-01-07",org:"RPN",author:"Gianluca Crippa",type:"note",  text:"Lift 6 strip-out completed. Installation to start 26.01." },
      { id:302,week:7, date:"2026-01-28",org:"RPN",author:"Matteo Naldi",   type:"owner", text:"Ownership transferred.", from:"Gianluca Crippa",to:"Matteo Naldi" },
      { id:303,week:7, date:"2026-02-11",org:"RPN",author:"Matteo Naldi",   type:"note",  text:"RPN to check if Platform C5 is working." },
    ]},
  { id:4, section:"C2", topic:"GENERAL", title:"Windows – NCF 382", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-02-27", org:"RPN/SHP", owner:"Davide Cirillo",
    log:[
      { id:401,week:8, date:"2026-02-18",org:"RPN",author:"Davide Cirillo",  type:"note", text:"NCF 382 raised. ~40 windows affected. Powder coating cracking." },
      { id:402,week:9, date:"2026-02-25",org:"SHP",author:"Didier Dequatre", type:"note", text:"Supplier visited site. Manufacturer inspection planned +/- 03.03." },
    ]},
  { id:5, section:"C2", topic:"LB01", title:"Salle C6 – Interpreter Booth", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-03-11", org:"SHP", owner:"Kateryna Starykova",
    log:[
      { id:501,week:8, date:"2026-02-18",org:"SHP",author:"Jean-Mathieu Ferre", type:"note",  text:"Acoustic test to be launched as soon as doors are installed." },
      { id:502,week:9, date:"2026-02-25",org:"SHP",author:"Kateryna Starykova", type:"owner", text:"Ownership confirmed.", from:"Jean-Mathieu Ferre",to:"Kateryna Starykova" },
    ]},
  { id:6, section:"C3", topic:"T&C", title:"PMP Submittal", type:"ACTION", status:"OPEN", priority:"High", due:"2026-02-09", org:"RPN", owner:"Leonardo Valentinotti",
    log:[
      { id:601,week:6, date:"2026-01-26",org:"RPN",author:"Leonardo Valentinotti",type:"note", text:"RPN to ensure 80% of PMP submitted by 09.02." },
      { id:602,week:7, date:"2026-02-04",org:"RPN",author:"Leonardo Valentinotti",type:"note", text:"Submission at 65% — additional push required." },
    ]},
  { id:7, section:"NCF", topic:"NCF 382", title:"Windows – NCF", type:"ACTION", status:"OPEN", priority:"High", due:"2026-02-03", org:"RPN/SHP", owner:"Davide Cirillo",
    log:[
      { id:701,week:9, date:"2026-03-04",org:"RPN",author:"Davide Cirillo",type:"note", text:"RPN to assess situation following manufacturer site visit." },
    ]},
  { id:8, section:"C1", topic:"HSE", title:"Fire Closure – Level 4 & 5", type:"ACTION", status:"CLOSED", priority:"TOP", due:"2026-01-28", org:"RPN", owner:"Matteo Naldi",
    log:[
      { id:801,week:6, date:"2026-01-28",org:"RPN",author:"Matteo Naldi",type:"change",text:"Works completed and verified.", field:"status",from:"OPEN",to:"CLOSED" },
    ]},
];

const ALL_OWNERS = [...new Set([...MASTER_PARTICIPANTS.map(p=>p.name),...SEED_ACTIONS.flatMap(i=>i.log.map(l=>l.author))])].sort();

/* ─── HELPERS ────────────────────────────────────────────────────────────── */
function Avatar({name,org,size=26}){
  const col = ORG_COLORS[org] || "#3B82F6";
  return <div style={{width:size,height:size,borderRadius:"50%",background:col+"20",
    border:`1.5px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",
    flexShrink:0,color:col,fontSize:size*.36,fontWeight:700,fontFamily:F}}>{initials(name)}</div>;
}
function OrgPill({org}){
  const col = ORG_COLORS[org] || C.textMuted;
  return <span style={{fontFamily:M,fontSize:10,fontWeight:700,color:col,
    background:col+"18",padding:"2px 7px",borderRadius:4,border:`1px solid ${col}33`}}>{org}</span>;
}
function Badge({label,bg,color,border,size=11}){
  return <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",
    borderRadius:4,background:bg,border:`1px solid ${border}`,color,fontSize:size,
    fontWeight:600,fontFamily:F,letterSpacing:.2,whiteSpace:"nowrap"}}>{label}</span>;
}
function PBadge({p}){
  return <Badge label={p} bg={C[p+"bg"]} color={C[p]} border={C[p+"border"]} />;
}

/* ─── STEP INDICATOR ─────────────────────────────────────────────────────── */
function StepBar({step, maxStep, onNavigate}){
  const steps=[{n:1,label:"Session"},{n:2,label:"Participants"},{n:3,label:"Actions"}];
  return (
    <div style={{display:"flex",alignItems:"center",gap:0}}>
      {steps.map((s,i)=>{
        const reachable = onNavigate && s.n <= maxStep;
        return (
          <div key={s.n} style={{display:"flex",alignItems:"center"}}>
            <div
              onClick={reachable ? ()=>onNavigate(s.n) : undefined}
              style={{display:"flex",alignItems:"center",gap:7,
                cursor:reachable?"pointer":"default",
                opacity:s.n>maxStep?.45:1,
                transition:"opacity .2s"}}
              title={reachable?`Aller à ${s.label}`:undefined}>
              <div style={{width:24,height:24,borderRadius:"50%",
                background:step>=s.n?BRAND.shp:"#1E293B",
                border:`1.5px solid ${step>=s.n?BRAND.shp:"#334155"}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .2s",
                boxShadow:step===s.n?`0 0 0 3px ${BRAND.shp}33`:"none"}}>
                {step>s.n
                  ? <span style={{color:"#fff",fontSize:11}}>✓</span>
                  : <span style={{color:step===s.n?"#fff":"#475569",fontSize:10,fontWeight:700}}>{s.n}</span>}
              </div>
              <span style={{fontFamily:F,fontSize:12,fontWeight:600,
                color:step===s.n?"#F8FAFC":step>s.n?"#94A3B8":"#475569",
                transition:"color .2s"}}>{s.label}</span>
            </div>
            {i<steps.length-1 && (
              <div style={{width:32,height:1.5,background:step>s.n?BRAND.shp:"#1E293B",margin:"0 10px",transition:"background .2s"}} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 1 — SESSION SETUP
═══════════════════════════════════════════════════════════════════════════ */
function SessionSetup({onNext, saving, saveError}){
  function isoWeek(dateStr){
    if(!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const w1 = new Date(d.getFullYear(), 0, 4);
    return String(1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7));
  }
  function addDays(dateStr, n){
    if(!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  const today = new Date().toISOString().slice(0,10);
  const [form,setForm]=useState(()=>({
    date: today,
    week: isoWeek(today),
    location:"Building C - R005",
    type:"PRODUCTION",
    section:"C",
    nextMeeting: addDays(today, 7),
  }));

  function f(k){ return e => {
    const val = e.target.value;
    if(k === "date"){
      setForm(p=>({...p, date:val, week:isoWeek(val), nextMeeting:addDays(val, 7)}));
    } else {
      setForm(p=>({...p, [k]:val}));
    }
  }; }

  const editableFields=[
    {k:"type",        l:"Meeting Type", type:"text", ph:"PRODUCTION"},
    {k:"location",    l:"Location",     type:"text", ph:"Building C - R005"},
    {k:"nextMeeting", l:"Next Meeting", type:"date"},
  ];
  const inputStyle={width:"100%",padding:"9px 12px",border:`1px solid ${C.border}`,
    borderRadius:7,fontFamily:F,fontSize:13,color:C.text,outline:"none",
    boxSizing:"border-box",background:C.bg,textAlign:"center"};
  const labelStyle={fontFamily:F,fontSize:11,fontWeight:700,color:C.textMuted,
    letterSpacing:.5,display:"block",marginBottom:5,textAlign:"center"};
  return (
    <div style={{maxWidth:520,margin:"0 auto"}}>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:6}}>Session Setup</h2>
        <p style={{fontFamily:F,fontSize:13,color:C.textMid}}>Configure the meeting details before filling in participants.</p>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

          {/* Section — pleine largeur */}
          <div style={{gridColumn:"1 / -1"}}>
            <label style={labelStyle}>SECTION</label>
            <select value={form.section} onChange={f("section")} style={{...inputStyle,cursor:"pointer"}}>
              {["A","AB","AC","E","C","S1","S2","TEMPUS"].map(s=>(
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date (éditable) */}
          <div>
            <label style={labelStyle}>DATE</label>
            <input type="date" value={form.date} onChange={f("date")} style={inputStyle}
              onFocus={e=>e.target.style.borderColor=C.blue}
              onBlur={e=>e.target.style.borderColor=C.border} />
          </div>

          {/* Week (calculé, lecture seule) */}
          <div>
            <label style={labelStyle}>WEEK NO.</label>
            <div style={{...inputStyle, background:"#F8FAFC", color:C.textMid,
              border:`1px solid ${C.border}`, display:"flex", alignItems:"center",
              justifyContent:"center", gap:6, userSelect:"none"}}>
              <span style={{fontFamily:M,fontSize:15,fontWeight:700,color:C.text}}>{form.week}</span>
              <span style={{fontSize:10,color:C.textMuted,fontStyle:"italic"}}>auto</span>
            </div>
          </div>

          {/* Champs éditables restants */}
          {editableFields.map(({k,l,type,ph})=>(
            <div key={k}>
              <label style={labelStyle}>{l.toUpperCase()}</label>
              <input type={type||"text"} value={form[k]} onChange={f(k)} placeholder={ph}
                style={inputStyle}
                onFocus={e=>e.target.style.borderColor=C.blue}
                onBlur={e=>e.target.style.borderColor=C.border} />
            </div>
          ))}
        </div>
        {saveError && (
          <p style={{fontFamily:F,fontSize:12,color:C.absent,marginBottom:10,padding:"8px 12px",
            background:C.absentBg,borderRadius:6,border:`1px solid ${C.absentBorder}`}}>
            ⚠ {saveError}
          </p>
        )}
        <button onClick={()=>onNext(form)} disabled={saving}
          style={{width:"100%",padding:"11px",border:"none",borderRadius:8,background:BRAND.shp,
            color:"#fff",fontFamily:F,fontSize:13,fontWeight:700,
            cursor:saving?"not-allowed":"pointer",opacity:saving?.65:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {saving ? "Saving…" : "Continue to Participants →"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STEP 2 — PARTICIPANTS
═══════════════════════════════════════════════════════════════════════════ */
const STATUS_CONFIG = {
  PRESENT: { label:"Present", color:C.present, bg:C.presentBg, border:C.presentBorder, icon:"✓" },
  ABSENT:  { label:"Absent",  color:C.absent,  bg:C.absentBg,  border:C.absentBorder,  icon:"✕" },
  EXCUSED: { label:"Excused", color:C.excused, bg:C.excusedBg, border:C.excusedBorder, icon:"~" },
};

function ParticipantsStep({session, onNext, onBack, saving, saveError, fetchAllParticipants}){
  const [participants, setParticipants] = useState([]);
  const [initLoading, setInitLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState({name:"",org:"RPN",role:"",attendance:"PRESENT",substitute:""});
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});

  // Charger la liste unique de tous les participants passés
  useEffect(() => {
    fetchAllParticipants()
      .then(historical => {
        const masterByName = new Map(MASTER_PARTICIPANTS.map(p => [p.name.toLowerCase(), p]));
        const base = historical.length > 0 ? historical : MASTER_PARTICIPANTS;
        const list = base.map((p, i) => {
          const master = masterByName.get(p.name.toLowerCase());
          return {
            id:          master?.id ?? `hist_${i}`,
            name:        p.name,
            org:         p.org || master?.org || '',
            role:        master?.role ?? '',
            attendance:  'PRESENT',
            substitute:  '',
          };
        });
        // Tri : ordre ORGS puis alphabétique
        list.sort((a, b) => {
          const oa = ORGS.indexOf(a.org), ob = ORGS.indexOf(b.org);
          if (oa !== ob) return (oa === -1 ? 99 : oa) - (ob === -1 ? 99 : ob);
          return a.name.localeCompare(b.name);
        });
        setParticipants(list);
      })
      .catch(() => {
        // fallback statique si la DB est inaccessible
        setParticipants(MASTER_PARTICIPANTS.map(p => ({ ...p, attendance: 'PRESENT', substitute: '' })));
      })
      .finally(() => setInitLoading(false));
  }, [fetchAllParticipants]);

  function setAttendance(id, val){
    setParticipants(p=>p.map(x=>x.id===id?{...x,attendance:val}:x));
  }
  function setSubstitute(id, val){
    setParticipants(p=>p.map(x=>x.id===id?{...x,substitute:val}:x));
  }
  function addParticipant(){
    if(!draft.name) return;
    setParticipants(p=>[...p,{...draft,id:"tmp_"+Date.now()}]);
    setDraft({name:"",org:"RPN",role:"",attendance:"PRESENT",substitute:""});
    setAddMode(false);
  }
  function remove(id){
    setParticipants(p=>p.filter(x=>x.id!==id));
  }

  const byOrg = useMemo(()=>{
    const filtered = search
      ? participants.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.role.toLowerCase().includes(search.toLowerCase()))
      : participants;
    return ORGS.reduce((acc,org)=>{
      const group = filtered.filter(p=>p.org===org);
      if(group.length) acc[org]=group;
      return acc;
    },{});
  },[participants,search]);

  const counts = useMemo(()=>({
    present: participants.filter(p=>p.attendance==="PRESENT").length,
    absent:  participants.filter(p=>p.attendance==="ABSENT").length,
    excused: participants.filter(p=>p.attendance==="EXCUSED").length,
  }),[participants]);

  if (initLoading) return (
    <div style={{maxWidth:860,margin:"0 auto",padding:"60px 0",textAlign:"center",
      color:C.textMid,fontFamily:F,fontSize:14}}>
      Chargement des participants…
    </div>
  );

  return (
    <div style={{maxWidth:860,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:4}}>Participants</h2>
          <p style={{fontFamily:F,fontSize:13,color:C.textMid}}>
            Week {session.week} · {new Date(session.meeting_date).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}
          </p>
        </div>
        {/* summary pills */}
        <div style={{display:"flex",gap:8}}>
          {Object.entries(counts).map(([k,v])=>{
            const cfg=STATUS_CONFIG[k.toUpperCase()];
            return <div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",
              borderRadius:8,background:cfg.bg,border:`1px solid ${cfg.border}`}}>
              <span style={{fontFamily:M,fontSize:16,fontWeight:700,color:cfg.color}}>{v}</span>
              <span style={{fontFamily:F,fontSize:11,color:cfg.color,fontWeight:600}}>{cfg.label}</span>
            </div>;
          })}
        </div>
      </div>

      {/* search + add */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <div style={{position:"relative",flex:1}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:13}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter participants…"
            style={{width:"100%",padding:"7px 10px 7px 30px",border:`1px solid ${C.border}`,
              borderRadius:7,fontFamily:F,fontSize:13,color:C.text,background:C.bg,
              outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.blue}
            onBlur={e=>e.target.style.borderColor=C.border} />
        </div>
        <button onClick={()=>setAddMode(v=>!v)}
          style={{padding:"7px 16px",border:`1px solid ${addMode?C.blue:C.border}`,borderRadius:7,
            background:addMode?C.blueBg:C.surface,color:addMode?C.blue:C.textMid,
            fontFamily:F,fontSize:12,fontWeight:600,cursor:"pointer"}}>
          + Add participant
        </button>
      </div>

      {/* add form */}
      {addMode && (
        <div style={{background:C.blueBg,border:`1.5px solid ${C.blueBorder}`,borderRadius:10,
          padding:"14px 16px",marginBottom:16,display:"grid",
          gridTemplateColumns:"1fr 80px 1fr auto",gap:10,alignItems:"end"}}>
          {[["name","Name","text"],["org","Org","select"],["role","Role / Function","text"]].map(([k,l,t])=>(
            <div key={k}>
              <label style={{fontFamily:F,fontSize:10,fontWeight:700,color:C.textMuted,
                letterSpacing:.5,display:"block",marginBottom:4}}>{l.toUpperCase()}</label>
              {t==="select"?(
                <select value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
                  style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,
                    borderRadius:6,fontFamily:F,fontSize:13,color:C.text}}>
                  {ORGS.map(o=><option key={o}>{o}</option>)}
                </select>
              ):(
                <input value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
                  placeholder={l} style={{width:"100%",padding:"7px 9px",
                    border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:13,
                    color:C.text,boxSizing:"border-box"}} />
              )}
            </div>
          ))}
          <div style={{display:"flex",gap:6}}>
            <button onClick={addParticipant}
              style={{padding:"7px 14px",border:"none",borderRadius:6,background:C.blue,
                color:"#fff",fontFamily:F,fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button>
            <button onClick={()=>setAddMode(false)}
              style={{padding:"7px 10px",border:`1px solid ${C.border}`,borderRadius:6,
                background:"none",color:C.textMuted,fontFamily:F,fontSize:12,cursor:"pointer"}}>✕</button>
          </div>
        </div>
      )}

      {/* participants table by org */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
        {/* table header */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px 200px 180px 36px",
          padding:"8px 16px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`}}>
          {["Name / Role","Org","Attendance","Substitute (if absent)",""].map(h=>(
            <span key={h} style={{fontFamily:F,fontSize:10,fontWeight:700,
              color:C.textMuted,letterSpacing:.5}}>{h}</span>
          ))}
        </div>

        {Object.entries(byOrg).map(([org,people])=>{
          const orgColor = ORG_COLORS[org] || C.textMuted;
          const isOpen = !collapsed[org];
          const presentCount = people.filter(p=>p.attendance==="PRESENT").length;
          const absentCount  = people.filter(p=>p.attendance==="ABSENT").length;
          const excusedCount = people.filter(p=>p.attendance==="EXCUSED").length;

          return (
          <div key={org}>
            {/* org accordion header */}
            <button onClick={()=>setCollapsed(c=>({...c,[org]:!c[org]}))}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
                background:isOpen?"#FAFBFD":"#F8FAFC",borderBottom:`1px solid ${C.border}`,
                border:"none",borderTop:`2px solid ${orgColor}`,cursor:"pointer",textAlign:"left",
                transition:"background .15s"}}>

              {/* chevron */}
              <div style={{width:20,height:20,borderRadius:5,
                background:isOpen?orgColor+"18":C.border,
                border:`1.5px solid ${isOpen?orgColor+"44":C.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                flexShrink:0,transition:"all .2s"}}>
                <span style={{color:isOpen?orgColor:C.textMuted,fontSize:9,fontWeight:700,
                  display:"inline-block",transform:isOpen?"rotate(90deg)":"rotate(0deg)",
                  transition:"transform .2s"}}>▶</span>
              </div>

              {/* org pill */}
              <OrgPill org={org} />

              {/* counts */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:4}}>
                {presentCount>0 && <span style={{fontFamily:F,fontSize:11,fontWeight:600,
                  color:C.present,background:C.presentBg,border:`1px solid ${C.presentBorder}`,
                  padding:"1px 8px",borderRadius:4}}>✓ {presentCount}</span>}
                {absentCount>0 && <span style={{fontFamily:F,fontSize:11,fontWeight:600,
                  color:C.absent,background:C.absentBg,border:`1px solid ${C.absentBorder}`,
                  padding:"1px 8px",borderRadius:4}}>✕ {absentCount}</span>}
                {excusedCount>0 && <span style={{fontFamily:F,fontSize:11,fontWeight:600,
                  color:C.excused,background:C.excusedBg,border:`1px solid ${C.excusedBorder}`,
                  padding:"1px 8px",borderRadius:4}}>~ {excusedCount}</span>}
              </div>

              {/* total */}
              <span style={{marginLeft:"auto",fontFamily:M,fontSize:11,color:C.textMuted}}>
                {people.length} member{people.length>1?"s":""}
              </span>
            </button>

            {/* collapsible rows */}
            {isOpen && people.map((p)=>{
              const cfg = STATUS_CONFIG[p.attendance];
              return (
                <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 90px 200px 180px 36px",
                  padding:"10px 16px",borderBottom:`1px solid ${C.border}`,
                  background:p.attendance==="ABSENT"?"#FFFAFA":p.attendance==="EXCUSED"?"#FFFDF5":C.surface,
                  transition:"background .1s",opacity:p.attendance==="ABSENT"?.7:1}}>

                  {/* name + role */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Avatar name={p.name} org={p.org} size={30} />
                    <div>
                      <div style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.text}}>{p.name}</div>
                      <div style={{fontFamily:F,fontSize:11,color:C.textMuted}}>{p.role}</div>
                    </div>
                  </div>

                  {/* org */}
                  <div style={{display:"flex",alignItems:"center"}}><OrgPill org={p.org} /></div>

                  {/* attendance buttons */}
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    {["PRESENT","ABSENT","EXCUSED"].map(s=>{
                      const sc=STATUS_CONFIG[s];
                      const active=p.attendance===s;
                      return (
                        <button key={s} onClick={()=>setAttendance(p.id,s)}
                          style={{padding:"4px 10px",borderRadius:6,cursor:"pointer",
                            fontFamily:F,fontSize:11,fontWeight:700,transition:"all .12s",
                            border:`1.5px solid ${active?sc.border:C.border}`,
                            background:active?sc.bg:C.surface,
                            color:active?sc.color:C.textMuted}}>
                          {sc.icon} {sc.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* substitute */}
                  <div style={{display:"flex",alignItems:"center"}}>
                    {p.attendance!=="PRESENT" ? (
                      <input value={p.substitute} onChange={e=>setSubstitute(p.id,e.target.value)}
                        placeholder="Name of substitute…"
                        style={{width:"100%",padding:"4px 8px",border:`1px solid ${C.border}`,
                          borderRadius:5,fontFamily:F,fontSize:12,color:C.text,
                          background:C.bg,boxSizing:"border-box"}}
                        onFocus={e=>e.target.style.borderColor=C.blue}
                        onBlur={e=>e.target.style.borderColor=C.border} />
                    ) : (
                      <span style={{fontFamily:F,fontSize:11,color:C.textDim}}>—</span>
                    )}
                  </div>

                  {/* remove */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <button onClick={()=>remove(p.id)}
                      style={{border:"none",background:"none",cursor:"pointer",color:C.textDim,
                        fontSize:15,padding:3,borderRadius:4,transition:"color .1s"}}
                      onMouseEnter={e=>e.currentTarget.style.color=C.absent}
                      onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
          );
        })}
      </div>

      {/* nav */}
      <div style={{display:"flex",gap:10,justifyContent:"space-between"}}>
        <button onClick={onBack}
          style={{padding:"10px 20px",border:`1px solid ${C.border}`,borderRadius:8,
            background:C.surface,fontFamily:F,fontSize:13,fontWeight:600,
            color:C.textMid,cursor:"pointer"}}>← Back</button>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          {saveError && (
            <p style={{fontFamily:F,fontSize:12,color:C.absent,padding:"6px 10px",
              background:C.absentBg,borderRadius:6,border:`1px solid ${C.absentBorder}`}}>
              ⚠ {saveError}
            </p>
          )}
          <button onClick={()=>onNext(participants)} disabled={saving}
            style={{padding:"10px 24px",border:"none",borderRadius:8,background:BRAND.shp,
              color:"#fff",fontFamily:F,fontSize:13,fontWeight:700,
              cursor:saving?"not-allowed":"pointer",opacity:saving?.65:1,
              display:"flex",alignItems:"center",gap:8}}>
            {saving ? "Saving…" : "Open Action Log →"}
            {!saving && (
              <span style={{fontFamily:M,fontSize:12,opacity:.8}}>
                {counts.present} present
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATIONS DATA + CONFIG
═══════════════════════════════════════════════════════════════════════════ */
const VAR_STATUS_CFG = {
  "Agreed / Detemined": { color:"#16A34A", bg:"#F0FDF4", border:"#BBF7D0", short:"Agreed"  },
  "In Progress":        { color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", short:"In Prog." },
  "Delay":              { color:"#DC2626", bg:"#FEF2F2", border:"#FECACA", short:"Delay"   },
  "To be issued":       { color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", short:"To Issue" },
};
const VAR_STATUSES = Object.keys(VAR_STATUS_CFG);

const SEED_VARIATIONS = [
  {id:"R-VAR-0017",name:"SECURITY REVOLVING DOORS AND LOCKDOWN (PMI 026-027)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0025",name:"POSTAL SMART LOCKERS (PMI 031) (SSet 344)",section:"S1/C/AC/B",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0031",name:"GLAZED PARTITIONS FIRE RESISTANCE (SSet 327)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0034",name:"DOOR UPDATE BUILDINGS AC, B, S (SSet 323)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0040",name:"RESTAURATION OF HERITAGE FURNITURE (prov sum release)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0051",name:"FIRE SUPPRESSION SYSTEM (prov sum adjustement)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0062",name:"REPLACEMENT OF ASCENDER BY AQUILON",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0063",name:"AH Interpreter Booth Changes - Equipment",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0072",name:"AV BC INFRASTR OPTIMISATION (PMI 030)",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0077",name:"AV MODIFS FOR SECTION C",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0084",name:"NEW GENERATION BADGE READERS",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0089",name:"HVAC CHANGES SALLE C6, TV STUDIO AND ATTENUATORS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0097",name:"POTABILITY TEST",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0103",name:"AV DN NETWORK AND ANTENNA",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0115",name:"ADDITIONAL ELEC/ICT SOCKETS IN CONF ROOMS (other Sections)",section:"A/AB/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0123",name:"UNTV CEILING AMENDMENTS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0127",name:"ANTI-INTRUSION SYSTEM",section:"B/E/S1/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0129",name:"AB AC CEILING INTERPRETER BOOTHS CORRIDORS AND FOYER SALLE III",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0137",name:"WINDOW OPENING LIMITERS",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0140",name:"ADDITIONAL FIRE EXTINGUISHERS BLDG A AND AC",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0146",name:"BLDG C MC6 NEW CAR LOAD",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0167",name:"UPPER WINDOW MOTORIZATION",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0168",name:"BLDG C - UNTV CAR COOLING",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0170",name:"NEW DOOR FOR SALON TCHEQUE ET SLOVAQUE",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0173",name:"OVERALL BROADCAST (BROADCAST, LIGHTING AND SERVICES INCLUDED)",section:"B/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0175",name:"RAINWATER DRAINAGE CAR PARK P3",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0193",name:"BLDG A/AB TOILET CEILING CHANGES",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0205",name:"SALLE IV HEATING AND COOLING",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0220",name:"BLDGS AB & C VOLT DROP",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0221",name:"EMERGENCY SIGNAGE AND LIGHTING UPDATE C",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0233",name:"EVACUATION PLANS DRAWINGS AND INSTALLATION",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0236",name:"HALL C - ENTRANCE C6 MODIFICATIONS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0240",name:"NEW FIRE DOORS BLDG A, AB, AC, B, C, S1, S2",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0243",name:"FIRE DETECTION SKYLIGHTS BLDG B and C",section:"C/B",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0255",name:"ELECTRICAL SUPPLIES FOR SMOKE EXTRACTION INSTALLATIONS",section:"A/C/B",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0260",name:"BLDGS A / AB / C - INTERPRETER BOOTHS ACOUSTICS",section:"A/AB/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0261",name:"BLDGS A / AB / C - INTERPRETER BOOTHS INTERIOR FITOUT CHANGES",section:"A/AB/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0274",name:"BLDG C PANTRY RISER AND RADIATOR RELOCATION PANTRY C.107",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0292",name:"LIGHTNING PROTECTION MODIFICATIONS (CDP)",section:"ALL",status:"Delay",critical:false},
  {id:"R-VAR-0294",name:"LOCKING SYSTEM FOR EXISTING DOORS ON ESCAPE ROUTES",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0311",name:"BMS AFTERCARE SERVICES",section:"ALL",status:"To be issued",critical:false},
  {id:"R-VAR-0313",name:"BMS SUPERVISION WITH NIAGARA TRIDIUM",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0320",name:"MASTERKEY STRATEGY",section:"S1/C",status:"In Progress",critical:false},
  {id:"R-VAR-0336",name:"BMS INTEGRATION OF DHW CIRCULATION PUMPS",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0343",name:"PERIPHERAL DOORS ASSESSMENT",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0355",name:"BLDG C BLDG C L00 PRESS BAR COFFER VENTILATION",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0358",name:"INTEGRATION OF LOCAL ALARMS WITHIN CARD READERS",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0371",name:"KNX INTEGRATION CONTROLLERS",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0375",name:"ALL BLDGS - MULTICREDENTIAL READER",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0384",name:"KNX BMS INTEGRATION",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0385",name:"BLDG C CLEANER'S ROOMS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0387",name:"BLDG C BLIND AND MOTORIZED WINDOW BOXES",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0395",name:"BLDG C - COUNCIL CHAMBER AV RACKS RELOCATION",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0397",name:"BLDG C SENSITIVE ROOMS - SALON TCHEQUE ET SLOVAQUE",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0399",name:"BLDG C L02 COUNCIL CHAMBER GALLERY EXIT",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0405",name:"BLDG C - FLS UPDATES",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0406",name:"2ND HANDRAIL IN STAIRCASES",section:"AB/AC/C/B",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0408",name:"ENTRANCE POSTS WITH SAFEROUTE",section:"B/C/D/S1/S2",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0416",name:"BLDG C EXISTING OPENINGS IN BASEMENTS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0417",name:"BLDG C COUNCIL CHAMBER HEATING COILS BMS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0448",name:"BLDGS B & C - FLS POWER SUPPLY CABLE SECTIONS",section:"B/C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0449",name:"BLDG C SENSITIVE ROOMS - SALON RUSSE + LOBBY",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0456",name:"BDLG C SENSITIVE ROOMS - COUNCIL CHAMBER",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0457",name:"BDLG C SENSITIVE ROOMS - SALON FRANCAIS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0464",name:"C14-C15 cables for the network switches",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0473",name:"BLDG C - L01 FIRE CURTAINS STRUCTURAL IMPACT",section:"C",status:"In Progress",critical:false},
  {id:"R-VAR-0474",name:"BLDG C - ENTRANCE AND PRESS BAR NEW STONE LAYOUT",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0478",name:"Descope of AV equipment installed in meeting Rooms (CDP)",section:"AB/AC/C/S",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0490",name:"DIGITAL SIGNAGE",section:"A/AB/AC/C/S1",status:"In Progress",critical:false},
  {id:"R-VAR-0493",name:"BLDG C - UNTV DOORS",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0499",name:"Installation of Pressure Regulating Valves",section:"ALL",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0502",name:"Patching changes",section:"A/AB/B/C/S1/S2",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0503",name:"Room C6 new layout",section:"C",status:"In Progress",critical:false},
  {id:"R-VAR-0506",name:"BDLG C ADDITIONAL FIRE DETECTION DEVICES (CDP)",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0512",name:"Bldg C stair 5 corridors changes",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0515",name:"BLDG C STAIR 6 LIGHTING",section:"C",status:"In Progress",critical:false},
  {id:"R-VAR-0521",name:"PA SPEAKERS BLDG C ATRIUM (CDP)",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0525",name:"ADDITIONAL REVOLVING DOORS A17, A18, C21",section:"AB/C",status:"Delay",critical:false},
  {id:"R-VAR-0529",name:"Braille in handrails",section:"ALL",status:"To be issued",critical:false},
  {id:"R-VAR-0533",name:"Bins fixed furniture descope",section:"All",status:"To be issued",critical:false},
  {id:"R-VAR-0535",name:"BLDG C - DOOR UPDATES",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0536",name:"BLDG C - FIRE INDICATOR UPDATES",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0539",name:"Bldg A / AB Conference doors new doors buttons",section:"A / AB / AC / C",status:"Delay",critical:false},
  {id:"R-VAR-0540",name:"Bldg C RF1 materials on Stair 5",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0544",name:"Salle C6 Chinese donation",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0549",name:"Descope of outside cameras",section:"ALL",status:"Delay",critical:false},
  {id:"R-VAR-0553",name:"FIRE CURTAIN KEYS",section:"A/AB/AC/C/B/S1/S2",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0569",name:"Bldg C replace bar roller shutter",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0570",name:"Bldg C L02 Door Design Clarification",section:"C",status:"To be issued",critical:false},
  {id:"R-VAR-0573",name:"BLDG C L00 DOCK 5 DOOR UPDATE",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0575",name:"AV-TR move for Room 1",section:"C",status:"In Progress",critical:false},
  {id:"R-VAR-0576",name:"BLDG C - FLS EL AND MH UPDATE",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0577",name:"BLDG C - SECURITY UPDATE",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0579",name:"Bldg C L00 - C6 entrance update",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0581",name:"Bldg C Descope of basement linoleum flooring (ARCHIVES LB1-LB2-LB3)",section:"C",status:"To be issued",critical:false},
  {id:"R-VAR-0591",name:"Council Chamber corridor ceiling L2",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0597",name:"BLDG C SECURITY THERMAL CAMERA POWER SUPPL",section:"C",status:"Agreed / Detemined",critical:false},
  {id:"R-VAR-0599",name:"DESCOPE OF SECOND FEED",section:"A/AC/C/B",status:"Delay",critical:false},
  {id:"R-VAR-0600",name:"Bldg C restauration miroir Kasskoff",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0604",name:"BLDG C PRESS BAR COUNTER TOP",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0611",name:"BLDS A, AB, B & C WINDOW FRAMES",section:"AB/B/C",status:"To be issued",critical:true},
  {id:"R-VAR-0612",name:"VAR 173 revision Overall Broadcast",section:"B/C",status:"To be issued",critical:false},
  {id:"R-VAR-0618",name:"Bldg C Salle 1 Emergency Lighting",section:"C",status:"Delay",critical:false},
  {id:"R-VAR-0624",name:"Bldg C Electrical panel board F15/2",section:"C",status:"To be issued",critical:false},
  {id:"R-VAR-0625",name:"Bldg C Electrical panel board F15 and cabling replacing",section:"C",status:"In Progress",critical:false},
  {id:"R-VAR-0628",name:"Council Chamber AV - to check if eligible",section:"C",status:"To be issued",critical:false},
  {id:"R-VAR-0629",name:"Door C5 cafeteria logistic adjustment",section:"C",status:"To be issued",critical:false},
  {id:"R-VAR-0631",name:"BLDG C - L00 - Existing Windows Wooden Frame",section:"C",status:"To be issued",critical:false},
];

const LOG_TYPES = {
  note:  {label:"Note",   icon:"💬",color:"#6366F1",bg:"#EEF2FF"},
  change:{label:"Change", icon:"~>", color:"#0891B2",bg:"#ECFEFF"},
  owner: {label:"Owner",  icon:"👤",color:"#7C3AED",bg:"#F5F3FF"},
};

/* ═══════════════════════════════════════════════════════════════════════════
   VARIATIONS PANEL
═══════════════════════════════════════════════════════════════════════════ */
function VarStatusBadge({status}){
  const cfg = VAR_STATUS_CFG[status] || {color:C.textMuted,bg:C.bg,border:C.border,short:status};
  return <span style={{fontFamily:F,fontSize:10,fontWeight:700,color:cfg.color,
    background:cfg.bg,border:`1px solid ${cfg.border}`,padding:"2px 8px",
    borderRadius:4,whiteSpace:"nowrap"}}>{cfg.short}</span>;
}

function VariationsPanel({actionItems}){
  const [vars,setVars]         = useState(SEED_VARIATIONS);
  const [search,setSearch]     = useState("");
  const [statusF,setStatusF]   = useState("");
  const [sectionF,setSectionF] = useState("");
  const [editId,setEditId]     = useState(null);
  const [linked,setLinked]     = useState(null); // varId being linked
  const [toast,setToast]       = useState(null);

  function flash(msg,color=C.blue){ setToast({msg,color}); setTimeout(()=>setToast(null),2200); }
  function updateStatus(id,s){ setVars(v=>v.map(x=>x.id===id?{...x,status:s}:x)); flash("Status updated",VAR_STATUS_CFG[s]?.color||C.blue); setEditId(null); }

  // Build reverse index: varId → action items that reference it
  const varToActions = useMemo(()=>{
    const idx = {};
    actionItems.forEach(item=>{
      (item.linkedVars||[]).forEach(vid=>{
        if(!idx[vid]) idx[vid]=[];
        idx[vid].push(item);
      });
    });
    return idx;
  },[actionItems]);

  // All unique sections for filter
  const allSections = useMemo(()=>{
    const s = new Set(vars.map(v=>v.section));
    return ["", ...Array.from(s).sort()];
  },[vars]);

  const filtered = useMemo(()=> vars.filter(v=>{
    if(statusF && v.status!==statusF) return false;
    if(sectionF && v.section!==sectionF) return false;
    if(search){
      const q=search.toLowerCase();
      if(!v.id.toLowerCase().includes(q) && !v.name.toLowerCase().includes(q)) return false;
    }
    return true;
  }),[vars,search,statusF,sectionF]);

  // Stats
  const stats = useMemo(()=> VAR_STATUSES.map(s=>({
    status:s, count:vars.filter(v=>v.status===s).length, cfg:VAR_STATUS_CFG[s]
  })),[vars]);

  const lastSync = "11/03/2026 · 08:00";

  return (
    <div>
      {toast&&<div style={{position:"fixed",bottom:22,right:22,zIndex:999,padding:"9px 16px",
        background:C.surface,border:`1.5px solid ${toast.color}44`,borderRadius:8,
        fontFamily:F,fontSize:13,color:toast.color,boxShadow:"0 4px 16px rgba(0,0,0,.08)",
        display:"flex",alignItems:"center",gap:7}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:toast.color,flexShrink:0}}/>
        {toast.msg}
      </div>}

      {/* header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h2 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:3}}>Variations Register</h2>
          <div style={{display:"flex",alignItems:"center",gap:8,fontFamily:F,fontSize:12,color:C.textMuted}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:"#22C55E",display:"inline-block"}}/>
            <span>Last sync: {lastSync}</span>
            <span style={{color:C.textDim}}>·</span>
            <span style={{fontFamily:M}}>{vars.length} variations</span>
          </div>
        </div>
        <button onClick={()=>flash("🔄 Sync triggered — data up to date",C.closedColor)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
            border:`1px solid ${C.border}`,borderRadius:7,background:C.surface,
            fontFamily:F,fontSize:12,fontWeight:600,color:C.textMid,cursor:"pointer"}}>
          🔄 Sync now
        </button>
      </div>

      {/* status stat chips */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {stats.map(({status,count,cfg})=>(
          <button key={status} onClick={()=>setStatusF(f=>f===status?"":status)}
            style={{padding:"10px 16px",background:statusF===status?cfg.bg:C.surface,
              border:`1.5px solid ${statusF===status?cfg.border:C.border}`,
              borderRadius:9,cursor:"pointer",display:"flex",flexDirection:"column",
              gap:3,alignItems:"flex-start",transition:"all .15s"}}>
            <span style={{fontFamily:F,fontSize:10,fontWeight:700,letterSpacing:.4,
              color:statusF===status?cfg.color:C.textMuted}}>{status.toUpperCase()}</span>
            <span style={{fontFamily:M,fontSize:22,fontWeight:700,lineHeight:1,
              color:statusF===status?cfg.color:C.text}}>{count}</span>
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,
        padding:"9px 14px",display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:13}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search VAR ID or name…"
            style={{width:"100%",padding:"6px 10px 6px 30px",border:`1px solid ${C.border}`,
              borderRadius:6,fontFamily:F,fontSize:13,color:C.text,background:C.bg,
              outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.blue}
            onBlur={e=>e.target.style.borderColor=C.border} />
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F,fontSize:11,color:C.textMuted,fontWeight:600}}>Section</span>
          <select value={sectionF} onChange={e=>setSectionF(e.target.value)}
            style={{padding:"5px 9px",border:`1px solid ${sectionF?C.blue:C.border}`,borderRadius:6,
              fontFamily:M,fontSize:11,color:sectionF?C.blue:C.textMid,
              background:sectionF?C.blueBg:C.surface,cursor:"pointer",outline:"none"}}>
            {allSections.map(s=><option key={s} value={s}>{s||"All sections"}</option>)}
          </select>
        </div>
        {(search||statusF||sectionF)&&<button onClick={()=>{setSearch("");setStatusF("");setSectionF("");}}
          style={{padding:"5px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,
            fontSize:11,color:C.textMuted,background:"none",cursor:"pointer"}}>Clear ×</button>}
        <span style={{fontFamily:M,fontSize:11,color:C.textMuted,marginLeft:"auto"}}>{filtered.length}/{vars.length}</span>
      </div>

      {/* table */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        {/* header */}
        <div style={{display:"grid",gridTemplateColumns:"130px 1fr 110px 120px 90px 80px",
          padding:"8px 16px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`}}>
          {["VAR #","Name","Section","Status","Critical","Linked actions"].map(h=>(
            <span key={h} style={{fontFamily:F,fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:.5}}>{h}</span>
          ))}
        </div>

        {filtered.map((v,idx)=>{
          const linkedActions = varToActions[v.id]||[];
          const isEditing = editId===v.id;
          return (
            <div key={v.id} style={{borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"grid",gridTemplateColumns:"130px 1fr 110px 120px 90px 80px",
                padding:"10px 16px",
                background:v.critical?"#FFF9F0":idx%2===0?C.surface:"#FAFBFD",
                transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=v.critical?"#FFF3E0":"#F0F7FF"}
                onMouseLeave={e=>e.currentTarget.style.background=v.critical?"#FFF9F0":idx%2===0?C.surface:"#FAFBFD"}>

                {/* VAR ID */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {v.critical && <span title="Critical" style={{fontSize:12}}>⚠️</span>}
                  <span style={{fontFamily:M,fontSize:11,fontWeight:700,color:BRAND.shp}}>{v.id}</span>
                </div>

                {/* Name — click to edit */}
                <div style={{paddingRight:12}}>
                  <span style={{fontFamily:F,fontSize:12,color:C.text,lineHeight:1.4}}>{v.name}</span>
                </div>

                {/* Section */}
                <div style={{display:"flex",alignItems:"center"}}>
                  <span style={{fontFamily:M,fontSize:10,color:C.textMuted,background:C.bg,
                    border:`1px solid ${C.border}`,padding:"2px 6px",borderRadius:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100}}>{v.section}</span>
                </div>

                {/* Status — click to cycle */}
                <div style={{display:"flex",alignItems:"center"}}>
                  {isEditing ? (
                    <select autoFocus value={v.status}
                      onChange={e=>updateStatus(v.id,e.target.value)}
                      onBlur={()=>setEditId(null)}
                      style={{padding:"3px 6px",border:`1.5px solid ${C.blue}`,borderRadius:4,
                        fontFamily:F,fontSize:11,color:C.text,outline:"none",cursor:"pointer"}}>
                      {VAR_STATUSES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div onClick={()=>setEditId(v.id)} title="Click to change status"
                      style={{cursor:"pointer"}}>
                      <VarStatusBadge status={v.status} />
                    </div>
                  )}
                </div>

                {/* Critical */}
                <div style={{display:"flex",alignItems:"center"}}>
                  <button onClick={()=>{ setVars(p=>p.map(x=>x.id===v.id?{...x,critical:!x.critical}:x)); }}
                    style={{border:"none",background:"none",cursor:"pointer",padding:0,fontSize:16}}
                    title={v.critical?"Mark non-critical":"Mark critical"}>
                    {v.critical ? "⚠️" : <span style={{color:C.textDim,fontSize:13}}>—</span>}
                  </button>
                </div>

                {/* Linked actions */}
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  {linkedActions.length>0 && (
                    <span style={{fontFamily:M,fontSize:11,fontWeight:700,color:C.blue,
                      background:C.blueBg,border:`1px solid ${C.blueBorder}`,
                      padding:"1px 7px",borderRadius:4}}>{linkedActions.length}</span>
                  )}
                  <button onClick={()=>setLinked(linked===v.id?null:v.id)}
                    title="Link / view action items"
                    style={{border:`1px solid ${linked===v.id?C.blue:C.border}`,
                      background:linked===v.id?C.blueBg:C.surface,
                      borderRadius:5,padding:"2px 7px",cursor:"pointer",
                      fontFamily:F,fontSize:11,color:linked===v.id?C.blue:C.textMuted}}>
                    {linked===v.id?"▲":"⟵ link"}
                  </button>
                </div>
              </div>

              {/* LINKED ACTIONS PANEL */}
              {linked===v.id && (
                <div style={{background:"#F7FBFF",borderTop:`1px solid ${C.blueBorder}`,
                  padding:"12px 16px 14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                    <span style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.textMid,letterSpacing:.5}}>
                      LINKED ACTION ITEMS
                    </span>
                    <span style={{fontFamily:M,fontSize:10,color:C.textMuted,background:C.border,
                      padding:"1px 6px",borderRadius:8}}>{linkedActions.length}</span>
                  </div>
                  {linkedActions.length===0 ? (
                    <div style={{fontFamily:F,fontSize:12,color:C.textMuted,fontStyle:"italic",
                      padding:"6px 0"}}>
                      No action items linked to {v.id} yet. Open an action item log and reference this variation.
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {linkedActions.map(a=>(
                        <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,
                          background:C.surface,border:`1px solid ${C.border}`,
                          borderRadius:6,padding:"7px 12px"}}>
                          <PBadge p={a.priority}/>
                          <span style={{fontFamily:M,fontSize:10,color:C.textMuted,
                            background:C.bg,padding:"1px 5px",borderRadius:3}}>{a.topic}</span>
                          <span style={{fontFamily:F,fontSize:12,fontWeight:600,color:C.text,flex:1}}>{a.title}</span>
                          <span style={{fontFamily:F,fontSize:11,color:C.textMuted}}>{a.owner}</span>
                          <span style={{fontFamily:M,fontSize:10,color:a.status==="OPEN"?C.openColor:C.closedColor,
                            fontWeight:700}}>{a.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0&&<div style={{padding:"36px 0",textAlign:"center",color:C.textMuted,fontFamily:F,fontSize:13}}>
          No variations match the current filters.
        </div>}
      </div>
    </div>
  );
}



function EditCell({value,onSave,type="text",options,style={}}){
  const [ed,setEd]=useState(false);
  const [val,setVal]=useState(value);
  const ref=useRef();
  useEffect(()=>{ if(ed&&ref.current) ref.current.focus(); },[ed]);
  function commit(v){ setEd(false); if(v!==value) onSave(v); }
  if(!ed) return (
    <div onClick={()=>{ setVal(value); setEd(true); }} title="Click to edit"
      style={{cursor:"text",padding:"3px 6px",borderRadius:4,transition:"background .12s",
        minHeight:22,display:"flex",alignItems:"center",...style}}
      onMouseEnter={e=>e.currentTarget.style.background="#F1F5F9"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {type==="select"&&options&&PRIORITIES.includes(value)?<PBadge p={value}/>:
        <span style={{fontFamily:F,fontSize:13,color:C.text}}>{value||"—"}</span>}
    </div>
  );
  if(type==="select") return (
    <select ref={ref} value={val} onChange={e=>setVal(e.target.value)}
      onBlur={e=>commit(e.target.value)}
      onKeyDown={e=>{ if(e.key==="Enter")commit(val); if(e.key==="Escape"){setEd(false);setVal(value);} }}
      style={{padding:"3px 6px",border:`1.5px solid ${C.blue}`,borderRadius:4,
        background:C.surface,fontFamily:F,fontSize:13,color:C.text,outline:"none"}}>
      {options.map(o=><option key={o}>{o}</option>)}
    </select>
  );
  return <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
    onBlur={e=>commit(e.target.value)}
    onKeyDown={e=>{ if(e.key==="Enter")commit(val); if(e.key==="Escape"){setEd(false);setVal(value);} }}
    style={{padding:"3px 8px",border:`1.5px solid ${C.blue}`,borderRadius:4,
      background:C.surface,fontFamily:F,fontSize:13,color:C.text,outline:"none",
      width:"100%",boxSizing:"border-box"}} />;
}

function LogTimeline({entries,onAdd,session,presentAuthors}){
  const [adding,setAdding]=useState(false);
  const [newestFirst,setNewestFirst]=useState(true);
  const [draft,setDraft]=useState({
    week:session.week, date:session.meeting_date, org:"RPN", author:"", type:"note", text:"", field:"", from:"", to:"", linkedVar:""
  });
  const ref=useRef();
  useEffect(()=>{ if(adding&&ref.current) ref.current.focus(); },[adding]);
  const sorted=[...entries].sort((a,b)=>newestFirst
    ? new Date(b.date)-new Date(a.date)
    : new Date(a.date)-new Date(b.date));

  return (
    <div style={{padding:"0 14px 16px 54px",background:"#FAFBFF",borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:F,fontSize:11,fontWeight:700,color:C.textMid,letterSpacing:.5}}>ACTIVITY LOG</span>
          <span style={{fontFamily:M,fontSize:10,color:C.textMuted,background:C.border,
            padding:"1px 7px",borderRadius:10}}>{entries.length}</span>
          <button onClick={()=>setNewestFirst(v=>!v)}
            title={newestFirst?"Plus ancien en haut":"Plus récent en haut"}
            style={{display:"flex",alignItems:"center",gap:3,padding:"2px 8px",
              border:`1px solid ${C.border}`,borderRadius:5,background:C.surface,
              color:C.textMid,fontFamily:F,fontSize:10,cursor:"pointer",lineHeight:1.4}}>
            {newestFirst?"↓ Récent":"↑ Ancien"}
          </button>
        </div>
        {!adding&&<button onClick={()=>setAdding(true)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"4px 12px",
            border:`1px solid ${C.blueBorder}`,borderRadius:6,background:C.blueBg,
            color:C.blue,fontFamily:F,fontSize:11,fontWeight:600,cursor:"pointer"}}>
          + Add entry
        </button>}
      </div>

      <div style={{position:"relative",paddingLeft:20}}>
        <div style={{position:"absolute",left:6,top:0,bottom:0,width:1.5,
          background:`linear-gradient(to bottom,${C.blue}44,${C.border})`}} />

        {sorted.map(e=>{
          const cfg=LOG_TYPES[e.type]||LOG_TYPES.note;
          return (
            <div key={e.id} style={{position:"relative",marginBottom:12,paddingLeft:22}}>
              <div style={{position:"absolute",left:-2,top:5,width:10,height:10,borderRadius:"50%",
                background:cfg.color,border:`2px solid ${C.surface}`,boxShadow:`0 0 0 1px ${cfg.color}55`}} />
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,padding:"8px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontFamily:M,fontSize:10,fontWeight:700,color:C.blue,
                    background:C.blueBg,border:`1px solid ${C.blueBorder}`,padding:"1px 6px",borderRadius:3}}>W{e.week}</span>
                  <span style={{fontFamily:M,fontSize:10,color:C.textMuted}}>{fmt(e.date)}</span>
                  <OrgPill org={e.org} />
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <Avatar name={e.author} org={e.org} size={16} />
                    <span style={{fontFamily:F,fontSize:11,fontWeight:600,color:C.textMid}}>{e.author}</span>
                  </div>
                  <span style={{marginLeft:"auto",fontFamily:F,fontSize:10,fontWeight:600,
                    color:cfg.color,background:cfg.bg,padding:"1px 6px",borderRadius:3}}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <p style={{margin:0,fontFamily:F,fontSize:12,color:C.text,lineHeight:1.5}}>{e.text}</p>
                {(e.type==="change"||e.type==="owner")&&e.from&&(
                  <div style={{display:"flex",alignItems:"center",gap:7,marginTop:6}}>
                    <span style={{fontFamily:M,fontSize:11,color:C.absent,background:C.absentBg,
                      border:`1px solid ${C.absentBorder}`,padding:"2px 7px",borderRadius:4,
                      textDecoration:"line-through"}}>{e.from}</span>
                    <span style={{color:C.textDim}}>→</span>
                    <span style={{fontFamily:M,fontSize:11,color:C.closedColor,background:C.closedBg,
                      border:`1px solid ${C.Lowborder}`,padding:"2px 7px",borderRadius:4,fontWeight:700}}>{e.to}</span>
                    {e.field&&<span style={{fontFamily:M,fontSize:10,color:C.textMuted}}>({e.field})</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {adding&&(
          <div style={{position:"relative",paddingLeft:22,marginBottom:8}}>
            <div style={{position:"absolute",left:-2,top:5,width:10,height:10,borderRadius:"50%",
              background:C.blue,border:`2px solid ${C.surface}`}} />
            <div style={{background:C.surface,border:`1.5px solid ${C.blue}55`,borderRadius:7,padding:"12px 14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"60px 120px 80px 80px 1fr",gap:8,marginBottom:10}}>
                {[["week","Week","text"],["date","Date","date"],["org","Org","select-org"],
                  ["type","Type","select-type"],["author","Author","select-author"]].map(([k,l,t])=>(
                  <div key={k}>
                    <label style={{fontFamily:F,fontSize:9,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:3}}>{l.toUpperCase()}</label>
                    {t==="text"||t==="date"?(
                      <input type={t==="date"?"date":"text"} value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
                        style={{width:"100%",padding:"5px 7px",border:`1px solid ${C.border}`,borderRadius:5,
                          fontFamily:F,fontSize:12,color:C.text,boxSizing:"border-box"}} />
                    ):(
                      <select value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
                        style={{width:"100%",padding:"5px 7px",border:`1px solid ${C.border}`,borderRadius:5,
                          fontFamily:F,fontSize:12,color:C.text}}>
                        {t==="select-org"?ORGS.map(o=><option key={o}>{o}</option>)
                         :t==="select-type"?Object.entries(LOG_TYPES).map(([v,{label}])=><option key={v} value={v}>{label}</option>)
                         :[<option key="" value="">Select…</option>,...(presentAuthors||ALL_OWNERS).map(o=><option key={o}>{o}</option>)]}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <textarea ref={ref} value={draft.text} onChange={e=>setDraft(d=>({...d,text:e.target.value}))}
                placeholder="Describe what happened at this meeting…" rows={2}
                style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:5,
                  fontFamily:F,fontSize:12,color:C.text,resize:"vertical",boxSizing:"border-box",marginBottom:8}}
                onFocus={e=>e.target.style.borderColor=C.blue}
                onBlur={e=>e.target.style.borderColor=C.border} />
              {(draft.type==="change"||draft.type==="owner")&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px",gap:8,marginBottom:8}}>
                  {[["from","From"],["to","To"],["field","Field"]].map(([k,l])=>(
                    <div key={k}>
                      <label style={{fontFamily:F,fontSize:9,color:C.textMuted,display:"block",marginBottom:3}}>{l}</label>
                      <input value={draft[k]} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}
                        placeholder={l} style={{width:"100%",padding:"5px 7px",border:`1px solid ${C.border}`,
                          borderRadius:5,fontFamily:M,fontSize:12,boxSizing:"border-box"}} />
                    </div>
                  ))}
                </div>
              )}
              {/* VAR link picker */}
              <div style={{marginBottom:8}}>
                <label style={{fontFamily:F,fontSize:9,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:3}}>LINK TO VARIATION (optional)</label>
                <select value={draft.linkedVar} onChange={e=>setDraft(d=>({...d,linkedVar:e.target.value}))}
                  style={{width:"100%",padding:"5px 8px",border:`1px solid ${draft.linkedVar?BRAND.shp:C.border}`,
                    borderRadius:5,fontFamily:M,fontSize:11,color:draft.linkedVar?BRAND.shp:C.textMid,
                    background:draft.linkedVar?BRAND.shpBg:"#fff"}}>
                  <option value="">— No variation linked —</option>
                  {SEED_VARIATIONS.map(v=><option key={v.id} value={v.id}>{v.id} · {v.name.slice(0,55)}{v.name.length>55?"…":""}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button onClick={()=>{ if(!draft.author||!draft.text)return; onAdd({...draft,id:Date.now()},draft.linkedVar||null); setAdding(false); }}
                  style={{padding:"6px 16px",border:"none",borderRadius:6,background:C.blue,
                    color:"#fff",fontFamily:F,fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button>
                <button onClick={()=>setAdding(false)}
                  style={{padding:"6px 12px",border:`1px solid ${C.border}`,borderRadius:6,
                    background:"none",color:C.textMuted,fontFamily:F,fontSize:12,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortIcon({k, sortK, sortD}){
  if(sortK!==k) return <span style={{opacity:.2,fontSize:9}}>⇅</span>;
  return <span style={{fontSize:9,color:C.blue}}>{sortD===1?"↑":"↓"}</span>;
}

function ActionLog({session,participants}){
  const { actions:pbActions, loading:actLoading, updateField, addLog:pbAddLog, upsertActions, createAction } = useActions();
  const { user } = useAuth();
  const [linkedVarsMap, setLinkedVarsMap] = useState({});
  const [importReport, setImportReport] = useState(null); // null | { created, updated, skipped, errors }
  const [newActionMode, setNewActionMode] = useState(false);
  const [newActionDraft, setNewActionDraft] = useState({
    section: 'C', topic: '', title: '', type: 'ACTION', priority: 'Medium',
    due: '', org: 'RPN', owner: user?.full_name ?? '', initialNote: ''
  });

  // Normalise PB format → UI format (action_logs→log, from_value/to_value→from/to)
  const items = useMemo(()=>pbActions.map(a=>({
    ...a,
    log:(a.action_logs??[]).map(l=>({...l, from:l.from_value, to:l.to_value})),
    linkedVars: linkedVarsMap[a.id]??[],
  })),[pbActions, linkedVarsMap]);

  const [expanded,setExp]  = useState(new Set());
  const [filter,setFilter] = useState({priority:"",status:"OPEN",org:"",owner:"",search:""});
  const [sortK,setSortK]   = useState("priority");
  const [sortD,setSortD]   = useState(1);
  const [toast,setToast]   = useState(null);
  const [activeTab,setTab] = useState("actions"); // "actions" | "variations"
  const [importing,setImporting] = useState(false);
  const xlInputRef = useRef();

  const presentAuthors = participants.filter(p=>p.attendance==="PRESENT").map(p=>p.name);

  function flash(msg,color=C.blue){ setToast({msg,color}); setTimeout(()=>setToast(null),2000); }

  async function handleImportXL(e){
    const file = e.target.files?.[0];
    if(!file) return;
    setImporting(true);
    try{
      const { actions: xlActions } = await importFromExcel(file);
      const report = await upsertActions(xlActions, user);
      setImportReport({ ...report, total: xlActions.length });
    } catch(err){
      flash(`✗ Import échoué : ${err.message}`,C.absent);
    } finally{
      setImporting(false);
      e.target.value = '';
    }
  }

  function handleExportXL(){
    try{
      exportToExcel(session, participants, items);
      flash('✅ Excel exporté',C.closedColor);
    } catch(err){
      flash(`✗ Export échoué : ${err.message}`,C.absent);
    }
  }
  function handleExportImportReport(report){
    try{
      const wb = XLSX.utils.book_new();
      const today = new Date().toISOString().slice(0,10);
      
      // Sheet 1: Résumé
      const summary = [
        ["Import Report", `Week ${session.week}`],
        ["Date d'import", today],
        ["Total traité", report.total],
        [""],
        ["Créées", report.created.length],
        ["Mises à jour", report.updated.length],
        ["Ignorées", report.skipped.length],
        ["Erreurs", report.errors.length],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");
      
      // Sheet 2: Créées
      if(report.created.length > 0){
        const createdData = [["Title"],...report.created.map(r=>[r.title])];
        const wsCreated = XLSX.utils.aoa_to_sheet(createdData);
        XLSX.utils.book_append_sheet(wb, wsCreated, "Créées");
      }
      
      // Sheet 3: Mises à jour
      if(report.updated.length > 0){
        const updatedData = [["Title", "Changed Fields"],...report.updated.map(r=>[r.title, Object.keys(r.changes??{}).join(", ")])];
        const wsUpdated = XLSX.utils.aoa_to_sheet(updatedData);
        XLSX.utils.book_append_sheet(wb, wsUpdated, "Mises à jour");
      }
      
      // Sheet 4: Ignorées
      if(report.skipped.length > 0){
        const skippedData = [["Title", "Reason"],...report.skipped.map(r=>[r.title, r.reason??'Aucun changement'])];
        const wsSkipped = XLSX.utils.aoa_to_sheet(skippedData);
        XLSX.utils.book_append_sheet(wb, wsSkipped, "Ignorées");
      }
      
      // Sheet 5: Erreurs
      if(report.errors.length > 0){
        const errorsData = [["Title", "Error Message"],...report.errors.map(r=>[r.title, r.message])];
        const wsErrors = XLSX.utils.aoa_to_sheet(errorsData);
        XLSX.utils.book_append_sheet(wb, wsErrors, "Erreurs");
      }
      
      XLSX.writeFile(wb, `Import_Report_W${session.week}_${today}.xlsx`);
      flash('✅ Rapport exporté', C.closedColor);
    } catch(err){
      flash(`✗ Export rapport échoué : ${err.message}`, C.absent);
    }
  }
  function toggle(id){ setExp(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }
  async function update(id,key,val){ await updateField(id,key,val,user); flash(`${key} updated`); }
  async function addLog(id,entry,varId){
    await pbAddLog(id,entry,user);
    if(varId) setLinkedVarsMap(m=>({...m,[id]:[...new Set([...(m[id]??[]),varId])]}));
    flash("Entry added ✓",C.closedColor);
  }
  async function handleCreateAction(){
    if(!newActionDraft.title.trim()) { flash('Title required', C.absent); return; }
    try{
      await createAction(newActionDraft, user);
      flash('✅ Action créée', C.closedColor);
      setNewActionMode(false);
      setNewActionDraft({
        section: 'C', topic: '', title: '', type: 'ACTION', priority: 'Medium',
        due: '', org: 'RPN', owner: user?.full_name ?? '', initialNote: ''
      });
    } catch(err){
      flash(`Error: ${err.message}`, C.absent);
    }
  }
  function quickFilter(k,v){ setFilter(f=>({...f,[k]:f[k]===v?"":v})); }
  function sortBy(k){ if(sortK===k)setSortD(d=>-d); else{setSortK(k);setSortD(1);} }

  const filtered=useMemo(()=>{
    let r=items.filter(i=>{
      if(filter.priority&&i.priority!==filter.priority)return false;
      if(filter.status&&i.status!==filter.status)return false;
      if(filter.org&&!i.org.includes(filter.org))return false;
      if(filter.owner&&i.owner!==filter.owner)return false;
      if(filter.search){ const q=filter.search.toLowerCase(); if(!i.title.toLowerCase().includes(q)&&!i.owner.toLowerCase().includes(q)&&!i.topic.toLowerCase().includes(q))return false; }
      return true;
    });
    r.sort((a,b)=>{
      let av=a[sortK],bv=b[sortK];
      if(sortK==="priority"){av=PRIO_ORDER[av]??9;bv=PRIO_ORDER[bv]??9;}
      if(sortK==="due"){av=av||"9999";bv=bv||"9999";}
      if(sortK==="log"){av=a.log.length;bv=b.log.length;}
      return(av<bv?-1:av>bv?1:0)*sortD;
    });
    return r;
  },[items,filter,sortK,sortD]);

  const open=items.filter(i=>i.status==="OPEN").length;
  const top=items.filter(i=>i.priority==="TOP"&&i.status==="OPEN").length;
  const od=items.filter(i=>i.status==="OPEN"&&overdue(i.due)).length;
  const COLS="34px 88px 1fr 68px 88px 100px 170px 68px 88px 56px";

  return (
    <div>
      {toast&&<div style={{position:"fixed",bottom:22,right:22,zIndex:999,padding:"9px 16px",
        background:C.surface,border:`1.5px solid ${toast.color}44`,borderRadius:8,
        fontFamily:F,fontSize:13,color:toast.color,boxShadow:"0 4px 16px rgba(0,0,0,.08)",
        display:"flex",alignItems:"center",gap:7}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:toast.color}}/>
        {toast.msg}
      </div>}

      {actLoading&&<div style={{display:"flex",alignItems:"center",gap:10,padding:"24px 0",
        fontFamily:F,fontSize:13,color:C.textMuted}}>
        <span style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${C.blue}`,
          borderTopColor:"transparent",display:"inline-block",animation:"spin 1s linear infinite"}}/>
        Chargement des actions…
      </div>}

      {/* summary header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,fontFamily:F,fontSize:12,color:C.textMid}}>
            <span style={{fontWeight:700,fontSize:13,color:C.text}}>Week {session.week}</span>
            <span style={{color:C.textDim}}>·</span>
            <span>{new Date(session.meeting_date).toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</span>
            <span style={{color:C.textDim}}>·</span>
            <span>{participants.filter(p=>p.attendance==="PRESENT").length} participants present</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          {/* Import Excel */}
          <input ref={xlInputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleImportXL} />
          <button onClick={()=>xlInputRef.current?.click()} disabled={importing}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
              border:`1px solid ${C.border}`,borderRadius:7,
              background:C.surface,fontFamily:F,fontSize:12,fontWeight:600,
              color:C.textMid,cursor:importing?"wait":"pointer",opacity:importing?.6:1}}>
            ⬆️ Importer Excel
          </button>
          {/* Export Excel */}
          <button onClick={handleExportXL}
            style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",
              border:`1px solid ${C.closedColor}44`,borderRadius:7,
              background:C.closedBg,fontFamily:F,fontSize:12,fontWeight:600,
              color:C.closedColor,cursor:"pointer"}}>
            ⬇️ Exporter Excel
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{display:"flex",gap:2,marginBottom:20,background:C.surface,
        border:`1px solid ${C.border}`,borderRadius:10,padding:4,alignSelf:"flex-start",
        width:"fit-content"}}>
        {[["actions","📋 Action Log", items.filter(i=>i.status==="OPEN").length],
          ["variations","📂 Variations", SEED_VARIATIONS.length]
        ].map(([key,label,count])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{padding:"8px 20px",borderRadius:7,border:"none",cursor:"pointer",
              display:"flex",alignItems:"center",gap:7,transition:"all .15s",
              background:activeTab===key?"#0F172A":C.surface,
              boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,.12)":"none"}}>
            <span style={{fontFamily:F,fontSize:13,fontWeight:700,
              color:activeTab===key?"#F8FAFC":C.textMuted}}>{label}</span>
            <span style={{fontFamily:M,fontSize:11,fontWeight:700,
              padding:"1px 7px",borderRadius:8,
              background:activeTab===key?BRAND.shp+"cc":"#F1F5F9",
              color:activeTab===key?"#fff":C.textMuted}}>{count}</span>
          </button>
        ))}
      </div>

      {/* VARIATIONS TAB */}
      {activeTab==="variations" && <VariationsPanel actionItems={items} />}

      {/* ACTIONS TAB */}
      {activeTab==="actions" && <div>

      {/* TOP OVERVIEW ROW: stat pills + org cards */}
      <div style={{display:"flex",gap:14,marginBottom:18,alignItems:"stretch"}}>

        {/* stat pills — colonne gauche */}
        <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
          <span style={{fontFamily:F,fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:.5}}>RÉSUMÉ</span>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["OPEN",open,C.openColor,"status"],["TOP",top,C.TOP,"priority"],
              ["OVERDUE",od,C.High,null],...PRIORITIES.map(p=>[p,items.filter(i=>i.priority===p&&i.status==="OPEN").length,C[p],"priority"])
            ].map(([l,v,col,fk],i)=>(
              <button key={i} onClick={()=>fk&&quickFilter(fk,l)}
                style={{padding:"8px 14px",background:fk&&filter[fk]===l?col+"12":C.surface,
                  border:`1.5px solid ${fk&&filter[fk]===l?col+"55":C.border}`,borderRadius:8,
                  cursor:fk?"pointer":"default",transition:"all .15s",
                  display:"flex",flexDirection:"column",gap:2,alignItems:"flex-start"}}>
                <span style={{fontFamily:F,fontSize:10,fontWeight:700,
                  color:fk&&filter[fk]===l?col:C.textMuted,letterSpacing:.4}}>{l}</span>
                <span style={{fontFamily:M,fontSize:20,fontWeight:700,
                  color:fk&&filter[fk]===l?col:C.text,lineHeight:1}}>{v}</span>
              </button>
            ))}
          </div>
        </div>

        {/* vertical divider */}
        <div style={{width:1,background:C.border,flexShrink:0,alignSelf:"stretch",margin:"0 2px"}}/>

        {/* org cards — colonne droite */}
        <span style={{position:"absolute",fontFamily:F,fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:.5,visibility:"hidden"}}>PAR ORG</span>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,flex:1}}>
        {["RPN","SHP","SOMBP"].map(org=>{
          const orgColor = ORG_COLORS[org];
          const orgItems = items.filter(i=>i.status==="OPEN" && i.org.includes(org));
          const onTime   = orgItems.filter(i=>!overdue(i.due));
          const late     = orgItems.filter(i=>overdue(i.due));
          const total    = orgItems.length;
          const pctOk    = total>0 ? Math.round(onTime.length/total*100) : 0;
          // priority breakdown
          const byPrio   = PRIORITIES.map(p=>({p, count:orgItems.filter(i=>i.priority===p).length})).filter(x=>x.count>0);

          return (
            <button key={org} onClick={()=>quickFilter("org",org)}
              style={{background:C.surface,border:`1.5px solid ${filter.org===org?orgColor:C.border}`,
                borderRadius:12,padding:"16px 18px",cursor:"pointer",textAlign:"left",
                boxShadow:filter.org===org?`0 0 0 3px ${orgColor}22`:"none",
                transition:"all .15s",outline:"none"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=orgColor;e.currentTarget.style.boxShadow=`0 2px 12px ${orgColor}22`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=filter.org===org?orgColor:C.border;e.currentTarget.style.boxShadow=filter.org===org?`0 0 0 3px ${orgColor}22`:"none";}}>

              {/* top row: org name + total */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:orgColor}}/>
                  <span style={{fontFamily:F,fontSize:14,fontWeight:800,color:C.text}}>{org}</span>
                </div>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontFamily:M,fontSize:26,fontWeight:700,color:C.text,lineHeight:1}}>{total}</span>
                  <span style={{fontFamily:F,fontSize:11,color:C.textMuted}}>open</span>
                </div>
              </div>

              {/* progress bar: green = on time, red = late */}
              <div style={{marginBottom:10}}>
                <div style={{height:8,borderRadius:6,background:"#F1F5F9",overflow:"hidden",display:"flex"}}>
                  {total>0 && <>
                    <div style={{width:`${pctOk}%`,background:"#22C55E",transition:"width .4s ease",borderRadius:"6px 0 0 6px"}}/>
                    <div style={{width:`${100-pctOk}%`,background:"#EF4444",transition:"width .4s ease",borderRadius:late.length&&!onTime.length?"6px":"0 6px 6px 0"}}/>
                  </>}
                  {total===0 && <div style={{width:"100%",background:C.border}}/>}
                </div>
                {/* legend */}
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:"#22C55E",display:"inline-block"}}/>
                    <span style={{fontFamily:F,fontSize:11,color:"#16A34A",fontWeight:600}}>{onTime.length} on time</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontFamily:F,fontSize:11,color:late.length>0?"#DC2626":C.textDim,fontWeight:late.length>0?600:400}}>
                      {late.length} overdue</span>
                    <span style={{width:8,height:8,borderRadius:"50%",background:late.length>0?"#EF4444":C.textDim,display:"inline-block"}}/>
                  </div>
                </div>
              </div>

              {/* priority pills */}
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {byPrio.map(({p,count})=>(
                  <span key={p} style={{fontFamily:F,fontSize:10,fontWeight:700,
                    color:C[p],background:C[p+"bg"],border:`1px solid ${C[p+"border"]}`,
                    padding:"2px 7px",borderRadius:4}}>
                    {count} {p}
                  </span>
                ))}
                {total===0 && <span style={{fontFamily:F,fontSize:11,color:C.textDim,fontStyle:"italic"}}>No open items</span>}
              </div>
            </button>
          );
        })}
        </div>{/* end org grid */}
      </div>{/* end top overview row */}

      {/* filter bar */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,
        padding:"9px 14px",display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:160}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.textMuted,fontSize:13}}>🔍</span>
          <input value={filter.search} onChange={e=>setFilter(f=>({...f,search:e.target.value}))}
            placeholder="Search…"
            style={{width:"100%",padding:"6px 10px 6px 30px",border:`1px solid ${C.border}`,
              borderRadius:6,fontFamily:F,fontSize:13,color:C.text,background:C.bg,outline:"none",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor=C.blue}
            onBlur={e=>e.target.style.borderColor=C.border} />
        </div>
        {[["Status","status",["","OPEN","CLOSED"]],["Org","org",["","RPN","SHP","SOMBP","G&T"]]].map(([l,k,opts])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:F,fontSize:11,color:C.textMuted,fontWeight:600}}>{l}</span>
            <select value={filter[k]} onChange={e=>setFilter(f=>({...f,[k]:e.target.value}))}
              style={{padding:"5px 9px",border:`1px solid ${filter[k]?C.blue:C.border}`,borderRadius:6,
                fontFamily:F,fontSize:12,color:filter[k]?C.blue:C.textMid,
                background:filter[k]?C.blueBg:C.surface,cursor:"pointer",outline:"none"}}>
              {opts.map(o=><option key={o} value={o}>{o||"All"}</option>)}
            </select>
          </div>
        ))}
        {/* Filtre par personne */}
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontFamily:F,fontSize:11,color:C.textMuted,fontWeight:600}}>Owner</span>
          <select value={filter.owner} onChange={e=>setFilter(f=>({...f,owner:e.target.value}))}
            style={{padding:"5px 9px",border:`1px solid ${filter.owner?C.blue:C.border}`,borderRadius:6,
              fontFamily:F,fontSize:12,color:filter.owner?C.blue:C.textMid,
              background:filter.owner?C.blueBg:C.surface,cursor:"pointer",outline:"none",maxWidth:170}}>
            <option value="">All</option>
            {[...new Set(items.map(i=>i.owner))].sort().map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {Object.values(filter).some(Boolean)&&<button onClick={()=>setFilter({priority:"",status:"",org:"",owner:"",search:""})}
          style={{padding:"5px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,
            fontSize:11,color:C.textMuted,background:"none",cursor:"pointer"}}>Clear ×</button>}
        <div style={{display:"flex",gap:5,marginLeft:"auto"}}>
          <button onClick={()=>setExp(new Set(filtered.map(i=>i.id)))}
            style={{padding:"5px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,
              fontSize:11,color:C.blue,background:C.blueBg,cursor:"pointer",fontWeight:600}}>
            ↕ Tout ouvrir
          </button>
          <button onClick={()=>setExp(new Set())}
            style={{padding:"5px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,
              fontSize:11,color:C.textMuted,background:"none",cursor:"pointer",fontWeight:600}}>
            ↕ Tout fermer
          </button>
          <button onClick={()=>setNewActionMode(v=>!v)}
            style={{padding:"5px 12px",border:`1px solid ${newActionMode?C.blue:C.border}`,borderRadius:6,fontFamily:F,
              fontSize:11,fontWeight:600,color:newActionMode?C.blue:C.textMid,
              background:newActionMode?C.blueBg:"none",cursor:"pointer"}}>
            + Nouveau sujet
          </button>
        </div>
        <span style={{fontFamily:M,fontSize:11,color:C.textMuted}}>{filtered.length}/{items.length}</span>
      </div>

      {/* NEW ACTION FORM */}
      {newActionMode && (
        <div style={{background:C.blueBg,border:`1.5px solid ${C.blueBorder}`,borderRadius:10,
          padding:"16px 18px",marginBottom:16,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {/* Section */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>SECTION</label>
            <select value={newActionDraft.section} onChange={e=>setNewActionDraft(d=>({...d,section:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text}}>
              {["A","AB","AC","E","C","S1","S2","TEMPUS"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Topic */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>TOPIC</label>
            <input type="text" value={newActionDraft.topic} onChange={e=>setNewActionDraft(d=>({...d,topic:e.target.value}))}
              placeholder="General topic" style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text,boxSizing:"border-box"}} />
          </div>
          {/* Type */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>TYPE</label>
            <select value={newActionDraft.type} onChange={e=>setNewActionDraft(d=>({...d,type:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text}}>
              <option>ACTION</option>
              <option>INFO</option>
              <option>FYI</option>
            </select>
          </div>
          {/* Priority */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>PRIORITY</label>
            <select value={newActionDraft.priority} onChange={e=>setNewActionDraft(d=>({...d,priority:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text}}>
              {["TOP","High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          {/* Due Date */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>DUE DATE</label>
            <input type="date" value={newActionDraft.due} onChange={e=>setNewActionDraft(d=>({...d,due:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text,boxSizing:"border-box"}} />
          </div>
          {/* Org */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>ORG</label>
            <select value={newActionDraft.org} onChange={e=>setNewActionDraft(d=>({...d,org:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text}}>
              {["RPN","SHP","SOMBP","G&T"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          {/* Owner */}
          <div>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>OWNER</label>
            <select value={newActionDraft.owner} onChange={e=>setNewActionDraft(d=>({...d,owner:e.target.value}))}
              style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text}}>
              {presentAuthors.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          {/* Title (full width) */}
          <div style={{gridColumn:"1 / -1"}}>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>TITLE *</label>
            <input type="text" value={newActionDraft.title} onChange={e=>setNewActionDraft(d=>({...d,title:e.target.value}))}
              placeholder="Subject title" style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text,boxSizing:"border-box"}} />
          </div>
          {/* Initial Note (full width) */}
          <div style={{gridColumn:"1 / -1"}}>
            <label style={{fontFamily:F,fontSize:9,fontWeight:700,color:C.textMuted,letterSpacing:.5,display:"block",marginBottom:5}}>INITIAL NOTE</label>
            <textarea value={newActionDraft.initialNote} onChange={e=>setNewActionDraft(d=>({...d,initialNote:e.target.value}))}
              placeholder="Optional first log entry" rows={2} style={{width:"100%",padding:"7px 9px",border:`1px solid ${C.border}`,borderRadius:6,fontFamily:F,fontSize:12,color:C.text,boxSizing:"border-box",resize:"vertical"}} />
          </div>
          {/* Buttons */}
          <div style={{gridColumn:"1 / -1",display:"flex",gap:8}}>
            <button onClick={handleCreateAction}
              style={{padding:"8px 18px",border:"none",borderRadius:6,background:C.blue,color:"#fff",fontFamily:F,fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Save
            </button>
            <button onClick={()=>setNewActionMode(false)}
              style={{padding:"8px 14px",border:`1px solid ${C.border}`,borderRadius:6,background:"none",color:C.textMuted,fontFamily:F,fontSize:12,cursor:"pointer"}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* table */}
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:COLS,padding:"8px 14px",
          background:"#F8FAFC",borderBottom:`1px solid ${C.border}`}}>
          {[["",""],["topic","Topic"],["title","Subject"],["type","Type"],["priority","Priority"],
            ["due","Due"],["owner","Owner"],["org","Org"],["status","Status"],["log","Log"]].map(([k,h])=>(
            <div key={k||h} onClick={k?()=>sortBy(k):undefined}
              style={{fontFamily:F,fontSize:10,fontWeight:700,color:C.textMuted,letterSpacing:.5,
                cursor:k?"pointer":"default",display:"flex",alignItems:"center",gap:3,userSelect:"none"}}>
              {h}{k&&<SortIcon k={k} sortK={sortK} sortD={sortD}/>}
            </div>
          ))}
        </div>

        {filtered.map((item,idx)=>{
          const isOpen=expanded.has(item.id);
          const od=overdue(item.due)&&item.status==="OPEN";
          const lastLog=item.log.length>0?[...item.log].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]:null;
          return (
            <div key={item.id}>
              <div style={{display:"grid",gridTemplateColumns:COLS,padding:"0 14px",
                borderBottom:`1px solid ${isOpen?C.blueBorder:C.border}`,
                background:isOpen?"#F7FBFF":idx%2===0?C.surface:"#FAFBFD",
                borderLeft:isOpen?`3px solid ${C.blue}`:"3px solid transparent",transition:"all .1s"}}
                onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="#F0F7FF";}}
                onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background=idx%2===0?C.surface:"#FAFBFD";}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 0",cursor:"pointer"}} onClick={()=>toggle(item.id)}>
                  <div style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${isOpen?C.blue:C.border}`,
                    background:isOpen?C.blue:C.surface,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
                    <span style={{color:isOpen?"#fff":C.textMid,fontSize:8,fontWeight:700,
                      display:"inline-block",transform:isOpen?"rotate(90deg)":"none",transition:"transform .15s"}}>▶</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",padding:"10px 0"}}>
                  <span style={{fontFamily:M,fontSize:10,color:C.textMuted,background:C.bg,
                    padding:"2px 5px",borderRadius:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:84}}>{item.topic}</span>
                </div>
                <div style={{padding:"7px 8px 7px 0"}}>
                  <EditCell value={item.title} onSave={v=>update(item.id,"title",v)} style={{fontWeight:600}} />
                  {lastLog&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"0 6px",marginTop:1}}>
                    <span style={{fontFamily:M,fontSize:10,color:C.blue,background:C.blueBg,padding:"1px 4px",borderRadius:3}}>W{lastLog.week}</span>
                    <span style={{fontFamily:F,fontSize:11,color:C.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"88%"}}>
                      {lastLog.text.slice(0,75)}{lastLog.text.length>75?"…":""}
                    </span>
                  </div>}
                  {(item.linkedVars||[]).length>0 && (
                    <div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 6px",flexWrap:"wrap"}}>
                      {item.linkedVars.map(vid=>(
                        <span key={vid} style={{fontFamily:M,fontSize:10,fontWeight:700,
                          color:BRAND.shp,background:BRAND.shpBg,border:`1px solid ${BRAND.shpBorder}`,
                          padding:"1px 6px",borderRadius:3,cursor:"pointer"}}
                          onClick={()=>setTab("variations")}
                          title="View in Variations register">
                          {vid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <Badge label={item.type} bg={item.type==="ACTION"?C.actionBg:C.infoBg}
                    color={item.type==="ACTION"?C.actionColor:C.infoColor}
                    border={item.type==="ACTION"?C.Highborder:C.border} size={10} />
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <EditCell value={item.priority} type="select" options={PRIORITIES} onSave={v=>update(item.id,"priority",v)} />
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <EditCell value={item.due} type="date" onSave={v=>update(item.id,"due",v)}
                    style={{fontFamily:M,fontSize:11,color:od?C.High:C.textMid}} />
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Avatar name={item.owner} size={22} />
                  <EditCell value={item.owner} type="select" options={ALL_OWNERS} onSave={v=>update(item.id,"owner",v)} />
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <EditCell value={item.org} type="select" options={ORGS} onSave={v=>update(item.id,"org",v)}
                    style={{fontFamily:M,fontSize:11,color:C.textMid}} />
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <EditCell value={item.status} type="select" options={STATUSES} onSave={v=>update(item.id,"status",v)} />
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:3}} onClick={()=>toggle(item.id)}>
                  <span style={{fontFamily:M,fontSize:12,fontWeight:700,color:item.log.length>0?C.blue:C.textDim}}>{item.log.length}</span>
                </div>
              </div>
              {isOpen&&<LogTimeline entries={item.log} onAdd={(e,vid)=>addLog(item.id,e,vid)}
                session={session} presentAuthors={presentAuthors} />}
            </div>
          );
        })}
        {filtered.length===0&&<div style={{padding:"36px 0",textAlign:"center",color:C.textMuted,fontFamily:F,fontSize:13}}>No items match.</div>}
      </div>
      </div>} {/* end actions tab */}

      {/* ── IMPORT REPORT MODAL ──────────────────────────────────────────── */}
      {importReport && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9000,
          display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{ if(e.target===e.currentTarget) setImportReport(null); }}>
          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,
            width:"min(640px,94vw)",maxHeight:"80vh",overflow:"hidden",
            display:"flex",flexDirection:"column",boxShadow:"0 12px 48px rgba(0,0,0,.35)"}}>

            {/* header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontFamily:F,fontWeight:700,fontSize:15,color:C.text}}>
                Rapport d'import Excel — {importReport.total} actions traitées
              </span>
              <button onClick={()=>setImportReport(null)} style={{border:"none",background:"none",
                cursor:"pointer",color:C.textMuted,fontSize:20,lineHeight:1,padding:"0 4px"}}>✕</button>
            </div>

            {/* summary pills */}
            <div style={{display:"flex",gap:10,padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
              {[
                { label:"Créées",       icon:"✅", n: importReport.created.length,  bg:"#d1fae5", color:"#065f46" },
                { label:"Mises à jour", icon:"🔄", n: importReport.updated.length,  bg:"#dbeafe", color:"#1e40af" },
                { label:"Ignorées",     icon:"⏭",  n: importReport.skipped.length,  bg:C.surface,  color:C.textMid },
                { label:"Erreurs",      icon:"✗",  n: importReport.errors.length,   bg:"#fee2e2", color:"#991b1b" },
              ].map(({label,icon,n,bg,color})=>(
                <div key={label} style={{flex:1,textAlign:"center",padding:"10px 6px",
                  background:bg,borderRadius:10,border:`1px solid ${color}22`}}>
                  <div style={{fontFamily:M,fontSize:22,fontWeight:800,color}}>{n}</div>
                  <div style={{fontFamily:F,fontSize:11,color,opacity:.85,marginTop:2}}>{icon} {label}</div>
                </div>
              ))}
            </div>

            {/* detail list */}
            <div style={{overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:6}}>
              {importReport.created.length>0 && (
                <Section label="✅ Créées" color="#065f46" bg="#d1fae5">
                  {importReport.created.map((r,i)=>(
                    <Row key={i} title={r.title} detail={null} color="#065f46" />
                  ))}
                </Section>
              )}
              {importReport.updated.length>0 && (
                <Section label="🔄 Mises à jour" color="#1e40af" bg="#dbeafe">
                  {importReport.updated.map((r,i)=>(
                    <Row key={i} title={r.title}
                      detail={Object.keys(r.changes??{}).join(", ")} color="#1e40af" />
                  ))}
                </Section>
              )}
              {importReport.skipped.length>0 && (
                <Section label="⏭ Ignorées" color={C.textMid} bg={C.surface}>
                  {importReport.skipped.map((r,i)=>(
                    <Row key={i} title={r.title} detail={r.reason} color={C.textMid} />
                  ))}
                </Section>
              )}
              {importReport.errors.length>0 && (
                <Section label="✗ Erreurs" color="#991b1b" bg="#fee2e2">
                  {importReport.errors.map((r,i)=>(
                    <Row key={i} title={r.title} detail={r.message} color="#991b1b" />
                  ))}
                </Section>
              )}
            </div>

            {/* footer */}
            <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>handleExportImportReport(importReport)}
                style={{padding:"8px 22px",background:C.closedColor,border:"none",borderRadius:8,
                  color:"#fff",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                📥 Télécharger rapport
              </button>
              <button onClick={()=>setImportReport(null)}
                style={{padding:"8px 22px",background:C.blue,border:"none",borderRadius:8,
                  color:"#fff",fontFamily:F,fontWeight:700,fontSize:13,cursor:"pointer"}}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══ helpers locaux pour le rapport ═══════════════════════════════════════ */
function Section({label,color,bg,children}){
  return (
    <div>
      <div style={{fontFamily:F,fontWeight:700,fontSize:12,color,background:bg,
        borderRadius:6,padding:"3px 8px",display:"inline-block",marginBottom:4}}>
        {label}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:3,paddingLeft:8}}>
        {children}
      </div>
    </div>
  );
}
function Row({title,detail,color}){
  return (
    <div style={{display:"flex",gap:8,alignItems:"flex-start",fontFamily:F,fontSize:12}}>
      <span style={{color,fontWeight:600,wordBreak:"break-word",flex:1}}>{title}</span>
      {detail && <span style={{color:C.textDim,fontStyle:"italic",fontSize:11,flex:1}}>{detail}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════════════ */
export default function App(){
  const [step,setStep]         = useState(1);
  const [maxStep,setMaxStep]    = useState(1);
  const [session,setSession]   = useState(null);
  const [participants,setPart] = useState(null);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [devTags, setDevTags]   = useState(
    Object.fromEntries(DEV_TAGS.map(t=>[t.tag, false]))
  );
  const devMenuRef = useRef(null);
  const anyDevActive = useMemo(()=>Object.values(devTags).some(Boolean), [devTags]);
  const { saving, error: saveError, saveSession, saveAttendance, fetchAllParticipants } = useSession();
  const { user, signOut } = useAuth();

  const FONT_OPTIONS = ['DM Sans','Inter','Roboto','Poppins','Space Grotesk','Nunito Sans'];
  const MONO_OPTIONS = ['DM Mono','JetBrains Mono','Fira Code','IBM Plex Mono'];
  const [devTheme, setDevTheme] = useState({
    fontFamily:'DM Sans', monoFamily:'DM Mono',
    fontSize:100, borderRadius:8,
    accentColor:'#A31035', zoom:100,
    shadow:true, smoothEdges:true,
  });
  const devThemeDefault = {fontFamily:'DM Sans',monoFamily:'DM Mono',fontSize:100,borderRadius:8,accentColor:'#A31035',zoom:100,shadow:true,smoothEdges:true};
  function setDT(k,v){ setDevTheme(t=>({...t,[k]:v})); }

  /* inject / update CSS theme overrides */
  useEffect(()=>{
    // load Google Font dynamically
    const fontId = 'dev-gfont';
    let lk = document.getElementById(fontId);
    if(!lk){ lk=document.createElement('link'); lk.id=fontId; lk.rel='stylesheet'; document.head.appendChild(lk); }
    const gFonts = [...new Set([devTheme.fontFamily, devTheme.monoFamily])]
      .map(f=>f.replace(/ /g,'+')).join('&family=');
    lk.href = `https://fonts.googleapis.com/css2?family=${gFonts}:wght@400;500;600;700&display=swap`;
    // inject override style
    const id = 'dev-theme-override';
    let el = document.getElementById(id);
    if(!el){ el=document.createElement('style'); el.id=id; document.head.appendChild(el); }
    const {fontFamily,monoFamily,fontSize,borderRadius,accentColor,zoom,shadow,smoothEdges} = devTheme;
    const acc = accentColor;
    const accDark = acc + 'cc';
    el.textContent = [
      `html { font-size:${fontSize}% !important; }`,
      `html body *:not([data-dev-ignore] *):not([data-dev-ignore]) { font-family:'${fontFamily}',system-ui,sans-serif !important; }`,
      `#root>div { zoom:${zoom/100}; transform-origin:top left; }`,
      smoothEdges ? `html body button,html body input,html body select,html body textarea,html body [style*="borderRadius"]{border-radius:${borderRadius}px !important;}` : '',
      shadow ? '' : `html body * { box-shadow:none !important; text-shadow:none !important; }`,
      // accent color overrides via inline-style attribute selectors
      `[style*="A31035"]{background-color:${acc} !important;border-color:${acc} !important;}`,
      `[style*="a31035"]{background-color:${acc} !important;border-color:${acc} !important;}`,
      `[style*="color:\"#A31035\""],[style*="color: #A31035"]{color:${acc} !important;}`,
      `[style*="#7A0C26"]{background-color:${accDark} !important;}`,
    ].join('\n');
    return ()=>{ el.textContent=''; };
  },[devTheme]);

  /* close menu on outside click */
  useEffect(()=>{
    if(!devMenuOpen) return;
    function onDown(e){ if(devMenuRef.current && !devMenuRef.current.contains(e.target)) setDevMenuOpen(false); }
    document.addEventListener('mousedown', onDown);
    return()=>document.removeEventListener('mousedown', onDown);
  },[devMenuOpen]);

  /* apply / refresh overlay whenever devTags changes */
  useEffect(()=>{
    const active = Object.entries(devTags).filter(([,v])=>v).map(([k])=>k);
    if(active.length===0){
      document.body.removeAttribute('data-dev');
      document.querySelectorAll('[data-dev-id]').forEach(el=>{
        el.removeAttribute('data-dev-id');
        el.removeAttribute('data-dev-tag');
        el.removeAttribute('data-dev-info');
      });
      return;
    }
    document.body.setAttribute('data-dev', active.join(' '));
    let n=0;
    document.querySelectorAll('div,header,main,section,article,aside,nav,footer,form').forEach(el=>{
      if(el.closest('[data-dev-ignore]')) return;
      const cs=window.getComputedStyle(el);
      const d=cs.display;
      const tag=el.tagName.toLowerCase();
      const info=[];
      if(d==='flex'||d==='inline-flex') info.push(cs.flexDirection==='row'?'flex→':'flex↓');
      else if(d==='grid'||d==='inline-grid') info.push('grid');
      else if(d!=='block'&&d!=='none') info.push(d);
      if(cs.position!=='static') info.push(cs.position.slice(0,3));
      const id=++n;
      el.setAttribute('data-dev-id',`${id}`);
      el.setAttribute('data-dev-tag',tag);
      el.setAttribute('data-dev-info',`[${id}] ${tag}${info.length?' · '+info.join(' '):''}`);
    });
    return()=>{
      document.body.removeAttribute('data-dev');
      document.querySelectorAll('[data-dev-id]').forEach(el=>{
        el.removeAttribute('data-dev-id');
        el.removeAttribute('data-dev-tag');
        el.removeAttribute('data-dev-info');
      });
    };
  },[devTags]);

  async function handleSessionNext(formData){
    try {
      const rec = await saveSession(formData);
      setSession(rec);
      setStep(2); setMaxStep(s=>Math.max(s,2));
    } catch(e) { console.error('[handleSessionNext]', e); /* saveError already set in hook */ }
  }

  function navigateTo(n){
    if(n>=1 && n<=maxStep) setStep(n);
  }

  async function handleAttendanceNext(parts){
    try {
      await saveAttendance(session.id, parts);
      setPart(parts);
      setStep(3); setMaxStep(s=>Math.max(s,3));
    } catch(e) { console.error('[handleAttendanceNext]', e); /* saveError already set in hook */ }
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:F,color:C.text}}>
      <div />{/* ← anchor DIV[1] */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        select,input,button,textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
        /* ── Dev Overlay ── */
        [data-dev-tag]{position:relative !important;}
        body[data-dev~="div"] [data-dev-tag="div"]{outline:1px dashed #3b82f666 !important;}
        body[data-dev~="header"] [data-dev-tag="header"]{outline:2px solid #f9731699 !important;}
        body[data-dev~="main"] [data-dev-tag="main"]{outline:2px solid #c084fc99 !important;}
        body[data-dev~="section"] [data-dev-tag="section"]{outline:2px solid #a3e63599 !important;}
        body[data-dev~="form"] [data-dev-tag="form"]{outline:2px solid #34d39999 !important;}
        body[data-dev~="nav"] [data-dev-tag="nav"]{outline:2px solid #fbbf2499 !important;}
        body[data-dev~="aside"] [data-dev-tag="aside"]{outline:2px solid #f8717199 !important;}
        body[data-dev~="footer"] [data-dev-tag="footer"]{outline:2px solid #94a3b899 !important;}
        body[data-dev~="div"] [data-dev-tag="div"]::after,
        body[data-dev~="header"] [data-dev-tag="header"]::after,
        body[data-dev~="main"] [data-dev-tag="main"]::after,
        body[data-dev~="section"] [data-dev-tag="section"]::after,
        body[data-dev~="form"] [data-dev-tag="form"]::after,
        body[data-dev~="nav"] [data-dev-tag="nav"]::after,
        body[data-dev~="aside"] [data-dev-tag="aside"]::after,
        body[data-dev~="footer"] [data-dev-tag="footer"]::after{
          content:attr(data-dev-info);
          position:absolute;top:0;left:0;
          font:700 7px/1.5 monospace !important;
          padding:1px 6px;
          border-radius:0 0 4px 0;
          pointer-events:none;
          white-space:nowrap;
          z-index:99999;
          background:rgba(15,23,42,.9);
          color:#93c5fd;
          border-right:1px solid #1e40af55;
          border-bottom:1px solid #1e40af55;
        }
        body[data-dev~="header"] [data-dev-tag="header"]::after{background:#431407e0;color:#fed7aa;border-color:#9a3412;}
        body[data-dev~="main"] [data-dev-tag="main"]::after{background:#2e1065e0;color:#e9d5ff;border-color:#7e22ce;}
        body[data-dev~="section"] [data-dev-tag="section"]::after{background:#14532de0;color:#bef264;border-color:#16a34a;}
        body[data-dev~="form"] [data-dev-tag="form"]::after{background:#052e16e0;color:#bbf7d0;border-color:#15803d;}
        body[data-dev~="nav"] [data-dev-tag="nav"]::after{background:#422006e0;color:#fde68a;border-color:#d97706;}
        body[data-dev~="aside"] [data-dev-tag="aside"]::after{background:#450a0ae0;color:#fca5a5;border-color:#dc2626;}
        body[data-dev~="footer"] [data-dev-tag="footer"]::after{background:#0f172ae0;color:#94a3b8;border-color:#475569;}
      `}</style>
      <div />{/* ← anchor DIV[2] */}

      {/* HEADER — 2 colonnes : logo | (déconnexion / steps+user) */}
      <header style={{background:"#0F172A",borderBottom:`1px solid #1E293B`,
        display:"grid",gridTemplateColumns:"auto 1fr",
        height:80,position:"sticky",top:0,zIndex:50}}>
        {/* Colonne gauche — logo + app name */}
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"0 28px",
          borderRight:"1px solid #1e293b"}}>
          <img src={shpLogo} alt="SHP · United Nations Geneva"
            style={{height:48,objectFit:"contain",filter:"brightness(0) invert(1)",opacity:.92}} />
          <div style={{width:1,height:28,background:"#334155"}} />
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#F8FAFC",letterSpacing:.2,lineHeight:1.1,
              fontFamily:F}}>BuildTracker</div>
            <div style={{fontSize:10,color:"#64748B",fontFamily:M,letterSpacing:.4}}>Building C · 12W LOA</div>
          </div>
        </div>
        {/* Colonne droite — 2 lignes */}
        <div style={{display:"flex",flexDirection:"column"}}>
          {/* Ligne 1 — Déconnexion */}
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",
            flex:1,borderBottom:"1px solid #1e293b",padding:"0 20px"}}>
            <button onClick={signOut}
              style={{background:"#1e293b",border:"1px solid #334155",color:"#cbd5e1",
                padding:"3px 12px",borderRadius:5,cursor:"pointer",fontSize:12,fontFamily:F}}>
              Déconnexion
            </button>
          </div>
          {/* Ligne 2 — StepBar + navigation + user */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            flex:1,padding:"0 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {/* Bouton précédent */}
              <button
                onClick={()=>navigateTo(step-1)}
                disabled={step<=1}
                title="Étape précédente"
                style={{width:26,height:26,border:`1px solid ${step>1?"#334155":"#1e293b"}`,
                  borderRadius:6,background:"transparent",cursor:step>1?"pointer":"not-allowed",
                  color:step>1?"#94a3b8":"#2d3f55",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:12,transition:"all .15s",padding:0,flexShrink:0}}
                onMouseEnter={e=>{if(step>1){e.currentTarget.style.borderColor="#60a5fa55";e.currentTarget.style.color="#60a5fa";}}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=step>1?"#334155":"#1e293b";e.currentTarget.style.color=step>1?"#94a3b8":"#2d3f55";}}>
                ◀
              </button>
              <StepBar step={step} maxStep={maxStep} onNavigate={navigateTo} />
              {/* Bouton suivant */}
              <button
                onClick={()=>navigateTo(step+1)}
                disabled={step>=maxStep}
                title="Étape suivante"
                style={{width:26,height:26,border:`1px solid ${step<maxStep?"#334155":"#1e293b"}`,
                  borderRadius:6,background:"transparent",cursor:step<maxStep?"pointer":"not-allowed",
                  color:step<maxStep?"#94a3b8":"#2d3f55",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:12,transition:"all .15s",padding:0,flexShrink:0}}
                onMouseEnter={e=>{if(step<maxStep){e.currentTarget.style.borderColor="#60a5fa55";e.currentTarget.style.color="#60a5fa";}}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=step<maxStep?"#334155":"#1e293b";e.currentTarget.style.color=step<maxStep?"#94a3b8":"#2d3f55";}}>
                ▶
              </button>
            </div>
            {user && <span style={{fontFamily:F,fontSize:12,color:"#e2e8f0"}}>
              <strong>{user.full_name}</strong>
              &nbsp;·&nbsp;<span style={{color:"#94a3b8"}}>{user.org}</span>
              &nbsp;·&nbsp;<span style={{color:user.role==="admin"?"#f97316":user.role==="editor"?"#22c55e":"#94a3b8"}}>{user.role}</span>
            </span>}
          </div>
        </div>
      </header>

      <div style={{padding:"32px 28px 72px"}}>
        {step===1 && <SessionSetup onNext={handleSessionNext} saving={saving} saveError={saveError} />}
        {step===2 && <ParticipantsStep session={session} onNext={handleAttendanceNext} onBack={()=>setStep(1)} saving={saving} saveError={saveError} fetchAllParticipants={fetchAllParticipants} />}
        {step===3 && <ActionLog session={session} participants={participants} />}
      </div>

      {/* ── Bottom DevBar ────────────────────────────────────────────────── */}
      <div data-dev-ignore style={{position:"fixed",bottom:0,left:0,right:0,height:44,
        background:"#080d14",borderTop:"1px solid #1e293b",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"0 20px",zIndex:100}}>
        {/* Gauche — statut + contrôle PocketBase */}
        <PbBottomStatus />
        {/* Droite — bouton DEV (ouvre le drawer gauche) */}
        <button
          onClick={()=>setDevMenuOpen(v=>!v)}
          title="DEV Overlay — ouvre le panneau de réglages"
          style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",
            border:`1px solid ${anyDevActive||devMenuOpen?"#60a5fa55":"#334155"}`,
            borderRadius:6,background:anyDevActive||devMenuOpen?"#172554":"transparent",
            cursor:"pointer",transition:"all .2s"}}>
          <span style={{width:8,height:8,borderRadius:"50%",
            background:anyDevActive?"#60a5fa":"#475569",
            boxShadow:anyDevActive?"0 0 8px #60a5fa99":"none",
            transition:"all .2s"}}/>
          <span style={{fontFamily:M,fontSize:10,fontWeight:700,letterSpacing:.4,
            color:anyDevActive?"#93c5fd":"#64748B"}}>DEV</span>
          <span style={{fontFamily:M,fontSize:9,color:anyDevActive?"#93c5fd":"#475569",
            display:"inline-block",transform:devMenuOpen?"rotate(90deg)":"none",
            transition:"transform .2s",lineHeight:1}}>▸</span>
        </button>
      </div>

      {/* ── DEV Side Drawer ─────────────────────────────────────────────── */}
      <div ref={devMenuRef} data-dev-ignore
        style={{position:"fixed",top:0,right:devMenuOpen?0:-280,bottom:0,width:260,
          background:"#080d14",borderLeft:"1px solid #334155",
          zIndex:200,transition:"right .28s cubic-bezier(.4,0,.2,1)",
          display:"flex",flexDirection:"column",
          boxShadow:devMenuOpen?"-6px 0 32px rgba(0,0,0,.7)":"none"}}>

        {/* En-tête drawer */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 16px",borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:8,height:8,borderRadius:"50%",
              background:anyDevActive?"#60a5fa":"#475569",
              boxShadow:anyDevActive?"0 0 8px #60a5fa99":"none"}}/>
            <span style={{fontFamily:M,fontSize:11,fontWeight:700,letterSpacing:.8,
              color:"#93c5fd"}}>DEV TOOLS</span>
          </div>
          <button onClick={()=>setDevMenuOpen(false)}
            style={{background:"none",border:"1px solid #334155",color:"#64748b",
              cursor:"pointer",borderRadius:4,width:22,height:22,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,lineHeight:1,padding:0}}>×</button>
        </div>

        {/* Section — TYPOGRAPHIE */}
        <div style={{borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px 6px"}}>
            <span style={{fontFamily:M,fontSize:9,fontWeight:700,color:"#475569",letterSpacing:.6}}>TYPOGRAPHIE</span>
            <button onClick={()=>setDT('fontFamily',devThemeDefault.fontFamily)}
              style={{fontFamily:M,fontSize:9,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}}>↺</button>
          </div>
          <div style={{padding:"0 16px 10px",display:"flex",flexDirection:"column",gap:8}}>
            {/* Font sans-serif */}
            <div>
              <span style={{fontFamily:M,fontSize:9,color:"#334155",display:"block",marginBottom:3}}>Sans-serif</span>
              <select value={devTheme.fontFamily} onChange={e=>setDT('fontFamily',e.target.value)}
                style={{width:"100%",padding:"5px 8px",background:"#0f172a",border:"1px solid #334155",
                  borderRadius:5,fontFamily:M,fontSize:11,color:"#94a3b8",cursor:"pointer"}}>
                {FONT_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {/* Font mono */}
            <div>
              <span style={{fontFamily:M,fontSize:9,color:"#334155",display:"block",marginBottom:3}}>Monospace</span>
              <select value={devTheme.monoFamily} onChange={e=>setDT('monoFamily',e.target.value)}
                style={{width:"100%",padding:"5px 8px",background:"#0f172a",border:"1px solid #334155",
                  borderRadius:5,fontFamily:M,fontSize:11,color:"#94a3b8",cursor:"pointer"}}>
                {MONO_OPTIONS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {/* Font size */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:M,fontSize:9,color:"#334155"}}>Taille</span>
                <span style={{fontFamily:M,fontSize:9,color:"#60a5fa"}}>{devTheme.fontSize}%</span>
              </div>
              <input type="range" min="70" max="130" step="5" value={devTheme.fontSize}
                onChange={e=>setDT('fontSize',Number(e.target.value))}
                style={{width:"100%",accentColor:"#60a5fa",cursor:"pointer"}} />
            </div>
          </div>
        </div>

        {/* Section — COULEURS */}
        <div style={{borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px 6px"}}>
            <span style={{fontFamily:M,fontSize:9,fontWeight:700,color:"#475569",letterSpacing:.6}}>COULEURS</span>
            <button onClick={()=>setDT('accentColor',devThemeDefault.accentColor)}
              style={{fontFamily:M,fontSize:9,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}}>↺</button>
          </div>
          <div style={{padding:"0 16px 10px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="color" value={devTheme.accentColor}
                onChange={e=>setDT('accentColor',e.target.value)}
                style={{width:36,height:28,borderRadius:5,border:"1px solid #334155",
                  background:"none",cursor:"pointer",padding:2}} />
              <div style={{flex:1}}>
                <span style={{fontFamily:M,fontSize:9,color:"#334155",display:"block",marginBottom:2}}>Couleur accent</span>
                <span style={{fontFamily:M,fontSize:10,color:"#60a5fa"}}>{devTheme.accentColor.toUpperCase()}</span>
              </div>
            </div>
            {/* Presets */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {["#A31035","#009EDB","#7C3AED","#0D9488","#EA580C","#2563EB"].map(col=>(
                <button key={col} onClick={()=>setDT('accentColor',col)}
                  title={col}
                  style={{width:20,height:20,borderRadius:4,background:col,border:devTheme.accentColor===col?"2px solid #fff":"2px solid transparent",cursor:"pointer",padding:0}} />
              ))}
            </div>
          </div>
        </div>

        {/* Section — APPARENCE */}
        <div style={{borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px 6px"}}>
            <span style={{fontFamily:M,fontSize:9,fontWeight:700,color:"#475569",letterSpacing:.6}}>APPARENCE</span>
            <button onClick={()=>setDevTheme(devThemeDefault)}
              style={{fontFamily:M,fontSize:9,color:"#ef4444",background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}}>reset all</button>
          </div>
          <div style={{padding:"0 16px 10px",display:"flex",flexDirection:"column",gap:8}}>
            {/* Border radius */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:M,fontSize:9,color:"#334155"}}>Border radius</span>
                <span style={{fontFamily:M,fontSize:9,color:"#60a5fa"}}>{devTheme.borderRadius}px</span>
              </div>
              <input type="range" min="0" max="20" step="1" value={devTheme.borderRadius}
                onChange={e=>setDT('borderRadius',Number(e.target.value))}
                style={{width:"100%",accentColor:"#60a5fa",cursor:"pointer"}} />
            </div>
            {/* Zoom */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontFamily:M,fontSize:9,color:"#334155"}}>Zoom</span>
                <span style={{fontFamily:M,fontSize:9,color:"#60a5fa"}}>{devTheme.zoom}%</span>
              </div>
              <input type="range" min="60" max="130" step="5" value={devTheme.zoom}
                onChange={e=>setDT('zoom',Number(e.target.value))}
                style={{width:"100%",accentColor:"#60a5fa",cursor:"pointer"}} />
            </div>
            {/* Toggles */}
            {[['shadow','Ombres'],['smoothEdges','Border radius auto']].map(([k,lbl])=>(
              <div key={k} onClick={()=>setDT(k,!devTheme[k])}
                style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",
                  padding:"4px 0"}}>
                <div style={{width:28,height:14,borderRadius:7,position:"relative",
                  background:devTheme[k]?"#3b82f644":"#1e293b",
                  border:`1px solid ${devTheme[k]?"#3b82f6":"#334155"}`,transition:"all .2s",flexShrink:0}}>
                  <div style={{width:10,height:10,borderRadius:"50%",position:"absolute",
                    top:1,left:devTheme[k]?15:1,
                    background:devTheme[k]?"#60a5fa":"#475569",
                    transition:"left .15s,background .15s"}} />
                </div>
                <span style={{fontFamily:M,fontSize:11,color:devTheme[k]?"#94a3b8":"#475569"}}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section — CHROME DEVTOOLS */}
        <div style={{padding:"10px 16px 10px",borderBottom:"1px solid #1e293b",flexShrink:0}}>
          <span style={{fontFamily:M,fontSize:9,fontWeight:700,color:"#475569",letterSpacing:.6,
            display:"block",marginBottom:8}}>NAVIGATEUR</span>
          <button
            onClick={()=>{
              // Tente de simuler ⌘⌥I — fonctionne dans certains contextes Electron/WebView
              document.dispatchEvent(new KeyboardEvent('keydown',{
                key:'i', code:'KeyI', metaKey:true, altKey:true,
                bubbles:true, cancelable:true
              }));
              // Dump d'état console (toujours utile)
              console.group('%c🔧 DEV DUMP', 'color:#60a5fa;font-weight:bold;font-size:13px');
              console.log('%cNote: ouvrir DevTools manuellement avec ⌘⌥I','color:#94a3b8;font-style:italic');
              console.log('URL', window.location.href);
              console.log('User Agent', navigator.userAgent);
              console.groupEnd();
            }}
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"8px 12px",borderRadius:6,cursor:"pointer",
              background:"#0f172a",border:"1px solid #334155",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#60a5fa55";e.currentTarget.style.background="#172554";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="#334155";e.currentTarget.style.background="#0f172a";}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14}}>🔧</span>
              <span style={{fontFamily:F,fontSize:12,fontWeight:600,color:"#94a3b8"}}>Chrome DevTools</span>
            </div>
            <span style={{fontFamily:M,fontSize:10,color:"#475569",
              background:"#1e293b",border:"1px solid #334155",
              padding:"2px 6px",borderRadius:4}}>⌘⌥I</span>
          </button>
          <div style={{marginTop:6,padding:"5px 8px",background:"#0a1628",borderRadius:4,
            border:"1px solid #1e293b"}}>
            <span style={{fontFamily:M,fontSize:9,color:"#475569",lineHeight:1.5}}>
              Les navigateurs bloquent l'ouverture programmatique de DevTools.<br/>
              Utilisez le raccourci <strong style={{color:"#60a5fa"}}>⌘⌥I</strong> directement.
            </span>
          </div>
        </div>

        {/* Section — ÉLÉMENTS CSS */}
        <div style={{overflowY:"auto",flex:1,paddingBottom:52}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 16px 6px"}}>
            <span style={{fontFamily:M,fontSize:9,fontWeight:700,color:"#475569",letterSpacing:.6}}>
              ÉLÉMENTS CSS
            </span>
            <button
              onClick={()=>setDevTags(t=>Object.fromEntries(Object.keys(t).map(k=>[k,!anyDevActive])))}
              style={{fontFamily:M,fontSize:9,fontWeight:700,letterSpacing:.3,
                color:anyDevActive?"#ef4444":"#22c55e",
                background:"none",border:"none",cursor:"pointer",padding:"2px 4px"}}>
              {anyDevActive?"tout OFF":"tout ON"}
            </button>
          </div>
          {DEV_TAGS.map(({tag,color})=>(
            <div key={tag}
              onClick={()=>setDevTags(t=>({...t,[tag]:!t[tag]}))}
              style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",
                cursor:"pointer",transition:"background .1s",
                background:devTags[tag]?`${color}12`:"transparent"}}
              onMouseEnter={e=>e.currentTarget.style.background=devTags[tag]?`${color}22`:"#1e293b"}
              onMouseLeave={e=>e.currentTarget.style.background=devTags[tag]?`${color}12`:"transparent"}>
              <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,
                background:devTags[tag]?color:"#334155",
                boxShadow:devTags[tag]?`0 0 5px ${color}88`:"none",
                transition:"all .2s"}} />
              <span style={{fontFamily:M,fontSize:11,fontWeight:600,flex:1,
                color:devTags[tag]?color:"#64748b"}}>{tag}</span>
              {/* mini toggle */}
              <div style={{width:28,height:14,borderRadius:7,position:"relative",
                background:devTags[tag]?`${color}44`:"#1e293b",
                border:`1px solid ${devTags[tag]?color:"#334155"}`,
                transition:"all .2s",flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:"50%",position:"absolute",
                  top:1,left:devTags[tag]?15:1,
                  background:devTags[tag]?color:"#475569",
                  transition:"left .15s,background .15s"}} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
