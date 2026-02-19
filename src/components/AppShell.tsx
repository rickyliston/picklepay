'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import BottomNav from './BottomNav';
import ClaimProfileModal from './ClaimProfileModal';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';
import { seedData } from '@/lib/seed';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, needsProfileClaim, user } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Run seed on first load
  useEffect(() => {
    seedData().catch(console.error);
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
      {user && needsProfileClaim && <ClaimProfileModal />}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ServiceWorkerRegistration />
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}
