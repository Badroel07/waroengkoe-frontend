import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useCategoryStore } from '@/store/categoryStore';
import { useProductStore } from '@/store/productStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

export default function KategoriShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirmDanger } = useAlert();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const getCategory = useCategoryStore((s) => s.getCategory);
  const deleteCategory = useCategoryStore((s) => s.deleteCategory);
  const products = useProductStore((s) => s.products);

  const kategori = getCategory(id!);

  if (!kategori) {
    return (
      <AppLayout title="Kategori Detail">
        <div className="text-center py-12 text-slate-400">
          <Icon name="category" className="text-4xl mb-2" />
          <p className="text-sm font-medium">Kategori tidak ditemukan</p>
        </div>
      </AppLayout>
    );
  }

  // Calculate dynamic stats
  const catProducts = products.filter((p) => p.kategori_id === kategori.id);
  const productCount = catProducts.length;
  const totalStock = catProducts.reduce((sum, p) => sum + p.stok, 0);
  const totalValue = catProducts.reduce((sum, p) => sum + p.stok * p.harga_beli, 0);

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('id-ID').format(Number(value));

  const handleDelete = async () => {
    if (productCount > 0) {
      toast.error('Tidak dapat menghapus kategori yang masih memiliki produk');
      return;
    }

    const confirmed = await confirmDanger(
      `Yakin ingin menghapus kategori "${kategori.nama}"?`,
      'Hapus Kategori',
      { confirmText: 'Ya, Hapus', cancelText: 'Batal' }
    );

    if (!confirmed) return;

    setProcessing(true);
    try {
      await deleteCategory(kategori.id);
      toast.success('Kategori berhasil dihapus');
      navigate('/kategori');
    } catch (err) {
      toast.error('Gagal menghapus kategori');
    } finally {
      setProcessing(false);
    }
  };

  const hexToRgba = (hex: string | undefined, alpha: number) => {
    const safeHex = hex?.startsWith('#') ? hex : '#006eff';
    const r = parseInt(safeHex.slice(1, 3), 16) || 0;
    const g = parseInt(safeHex.slice(3, 5), 16) || 0;
    const b = parseInt(safeHex.slice(5, 7), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <AppLayout title={`Detail Kategori ${kategori.nama}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton href="/kategori" />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
                Detail Kategori
              </h2>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                Informasi lengkap kategori produk Anda
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
              Hapus Kategori
            </button>
            <button
              onClick={() => navigate(`/kategori/${kategori.id}/edit`)}
              className="px-5 py-2.5 rounded-xl bg-[#006eff] text-white hover:bg-[#0056c7] text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center active:scale-[0.98] cursor-pointer"
            >
              <Icon name="edit" className="text-[18px]" />
              Edit Kategori
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-all">
              {/* Category Banner Info */}
              <div
                className="flex items-start sm:items-center gap-5 p-5 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg border border-slate-200 dark:border-slate-800/60 transition-all">
                <div
                  className="w-16 h-16 rounded-md flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: hexToRgba(kategori.warna, 0.12) }}
                >
                  <span style={{ color: kategori.warna || '#006eff', fontVariationSettings: "'FILL' 1" }}>
                    <Icon name="category" className="text-3xl" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-1">
                    Nama Kategori
                  </span>
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors uppercase tracking-tight truncate">
                    {kategori.nama}
                  </h4>
                </div>
              </div>

              {/* Description Section */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-2">
                  Deskripsi Kategori
                </span>
                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-500/20 rounded-lg transition-all">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {kategori.deskripsi || 'Tidak ada deskripsi tambahan untuk kategori ini.'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg text-center border border-slate-200 dark:border-slate-800 transition-all hover:scale-[1.02] duration-300">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-450 leading-none">
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

          {/* Right Column: Timestamps */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-all text-xs font-black text-slate-500 uppercase tracking-widest">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-1.5 font-black">
                  <Icon name="calendar_today" className="text-sm text-slate-400" /> Dibuat
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-bold">
                  {kategori.created_at ? new Date(kategori.created_at).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="flex items-center gap-1.5 font-black">
                  <Icon name="update" className="text-sm text-slate-400" /> Diperbarui
                </span>
                <span className="text-slate-800 dark:text-slate-300 font-bold">
                  {kategori.created_at ? new Date(kategori.created_at).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
