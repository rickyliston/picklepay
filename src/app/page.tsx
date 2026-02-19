'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc, onSnapshot, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentOrNextSession, formatSessionDate, getSessionId } from '@/lib/sessions';
import { Session } from '@/lib/types';
import MembershipBanner from '@/components/MembershipBanner';
import InstallPrompt from '@/components/InstallPrompt';
import Avatar from '@/components/Avatar';
import Toast from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function HomePage() {
  const { user, playerProfile, allPlayers, isAdmin, config } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

  const { date: nextDate, sessionNumber } = getCurrentOrNextSession();
  const sessionId = getSessionId(nextDate);

  // Ensure the next session document exists, create it if not
  useEffect(() => {
    const sessionRef = doc(db, 'sessions', sessionId);
    let unsub: (() => void) | undefined;

    (async () => {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) {
        await setDoc(sessionRef, {
          sessionNumber,
          date: Timestamp.fromDate(nextDate),
          attendance: {},
        });
      }
      // Now listen for real-time updates
      unsub = onSnapshot(sessionRef, (s) => {
        if (s.exists()) {
          setSession({ id: s.id, ...s.data() } as Session);
        }
        setLoadingSession(false);
      });
    })();

    return () => { unsub?.(); };
  }, [sessionId, sessionNumber, nextDate]);

  const intendingPlayers = session
    ? Object.entries(session.attendance)
        .filter(([, a]) => a.intending)
        .map(([pid]) => allPlayers.find((p) => p.id === pid))
        .filter(Boolean)
    : [];

  const handleToggleIntending = async () => {
    if (!playerProfile) return;
    try {
      const current = session?.attendance[playerProfile.id]?.intending ?? false;
      await updateDoc(doc(db, 'sessions', sessionId), {
        [`attendance.${playerProfile.id}.intending`]: !current,
        [`attendance.${playerProfile.id}.attended`]: session?.attendance[playerProfile.id]?.attended ?? false,
        [`attendance.${playerProfile.id}.paid`]: session?.attendance[playerProfile.id]?.paid ?? false,
        [`attendance.${playerProfile.id}.amountOwed`]: session?.attendance[playerProfile.id]?.amountOwed ?? (config?.sessionRate ?? 10),
      });
    } catch (err) {
      console.error('Failed to update RSVP:', err);
      setToast('Failed to update RSVP. Please try again.');
      setShowToast(true);
    }
  };

  const isIntending = playerProfile && session?.attendance[playerProfile.id]?.intending;

  const showMembershipBanner =
    playerProfile &&
    !playerProfile.isMember &&
    playerProfile.guestSessionCount >= (config?.guestSessionLimit ?? 4);

  return (
    <div>
      <InstallPrompt />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PicklePay</h1>
          <p className="text-sm text-gray-500">
            {playerProfile ? `Welcome, ${playerProfile.name.split(' ')[0]}` : 'Pickleball Club Tracker'}
          </p>
        </div>
        <div className="text-4xl">🥒</div>
      </div>

      {showMembershipBanner && <MembershipBanner />}

      {/* Next Session Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Next Session</h2>
            <p className="text-lg font-bold text-gray-900 mt-1">Session #{sessionNumber}</p>
            <p className="text-sm text-gray-600">{formatSessionDate(nextDate)}</p>
          </div>
          <div className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-semibold">
            {intendingPlayers.length} coming
          </div>
        </div>

        {playerProfile && (
          <button
            onClick={handleToggleIntending}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              isIntending
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isIntending ? "✓ I'm coming!" : "I'm coming this week"}
          </button>
        )}

        {!user && (
          <Link
            href="/login"
            className="block w-full text-center py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            Sign in to RSVP
          </Link>
        )}

        {user && !playerProfile && (
          <Link
            href="/profile"
            className="block w-full text-center py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            Claim your profile to RSVP
          </Link>
        )}
      </div>

      {/* Who's Coming */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          Who&apos;s Coming ({intendingPlayers.length})
        </h3>
        {loadingSession ? (
          <SkeletonList count={3} />
        ) : intendingPlayers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No one has RSVP&apos;d yet</p>
        ) : (
          <div className="space-y-2">
            {intendingPlayers.map((p) =>
              p ? (
                <div key={p.id} className="flex items-center gap-3 py-1">
                  <Avatar src={p.photoURL} name={p.name} size="sm" />
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {p.isMember ? 'Member' : 'Guest'}
                  </span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/sessions/${sessionId}`}
              className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <span className="text-2xl">📋</span>
              <span className="text-xs font-medium text-emerald-800">Mark Attendance</span>
            </Link>
            <Link
              href="/players"
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl">👥</span>
              <span className="text-xs font-medium text-blue-800">Manage Players</span>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{allPlayers.filter((p) => p.isMember).length}</div>
          <div className="text-xs text-gray-500 mt-1">Members</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{allPlayers.filter((p) => !p.isMember).length}</div>
          <div className="text-xs text-gray-500 mt-1">Guests</div>
        </div>
      </div>

      <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
