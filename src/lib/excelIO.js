/**
 * src/lib/excelIO.js
 * Import / Export Excel au format "12 week LOA - Building C issues.xlsx"
 *
 * Structure du fichier cible (sheet "Bldg C 12WLOA") :
 *   Lignes 0-1   : titre + section A "MEETING DETAILS"
 *   Lignes 2-9   : détails réunion (MEETING., WEEK NO., SECTION, DATE, TIME,
 *                  LOCATION, PURPOSE, NEXT MEETING)
 *   Ligne  10    : vide
 *   Ligne  11    : section B "STAKEHOLDERS" header
 *   Lignes 12-…  : participants (role, org, Yes/No, name)
 *   (rembourrage jusqu'à ligne 35)
 *   Ligne  36ish : header colonnes actions
 *   Lignes 37+   : section-headers + data rows
 *
 * Colonnes actions (index 0-based) :
 *   0  C1 / section
 *   1  MEETING TOPIC (titre)
 *   2  ACTION - INFO
 *   3  STATUS
 *   4  DESCRIPTION - INFORMATION LOG (historique concaténé)
 *   5  ACTION REQUIRED
 *   6  PRIORITY
 *   7  DUE DATE (serial Excel)
 *   8  OWNER ORG.
 *   9  OWNER NAME 1
 *  10  OWNER NAME 2
 *  11  DISCIPLINE
 *  12  DATE LOGGED
 *  13  DATE CLOSED
 *  14  ESCALATE
 *  15  Note
 *  16  Row_PM
 *  17  Notify_PM
 *  18  Condition_PM
 *  19  ROW
 */

import * as XLSX from 'xlsx';

// ── Helpers date ──────────────────────────────────────────────────────────────

/** Serial Excel → ISO YYYY-MM-DD */
function xlSerialToIso(serial) {
  if (!serial || typeof serial !== 'number' || serial <= 0) return '';
  // xlsx epoch: Dec 30 1899 = day 0
  const ms = (serial - 25569) * 86400 * 1000;
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

/** ISO YYYY-MM-DD → serial Excel */
function isoToXlSerial(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return Math.round(d.getTime() / 86400000 + 25569);
}

/** Serial Excel → "DD.MM.YYYY" (for display in the cell as text fallback) */
function xlSerialToDisplay(serial) {
  const iso = xlSerialToIso(serial);
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

// ── Colonne mapping ───────────────────────────────────────────────────────────
const C = { SECTION:0, TOPIC:1, TYPE:2, STATUS:3, LOG:4, ACTION:5,
            PRIORITY:6, DUE:7, ORG:8, OWNER1:9, OWNER2:10, DISC:11,
            LOGGED:12, CLOSED:13, ESCALATE:14, NOTE:15 };

const VALID_PRIO   = ['TOP','High','Medium','Low'];
const VALID_STATUS = ['OPEN','CLOSED'];

// ── IMPORT ────────────────────────────────────────────────────────────────────

/**
 * Lit un File (.xlsx) et retourne { session, actions }.
 * session : { week, section, meeting_date, location, next_meeting }
 * actions : tableau d'objets prêts pour l'UI (champs = ceux du composant ActionLog)
 */
export function importFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });

        const wsName = wb.SheetNames.find(s => s.includes('12WLOA') || s.includes('Bldg C'));
        const ws = wb.Sheets[wsName || wb.SheetNames[0]];
        if (!ws) throw new Error('Sheet not found');

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // ── Session details (lignes avant le header) ──────────────────────────
        const session = {};
        const headerIdx = rows.findIndex(r =>
          String(r[1]).includes('MEETING TOPIC') ||
          String(r[1]).includes('MEETING AGENDA')
        );
        // chercher les méta-données
        for (let i = 0; i < Math.min(headerIdx < 0 ? 36 : headerIdx, rows.length); i++) {
          const r = rows[i];
          const lbl = String(r[1]).toUpperCase().trim();
          if (lbl === 'WEEK NO.')     session.week          = r[4];
          if (lbl === 'SECTION')      session.section       = String(r[4]).trim();
          if (lbl === 'DATE')         session.meeting_date  = xlSerialToIso(r[4]);
          if (lbl === 'LOCATION')     session.location      = String(r[4]).trim();
          if (lbl === 'NEXT MEETING') session.next_meeting  = xlSerialToIso(r[4]);
          if (lbl === 'TIME')         session.time          = r[4];
        }

        // ── Participants (section B) ──────────────────────────────────────────
        const participants = [];
        const stakeholderIdx = rows.findIndex(r => String(r[1]).toUpperCase() === 'STAKEHOLDERS');
        if (stakeholderIdx >= 0) {
          for (let i = stakeholderIdx + 1; i < rows.length; i++) {
            const r = rows[i];
            // fin de bloc participants : row vide ou début des actions
            if (!r[4] && !r[1] && !r[2]) break;
            const org  = String(r[2]).trim();
            const name = String(r[4]).trim();
            if (!name || name === 'Name' || name === 'Column1') continue;
            participants.push({
              id:         'xl_' + i,
              name,
              role:       String(r[1]).trim(),
              org,
              attendance: String(r[3]).toUpperCase() === 'YES' ? 'PRESENT' : 'ABSENT',
              substitute: '',
            });
          }
        }

        // ── Actions (lignes après l'en-tête de colonnes) ──────────────────────
        // L'en-tête colonnes est la ligne qui contient "MEETING TOPIC" en col 1
        const colHeaderIdx = rows.findIndex(r => String(r[1]) === 'MEETING TOPIC');
        if (colHeaderIdx < 0) throw new Error('Column header row not found');

        const actions = [];
        for (let i = colHeaderIdx + 1; i < rows.length; i++) {
          const r = rows[i];
          const type = String(r[C.TYPE]).trim().toUpperCase();
          // Sauter les en-têtes de section et lignes vides
          if (type !== 'ACTION' && type !== 'INFO') continue;

          const rawPrio = String(r[C.PRIORITY]).trim();
          const priority = VALID_PRIO.includes(rawPrio) ? rawPrio : 'Medium';
          const rawStatus = String(r[C.STATUS]).trim().toUpperCase();
          const status = VALID_STATUS.includes(rawStatus) ? rawStatus : 'OPEN';

          // Le "log" Excel = DESCRIPTION concaténée; on crée une entrée unique
          const logText = String(r[C.LOG]).trim();
          const actionLog = logText ? [{
            id:     'xl_' + i,
            week:   session.week ?? null,
            date:   session.meeting_date ?? new Date().toISOString().slice(0, 10),
            org:    String(r[C.ORG]).split('/')[0].trim() || '',
            author: String(r[C.OWNER1]).trim(),
            type:   'note',
            text:   logText,
            from:   '',
            to:     '',
            field:  '',
          }] : [];

          actions.push({
            id:       'xl_r' + i,
            section:  String(r[C.SECTION]).trim(),
            topic:    String(r[C.SECTION]).trim(),
            title:    String(r[C.TOPIC]).replace(/\r\n/g, '\n').trim(),
            type:     type === 'INFO' ? 'INFO' : 'ACTION',
            status,
            priority,
            due:      xlSerialToIso(r[C.DUE]),
            org:      String(r[C.ORG]).trim(),
            owner:    String(r[C.OWNER1]).trim(),
            owner2:   String(r[C.OWNER2]).trim(),
            log:      actionLog,
            linkedVars: [],
          });
        }

        resolve({ session, participants, actions });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

/**
 * Génère et télécharge un fichier .xlsx en respectant exactement la structure
 * du template "12 week LOA - Building C issues.xlsx".
 *
 * @param {object}   session       – données de session
 * @param {object[]} participants  – liste des participants
 * @param {object[]} actions       – actions (avec .log[] chaque entrée)
 */
export function exportToExcel(session, participants, actions) {
  const wb = XLSX.utils.book_new();
  const W = 26; // nombre de colonnes du template
  const empty = () => Array(W).fill('');

  const rows = [];

  // ── Ligne 0 : titre ────────────────────────────────────────
  const r0 = empty();
  r0[0] = '#'; r0[1] = 'MEETING AGENDA';
  rows.push(r0);

  // ── Ligne 1 : section A ────────────────────────────────────
  const r1 = empty();
  r1[0] = 'A'; r1[1] = 'MEETING DETAILS';
  rows.push(r1);

  // ── Ligne 2 : type réunion ─────────────────────────────────
  const r2 = empty();
  r2[1] = 'MEETING.'; r2[4] = 'PRODUCTION';
  rows.push(r2);

  // ── Lignes 3-9 : détails ───────────────────────────────────
  const details = [
    ['WEEK NO.',     session.week        ?? ''],
    ['SECTION',      session.section     ?? 'C'],
    ['DATE',         session.meeting_date ? isoToXlSerial(session.meeting_date) : ''],
    ['TIME',         0.4375],
    ['LOCATION',     session.location    ?? ''],
    ['PURPOSE',      '- To support and protect the Production Plan\r\n- To strive for improved Production Plan stability and predictability.'],
    ['NEXT MEETING', session.next_meeting ? isoToXlSerial(session.next_meeting) : ''],
  ];
  for (const [lbl, val] of details) {
    const r = empty();
    r[1] = lbl; r[4] = val;
    rows.push(r);
  }

  // ── Ligne 10 : vide ────────────────────────────────────────
  rows.push(empty());

  // ── Ligne 11 : en-tête participants ───────────────────────
  const rB = empty();
  rB[0] = 'B'; rB[1] = 'STAKEHOLDERS';
  rB[2] = 'Org.'; rB[3] = 'In Attendance'; rB[4] = 'Name'; rB[5] = 'Column1';
  rows.push(rB);

  // ── Lignes 12+ : participants ──────────────────────────────
  const ORG_ORDER = ['RPN','SHP','SOMBP','G&T'];
  const sorted = [...participants].sort((a, b) =>
    (ORG_ORDER.indexOf(a.org) - ORG_ORDER.indexOf(b.org)) ||
    a.name.localeCompare(b.name)
  );
  for (const p of sorted) {
    const rp = empty();
    rp[1] = p.role  ?? '';
    rp[2] = p.org   ?? '';
    rp[3] = p.attendance === 'PRESENT' ? 'Yes' : 'No';
    rp[4] = p.name  ?? '';
    rows.push(rp);
  }

  // ── Rembourrage jusqu'à ligne 35 ──────────────────────────
  while (rows.length < 35) rows.push(empty());
  rows.push(empty()); // ligne 35 séparateur

  // ── Ligne 36 : en-têtes colonnes actions ──────────────────
  rows.push([
    'C1', 'MEETING TOPIC', 'ACTION - INFO', 'STATUS',
    'DESCRIPTION -  INFORMATION LOG', 'ACTION REQUIRED', 'PRIORITY', 'DUE DATE',
    'OWNER ORG.', 'OWNER NAME 1', 'OWNER NAME 2', 'DISCIPLINE',
    'DATE LOGGED', 'DATE CLOSED', 'ESCALATE', 'Note',
    'Row_PM', 'Notify_PM', 'Condition_PM', 'ROW',
    '', '', '', '', '', '',
  ]);

  // ── Lignes 37+ : actions groupées par section ─────────────
  const sections = [...new Set(actions.map(a => a.section).filter(Boolean))];
  let rowNum = rows.length;

  for (const sec of sections) {
    // En-tête de section
    const rs = empty();
    rs[0] = sec; rs[1] = sec;
    rs[17] = '-'; rs[18] = '--'; rs[19] = rowNum++;
    rows.push(rs);

    for (const a of actions.filter(x => x.section === sec)) {
      // Reconstituer le log texte (date: texte, ...)
      const logLines = [...(a.log ?? a.action_logs ?? [])]
        .sort((x, y) => new Date(x.date) - new Date(y.date))
        .map(l => {
          const d = l.date
            ? new Date(l.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            : '';
          return d ? `${d}: ${l.text}` : l.text;
        })
        .join('\r\n');

      const ra = empty();
      ra[C.SECTION]  = a.section  ?? '';
      ra[C.TOPIC]    = a.title    ?? a.topic ?? '';
      ra[C.TYPE]     = a.type     ?? 'ACTION';
      ra[C.STATUS]   = a.status   ?? 'OPEN';
      ra[C.LOG]      = logLines;
      ra[C.ACTION]   = '';  // ACTION REQUIRED non stocké séparément
      ra[C.PRIORITY] = a.priority ?? 'Medium';
      ra[C.DUE]      = a.due ? isoToXlSerial(a.due) : '';
      ra[C.ORG]      = a.org   ?? '';
      ra[C.OWNER1]   = a.owner ?? '';
      ra[C.OWNER2]   = '';
      ra[C.DISC]     = '';
      ra[C.LOGGED]   = '';
      ra[C.CLOSED]   = a.status === 'CLOSED' ? isoToXlSerial(new Date().toISOString().slice(0,10)) : '';
      ra[C.ESCALATE] = '';
      ra[C.NOTE]     = '';
      ra[16] = '';  ra[17] = '-'; ra[18] = '--'; ra[19] = rowNum++;
      rows.push(ra);
    }
  }

  // ── Créer la feuille ──────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Largeurs colonnes approximatives (template original)
  ws['!cols'] = [
    { wch: 15 }, // C1
    { wch: 35 }, // MEETING TOPIC
    { wch: 12 }, // ACTION - INFO
    { wch: 8  }, // STATUS
    { wch: 55 }, // DESCRIPTION
    { wch: 35 }, // ACTION REQUIRED
    { wch: 10 }, // PRIORITY
    { wch: 12 }, // DUE DATE
    { wch: 14 }, // OWNER ORG
    { wch: 22 }, // OWNER NAME 1
    { wch: 22 }, // OWNER NAME 2
    { wch: 12 }, // DISCIPLINE
    { wch: 12 }, // DATE LOGGED
    { wch: 12 }, // DATE CLOSED
    { wch: 10 }, // ESCALATE
    { wch: 20 }, // Note
  ];

  // Formater les cellules date (numérique + format DD.MM.YYYY)
  const dateCellRows = [];
  // Meeting dates : lignes 5 (DATE) et 9 (NEXT MEETING) → col 4
  for (const ridx of [5, 9]) {
    const ref = XLSX.utils.encode_cell({ r: ridx, c: 4 });
    if (ws[ref] && typeof ws[ref].v === 'number' && ws[ref].v > 10000) {
      ws[ref].t = 'n'; ws[ref].z = 'DD.MM.YYYY';
    }
  }
  // Action dates : colonnes 7, 12, 13 à partir de la ligne d'en-tête +1
  for (let r = 37; r < rows.length; r++) {
    for (const c of [7, 12, 13]) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref] && typeof ws[ref].v === 'number' && ws[ref].v > 10000) {
        ws[ref].t = 'n'; ws[ref].z = 'DD.MM.YYYY';
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Bldg C 12WLOA');

  // ── Télécharger ──────────────────────────────────────────
  const weekNum = session.week ?? '';
  const filename = `BuildingC_12WLOA_W${weekNum}.xlsx`;
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
