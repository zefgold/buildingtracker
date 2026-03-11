// src/hooks/useAuth.js
// Auth PocketBase 0.36 – email + password, rôles par organisation.
// Expose : { user, loading, signIn, signOut, can }

import { useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';

// Matrice des permissions
// admin  → tout
// editor → créer / modifier actions & logs
// viewer → lecture seule
const PERMISSIONS = {
  admin:  ['read','create','edit','delete','admin'],
  editor: ['read','create','edit'],
  viewer: ['read'],
};

export function useAuth() {
  // pb.authStore.model contient le record utilisateur courant (ou null)
  const [user,    setUser]    = useState(pb.authStore.model ?? null);
  const [loading, setLoading] = useState(!pb.authStore.isValid);

  useEffect(() => {
    // Écouter chaque changement de session (login, logout, refresh token)
    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model ?? null);
      setLoading(false);
    });

    // Rafraîchir le token si déjà connecté (vérifie que la session est encore valide)
    if (pb.authStore.isValid) {
      pb.collection('users').authRefresh()
        .then(({ record }) => setUser(record))
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return unsub;
  }, []);

  // ── email + password
  const signIn = useCallback(async (email, password) => {
    const { record } = await pb.collection('users').authWithPassword(email, password);
    setUser(record);
  }, []);

  const signOut = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  // ── vérification de permission
  // can('edit')         → l'utilisateur courant a-t-il la permission ?
  // can('edit', 'SHP')  → vérifie aussi l'org (optionnel)
  const can = useCallback(
    (action, org) => {
      if (!user) return false;
      const allowed = PERMISSIONS[user.role] ?? [];
      if (!allowed.includes(action)) return false;
      if (org && user.role !== 'admin' && user.org !== org) return false;
      return true;
    },
    [user]
  );

  return { user, loading, signIn, signOut, can };
}
