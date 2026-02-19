'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session } from '@/lib/types';
import { formatSessionDate, isSessionInPast, isSessionToday } from '@/lib/sessions';
import { SkeletonList } from '@/components/Skeleton';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'sessions'), orderBy('sessionNumber', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
      setSessions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sessions</h1>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Sessions</h1>

      <div className="space-y-2">
        {sessions.map((session) => {
          const sessionDate = session.date.toDate();
          const past = isSessionInPast(sessionDate);
          const today = isSessionToday(sessionDate);
          const attendedCount = Object.values(session.attendance).filter((a) => a.attended).length;
          const intendingCount = Object.values(session.attendance).filter((a) => a.intending).length;

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className={`block bg-white rounded-xl p-4 shadow-sm border transition-colors ${
                today ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-100 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      Session #{session.sessionNumber}
                    </span>
                    {today && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Today
                      </span>
                    )}
                    {past && !today && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        Past
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{formatSessionDate(sessionDate)}</p>
                </div>
                <div className="text-right">
                  {past || today ? (
                    <div className="text-sm font-medium text-gray-600">{attendedCount} attended</div>
                  ) : (
                    <div className="text-sm font-medium text-emerald-600">{intendingCount} intending</div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <p className="text-center text-gray-400 py-8">No sessions yet</p>
      )}
    </div>
  );
}
