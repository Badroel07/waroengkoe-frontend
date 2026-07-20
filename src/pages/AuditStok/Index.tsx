import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import { useAuditStore } from '@/store/auditStore';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { useAlert } from '@/components/Alert';

export default function AuditStokIndex() {
  const navigate = useNavigate();
  const audits = useAuditStore((s) => s.audits);
  const createAudit = useAuditStore((s) => s.createAudit);
  const deleteAudit = useAuditStore((s) => s.deleteAudit);
  const getProducts = useProductStore((s) => s.getProducts);
  const user = useAuthStore((s) => s.user);
  const { confirmDanger } = useAlert();
  const [isCreating, setIsCreating] = useState(false);

  const handleMulaiAudit = () => {
    if (!user) return;
    setIsCreating(true);
    const products = getProducts().filter((p) => p.status === 'aktif');
    const items = products.map((p) => ({
      id: crypto.randomUUID(),
      barang_id: p.id,
      nama_barang: p.nama,
      sku: p.sku,
      kategori: p.kategori_nama,
      stok_sistem: p.stok,
      stok_fisik: null as unknown as number,
      selisih: null as unknown as number,
      catatan_item: '',
      satuan_dasar: p.satuan_dasar,
    }));
    const audit = createAudit(user.id, user.name, items);
    setIsCreating(false);
    navigate(`/audit-stok/${audit.id}`);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDanger(
      'Apakah Anda yakin ingin menghapus sesi audit (draft) ini?',
      'Hapus Sesi Audit'
    );
    if (confirmed) deleteAudit(id);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isDraft = status === 'draft';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
          isDraft
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
        }`}
      >
        <span className={`size-1.5 rounded-full ${isDraft ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        {isDraft ? 'Draft' : 'Selesai'}
      </span>
    );
  };

  return (
    <AppLayout title="Audit Stok">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
                Audit Stok
              </h2>
              <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">
                Pantau dan verifikasi akurasi stok barang
              </p>
            </div>
            <button
              onClick={handleMulaiAudit}
              disabled={isCreating}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isCreating ? (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="add_circle" className="text-lg" />
              )}
              Buat Audit Baru
            </button>
          </div>
          <div className="flex sm:hidden">
            <button
              onClick={handleMulaiAudit}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isCreating ? (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="add_circle" className="text-lg" />
              )}
              Buat Audit Baru
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {audits.length === 0 && (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <Icon name="pending_actions" className="text-5xl text-slate-300 dark:text-slate-700 mb-4" />
              <p className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Belum Ada Audit</p>
              <p className="text-xs text-slate-500 mt-2">Buat sesi audit baru untuk mulai verifikasi stok</p>
            </div>
          )}
          {audits.map((audit) => {
            const pct = audit.total_items > 0 ? Math.round((audit.completed_items / audit.total_items) * 100) : 0;
            return (
              <div
                key={audit.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${audit.status === 'selesai' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                    <Icon
                      name={audit.status === 'selesai' ? 'task_alt' : 'pending_actions'}
                      className={`text-2xl ${audit.status === 'selesai' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                        Audit {new Date(audit.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h3>
                      <StatusBadge status={audit.status} />
                    </div>
                    <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                      Oleh {audit.user_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums">
                        {audit.completed_items}/{audit.total_items}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <span className="text-xs text-slate-500">{audit.completed_items} selesai</span>
                      <span className="text-xs text-slate-500">{audit.total_items - audit.completed_items} sisa</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center gap-2 sm:items-end shrink-0">
                    {audit.status === 'draft' ? (
                      <>
                        <button
                          onClick={() => navigate(`/audit-stok/${audit.id}`)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                        >
                          Lanjutkan
                        </button>
                        <button
                          onClick={() => handleDelete(audit.id)}
                          className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                        >
                          Hapus
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/audit-stok/${audit.id}`)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                      >
                        Lihat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
