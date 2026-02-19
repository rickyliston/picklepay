'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AddPlayerModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddPlayerModal({ onClose, onAdded }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      await addDoc(collection(db, 'players'), {
        name: name.trim(),
        email: email.trim().toLowerCase() || null,
        photoURL: null,
        isMember,
        isAdmin: false,
        claimedByUID: null,
        guestSessionCount: 0,
        membershipPromptDismissed: false,
        createdAt: serverTimestamp(),
        createdBy: 'admin',
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error('Failed to add player:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Player</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <button
              type="button"
              onClick={() => setIsMember(!isMember)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isMember
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {isMember ? 'Member' : 'Guest'}
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2.5 font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding...' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
