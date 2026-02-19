'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Session, AppConfig } from '@/lib/types';
import PaymentModal from './PaymentModal';

interface PlayerStatsProps {
  playerId: string;
  playerName: string;
  canSeeFinancials: boolean;
  config: AppConfig | null;
}

export default function PlayerStats({ playerId, playerName, canSeeFinancials, config }: PlayerStatsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'sessions')).then((snap) => {
      const allSessions = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Session))
        .sort((a, b) => b.sessionNumber - a.sessionNumber);
      setSessions(allSessions);
    });
  }, []);

  const amountOwed = sessions.reduce((total, session) => {
    const attendance = session.attendance[playerId];
    if (attendance?.attended && !attendance?.paid) {
      return total + (config?.sessionRate ?? 10);
    }
    return total;
  }, 0);

  const attendanceHistory = sessions
    .filter((s) => s.attendance[playerId])
    .map((s) => ({
      sessionNumber: s.sessionNumber,
      date: s.date,
      attended: s.attendance[playerId].attended,
      paid: s.attendance[playerId].paid,
    }));

  return (
    <>
      {/* Amount Owed */}
      {canSeeFinancials && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Amount Owed</p>
              <p className="text-2xl font-bold text-gray-900">${amountOwed.toFixed(2)}</p>
            </div>
            {amountOwed > 0 && (
              <button
                onClick={() => setShowPayment(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Pay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Attendance History</h3>
        {attendanceHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No sessions recorded</p>
        ) : (
          <div className="space-y-2">
            {attendanceHistory.map((h) => (
              <div key={h.sessionNumber} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900">Session #{h.sessionNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{h.attended ? '✅' : '❌'}</span>
                  {canSeeFinancials && h.attended && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {h.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPayment && config && (
        <PaymentModal
          playerName={playerName}
          amountOwed={amountOwed}
          bankDetails={config.bankDetails}
          onClose={() => setShowPayment(false)}
        />
      )}
    </>
  );
}
