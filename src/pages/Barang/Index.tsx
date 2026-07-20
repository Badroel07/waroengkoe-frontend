import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import ImportExcelModal from '@/components/ImportExcelModal';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import CustomSelect from '@/components/CustomSelect';
import Icon from '@/components/Icon';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import Skeleton, { StatCardSkeleton } from '@/components/Skeleton';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import type { Product } from '@/types';

const PAGE_SIZE = 10;

export default function BarangIndex() {
  const navigate = useNavigate();
  const { error, confirmDanger } = useAlert();
  const toast = useToast();

  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const bulkDelete = useProductStore((s) => s.bulkDelete);
  const enrichAllProducts = useProductStore((s) => s.enrichAllProducts);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setIsLoading(false));
  }, [fetchProducts, fetchCategories]);

  // States
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [sortBy, setSortBy] = useState('created_at-desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollRestored, setScrollRestored] = useState(false);

  // Refresh dynamic "terjual" counts
  useEffect(() => {
    enrichAllProducts();
  }, [enrichAllProducts]);

  // Handle scroll recording
  useEffect(() => {
    const handleScroll = () => {
      const contentArea = document.getElementById('main-content');
      if (contentArea) {
        sessionStorage.setItem('scroll_barang_desktop', contentArea.scrollTop.toString());
      }
      sessionStorage.setItem('scroll_barang_mobile', window.scrollY.toString());
      sessionStorage.setItem('barang_page_height', document.documentElement.scrollHeight.toString());
    };

    window.addEventListener('scroll', handleScroll);
    const contentArea = document.getElementById('main-content');
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (contentArea) {
        contentArea.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Restore scroll position
  useEffect(() => {
    if (products && products.length > 0 && !scrollRestored) {
      const shouldRestore = sessionStorage.getItem('should_restore_scroll_flag') === 'true';
      sessionStorage.removeItem('should_restore_scroll_flag');

      if (shouldRestore) {
        const savedScrollDesktop = sessionStorage.getItem('scroll_barang_desktop');
        const savedScrollMobile = sessionStorage.getItem('scroll_barang_mobile');
        
        const timer = setTimeout(() => {
          if (window.innerWidth < 768 && savedScrollMobile) {
            window.scrollTo({ top: parseInt(savedScrollMobile, 10), behavior: 'instant' });
          } else if (savedScrollDesktop) {
            const contentArea = document.getElementById('main-content');
            if (contentArea) contentArea.scrollTop = parseInt(savedScrollDesktop, 10);
          }
          setScrollRestored(true);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        if (window.innerWidth < 768) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          const contentArea = document.getElementById('main-content');
          if (contentArea) contentArea.scrollTop = 0;
        }
        setScrollRestored(true);
      }
    }
  }, [products, scrollRestored]);

  // Reset scrollRestored flag on filter/search/page change
  useEffect(() => {
    setScrollRestored(false);
    setSelected([]);
    setCurrentPage(1);
  }, [search, kategori, sortBy]);

  // Save return URL
  useEffect(() => {
    sessionStorage.setItem('last_barang_url', window.location.pathname + window.location.search);
  }, [search, kategori, sortBy, currentPage]);

  const handleCardClick = (product: Product) => {
    if (isSelectionMode) {
      toggleSelect(product.id);
    } else {
      navigate(`/barang/${product.id}`);
    }
  };

  const formatCurrency = (value: number | string) => new Intl.NumberFormat('id-ID').format(Number(value));

  // Compute Stats dynamically
  const stats = useMemo(() => {
    let totalProducts = products.length;
    let lowStockCount = products.filter(p => p.stok <= p.batas_stok_rendah && p.stok > 0 && p.status === 'aktif').length;
    let outOfStockCount = products.filter(p => p.stok <= 0 && p.status === 'aktif').length;
    let totalValue = products.reduce((sum, p) => sum + (p.harga_beli * p.stok), 0);

    return { totalProducts, lowStockCount, outOfStockCount, totalValue };
  }, [products]);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    const [sortField, sortDirection] = sortBy.split('-');
    
    return products
      .filter((p) => {
        if (kategori && p.kategori_id !== kategori) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.nama.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.alias && p.alias.toLowerCase().includes(q));
        }
        return true;
      })
      .map(p => {
        const prices = p.satuans?.filter(s => s.is_visible).map(s => s.harga_jual) || [];
        const harga_min = prices.length > 0 ? Math.min(...prices) : p.harga_beli;
        const harga_max = prices.length > 0 ? Math.max(...prices) : p.harga_beli;
        const harga = p.satuans?.find(s => s.is_default)?.harga_jual || p.harga_beli;
        return { ...p, harga_min, harga_max, harga };
      })
      .sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'nama_barang') {
          valA = a.nama;
          valB = b.nama;
        } else if (sortField === 'harga') {
          valA = a.harga;
          valB = b.harga;
        } else if (sortField === 'stok') {
          valA = a.stok;
          valB = b.stok;
        } else if (sortField === 'created_at') {
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
      });
  }, [products, search, kategori, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  // Selection
  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === paginatedProducts.length) {
      setSelected([]);
    } else {
      setSelected(paginatedProducts.map(p => p.id));
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirmDanger('Hapus Banyak Barang', `Yakin ingin menghapus ${selected.length} barang?`);
    if (!confirmed) return;

    setProcessing(true);
    try {
      await bulkDelete(selected);
      setSelected([]);
      setIsSelectionMode(false);
      toast.success(`${selected.length} barang berhasil dihapus`);
    } catch (err) {
      toast.error('Gagal menghapus barang');
    } finally {
      setProcessing(false);
    }
  };

  // Simulated CSV Export
  const handleExport = () => {
    try {
      const headers = ['SKU', 'Nama Barang', 'Alias', 'Kategori', 'Stok', 'Batas Stok Rendah', 'Harga Beli', 'Status', 'Deskripsi'];
      const rows = products.map(p => [
        p.sku,
        p.nama,
        p.alias || '',
        p.kategori_nama,
        p.stok,
        p.batas_stok_rendah,
        p.harga_beli,
        p.status,
        p.deskripsi || ''
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data_barang_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Data barang berhasil diexport ke CSV');
    } catch {
      toast.error('Gagal mengexport data');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDanger('Yakin ingin menghapus barang ini?', 'Hapus Barang');
    if (!confirmed) return;

    setProcessing(true);
    try {
      await deleteProduct(id);
      toast.success('Barang berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus barang');
    } finally {
      setProcessing(false);
    }
  };

  const ProductsSkeleton = () => {
    const minHeight = typeof window !== 'undefined' ? sessionStorage.getItem('barang_page_height') : null;
    return (
      <div style={{ minHeight: minHeight ? `${minHeight}px` : '100vh' }}>
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden" style={{ isolation: 'isolate', transform: 'translateZ(0)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-left w-12"></th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em] w-12">No</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Produk</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Kategori</th>
                  <th className="px-4 py-5 text-right text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Harga</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Stok</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Terjual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`table-skele-${i}`} className="dark:border-b dark:border-slate-800/50">
                    <td className="px-6 py-4">
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="w-5 h-4 mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-2xl" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="w-48 h-4" />
                          <Skeleton className="w-24 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-20 h-5" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Skeleton className="w-24 h-4" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-16 h-5" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="w-8 h-4 mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`card-skele-${i}`} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0 items-center">
                  <Skeleton className="w-4 h-4 rounded shrink-0" />
                  <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-16 h-3" />
                    <div className="flex gap-2 mt-1">
                      <Skeleton className="w-14 h-4" />
                      <Skeleton className="w-16 h-4" />
                    </div>
                  </div>
                </div>
                <Skeleton className="w-6 h-6 rounded shrink-0" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                <div className="space-y-1">
                  <Skeleton className="w-12 h-3" />
                  <Skeleton className="w-24 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StatCard = ({ icon, iconBg, value, label }: { icon: string; iconBg: string; value: string | number | null; label: string }) => (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none transition-all hover:shadow-xl group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 text-left">
          <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] leading-none mb-2">{label}</p>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">{value}</h3>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
          <Icon name={icon} className="text-xl sm:text-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout
      title="Data Barang"
      searchConfig={{
        placeholder: 'Cari nama barang, SKU...',
        value: search,
        onSearch: setSearch
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Data Barang</h2>
              <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">Kelola inventaris produk toko Anda</p>
            </div>
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                title="Export ke CSV"
              >
                <Icon name="download" className="text-[20px]" />
                <span className="text-sm font-medium">Export</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                title="Import dari Excel"
              >
                <Icon name="upload" className="text-[20px]" />
                <span className="text-sm font-medium">Import</span>
              </button>
              <button
                onClick={() => navigate('/barang/create')}
                className="flex items-center gap-2 rounded-xl bg-[#006eff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all"
              >
                <Icon name="add_circle" className="text-[20px]" />
                <span>Tambah Produk</span>
              </button>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-[0.98]"
              title="Export"
              aria-label="Export ke CSV"
            >
              <Icon name="download" className="text-[20px]" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-[0.98]"
              title="Import"
              aria-label="Import dari Excel"
            >
              <Icon name="upload" className="text-[20px]" />
            </button>
            <button
              onClick={() => navigate('/barang/create')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#006eff] px-5 py-3 text-sm font-bold text-white hover:bg-[#0056c7] shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>Tambah Produk</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard icon="inventory_2" iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" value={stats.totalProducts !== undefined ? formatCurrency(stats.totalProducts) : null} label="Total Produk" />
              <StatCard icon="warning" iconBg="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" value={stats.lowStockCount !== undefined ? `${stats.lowStockCount} + ${stats.outOfStockCount}` : null} label="Stok Rendah / Habis" />
              <StatCard icon="payments" iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" value={stats.totalValue !== undefined ? `Rp ${formatCurrency(stats.totalValue)}` : null} label="Total Nilai" />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none p-4 transition-all">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2 flex-1 min-w-0">
              <label htmlFor="kategori-filter" className="sr-only">Filter Kategori</label>
              <CustomSelect
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="flex-1 min-w-0"
                placeholder="Semua Kategori"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-3 sm:py-2.5 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                options={[
                  { value: "", label: "Semua Kategori" },
                  ...categories.map((cat) => ({ value: cat.id, label: cat.nama }))
                ]}
              />

              <label htmlFor="sort-filter" className="sr-only">Urutkan</label>
              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 min-w-0"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-3 sm:py-2.5 rounded-lg font-bold text-slate-900 dark:text-slate-100"
                options={[
                  {
                    label: "Nama",
                    options: [
                      { value: "nama_barang-asc", label: "Nama (A-Z)" },
                      { value: "nama_barang-desc", label: "Nama (Z-A)" }
                    ]
                  },
                  {
                    label: "Harga",
                    options: [
                      { value: "harga-asc", label: "Harga (Terendah)" },
                      { value: "harga-desc", label: "Harga (Tertinggi)" }
                    ]
                  },
                  {
                    label: "Stok",
                    options: [
                      { value: "stok-asc", label: "Stok (Terendah)" },
                      { value: "stok-desc", label: "Stok (Terbanyak)" }
                    ]
                  },
                  {
                    label: "Waktu",
                    options: [
                      { value: "created_at-desc", label: "Terbaru" },
                      { value: "created_at-asc", label: "Terlama" }
                    ]
                  }
                ]}
              />
            </div>

            {selected.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 group/delete active:scale-[0.98]"
              >
                <Icon name="delete" className="text-sm group-hover/delete:scale-110 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-tight">{selected.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Selection Toggle */}
        <div className="md:hidden flex justify-end px-2 mt-2">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelected([]);
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all shadow-sm"
          >
            <Icon name={isSelectionMode ? "close" : "check"} className="text-[20px]" />
            <span>{isSelectionMode ? "Batal" : "Pilih"}</span>
          </button>
        </div>

        {/* Catalog Content */}
        <div className={`transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none duration-150' : ''}`}>
          {isLoading || products.length === 0 ? (
            <ProductsSkeleton />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden" style={{ isolation: 'isolate', transform: 'translateZ(0)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-5 text-left">
                          <input
                            type="checkbox"
                            checked={selected.length === paginatedProducts.length && paginatedProducts.length > 0}
                            onChange={toggleSelectAll}
                            aria-label="Pilih semua baris"
                            className="size-4 rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#006eff] focus:ring-0 transition-all cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em] w-12">No</th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Produk</th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Kategori</th>
                        <th className="px-4 py-5 text-right text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Harga</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Stok</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Terjual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                      {paginatedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-24 text-center bg-white dark:bg-slate-950">
                            <div className="flex flex-col items-center justify-center animate-fade-in text-center w-full">
                              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner group/icon mx-auto">
                                <Icon name={search || kategori ? "search_off" : "inventory_2"} className="text-5xl text-slate-400 dark:text-slate-700 transition-transform group-hover/icon:rotate-12" />
                              </div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                                {search ? `HASIL CARI "${search}" NIHIL` : 'TIDAK ADA PRODUK'}
                              </h3>
                              <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                                {search && kategori
                                  ? `Tidak ditemukan produk dengan kata kunci tersebut di kategori yang dipilih.`
                                  : search
                                    ? `Maaf, kami tidak dapat menemukan produk yang sesuai dengan kata kunci tersebut.`
                                    : kategori
                                      ? `Belum ada produk yang terdaftar di kategori yang dipilih.`
                                      : 'Mulai dengan menambahkan produk pertama Anda untuk mulai berjualan.'}
                              </p>

                              {(search || kategori) ? (
                                <div className="flex justify-center mt-8">
                                  <button
                                    onClick={() => {
                                      setSearch('');
                                      setKategori('');
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                                  >
                                    <Icon name="refresh" className="text-sm" />
                                    Reset Semua Filter
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center mt-8">
                                  <button
                                    onClick={() => navigate('/barang/create')}
                                    className="px-8 py-3 bg-[#006eff] hover:bg-[#0056c7] text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center gap-2"
                                  >
                                    <Icon name="add" className="text-lg" />
                                    Buat Produk Pertama
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedProducts.map((product, index) => (
                          <tr
                            key={product.id}
                            onClick={() => {
                              if (selected.length > 0) {
                                toggleSelect(product.id);
                              } else {
                                navigate(`/barang/${product.id}`);
                              }
                            }}
                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors dark:border-b dark:border-slate-800/50 cursor-pointer"
                            title={selected.length > 0 ? "Klik untuk memilih produk" : "Klik untuk melihat detail produk"}
                          >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected.includes(product.id)}
                                onChange={() => toggleSelect(product.id)}
                                aria-label={`Pilih ${product.nama}`}
                                className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff]"
                              />
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-slate-800 dark:text-slate-400">
                              {(currentPage - 1) * PAGE_SIZE + index + 1}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-300 dark:ring-slate-700">
                                   {product.gambar_url && !product.gambar_url.startsWith('data:image/') ? (
                                     <NetworkAwareImage src={product.gambar_url} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-500">
                                       <Icon name="inventory_2" className="text-lg" />
                                     </div>
                                   )}
                                 </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-200 block line-clamp-2 group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors">{product.nama}</span>
                                    <Icon
                                      name="arrow_forward"
                                      className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                    />
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-500 uppercase tracking-wider">{product.sku || '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-400">{product.kategori_nama}</span>
                            </td>
                            <td className="px-4 py-4 text-right text-slate-900 dark:text-slate-200 font-black whitespace-nowrap">
                              {product.harga_min !== product.harga_max ? (
                                `Rp ${formatCurrency(product.harga_min)} - Rp ${formatCurrency(product.harga_max)}`
                              ) : (
                                `Rp ${formatCurrency(product.harga)}`
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${(product.stok ?? 0) === 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' :
                                (product.stok ?? 0) <= (product.batas_stok_rendah ?? 5) ? 'bg-yellow-50 dark:bg-amber-500/10 text-yellow-600 dark:text-amber-400 border border-yellow-200 dark:border-amber-500/20' :
                                  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                              }`}>
                                {product.stok ?? 0} {product.satuan_dasar}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-400">
                                {product.terjual || 0}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Desktop Pagination */}
                {(hasNext || hasPrev) && (
                  <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-end bg-white dark:bg-slate-900 transition-all">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!hasPrev}
                        className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                        aria-label="Halaman Sebelumnya"
                      >
                        <Icon name="chevron_left" className="text-xl" />
                        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Sebelumnya</span>
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={!hasNext}
                        className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                        aria-label="Halaman Berikutnya"
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Berikutnya</span>
                        <Icon name="chevron_right" className="text-xl" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-3">
                {filteredProducts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner group/icon mx-auto">
                      <Icon name={search || kategori ? "search_off" : "inventory_2"} className="text-4xl text-slate-400 dark:text-slate-650 transition-transform group-hover/icon:rotate-12" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight mx-auto">
                      {search ? 'TIDAK DITEMUKAN' : 'KOSONG'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto italic leading-relaxed text-center whitespace-normal">
                      {search
                        ? `Hasil cari "${search}" nihil`
                        : kategori
                          ? `Kategori yang dipilih masih kosong`
                          : 'Belum ada produk terdaftar untuk dijual'}
                    </p>

                    {(search || kategori) ? (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => {
                            setSearch('');
                            setKategori('');
                          }}
                          className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <Icon name="refresh" className="text-sm" />
                          Reset Semua
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={() => navigate('/barang/create')}
                          className="px-6 py-2.5 bg-[#006eff] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#0056c7] transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                          <Icon name="add" className="text-lg" />
                          Tambah
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Bulk Actions header for Mobile */}
                    {isSelectionMode && (
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 animate-fade-in">
                        <div className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={selected.length === paginatedProducts.length && paginatedProducts.length > 0}
                            onChange={toggleSelectAll}
                            id="mobile-select-all"
                            className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                          />
                          <label htmlFor="mobile-select-all" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                            Pilih Semua ({paginatedProducts.length} Produk)
                          </label>
                        </div>
                        {selected.length > 0 && (
                          <button
                            onClick={handleBulkDelete}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 active:scale-[0.98]"
                          >
                            <Icon name="delete" className="text-[20px]" />
                            <span className="text-xs font-bold uppercase tracking-wider">Hapus Produk Terpilih ({selected.length})</span>
                          </button>
                        )}
                      </div>
                    )}

                    {paginatedProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleCardClick(product)}
                        className={`group bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-colors shadow-sm flex flex-col gap-3 cursor-pointer select-none ${selected.includes(product.id) ? 'border-[#006eff] dark:border-blue-500' : 'border-slate-200 dark:border-slate-800'}`}
                        title={isSelectionMode ? "Klik untuk memilih produk" : "Klik untuk melihat detail"}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex gap-3 flex-1 min-w-0 items-center">
                            {isSelectionMode && (
                              <input
                                type="checkbox"
                                checked={selected.includes(product.id)}
                                onChange={() => toggleSelect(product.id)}
                                className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                             <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-850 overflow-hidden shrink-0 ring-1 ring-slate-300 dark:ring-slate-800">
                               {product.gambar_url && !product.gambar_url.startsWith('data:image/') ? (
                                 <NetworkAwareImage src={product.gambar_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-500">
                                   <Icon name="inventory_2" className="text-2xl" />
                                 </div>
                               )}
                             </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`font-bold text-slate-900 dark:text-slate-100 line-clamp-2 transition-colors ${!isSelectionMode ? 'group-hover:text-[#006eff] dark:group-hover:text-blue-400' : ''}`}>{product.nama}</p>
                                {!isSelectionMode && (
                                  <Icon
                                    name="arrow_forward"
                                    className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                  />
                                )}
                              </div>
                              <p className="text-xs text-slate-800 dark:text-slate-400 mb-2">{product.sku || 'No SKU'}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-800 dark:text-slate-400 uppercase">
                                  {product.kategori_nama}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${(product.stok ?? 0) === 0 ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' :
                                  (product.stok ?? 0) <= (product.batas_stok_rendah ?? 5) ? 'bg-yellow-50 dark:bg-amber-500/10 text-yellow-600 dark:text-amber-400 border-yellow-200 dark:border-amber-500/20' :
                                    'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                }`}>
                                  {product.stok ?? 0} {product.satuan_dasar}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!isSelectionMode && (
                            <div className="text-slate-400 dark:text-slate-650 shrink-0">
                              <Icon name="chevron_right" className="text-2xl" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                          <div>
                            <p className="text-xs text-slate-800 dark:text-slate-400 font-medium">Harga Jual</p>
                            <p className="font-bold text-[#006eff] dark:text-blue-400 text-sm">
                              {product.harga_min !== product.harga_max ? (
                                `Rp ${formatCurrency(product.harga_min)} - Rp ${formatCurrency(product.harga_max)}`
                              ) : (
                                `Rp ${formatCurrency(product.harga)}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Mobile Pagination */}
                    {(hasNext || hasPrev) && (
                      <div className="flex items-center gap-4 mt-6 pt-4 justify-center md:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!hasPrev}
                          className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98]"
                          aria-label="Halaman Sebelumnya"
                        >
                          <Icon name="chevron_left" className="text-xl" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Sebelumnya</span>
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={!hasNext}
                          className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98]"
                          aria-label="Halaman Berikutnya"
                        >
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Berikutnya</span>
                          <Icon name="chevron_right" className="text-xl" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showImportModal && <ImportExcelModal onClose={() => setShowImportModal(false)} />}
    </AppLayout>
  );
}
