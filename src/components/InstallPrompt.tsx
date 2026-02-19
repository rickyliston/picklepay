'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('installPromptDismissed')) return;

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    // Android / Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-emerald-900 text-sm">Add to Home Screen</h3>
          {showIOSPrompt ? (
            <p className="text-emerald-700 text-xs mt-1">
              Tap the Share button <span className="inline-block">⬆️</span> then &quot;Add to Home Screen&quot; for the best experience.
            </p>
          ) : (
            <p className="text-emerald-700 text-xs mt-1">
              Install PicklePay for quick access and offline support.
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-emerald-600 text-xs font-medium px-2 py-1.5"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
