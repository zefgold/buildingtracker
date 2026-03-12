const PB = "http://127.0.0.1:8090";

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "admin@shp.local", password: "AdminSHP2025" }),
}).then(r => r.json());
const token = auth.token;

// ── actions ──────────────────────────────────────────────────
const actionsCol = await fetch(`${PB}/api/collections/actions`, {
  headers: { Authorization: token },
}).then(r => r.json());

const actionsFields = actionsCol.fields?.map(f => f.name) ?? [];
console.log("actions champs actuels:", actionsFields.join(", "));

if (actionsFields.length <= 1) { // seulement 'id'
  const res = await fetch(`${PB}/api/collections/actions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      fields: [
        { name: "section",  type: "text",   required: true  },
        { name: "topic",    type: "text",   required: true  },
        { name: "title",    type: "text",   required: true  },
        { name: "type",     type: "select", required: true,  maxSelect: 1, values: ["ACTION", "INFO"] },
        { name: "status",   type: "select", required: true,  maxSelect: 1, values: ["OPEN", "CLOSED"] },
        { name: "priority", type: "select", required: true,  maxSelect: 1, values: ["TOP", "High", "Medium", "Low"] },
        { name: "due",      type: "text",   required: false },
        { name: "org",      type: "text",   required: true  },
        { name: "owner",    type: "text",   required: true  },
        { name: "week",     type: "number", required: false },
      ],
    }),
  }).then(r => r.json());

  if (res.fields) console.log("✅ actions patché:", res.fields.map(f => f.name).join(", "));
  else console.error("✗ actions erreur:", JSON.stringify(res, null, 2));
} else {
  console.log("✅ actions déjà ok");
}

// ── action_logs ───────────────────────────────────────────────
// Récupérer l'ID de la collection actions pour la relation
const actionsColFresh = await fetch(`${PB}/api/collections/actions`, {
  headers: { Authorization: token },
}).then(r => r.json());
const actionsId = actionsColFresh.id;
console.log("actions id:", actionsId);

const logsCol = await fetch(`${PB}/api/collections/action_logs`, {
  headers: { Authorization: token },
}).then(r => r.json());

const logsFields = logsCol.fields?.map(f => f.name) ?? [];
console.log("action_logs champs actuels:", logsFields.join(", "));

if (logsFields.length <= 1) {
  const res = await fetch(`${PB}/api/collections/action_logs`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      fields: [
        {
          name: "action",
          type: "relation",
          required: true,
          collectionId: actionsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: "week",       type: "number", required: false },
        { name: "date",       type: "text",   required: true  },
        { name: "org",        type: "select", required: false, maxSelect: 1, values: ["RPN", "SHP", "SOMBP", "G&T"] },
        { name: "author",     type: "text",   required: true  },
        { name: "type",       type: "select", required: true,  maxSelect: 1, values: ["note", "change", "owner", "status"] },
        { name: "text",       type: "text",   required: true  },
        { name: "field",      type: "text",   required: false },
        { name: "from_value", type: "text",   required: false },
        { name: "to_value",   type: "text",   required: false },
      ],
    }),
  }).then(r => r.json());

  if (res.fields) console.log("✅ action_logs patché:", res.fields.map(f => f.name).join(", "));
  else console.error("✗ action_logs erreur:", JSON.stringify(res, null, 2));
} else {
  console.log("✅ action_logs déjà ok");
}
