export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_admin: boolean;
  avatar: string | null;
  can_view_activity_log?: boolean;
  can_manage_category?: boolean;
  can_delete_transaction?: boolean;
}

export interface ProductUnit {
  id: string;
  nama: string;
  konversi: number;
  harga_jual: number;
  is_visible: boolean;
  is_default: boolean;
  qty_gratis: number;
}

export interface Product {
  id: string;
  sku: string;
  nama: string;
  gambar_url: string | null;
  satuan_dasar: string;
  harga_beli: number;
  stok: number;
  status: string;
  kategori_id: string;
  kategori_nama: string;
  satuans: ProductUnit[];
  batas_stok_rendah: number;
  created_at: string;
  promo?: boolean;
  alias?: string;
  deskripsi?: string;
  terjual?: number;
}

export interface CartItemType {
  cartKey: string;
  id: string;
  nama: string;
  qty: number;
  satuan_id: string;
  satuan_nama: string;
  harga: number;
  subtotal: number;
}

export interface CartTotalsType {
  subtotal: number;
  diskonItem: number;
  diskonGlobal: number;
  total: number;
  bayar: number;
  kembalian: number;
}

export interface Satuan {
  id: string;
  nama_satuan: string;
  keterangan: string;
  batas_stok_rendah: number;
  is_dasar: boolean;
  product_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Kategori {
  id: string;
  nama: string;
  deskripsi: string;
  warna: string;
  product_count: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  no_invoice: string;
  created_at: string;
  created_at_day?: string;
  kasir: string;
  kasir_id: string;
  total_harga: number;
  total_bayar: number;
  kembalian?: number;
  status: string;
  metode_pembayaran: string;
  catatan?: string;
  diskon_global?: number;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  barang_id?: string;
  nama_barang: string;
  sku: string;
  qty: number;
  satuan: string;
  harga: number;
  subtotal: number;
  diskon?: number;
  gambar_url: string | null;
}

export interface AuditItem {
  id: string;
  barang_id: string;
  nama_barang: string;
  sku: string;
  kategori: string;
  stok_sistem: number;
  stok_fisik: number;
  selisih: number;
  catatan_item: string;
  satuan_dasar: string;
}

export interface StockAudit {
  id: string;
  created_at: string;
  user_id: string;
  user_name: string;
  status: 'draft' | 'selesai';
  items: AuditItem[];
  total_items: number;
  completed_items: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  action_label?: string;
  barang_id?: string;
  barang_nama: string;
  changed_fields?: string[] | null;
  changed_fields_label?: string[] | null;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  description: string;
  created_at: string;
  created_at_relative?: string;
}

export interface ProfitData {
  product_name: string;
  sku: string;
  total_terjual: number;
  total_omset: number;
  total_modal: number;
  laba_bersih: number;
  margin: number;
  gambar_url: string | null;
}

export interface PageProps {
  auth: {
    user: User | null;
  };
  flash: {
    id: string | null;
    success: string | null;
    error: string | null;
  };
}

export interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
