import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import TableSkeleton from '@/components/TableSkeleton';
import Skeleton from '@/components/Skeleton';
import OverflowMarquee from '@/components/OverflowMarquee';
import { useActivityLogStore } from '@/store/activityLogStore';

function LogCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-10 h-10 rounded-2xl" />
      </div>
    </div>
  );
}

export default function LogAktivitasIndex() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const getFilteredLogs = useActivityLogStore((s) => s.getFilteredLogs);

  // URL search params
  const qParam = searchParams.get('q') || '';
  const actionParam = searchParams.get('action') || 'all';
  const changedFieldParam = searchParams.get('changed_field') || 'all';
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';
  const sortParam = searchParams.get('sort') || 'desc';
  const cursorParam = searchParams.get('cursor') || null;

  // Local state
  const [search, setSearch] = useState(qParam);
  const [isLoading, setIsLoading] = useState(false);

  const LogAktivitasSkeleton = () => {
    return (
      <div className="space-y-6">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-nowrap">
            <table className="w-full">
              <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">Waktu</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">Pengguna</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">Aktivitas</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">Barang</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`table-skele-${i}`}>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-28 h-4" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-24 h-5 rounded-full animate-pulse" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="w-32 h-4" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        <Skeleton className="w-14 h-4 rounded-lg" />
                        <Skeleton className="w-16 h-4 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="flex flex-col gap-2 md:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <LogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  };

  // Synchronize search local state when URL changes (e.g. on reset)
  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== qParam) {
        applyFilters({ q: search });
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, qParam]);

  // Fetch filtered data
  const { logs, pagination } = getFilteredLogs(
    {
      q: qParam,
      action: actionParam,
      changed_field: changedFieldParam,
      date_from: dateFromParam,
      date_to: dateToParam,
      sort: sortParam,
    },
    cursorParam
  );

  // Trigger loading effect on parameter change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [qParam, actionParam, changedFieldParam, dateFromParam, dateToParam, sortParam, cursorParam]);

  // Options
  const actionOptions = [
    { value: 'all', label: 'Semua Aktivitas' },
    { value: 'create', label: 'Menambahkan' },
    { value: 'update', label: 'Mengedit' },
    { value: 'delete', label: 'Menghapus' },
  ];

  const sortOptions = [
    { value: 'desc', label: 'Terbaru' },
    { value: 'asc', label: 'Terlama' },
  ];

  const changedFieldOptions = [
    { value: 'all', label: 'Semua Perubahan' },
    { value: 'nama', label: 'Nama' },
    { value: 'stok', label: 'Stok' },
    { value: 'gambar_url', label: 'Gambar' },
    { value: 'harga_beli', label: 'Harga Beli' },
    { value: 'kategori_nama', label: 'Kategori' },
    { value: 'sku', label: 'SKU' },
    { value: 'deskripsi', label: 'Deskripsi' },
    { value: 'status', label: 'Status' },
    { value: 'satuan_dasar', label: 'Satuan' },
    { value: 'satuans', label: 'Multi-Satuan' },
  ];

  // Apply filters to URL search params
  const applyFilters = (newFilters: Record<string, any>) => {
    const nextParams = new URLSearchParams(searchParams);
    
    // Merge new filters
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === 'all' || val === '' || val === null || val === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    // Reset pagination when any filter changes, except cursor navigation itself
    if (!newFilters.hasOwnProperty('cursor')) {
      nextParams.delete('cursor');
    }

    setSearchParams(nextParams);
  };

  const handleActionChange = (value: string | number) => {
    const valStr = String(value);
    const updates: Record<string, any> = { action: valStr };
    if (valStr !== 'update') {
      updates.changed_field = 'all';
    }
    applyFilters(updates);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearch('');
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      create: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
      update: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      delete: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    };
    const icons: Record<string, string> = {
      create: "add_circle",
      update: "edit",
      delete: "delete",
    };
    return {
      style: styles[action] || "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      icon: icons[action] || "info",
    };
  };

  return (
    <AppLayout
      title="Log Aktivitas"
      searchConfig={{
        placeholder: 'Cari nama barang...',
        value: search,
        onSearch: setSearch,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Log Aktivitas</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Pantau semua perubahan data barang</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-all">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {/* Action Filter */}
              <label htmlFor="action-filter" className="sr-only">Aksi</label>
              <CustomSelect
                id="action-filter"
                value={actionParam}
                onChange={(e) => handleActionChange(e.target.value)}
                className="flex-1 min-w-0 max-w-xs"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={actionOptions}
              />

              {/* Sort Filter */}
              <label htmlFor="sort-filter" className="sr-only">Urutkan</label>
              <CustomSelect
                id="sort-filter"
                value={sortParam}
                onChange={(e) => applyFilters({ sort: e.target.value })}
                className="flex-1 min-w-0 max-w-xs"
                buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={sortOptions}
              />

              {/* Detail Filter (only for update) */}
              {actionParam === 'update' && (
                <>
                  <label htmlFor="changed-field-filter" className="sr-only">Perubahan</label>
                  <CustomSelect
                    id="changed-field-filter"
                    value={changedFieldParam}
                    onChange={(e) => applyFilters({ changed_field: e.target.value })}
                    className="flex-1 min-w-0 max-w-xs"
                    buttonClassName="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                    options={changedFieldOptions}
                  />
                </>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <span className="hidden sm:inline text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest shrink-0 ml-1">Tanggal:</span>

              {/* Mobile Header Row */}
              <div className="flex sm:hidden items-center justify-between ml-1 w-full">
                <span className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Filter Rentang Tanggal:</span>
                {(dateFromParam || dateToParam) && (
                  <button
                    onClick={() => applyFilters({ date_from: '', date_to: '' })}
                    className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all flex items-center gap-0.5 cursor-pointer shadow-sm"
                  >
                    <Icon name="close" className="text-[10px]" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                {/* Input Dari */}
                <div className="relative flex-1 flex flex-col gap-1 w-full">
                  <label className="block sm:hidden text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider pl-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateFromParam}
                    onChange={(e) => applyFilters({ date_from: e.target.value })}
                    className="w-full pl-4 pr-6 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none cursor-pointer transition-all"
                  />
                </div>

                <span className="hidden sm:inline text-slate-650 dark:text-slate-600 text-sm shrink-0 font-bold">—</span>

                {/* Input Sampai */}
                <div className="relative flex-1 flex flex-col gap-1 w-full">
                  <label className="block sm:hidden text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-wider pl-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={dateToParam}
                    onChange={(e) => applyFilters({ date_to: e.target.value })}
                    className="w-full pl-4 pr-6 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none cursor-pointer transition-all"
                  />
                </div>

                {/* Desktop Reset Button */}
                {(dateFromParam || dateToParam) && (
                  <button
                    onClick={() => applyFilters({ date_from: '', date_to: '' })}
                    className="hidden sm:flex px-2 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-655 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all items-center gap-0.5 cursor-pointer shadow-sm shrink-0"
                    title="Reset tanggal"
                  >
                    <Icon name="close" className="text-[10px]" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logs List Area */}
        {isLoading ? (
          <LogAktivitasSkeleton />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
              <div className="overflow-x-auto text-nowrap">
                <table className="w-full">
                  {logs.length > 0 && (
                    <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all">
                      <tr>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">
                          Waktu
                        </th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">
                          Pengguna
                        </th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">
                          Aktivitas
                        </th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">
                          Barang
                        </th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-850 dark:text-slate-500 uppercase tracking-[0.2em]">
                          Detail
                        </th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 transition-all">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-32 text-center bg-white dark:bg-slate-950">
                          <div className="flex flex-col items-center justify-center text-center w-full">
                            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner group/icon mx-auto">
                              <Icon
                                name={
                                  qParam || actionParam !== 'all' || dateFromParam || dateToParam
                                    ? "manage_search"
                                    : "history"
                                }
                                className="text-5xl text-slate-400 dark:text-slate-700 transition-transform group-hover/icon:rotate-12"
                              />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                              {qParam || actionParam !== 'all' || dateFromParam || dateToParam
                                ? "Hasil Tidak Ditemukan"
                                : "Belum Ada Aktivitas"}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                              {qParam || actionParam !== 'all' || dateFromParam || dateToParam
                                ? `Maaf, kami tidak dapat menemukan aktivitas dengan filter atau kata kunci "${qParam || "tertentu"}".`
                                : "Semua histori perubahan data barang akan tercatat di sini secara otomatis. Pantau setiap aktivitas stok dan inventaris Anda."}
                            </p>
                            {(actionParam !== 'all' ||
                              dateFromParam ||
                              dateToParam ||
                              qParam ||
                              changedFieldParam !== 'all') && (
                              <div className="flex justify-center mt-8">
                                <button
                                  onClick={handleResetFilters}
                                  className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-850 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                                >
                                  <Icon name="refresh" className="text-sm" />
                                  Reset Semua Filter
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const badge = getActionBadge(log.action);
                        return (
                          <tr
                            key={log.id}
                            onClick={() => navigate(`/log-aktivitas/${log.id}`)}
                            title="Klik untuk melihat detail log"
                            className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-4">
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {log.created_at}
                              </div>
                              <div className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                                {log.created_at_relative}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                {log.user_name}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-colors ${badge.style}`}
                              >
                                <Icon name={badge.icon} className="text-sm" />
                                {log.action_label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-200 block truncate group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors">
                                  {log.barang_nama}
                                </span>
                                <Icon
                                  name="arrow_forward"
                                  className="text-[#006eff] dark:text-blue-400 text-sm opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {log.changed_fields_label && log.changed_fields_label.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {log.changed_fields_label.slice(0, 3).map((field, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest border border-slate-350 dark:border-slate-700"
                                    >
                                      {field}
                                    </span>
                                  ))}
                                  {log.changed_fields_label.length > 3 && (
                                    <span
                                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest border border-slate-350 dark:border-slate-700"
                                    >
                                      +{log.changed_fields_label.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-600 text-[11px] font-black uppercase tracking-widest">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Pagination */}
              {(pagination.prevCursor || pagination.nextCursor) && (
                <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-end bg-white dark:bg-slate-900 transition-all">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => applyFilters({ cursor: pagination.prevCursor })}
                      disabled={!pagination.prevCursor}
                      className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <Icon name="chevron_left" className="text-xl" />
                      <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">
                        Sebelumnya
                      </span>
                    </button>
                    <button
                      onClick={() => applyFilters({ cursor: pagination.nextCursor })}
                      disabled={!pagination.nextCursor}
                      className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">
                        Berikutnya
                      </span>
                      <Icon name="chevron_right" className="text-xl" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile View - Cards with Pagination */}
            <div className="md:hidden space-y-4">
              {logs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner mx-auto">
                    <Icon
                      name={
                        qParam || actionParam !== 'all' || dateFromParam || dateToParam
                          ? "manage_search"
                          : "history"
                      }
                      className="text-4xl text-slate-400 dark:text-slate-655 transition-transform mx-auto"
                    />
                  </div>
                  <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight mx-auto">
                    {qParam || actionParam !== 'all' || dateFromParam || dateToParam ? "Tidak Ditemukan" : "Kosong"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto italic leading-relaxed text-center whitespace-normal">
                    {qParam || actionParam !== 'all' || dateFromParam || dateToParam
                      ? `Hasil cari "${qParam || "filter"}" nihil`
                      : "Histori perubahan data akan muncul di sini secara otomatis."}
                  </p>
                  {(actionParam !== 'all' ||
                    dateFromParam ||
                    dateToParam ||
                    qParam ||
                    changedFieldParam !== 'all') && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={handleResetFilters}
                        className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-855 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-350 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Icon name="refresh" className="text-sm" />
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <div
                      key={log.id}
                      onClick={() => navigate(`/log-aktivitas/${log.id}`)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all cursor-pointer relative overflow-hidden group select-none hover:border-[#006eff] dark:hover:border-blue-500"
                    >
                      <div className="flex gap-3 items-center justify-between">
                        <div className="flex gap-3 flex-1 min-w-0 items-center">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor:
                                log.action === 'create'
                                  ? 'rgba(59,130,246,0.12)'
                                  : log.action === 'update'
                                  ? 'rgba(245,158,11,0.12)'
                                  : 'rgba(239,68,68,0.12)',
                            }}
                          >
                            <Icon
                              name={badge.icon}
                              className={`text-2xl ${
                                log.action === 'create'
                                  ? 'text-blue-500'
                                  : log.action === 'update'
                                  ? 'text-amber-500'
                                  : 'text-red-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <p className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-[#006eff] dark:group-hover:text-blue-400 transition-colors">
                                  {log.barang_nama}
                                </p>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${badge.style}`}
                              >
                                {log.action_label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-650 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                              oleh <span className="font-black text-slate-850 dark:text-slate-200">{log.user_name}</span> • {log.created_at_relative}
                            </p>
                          </div>
                        </div>
                        <Icon name="chevron_right" className="text-slate-400 shrink-0" />
                      </div>

                      {log.changed_fields_label && log.changed_fields_label.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                          {log.changed_fields_label.map((field, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-550 text-[10px] font-black uppercase tracking-widest border border-slate-300 dark:border-slate-700 transition-all"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Mobile Pagination */}
              {(pagination.prevCursor || pagination.nextCursor) && (
                <div className="flex items-center gap-4 mt-6 pt-4 justify-center md:hidden">
                  <button
                    onClick={() => applyFilters({ cursor: pagination.prevCursor })}
                    disabled={!pagination.prevCursor}
                    className="px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Icon name="chevron_left" className="text-sm font-black" />
                    <span className="text-xs font-black uppercase tracking-widest">Sebelumnya</span>
                  </button>
                  <button
                    onClick={() => applyFilters({ cursor: pagination.nextCursor })}
                    disabled={!pagination.nextCursor}
                    className="px-6 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">Berikutnya</span>
                    <Icon name="chevron_right" className="text-sm font-black" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
