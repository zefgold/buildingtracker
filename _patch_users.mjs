const PB = "http://127.0.0.1:8090";

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "admin@shp.local", password: "AdminSHP2025" }),
}).then(r => r.json());

const token = auth.token;
if (!token) { console.error("Auth échouée:", auth); process.exit(1); }

// 1. Vérifier les champs actuels
const col = await fetch(`${PB}/api/collections/users`, {
  headers: { Authorization: token },
}).then(r => r.json());

console.log("Champs actuels:", col.fields?.map(f => `${f.name} (${f.type})`).join(", "));

// 2. Ajouter les champs manquants (full_name, org, role) si absents
const existing = new Set(col.fields?.map(f => f.name) ?? []);
const toAdd = [];

if (!existing.has("full_name")) toAdd.push({ name: "full_name", type: "text",   required: true,  min: 2, max: 120 });
if (!existing.has("org"))       toAdd.push({ name: "org",       type: "select", required: true,  maxSelect: 1, values: ["RPN","SHP","SOMBP","G&T"] });
if (!existing.has("role"))      toAdd.push({ name: "role",      type: "select", required: true,  maxSelect: 1, values: ["admin","editor","viewer"] });

if (toAdd.length === 0) {
  console.log("✅ Tous les champs existent déjà.");
} else {
  // Pour les auth collections PocketBase, on envoie UNIQUEMENT les nouveaux champs
  // sans inclure les champs système (id, password, email, etc.)
  const patch = await fetch(`${PB}/api/collections/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ fields: toAdd }),
  }).then(r => r.json());

  if (patch.status >= 400) {
    console.error("✗ Erreur patch:", JSON.stringify(patch, null, 2));
  } else {
    console.log("✅ Champs après patch:", patch.fields?.map(f => f.name).join(", "));
  }
}

// 3. Mettre à jour testuser pour lui donner role=admin
const list = await fetch(`${PB}/api/collections/users/records?filter=email='testuser@shp.local'`, {
  headers: { Authorization: token },
}).then(r => r.json());

if (list.items?.length) {
  const uid = list.items[0].id;
  const upd = await fetch(`${PB}/api/collections/users/records/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ role: "admin", org: "SHP", full_name: "Test User SHP" }),
  }).then(r => r.json());
  console.log("👤 testuser mis à jour → role:", upd.role, "org:", upd.org);
} else {
  console.log("⚠  testuser introuvable");
}
