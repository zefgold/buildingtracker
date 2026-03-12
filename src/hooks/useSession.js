// src/hooks/useSession.js
// Sauvegarde session + attendance dans PocketBase 0.36.
// Utilisé par tracker_v3.jsx (Step 1 → sessions, Step 2 → attendance).

import { useState, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

export function useSession() {
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [session, setSession] = useState(null); // enregistrement PB courant

  // ── Sauvegarder (ou charger) la session PocketBase ──────────
  const saveSession = useCallback(async (formData) => {
    setSaving(true);
    setError(null);
    try {
      // Éviter les doublons : chercher par semaine
      const existing = await pb.collection('sessions').getFirstListItem(
        `week = ${Number(formData.week)}`
      ).catch(() => null);

      const payload = {
        meeting_date: formData.date         ?? '',
        type:         formData.type         ?? '',
        section:      formData.section      ?? '',
        location:     formData.location     ?? '',
        chair:        formData.chair        ?? '',
        next_meeting: formData.nextMeeting  ?? '',
        notes:        formData.notes        ?? '',
      };

      let rec;
      if (existing) {
        rec = await pb.collection('sessions').update(existing.id, payload);
      } else {
        rec = await pb.collection('sessions').create({
          week: Number(formData.week),
          ...payload,
        });
      }
      setSession(rec);
      return rec;
    } catch (e) {
      console.error('[useSession] saveSession:', e);
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Sauvegarder la liste des participants (attendance) ──────
  // participants : [{ id, name, org, role, attendance, substitute }]
  const saveAttendance = useCallback(async (sessionId, participants) => {
    setSaving(true);
    setError(null);
    try {
      // Supprimer les anciens enregistrements pour cette session (idempotent)
      const existing = await pb.collection('attendance').getFullList({
        filter: `session = '${sessionId}'`,
      });
      await Promise.all(
        existing.map((r) => pb.collection('attendance').delete(r.id))
      );

      // Insérer les nouveaux
      await Promise.all(
        participants.map((p) =>
          pb.collection('attendance').create({
            session:     sessionId,
            participant: p.name,
            org:         p.org,
            status:      p.attendance.toLowerCase(), // PRESENT/ABSENT/EXCUSED → present/absent/excused
            substitute:  p.substitute ?? '',
          })
        )
      );
    } catch (e) {
      console.error('[useSession] saveAttendance:', e);
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Récupérer tous les participants uniques de l'historique ──
  // Déduplique par nom (lowercase) ; en cas de doublon, le plus récent gagne.
  const fetchAllParticipants = useCallback(async () => {
    const all = await pb.collection('attendance').getFullList({ sort: 'created' });
    const map = new Map();
    for (const r of all) {
      const key = r.participant?.trim()?.toLowerCase();
      if (key) map.set(key, { name: r.participant.trim(), org: r.org ?? '' });
    }
    return Array.from(map.values());
  }, []);

  return { session, saving, error, saveSession, saveAttendance, fetchAllParticipants };
}
