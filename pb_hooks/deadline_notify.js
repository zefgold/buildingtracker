// pb_hooks/deadline_notify.js
// PocketBase 0.36 JSVM hook – emails automatiques avant deadline
// Tourne via le cron intégré de PocketBase (pas besoin d'infra externe)
//
// Variables d'environnement à définir dans le fichier .env PocketBase :
//   RESEND_API_KEY  – https://resend.com (3 000 emails/mois gratuits)
//   APP_URL         – ex: https://your-tracker.vercel.app
//   FROM_EMAIL      – adresse expéditrice vérifiée dans Resend

/// <reference path="../pb_data/types.d.ts" />

const REMIND_DAYS = [7, 3, 1];

// Jours avant deadline déclenchant un rappel

onBeforeServe((e) => {
  // Enregistrer le cron : tous les jours à 08h00 UTC
  $app.cron().add("deadline-notify", "0 8 * * *", () => {
    const resendKey = $os.getenv("RESEND_API_KEY");
    const appUrl = $os.getenv("APP_URL") || "http://localhost:3000";
    const fromEmail = $os.getenv("FROM_EMAIL") || "tracker@example.com";

    if (!resendKey) {
      console.error("[deadline-notify] RESEND_API_KEY manquant – arrêt.");
      return;
    }

    const today = new Date();

    // Récupérer toutes les actions OPEN avec une date d'échéance
    let actions;
    try {
      actions = $app
        .dao()
        .findRecordsByFilter(
          "actions",
          "status = 'OPEN' && due != ''",
          "-due",
          200,
          0,
        );
    } catch (err) {
      console.error("[deadline-notify] Erreur de requête :", err);
      return;
    }

    let sent = 0;

    for (const action of actions) {
      const dueStr = action.getString("due");
      if (!dueStr) continue;

      const due = new Date(dueStr);
      const diffDays = Math.round((due - today) / 86_400_000);

      if (!REMIND_DAYS.includes(diffDays)) continue;

      const owner = action.getString("owner");

      // Trouver le profil utilisateur par full_name
      let ownerRecord;
      try {
        ownerRecord = $app
          .dao()
          .findFirstRecordByFilter("users", `full_name = {:name}`, {
            name: owner,
          });
      } catch (_) {
        console.warn(`[deadline-notify] Propriétaire introuvable : ${owner}`);
        continue;
      }

      const email = ownerRecord.email();
      if (!email) continue;

      const title = action.getString("title");
      const priority = action.getString("priority");
      const org = action.getString("org");
      const dayWord = diffDays === 1 ? "demain" : `dans ${diffDays} jours`;

      const subject = `[Tracker] Rappel – "${title}" échéance ${dayWord}`;
      const html = `
        <p>Bonjour ${owner},</p>
        <p>Ce message est un rappel automatique : l'action suivante arrive à échéance <strong>${dayWord}</strong>.</p>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:12px 0">
          <tr><td style="padding:4px 16px 4px 0;color:#64748b">Titre</td>     <td><strong>${title}</strong></td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b">Priorité</td>  <td>${priority}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b">Échéance</td>  <td>${dueStr}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#64748b">Org</td>       <td>${org}</td></tr>
        </table>
        <p><a href="${appUrl}" style="color:#009EDB">Ouvrir le tracker →</a></p>
        <p style="color:#94a3b8;font-size:12px">Meeting Minutes Tracker – Building C</p>
      `;

      // Appel Resend via $http
      let success = false;
      let errMsg = "";
      try {
        const resp = $http.send({
          url: "https://api.resend.com/emails",
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: fromEmail, to: email, subject, html }),
          timeout: 10,
        });
        success = resp.statusCode >= 200 && resp.statusCode < 300;
        if (!success) errMsg = `HTTP ${resp.statusCode}`;
      } catch (err) {
        errMsg = String(err);
      }

      // Journaliser dans notification_log
      try {
        const collection = $app
          .dao()
          .findCollectionByNameOrId("notification_log");
        const log = new Record(collection);
        log.set("action", action.id);
        log.set("recipient", email);
        log.set("subject", subject);
        log.set("success", success);
        log.set("error", errMsg);
        $app.dao().saveRecord(log);
      } catch (err) {
        console.error("[deadline-notify] Erreur de log :", err);
      }

      if (success) {
        sent++;
        console.log(
          `[deadline-notify] Email envoyé → ${email} (action ${action.id})`,
        );
      } else {
        console.error(`[deadline-notify] Échec envoi → ${email} : ${errMsg}`);
      }
    }

    console.log(`[deadline-notify] Terminé – ${sent} email(s) envoyé(s).`);
  });

  e.next();
});
