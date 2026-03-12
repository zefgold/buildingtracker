// src/hooks/useActions.js
// CRUD + temps réel PocketBase 0.36.
// Chaque écriture génère automatiquement un action_log.

import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

const PRIO_ORDER = { TOP: 0, High: 1, Medium: 2, Low: 3 };

// ── charge toutes les actions avec leurs logs ─────────────────
async function fetchActions() {
  const items = await pb.collection('actions').getFullList({
    sort:   'due',
    expand: 'action_logs(action)',   // relation inversée
  });

  // Trier : priorité d'abord, puis date d'échéance
  return items
    .map((a) => ({
      ...a,
      action_logs: a.expand?.['action_logs(action)'] ?? [],
    }))
    .sort((a, b) =>
      (PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9) ||
      (a.due ?? '').localeCompare(b.due ?? '')
    );
}

// ── hook principal ────────────────────────────────────────────
export function useActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetchActions()
      .then(setActions)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();

    // Temps réel : toute modification dans actions ou action_logs recharge
    pb.collection('actions').subscribe('*', reload);
    pb.collection('action_logs').subscribe('*', reload);

    return () => {
      pb.collection('actions').unsubscribe();
      pb.collection('action_logs').unsubscribe();
    };
  }, [reload]);

  // ── CRÉER une action + premier log ──────────────────────────
  const createAction = useCallback(async (fields, user) => {
    const action = await pb.collection('actions').create({
      section:  fields.section,
      topic:    fields.topic,
      title:    fields.title,
      type:     fields.type,
      status:   fields.status   ?? 'OPEN',
      priority: fields.priority ?? 'Medium',
      due:      fields.due      ?? '',
      org:      fields.org,
      owner:    fields.owner,
      week:     fields.week     ?? null,
    });

    await pb.collection('action_logs').create({
      action:  action.id,
      week:    fields.week ?? null,
      date:    new Date().toISOString().slice(0, 10),
      org:     user.org,
      author:  user.full_name,
      type:    'note',
      text:    fields.initialNote ?? 'Action créée.',
    });

    return action;
  }, []);

  // ── AJOUTER un log à une action existante ───────────────────
  const addLog = useCallback(async (actionId, log, user) => {
    await pb.collection('action_logs').create({
      action:     actionId,
      week:       log.week   ?? null,
      date:       log.date   ?? new Date().toISOString().slice(0, 10),
      org:        log.org    ?? user?.org,
      author:     log.author ?? user?.full_name,
      type:       log.type   ?? 'note',
      text:       log.text,
      field:      log.field  ?? '',
      from_value: log.from   ?? '',
      to_value:   log.to     ?? '',
    });
  }, []);

  // ── MODIFIER un champ (loggué automatiquement) ───────────────
  const updateField = useCallback(
    async (actionId, field, newValue, user) => {
      const current  = actions.find((a) => a.id === actionId);
      const oldValue = current?.[field] ?? '';

      await pb.collection('actions').update(actionId, { [field]: newValue });

      await pb.collection('action_logs').create({
        action:     actionId,
        date:       new Date().toISOString().slice(0, 10),
        org:        user.org,
        author:     user.full_name,
        type:       'change',
        text:       `Champ "${field}" mis à jour.`,
        field,
        from_value: String(oldValue),
        to_value:   String(newValue),
      });
    },
    [actions]
  );

  // ── CLORE une action ─────────────────────────────────────────
  const closeAction = useCallback(
    async (actionId, note, user) => {
      await updateField(actionId, 'status', 'CLOSED', user);
      if (note) await addLog(actionId, { type: 'note', text: note }, user);
    },
    [updateField, addLog]
  );

  // ── UPSERT depuis import Excel ────────────────────────────────
  // Retourne { created, updated, skipped, errors }
  const upsertActions = useCallback(async (xlActions, user) => {
    const existing = await fetchActions();
    const byTitle  = new Map(existing.map(a => [a.title.trim().toLowerCase(), a]));

    const result = { created: [], updated: [], skipped: [], errors: [] };

    for (const xa of xlActions) {
      try {
        const key     = xa.title.trim().toLowerCase();
        const current = byTitle.get(key);

        if (current) {
          // ── UPDATE : seulement les champs qui changent ──────
          const changes = {};
          const tracked = ['priority','status','due','org','owner','section'];
          for (const f of tracked) {
            const nv = xa[f] ?? '';
            const cv = current[f] ?? '';
            if (String(nv) !== String(cv)) changes[f] = nv;
          }

          if (Object.keys(changes).length > 0) {
            await pb.collection('actions').update(current.id, changes);
            // Log de synthèse
            const summary = Object.entries(changes)
              .map(([k,v]) => `${k}: ${current[k]??'—'} → ${v}`)
              .join(', ');
            await pb.collection('action_logs').create({
              action: current.id,
              date:   new Date().toISOString().slice(0,10),
              org:    user?.org ?? '',
              author: user?.full_name ?? 'Import Excel',
              type:   'change',
              text:   `Import Excel — ${summary}`,
              field: '', from_value: '', to_value: '',
            });
            result.updated.push({ title: xa.title, changes });
          } else {
            result.skipped.push({ title: xa.title, reason: 'Aucun changement' });
          }
        } else {
          // ── CREATE ──────────────────────────────────────────
          const created = await pb.collection('actions').create({
            section:  xa.section  ?? '',
            topic:    xa.topic    ?? xa.section ?? '',
            title:    xa.title,
            type:     xa.type     ?? 'ACTION',
            status:   xa.status   ?? 'OPEN',
            priority: xa.priority ?? 'Medium',
            due:      xa.due      ?? '',
            org:      xa.org      ?? '',
            owner:    xa.owner    ?? '',
            week:     xa.week     ?? null,
          });
          // Log initial si description présente
          if (xa.log?.[0]?.text) {
            const l = xa.log[0];
            await pb.collection('action_logs').create({
              action: created.id,
              week:   l.week   ?? null,
              date:   l.date   ?? new Date().toISOString().slice(0,10),
              org:    l.org    ?? user?.org ?? '',
              author: l.author || user?.full_name || 'Import Excel',
              type:   'note',
              text:   l.text,
              field: '', from_value: '', to_value: '',
            });
          }
          result.created.push({ title: xa.title });
        }
      } catch (err) {
        result.errors.push({ title: xa.title, message: err.message });
      }
    }

    return result;
  }, []);

  return { actions, loading, error, reload, createAction, addLog, updateField, closeAction, upsertActions };
}
