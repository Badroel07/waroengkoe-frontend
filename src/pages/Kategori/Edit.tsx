import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useCategoryStore } from '@/store/categoryStore';
import { useToast } from '@/components/ToastProvider';

export default function KategoriEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getCategory = useCategoryStore((s) => s.getCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);
  const toast = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
    warna: '#006eff',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const cat = getCategory(id!);
    if (cat) {
      setFormData({
        nama: cat.nama,
        deskripsi: cat.deskripsi || '',
        warna: cat.warna || '#006eff',
      });
    }
  }, [id, getCategory]);

  const getTextColorForBg = (hex: string): string => {
    const safeHex = hex?.startsWith('#') ? hex : '#006eff';
    const r = parseInt(safeHex.slice(1, 3), 16) || 0;
    const g = parseInt(safeHex.slice(3, 5), 16) || 0;
    const b = parseInt(safeHex.slice(5, 7), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#1e293b' : '#ffffff';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) return;

    setProcessing(true);
    try {
      await updateCategory(id!, {
        nama: formData.nama.trim(),
        deskripsi: formData.deskripsi.trim(),
        warna: formData.warna,
      });
      toast.success('Kategori berhasil diperbarui');
      navigate('/kategori');
    } catch (err) {
      toast.error('Gagal memperbarui kategori');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout title="Edit Kategori">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Edit Kategori
            </h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Perbarui informasi kategori produk Anda
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4 sm:p-6 transition-all">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Icon name="category" className="text-[#006eff]" />
              Informasi Kategori
            </h4>

            <div className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Obat Batuk"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  required
                  autoFocus
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Deskripsi singkat kategori..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all shadow-sm"
                />
              </div>

              {/* Warna */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Warna Badge
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                    className="w-12 h-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent"
                  />
                  <div className="flex gap-2">
                    {['#006eff', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, warna: color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${
                          formData.warna === color ? 'border-slate-500 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shadow-inner">
                <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Preview Visual:
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="px-4 py-1.5 rounded-full text-sm font-black shadow-lg transition-transform hover:scale-105"
                    style={{
                      backgroundColor: formData.warna,
                      color: getTextColorForBg(formData.warna),
                    }}
                  >
                    {formData.nama || 'Nama Kategori'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/kategori')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Icon name="close" className="text-sm" />
                Batal
              </button>
              <button
                type="submit"
                disabled={processing || !formData.nama.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#006eff] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all"
              >
                <Icon name="save" className="text-sm" />
                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
