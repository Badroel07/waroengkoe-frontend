import { useState, useEffect } from 'react';
import { useLoadingStore } from '@/store/loadingStore';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      useLoadingStore.getState().setNetworkOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

type NetworkRestoreCallback = () => void;
const listeners = new Set<NetworkRestoreCallback>();

export function onNetworkRestore(callback: NetworkRestoreCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(() => {
      listeners.forEach(cb => {
        try { cb(); } catch (e) { console.error('Network restore callback error:', e); }
      });
    }, 1000);
  });

  window.addEventListener('offline', () => {
    useLoadingStore.getState().setNetworkOffline();
  });
}
