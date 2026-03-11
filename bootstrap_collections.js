#!/usr/bin/env node
/**
 * bootstrap_collections.js
 * Crée toutes les collections PocketBase via REST API.
 * Exécuter UNE SEULE FOIS après le premier démarrage de PocketBase.
 *
 * Usage:  node bootstrap_collections.js
 *
 * Credentials par défaut : admin@shp.local / AdminSHP2025
 * Modifier PB_ADMIN_EMAIL / PB_ADMIN_PASS si nécessaire.
 */

const PB_URL        = process.env.PB_URL        || "http://127.0.0.1:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@shp.local";
const PB_ADMIN_PASS  = process.env.PB_ADMIN_PASS  || "AdminSHP2025";

// ── helpers ──────────────────────────────────────────────────────────────────
async function pb(method, path, body, token) {
  const res = await fetch(`${PB_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ── auth ─────────────────────────────────────────────────────────────────────
async function getToken() {
  const resp = await pb("POST", "/api/collections/_superusers/auth-with-password", {
    identity: PB_ADMIN_EMAIL,
    password: PB_ADMIN_PASS,
  });
  return resp.token;
}

// ── collection helpers ────────────────────────────────────────────────────────
async function collectionExists(name, token) {
  try {
    await pb("GET", `/api/collections/${name}`, null, token);
    return true;
  } catch {
    return false;
  }
}

async function upsertCollection(data, token) {
  const exists = await collectionExists(data.name, token);
  if (exists) {
    console.log(`  ⚠  Collection "${data.name}" existe déjà — skip.`);
    return;
  }
  await pb("POST", "/api/collections", data, token);
  console.log(`  ✅  Collection "${data.name}" créée.`);
}

async function patchCollection(name, data, token) {
  try {
    const current = await pb("GET", `/api/collections/${name}`, null, token);
    // Merge schema fields — only add missing ones (by name)
    const existingNames = new Set((current.schema || []).map(f => f.name));
    const newFields = (data.schema || []).filter(f => !existingNames.has(f.name));
    if (newFields.length === 0) {
      console.log(`  ⚠  Collection "${name}" déjà à jour — skip.`);
      return;
    }
    await pb("PATCH", `/api/collections/${name}`, {
      schema: [...(current.schema || []), ...newFields],
    }, token);
    console.log(`  ✅  Collection "${name}" mise à jour (+${newFields.length} champs).`);
  } catch (e) {
    console.error(`  ✗  Erreur patch "${name}":`, e.message);
  }
}

// ── schema definitions ────────────────────────────────────────────────────────
const ACTIONS_COLLECTION = {
  name: "actions",
  type: "base",
  listRule: "@request.auth.id != ''",
  viewRule: "@request.auth.id != ''",
  createRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  deleteRule: "@request.auth.role = 'admin'",
  schema: [
    { name: "section",  type: "text",   required: true  },
    { name: "topic",    type: "text",   required: true  },
    { name: "title",    type: "text",   required: true  },
    { name: "type",     type: "select", required: true,
      options: { maxSelect: 1, values: ["ACTION","INFO"] } },
    { name: "status",   type: "select", required: true,
      options: { maxSelect: 1, values: ["OPEN","CLOSED"] } },
    { name: "priority", type: "select", required: true,
      options: { maxSelect: 1, values: ["TOP","High","Medium","Low"] } },
    { name: "due",      type: "text",   required: false },
    { name: "org",      type: "text",   required: true  },
    { name: "owner",    type: "text",   required: true  },
    { name: "week",     type: "number", required: false },
  ],
};

const SESSIONS_COLLECTION = {
  name: "sessions",
  type: "base",
  listRule: "@request.auth.id != ''",
  viewRule: "@request.auth.id != ''",
  createRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
  deleteRule: "@request.auth.role = 'admin'",
  schema: [
    { name: "week",         type: "number", required: true  },
    { name: "meeting_date", type: "text",   required: true  },
    { name: "location",     type: "text",   required: false },
    { name: "chair",        type: "text",   required: false },
    { name: "notes",        type: "text",   required: false },
  ],
};

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀  Bootstrap PocketBase Collections\n");

  // 1. Auth
  console.log("🔑  Authentification...");
  let token;
  try {
    token = await getToken();
    console.log("  ✅  Token obtenu.\n");
  } catch (e) {
    console.error("  ✗  Auth échouée:", e.message);
    console.error("      Vérifiez que PocketBase tourne sur", PB_URL);
    process.exit(1);
  }

  // 2. Étendre la collection users (auth) — ajouter full_name, org, role
  console.log("👤  Extension collection 'users'...");
  await patchCollection("users", {
    schema: [
      { name: "full_name", type: "text",   required: true,
        options: { min: 2, max: 120, pattern: "" } },
      { name: "org",  type: "select", required: true,
        options: { maxSelect: 1, values: ["RPN","SHP","SOMBP","G&T"] } },
      { name: "role", type: "select", required: true,
        options: { maxSelect: 1, values: ["admin","editor","viewer"] } },
    ],
  }, token);

  // 3. Collection actions
  console.log("\n📋  Collection 'actions'...");
  await upsertCollection(ACTIONS_COLLECTION, token);

  // 4. Collection action_logs (relation vers actions — on récupère l'ID)
  console.log("\n📝  Collection 'action_logs'...");
  let actionsId;
  try {
    const actionsCol = await pb("GET", "/api/collections/actions", null, token);
    actionsId = actionsCol.id;
  } catch {
    console.error("  ✗  Impossible de récupérer l'ID de 'actions' — action_logs skipped.");
  }

  if (actionsId) {
    await upsertCollection({
      name: "action_logs",
      type: "base",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: "@request.auth.role = 'admin'",
      schema: [
        { name: "action",     type: "relation", required: true,
          options: { collectionId: actionsId, cascadeDelete: true, maxSelect: 1 } },
        { name: "week",       type: "number", required: false },
        { name: "date",       type: "text",   required: true  },
        { name: "org",        type: "select", required: false,
          options: { maxSelect: 1, values: ["RPN","SHP","SOMBP","G&T"] } },
        { name: "author",     type: "text",   required: true  },
        { name: "type",       type: "select", required: true,
          options: { maxSelect: 1, values: ["note","change","owner","status"] } },
        { name: "text",       type: "text",   required: true  },
        { name: "field",      type: "text",   required: false },
        { name: "from_value", type: "text",   required: false },
        { name: "to_value",   type: "text",   required: false },
      ],
    }, token);
  }

  // 5. Collection sessions
  console.log("\n📅  Collection 'sessions'...");
  await upsertCollection(SESSIONS_COLLECTION, token);

  // 6. Collection attendance
  console.log("\n🏢  Collection 'attendance'...");
  let sessionsId;
  try {
    const sessionsCol = await pb("GET", "/api/collections/sessions", null, token);
    sessionsId = sessionsCol.id;
  } catch {
    console.error("  ✗  Impossible de récupérer l'ID de 'sessions' — attendance skipped.");
  }

  if (sessionsId) {
    await upsertCollection({
      name: "attendance",
      type: "base",
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      schema: [
        { name: "session",     type: "relation", required: true,
          options: { collectionId: sessionsId, cascadeDelete: true, maxSelect: 1 } },
        { name: "participant", type: "text",   required: true  },
        { name: "org",         type: "select", required: false,
          options: { maxSelect: 1, values: ["RPN","SHP","SOMBP","G&T"] } },
        { name: "status",      type: "select", required: true,
          options: { maxSelect: 1, values: ["present","absent","excused"] } },
      ],
    }, token);
  }

  // 7. Collection notification_log
  console.log("\n🔔  Collection 'notification_log'...");
  await upsertCollection({
    name: "notification_log",
    type: "base",
    listRule: "@request.auth.role = 'admin'",
    viewRule: "@request.auth.role = 'admin'",
    createRule: null,
    updateRule: null,
    deleteRule: "@request.auth.role = 'admin'",
    schema: [
      ...(actionsId ? [{ name: "action", type: "relation", required: false,
        options: { collectionId: actionsId, cascadeDelete: false, maxSelect: 1 } }] : []),
      { name: "recipient", type: "text", required: true  },
      { name: "subject",   type: "text", required: true  },
      { name: "success",   type: "bool", required: false },
      { name: "error",     type: "text", required: false },
    ],
  }, token);

  // 8. Créer un utilisateur de test
  console.log("\n👤  Utilisateur de test 'testuser@shp.local'...");
  try {
    const exists = await collectionExists("users", token);
    if (exists) {
      try {
        await pb("POST", "/api/collections/users/records", {
          email:           "testuser@shp.local",
          emailVisibility: true,
          password:        "TestUser2025",
          passwordConfirm: "TestUser2025",
          full_name:       "Test User SHP",
          org:             "SHP",
          role:            "admin",
          verified:        true,
        }, token);
        console.log("  ✅  Utilisateur test créé (testuser@shp.local / TestUser2025).");
      } catch (e) {
        if (e.message.includes("400")) {
          console.log("  ⚠  Utilisateur test existe déjà — skip.");
        } else {
          throw e;
        }
      }
    }
  } catch (e) {
    console.error("  ✗  Erreur création utilisateur test:", e.message);
  }

  console.log("\n✨  Bootstrap terminé avec succès!\n");
  console.log("📌  Récapitulatif:");
  console.log("    PocketBase   → http://127.0.0.1:8090");
  console.log("    Admin UI     → http://127.0.0.1:8090/_/");
  console.log("    Admin        → admin@shp.local / AdminSHP2025");
  console.log("    Test user    → testuser@shp.local / TestUser2025");
  console.log("\n    Lance le frontend avec: npm run dev");
}

main().catch((e) => {
  console.error("\n✗  Bootstrap échoué:", e.message);
  process.exit(1);
});
