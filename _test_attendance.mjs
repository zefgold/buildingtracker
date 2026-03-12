const PB = "http://127.0.0.1:8090";

// Auth avec testuser
const auth = await fetch(`${PB}/api/collections/users/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "testuser@shp.local", password: "TestUser2025" }),
}).then(r => r.json());

const token = auth.token;
if (!token) { console.error("Auth échouée:", auth); process.exit(1); }
console.log("Connecté en tant que:", auth.record.email, "/ role:", auth.record.role);

// 1. Créer une session test
const sess = await fetch(`${PB}/api/collections/sessions/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: token },
  body: JSON.stringify({ week: 99, meeting_date: "2026-03-11", type: "TEST", section: "X", location: "Test" }),
}).then(r => r.json());

if (!sess.id) { console.error("SESSION ERR:", JSON.stringify(sess)); process.exit(1); }
console.log("✅ Session créée:", sess.id);

// 2. Créer un attendance
const att = await fetch(`${PB}/api/collections/attendance/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: token },
  body: JSON.stringify({ session: sess.id, participant: "Test User", org: "SHP", status: "present", substitute: "" }),
}).then(r => r.json());

if (att.id) {
  console.log("✅ Attendance OK:", att.id, "| status:", att.status);
} else {
  console.error("✗ ATTENDANCE ERR:", JSON.stringify(att, null, 2));
}

// Cleanup
await fetch(`${PB}/api/collections/sessions/records/${sess.id}`, {
  method: "DELETE", headers: { Authorization: token },
});
console.log("🧹 Session test supprimée.");
