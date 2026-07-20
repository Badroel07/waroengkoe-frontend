import { create } from 'zustand';
import { useProductStore } from './productStore';
import { useTransactionStore } from './transactionStore';
import { apiFetch } from '@/lib/api';

export interface ProfitItem {
  id: string;
  nama: string;
  gambar: string | null;
  gambar_url: string | null;
  harga_beli: number;
  total_terjual: number;
  satuan: string;
  bruto: number;
  tara: number;
  netto: number;
  latest_invoice?: string;
  cursor_id: string;
}

export interface ProfitStats {
  bruto: number;
  tara: number;
  netto: number;
}

interface ProfitState {
  laporan: ProfitItem[];
  totals: ProfitStats;
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  };
  starProducts: any[];
  lowMarginProducts: any[];
  
  details: any[];
  detailsTotals: ProfitStats;
  detailsPagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  };

  averages: {
    monthly: { revenue: number; profit: number; months_count: number };
    yearly: { revenue: number; profit: number; years_count: number };
  };

  fetchProfitData: (filters: {
    start_date?: string;
    end_date?: string;
    q?: string;
    kategori?: string;
    cursor?: string | null;
  }) => Promise<void>;
  
  fetchProductDetails: (
    productId: string,
    filters: {
      start_date?: string;
      end_date?: string;
      satuan?: string;
      cursor?: string | null;
    }
  ) => Promise<void>;

  fetchAverages: () => Promise<void>;

  getProfitData: (filters: any) => any;
  getProductDetails: (productId: string, filters: any) => any;
  getAverages: () => any;
  updateTarget: (target: number) => void;
  getTarget: () => number;
}

const TARGET_KEY = 'waroengkoe_profit_target';

function mapTransactionFromApi(t: any) {
  return {
    id: String(t.id || ''),
    no_invoice: t.no_invoice || '',
    created_at: t.created_at || '',
    total_harga: Number(t.total_harga || 0),
    status: t.status || '',
    diskon_global: Number(t.diskon_global || 0),
    items: (t.items || []).map((item: any) => ({
      id: String(item.id || ''),
      barang_id: item.barang_id ? String(item.barang_id) : undefined,
      nama_barang: item.nama_barang || item.barang?.nama || '',
      sku: item.sku || '',
      qty: Number(item.jumlah || item.jumlah_terjual || item.qty || 0),
      satuan: item.nama_satuan || item.satuan || 'Pcs',
      harga: Number(item.harga_satuan || item.harga || 0),
      subtotal: Number(item.subtotal || 0),
      diskon: Number(item.diskon || 0),
    })),
  };
}

function extractItemsAndLastPage(res: any): { items: any[]; lastPage: number } {
  if (!res) return { items: [], lastPage: 1 };
  const lastPage = 
    res.pagination?.last_page ||
    res.pagination?.total_pages ||
    res.last_page ||
    res.meta?.last_page ||
    res.data?.last_page ||
    res.data?.pagination?.last_page ||
    1;
  if (Array.isArray(res)) {
    return { items: res, lastPage: 1 };
  }
  if (Array.isArray(res.data)) {
    return { items: res.data, lastPage };
  }
  if (res.data && typeof res.data === 'object' && Array.isArray(res.data.data)) {
    return { items: res.data.data, lastPage };
  }
  if (Array.isArray(res.items)) {
    return { items: res.items, lastPage };
  }
  return { items: [], lastPage: 1 };
}

function parseDateMs(str: string | undefined | null): number {
  if (!str) return 0;
  const isoStr = String(str).trim().replace(' ', 'T');
  const ms = new Date(isoStr).getTime();
  return isNaN(ms) ? 0 : ms;
}

function extractUnitWeight(satuan: string): number {
  const match = (satuan || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function normalizeSatuan(satuan: any): { clean: string; display: string } {
  let raw = typeof satuan === 'object' ? (satuan?.nama || 'Pcs') : String(satuan || 'Pcs');
  raw = raw.trim();
  const clean = raw.replace(/^\*\s*/, '').trim() || 'Pcs';
  const isGramUnit = /^\d+\s*(gr|g|gram|kg|ml|l)$/i.test(clean);
  const display = (raw.startsWith('*') && isGramUnit) ? `* ${clean}` : clean;
  return { clean, display };
}

export const useProfitStore = create<ProfitState>((set, get) => ({
  laporan: [],
  totals: { bruto: 0, tara: 0, netto: 0 },
  pagination: { nextCursor: null, prevCursor: null, hasMore: false },
  starProducts: [],
  lowMarginProducts: [],

  details: [],
  detailsTotals: { bruto: 0, tara: 0, netto: 0 },
  detailsPagination: { nextCursor: null, prevCursor: null, hasMore: false },

  averages: {
    monthly: { revenue: 0, profit: 0, months_count: 0 },
    yearly: { revenue: 0, profit: 0, years_count: 0 },
  },

  fetchAverages: async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await apiFetch(`/api/keuntungan?start_date=2020-01-01&end_date=${todayStr}&per_page=1`);
      if (res && res.success && res.data) {
        const { summary, daily } = res.data;
        const totalRevenue = summary.total_revenue || 0;
        const totalProfit = summary.total_profit || 0;

        const monthsSet = new Set<string>();
        const yearsSet = new Set<string>();

        if (Array.isArray(daily)) {
          daily.forEach((day: any) => {
            if (day.tanggal) {
              const month = day.tanggal.slice(0, 7);
              const year = day.tanggal.slice(0, 4);
              monthsSet.add(month);
              yearsSet.add(year);
            }
          });
        }

        const months_count = Math.max(1, monthsSet.size);
        const years_count = Math.max(1, yearsSet.size);

        set({
          averages: {
            monthly: {
              revenue: Math.round(totalRevenue / months_count),
              profit: Math.round(totalProfit / months_count),
              months_count,
            },
            yearly: {
              revenue: Math.round(totalRevenue / years_count),
              profit: Math.round(totalProfit / years_count),
              years_count,
            },
          }
        });
      }
    } catch (err) {
      console.error('fetchAverages failed:', err);
    }
  },

  fetchProfitData: async (filters) => {
    const { start_date, end_date, q, kategori, cursor } = filters;

    try {
      const apiParams = new URLSearchParams();
      if (start_date) apiParams.set('start_date', start_date);
      if (end_date) apiParams.set('end_date', end_date);
      apiParams.set('per_page', '500');

      let products = useProductStore.getState().products;
      if (!products || products.length === 0) {
        await useProductStore.getState().fetchProducts();
        products = useProductStore.getState().products;
      }

      const profitRes = await apiFetch(`/api/keuntungan?${apiParams.toString()}`);

      const apiData = profitRes?.data || {};
      const summary = apiData.summary || {};
      const apiProducts: any[] = apiData.products || [];

      const productMap = new Map<string, any>();
      products.forEach((p: any) => productMap.set(String(p.id), p));

      let enrichedList = apiProducts.map((item: any) => {
        const storeProduct = productMap.get(String(item.id));
        return {
          id: String(item.id),
          nama: item.nama || '',
          gambar_url: item.gambar || null,
          kategori_nama: storeProduct?.kategori_nama || '',
          satuan_dasar: item.satuan || 'Pcs',
          bruto: Number(item.revenue || 0),
          tara: Number(item.cost || 0),
          netto: Number(item.profit || 0),
          total_terjual: Number(item.qty || 0),
          latest_invoice: item.latest_invoice || '',
          latest_transaction_time: item.latest_transaction_time || '',
          first_seen_order: 0,
        };
      });

      if (kategori) {
        enrichedList = enrichedList.filter((item) => item.kategori_nama === kategori);
      }
      if (q) {
        const query = q.toLowerCase();
        enrichedList = enrichedList.filter(
          (item) =>
            item.nama.toLowerCase().includes(query) ||
            (productMap.get(item.id)?.sku || '').toLowerCase().includes(query)
        );
      }

      enrichedList.sort((a, b) => {
        const tA = parseDateMs(a.latest_transaction_time);
        const tB = parseDateMs(b.latest_transaction_time);
        if (tA !== tB) return tB - tA;
        return 0;
      });

      let totalBruto = enrichedList.reduce((s, i) => s + i.bruto, 0);
      let totalTara = enrichedList.reduce((s, i) => s + i.tara, 0);
      let totalNetto = enrichedList.reduce((s, i) => s + i.netto, 0);

      if (enrichedList.length === 0 && (summary.total_revenue || summary.total_cost || summary.total_profit)) {
        totalBruto = Number(summary.total_revenue || 0);
        totalTara = Number(summary.total_cost || 0);
        totalNetto = Number(summary.total_profit || 0);
      }

      const starProducts = [...enrichedList]
        .sort((a, b) => b.netto - a.netto)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          nama: item.nama,
          gambar_url: item.gambar_url,
          netto: item.netto,
          total_terjual: item.total_terjual,
          satuan: item.satuan_dasar,
        }));

      const lowMarginProducts = enrichedList
        .filter((item) => item.bruto > 0 && item.netto / item.bruto < 0.15)
        .sort((a, b) => a.netto - b.netto)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          nama: item.nama,
          gambar_url: item.gambar_url,
          margin_percent:
            item.bruto > 0 ? Math.round((item.netto / item.bruto) * 100 * 10) / 10 : 0,
          netto: item.netto,
          bruto: item.bruto,
        }));

      const perPage = 10;
      let currentPageIndex = 0;

      const mappedWithCursor = enrichedList.map((item, idx) => ({
        ...item,
        cursor_id: btoa(`${idx}|${item.id}`),
      }));

      if (cursor && cursor !== 'start') {
        const idx = mappedWithCursor.findIndex((item) => item.cursor_id === cursor);
        if (idx !== -1) currentPageIndex = idx + 1;
      }

      const pagedData = mappedWithCursor.slice(currentPageIndex, currentPageIndex + perPage);

      const nextCursor =
        mappedWithCursor.length > currentPageIndex + perPage
          ? pagedData[pagedData.length - 1].cursor_id
          : null;

      const prevCursor =
        currentPageIndex > 0
          ? currentPageIndex - perPage - 1 >= 0
            ? mappedWithCursor[currentPageIndex - perPage - 1].cursor_id
            : 'start'
          : null;

      const reports: ProfitItem[] = pagedData.map((item) => ({
        id: item.id,
        nama: item.nama,
        gambar: item.gambar_url ? 'yes' : null,
        gambar_url: item.gambar_url,
        harga_beli: 0,
        total_terjual: item.total_terjual,
        satuan: item.satuan_dasar,
        bruto: item.bruto,
        tara: item.tara,
        netto: item.netto,
        latest_invoice: item.latest_invoice,
        cursor_id: item.cursor_id,
      }));

      set({
        laporan: reports,
        totals: { bruto: totalBruto, tara: totalTara, netto: totalNetto },
        pagination: { nextCursor, prevCursor, hasMore: !!nextCursor },
        starProducts,
        lowMarginProducts,
      });
    } catch (err) {
      console.error('fetchProfitData failed:', err);
    }
  },

  fetchProductDetails: async (productId, filters) => {
    const { start_date, end_date, satuan, cursor } = filters;

    const queryParams = new URLSearchParams();
    queryParams.set('barang_id', productId);
    if (start_date) queryParams.set('start_date', start_date);
    if (end_date) queryParams.set('end_date', end_date);
    if (satuan) queryParams.set('satuan', satuan);

    try {
      const res = await apiFetch(`/api/keuntungan/product-details?${queryParams.toString()}`);
      const detailsFromApi: any[] = res?.details || [];

      const detailsWithCursor = detailsFromApi.map((d: any) => {
        const ts = new Date(d.created_at).getTime() / 1000;
        return {
          ...d,
          created_at:
            new Date(d.created_at).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }) +
            ' ' +
            new Date(d.created_at)
              .toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })
              .replace('.', ':'),
          cursor_id: btoa(`${ts}|${d.id}`),
        };
      });

      const brutoTotal = detailsWithCursor.reduce((sum: number, d: any) => sum + d.bruto, 0);
      const taraTotal = detailsWithCursor.reduce((sum: number, d: any) => sum + d.tara, 0);
      const nettoTotal = detailsWithCursor.reduce((sum: number, d: any) => sum + d.netto, 0);

      const perPage = 10;
      let currentPageIndex = 0;

      if (cursor && cursor !== 'start') {
        const idx = detailsWithCursor.findIndex((item: any) => item.cursor_id === cursor);
        if (idx !== -1) currentPageIndex = idx + 1;
      }

      const pagedDetails = detailsWithCursor.slice(currentPageIndex, currentPageIndex + perPage);

      let nextCursor: string | null = null;
      if (detailsWithCursor.length > currentPageIndex + perPage) {
        nextCursor = pagedDetails[pagedDetails.length - 1].cursor_id;
      }

      let prevCursor: string | null = null;
      if (currentPageIndex > 0) {
        const prevIndex = currentPageIndex - perPage - 1;
        prevCursor = prevIndex >= 0 ? detailsWithCursor[prevIndex].cursor_id : 'start';
      }

      set({
        details: pagedDetails,
        detailsTotals: { bruto: brutoTotal, tara: taraTotal, netto: nettoTotal },
        detailsPagination: {
          nextCursor,
          prevCursor,
          hasMore: !!nextCursor,
        },
      });
    } catch (err) {
      console.error('fetchProductDetails failed:', err);
    }
  },

  getProfitData: (filters) => {
    const { laporan, totals, pagination, starProducts, lowMarginProducts } = get();
    return { laporan, totals, pagination, starProducts, lowMarginProducts };
  },
  getProductDetails: (productId, filters) => {
    const { details, detailsTotals, detailsPagination } = get();
    return {
      details,
      totals: detailsTotals,
      pagination: detailsPagination,
    };
  },
  getAverages: () => get().averages,
  updateTarget: (target) => localStorage.setItem(TARGET_KEY, target.toString()),
  getTarget: () => Number(localStorage.getItem(TARGET_KEY)) || 5000000,
}));
