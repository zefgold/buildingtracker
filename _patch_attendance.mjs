const PB = "http://127.0.0.1:8090";

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "admin@shp.local", password: "AdminSHP2025" }),
}).then(r => r.json());
const token = auth.token;

// Récupérer l'ID de la collection sessions (nécessaire pour le champ relation)
const sessionsCol = await fetch(`${PB}/api/collections/sessions`, {
  headers: { Authorization: token },
}).then(r => r.json());
const sessionsId = sessionsCol.id;
console.log("sessions id:", sessionsId);

// Patcher attendance
const res = await fetch(`${PB}/api/collections/attendance`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Authorization: token },
  body: JSON.stringify({
    fields: [
      {
        name: "session",
        type: "relation",
        required: true,
        collectionId: sessionsId,
        cascadeDelete: true,
        maxSelect: 1,
      },
      { name: "participant", type: "text",   required: true  },
      { name: "substitute",  type: "text",   required: false },
      {
        name: "org",
        type: "select",
        required: false,
        maxSelect: 1,
        values: ["RPN", "SHP", "SOMBP", "G&T"],
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["present", "absent", "excused"],
      },
    ],
  }),
}).then(r => r.json());

if (res.fields) {
  console.log("✅ Champs attendance:", res.fields.map(f => `${f.name} (${f.type})`).join(", "));
} else {
  console.error("✗ Erreur:", JSON.stringify(res, null, 2));
}
