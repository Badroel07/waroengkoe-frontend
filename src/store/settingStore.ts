import { create } from 'zustand';

interface SettingState {
  settings: {
    success_sound: '1' | '0';
    qris_static: string;
    laporan_email: string;
    laporan_status: '1' | '0';
    groq_api_key: string;
    groq_model: string;
  };
  updateSettings: (data: Partial<SettingState['settings']>) => void;
  resetDatabase: () => void;
  clearData: () => void;
}

const STORAGE_KEY = 'waroengkoe_settings';

function load(): SettingState['settings'] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
      success_sound: '1',
      qris_static: '',
      laporan_email: '',
      laporan_status: '0',
      groq_api_key: '',
      groq_model: 'llama-3.3-70b-versatile',
    };
  } catch {
    return {
      success_sound: '1',
      qris_static: '',
      laporan_email: '',
      laporan_status: '0',
      groq_api_key: '',
      groq_model: 'llama-3.3-70b-versatile',
    };
  }
}

export const useSettingStore = create<SettingState>((set) => ({
  settings: load(),

  updateSettings: (data) => {
    set((s) => {
      const next = { ...s.settings, ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return { settings: next };
    });
  },

  resetDatabase: () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('waroengkoe_'));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  },

  clearData: () => {
    const keep = ['waroengkoe_auth', 'waroengkoe_users', 'waroengkoe_settings'];
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('waroengkoe_') && !keep.includes(k));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  },
}));
