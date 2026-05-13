'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Session } from '@/lib/types';
import { formatSessionDate, isSessionInPast, isSessionToday, getSessionNumber, getSessionId } from '@/lib/sessions';
import { getAllTerms, getWednesdaysInTerm, getTermForDate, getTermKey, Term } from '@/lib/terms';
import { SkeletonList } from '@/components/Skeleton';

interface TermGroup {
  term: Term;
  sessions: Session[];
  missingWednesdays: Date[];
}

export default function SessionsPage() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedTerms, setCollapsedTerms] = useState<Set<string>>(new Set());
  const [creatingSessions, setCreatingSessions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'sessions'), orderBy('sessionNumber', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
      setSessions(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const termGroups = useMemo(() => {
    const terms = getAllTerms();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionById = new Map(sessions.map((s) => [s.id, s]));

    const groups: TermGroup[] = [];

    for (const term of terms) {
      const termEnd = new Date(term.endDate);
      termEnd.setHours(23, 59, 59, 999);

      // Only show terms that have started
      if (term.startDate > today) continue;

      const wednesdays = getWednesdaysInTerm(term);
      const termSessions: Session[] = [];
      const missing: Date[] = [];

      for (const wed of wednesdays) {
        // Only show wednesdays up to today (don't show future missing sessions)
        if (wed > today) {
          // But include next upcoming wednesday if it's this week
          const nextWed = new Date(today);
          while (nextWed.getDay() !== 3) nextWed.setDate(nextWed.getDate() + 1);
          if (wed.getTime() !== nextWed.getTime()) continue;
        }

        const id = getSessionId(wed);
        const existing = sessionById.get(id);
        if (existing) {
          termSessions.push(existing);
        } else {
          missing.push(wed);
        }
      }

      if (termSessions.length > 0 || missing.length > 0) {
        groups.push({ term, sessions: termSessions, missingWednesdays: missing });
      }
    }

    // Also group any sessions that fall outside defined terms
    const termSessionIds = new Set(groups.flatMap((g) => g.sessions.map((s) => s.id)));
    const ungrouped = sessions.filter((s) => !termSessionIds.has(s.id));
    if (ungrouped.length > 0) {
      groups.unshift({
        term: { year: 0, term: 0, label: 'Other Sessions', startDate: new Date(0), endDate: new Date(0) },
        sessions: ungrouped,
        missingWednesdays: [],
      });
    }

    // Sort: most recent term first
    groups.sort((a, b) => {
      if (a.term.year === 0) return 1;
      if (b.term.year === 0) return 1;
      return b.term.startDate.getTime() - a.term.startDate.getTime();
    });

    return groups;
  }, [sessions]);

  // Auto-collapse past terms on first load
  useEffect(() => {
    if (termGroups.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastTermKeys = new Set<string>();
    for (const group of termGroups) {
      const termEnd = new Date(group.term.endDate);
      termEnd.setHours(23, 59, 59, 999);
      if (termEnd < today) {
        pastTermKeys.add(getTermKey(group.term));
      }
    }
    setCollapsedTerms(pastTermKeys);
  }, [termGroups.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTerm = (key: string) => {
    setCollapsedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const createSession = async (date: Date) => {
    const id = getSessionId(date);
    setCreatingSessions((prev) => new Set(prev).add(id));
    try {
      const sessionNumber = getSessionNumber(date);
      await setDoc(doc(db, 'sessions', id), {
        sessionNumber,
        date: Timestamp.fromDate(date),
        attendance: {},
      });
    } finally {
      setCreatingSessions((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

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

      {termGroups.length === 0 && (
        <p className="text-center text-gray-400 py-8">No sessions yet</p>
      )}

      <div className="space-y-4">
        {termGroups.map((group) => {
          const key = getTermKey(group.term);
          const isCollapsed = collapsedTerms.has(key);
          const totalSessions = group.sessions.length + group.missingWednesdays.length;

          // Combine and sort all entries (existing + missing) by date descending
          const allEntries: Array<{ type: 'session'; session: Session } | { type: 'missing'; date: Date }> = [
            ...group.sessions.map((s) => ({ type: 'session' as const, session: s })),
            ...group.missingWednesdays.map((d) => ({ type: 'missing' as const, date: d })),
          ].sort((a, b) => {
            const dateA = a.type === 'session' ? a.session.date.toDate() : a.date;
            const dateB = b.type === 'session' ? b.session.date.toDate() : b.date;
            return dateB.getTime() - dateA.getTime();
          });

          return (
            <div key={key}>
              {/* Term Header */}
              <button
                onClick={() => toggleTerm(key)}
                className="w-full flex items-center justify-between py-2 px-1 group"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                    ▶
                  </span>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {group.term.label}
                  </h2>
                </div>
                <span className="text-xs text-gray-400">
                  {group.sessions.length}/{totalSessions} sessions
                </span>
              </button>

              {/* Session List */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {allEntries.map((entry) => {
                    if (entry.type === 'session') {
                      const session = entry.session;
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
                    }

                    // Missing session
                    const date = entry.date;
                    const sessionId = getSessionId(date);
                    const sessionNumber = getSessionNumber(date);
                    const isCreating = creatingSessions.has(sessionId);

                    return (
                      <div
                        key={sessionId}
                        className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-400">
                                Session #{sessionNumber}
                              </span>
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                Missing
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">{formatSessionDate(date)}</p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => createSession(date)}
                              disabled={isCreating}
                              className="text-xs font-medium px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {isCreating ? 'Creating...' : 'Create'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
