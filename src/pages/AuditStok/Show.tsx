import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useAuditStore } from '@/store/auditStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useAlert } from '@/components/Alert';

export default function AuditStokShow() {
  const { id: auditId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const audit = useAuditStore((s) => s.audits.find((a) => a.id === auditId));
  const updateItem = useAuditStore((s) => s.updateItem);
  const completeAudit = useAuditStore((s) => s.completeAudit);
  const { confirmDanger } = useAlert();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('semua');
  const debouncedSearch = useDebounce(search, 300);

  if (!audit) {
    return (
      <AppLayout title="Detail Audit Stok" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Audit tidak ditemukan</div>
      </AppLayout>
    );
  }

  const isSelesai = audit.status === 'selesai';

  const filteredItems = audit.items.filter((item) => {
    if (filter === 'belum_diisi' && (item.stok_fisik !== null && item.stok_fisik !== undefined)) return false;
    if (filter === 'sudah_diisi' && (item.stok_fisik === null || item.stok_fisik === undefined)) return false;
    if (filter === 'selisih' && item.selisih === 0) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return item.nama_barang.toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: audit.items.length,
    completed: audit.items.filter((i) => i.stok_fisik !== null && i.stok_fisik !== undefined).length,
    kelebihan: audit.items.filter((i) => (i.selisih || 0) > 0).length,
    kekurangan: audit.items.filter((i) => (i.selisih || 0) < 0).length,
  };

  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handleInputChange = (itemId: string, value: string) => {
    const stokFisik = value === '' ? (null as unknown as number) : parseInt(value);
    const item = audit.items.find((i) => i.id === itemId);
    const selisih = stokFisik !== null && item ? stokFisik - item.stok_sistem : (null as unknown as number);
    updateItem(audit.id, itemId, {
      stok_fisik: stokFisik,
      selisih: selisih,
    });
  };

  const handleComplete = async () => {
    const confirmed = await confirmDanger(
      `Selesaikan audit ini? ${stats.total - stats.completed} item belum diisi.`,
      'Selesaikan Audit'
    );
    if (confirmed) {
      completeAudit(audit.id);
      navigate('/audit-stok');
    }
  };

  const filterTabs = [
    { key: 'semua', label: 'Semua', icon: 'list' },
    { key: 'belum_diisi', label: 'Belum Diisi', icon: 'pending' },
    { key: 'ada_selisih', label: 'Ada Selisih', icon: 'difference' },
    { key: 'sudah_diisi', label: 'Sudah Diisi', icon: 'check_circle' },
  ];

  const getSelisihClass = (selisih: number | null) => {
    if (selisih === null || selisih === undefined) return '';
    if (selisih > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (selisih < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-500';
  };

  return (
    <AppLayout
      title="Detail Audit Stok"
      hideBottomNav
      searchConfig={{
        value: search,
        onSearch: setSearch,
        placeholder: 'Cari barang...',
      }}
      actionButton={
        !isSelesai && stats.completed > 0 ? (
          <button
            onClick={handleComplete}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Icon name="task_alt" className="text-lg" />
            Selesaikan Audit
          </button>
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="flex items-center">
          <BackButton />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isSelesai ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
              <Icon name={isSelesai ? 'task_alt' : 'pending_actions'} className={`text-2xl ${isSelesai ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                  Audit {new Date(audit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${isSelesai ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                  <span className={`size-1.5 rounded-full ${isSelesai ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {isSelesai ? 'Selesai' : 'Draft'}
                </span>
              </div>
              <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1.5">
                Oleh {audit.user_name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Item', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Selesai', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Kelebihan', value: stats.kelebihan, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Kekurangan', value: stats.kekurangan, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">{stats.completed}/{stats.total}</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                filter === tab.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon name={tab.icon} className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight text-sm">
                    {item.nama_barang}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.sku && <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.sku}</span>}
                    {item.kategori && <span className="text-[10px] text-slate-400">· {item.kategori}</span>}
                    <span className="text-[10px] text-slate-400">· Stok: {item.stok_sistem} {item.satuan_dasar}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <div className="text-right">
                    <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-0.5">
                      Stok Fisik
                    </label>
                    <input
                      type="number"
                      defaultValue={item.stok_fisik ?? ''}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      disabled={isSelesai}
                      className={`w-20 px-3 py-1.5 rounded-lg border text-sm font-bold text-center outline-none transition-all ${
                        isSelesai
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {item.selisih !== null && item.selisih !== undefined && (
                    <div className="text-right min-w-[60px]">
                      <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-0.5">
                        Selisih
                      </label>
                      <p className={`text-sm font-black ${getSelisihClass(item.selisih)}`}>
                        {item.selisih > 0 ? '+' : ''}{item.selisih}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="py-12 text-center text-slate-500">Tidak ada item ditemukan</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
