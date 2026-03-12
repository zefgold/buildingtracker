const PB = "http://127.0.0.1:8090";

const auth = await fetch(`${PB}/api/collections/_superusers/auth-with-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identity: "admin@shp.local", password: "AdminSHP2025" }),
}).then(r => r.json());

const token = auth.token;

const USERS = [
  { email: "patrick@shp.local",  full_name: "Patrick",      org: "SHP",   role: "admin"  },
  { email: "admin@shp.local",    full_name: "Admin SHP",    org: "SHP",   role: "admin"  },
  { email: "editor@rpn.local",   full_name: "Éditeur RPN",  org: "RPN",   role: "editor" },
  { email: "viewer@sombp.local", full_name: "Viewer SOMBP", org: "SOMBP", role: "viewer" },
  { email: "testuser@shp.local", full_name: "Test User SHP",org: "SHP",   role: "admin"  },
];

const list = await fetch(`${PB}/api/collections/users/records?perPage=50`, {
  headers: { Authorization: token },
}).then(r => r.json());

for (const rec of list.items) {
  const def = USERS.find(u => u.email === rec.email);
  if (!def) continue;
  if (rec.role && rec.org) { console.log(`⏭  ${rec.email} déjà ok`); continue; }

  const upd = await fetch(`${PB}/api/collections/users/records/${rec.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({ full_name: def.full_name, org: def.org, role: def.role }),
  }).then(r => r.json());

  console.log(`✅ ${upd.email} → role: ${upd.role} | org: ${upd.org}`);
}
