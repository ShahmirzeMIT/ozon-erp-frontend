import { useSyncExternalStore, useCallback } from 'react';
import { DemoPreferencesStore } from '../services/DemoPreferencesStore';

// Sadə pub/sub: eyni tab daxilində Məhsullar səhifəsindəki
// "İzlənilənlərə əlavə et" toggle-ı ilə Alarm və email səhifəsindəki
// izlənilən siyahı ANİ olaraq sinxron qalsın deyə.
const listeners = new Set<() => void>();
let watchlistSnapshot = DemoPreferencesStore.getWatchlist();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

export function useWatchlist(): [string[], (productId: string) => void] {
  // useSyncExternalStore requires the snapshot reference to stay stable between
  // notifications. Reading localStorage directly here creates a new array on
  // every render and causes an infinite update loop.
  const list = useSyncExternalStore(subscribe, () => watchlistSnapshot);
  const toggle = useCallback((productId: string) => {
    watchlistSnapshot = DemoPreferencesStore.toggleWatch(productId);
    emit();
  }, []);
  return [list, toggle];
}
