/// <reference path="../pb_data/types.d.ts" />
// Seed des utilisateurs initiaux — PocketBase 0.36 JSVM
// Mot de passe par défaut : Tracker2026!  (à changer au premier login)

migrate((app) => {
  const col = app.findCollectionByNameOrId("users");

  const USERS = [
    { email: "patrick@shp.local",  full_name: "Patrick",         org: "SHP",   role: "admin"  },
    { email: "admin@shp.local",    full_name: "Admin SHP",       org: "SHP",   role: "admin"  },
    { email: "editor@rpn.local",   full_name: "Éditeur RPN",     org: "RPN",   role: "editor" },
    { email: "viewer@sombp.local", full_name: "Viewer SOMBP",    org: "SOMBP", role: "viewer" },
  ];

  for (const u of USERS) {
    // Éviter les doublons si la migration est rejouée
    try {
      app.findFirstRecordByFilter("users", `email = {:email}`, { email: u.email });
      // existe déjà → skip
      continue;
    } catch (_) { /* introuvable → on crée */ }

    const record = new Record(col);
    record.set("email",           u.email);
    record.set("emailVisibility", true);
    record.set("verified",        true);
    record.set("full_name",       u.full_name);
    record.set("org",             u.org);
    record.set("role",            u.role);
    record.setPassword("Tracker2026!");

    app.save(record);
  }
}, (app) => {
  const emails = [
    "patrick@shp.local",
    "admin@shp.local",
    "editor@rpn.local",
    "viewer@sombp.local",
  ];

  for (const email of emails) {
    try {
      const record = app.findFirstRecordByFilter("users", `email = {:email}`, { email });
      app.delete(record);
    } catch (_) { /* déjà supprimé */ }
  }
});
