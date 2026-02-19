'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Player, AppConfig } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  playerProfile: Player | null;
  allPlayers: Player[];
  config: AppConfig | null;
  loading: boolean;
  isAdmin: boolean;
  needsProfileClaim: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  claimProfile: (playerId: string) => Promise<{ error?: string }>;
  skipProfileClaim: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  playerProfile: null,
  allPlayers: [],
  config: null,
  loading: true,
  isAdmin: false,
  needsProfileClaim: false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  claimProfile: async () => ({}),
  skipProfileClaim: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [playerProfile, setPlayerProfile] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileClaim, setNeedsProfileClaim] = useState(false);

  // Listen to all players
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'players'), (snap) => {
      const players = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
      players.sort((a, b) => a.name.localeCompare(b.name));
      setAllPlayers(players);
    });
    return unsub;
  }, []);

  // Listen to config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'settings'), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig);
      }
    });
    return unsub;
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setPlayerProfile(null);
        setLoading(false);
        return;
      }

      // Find player profile claimed by this UID
      const q = query(
        collection(db, 'players'),
        where('claimedByUID', '==', u.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const pDoc = snap.docs[0];
        setPlayerProfile({ id: pDoc.id, ...pDoc.data() } as Player);

        // Also listen for real-time updates to this player
        const unsubPlayer = onSnapshot(doc(db, 'players', pDoc.id), (playerSnap) => {
          if (playerSnap.exists()) {
            setPlayerProfile({ id: playerSnap.id, ...playerSnap.data() } as Player);
          }
        });
        // Store unsub for cleanup
        (window as unknown as Record<string, () => void>).__playerUnsub = unsubPlayer;
      } else {
        setPlayerProfile(null);
        // User is logged in but has no claimed profile — show claim prompt
        // unless they previously skipped
        const skipped = typeof window !== 'undefined' && sessionStorage.getItem(`skipClaim_${u.uid}`);
        if (!skipped) {
          setNeedsProfileClaim(true);
        }
      }
      setLoading(false);
    });
    return () => {
      unsub();
      const playerUnsub = (window as unknown as Record<string, () => void>).__playerUnsub;
      if (playerUnsub) playerUnsub();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { error: 'Invalid email or password' };
      }
      return { error: 'Something went wrong. Please try again.' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Account created — the onAuthStateChanged listener will handle the rest
      // If an unclaimed profile matches this email, it will be auto-suggested in the claim flow
      return {};
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/email-already-in-use') {
        return { error: 'An account with this email already exists' };
      }
      if (error.code === 'auth/weak-password') {
        return { error: 'Password should be at least 6 characters' };
      }
      return { error: 'Something went wrong. Please try again.' };
    }
  }, []);

  const claimProfile = useCallback(async (playerId: string) => {
    if (!user) return { error: 'Not signed in' };
    try {
      await updateDoc(doc(db, 'players', playerId), {
        claimedByUID: user.uid,
      });
      // Re-fetch and set the profile
      const playerSnap = await getDocs(query(
        collection(db, 'players'),
        where('claimedByUID', '==', user.uid)
      ));
      if (!playerSnap.empty) {
        const pDoc = playerSnap.docs[0];
        setPlayerProfile({ id: pDoc.id, ...pDoc.data() } as Player);

        // Set up real-time listener
        const unsubPlayer = onSnapshot(doc(db, 'players', pDoc.id), (snap) => {
          if (snap.exists()) {
            setPlayerProfile({ id: snap.id, ...snap.data() } as Player);
          }
        });
        (window as unknown as Record<string, () => void>).__playerUnsub = unsubPlayer;
      }
      setNeedsProfileClaim(false);
      return {};
    } catch {
      return { error: 'Failed to claim profile. It may have already been claimed.' };
    }
  }, [user]);

  const skipProfileClaim = useCallback(() => {
    setNeedsProfileClaim(false);
    if (user) {
      sessionStorage.setItem(`skipClaim_${user.uid}`, 'true');
    }
  }, [user]);

  const signOutUser = useCallback(async () => {
    await firebaseSignOut(auth);
    setPlayerProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        playerProfile,
        allPlayers,
        config,
        loading,
        isAdmin: playerProfile?.isAdmin ?? false,
        needsProfileClaim,
        signIn,
        signUp,
        signOut: signOutUser,
        claimProfile,
        skipProfileClaim,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
