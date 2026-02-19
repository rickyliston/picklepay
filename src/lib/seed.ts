import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

export async function seedData() {
  // Check if already seeded
  const configRef = doc(db, 'config', 'settings');
  const configSnap = await getDoc(configRef);
  if (configSnap.exists()) {
    console.log('Data already seeded');
    return;
  }

  // Seed config
  await setDoc(configRef, {
    sessionRate: 10,
    bankDetails: {
      accountName: 'Rick Liston',
      bsb: '063535',
      accountNumber: '00656691',
    },
    guestSessionLimit: 4,
  });

  // Seed admin player
  const adminPlayerId = 'rick-liston';
  await setDoc(doc(db, 'players', adminPlayerId), {
    name: 'Rick Liston',
    email: 'info@rickliston.com',
    photoURL: null,
    isMember: true,
    isAdmin: true,
    claimedByUID: null,
    guestSessionCount: 0,
    membershipPromptDismissed: false,
    createdAt: serverTimestamp(),
    createdBy: 'system',
  });

  // Seed sessions 1-4
  const sessions = [
    { id: '2026-01-28', sessionNumber: 1, date: new Date(2026, 0, 28) },
    { id: '2026-02-04', sessionNumber: 2, date: new Date(2026, 1, 4) },
    { id: '2026-02-11', sessionNumber: 3, date: new Date(2026, 1, 11) },
    { id: '2026-02-18', sessionNumber: 4, date: new Date(2026, 1, 18) },
  ];

  for (const session of sessions) {
    await setDoc(doc(db, 'sessions', session.id), {
      sessionNumber: session.sessionNumber,
      date: Timestamp.fromDate(session.date),
      attendance: {},
    });
  }

  console.log('Seed data created successfully');
}
