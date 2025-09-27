'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initializeAuth, isInitialized } = useStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized]);

  return <>{children}</>;
}
