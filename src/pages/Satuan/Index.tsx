import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import Skeleton, { StatCardSkeleton, CardSkeleton } from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useUnitStore } from '@/store/unitStore';
import { useProductStore } from '@/store/productStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

interface Satuan {
  id: string;
  nama_satuan: string;
  keterangan: string;
  batas_stok_rendah: number;
  is_dasar: boolean;
  product_count?: number;
}

export default function SatuanIndex() {
  const navigate = useNavigate();
  const { confirmDanger } = useAlert();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('nama_satuan');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDasar, setIsDasar] = useState<string | number>('all');

  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const units = useUnitStore((s) => s.units);
  const fetchUnits = useUnitStore((s) => s.fetchUnits);
  const products = useProductStore((s) => s.products);
  const bulkDelete = useUnitStore((s) => s.bulkDelete);

  useEffect(() => {
    setIsLoading(true);
    fetchUnits().finally(() => setIsLoading(false));
  }, [fetchUnits]);

  const SatuanSkeleton = () => {
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
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Satuan</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Produk</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Batas Stok</th>
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
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-14 h-4 rounded" />
                          </div>
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
                        <Skeleton className="w-8 h-4" />
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
                    <div className="flex items-center justify-between gap-2 w-full">
                      <Skeleton className="w-24 h-4" />
                      <Skeleton className="w-14 h-4 rounded" />
                    </div>
                    <Skeleton className="w-32 h-3" />
                  </div>
                </div>
                <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              </div>
              <Skeleton className="h-4 w-5/6 rounded border-l-2 border-slate-200 dark:border-slate-800 pl-3" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Dynamic product count for units
  const getProductCountForUnit = (unitName: string) => {
    return products.filter(
      (p) =>
        p.satuan_dasar.toLowerCase() === unitName.toLowerCase() ||
        p.satuans.some((su) => su.nama.toLowerCase() === unitName.toLowerCase())
    ).length;
  };

  const enrichedUnits = units.map((u) => ({
    ...u,
    product_count: getProductCountForUnit(u.nama_satuan),
  }));

  // Stats calculation
  const totalSatuans = units.length;
  const dasarSatuans = units.filter((u) => u.is_dasar).length;
  const usedSatuans = enrichedUnits.filter((u) => (u.product_count ?? 0) > 0).length;
  const unusedSatuans = enrichedUnits.filter((u) => (u.product_count ?? 0) === 0).length;

  // Filtering
  const filtered = enrichedUnits.filter((u) => {
    const matchesSearch = !search
      ? true
      : u.nama_satuan.toLowerCase().includes(search.toLowerCase()) ||
        (u.keterangan || '').toLowerCase().includes(search.toLowerCase());

    let matchesDasar = true;
    if (isDasar === '1') matchesDasar = u.is_dasar;
    else if (isDasar === '0') matchesDasar = !u.is_dasar;

    return matchesSearch && matchesDasar;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortBy as keyof typeof a];
    let valB: any = b[sortBy as keyof typeof b];

    if (sortBy === 'satuan_barangs_count') {
      valA = a.product_count ?? 0;
      valB = b.product_count ?? 0;
    }

    if (valA === undefined) return 1;
    if (valB === undefined) return -1;

    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (typeof valA === 'boolean') {
      const numA = valA ? 1 : 0;
      const numB = valB ? 1 : 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    } else {
      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  const deletableSatuansCount = sorted.filter((s) => (s.product_count ?? 0) === 0).length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const deletableSatuans = sorted.filter((s) => (s.product_count ?? 0) === 0);
    const allDeletableSelected =
      deletableSatuans.length > 0 && deletableSatuans.every((s) => selected.includes(s.id));

    if (allDeletableSelected) {
      setSelected([]);
    } else {
      setSelected(deletableSatuans.map((s) => s.id));
    }
  };

  const handleCardClick = (satuan: Satuan) => {
    if (isSelectionMode) {
      if ((satuan.product_count ?? 0) === 0) {
        toggleSelect(satuan.id);
      }
    } else {
      navigate(`/satuan/${satuan.id}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirmDanger(
      `Yakin ingin menghapus ${selected.length} satuan?`,
      'Hapus Banyak Satuan',
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
      toast.success(`${selected.length} satuan berhasil dihapus`);
    } catch (err) {
      toast.error('Gagal menghapus satuan');
    } finally {
      setProcessing(false);
    }
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
      title="Kelola Satuan (Unit)"
      searchConfig={{
        placeholder: 'Cari satuan...',
        value: search,
        onSearch: setSearch,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Kelola Satuan
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Atur dimensi/satuan produk toko Anda
            </p>
          </div>
          <button
            onClick={() => navigate('/satuan/create')}
            className="flex items-center gap-2 rounded-xl bg-[#006eff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all"
          >
            <Icon name="add_circle" className="text-[20px]" />
            <span>Tambah Satuan</span>
          </button>
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
                icon="straighten"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={totalSatuans}
                label="Total Satuan"
              />
              <StatCard
                icon="check_circle"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={dasarSatuans}
                label="Satuan Dasar"
              />
              <StatCard
                icon="inventory_2"
                iconBg="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                value={usedSatuans}
                label="Terpakai"
              />
              <StatCard
                icon="label_off"
                iconBg="bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                value={unusedSatuans}
                label="Tidak Terpakai"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none p-4 transition-all">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {/* Sort Filter */}
              <label htmlFor="sort-filter" className="sr-only">
                Urutkan
              </label>
              <CustomSelect
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="flex-1 min-w-0 max-w-xs"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={[
                  { value: 'nama_satuan-asc', label: 'Nama (A-Z)' },
                  { value: 'nama_satuan-desc', label: 'Nama (Z-A)' },
                  { value: 'satuan_barangs_count-desc', label: 'Terkait Terbanyak' },
                  { value: 'satuan_barangs_count-asc', label: 'Terkait Sedikit' },
                ]}
              />

              {/* Tipe Satuan Filter */}
              <label htmlFor="tipe-filter" className="sr-only">
                Jenis Satuan
              </label>
              <CustomSelect
                value={isDasar}
                onChange={(e) => setIsDasar(e.target.value)}
                className="flex-1 min-w-0 max-w-xs"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={[
                  { value: 'all', label: 'Semua Jenis Satuan' },
                  { value: '1', label: 'Satuan Dasar' },
                  { value: '0', label: 'Bukan Satuan Dasar' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Desktop Selection Action */}
        {selected.length > 0 && (
          <div className="hidden md:block mb-4 animate-fade-in">
            <div className="flex justify-end">
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 group/delete active:scale-[0.98]"
              >
                <Icon
                  name="delete"
                  className="text-[20px] group-hover/delete:scale-110 transition-transform"
                />
                <span className="text-sm font-bold uppercase tracking-tight">Hapus ({selected.length})</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <SatuanSkeleton />
        ) : (
          <>
            {/* Table - Desktop View */}
            <div className="hidden md:block">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-5 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selected.length === deletableSatuansCount && deletableSatuansCount > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                        aria-label="Pilih semua baris"
                      />
                    </th>
                    <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Satuan
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Produk
                    </th>
                    <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Batas Stok
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-24 text-center bg-white dark:bg-slate-950">
                        <div className="flex flex-col items-center justify-center animate-fade-in text-center w-full">
                          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner group/icon mx-auto">
                            <Icon
                              name={search ? 'manage_search' : 'straighten'}
                              className="text-5xl text-slate-400 dark:text-slate-700 transition-transform group-hover/icon:rotate-12"
                            />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                            {search ? 'Satuan Tidak Ditemukan' : 'Belum Ada Satuan'}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                            {search
                              ? `Maaf, kami tidak dapat menemukan satuan dengan kata kunci "${search}".`
                              : 'Mulai dengan membuat satuan baru (misal Pcs, Box, Lusin) untuk mengelompokkan produk Anda.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sorted.map((satuan) => (
                      <tr
                        key={satuan.id}
                        onClick={() => navigate(`/satuan/${satuan.id}`)}
                        title={selected.length > 0 ? 'Klik untuk memilih satuan' : 'Klik untuk melihat detail satuan'}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 text-left" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={(satuan.product_count ?? 0) > 0}
                            checked={selected.includes(satuan.id)}
                            onChange={() => toggleSelect(satuan.id)}
                            className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Icon name="straighten" className="text-lg text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 dark:text-slate-200 block truncate group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors">
                                    {satuan.nama_satuan}
                                  </span>
                                  <Icon
                                    name="arrow_forward"
                                    className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                  />
                                </div>
                                {satuan.is_dasar ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                                    Dasar
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shrink-0">
                                    Konversi
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                                ID: {satuan.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-500/20">
                            {satuan.product_count} Produk
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`text-sm font-bold ${
                              satuan.is_dasar ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-650'
                            }`}
                          >
                            {satuan.is_dasar ? satuan.batas_stok_rendah ?? 5 : '-'}
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

        {/* Cards - Mobile View */}
        <div className="md:hidden">
          {/* Mobile Selection Toggle Button */}
          <div className="flex justify-end px-2 mb-4 animate-fade-in">
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

          {sorted.length > 0 && isSelectionMode && (
            <div className="flex flex-col gap-3 px-2 mb-3 animate-fade-in">
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selected.length === deletableSatuansCount && deletableSatuansCount > 0}
                  onChange={toggleSelectAll}
                  id="mobile-select-all"
                  className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                />
                <label
                  htmlFor="mobile-select-all"
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none"
                >
                  Pilih Semua ({deletableSatuansCount} Satuan)
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
                    Hapus Satuan Terpilih ({selected.length})
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {sorted.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center animate-fade-in text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner group/icon mx-auto">
                  <Icon
                    name={search ? 'manage_search' : 'straighten'}
                    className="text-4xl text-slate-400 dark:text-slate-600 transition-transform group-hover/icon:rotate-12"
                  />
                </div>
                <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight mx-auto">
                  {search ? 'TIDAK DITEMUKAN' : 'KOSONG'}
                </h3>
              </div>
            ) : (
              sorted.map((satuan) => (
                <div
                  key={satuan.id}
                  onClick={() => handleCardClick(satuan)}
                  title={
                    isSelectionMode
                      ? (satuan.product_count ?? 0) > 0
                        ? 'Satuan tidak bisa dihapus'
                        : 'Klik untuk memilih satuan'
                      : 'Klik untuk melihat detail'
                  }
                  className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden group select-none ${
                    selected.includes(satuan.id)
                      ? 'border-[#006eff] dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800'
                  } ${isSelectionMode && (satuan.product_count ?? 0) > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex gap-3 items-center justify-between">
                    <div className="flex gap-3 flex-1 min-w-0 items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Icon name="straighten" className="text-2xl text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <p
                              className={`font-bold text-slate-900 dark:text-slate-100 truncate transition-colors ${
                                !isSelectionMode ? 'group-hover:text-[#006eff] dark:group-hover:text-blue-400' : ''
                              }`}
                            >
                              {satuan.nama_satuan}
                            </p>
                          </div>
                          {satuan.is_dasar ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                              Dasar
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 shrink-0">
                              Konversi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          {satuan.product_count} Produk
                          {satuan.is_dasar && ` • Batas: ${satuan.batas_stok_rendah ?? 5}`}
                        </p>
                      </div>
                    </div>
                    {!isSelectionMode && <Icon name="chevron_right" className="text-slate-400 shrink-0" />}
                  </div>

                  {satuan.keterangan && (
                    <p className="text-sm text-slate-700 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                      {satuan.keterangan}
                    </p>
                  )}
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
