import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import Skeleton, { StatCardSkeleton } from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useUserStore } from '@/store/userStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

const PAGE_SIZE = 10;

export default function PenggunaIndex() {
  const navigate = useNavigate();
  const { warning, confirmDanger } = useAlert();
  const toast = useToast();

  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const deleteUser = useUserStore((s) => s.deleteUser);
  const bulkDelete = useUserStore((s) => s.bulkDelete);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setIsLoading(true);
    fetchUsers().finally(() => setIsLoading(false));
  }, [fetchUsers]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelected([]);
  }, [debouncedSearch]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.is_admin).length,
      kasir: users.filter((u) => !u.is_admin).length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, debouncedSearch]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

  const isDefaultAdmin = (name: string) => name === 'Admin Waroeng';

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const selectable = paginatedUsers.filter((u) => !isDefaultAdmin(u.name)).map((u) => u.id);
    const allSelected = selectable.length > 0 && selectable.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !selectable.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...selectable])]);
    }
  };

  const handleDelete = async (user: any) => {
    if (isDefaultAdmin(user.name)) {
      warning('Admin default tidak dapat dihapus.', 'Tidak Diizinkan');
      return;
    }
    const confirmed = await confirmDanger(`Yakin ingin menghapus ${user.name}?`, 'Hapus Pengguna');
    if (!confirmed) return;

    setProcessing(true);
    try {
      await deleteUser(user.id);
      toast.success('Pengguna berhasil dihapus');
      setSelected((prev) => prev.filter((id) => id !== user.id));
    } catch {
      toast.error('Gagal menghapus pengguna');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmed = await confirmDanger(`Yakin ingin menghapus ${selected.length} pengguna?`, 'Hapus Banyak Pengguna');
    if (!confirmed) return;

    setProcessing(true);
    try {
      const protectIds = users.filter((u) => isDefaultAdmin(u.name)).map((u) => u.id);
      const filteredIds = selected.filter((id) => !protectIds.includes(id));
      await bulkDelete(filteredIds);
      setSelected([]);
      toast.success('Pengguna terpilih berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus pengguna');
    } finally {
      setProcessing(false);
    }
  };

  const formattedDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const UserCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all group">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );

  const UserListSkeleton = () => {
    return (
      <div className="space-y-6">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto text-nowrap">
            <table className="w-full">
              <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-5 text-left w-12"><Skeleton className="w-5 h-5 rounded-lg" /></th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Pengguna</th>
                  <th className="px-4 py-5 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Email</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Terdaftar</th>
                  <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="w-5 h-5 rounded-lg" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
                        <Skeleton className="w-32 h-4" />
                      </div>
                    </td>
                    <td className="px-4 py-4"><Skeleton className="w-48 h-4" /></td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-20 h-5 rounded-full" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Skeleton className="w-24 h-4" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <Skeleton className="w-9 h-9 rounded-2xl" />
                        <Skeleton className="w-9 h-9 rounded-2xl" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      title="Manajemen Pengguna"
      searchConfig={{
        placeholder: 'Cari nama, email pengguna...',
        value: search,
        onSearch: setSearch
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Manajemen Pengguna</h2>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">Kelola akun admin dan kasir</p>
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-[11px] hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-md hover:shadow-red-500/10 transition-all group/delete active:scale-[0.98]"
              >
                <Icon name="delete" className="text-sm group-hover/delete:scale-110 transition-transform" />
                <span>Hapus ({selected.length})</span>
              </button>
            )}
            <button
              onClick={() => navigate('/pengguna/create')}
              className="flex items-center gap-2 rounded-xl bg-[#006eff] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#0056c7] shadow-lg shadow-blue-500/20 transition-all"
            >
              <Icon name="person_add" className="text-[18px]" />
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            [
              { label: 'Total', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Admin', value: stats.admin, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { label: 'Kasir', value: stats.kasir, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              </div>
            ))
          )}
        </div>

        {/* User Content */}
        {isLoading ? (
          <UserListSkeleton />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hidden md:block">
              <div className="overflow-x-auto text-nowrap">
                <table className="w-full">
                  {paginatedUsers.length > 0 && (
                    <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all">
                      <tr>
                        <th className="px-6 py-5 text-left w-12">
                          <input
                            type="checkbox"
                            checked={
                              paginatedUsers.filter((u) => !isDefaultAdmin(u.name)).length > 0 &&
                              paginatedUsers.filter((u) => !isDefaultAdmin(u.name)).every((u) => selected.includes(u.id))
                            }
                            onChange={toggleSelectAll}
                            className="size-5 rounded-lg border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#006eff] focus:ring-0 transition-all cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Pengguna</th>
                        <th className="px-4 py-5 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Email</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Role</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Terdaftar</th>
                        <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Aksi</th>
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950 transition-all">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-32 text-center bg-white dark:bg-slate-950">
                          <div className="flex flex-col items-center justify-center animate-fade-in text-center w-full">
                            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner group/icon mx-auto">
                              <Icon name={search ? "person_search" : "group_off"} className="text-5xl text-slate-400 dark:text-slate-700 transition-transform group-hover/icon:rotate-12" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                              {search ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic text-center whitespace-normal">
                              {search
                                ? `Maaf, kami tidak dapat menemukan pengguna dengan kata kunci "${search}".`
                                : 'Mulai kelola akses toko Anda dengan menambahkan akun untuk admin atau kasir.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(user.id)}
                              onChange={() => toggleSelect(user.id)}
                              disabled={isDefaultAdmin(user.name)}
                              className="w-5 h-5 rounded-lg border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#006eff] focus:ring-[#006eff] disabled:opacity-30 transition-all cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${user.is_admin ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                               <Icon name={user.is_admin ? 'admin_panel_settings' : 'badge'} className="text-[20px]" />
                              </div>
                              <div>
                                <span className="font-black text-slate-900 dark:text-slate-100">{user.name}</span>
                                {isDefaultAdmin(user.name) && (
                                  <span className="ml-2 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-550 text-[11px] font-black uppercase tracking-widest">Default</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-650 dark:text-slate-400 font-medium">{user.email}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase border transition-colors ${
                              user.is_admin
                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_admin ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                              {user.is_admin ? 'Admin' : 'Kasir'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-slate-600 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest">
                            {formattedDate(user.email_verified_at)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {!isDefaultAdmin(user.name) && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/pengguna/${user.id}/edit`)}
                                  disabled={processing}
                                  className="w-9 h-9 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#006eff] dark:hover:text-blue-400 transition-all cursor-pointer"
                                  title="Edit Pengguna"
                                >
                                  <Icon name="edit" className="text-[20px]" />
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  disabled={processing}
                                  className="w-9 h-9 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
                                  title="Hapus Pengguna"
                                >
                                  <Icon name="delete" className="text-[20px]" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Desktop Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-white dark:bg-slate-900 transition-all">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                      aria-label="Halaman Sebelumnya"
                    >
                      <Icon name="chevron_left" className="text-xl" />
                      <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Sebelumnya</span>
                    </button>
                    
                    {(() => {
                      const current = currentPage;
                      const last = totalPages;
                      const pages = [];

                      pages.push(1);

                      let rangeStart = Math.max(2, current - 1);
                      let rangeEnd = Math.min(last - 1, current + 1);

                      if (current <= 3) rangeEnd = Math.min(last - 1, 4);
                      if (current >= last - 2) rangeStart = Math.max(2, last - 3);

                      if (rangeStart > 2) pages.push('...');
                      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
                      if (rangeEnd < last - 1) pages.push('...');
                      if (last > 1) pages.push(last);

                      return pages.map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="hidden sm:flex size-10 items-center justify-center text-slate-600 dark:text-slate-605 font-black tracking-widest text-[11px]">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(Number(page))}
                            className={`hidden sm:flex size-10 rounded-xl items-center justify-center text-[11px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer ${
                              current === page
                                ? 'bg-[#006eff] text-white shadow-blue-500/20'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm transition-all'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ));
                    })()}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                      aria-label="Halaman Berikutnya"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Berikutnya</span>
                      <Icon name="chevron_right" className="text-xl" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Card Content */}
            <div className="md:hidden">
              <div className="space-y-4">
                {paginatedUsers.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-805 flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-slate-700 shadow-inner mx-auto">
                      <Icon name={search ? "person_search" : "group_off"} className="text-4xl text-slate-400 dark:text-slate-600 transition-transform group-hover/icon:rotate-12" />
                    </div>
                    <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight mx-auto">
                      {search ? 'Tidak Ditemukan' : 'Kosong'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto italic leading-relaxed text-center whitespace-normal">
                      {search ? `Hasil cari "${search}" nihil` : 'Belum ada data pengguna'}
                    </p>
                  </div>
                ) : (
                  paginatedUsers.map((user) => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all group">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${user.is_admin ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                          <Icon name={user.is_admin ? 'admin_panel_settings' : 'badge'} className="text-2xl" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-slate-900 dark:text-slate-100 transition-colors uppercase tracking-tight">{user.name}</h3>
                            {isDefaultAdmin(user.name) && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest">Default</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate mt-0.5 transition-colors">{user.email}</p>
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase border transition-colors ${
                              user.is_admin
                                ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                                : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_admin ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                              {user.is_admin ? 'Admin' : 'Kasir'}
                            </span>
                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                              {formattedDate(user.email_verified_at)}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        {!isDefaultAdmin(user.name) && (
                          <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-1 gap-1 shrink-0 h-fit self-center">
                            <button
                              onClick={() => navigate(`/pengguna/${user.id}/edit`)}
                              disabled={processing}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#006eff] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all cursor-pointer"
                              title="Edit Pengguna"
                            >
                              <Icon name="edit" className="text-[18px]" />
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={processing}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-4 mt-6 pt-4 justify-center md:hidden">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98] cursor-pointer"
                      aria-label="Halaman Sebelumnya"
                    >
                      <Icon name="chevron_left" className="text-xl" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Sebelumnya</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98] cursor-pointer"
                      aria-label="Halaman Berikutnya"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Berikutnya</span>
                      <Icon name="chevron_right" className="text-xl" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
