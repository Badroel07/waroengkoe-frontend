import { create } from 'zustand';
import type { User } from '@/types';
import { apiFetch } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => User | null;
}

const STORAGE_KEY = 'waroengkoe_auth';

function mapBackendUser(u: any): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    email_verified_at: u.email_verified_at || null,
    is_admin: u.is_admin === true || u.role === 'admin',
    avatar: u.avatar || null,
    can_view_activity_log: Boolean(u.can_view_activity_log) || u.role === 'admin',
    can_manage_category: Boolean(u.can_manage_category) || u.role === 'admin',
    can_delete_transaction: Boolean(u.can_delete_transaction) || u.role === 'admin',
  };
}

function getStoredAuth(): { user: User | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { user: null };
    const parsed = JSON.parse(stored);
    if (parsed.user) {
      return { user: mapBackendUser(parsed.user) };
    }
    return { user: null };
  } catch { return { user: null }; }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialAuth = getStoredAuth();

  // Perform background check if token exists
  const token = localStorage.getItem('waroengkoe_token');
  if (token) {
    apiFetch('/api/me')
      .then((res) => {
        const rawUser = res.user || res.data || res;
        if (rawUser && rawUser.id) {
          const user = mapBackendUser(rawUser);
          set({ user });
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
        }
      })
      .catch(() => {
        localStorage.removeItem('waroengkoe_token');
        set({ user: null });
        localStorage.removeItem(STORAGE_KEY);
      });
  }

  return {
    user: initialAuth.user,
    get isAuthenticated() { return get().user !== null; },

    login: async (email: string, password: string) => {
      try {
        const res = await apiFetch('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, device_name: 'spa' }),
        });
        const payload = res.data || res;
        if (payload.token && payload.user) {
          localStorage.setItem('waroengkoe_token', payload.token);
          const user = mapBackendUser(payload.user);
          set({ user });
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
          return true;
        }
        return false;
      } catch (err) {
        console.error('Login failed:', err);
        return false;
      }
    },

    logout: async () => {
      try {
        await apiFetch('/api/logout', { method: 'POST' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        localStorage.removeItem('waroengkoe_token');
        set({ user: null });
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    getCurrentUser: () => get().user,
  };
});

