import { create } from 'zustand';
import type { Kategori } from '@/types';
import { generateId } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface CategoryState {
  categories: Kategori[];
  fetchCategories: () => Promise<void>;
  getCategories: () => Kategori[];
  getCategory: (id: string) => Kategori | undefined;
  addCategory: (data: { nama: string; deskripsi: string; warna: string }) => Promise<Kategori>;
  updateCategory: (id: string, data: Partial<Kategori>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

const STORAGE_KEY = 'waroengkoe_categories';
const load = (): Kategori[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const save = (data: Kategori[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const useCategoryStore = create<CategoryState>((set, get) => {
  const initial = load();
  if (localStorage.getItem('waroengkoe_token')) {
    apiFetch('/api/kategori')
      .then((res) => {
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map((c: any) => ({
          id: String(c.id), nama: c.nama, deskripsi: c.deskripsi || '', warna: c.warna || '#3b82f6',
          product_count: c.product_count || 0, created_at: c.created_at || new Date().toISOString()
        }));
        set({ categories: formatted }); save(formatted);
      }).catch(err => console.error(err));
  }

  return {
    categories: initial,
    fetchCategories: async () => {
      try {
        const res = await apiFetch('/api/kategori');
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map((c: any) => ({
          id: String(c.id), nama: c.nama, deskripsi: c.deskripsi || '', warna: c.warna || '#3b82f6',
          product_count: c.product_count || 0, created_at: c.created_at || new Date().toISOString()
        }));
        set({ categories: formatted }); save(formatted);
      } catch (err) { console.error(err); }
    },
    getCategories: () => get().categories,
    getCategory: (id) => get().categories.find((c) => c.id === id),
    addCategory: async (data) => {
      const tempId = 'temp_' + generateId();
      const cat: Kategori = { id: tempId, ...data, product_count: 0, created_at: new Date().toISOString() };
      set((s) => { const next = [...s.categories, cat]; save(next); return { categories: next }; });
      try {
        const res = await apiFetch('/api/kategori', { method: 'POST', body: JSON.stringify(data) });
        const saved = res.data || res;
        const formatted: Kategori = {
          id: String(saved.id), nama: saved.nama, deskripsi: saved.deskripsi || '', warna: saved.warna || '#3b82f6',
          product_count: saved.product_count || 0, created_at: saved.created_at || new Date().toISOString()
        };
        set((s) => {
          const next = s.categories.map((c) => c.id === tempId ? formatted : c);
          save(next); return { categories: next };
        });
        return formatted;
      } catch (err) {
        set((s) => { const next = s.categories.filter((c) => c.id !== tempId); save(next); return { categories: next }; });
        throw err;
      }
    },
    updateCategory: async (id, data) => {
      const old = get().categories;
      set((s) => { const next = s.categories.map((c) => c.id === id ? { ...c, ...data } : c); save(next); return { categories: next }; });
      try {
        const res = await apiFetch(`/api/kategori/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        const saved = res.data || res;
        const formatted: Kategori = {
          id: String(saved.id), nama: saved.nama, deskripsi: saved.deskripsi || '', warna: saved.warna || '#3b82f6',
          product_count: saved.product_count || 0, created_at: saved.created_at || new Date().toISOString()
        };
        set((s) => {
          const next = s.categories.map((c) => c.id === id ? formatted : c);
          save(next); return { categories: next };
        });
      } catch (err) { set({ categories: old }); save(old); throw err; }
    },
    deleteCategory: async (id) => {
      const old = get().categories;
      set((s) => { const next = s.categories.filter((c) => c.id !== id); save(next); return { categories: next }; });
      try { await apiFetch(`/api/kategori/${id}`, { method: 'DELETE' }); }
      catch (err) { set({ categories: old }); save(old); throw err; }
    },
    bulkDelete: async (ids) => {
      const old = get().categories;
      set((s) => { const next = s.categories.filter((c) => !ids.includes(c.id)); save(next); return { categories: next }; });
      try {
        for (const id of ids) { await apiFetch(`/api/kategori/${id}`, { method: 'DELETE' }); }
      } catch (err) { set({ categories: old }); save(old); throw err; }
    },
  };
});

