const PB = "http://127.0.0.1:8090";

// Auth superuser (créé via CLI)
const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "patrick@avdigital.ch", password: "Yepla1234" }),
}).then(r => r.json());

const token = auth.token;
if (!token) { console.error("Auth échouée:", auth); process.exit(1); }
console.log("✅ Auth superuser OK");

// Créer l'utilisateur dans la collection users
const res = await fetch(`${PB}/api/collections/users/records`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: token },
  body: JSON.stringify({
    email: "patrick@avdigital.ch",
    emailVisibility: true,
    password: "Yepla1234",
    passwordConfirm: "Yepla1234",
    verified: true,
    full_name: "Patrick",
    org: "SHP",
    role: "admin",
  }),
}).then(r => r.json());

if (res.id) {
  console.log("✅ Utilisateur créé:", res.email, "| role:", res.role, "| org:", res.org);
} else {
  console.error("✗ Erreur:", JSON.stringify(res, null, 2));
}
