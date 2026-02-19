'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';

export default function ClaimProfileModal() {
  const { user, allPlayers, claimProfile, skipProfileClaim } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [showNotOnList, setShowNotOnList] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');

  const userEmail = user?.email?.toLowerCase() ?? '';

  // Unclaimed players, with email-matched ones first
  const unclaimedPlayers = useMemo(() => {
    const unclaimed = allPlayers.filter((p) => p.claimedByUID === null);
    // Sort: email match first, then alphabetical
    return unclaimed.sort((a, b) => {
      const aMatch = a.email?.toLowerCase() === userEmail ? -1 : 0;
      const bMatch = b.email?.toLowerCase() === userEmail ? -1 : 0;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name);
    });
  }, [allPlayers, userEmail]);

  // Auto-select email-matched player
  const emailMatchPlayer = useMemo(() => {
    return unclaimedPlayers.find((p) => p.email?.toLowerCase() === userEmail);
  }, [unclaimedPlayers, userEmail]);

  const handleClaim = async () => {
    if (!selectedPlayerId) return;
    setClaiming(true);
    setError('');
    const result = await claimProfile(selectedPlayerId);
    if (result.error) {
      setError(result.error);
      setClaiming(false);
    }
  };

  const handleSkip = () => {
    skipProfileClaim();
  };

  const selectedPlayer = allPlayers.find((p) => p.id === selectedPlayerId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">👋</div>
          <h2 className="text-xl font-bold text-gray-900">Claim Your Profile</h2>
          <p className="text-sm text-gray-500 mt-1">
            Find yourself in the list below to link your account to your player profile.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
        )}

        {showNotOnList ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🤷</div>
            <p className="text-amber-800 text-sm font-medium mb-2">No worries!</p>
            <p className="text-amber-700 text-sm">
              Ask the admin to add you as a player and you can claim your profile later from your Profile tab.
            </p>
            <button
              onClick={handleSkip}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Continue without a profile
            </button>
          </div>
        ) : (
          <>
            {emailMatchPlayer && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
                <p className="text-emerald-800 text-xs font-medium mb-1">Suggested match based on your email:</p>
                <button
                  onClick={() => setSelectedPlayerId(emailMatchPlayer.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    selectedPlayerId === emailMatchPlayer.id
                      ? 'bg-emerald-100'
                      : 'hover:bg-emerald-100/50'
                  }`}
                >
                  <Avatar src={emailMatchPlayer.photoURL} name={emailMatchPlayer.name} size="sm" />
                  <div className="flex-1 text-left">
                    <span className="text-sm font-medium text-gray-900">{emailMatchPlayer.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                      emailMatchPlayer.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {emailMatchPlayer.isMember ? 'Member' : 'Guest'}
                    </span>
                  </div>
                  {selectedPlayerId === emailMatchPlayer.id && (
                    <span className="text-emerald-600 text-lg">✓</span>
                  )}
                </button>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                All unclaimed players ({unclaimedPlayers.length})
              </p>
              {unclaimedPlayers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No unclaimed profiles available.
                </p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2">
                  {unclaimedPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        selectedPlayerId === player.id
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Avatar src={player.photoURL} name={player.name} size="sm" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-gray-900">{player.name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                          player.isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {player.isMember ? 'Member' : 'Guest'}
                        </span>
                      </div>
                      {selectedPlayerId === player.id && (
                        <span className="text-emerald-600 text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPlayer && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors mb-3"
              >
                {claiming ? 'Claiming...' : `That's me! I'm ${selectedPlayer.name}`}
              </button>
            )}

            <button
              onClick={() => setShowNotOnList(true)}
              className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2 transition-colors"
            >
              I&apos;m not on the list
            </button>
          </>
        )}
      </div>
    </div>
  );
}
