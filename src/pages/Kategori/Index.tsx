import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import Skeleton, { StatCardSkeleton, CardSkeleton } from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useCategoryStore } from '@/store/categoryStore';
import { useProductStore } from '@/store/productStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

interface Kategori {
  id: string;
  nama: string;
  deskripsi: string;
  warna: string;
  product_count: number;
  created_at: string;
}

export default function KategoriIndex() {
  const navigate = useNavigate();
  const { confirmDanger } = useAlert();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const products = useProductStore((s) => s.products);
  const bulkDelete = useCategoryStore((s) => s.bulkDelete);

  useEffect(() => {
    setIsLoading(true);
    fetchCategories().finally(() => setIsLoading(false));
  }, [fetchCategories]);

  const KategoriSkeleton = () => {
    return (
      <div className="space-y-6">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-left w-12">
                    <Skeleton className="w-4 h-4 rounded" />
                  </th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Kategori</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Produk</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`table-skele-${i}`}>
                    <td className="px-6 py-4">
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-20 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-20 h-6 rounded-md" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-24 h-4" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`card-skele-${i}`} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex gap-3 items-center justify-between">
                <div className="flex gap-3 flex-1 min-w-0 items-center">
                  <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-1/3 h-3" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-4 w-5/6 rounded border-l-2 border-slate-200 dark:border-slate-800 pl-3" />
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Dynamic product counts and stats
  const getProductCount = (catId: string) => {
    return products.filter((p) => p.kategori_id === catId).length;
  };

  const enrichedCategories = categories.map((c) => ({
    ...c,
    product_count: getProductCount(c.id),
  }));

  const totalCategories = categories.length;
  const totalProducts = products.length;
  const categoriesWithProducts = enrichedCategories.filter((c) => c.product_count > 0).length;
  const uncategorizedProducts = products.filter((p) => !categories.some((c) => c.id === p.kategori_id)).length;

  const filtered = enrichedCategories.filter((c) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return c.nama.toLowerCase().includes(q) || c.deskripsi.toLowerCase().includes(q);
  });

  const deletableKategorisCount = filtered.filter((k) => k.product_count === 0).length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const deletableKategoris = filtered.filter((k) => k.product_count === 0);
    const allDeletableSelected =
      deletableKategoris.length > 0 && deletableKategoris.every((k) => selected.includes(k.id));

    if (allDeletableSelected) {
      setSelected([]);
    } else {
      setSelected(deletableKategoris.map((k) => k.id));
    }
  };

  const handleCardClick = (kategori: Kategori) => {
    if (isSelectionMode) {
      if (kategori.product_count === 0) {
        toggleSelect(kategori.id);
      }
    } else {
      navigate(`/kategori/${kategori.id}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirmDanger(
      `Yakin ingin menghapus ${selected.length} kategori?`,
      'Hapus Banyak Kategori',
      {
        confirmText: 'Ya, Hapus Semua',
        cancelText: 'Batal',
      }
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      await bulkDelete(selected);
      setSelected([]);
      setIsSelectionMode(false);
      toast.success(`${selected.length} kategori berhasil dihapus`);
    } catch (err) {
      toast.error('Gagal menghapus kategori');
    } finally {
      setProcessing(false);
    }
  };

  // Convert hex to rgba safely
  const hexToRgba = (hex: string | undefined, alpha: number) => {
    const safeHex = hex?.startsWith('#') ? hex : '#006eff';
    const r = parseInt(safeHex.slice(1, 3), 16) || 0;
    const g = parseInt(safeHex.slice(3, 5), 16) || 0;
    const b = parseInt(safeHex.slice(5, 7), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // Get readable text color
  const getTextColorForBg = (hex: string | undefined): string => {
    const safeHex = hex?.startsWith('#') ? hex : '#006eff';
    const r = parseInt(safeHex.slice(1, 3), 16) || 0;
    const g = parseInt(safeHex.slice(3, 5), 16) || 0;
    const b = parseInt(safeHex.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#1e293b' : '#ffffff';
  };

  const StatCard = ({
    icon,
    iconBg,
    value,
    label,
  }: {
    icon: string;
    iconBg: string;
    value: string | number;
    label: string;
  }) => (
    <div className="w-full rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none transition-all hover:shadow-xl group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 text-left">
          <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] leading-none mb-2">
            {label}
          </p>
          <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 truncate">
            {value}
          </h3>
        </div>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}
        >
          <Icon name={icon} className="text-xl sm:text-2xl" />
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout
      title="Kelola Kategori"
      searchConfig={{
        placeholder: 'Cari kategori...',
        value: search,
        onSearch: setSearch,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Kelola Kategori
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Atur kategori produk toko Anda
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 group/delete active:scale-[0.98]"
              >
                <Icon
                  name="delete"
                  className="text-[20px] group-hover/delete:scale-110 transition-transform"
                />
                <span className="text-sm font-bold uppercase tracking-tight">
                  Hapus ({selected.length})
                </span>
              </button>
            )}
            <button
              onClick={() => navigate('/kategori/create')}
              className="flex items-center gap-2 rounded-xl bg-[#006eff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all"
            >
              <Icon name="add_circle" className="text-[20px]" />
              <span>Tambah Kategori</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon="category"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={totalCategories}
                label="Total Kategori"
              />
              <StatCard
                icon="inventory_2"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={totalProducts}
                label="Total Produk"
              />
              <StatCard
                icon="check_circle"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={categoriesWithProducts}
                label="Terpakai"
              />
              <StatCard
                icon="label_off"
                iconBg="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                value={uncategorizedProducts}
                label="Tanpa Kategori"
              />
            </>
          )}
        </div>

        {/* Mobile Selection Action */}
        <div className="md:hidden flex justify-end px-2">
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) {
                setSelected([]);
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all shadow-sm"
          >
            <Icon name={isSelectionMode ? 'close' : 'check'} className="text-[20px]" />
            <span>{isSelectionMode ? 'Batal' : 'Pilih'}</span>
          </button>
        </div>

        {isLoading ? (
          <KategoriSkeleton />
        ) : (
          <>
            {/* Categories Table - Desktop View */}
            <div className="hidden md:block">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selected.length === deletableKategorisCount && deletableKategorisCount > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                        aria-label="Pilih semua baris"
                      />
                    </th>
                    <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Kategori
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Produk
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Dibuat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-24 text-center bg-white dark:bg-slate-950">
                        <div className="flex flex-col items-center justify-center animate-fade-in text-center w-full">
                          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner group/icon mx-auto">
                            <Icon
                              name={search ? 'manage_search' : 'category'}
                              className="text-5xl text-slate-400 dark:text-slate-700 transition-transform group-hover/icon:rotate-12"
                            />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                            {search ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                            {search
                              ? `Maaf, kami tidak dapat menemukan kategori dengan kata kunci "${search}".`
                              : 'Mulai dengan membuat kategori baru untuk mengelompokkan produk Anda dengan lebih rapi.'}
                          </p>
                          {search ? (
                            <div className="flex justify-center mt-8">
                              <button
                                onClick={() => setSearch('')}
                                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                              >
                                <Icon name="refresh" className="text-sm" />
                                Reset Pencarian
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center mt-8">
                              <button
                                onClick={() => navigate('/kategori/create')}
                                className="px-8 py-3 bg-[#006eff] hover:bg-[#0056c7] text-white rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center gap-2"
                              >
                                <Icon name="add" className="text-lg" />
                                Tambah Kategori Baru
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((kategori) => (
                      <tr
                        key={kategori.id}
                        onClick={() => navigate(`/kategori/${kategori.id}`)}
                        title={selected.length > 0 ? 'Klik untuk memilih kategori' : 'Klik untuk melihat detail kategori'}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={kategori.product_count > 0}
                            checked={selected.includes(kategori.id)}
                            onChange={() => toggleSelect(kategori.id)}
                            className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 animate-fade-in"
                              style={{ backgroundColor: hexToRgba(kategori.warna, 0.12) }}
                            >
                              <span style={{ color: kategori.warna || '#006eff', fontVariationSettings: "'FILL' 1" }}>
                                <Icon name="category" className="text-lg" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-200 block truncate group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors">
                                  {kategori.nama}
                                </span>
                                <Icon
                                  name="arrow_forward"
                                  className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                                ID: {kategori.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-500/20">
                            {kategori.product_count} Produk
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-500 uppercase tracking-widest">
                            {kategori.created_at ? new Date(kategori.created_at).toLocaleDateString('id-ID') : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Categories Cards - Mobile View */}
        <div className="md:hidden">
          <div className="grid grid-cols-1 gap-4">
            {filtered.length > 0 && isSelectionMode && (
              <div className="flex flex-col gap-3 px-2 mb-3 animate-fade-in">
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selected.length === deletableKategorisCount && deletableKategorisCount > 0}
                    onChange={toggleSelectAll}
                    id="mobile-select-all"
                    className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                  />
                  <label
                    htmlFor="mobile-select-all"
                    className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none"
                  >
                    Pilih Semua ({deletableKategorisCount} Kategori)
                  </label>
                </div>
                {selected.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={processing}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 active:scale-[0.98]"
                  >
                    <Icon name="delete" className="text-[20px]" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Hapus Kategori Terpilih ({selected.length})
                    </span>
                  </button>
                )}
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center animate-fade-in text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner group/icon mx-auto">
                  <Icon
                    name={search ? 'manage_search' : 'category'}
                    className="text-4xl text-slate-400 dark:text-slate-600 transition-transform group-hover/icon:rotate-12"
                  />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight mx-auto">
                  {search ? 'TIDAK DITEMUKAN' : 'KOSONG'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto italic leading-relaxed text-center whitespace-normal">
                  {search ? `Kategori "${search}" tidak ditemukan` : 'Belum ada kategori terdaftar'}
                </p>
              </div>
            ) : (
              filtered.map((kategori) => (
                <div
                  key={kategori.id}
                  onClick={() => handleCardClick(kategori)}
                  title={
                    isSelectionMode
                      ? kategori.product_count > 0
                        ? 'Kategori tidak bisa dihapus'
                        : 'Klik untuk memilih kategori'
                      : 'Klik untuk melihat detail'
                  }
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden group select-none ${
                    selected.includes(kategori.id)
                      ? 'border-[#006eff] dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800'
                  } ${isSelectionMode && kategori.product_count > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex gap-3 items-center justify-between">
                    <div className="flex gap-3 flex-1 min-w-0 items-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: hexToRgba(kategori.warna, 0.12) }}
                      >
                        <span style={{ color: kategori.warna || '#006eff', fontVariationSettings: "'FILL' 1" }}>
                          <Icon name="category" className="text-2xl" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`font-bold text-slate-900 dark:text-slate-100 truncate transition-colors ${
                              !isSelectionMode ? 'group-hover:text-[#006eff] dark:group-hover:text-blue-400' : ''
                            }`}
                          >
                            {kategori.nama}
                          </p>
                          {!isSelectionMode && (
                            <Icon
                              name="arrow_forward"
                              className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                          {kategori.product_count} Produk
                        </p>
                      </div>
                    </div>
                    {!isSelectionMode && <Icon name="chevron_right" className="text-slate-400 shrink-0" />}
                  </div>

                  {kategori.deskripsi && (
                    <p className="text-sm text-slate-700 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                      {kategori.deskripsi}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                      {kategori.created_at ? new Date(kategori.created_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
