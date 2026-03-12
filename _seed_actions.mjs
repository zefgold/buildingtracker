/**
 * _seed_actions.mjs
 * Push les SEED_ACTIONS hardcodés vers PocketBase.
 * Idempotent : ignore les actions dont le titre existe déjà.
 *
 * Usage :  node _seed_actions.mjs
 */

const PB = "http://127.0.0.1:8090";

// ── Auth superuser ────────────────────────────────────────────────────────────
const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "patrick@avdigital.ch", password: "Yepla1234" }),
}).then(r => r.json());

const token = auth.token;
if (!token) { console.error("Auth échouée:", auth); process.exit(1); }
console.log("✅ Auth OK\n");

// ── Données ───────────────────────────────────────────────────────────────────
const SEED_ACTIONS = [
  { section:"C2", topic:"GENERAL", title:"Substantial Completion", type:"INFO", status:"OPEN", priority:"High", due:"2026-03-06", org:"RPN", owner:"Simone Conti", week:9,
    log:[
      { week:7, date:"2026-02-11", org:"RPN",   author:"Simone Conti",    type:"note",   text:"SC pending EGGTELSA manpower. 8-10 people missing on site." },
      { week:9, date:"2026-02-25", org:"RPN",   author:"Lorenzo Barnini", type:"note",   text:"Official S.C. 24.04 confirmed — no exclusions." },
    ]},
  { section:"C2", topic:"GENERAL", title:"Fire Matrix", type:"INFO", status:"OPEN", priority:"TOP", due:"2026-03-05", org:"RPN", owner:"Federica Brunone", week:9,
    log:[
      { week:1, date:"2025-12-03", org:"RPN",   author:"Federica Brunone",  type:"note",   text:"Meeting took place with SBIS / ENERGY MANAGEMENT." },
      { week:1, date:"2025-12-03", org:"RPN",   author:"Federica Brunone",  type:"note",   text:"EGGTELSA needs 2 months of works after Fire Matrix is approved." },
      { week:2, date:"2025-12-09", org:"SOMBP", author:"Cedric Erard",      type:"note",   text:"ENERGY MANAGEMENT provided info — pending SBIS response." },
      { week:5, date:"2026-01-07", org:"RPN",   author:"Federica Brunone",  type:"note",   text:"Fire Matrix uploaded on PMweb. MEP approved as noted." },
      { week:6, date:"2026-01-14", org:"SHP",   author:"Jean-Mathieu Ferre",type:"note",   text:"Approved as noted — some doors still missing." },
      { week:8, date:"2026-02-17", org:"RPN",   author:"Federica Brunone",  type:"note",   text:"Fire Matrix revised version uploaded." },
      { week:9, date:"2026-02-25", org:"RPN",   author:"Federica Brunone",  type:"change", text:"Phase 14 comments uploaded. Status R&R.", field:"status", from:"PENDING", to:"R&R" },
    ]},
  { section:"C2", topic:"LIFTS", title:"Lift 5, 6, 23 – Platform C6, C5", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-02-18", org:"RPN", owner:"Matteo Naldi", week:9,
    log:[
      { week:5, date:"2026-01-07", org:"RPN", author:"Gianluca Crippa", type:"note",  text:"Lift 6 strip-out completed. Installation to start 26.01." },
      { week:7, date:"2026-01-28", org:"RPN", author:"Matteo Naldi",    type:"owner", text:"Ownership transferred.", field:"owner", from:"Gianluca Crippa", to:"Matteo Naldi" },
      { week:7, date:"2026-02-11", org:"RPN", author:"Matteo Naldi",    type:"note",  text:"RPN to check if Platform C5 is working." },
    ]},
  { section:"C2", topic:"GENERAL", title:"Windows – NCF 382", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-02-27", org:"RPN/SHP", owner:"Davide Cirillo", week:9,
    log:[
      { week:8, date:"2026-02-18", org:"RPN", author:"Davide Cirillo",   type:"note", text:"NCF 382 raised. ~40 windows affected. Powder coating cracking." },
      { week:9, date:"2026-02-25", org:"SHP", author:"Didier Dequatre",  type:"note", text:"Supplier visited site. Manufacturer inspection planned +/- 03.03." },
    ]},
  { section:"C2", topic:"LB01", title:"Salle C6 – Interpreter Booth", type:"ACTION", status:"OPEN", priority:"TOP", due:"2026-03-11", org:"SHP", owner:"Kateryna Starykova", week:9,
    log:[
      { week:8, date:"2026-02-18", org:"SHP", author:"Jean-Mathieu Ferre",  type:"note",  text:"Acoustic test to be launched as soon as doors are installed." },
      { week:9, date:"2026-02-25", org:"SHP", author:"Kateryna Starykova",  type:"owner", text:"Ownership confirmed.", field:"owner", from:"Jean-Mathieu Ferre", to:"Kateryna Starykova" },
    ]},
  { section:"C3", topic:"T&C", title:"PMP Submittal", type:"ACTION", status:"OPEN", priority:"High", due:"2026-02-09", org:"RPN", owner:"Leonardo Valentinotti", week:9,
    log:[
      { week:6, date:"2026-01-26", org:"RPN", author:"Leonardo Valentinotti", type:"note", text:"RPN to ensure 80% of PMP submitted by 09.02." },
      { week:7, date:"2026-02-04", org:"RPN", author:"Leonardo Valentinotti", type:"note", text:"Submission at 65% — additional push required." },
    ]},
  { section:"NCF", topic:"NCF 382", title:"Windows – NCF", type:"ACTION", status:"OPEN", priority:"High", due:"2026-02-03", org:"RPN/SHP", owner:"Davide Cirillo", week:9,
    log:[
      { week:9, date:"2026-03-04", org:"RPN", author:"Davide Cirillo", type:"note", text:"RPN to assess situation following manufacturer site visit." },
    ]},
  { section:"C1", topic:"HSE", title:"Fire Closure – Level 4 & 5", type:"ACTION", status:"CLOSED", priority:"TOP", due:"2026-01-28", org:"RPN", owner:"Matteo Naldi", week:6,
    log:[
      { week:6, date:"2026-01-28", org:"RPN", author:"Matteo Naldi", type:"change", text:"Works completed and verified.", field:"status", from:"OPEN", to:"CLOSED" },
    ]},
];

// ── Charger les titres existants pour éviter les doublons ─────────────────────
const existing = await fetch(`${PB}/api/collections/actions/records?perPage=200`, {
  headers: { Authorization: token },
}).then(r => r.json());
const existingTitles = new Set((existing.items ?? []).map(a => a.title));
console.log(`Actions existantes en DB : ${existingTitles.size}`);

// ── Insérer chaque action + ses logs ─────────────────────────────────────────
let created = 0;
let skipped = 0;

for (const a of SEED_ACTIONS) {
  if (existingTitles.has(a.title)) {
    console.log(`  ⏭  Skipped (existe déjà) : ${a.title}`);
    skipped++;
    continue;
  }

  // Créer l'action
  const actionRes = await fetch(`${PB}/api/collections/actions/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      section:  a.section,
      topic:    a.topic,
      title:    a.title,
      type:     a.type,
      status:   a.status,
      priority: a.priority,
      due:      a.due,
      org:      a.org,
      owner:    a.owner,
      week:     a.week ?? null,
    }),
  }).then(r => r.json());

  if (!actionRes.id) {
    console.error(`  ✗ Erreur action "${a.title}":`, JSON.stringify(actionRes));
    continue;
  }

  // Créer les logs
  for (const l of a.log) {
    const logRes = await fetch(`${PB}/api/collections/action_logs/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        action:     actionRes.id,
        week:       l.week       ?? null,
        date:       l.date,
        org:        l.org        ?? "",
        author:     l.author,
        type:       l.type       ?? "note",
        text:       l.text,
        field:      l.field      ?? "",
        from_value: l.from       ?? "",
        to_value:   l.to         ?? "",
      }),
    }).then(r => r.json());

    if (!logRes.id) {
      console.error(`    ✗ Erreur log "${l.text.slice(0,40)}…":`, JSON.stringify(logRes));
    }
  }

  console.log(`  ✅ Créé : ${a.title} (${a.log.length} logs)`);
  created++;
}

console.log(`\nTerminé — ${created} action(s) créée(s), ${skipped} ignorée(s).`);
