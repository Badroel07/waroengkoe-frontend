import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useUnitStore } from '@/store/unitStore';
import { useToast } from '@/components/ToastProvider';

export default function SatuanEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getUnit = useUnitStore((s) => s.getUnit);
  const updateUnit = useUnitStore((s) => s.updateUnit);
  const toast = useToast();

  const [formData, setFormData] = useState({
    nama_satuan: '',
    keterangan: '',
    batas_stok_rendah: 5,
    is_dasar: false,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unit = getUnit(id!);
    if (unit) {
      setFormData({
        nama_satuan: unit.nama_satuan,
        keterangan: unit.keterangan || '',
        batas_stok_rendah: unit.batas_stok_rendah ?? 5,
        is_dasar: unit.is_dasar ?? false,
      });
    }
  }, [id, getUnit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.nama_satuan.trim()) return;

    setProcessing(true);
    try {
      await updateUnit(id!, {
        nama_satuan: formData.nama_satuan.trim(),
        keterangan: formData.keterangan.trim(),
        batas_stok_rendah: formData.is_dasar ? formData.batas_stok_rendah : 0,
        is_dasar: formData.is_dasar,
      });
      toast.success('Satuan berhasil diperbarui');
      navigate('/satuan');
    } catch (err) {
      toast.error('Gagal memperbarui satuan');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout title="Edit Satuan">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Edit Satuan
            </h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Perbarui informasi satuan produk Anda
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4 sm:p-6 transition-all">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Icon name="straighten" className="text-[#006eff]" />
              Informasi Satuan
            </h4>

            <div className="space-y-4">
              {/* Nama Satuan */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Nama Satuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_satuan}
                  onChange={(e) => setFormData({ ...formData, nama_satuan: e.target.value })}
                  placeholder="Contoh: Pcs, Box, Lusin"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  required
                  autoFocus
                />
              </div>

              {/* Toggle Satuan Dasar */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all">
                <div className="flex flex-col gap-0.5 max-w-[85%]">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-205">Satuan Dasar</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Tandai jika satuan ini merupakan satuan terkecil/dasar (misal: Pcs, Sachet, Botol)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newIsDasar = !formData.is_dasar;
                    setFormData({
                      ...formData,
                      is_dasar: newIsDasar,
                      batas_stok_rendah: newIsDasar ? formData.batas_stok_rendah : 0,
                    });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.is_dasar ? 'bg-[#006eff]' : 'bg-slate-300 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.is_dasar ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Conditional Batas Stok Rendah */}
              {formData.is_dasar && (
                <div className="animate-fade-in space-y-2">
                  <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Batas Stok Rendah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.batas_stok_rendah}
                    onChange={(e) =>
                      setFormData({ ...formData, batas_stok_rendah: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Contoh: 5"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    required={formData.is_dasar}
                  />
                  <p className="text-xs text-slate-500">
                    Batas jumlah stok untuk peringatan stok hampir habis pada dashboard.
                  </p>
                </div>
              )}

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Keterangan
                </label>
                <textarea
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Opsional: Keterangan singkat untuk satuan ini..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/satuan')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Icon name="close" className="text-sm" />
                Batal
              </button>
              <button
                type="submit"
                disabled={processing || !formData.nama_satuan.trim()}
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
