import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import Skeleton, { StatCardSkeleton, CardSkeleton } from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { formatIDR } from '@/lib/idr';

export default function RiwayatTransaksi() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const transactions = useTransactionStore((s) => s.transactions);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const cursorNext = useTransactionStore((s) => s.cursorNext);
  const cursorPrev = useTransactionStore((s) => s.cursorPrev);
  const hasMore = useTransactionStore((s) => s.hasMore);
  const getStats = useTransactionStore((s) => s.getStats);
  const getKasirList = useTransactionStore((s) => s.getKasirList);
  const bulkDelete = useTransactionStore((s) => s.bulkDelete);
  const [isLoading, setIsLoading] = useState(true);
  const currentFilters = useRef<Record<string, string>>({});

  const loadPage = (cursor?: string) => {
    setIsLoading(true);
    const params = cursor ? { ...currentFilters.current, cursor } : { ...currentFilters.current };
    fetchTransactions(params).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    currentFilters.current = {};
    loadPage();
  }, []);

  const RiwayatSkeleton = () => {
    return (
      <div className="space-y-6">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-left w-12">
                    <Skeleton className="w-4 h-4 rounded" />
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">No. Invoice</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Tanggal</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Kasir</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Metode</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-right text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Total / Sisa Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`table-skele-${i}`}>
                    <td className="px-6 py-4">
                      <Skeleton className="w-4 h-4 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-20 h-3" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-28 h-4" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-20 h-4" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-16 h-5 rounded-lg" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-20 h-5 rounded-lg" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-32 h-4" />
                  </div>
                  <Skeleton className="w-48 h-3" />
                </div>
                <Skeleton className="w-6 h-6 rounded shrink-0" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                <div className="space-y-1.5">
                  <Skeleton className="w-24 h-4" />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="w-20 h-5 rounded-lg" />
                  <Skeleton className="w-16 h-5 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const { confirmDanger } = useAlert();
  const toast = useToast();

  const [search, setSearch] = useState(() => sessionStorage.getItem('riwayat_search') || '');
  const debouncedSearch = useDebounce(search, 300);

  const [startDate, setStartDate] = useState(() => sessionStorage.getItem('riwayat_start_date') || '');
  const [endDate, setEndDate] = useState(() => sessionStorage.getItem('riwayat_end_date') || '');
  const [status, setStatus] = useState(() => sessionStorage.getItem('riwayat_status') || 'Semua');
  const [kasirId, setKasirId] = useState(() => sessionStorage.getItem('riwayat_kasir_id') || '');

  const [selected, setSelected] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [minHeight, setMinHeight] = useState('');

  const listRef = useRef<HTMLDivElement>(null);

  const buildParams = () => ({
    ...(debouncedSearch && { q: debouncedSearch }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate }),
    ...(status !== 'Semua' && { status }),
    ...(kasirId && { kasir_id: kasirId }),
  });

  // Fetch on filter change (debounced search triggers via debounce)
  useEffect(() => {
    fetchTransactions(buildParams());
  }, [debouncedSearch, startDate, endDate, status, kasirId]);

  const stats = getStats();
  const kasirs = getKasirList();

  // Sync filter state with sessionStorage
  useEffect(() => { sessionStorage.setItem('riwayat_search', search); }, [search]);
  useEffect(() => { sessionStorage.setItem('riwayat_start_date', startDate); }, [startDate]);
  useEffect(() => { sessionStorage.setItem('riwayat_end_date', endDate); }, [endDate]);
  useEffect(() => { sessionStorage.setItem('riwayat_status', status); }, [status]);
  useEffect(() => { sessionStorage.setItem('riwayat_kasir_id', kasirId); }, [kasirId]);

  const pendingTransactions = transactions.filter((t) => t.status.toLowerCase() === 'pending');
  const allPendingSelected = pendingTransactions.length > 0 && pendingTransactions.every((t) => selected.includes(t.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const pendingIds = pendingTransactions.map((t) => t.id);
    setSelected(allPendingSelected ? [] : pendingIds);
  };

  const resetFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setStatus('Semua');
    setKasirId('');
    setSelected([]);
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirmDanger('Hapus Banyak Transaksi', `Yakin ingin menghapus ${selected.length} transaksi Pending ini? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;
    setProcessing(true);
    try {
      bulkDelete(selected);
      setSelected([]);
      setIsSelectionMode(false);
      toast.success(`${selected.length} transaksi pending berhasil dihapus.`);
    } catch (err) {
      toast.error('Gagal menghapus transaksi.');
    } finally { setProcessing(false); }
  };

  const goToDetail = (id: string) => {
    navigate(`/kasir/riwayat/${id}`);
  };

  const goPrevPage = () => {
    if (cursorPrev) fetchTransactions({ ...buildParams(), cursor: cursorPrev });
  };

  const goNextPage = () => {
    if (cursorNext) fetchTransactions({ ...buildParams(), cursor: cursorNext });
  };

  const statusOptions = [
    { value: 'Semua', label: 'Semua Status', icon: 'list', count: stats.total },
    { value: 'Selesai', label: 'Selesai', icon: 'check_circle', count: stats.sukses },
    { value: 'Pending', label: 'Belum Dibayar', icon: 'pending', count: stats.pending },
  ];

  const cashierOptions = [
    { value: '', label: 'Semua Kasir' },
    ...kasirs.map((k) => ({ value: k.id, label: k.name })),
  ];

  return (
    <AppLayout
      title="Riwayat Transaksi"
      searchConfig={{
        placeholder: 'Cari no. invoice...',
        value: search,
        onSearch: setSearch,
      }}
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Riwayat Transaksi
            </h2>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">
              Lihat semua transaksi yang telah dilakukan
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[70px]">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-center">
                Total
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-8 mx-auto mt-1" />
              ) : (
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 text-center">
                  {stats.total}
                </p>
              )}
            </div>
            <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[70px]">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-center">
                Hari Ini
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-8 mx-auto mt-1" />
              ) : (
                <p className="text-base sm:text-lg font-black text-[#006eff] dark:text-blue-400 text-center">
                  {stats.todayCount}
                </p>
              )}
            </div>
            <div className="px-3 sm:px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm min-w-[120px]">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-center">
                Total Menunggak
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-20 mx-auto mt-1" />
              ) : (
                <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 text-center">
                  {formatIDR(stats.totalMenunggak)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-4">
            {/* Status Filter */}
            <div className="flex-1 min-w-[200px] relative">
              <CustomSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Semua Status"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={statusOptions}
              />
            </div>

            {/* Cashier Filter */}
            <div className="flex-1 min-w-[200px] relative">
              <CustomSelect
                value={kasirId}
                onChange={(e) => setKasirId(e.target.value)}
                placeholder="Semua Kasir"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={cashierOptions}
              />
            </div>

            {/* Date From */}
            <div className="flex-1 min-w-[170px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus-within:ring-1 focus-within:ring-[#006eff] focus-within:border-[#006eff]">
              <div className="flex items-center gap-2 pl-3.5 pr-2 py-2.5">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                  Dari
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent border-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="flex-1 min-w-[170px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus-within:ring-1 focus-within:ring-[#006eff] focus-within:border-[#006eff]">
              <div className="flex items-center gap-2 pl-3.5 pr-2 py-2.5">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                  Sampai
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent border-0 p-0 text-slate-900 dark:text-slate-100 text-sm font-black focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

              {(search || startDate || endDate || kasirId || status !== 'Semua') && (
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="close" className="text-sm" />
                Reset
              </button>
            )}

            {/* Desktop Bulk Delete */}
            {selected.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all shrink-0 active:scale-[0.98]"
              >
                <Icon name="delete" className="text-sm" />
                <span className="text-sm font-bold uppercase tracking-tight">Hapus {selected.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Selection Toggle */}
        {pendingTransactions.length > 0 && (
          <div className="md:hidden flex justify-end px-2 mt-3">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelected([]);
              }}
              className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all shadow-sm"
            >
              <Icon name={isSelectionMode ? 'close' : 'check'} className="text-[20px]" />
              <span>{isSelectionMode ? 'Batal' : 'Pilih'}</span>
            </button>
          </div>
        )}

        {/* List Section */}
        <div ref={listRef} style={minHeight ? { minHeight } : undefined} className="space-y-3">
          {isLoading ? (
            <RiwayatSkeleton />
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 sm:p-24 text-center transition-all shadow-sm flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center text-center w-full">
                <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-700 shadow-inner mx-auto group">
                  <Icon
                    name={search || startDate || endDate || status !== 'Semua' ? 'search_off' : 'receipt_long'}
                    className="text-5xl text-slate-400 dark:text-slate-650 group-hover:rotate-12 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                  {search || startDate || endDate || status !== 'Semua' ? 'Transaksi Tidak Ditemukan' : 'Belum Ada Transaksi'}
                </h3>
                <p className="text-slate-500 dark:text-slate-450 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                  {search || startDate || endDate || status !== 'Semua'
                    ? `Maaf, kami tidak dapat menemukan transaksi dengan filter atau kata kunci "${search || 'tertentu'}".`
                    : 'Semua transaksi yang Anda buat akan muncul di sini secara otomatis. Mulai transaksi pertama Anda sekarang!'}
                </p>
                {(search || startDate || endDate || status !== 'Semua') && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={resetFilters}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <Icon name="refresh" className="text-sm" />
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-5 text-left w-12">
                          {pendingTransactions.length > 0 && (
                            <input
                              type="checkbox"
                              checked={allPendingSelected}
                              onChange={toggleSelectAll}
                              aria-label="Pilih semua transaksi pending"
                              className="size-4 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#006eff] focus:ring-0 transition-all cursor-pointer"
                            />
                          )}
                        </th>
                        <th className="px-6 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">No. Invoice</th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Tanggal</th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Kasir</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Metode</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                        <th className="px-6 py-5 text-right text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-[0.2em]">Total / Sisa Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                      {transactions.map((trx) => {
                        const isPending = trx.status.toLowerCase() === 'pending';
                        const isSelected = selected.includes(trx.id);
                        return (
                          <tr
                            key={trx.id}
                            onClick={() => {
                              if (isPending && selected.length > 0) {
                                toggleSelect(trx.id);
                              } else {
                                goToDetail(trx.id);
                              }
                            }}
                            className={`group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-red-50/40 dark:bg-red-500/5' : ''
                            }`}
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              {isPending ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(trx.id)}
                                  aria-label={`Pilih ${trx.no_invoice}`}
                                  className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                                />
                              ) : (
                                <span className="w-4 h-4 block" />
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 dark:text-slate-200 block truncate group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm">
                                    {trx.no_invoice}
                                  </span>
                                  <Icon
                                    name="arrow_forward"
                                    className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                  />
                                </div>
                                {trx.catatan && (
                                  <span className="text-[10px] text-amber-600 font-medium truncate max-w-[200px] block mt-0.5" title={trx.catatan}>
                                    {trx.catatan}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                              {new Date(trx.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                              {trx.kasir}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-450 text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                                {trx.metode_pembayaran}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest border transition-colors ${
                                  trx.status.toLowerCase() === 'selesai'
                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-200 dark:border-amber-500/20'
                                }`}
                              >
                                {isPending ? 'Belum Dibayar' : trx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                {isPending && trx.total_bayar > 0 && (
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sisa Tagihan</span>
                                )}
                                <span className="text-sm font-black text-[#006eff] dark:text-blue-400 whitespace-nowrap">
                                  {formatIDR(isPending ? Math.max(0, trx.total_harga - trx.total_bayar) : trx.total_harga)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Desktop Pagination */}
                {(cursorPrev || hasMore) && (
                  <div className="flex items-center justify-end px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goPrevPage}
                        disabled={!cursorPrev}
                        className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                      >
                        <Icon name="chevron_left" className="text-xl" />
                        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Sebelumnya</span>
                      </button>
                      <button
                        onClick={goNextPage}
                        disabled={!hasMore}
                        className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Berikutnya</span>
                        <Icon name="chevron_right" className="text-xl" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile View - Cards */}
              {isSelectionMode && pendingTransactions.length > 0 && (
                <div className="md:hidden flex flex-col gap-3 px-2 mb-3">
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={toggleSelectAll}
                      id="mobile-select-all-trx"
                      className="w-4.5 h-4.5 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                    />
                    <label htmlFor="mobile-select-all-trx" className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                      Pilih Semua ({pendingTransactions.length} Pending)
                    </label>
                  </div>
                  {selected.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={processing}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98]"
                    >
                      <Icon name="delete" className="text-[20px]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Hapus Terpilih ({selected.length})</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:hidden">
                {transactions.map((trx) => {
                  const isPending = trx.status.toLowerCase() === 'pending';
                  const isSelected = selected.includes(trx.id);
                  return (
                    <div
                      key={trx.id}
                      onClick={() => {
                        if (isSelectionMode && isPending) {
                          toggleSelect(trx.id);
                        } else if (!isSelectionMode) {
                          goToDetail(trx.id);
                        }
                      }}
                      className={`group bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-colors shadow-sm flex flex-col gap-3 cursor-pointer select-none ${
                        isSelected
                          ? 'border-red-300 dark:border-red-500/40 bg-red-50/40 dark:bg-red-500/5'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {isSelectionMode && isPending && (
                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(trx.id)}
                              className="w-4 h-4 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff] cursor-pointer"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 transition-colors group-hover:text-[#006eff] dark:group-hover:text-blue-400 uppercase tracking-tight text-sm">
                              {trx.no_invoice}
                            </p>
                            {!isSelectionMode && (
                              <Icon
                                name="arrow_forward"
                                className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                              />
                            )}
                          </div>
                          <p className="text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2 flex-wrap mt-1">
                            <span>
                              {new Date(trx.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>{trx.kasir}</span>
                          </p>
                          {trx.catatan && (
                            <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                              <Icon name="notes" className="text-xs" />
                              <span className="truncate max-w-[180px]">{trx.catatan}</span>
                            </p>
                          )}
                        </div>
                        {!isSelectionMode && (
                          <div className="text-slate-400 dark:text-slate-600 shrink-0">
                            <Icon name="chevron_right" className="text-2xl" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                        <div>
                          {isPending && trx.total_bayar > 0 && (
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sisa Tagihan</p>
                          )}
                          <p className="font-bold text-[#006eff] dark:text-blue-400 text-base">
                            {formatIDR(isPending ? Math.max(0, trx.total_harga - trx.total_bayar) : trx.total_harga)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border whitespace-nowrap transition-colors ${
                              trx.status.toLowerCase() === 'selesai'
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            }`}
                          >
                            {isPending ? 'Belum Bayar' : trx.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                            {trx.metode_pembayaran}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Pagination */}
              {(cursorPrev || hasMore) && (
                <div className="flex items-center gap-4 mt-6 pt-4 justify-center md:hidden">
                  <button
                    onClick={goPrevPage}
                    disabled={!cursorPrev}
                    className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Icon name="chevron_left" className="text-xl" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Sebelumnya</span>
                  </button>
                  <button
                    onClick={goNextPage}
                    disabled={!hasMore}
                    className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Berikutnya</span>
                    <Icon name="chevron_right" className="text-xl" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}