import { create } from 'zustand';
import type { User } from '@/types';
import { generateId } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface UserState {
  users: User[];
  fetchUsers: () => Promise<void>;
  getUsers: () => User[];
  getUser: (id: string) => User | undefined;
  addUser: (data: { name: string; email: string; is_admin: boolean; can_view_activity_log: boolean; can_manage_category: boolean; can_delete_transaction: boolean }) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

const STORAGE_KEY = 'waroengkoe_users';
const load = (): User[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const save = (data: User[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function mapBackendUser(u: any): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    email_verified_at: u.created_at || new Date().toISOString(),
    is_admin: u.role === 'admin',
    avatar: u.avatar || null,
    can_view_activity_log: Boolean(u.can_view_activity_log),
    can_manage_category: Boolean(u.can_manage_category),
    can_delete_transaction: u.role === 'admin' || Boolean(u.can_delete_transaction),
  };
}

export const useUserStore = create<UserState>((set, get) => {
  const initial = load();

  if (localStorage.getItem('waroengkoe_token')) {
    apiFetch('/api/pengguna')
      .then((res) => {
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map(mapBackendUser);
        set({ users: formatted }); save(formatted);
      }).catch(err => console.error(err));
  }

  return {
    users: initial,

    fetchUsers: async () => {
      try {
        const res = await apiFetch('/api/pengguna');
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map(mapBackendUser);
        set({ users: formatted }); save(formatted);
      } catch (err) { console.error(err); }
    },

    getUsers: () => get().users,
    getUser: (id) => get().users.find((u) => u.id === id),

    addUser: async (data) => {
      const tempId = 'temp_' + generateId();
      const optimUser: User = { id: tempId, email_verified_at: new Date().toISOString(), avatar: null, ...data };
      set((s) => { const next = [...s.users, optimUser]; save(next); return { users: next }; });

      try {
        const body = {
          name: data.name,
          email: data.email,
          role: data.is_admin ? 'admin' : 'kasir',
          password: 'password123', // default password
          can_view_activity_log: data.can_view_activity_log,
          can_manage_category: data.can_manage_category,
        };
        const res = await apiFetch('/api/pengguna', { method: 'POST', body: JSON.stringify(body) });
        const saved = mapBackendUser(res.data || res);
        set((s) => { const next = s.users.map((u) => u.id === tempId ? saved : u); save(next); return { users: next }; });
        return saved;
      } catch (err) {
        set((s) => { const next = s.users.filter((u) => u.id !== tempId); save(next); return { users: next }; });
        throw err;
      }
    },

    updateUser: async (id, data) => {
      const old = get().users;
      set((s) => { const next = s.users.map((u) => u.id === id ? { ...u, ...data } : u); save(next); return { users: next }; });

      try {
        const body: any = {};
        if (data.name) body.name = data.name;
        if (data.email) body.email = data.email;
        if (data.is_admin !== undefined) body.role = data.is_admin ? 'admin' : 'kasir';
        if (data.can_view_activity_log !== undefined) body.can_view_activity_log = data.can_view_activity_log;
        if (data.can_manage_category !== undefined) body.can_manage_category = data.can_manage_category;

        const res = await apiFetch(`/api/pengguna/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        const saved = mapBackendUser(res.data || res);
        set((s) => { const next = s.users.map((u) => u.id === id ? saved : u); save(next); return { users: next }; });
      } catch (err) {
        set({ users: old }); save(old);
        throw err;
      }
    },

    deleteUser: async (id) => {
      const old = get().users;
      set((s) => { const next = s.users.filter((u) => u.id !== id); save(next); return { users: next }; });

      try {
        await apiFetch(`/api/pengguna/${id}`, { method: 'DELETE' });
      } catch (err) {
        set({ users: old }); save(old);
        throw err;
      }
    },

    bulkDelete: async (ids) => {
      const old = get().users;
      set((s) => { const next = s.users.filter((u) => !ids.includes(u.id)); save(next); return { users: next }; });

      try {
        for (const id of ids) {
          await apiFetch(`/api/pengguna/${id}`, { method: 'DELETE' });
        }
      } catch (err) {
        set({ users: old }); save(old);
        throw err;
      }
    },
  };
});

