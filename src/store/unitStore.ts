import { create } from 'zustand';
import type { Satuan } from '@/types';
import { generateId } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface UnitState {
  units: Satuan[];
  fetchUnits: () => Promise<void>;
  getUnits: () => Satuan[];
  getUnit: (id: string) => Satuan | undefined;
  addUnit: (data: { nama_satuan: string; keterangan: string; batas_stok_rendah: number; is_dasar: boolean }) => Promise<Satuan>;
  updateUnit: (id: string, data: Partial<Satuan>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
}

const STORAGE_KEY = 'waroengkoe_units';
const load = (): Satuan[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const save = (data: Satuan[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const useUnitStore = create<UnitState>((set, get) => {
  const initial = load();
  if (localStorage.getItem('waroengkoe_token')) {
    apiFetch('/api/satuan')
      .then((res) => {
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map((u: any) => ({
          id: String(u.id), nama_satuan: u.nama_satuan, keterangan: u.keterangan || '',
          batas_stok_rendah: u.batas_stok_rendah || 5, is_dasar: Boolean(u.is_dasar),
          product_count: u.product_count || 0, created_at: u.created_at, updated_at: u.updated_at
        }));
        set({ units: formatted }); save(formatted);
      }).catch(err => console.error(err));
  }

  return {
    units: initial,
    fetchUnits: async () => {
      try {
        const res = await apiFetch('/api/satuan');
        const data = Array.isArray(res) ? res : res.data || [];
        const formatted = data.map((u: any) => ({
          id: String(u.id), nama_satuan: u.nama_satuan, keterangan: u.keterangan || '',
          batas_stok_rendah: u.batas_stok_rendah || 5, is_dasar: Boolean(u.is_dasar),
          product_count: u.product_count || 0, created_at: u.created_at, updated_at: u.updated_at
        }));
        set({ units: formatted }); save(formatted);
      } catch (err) { console.error(err); }
    },
    getUnits: () => get().units,
    getUnit: (id) => get().units.find((u) => u.id === id),
    addUnit: async (data) => {
      const tempId = 'temp_' + generateId();
      const unit: Satuan = { id: tempId, ...data, product_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      set((s) => { const next = [...s.units, unit]; save(next); return { units: next }; });
      try {
        const res = await apiFetch('/api/satuan', { method: 'POST', body: JSON.stringify(data) });
        const saved = res.data || res;
        const formatted: Satuan = {
          id: String(saved.id), nama_satuan: saved.nama_satuan, keterangan: saved.keterangan || '',
          batas_stok_rendah: saved.batas_stok_rendah || 5, is_dasar: Boolean(saved.is_dasar),
          product_count: saved.product_count || 0, created_at: saved.created_at, updated_at: saved.updated_at
        };
        set((s) => { const next = s.units.map((u) => u.id === tempId ? formatted : u); save(next); return { units: next }; });
        return formatted;
      } catch (err) {
        set((s) => { const next = s.units.filter((u) => u.id !== tempId); save(next); return { units: next }; });
        throw err;
      }
    },
    updateUnit: async (id, data) => {
      const old = get().units;
      set((s) => { const next = s.units.map((u) => u.id === id ? { ...u, ...data, updated_at: new Date().toISOString() } : u); save(next); return { units: next }; });
      try {
        const body: Record<string, any> = {};
        if (data.nama_satuan) body.nama_satuan = data.nama_satuan;
        if (data.keterangan !== undefined) body.keterangan = data.keterangan;
        const res = await apiFetch(`/api/satuan/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        const saved = res.data || res;
        const formatted: Satuan = {
          id: String(saved.id), nama_satuan: saved.nama_satuan, keterangan: saved.keterangan || '',
          batas_stok_rendah: saved.batas_stok_rendah || 5, is_dasar: Boolean(saved.is_dasar),
          product_count: saved.product_count || 0, created_at: saved.created_at, updated_at: saved.updated_at
        };
        set((s) => { const next = s.units.map((u) => u.id === id ? formatted : u); save(next); return { units: next }; });
      } catch (err) { set({ units: old }); save(old); throw err; }
    },
    deleteUnit: async (id) => {
      const old = get().units;
      set((s) => { const next = s.units.filter((u) => u.id !== id); save(next); return { units: next }; });
      try { await apiFetch(`/api/satuan/${id}`, { method: 'DELETE' }); }
      catch (err) { set({ units: old }); save(old); throw err; }
    },
    bulkDelete: async (ids) => {
      const old = get().units;
      set((s) => { const next = s.units.filter((u) => !ids.includes(u.id)); save(next); return { units: next }; });
      try {
        for (const id of ids) { await apiFetch(`/api/satuan/${id}`, { method: 'DELETE' }); }
      } catch (err) { set({ units: old }); save(old); throw err; }
    },
  };
});

