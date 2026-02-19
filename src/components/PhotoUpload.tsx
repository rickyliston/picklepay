'use client';

import { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import Avatar from './Avatar';

interface PhotoUploadProps {
  playerId: string;
  currentPhotoURL: string | null;
  playerName: string;
  onPhotoUpdated: (url: string) => void;
}

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ playerId, currentPhotoURL, playerName, onPhotoUpdated }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoURL);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress image
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 500,
        maxSizeMB: 0.5,
        useWebWorker: true,
        fileType: 'image/jpeg',
      });

      // Convert to base64
      const base64 = await fileToBase64(compressed);
      setPreviewUrl(base64);

      // Save base64 string directly to Firestore
      await updateDoc(doc(db, 'players', playerId), { photoURL: base64 });
      onPhotoUpdated(base64);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar src={previewUrl} name={playerName} size="xl" />
        {uploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
      >
        {uploading ? 'Saving...' : 'Change Photo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
