// src/lib/exportMinutes.js
// Generates a .docx Meeting Minutes document from live data.
// Requires: npm install docx file-saver
//
// Usage (in a React component):
//   import { exportMinutes } from '../lib/exportMinutes';
//   <button onClick={() => exportMinutes(session, attendees, actions)}>
//     Export Minutes
//   </button>

import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType,
  BorderStyle, ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';

// ── style constants ──────────────────────────────────────────
const SHP_RED  = 'A31035';
const UN_BLUE  = '009EDB';
const LIGHT_GREY = 'F2F4F7';
const BORDER_NIL = { style: BorderStyle.NONE, size: 0, color: 'auto' };

const bold   = (text, size = 20) => new TextRun({ text, bold: true,   size });
const normal = (text, size = 20) => new TextRun({ text, bold: false,  size });
const colored = (text, color, size = 18) =>
  new TextRun({ text, bold: true, size, color });

function cell(children, options = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [new Paragraph({ children })],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
      left:   BORDER_NIL,
      right:  BORDER_NIL,
    },
    ...options,
  });
}

function headerCell(text, shading = LIGHT_GREY) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [bold(text, 18)],
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading:  { type: ShadingType.CLEAR, fill: shading },
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: '94A3B8' },
      left:   BORDER_NIL,
      right:  BORDER_NIL,
    },
  });
}

// ── FORMAT DATE ──────────────────────────────────────────────
function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ── MAIN EXPORT ──────────────────────────────────────────────
export async function exportMinutes(session, attendees, actions) {
  const openActions   = actions.filter((a) => a.status === 'OPEN');
  const closedActions = actions.filter((a) => a.status === 'CLOSED');

  // HEADER section
  const header = [
    new Paragraph({
      children: [bold('MEETING MINUTES – BUILDING C', 32)],
      heading:   HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        colored('Week ', UN_BLUE),
        colored(String(session?.week ?? ''), UN_BLUE),
        normal('   |   '),
        normal(fmt(session?.meeting_date)),
        normal('   |   '),
        normal(session?.location ?? ''),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ text: '' }),
  ];

  // ATTENDEES table
  const attendeeRows = [
    new TableRow({
      children: [
        headerCell('Participant'),
        headerCell('Organisation'),
        headerCell('Status'),
      ],
      tableHeader: true,
    }),
    ...(attendees ?? []).map(
      (att) =>
        new TableRow({
          children: [
            cell([normal(att.participant ?? att.name)]),
            cell([normal(att.org ?? '')]),
            cell([
              colored(
                att.status,
                att.status === 'present' ? '16A34A' :
                att.status === 'excused' ? 'D97706' : 'DC2626',
              ),
            ]),
          ],
        })
    ),
  ];

  const attendeesSection = [
    new Paragraph({
      children: [bold('ATTENDEES', 24)],
      heading: HeadingLevel.HEADING_2,
    }),
    new Table({
      rows:  attendeeRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ text: '' }),
  ];

  // ACTIONS table builder
  function actionsTable(items, title, accentColor) {
    const rows = [
      new TableRow({
        children: [
          headerCell('#'),
          headerCell('Title'),
          headerCell('Owner'),
          headerCell('Priority'),
          headerCell('Due'),
          headerCell('Latest update'),
        ],
        tableHeader: true,
      }),
      ...items.map((a) => {
        const lastLog = [...(a.action_logs ?? [])].sort(
          (x, y) => new Date(y.date) - new Date(x.date)
        )[0];
        return new TableRow({
          children: [
            cell([normal(String(a.id), 18)]),
            cell([normal(a.title)]),
            cell([normal(a.owner)]),
            cell([colored(a.priority,
              a.priority === 'TOP'    ? 'EF4444' :
              a.priority === 'High'   ? 'F97316' :
              a.priority === 'Medium' ? 'EAB308' : '22C55E',
            )]),
            cell([normal(fmt(a.due))]),
            cell([normal(lastLog?.text ?? '—', 18)]),
          ],
        });
      }),
    ];

    return [
      new Paragraph({
        children: [colored(title, accentColor, 24)],
        heading: HeadingLevel.HEADING_2,
      }),
      new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
      new Paragraph({ text: '' }),
    ];
  }

  // ASSEMBLE DOCUMENT
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20 },
        },
      },
    },
    sections: [
      {
        children: [
          ...header,
          ...attendeesSection,
          ...actionsTable(openActions,   'OPEN ACTIONS',   SHP_RED),
          ...actionsTable(closedActions, 'CLOSED ACTIONS', '16A34A'),
          new Paragraph({
            children: [
              normal(`Generated on ${fmt(new Date().toISOString())} — Meeting Minutes Tracker Building C`, 16),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Minutes_Week${session?.week ?? 'X'}_BuildingC.docx`);
}
