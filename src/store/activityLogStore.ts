import { create } from 'zustand';
import type { ActivityLog } from '@/types';
import { generateId } from '@/lib/utils';

interface ActivityLogState {
  logs: ActivityLog[];
  addLog: (data: {
    user_id: string;
    user_name: string;
    action: string;
    barang_id?: string;
    barang_nama: string;
    changed_fields?: string[] | null;
    changed_fields_label?: string[] | null;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    description: string;
  }) => void;
  getLog: (id: string) => ActivityLog | undefined;
  getFilteredLogs: (
    filters: {
      q?: string;
      action?: string;
      changed_field?: string;
      date_from?: string;
      date_to?: string;
      sort?: string;
    },
    cursor?: string | null
  ) => {
    logs: ActivityLog[];
    pagination: {
      nextCursor: string | null;
      prevCursor: string | null;
    };
  };
}

const STORAGE_KEY = 'waroengkoe_activity_logs';

// Helper to calculate relative time in Indonesian
export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'baru saja';
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHr < 24) return `${diffHr} jam yang lalu`;
  if (diffDay === 1) return 'kemarin';
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Indonesian action labels
const ACTION_LABELS: Record<string, string> = {
  create: 'Menambahkan',
  update: 'Mengedit',
  delete: 'Menghapus',
};

// Field labels mapping
export const FIELD_LABELS: Record<string, string> = {
  nama: 'Nama',
  nama_barang: 'Nama',
  stok: 'Stok',
  gambar_url: 'Gambar',
  gambar: 'Gambar',
  harga_beli: 'Harga Beli',
  kategori_nama: 'Kategori',
  jenis_kategori: 'Kategori',
  sku: 'SKU',
  deskripsi: 'Deskripsi',
  status: 'Status',
  satuan_dasar: 'Satuan',
  tipe_kuantitas: 'Satuan',
  satuans: 'Multi-Satuan',
  is_visible_satuan: 'Status Jual Satuan',
  warna: 'Warna',
  harga_jual: 'Harga Jual',
  harga_jual_baru: 'Jadwal Harga Baru',
  konversi: 'Isi per Satuan',
  qty_gratis: 'Gratis (Bonus)',
};

function seedLogs(): ActivityLog[] {
  const now = new Date();
  
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'log1',
      user_id: '1',
      user_name: 'Admin Waroeng',
      action: 'update',
      barang_id: 'mrs1stvwl1wu4rc',
      barang_nama: 'Indomie Goreng',
      changed_fields: ['stok'],
      changed_fields_label: ['Stok'],
      old_values: { stok: 120 },
      new_values: { stok: 130 },
      description: 'Mengubah stok barang dari 120 Pcs menjadi 130 Pcs (Penyesuaian stok +10).',
      created_at: minutesAgo(10),
    },
    {
      id: 'log2',
      user_id: '1',
      user_name: 'Admin Waroeng',
      action: 'create',
      barang_id: 'mrs1stvwl1wu4rx',
      barang_nama: 'Beras Rose Brand 5kg',
      changed_fields: null,
      changed_fields_label: null,
      old_values: {},
      new_values: {
        sku: 'BRG006',
        nama: 'Beras Rose Brand 5kg',
        satuan_dasar: 'Pcs',
        harga_beli: 70000,
        stok: 15,
        status: 'Aktif',
        kategori_nama: 'Sembako',
        batas_stok_rendah: 5,
      },
      description: 'Menambahkan barang baru Beras Rose Brand 5kg dengan SKU BRG006.',
      created_at: hoursAgo(2),
    },
    {
      id: 'log3',
      user_id: '2',
      user_name: 'Kasir Toko',
      action: 'update',
      barang_id: 'mrs1stvwl1wu4rd',
      barang_nama: 'Aqua 600ml',
      changed_fields: ['harga_beli', 'satuans'],
      changed_fields_label: ['Harga Beli', 'Multi-Satuan'],
      old_values: {
        harga_beli: 2000,
        satuans: [
          { nama_satuan: 'Pcs', konversi: 1, harga_jual: 4500, is_default: true },
          { nama_satuan: 'Kardus', konversi: 24, harga_jual: 100000, is_default: false },
        ]
      },
      new_values: {
        harga_beli: 2500,
        satuans: [
          { nama_satuan: 'Pcs', konversi: 1, harga_jual: 5000, is_default: true },
          { nama_satuan: 'Kardus', konversi: 24, harga_jual: 110000, is_default: false },
        ]
      },
      description: 'Mengubah harga beli dari Rp 2.000 menjadi Rp 2.500 dan harga jual Pcs dari Rp 4.500 menjadi Rp 5.000.',
      created_at: hoursAgo(5),
    },
    {
      id: 'log4',
      user_id: '1',
      user_name: 'Admin Waroeng',
      action: 'update',
      barang_id: 'mrs1stvwl1wu4rg',
      barang_nama: 'Minyak Goreng Bimoli 2L',
      changed_fields: ['status'],
      changed_fields_label: ['Status'],
      old_values: { status: 'Aktif' },
      new_values: { status: 'Nonaktif' },
      description: 'Mengubah status barang dari Aktif menjadi Nonaktif.',
      created_at: daysAgo(1),
    },
    {
      id: 'log5',
      user_id: '1',
      user_name: 'Admin Waroeng',
      action: 'delete',
      barang_id: 'mrs1stvwl1wu4ro',
      barang_nama: 'Coca Cola 250ml',
      changed_fields: null,
      changed_fields_label: null,
      old_values: {
        sku: 'BRG003',
        nama: 'Coca Cola 250ml',
        satuan_dasar: 'Pcs',
        harga_beli: 4500,
        stok: 60,
        status: 'Aktif',
      },
      new_values: {},
      description: 'Menghapus barang Coca Cola 250ml.',
      created_at: daysAgo(2),
    },
    {
      id: 'log6',
      user_id: '1',
      user_name: 'Admin Waroeng',
      action: 'update',
      barang_id: 'mrs1stvwl1wu4rc',
      barang_nama: 'Indomie Goreng',
      changed_fields: ['deskripsi', 'alias'],
      changed_fields_label: ['Deskripsi', 'Alias'],
      old_values: { deskripsi: '', alias: '' },
      new_values: { deskripsi: 'Indomie goreng lezat', alias: 'Indomie Goreng Pcs' },
      description: 'Mengubah deskripsi dan alias produk Indomie Goreng.',
      created_at: daysAgo(3),
    },
  ];
}

function load(): ActivityLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const seeded = seedLogs();
      save(seeded);
      return seeded;
    }
    return JSON.parse(data);
  } catch {
    return seedLogs();
  }
}

function save(data: ActivityLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  logs: load(),

  addLog: (data) => {
    const log: ActivityLog = {
      id: generateId(),
      user_id: data.user_id,
      user_name: data.user_name,
      action: data.action,
      barang_id: data.barang_id,
      barang_nama: data.barang_nama,
      changed_fields: data.changed_fields || null,
      changed_fields_label: data.changed_fields_label || null,
      old_values: data.old_values || {},
      new_values: data.new_values || {},
      description: data.description,
      created_at: new Date().toISOString(),
    };
    set((s) => {
      const next = [log, ...s.logs].slice(0, 500);
      save(next);
      return { logs: next };
    });
  },

  getLog: (id) => get().logs.find((l) => l.id === id),

  getFilteredLogs: (filters, cursor) => {
    const allLogs = get().logs;
    
    // 1. Filter
    let filtered = allLogs.filter((log) => {
      // Action Filter
      if (filters.action && filters.action !== 'all' && log.action !== filters.action) {
        return false;
      }
      
      // Changed Field Filter (only active if action is update)
      if (filters.action === 'update' && filters.changed_field && filters.changed_field !== 'all') {
        if (!log.changed_fields || !log.changed_fields.includes(filters.changed_field)) {
          return false;
        }
      }

      // Search Query (filters by barang_nama or description)
      if (filters.q) {
        const query = filters.q.toLowerCase();
        const nameMatch = log.barang_nama.toLowerCase().includes(query);
        const descMatch = log.description.toLowerCase().includes(query);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      // Date From Filter
      if (filters.date_from) {
        const fromDate = new Date(filters.date_from);
        fromDate.setHours(0, 0, 0, 0);
        if (new Date(log.created_at) < fromDate) {
          return false;
        }
      }

      // Date To Filter
      if (filters.date_to) {
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(log.created_at) > toDate) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort (default: desc - newest first)
    const isAsc = filters.sort === 'asc';
    filtered.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return isAsc ? timeA - timeB : timeB - timeA;
    });

    // Enrich with relative time for display
    const enriched = filtered.map(log => ({
      ...log,
      created_at_relative: getRelativeTime(log.created_at),
      action_label: ACTION_LABELS[log.action] || log.action,
      // format created_at date nicely
      created_at: new Date(log.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // 3. Cursor Pagination (PAGE_SIZE = 20)
    const PAGE_SIZE = 20;
    let paginated: ActivityLog[] = [];
    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (!cursor) {
      // First page
      paginated = enriched.slice(0, PAGE_SIZE);
      if (enriched.length > PAGE_SIZE) {
        nextCursor = `next:${paginated[paginated.length - 1].id}`;
      }
    } else {
      const [direction, targetId] = cursor.split(':');
      const targetIndex = enriched.findIndex(l => l.id === targetId);

      if (targetIndex !== -1) {
        if (direction === 'next') {
          paginated = enriched.slice(targetIndex + 1, targetIndex + 1 + PAGE_SIZE);
          
          if (targetIndex > 0) {
            prevCursor = `prev:${paginated[0].id}`;
          }
          if (targetIndex + 1 + PAGE_SIZE < enriched.length) {
            nextCursor = `next:${paginated[paginated.length - 1].id}`;
          }
        } else if (direction === 'prev') {
          const startIndex = Math.max(0, targetIndex - PAGE_SIZE);
          paginated = enriched.slice(startIndex, targetIndex);
          
          if (startIndex > 0) {
            prevCursor = `prev:${paginated[0].id}`;
          }
          nextCursor = `next:${paginated[paginated.length - 1].id}`;
        }
      } else {
        // Fallback if cursor id not found
        paginated = enriched.slice(0, PAGE_SIZE);
      }
    }

    return {
      logs: paginated,
      pagination: {
        nextCursor,
        prevCursor,
      }
    };
  },
}));
