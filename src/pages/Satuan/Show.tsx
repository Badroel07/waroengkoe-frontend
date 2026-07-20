import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useUnitStore } from '@/store/unitStore';
import { useProductStore } from '@/store/productStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

export default function SatuanShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirmDanger } = useAlert();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const getUnit = useUnitStore((s) => s.getUnit);
  const deleteUnit = useUnitStore((s) => s.deleteUnit);
  const products = useProductStore((s) => s.products);

  const satuan = getUnit(id!);

  if (!satuan) {
    return (
      <AppLayout title="Detail Satuan">
        <div className="text-center py-12 text-slate-400">
          <Icon name="straighten" className="text-4xl mb-2" />
          <p className="text-sm font-medium">Satuan tidak ditemukan</p>
        </div>
      </AppLayout>
    );
  }

  // Calculate dynamic stats
  const unitProducts = products.filter(
    (p) =>
      p.satuan_dasar.toLowerCase() === satuan.nama_satuan.toLowerCase() ||
      p.satuans.some((su) => su.nama.toLowerCase() === satuan.nama_satuan.toLowerCase())
  );
  const productCount = unitProducts.length;
  const totalStock = unitProducts.reduce((sum, p) => sum + p.stok, 0);
  const totalValue = unitProducts.reduce((sum, p) => sum + p.stok * p.harga_beli, 0);

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID').format(Number(value));

  const handleDelete = async () => {
    if (productCount > 0) {
      toast.error('Tidak dapat menghapus satuan yang masih memiliki produk');
      return;
    }

    const confirmed = await confirmDanger(
      `Yakin ingin menghapus satuan "${satuan.nama_satuan}"?`,
      'Hapus Satuan',
      { confirmText: 'Ya, Hapus', cancelText: 'Batal' }
    );

    if (!confirmed) return;

    setProcessing(true);
    try {
      await deleteUnit(satuan.id);
      toast.success('Satuan berhasil dihapus');
      navigate('/satuan');
    } catch (err) {
      toast.error('Gagal menghapus satuan');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout title={`Detail Satuan ${satuan.nama_satuan}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton href="/satuan" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
                Detail Satuan
              </h2>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                Informasi lengkap satuan produk Anda
              </p>
            </div>
          </div>

          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleDelete}
              disabled={processing || productCount > 0}
              className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-sm font-bold transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title={productCount > 0 ? 'Tidak dapat dihapus (ada produk)' : 'Hapus'}
            >
              <Icon name="delete" className="text-[18px]" />
              Hapus Satuan
            </button>
            <button
              onClick={() => navigate(`/satuan/${satuan.id}/edit`)}
              className="px-5 py-2.5 rounded-xl bg-[#006eff] text-white hover:bg-[#0056c7] text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center active:scale-[0.98] cursor-pointer"
            >
              <Icon name="edit" className="text-[18px]" />
              Edit Satuan
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-all">
              {/* Satuan Banner Info */}
              <div className="flex items-start sm:items-center gap-5 p-5 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg border border-slate-200 dark:border-slate-800/60 transition-all">
                <div className="w-16 h-16 rounded-md flex items-center justify-center shrink-0 shadow-sm bg-blue-50 dark:bg-blue-500/10">
                  <Icon name="straighten" className="text-3xl text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
                      Nama Satuan
                    </span>
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
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors uppercase tracking-tight truncate">
                    {satuan.nama_satuan}
                  </h4>
                </div>
              </div>

              {/* Keterangan Section */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-2">
                  Keterangan Satuan
                </span>
                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-500/20 rounded-lg transition-all">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {satuan.keterangan || 'Tidak ada keterangan tambahan untuk satuan ini.'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-center border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.02] duration-300">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-455 leading-none">
                    {productCount}
                  </p>
                  <p className="text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-500 uppercase mt-2">
                    Jumlah Produk
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-center border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.02] duration-300">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-455 leading-none">
                    {formatCurrency(totalStock)}
                  </p>
                  <p className="text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-500 uppercase mt-2">
                    Total Stok
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-center border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.02] duration-300">
                  <p className="text-lg font-black text-purple-600 dark:text-purple-455 truncate leading-none mt-0.5">
                    Rp {formatCurrency(totalValue)}
                  </p>
                  <p className="text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-500 uppercase mt-2">
                    Nilai Aset Stok
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Timestamps & Limits */}
          <div className="space-y-6">
            {/* Limits Card */}
            {satuan.is_dasar && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-all">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-1">
                  Pengaturan Stok
                </span>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Icon name="warning" className="text-sm text-slate-400" /> Batas Stok Rendah
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-bold">
                    {satuan.batas_stok_rendah}
                  </span>
                </div>
              </div>
            )}

            {/* Timestamps Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-all text-xs font-black text-slate-500 uppercase tracking-widest">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-1.5 font-black">
                  <Icon name="calendar_today" className="text-sm text-slate-400" /> Dibuat
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-bold">
                  {satuan.created_at ? new Date(satuan.created_at).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-1.5 font-black">
                  <Icon name="update" className="text-sm text-slate-400" /> Diperbarui
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-bold">
                  {satuan.updated_at ? new Date(satuan.updated_at).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
