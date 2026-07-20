import { create } from 'zustand';
import type { Product, ProductUnit } from '@/types';
import { generateId } from '@/lib/utils';
import { apiFetch, dataURLtoBlob } from '@/lib/api';
import { useCategoryStore } from './categoryStore';

interface ProductState {
  products: Product[];
  fetchProducts: () => Promise<void>;
  getProducts: () => Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (data: Omit<Product, 'id' | 'created_at'>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  bulkToggleStatus: (ids: string[], status: string) => Promise<void>;
  getStats: () => { total: number; aktif: number; nonaktif: number; stokRendah: number };
  enrichAllProducts: () => void;
}

const STORAGE_KEY = 'waroengkoe_products';
const load = (): Product[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const save = (data: Product[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function mapBackendProduct(p: any): Product {
  const kategori_id = p.kategori_id ? String(p.kategori_id) : (p.kategori?.id ? String(p.kategori.id) : '');
  let kategori_nama = p.kategori_nama || p.kategori?.nama || '';
  
  if (!kategori_nama && kategori_id) {
    try {
      const categories = useCategoryStore.getState().categories || [];
      const found = categories.find((c: any) => String(c.id) === kategori_id);
      if (found) {
        kategori_nama = found.nama;
      }
    } catch {
      // ignore
    }
  }

  return {
    id: String(p.id),
    sku: p.sku || '',
    nama: p.nama || p.nama_barang || '',
    gambar_url: p.gambar || p.gambar_url || null,
    satuan_dasar: p.satuan_dasar || 'Pcs',
    harga_beli: Number(p.harga_beli || 0),
    stok: Number(p.stok || 0),
    status: p.status === 'active' ? 'aktif' : p.status === 'inactive' ? 'nonaktif' : (p.status || 'aktif'),
    kategori_id,
    kategori_nama,
    satuans: (p.satuans || []).map((s: any) => ({
      id: String(s.id),
      nama: s.nama || s.nama_satuan || 'Pcs',
      konversi: Number(s.konversi || 1),
      harga_jual: Number(s.harga_jual || 0),
      is_visible: s.is_visible !== undefined ? s.is_visible : true,
      is_default: Boolean(s.is_default),
      qty_gratis: s.qty_gratis || 0,
    })),
    batas_stok_rendah: p.batas_stok_rendah !== undefined && p.batas_stok_rendah !== null ? Number(p.batas_stok_rendah) : 5,
    created_at: p.created_at || new Date().toISOString(),
    alias: p.alias || '',
    deskripsi: p.deskripsi || '',
    terjual: p.terjual || 0,
    harga: Number(p.harga_jual || p.harga || 0),
    harga_min: Number(p.harga_min || 0),
    harga_max: Number(p.harga_max || 0),
  } as any;
}

function buildProductFormData(data: any): FormData {
  const fd = new FormData();
  if (data.sku) fd.append('sku', data.sku);
  fd.append('nama_barang', data.nama);
  if (data.kategori_id) fd.append('kategori_id', data.kategori_id);
  fd.append('harga_beli', String(data.harga_beli));
  fd.append('stok', String(data.stok));
  if (data.deskripsi) fd.append('deskripsi', data.deskripsi);
  if (data.alias) fd.append('alias', data.alias);
  const statusMap: Record<string, string> = { 'aktif': 'active', 'nonaktif': 'inactive' };
  fd.append('status', statusMap[data.status] || data.status || 'active');
  
  if (data.gambar_url) {
    if (data.gambar_url.startsWith('data:image/')) {
      const blob = dataURLtoBlob(data.gambar_url);
      fd.append('gambar', blob, 'image.jpg');
    }
  } else if (data.gambar_url === null) {
    fd.append('gambar', 'null');
  }

  (data.satuans || []).forEach((s: any, idx: number) => {
    if (s.id && !s.id.startsWith('temp_')) fd.append(`satuans[${idx}][id]`, s.id);
    fd.append(`satuans[${idx}][nama_satuan]`, s.nama || s.nama_satuan);
    fd.append(`satuans[${idx}][harga_jual]`, String(s.harga_jual));
    fd.append(`satuans[${idx}][konversi]`, String(s.konversi));
    fd.append(`satuans[${idx}][is_default]`, s.is_default ? '1' : '0');
  });

  return fd;
}

export const useProductStore = create<ProductState>((set, get) => {
  const initial = load();

  if (localStorage.getItem('waroengkoe_token')) {
    apiFetch('/api/sync/down')
      .then((res) => {
        if (res.data && res.data.products) {
          const list = res.data.products.filter((p: any) => !p.deleted_at).map(mapBackendProduct);
          set({ products: list }); save(list);
        }
      }).catch(err => console.error(err));
  }

  return {
    products: initial,

    fetchProducts: async () => {
      try {
        const res = await apiFetch('/api/sync/down');
        if (res.data && res.data.products) {
          const list = res.data.products.filter((p: any) => !p.deleted_at).map(mapBackendProduct);
          set({ products: list }); save(list);
        }
      } catch (err) { console.error(err); }
    },

    getProducts: () => get().products,
    getProduct: (id) => get().products.find((p) => p.id === id),

    addProduct: async (data) => {
      const tempId = 'temp_' + generateId();
      const optimProduct: Product = { id: tempId, created_at: new Date().toISOString(), ...data } as any;
      set(s => { const next = [optimProduct, ...s.products]; save(next); return { products: next }; });

      try {
        const fd = buildProductFormData(data);
        const res = await apiFetch('/api/barang', { method: 'POST', body: fd });
        const saved = mapBackendProduct(res.data || res);
        set(s => { const next = s.products.map(p => p.id === tempId ? saved : p); save(next); return { products: next }; });
        return saved;
      } catch (err) {
        set(s => { const next = s.products.filter(p => p.id !== tempId); save(next); return { products: next }; });
        throw err;
      }
    },

    updateProduct: async (id, data) => {
      const old = get().products;
      set(s => { const next = s.products.map(p => p.id === id ? { ...p, ...data } : p); save(next); return { products: next }; });

      try {
        const fd = buildProductFormData({ ...old.find(p => p.id === id), ...data });
        fd.append('_method', 'PUT');
        const res = await apiFetch(`/api/barang/${id}`, { method: 'POST', body: fd });
        const saved = mapBackendProduct(res.data || res);
        set(s => { const next = s.products.map(p => p.id === id ? saved : p); save(next); return { products: next }; });
      } catch (err) {
        set({ products: old }); save(old);
        throw err;
      }
    },

    deleteProduct: async (id) => {
      const old = get().products;
      set(s => { const next = s.products.filter(p => p.id !== id); save(next); return { products: next }; });
      try { await apiFetch(`/api/barang/${id}`, { method: 'DELETE' }); }
      catch (err) { set({ products: old }); save(old); throw err; }
    },

    bulkDelete: async (ids) => {
      const old = get().products;
      set(s => { const next = s.products.filter(p => !ids.includes(p.id)); save(next); return { products: next }; });
      try {
        for (const id of ids) { await apiFetch(`/api/barang/${id}`, { method: 'DELETE' }); }
      } catch (err) { set({ products: old }); save(old); throw err; }
    },

    bulkToggleStatus: async (ids, status) => {
      const old = get().products;
      set(s => { const next = s.products.map(p => ids.includes(p.id) ? { ...p, status } : p); save(next); return { products: next }; });
      try {
        for (const id of ids) {
          const prod = old.find(p => p.id === id);
          if (prod && prod.status !== status) {
            const fd = new FormData();
            fd.append('nama_barang', prod.nama);
            fd.append('harga_beli', String(prod.harga_beli));
            fd.append('stok', String(prod.stok));
            const statusMap: Record<string, string> = { 'aktif': 'active', 'nonaktif': 'inactive' };
            fd.append('status', statusMap[status] || status);
            fd.append('_method', 'PUT');
            (prod.satuans || []).forEach((s: any, idx: number) => {
              fd.append(`satuans[${idx}][nama_satuan]`, s.nama);
              fd.append(`satuans[${idx}][harga_jual]`, String(s.harga_jual));
              fd.append(`satuans[${idx}][konversi]`, String(s.konversi));
              fd.append(`satuans[${idx}][is_default]`, s.is_default ? '1' : '0');
            });
            await apiFetch(`/api/barang/${id}`, { method: 'POST', body: fd });
          }
        }
      } catch (err) { set({ products: old }); save(old); throw err; }
    },

    getStats: () => {
      const products = get().products;
      return {
        total: products.length,
        aktif: products.filter((p) => p.status === 'aktif').length,
        nonaktif: products.filter((p) => p.status === 'nonaktif').length,
        stokRendah: products.filter((p) => p.stok <= p.batas_stok_rendah && p.status === 'aktif').length,
      };
    },

    enrichAllProducts: () => {
      try {
        const categories = useCategoryStore.getState().categories || [];
        set(s => {
          const next = s.products.map(p => {
            if (p.kategori_nama) return p;
            const found = categories.find(c => String(c.id) === String(p.kategori_id));
            return found ? { ...p, kategori_nama: found.nama } : p;
          });
          save(next);
          return { products: next };
        });
      } catch {
        // ignore
      }
    }
  };
});

