'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/Avatar';
import AddPlayerModal from '@/components/AddPlayerModal';
import { SkeletonList } from '@/components/Skeleton';

export default function PlayersPage() {
  const { allPlayers, isAdmin, loading, config } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const guestLimit = config?.guestSessionLimit ?? 4;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Players</h1>
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Players</h1>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Player
          </button>
        )}
      </div>

      <div className="space-y-2">
        {allPlayers.map((player) => {
          const isGuestOverLimit = !player.isMember && player.guestSessionCount >= guestLimit;
          return (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors"
            >
              <Avatar src={player.photoURL} name={player.name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{player.name}</span>
                  {isAdmin && isGuestOverLimit && (
                    <span className="text-amber-500 flex-shrink-0" title="Guest over session limit">⚠️</span>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${
                    player.isMember
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {player.isMember ? 'Member' : 'Guest'}
                </span>
              </div>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>

      {allPlayers.length === 0 && (
        <p className="text-center text-gray-400 py-8">No players yet</p>
      )}

      {showAddModal && (
        <AddPlayerModal onClose={() => setShowAddModal(false)} onAdded={() => {}} />
      )}
    </div>
  );
}
