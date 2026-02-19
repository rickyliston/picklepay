'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import PhotoUpload from '@/components/PhotoUpload';
import AddPlayerModal from '@/components/AddPlayerModal';
import Avatar from '@/components/Avatar';
import PlayerStats from '@/components/PlayerStats';
import Toast from '@/components/Toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, playerProfile, allPlayers, isAdmin, signOut, config, claimProfile, needsProfileClaim } = useAuth();
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showClaimFlow, setShowClaimFlow] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [claimingProfile, setClaimingProfile] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSaveName = async () => {
    if (!playerProfile || !newName.trim()) return;
    await updateDoc(doc(db, 'players', playerProfile.id), { name: newName.trim() });
    setEditingName(false);
    setToast('Name updated');
    setShowToast(true);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🥒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view your profile</h2>
        <p className="text-gray-500 text-sm mb-6">Track your attendance and payments</p>
        <Link
          href="/login"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!playerProfile) {
    const unclaimedPlayers = allPlayers.filter((p) => p.claimedByUID === null);
    const userEmail = user.email?.toLowerCase() ?? '';

    // Sort: email match first, then alphabetical
    const sortedUnclaimed = [...unclaimedPlayers].sort((a, b) => {
      const aMatch = a.email?.toLowerCase() === userEmail ? -1 : 0;
      const bMatch = b.email?.toLowerCase() === userEmail ? -1 : 0;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name);
    });

    const handleClaimFromProfile = async () => {
      if (!selectedClaimId) return;
      setClaimingProfile(true);
      setClaimError('');
      const result = await claimProfile(selectedClaimId);
      if (result.error) {
        setClaimError(result.error);
      } else {
        setToast('Profile claimed!');
        setShowToast(true);
      }
      setClaimingProfile(false);
    };

    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">👋</div>
            <h2 className="text-lg font-bold text-gray-900">No player profile linked</h2>
            <p className="text-gray-400 text-xs mt-1">{user.email}</p>
          </div>

          {showClaimFlow ? (
            <div>
              {claimError && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{claimError}</div>
              )}
              <p className="text-sm text-gray-600 mb-3">Select your player profile:</p>
              {sortedUnclaimed.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No unclaimed profiles available. Ask the admin to add you.
                </p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 mb-3">
                  {sortedUnclaimed.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedClaimId(player.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                        selectedClaimId === player.id
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar src={player.photoURL} name={player.name} size="sm" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{player.name}</span>
                        {player.email?.toLowerCase() === userEmail && (
                          <span className="ml-1 text-xs text-emerald-600">(email match)</span>
                        )}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                          player.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {player.isMember ? 'Member' : 'Guest'}
                        </span>
                      </div>
                      {selectedClaimId === player.id && (
                        <span className="text-emerald-600">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedClaimId && (
                <button
                  onClick={handleClaimFromProfile}
                  disabled={claimingProfile}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50 transition-colors mb-2"
                >
                  {claimingProfile ? 'Claiming...' : "That's me!"}
                </button>
              )}
              <button
                onClick={() => { setShowClaimFlow(false); setSelectedClaimId(''); }}
                className="w-full text-gray-400 text-sm py-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowClaimFlow(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Claim Your Profile
              </button>
              <p className="text-gray-400 text-xs text-center">
                If you&apos;re not on the list yet, ask the admin to add you as a player.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>

        <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  const guestLimit = config?.guestSessionLimit ?? 4;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      {/* Own Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex flex-col items-center gap-3 mb-4">
          <PhotoUpload
            playerId={playerProfile.id}
            currentPhotoURL={playerProfile.photoURL}
            playerName={playerProfile.name}
            onPhotoUpdated={() => {}}
          />

          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleSaveName}
                className="text-emerald-600 font-medium text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="text-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{playerProfile.name}</h2>
              <button
                onClick={() => {
                  setNewName(playerProfile.name);
                  setEditingName(true);
                }}
                className="text-emerald-600 text-xs"
              >
                Edit
              </button>
            </div>
          )}

          <span
            className={`text-sm px-3 py-1 rounded-full font-medium ${
              playerProfile.isMember
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            {playerProfile.isMember ? 'Member' : 'Guest'}
          </span>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Attendance & Payment */}
      <PlayerStats
        playerId={playerProfile.id}
        playerName={playerProfile.name}
        canSeeFinancials={true}
        config={config}
      />

      {/* Admin Section */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Admin: Manage Players</h3>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allPlayers.map((player) => {
              const isGuestOverLimit = !player.isMember && player.guestSessionCount >= guestLimit;
              return (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <Avatar src={player.photoURL} name={player.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{player.name}</span>
                      {isGuestOverLimit && <span title="Guest over limit">⚠️</span>}
                      {player.isAdmin && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        player.isMember ? 'text-emerald-600' : 'text-orange-600'
                      }`}
                    >
                      {player.isMember ? 'Member' : `Guest (${player.guestSessionCount} sessions)`}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
      >
        Sign Out
      </button>

      {showAddPlayer && (
        <AddPlayerModal onClose={() => setShowAddPlayer(false)} onAdded={() => {
          setToast('Player added');
          setShowToast(true);
        }} />
      )}

      <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
