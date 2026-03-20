'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Session } from '@/lib/types';
import { formatSessionDate, isSessionInPast } from '@/lib/sessions';
import Avatar from '@/components/Avatar';
import Toast from '@/components/Toast';
import { SkeletonList } from '@/components/Skeleton';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { allPlayers, playerProfile, isAdmin, config } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'sessions', id), (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() } as Session);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  const toggleAttended = useCallback(async (playerId: string, currentVal: boolean) => {
    if (!isAdmin || !session) return;
    const rate = config?.sessionRate ?? 10;
    const newVal = !currentVal;

    // Update session attendance
    await updateDoc(doc(db, 'sessions', id), {
      [`attendance.${playerId}.attended`]: newVal,
      [`attendance.${playerId}.intending`]: session.attendance[playerId]?.intending ?? false,
      [`attendance.${playerId}.paid`]: session.attendance[playerId]?.paid ?? false,
      [`attendance.${playerId}.amountOwed`]: rate,
    });

    // Update guestSessionCount for non-members
    const playerDoc = await getDoc(doc(db, 'players', playerId));
    if (playerDoc.exists()) {
      const playerData = playerDoc.data();
      if (!playerData.isMember) {
        const currentCount = playerData.guestSessionCount || 0;
        await updateDoc(doc(db, 'players', playerId), {
          guestSessionCount: newVal ? currentCount + 1 : Math.max(0, currentCount - 1),
        });
      }
    }
  }, [isAdmin, session, id, config]);

  const togglePaid = useCallback(async (playerId: string, currentVal: boolean) => {
    if (!isAdmin || !session) return;
    await updateDoc(doc(db, 'sessions', id), {
      [`attendance.${playerId}.paid`]: !currentVal,
    });
  }, [isAdmin, session, id]);

  const toggleIntending = useCallback(async (playerId: string, currentVal: boolean) => {
    if (!session) return;
    // Players can toggle their own intending, admins can toggle anyone's
    if (!isAdmin && playerProfile?.id !== playerId) return;
    const rate = config?.sessionRate ?? 10;

    await updateDoc(doc(db, 'sessions', id), {
      [`attendance.${playerId}.intending`]: !currentVal,
      [`attendance.${playerId}.attended`]: session.attendance[playerId]?.attended ?? false,
      [`attendance.${playerId}.paid`]: session.attendance[playerId]?.paid ?? false,
      [`attendance.${playerId}.amountOwed`]: rate,
    });
  }, [isAdmin, playerProfile, session, id, config]);

  if (loading) {
    return (
      <div>
        <button onClick={() => router.back()} className="text-emerald-600 font-medium text-sm mb-4">
          ← Back
        </button>
        <SkeletonList count={5} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Session not found</p>
        <button onClick={() => router.back()} className="text-emerald-600 font-medium mt-2">
          Go back
        </button>
      </div>
    );
  }

  const sessionDate = session.date.toDate();
  const isPast = isSessionInPast(sessionDate);

  // For past sessions, non-admins only see players who attended; admins see all players
  const displayPlayers = isPast && !isAdmin
    ? allPlayers.filter((p) => session.attendance[p.id]?.attended)
    : allPlayers;

  return (
    <div>
      <button onClick={() => router.back()} className="text-emerald-600 font-medium text-sm mb-4">
        ← Back
      </button>

      {/* Session Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h1 className="text-xl font-bold text-gray-900">Session #{session.sessionNumber}</h1>
        <p className="text-sm text-gray-500">{formatSessionDate(sessionDate)}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-gray-600">
            <strong>{Object.values(session.attendance).filter((a) => a.attended).length}</strong> attended
          </span>
          {(!isPast || isAdmin) && (
            <span className="text-gray-600">
              <strong>{Object.values(session.attendance).filter((a) => a.intending).length}</strong> intending
            </span>
          )}
        </div>
      </div>

      {/* Player Attendance List */}
      <div className="space-y-2">
        {displayPlayers.length === 0 && isPast && (
          <p className="text-sm text-gray-400 text-center py-4">No players attended this session</p>
        )}
        {displayPlayers.map((player) => {
          const att = session.attendance[player.id] || {
            attended: false,
            intending: false,
            paid: false,
            amountOwed: config?.sessionRate ?? 10,
          };
          const canToggleIntending = isAdmin || playerProfile?.id === player.id;

          return (
            <div
              key={player.id}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-2">
                <Avatar src={player.photoURL} name={player.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 text-sm truncate block">{player.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      player.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {player.isMember ? 'Member' : 'Guest'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Intending toggle — hidden for past sessions unless admin */}
                {(!isPast || isAdmin) && (
                  <button
                    onClick={() => canToggleIntending && toggleIntending(player.id, att.intending)}
                    disabled={!canToggleIntending}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                      att.intending
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                    } ${!canToggleIntending ? 'opacity-50' : 'hover:opacity-80'}`}
                  >
                    {att.intending ? '✓ Intending' : 'Intending'}
                  </button>
                )}

                {/* Attended toggle (admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => toggleAttended(player.id, att.attended)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                      att.attended
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    } hover:opacity-80`}
                  >
                    {att.attended ? '✓ Attended' : 'Attended'}
                  </button>
                )}

                {/* Paid toggle (admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => togglePaid(player.id, att.paid)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                      att.paid
                        ? 'bg-green-100 text-green-700'
                        : att.attended
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                    } hover:opacity-80`}
                  >
                    {att.paid ? '✓ Paid' : att.attended ? `$${config?.sessionRate ?? 10}` : 'Paid'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
