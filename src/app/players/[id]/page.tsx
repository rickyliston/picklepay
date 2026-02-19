'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Player } from '@/lib/types';
import Avatar from '@/components/Avatar';
import PlayerStats from '@/components/PlayerStats';
import MembershipBanner from '@/components/MembershipBanner';
import PhotoUpload from '@/components/PhotoUpload';
import { SkeletonProfile } from '@/components/Skeleton';
import Toast from '@/components/Toast';

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, playerProfile, isAdmin, config } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showAssignUID, setShowAssignUID] = useState(false);
  const [assignUID, setAssignUID] = useState('');

  const isOwnProfile = playerProfile?.id === id;
  const canSeeFinancials = isOwnProfile || isAdmin;

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'players', id), (snap) => {
      if (snap.exists()) {
        setPlayer({ id: snap.id, ...snap.data() } as Player);
      }
      setLoading(false);
    });
    return unsub;
  }, [id]);

  if (loading) {
    return (
      <div>
        <button onClick={() => router.back()} className="text-emerald-600 font-medium text-sm mb-4">
          ← Back
        </button>
        <SkeletonProfile />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Player not found</p>
        <button onClick={() => router.back()} className="text-emerald-600 font-medium mt-2">
          Go back
        </button>
      </div>
    );
  }

  const showMembershipBanner =
    isOwnProfile &&
    !player.isMember &&
    player.guestSessionCount >= (config?.guestSessionLimit ?? 4);

  const handleToggleMember = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'players', id), { isMember: !player.isMember });
    setToast(player.isMember ? 'Changed to Guest' : 'Changed to Member');
    setShowToast(true);
  };

  const handleToggleAdmin = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'players', id), { isAdmin: !player.isAdmin });
    setToast(player.isAdmin ? 'Admin removed' : 'Promoted to Admin');
    setShowToast(true);
  };

  const handleUnlinkProfile = async () => {
    if (!isAdmin) return;
    await updateDoc(doc(db, 'players', id), { claimedByUID: null });
    setToast('Profile unlinked');
    setShowToast(true);
  };

  const handleAssignUID = async () => {
    if (!isAdmin || !assignUID.trim()) return;
    await updateDoc(doc(db, 'players', id), { claimedByUID: assignUID.trim() });
    setToast('UID assigned');
    setShowToast(true);
    setAssignUID('');
    setShowAssignUID(false);
  };

  const canUploadPhoto = isOwnProfile || isAdmin;

  return (
    <div>
      <button onClick={() => router.back()} className="text-emerald-600 font-medium text-sm mb-4">
        ← Back
      </button>

      {showMembershipBanner && <MembershipBanner />}

      {/* Profile Header */}
      <div className="flex flex-col items-center gap-3 mb-6">
        {canUploadPhoto ? (
          <PhotoUpload
            playerId={id}
            currentPhotoURL={player.photoURL}
            playerName={player.name}
            onPhotoUpdated={() => {}}
          />
        ) : (
          <Avatar src={player.photoURL} name={player.name} size="xl" />
        )}
        <h1 className="text-xl font-bold text-gray-900">{player.name}</h1>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${
            player.isMember
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {player.isMember ? 'Member' : 'Guest'}
        </span>
        {player.isAdmin && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
            Admin
          </span>
        )}
      </div>

      {/* Admin Controls */}
      {isAdmin && !isOwnProfile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Admin Controls</h3>
          <div className="flex gap-2">
            <button
              onClick={handleToggleMember}
              className="flex-1 text-sm font-medium py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              {player.isMember ? 'Set as Guest' : 'Set as Member'}
            </button>
            <button
              onClick={handleToggleAdmin}
              className="flex-1 text-sm font-medium py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              {player.isAdmin ? 'Remove Admin' : 'Make Admin'}
            </button>
          </div>
          {!player.isMember && (
            <p className="text-xs text-gray-500 mt-2">
              Guest sessions: {player.guestSessionCount}
              {player.guestSessionCount >= (config?.guestSessionLimit ?? 4) && (
                <span className="text-amber-600 font-medium"> — Over limit!</span>
              )}
            </p>
          )}

          {/* Claim Status */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">
              Profile status: {player.claimedByUID ? (
                <span className="text-emerald-600 font-medium">Claimed</span>
              ) : (
                <span className="text-amber-600 font-medium">Unclaimed</span>
              )}
            </p>
            {player.claimedByUID ? (
              <button
                onClick={handleUnlinkProfile}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Unlink profile
              </button>
            ) : (
              <div>
                {showAssignUID ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assignUID}
                      onChange={(e) => setAssignUID(e.target.value)}
                      placeholder="Paste user UID"
                      className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button onClick={handleAssignUID} className="text-emerald-600 text-xs font-medium">
                      Assign
                    </button>
                    <button onClick={() => setShowAssignUID(false)} className="text-gray-400 text-xs">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAssignUID(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Manually assign UID
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <PlayerStats
        playerId={id}
        playerName={player.name}
        canSeeFinancials={canSeeFinancials}
        config={config}
      />

      <Toast message={toast} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
}
