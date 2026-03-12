const PB = "http://127.0.0.1:8090";

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "admin@shp.local", password: "AdminSHP2025" }),
}).then(r => r.json());

const token = auth.token;
if (!token) { console.error("Auth échouée:", auth); process.exit(1); }

const res = await fetch(`${PB}/api/collections/sessions`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "Authorization": token },
  body: JSON.stringify({
    fields: [
      { name: "week",         type: "number", required: true  },
      { name: "meeting_date", type: "text",   required: true  },
      { name: "type",         type: "text",   required: false },
      { name: "section",      type: "text",   required: false },
      { name: "location",     type: "text",   required: false },
      { name: "chair",        type: "text",   required: false },
      { name: "next_meeting", type: "text",   required: false },
      { name: "notes",        type: "text",   required: false },
    ],
  }),
}).then(r => r.json());

if (res.fields) {
  console.log("✅ Champs sessions:", res.fields.map(f => f.name).join(", "));
} else {
  console.error("✗ Erreur:", JSON.stringify(res, null, 2));
}
