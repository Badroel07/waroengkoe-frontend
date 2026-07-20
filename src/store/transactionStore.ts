import { create } from 'zustand';
import type { Transaction, TransactionItem } from '@/types';
import { generateId } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useProductStore } from './productStore';

interface FetchParams {
  cursor?: string;
  q?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  kasir_id?: string;
}

interface CursorMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

interface TransactionState {
  transactions: Transaction[];
  cursorNext: string | null;
  cursorPrev: string | null;
  hasMore: boolean;
  kasirs: { id: number; name: string }[];
  serverStats: {
    todayCount: number;
    countSelesai: number;
    countPending: number;
    countAll: number;
    totalMenunggak: number;
  } | null;
  fetchTransactions: (params?: FetchParams) => Promise<void>;
  fetchTransactionDetail: (id: string) => Promise<Transaction | undefined>;
  addTransaction: (data: {
    items: TransactionItem[];
    total_harga: number;
    total_bayar: number;
    metode_pembayaran: string;
    kasir: string;
    kasir_id: string;
    catatan?: string;
    diskon_global?: number;
  }) => Promise<Transaction>;
  getTransaction: (id: string) => Transaction | undefined;
  deleteTransaction: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  getStats: () => {
    total: number;
    pending: number;
    sukses: number;
    todayCount: number;
    totalMenunggak: number;
  };
  getThisMonthTransactions: () => Transaction[];
  getKasirList: () => { id: string; name: string }[];
}

const STORAGE_KEY = 'waroengkoe_transactions';

function load(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function save(data: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function mapBackendTransaction(t: any): Transaction {
  const mapItem = (item: any) => ({
    id: String(item.id),
    barang_id: item.barang_id ? String(item.barang_id) : undefined,
    nama_barang: item.nama_barang || item.nama || '',
    sku: item.sku || '',
    qty: Number(item.qty || item.jumlah || item.jumlah_terjual || 0),
    satuan: item.satuan || item.nama_satuan || 'Pcs',
    harga: Number(item.harga || item.harga_satuan || 0),
    subtotal: Number(item.subtotal || 0),
    diskon: Number(item.diskon || 0),
    gambar_url: item.gambar_url || item.gambar || null,
  });

  return {
    id: String(t.id),
    no_invoice: t.no_invoice,
    created_at: t.created_at_iso || t.created_at,
    created_at_day: t.created_at_day || undefined,
    kasir: t.kasir || t.user?.name || 'Unknown',
    kasir_id: String(t.kasir_id || t.user_id || ''),
    total_harga: Number(t.total_harga),
    total_bayar: Number(t.total_bayar),
    kembalian: Number(t.kembalian),
    status: (t.status || '').toLowerCase(),
    metode_pembayaran: t.metode_pembayaran === 'tunai' ? 'Tunai' : (t.metode_pembayaran === 'qris' ? 'QRIS' : (t.metode_pembayaran === 'Transfer' ? 'Transfer' : t.metode_pembayaran)),
    diskon_global: Number(t.diskon_global || 0),
    catatan: t.catatan || '',
    items: (t.items || []).map(mapItem),
  };
}

export const useTransactionStore = create<TransactionState>((set, get) => {
  const initial = load();

  return {
    transactions: initial,
    cursorNext: null,
    cursorPrev: null,
    hasMore: false,
    kasirs: [],
    serverStats: null,

    fetchTransactions: async (params) => {
      try {
        const query = new URLSearchParams();
        if (params?.cursor) query.set('cursor', params.cursor);
        if (params?.q) query.set('q', params.q);
        if (params?.start_date) query.set('start_date', params.start_date);
        if (params?.end_date) query.set('end_date', params.end_date);
        if (params?.status && params.status !== 'Semua') query.set('status', params.status);
        if (params?.kasir_id) query.set('kasir_id', params.kasir_id);

        const qs = query.toString();
        const res = await apiFetch(`/api/kasir/riwayat${qs ? `?${qs}` : ''}`);

        const history = res.history || { data: [], meta: { nextCursor: null, prevCursor: null, hasMore: false } };
        const formatted = (history.data || []).map(mapBackendTransaction);

        set({
          transactions: formatted,
          cursorNext: history.meta?.nextCursor || null,
          cursorPrev: history.meta?.prevCursor || null,
          hasMore: history.meta?.hasMore || false,
          kasirs: res.kasirs || [],
          serverStats: res.stats || null,
        });

        save(formatted);
      } catch (err) {
        console.error(err);
      }
    },

    fetchTransactionDetail: async (id: string) => {
      try {
        const res = await apiFetch(`/api/kasir/riwayat/detail/${id}`);
        const raw = res.transaksi || res;
        const formatted = mapBackendTransaction(raw);
        set((s) => {
          const exists = s.transactions.some((t) => t.id === id);
          const next = exists
            ? s.transactions.map((t) => t.id === id ? formatted : t)
            : [...s.transactions, formatted];
          save(next);
          return { transactions: next };
        });
        return formatted;
      } catch (err) {
        console.error(err);
        return undefined;
      }
    },

    getTransaction: (id) => get().transactions.find((t) => t.id === id),

    addTransaction: async (data) => {
      const products = useProductStore.getState().products;
      const itemsMapped = data.items.map((item) => {
        const prod = products.find((p) => p.id === item.id || p.sku === item.sku);
        let satuan_id = '';
        if (prod) {
          const matchedUnit = prod.satuans.find((s) => s.nama.toLowerCase() === item.satuan.toLowerCase());
          if (matchedUnit) {
            satuan_id = matchedUnit.id;
          } else {
            const defaultUnit = prod.satuans.find((s) => s.is_default) || prod.satuans[0];
            if (defaultUnit) satuan_id = defaultUnit.id;
          }
        }
        return {
          barang_id: Number(prod ? prod.id : item.id),
          satuan_id: Number(satuan_id),
          jumlah: item.qty,
          harga_satuan: item.harga,
          diskon: item.diskon || 0,
        };
      });

      const body = {
        items: itemsMapped,
        total_bayar: data.total_bayar,
        metode_pembayaran: data.metode_pembayaran.toLowerCase() as any,
        diskon_global: data.diskon_global || 0,
        catatan: data.catatan || '',
      };

      const res = await apiFetch('/api/transaksi', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      });
      useProductStore.getState().fetchProducts();

      await get().fetchTransactions();

      const saved = get().transactions.find((t: Transaction) => t.no_invoice === res.data?.no_invoice) || mapBackendTransaction(res.data || res);
      return saved;
    },

    updateTransaction: async (id, data) => {
      const old = get().transactions;
      set((s) => {
        const next = s.transactions.map((t) => {
          if (t.id === id) {
            const u = { ...t, ...data };
            u.kembalian = Math.max(0, u.total_bayar - u.total_harga);
            return u;
          }
          return t;
        });
        save(next); return { transactions: next };
      });

      try {
        const body: any = {};
        if (data.total_bayar !== undefined) body.total_bayar = data.total_bayar;
        if (data.metode_pembayaran) body.metode_pembayaran = data.metode_pembayaran.toLowerCase();
        if (data.status) body.status = data.status;
        if (data.catatan !== undefined) body.catatan = data.catatan;

        await apiFetch(`/api/transaksi/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });

        await get().fetchTransactions();
      } catch (err) {
        set({ transactions: old }); save(old);
        throw err;
      }
    },

    deleteTransaction: async (id) => {
      const old = get().transactions;
      set((s) => { const next = s.transactions.filter((t) => t.id !== id); save(next); return { transactions: next }; });
      try {
        await apiFetch(`/api/transaksi/${id}`, { method: 'DELETE' });
        useProductStore.getState().fetchProducts();
      } catch (err) {
        set({ transactions: old }); save(old);
        throw err;
      }
    },

    bulkDelete: async (ids) => {
      const old = get().transactions;
      set((s) => { const next = s.transactions.filter((t) => !ids.includes(t.id)); save(next); return { transactions: next }; });
      try {
        for (const id of ids) {
          await apiFetch(`/api/transaksi/${id}`, { method: 'DELETE' });
        }
        useProductStore.getState().fetchProducts();
      } catch (err) {
        set({ transactions: old }); save(old);
        throw err;
      }
    },

    getStats: () => {
      const ss = get().serverStats;
      if (ss) {
        return {
          total: ss.countAll,
          pending: ss.countPending,
          sukses: ss.countSelesai,
          todayCount: ss.todayCount,
          totalMenunggak: ss.totalMenunggak,
        };
      }

      const ts = get().transactions;
      const now = new Date();
      const todayStr = now.toDateString();

      const pending = ts.filter((t) => t.status.toLowerCase() === 'pending');
      const sukses = ts.filter((t) => t.status.toLowerCase() === 'selesai');
      const today = ts.filter((t) => {
        const d = new Date(t.created_at);
        return d.toDateString() === todayStr;
      });

      const totalMenunggak = pending.reduce((sum, t) => {
        const sisa = Math.max(0, t.total_harga - t.total_bayar);
        return sum + sisa;
      }, 0);

      return {
        total: ts.length,
        pending: pending.length,
        sukses: sukses.length,
        todayCount: today.length,
        totalMenunggak,
      };
    },

    getThisMonthTransactions: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return get().transactions.filter(
        (t) => new Date(t.created_at) >= start && t.status.toLowerCase() === 'selesai'
      );
    },

    getKasirList: () => {
      const serverKasirs = get().kasirs;
      if (serverKasirs.length > 0) {
        return serverKasirs.map((k) => ({ id: String(k.id), name: k.name }));
      }

      const ts = get().transactions;
      const cache: Record<string, string> = {};
      ts.forEach((t) => {
        if (t.kasir_id) {
          cache[t.kasir_id] = t.kasir;
        }
      });
      return Object.entries(cache).map(([id, name]) => ({ id, name }));
    },
  };
});

// Initial fetch after store created — avoid calling get() during creation
if (typeof window !== 'undefined' && localStorage.getItem('waroengkoe_token')) {
  useTransactionStore.getState().fetchTransactions();
}
