import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  errorType: 'timeout' | 'network' | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  activeRequests: number;
  isSkeletonLoading: boolean; // Menandai jika ada komponen yang sedang memuat skeleton
  startLoading: (duration?: number) => void;
  stopLoading: () => void;
  setNetworkOffline: () => void;
  resetLoading: () => void;
  setSkeletonLoading: (val: boolean) => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  errorType: null,
  timeoutId: null,
  activeRequests: 0,
  isSkeletonLoading: false,

  startLoading: (duration = 30000) => {
    const state = get();
    const newCount = state.activeRequests + 1;
    if (state.timeoutId) clearTimeout(state.timeoutId);
    const timeoutId = setTimeout(() => {
      set({ isLoading: false, errorType: 'timeout' });
    }, duration);
    set({ isLoading: true, errorType: null, timeoutId, activeRequests: newCount });
  },

  stopLoading: () => {
    const state = get();
    const newCount = Math.max(0, state.activeRequests - 1);
    if (newCount === 0) {
      if (state.timeoutId) clearTimeout(state.timeoutId);
      set({ isLoading: false, errorType: null, timeoutId: null, activeRequests: 0 });
    } else {
      set({ activeRequests: newCount });
    }
  },

  setNetworkOffline: () => {
    const state = get();
    if (state.timeoutId) clearTimeout(state.timeoutId);
    set({ isLoading: false, errorType: 'network', timeoutId: null });
  },

  resetLoading: () => {
    const state = get();
    if (state.timeoutId) clearTimeout(state.timeoutId);
    set({ isLoading: false, errorType: null, timeoutId: null, activeRequests: 0, isSkeletonLoading: false });
  },

  setSkeletonLoading: (val: boolean) => {
    set({ isSkeletonLoading: val });
  },
}));
