import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import Tooltip from '@/components/Tooltip';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useUnitStore } from '@/store/unitStore';
import { generateId } from '@/lib/utils';
import type { ProductUnit } from '@/types';

// Lazy load ScannerModal - loads only when scanner is opened
const ScannerModal = lazy(() => import('@/components/ScannerModal'));

interface SatuanFormItem {
  nama_satuan: string;
  konversi: number;
  qty_gratis: number;
  harga_jual: string;
  is_default: boolean;
  is_visible: boolean;
}

interface FormState {
  sku: string;
  nama_barang: string;
  alias: string;
  jenis_kategori: string;
  harga_beli: string;
  stok: number | string;
  satuan_stok_awal_index: number;
  total_harga_nota: string;
  status: string;
  deskripsi: string;
  gambar: File | null;
  satuans: SatuanFormItem[];
}

export default function BarangCreate() {
  const navigate = useNavigate();
  const { warning } = useAlert();
  const toast = useToast();

  const addProduct = useProductStore((s) => s.addProduct);
  const categories = useCategoryStore((s) => s.categories);
  const units = useUnitStore((s) => s.units);

  const initialForm: FormState = {
    sku: '',
    nama_barang: '',
    alias: '',
    jenis_kategori: '',
    harga_beli: '',
    stok: 0,
    satuan_stok_awal_index: 0,
    total_harga_nota: '',
    status: 'aktif',
    deskripsi: '',
    gambar: null,
    satuans: [{ nama_satuan: '', konversi: 1, qty_gratis: 0, harga_jual: '', is_default: true, is_visible: true }],
  };

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [preview, setPreview] = useState<{ stokDasar: number; estimatedHpp: number }>({ stokDasar: 0, estimatedHpp: 0 });
  const [modalMode, setModalMode] = useState<string>('satuan'); // 'satuan' atau 'nota'

  // HPP Calculation Preview
  useEffect(() => {
    const satuanTerpilih = form.satuans[form.satuan_stok_awal_index] || form.satuans[0];
    const konversi = Number(satuanTerpilih?.konversi || 1);
    const stokDasar = (Number(form.stok) || 0) * konversi;

    let estimatedHpp = 0;
    if (form.total_harga_nota && stokDasar > 0) {
      estimatedHpp = Number(form.total_harga_nota) / stokDasar;
    } else if (form.harga_beli) {
      // Jika harga beli diisi manual, itu dianggap harga PER SATUAN terpilih
      // maka dikonversi ke HPP dasar
      estimatedHpp = parseFloat(form.harga_beli) / konversi;
    }

    setPreview({ stokDasar, estimatedHpp });
  }, [form.stok, form.satuan_stok_awal_index, form.total_harga_nota, form.harga_beli, form.satuans]);

  // Add satuan
  const addSatuan = () => {
    setForm(prev => ({
      ...prev,
      satuans: [...prev.satuans, { nama_satuan: '', konversi: 1, qty_gratis: 0, harga_jual: '', is_default: false, is_visible: true }],
    }));
  };

  // Remove satuan
  const removeSatuan = (index: number) => {
    if (form.satuans.length <= 1) {
      warning('Minimal harus ada 1 satuan!', 'Tidak Dapat Dihapus');
      return;
    }
    const wasDefault = form.satuans[index].is_default;
    const newSatuans = form.satuans.filter((_, i) => i !== index);
    if (wasDefault && newSatuans.length > 0) {
      newSatuans[0].is_default = true;
    }
    setForm(prev => ({ ...prev, satuans: newSatuans }));
  };

  // Update satuan
  const updateSatuan = (index: number, field: keyof SatuanFormItem, value: any) => {
    const newSatuans = [...form.satuans];
    (newSatuans[index] as any)[field] = value;
    setForm(prev => ({ ...prev, satuans: newSatuans }));
  };

  // Set default satuan
  const setDefaultSatuan = (index: number) => {
    const newKonversi = form.satuans[index]?.konversi || 1;
    if (newKonversi <= 0) return;

    // Recalculate everything relative to the NEW base unit
    const newSatuans = form.satuans.map((s, i) => ({
      ...s,
      is_default: i === index,
      konversi: s.konversi / newKonversi,
    }));

    setForm(prev => ({
      ...prev,
      satuans: newSatuans,
      stok: Number(prev.stok) / newKonversi,
      harga_beli: String((Number(prev.harga_beli) || 0) * newKonversi),
    }));
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setForm(prev => ({ ...prev, gambar: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image
  const clearImage = () => {
    setForm(prev => ({ ...prev, gambar: null }));
    setPreviewImage(null);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    if (!form.nama_barang) {
      setErrors({ general: 'Nama barang wajib diisi' });
      setProcessing(false);
      return;
    }

    if (!form.jenis_kategori) {
      setErrors({ general: 'Kategori wajib dipilih' });
      setProcessing(false);
      return;
    }

    // Validation for blank unit names
    const hasBlankUnit = form.satuans.some(s => !s.nama_satuan);
    if (hasBlankUnit) {
      setErrors({ general: 'Nama satuan tidak boleh kosong' });
      setProcessing(false);
      return;
    }

    const defaultReq = form.satuans.find(s => s.is_default) || form.satuans[0];
    const konversiSelected = Number(form.satuans[form.satuan_stok_awal_index]?.konversi || 1);
    const stokDasar = Number(form.stok || 0) * konversiSelected;

    let hargaBeliDasar = 0;
    if (modalMode === 'nota' && stokDasar > 0) {
      hargaBeliDasar = Number(form.total_harga_nota) / stokDasar;
    } else {
      hargaBeliDasar = Number(form.harga_beli || 0) / konversiSelected;
    }

    const hargaJualDasar = Number(defaultReq?.harga_jual || 0);
    if (hargaBeliDasar >= hargaJualDasar && hargaJualDasar > 0) {
      setErrors({ general: `Harga beli dasar (Rp ${Math.round(hargaBeliDasar).toLocaleString('id-ID')}) tidak boleh melebihi atau sama dengan harga jual unit dasar (${defaultReq.nama_satuan}: Rp ${Math.round(hargaJualDasar).toLocaleString('id-ID')})` });
      setProcessing(false);
      return;
    }

    // Find category ID and Name
    const category = categories.find(c => c.id === form.jenis_kategori || c.nama === form.jenis_kategori);
    const kategori_id = category ? category.id : '';
    const kategori_nama = category ? category.nama : '';

    // Generate SKU if blank
    const finalSku = form.sku || ('BRG' + String(Date.now()).slice(-6));

    // Map Product Units
    const mappedSatuans: ProductUnit[] = form.satuans.map(s => ({
      id: generateId(),
      nama: s.nama_satuan,
      konversi: Number(s.konversi) || 1,
      harga_jual: Number(s.harga_jual) || 0,
      is_visible: s.is_visible,
      is_default: s.is_default,
      qty_gratis: Number(s.qty_gratis) || 0
    }));

    try {
      await addProduct({
        sku: finalSku,
        nama: form.nama_barang,
        alias: form.alias || undefined,
        deskripsi: form.deskripsi || undefined,
        gambar_url: previewImage,
        satuan_dasar: defaultReq.nama_satuan || 'Pcs',
        harga_beli: hargaBeliDasar,
        stok: stokDasar,
        status: form.status,
        kategori_id,
        kategori_nama,
        satuans: mappedSatuans,
        batas_stok_rendah: 10,
      });

      toast.success(`"${form.nama_barang}" berhasil ditambahkan!`);
      navigate('/barang');
    } catch (err) {
      toast.error('Gagal menambahkan produk');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout title="Tambah Produk Baru" hideBottomNav>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Tambah Produk Baru</h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">Lengkapi form di bawah untuk menambahkan produk baru</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 shadow-sm transition-all">
              <Icon name="error" className="text-xl shrink-0" />
              <p className="font-medium leading-relaxed">{errors.general}</p>
            </div>
          )}

          {/* Info Produk */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Icon name="inventory_2" className="text-[#006eff]" />
              Informasi Produk
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">SKU (Opsional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                    placeholder="PRD001"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-3 py-2 bg-[#006eff] text-white rounded-xl hover:bg-[#0056c7] transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
                    title="Scan Barcode"
                  >
                    <Icon name="qr_code_scanner" className="text-[20px]" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.nama_barang}
                  onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                  placeholder="Nama produk"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Alias (Opsional)</label>
                <input
                  type="text"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                  placeholder="Nama pencarian lain..."
                />
              </div>
            </div>

            {/* Gambar & Deskripsi inside Informasi Produk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col h-full">
                <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 ml-1">
                  <Icon name="image" className="text-[#006eff] text-base" />
                  Gambar Produk
                </h5>
                <div className="flex-1">
                  {previewImage ? (
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md transition-all"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 cursor-pointer"
                      >
                        <Icon name="close" className="text-sm" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-[142px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 rounded-xl text-center cursor-pointer hover:border-[#006eff]/50 transition-all group shadow-inner px-4 overflow-hidden">
                      <Icon
                        name="cloud_upload"
                        className="text-3xl text-slate-400 dark:text-slate-600 mb-2 block mx-auto group-hover:scale-110 transition-transform"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Klik untuk upload</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-black">JPG, PNG, WEBP (10MB)</p>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Icon name="description" className="text-[#006eff] text-base" />
                    Deskripsi
                  </h5>
                </div>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm min-h-[142px]"
                  placeholder="Deskripsi produk..."
                />
              </div>
            </div>
          </div>

          {/* Kategori */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Icon name="category" className="text-[#006eff]" />
              Kategori <span className="text-red-500">*</span>
            </h4>
            <label className="block text-sm text-slate-900 dark:text-slate-200 mb-1">Pilih Kategori</label>
            <CustomSelect
              value={form.jenis_kategori}
              onChange={(e) =>
                setForm({
                  ...form,
                  jenis_kategori: e.target.value,
                })
              }
              placeholder="-- Pilih Kategori --"
              options={categories.map((k) => ({ value: k.id, label: k.nama }))}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Kategori baru hanya dapat ditambahkan melalui menu <span className="font-medium text-slate-800 dark:text-slate-200">Kategori</span>.
            </p>
          </div>

          {/* Satuan */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Icon name="straighten" className="text-[#006eff]" />
                Satuan Produk <span className="text-red-500">*</span>
              </h4>
              <button type="button" onClick={addSatuan} className="px-5 py-2 rounded-xl bg-[#006eff] text-white text-sm font-medium hover:bg-[#0056c7] flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer">
                <Icon name="add" className="text-xl" />
                Tambah Satuan
              </button>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                <Icon name="info" className="text-xl flex-shrink-0" />
                <p>
                  Hanya satuan yang terdaftar di sistem yang dapat dipilih.
                  Jika Anda ingin menambahkan satuan baru (misal: Krat, Pak), silakan pergi ke halaman <a href="/satuan" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-600 dark:hover:text-blue-200">Kelola Satuan</a>.
                </p>
              </div>
              {form.satuans.map((satuan, index) => (
                <div key={index} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-[#006eff] font-medium">Satuan #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-450 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={satuan.is_visible}
                          onChange={(e) => updateSatuan(index, 'is_visible', e.target.checked)}
                          className="text-[#006eff] focus:ring-[#006eff] rounded-md"
                        />
                        Dijual?
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-650 dark:text-slate-450 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={satuan.is_default}
                          onChange={() => setDefaultSatuan(index)}
                          className="text-[#006eff] focus:ring-[#006eff] rounded-full"
                        />
                        Unit Dasar
                      </label>
                      <button type="button" onClick={() => removeSatuan(index)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-slate-800 text-red-500 hover:bg-red-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm border border-red-100 dark:border-slate-700 cursor-pointer">
                        <Icon name="delete" className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Nama Satuan
                      </label>
                      <CustomSelect
                        value={satuan.nama_satuan}
                        onChange={(e) =>
                          updateSatuan(
                            index,
                            "nama_satuan",
                            e.target.value,
                          )
                        }
                        placeholder="-- Pilih --"
                        buttonClassName="!py-1.5 text-sm font-semibold rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                        options={units.map((opt) => ({
                          value: opt.nama_satuan,
                          label: opt.nama_satuan
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Jumlah Isi (Konversi)
                      </label>
                      <input
                        type="number"
                        value={satuan.konversi}
                        onChange={(e) =>
                          updateSatuan(
                            index,
                            "konversi",
                            Number(e.target.value) || 1,
                          )
                        }
                        min="1"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#006eff] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Bonus Gratis
                      </label>
                      <input
                        type="number"
                        value={satuan.qty_gratis}
                        onChange={(e) =>
                          updateSatuan(
                            index,
                            "qty_gratis",
                            Number(e.target.value) || 0,
                          )
                        }
                        min="0"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#006eff] transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Harga Jual
                      </label>
                      <div className="relative group/price">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 text-[10px] font-black uppercase">
                            Rp
                          </span>
                        </div>
                        <input
                          type="number"
                          value={satuan.harga_jual}
                          onChange={(e) =>
                            updateSatuan(
                              index,
                              "harga_jual",
                              e.target.value,
                            )
                          }
                          min="0"
                          step="0.01"
                          placeholder="5000"
                          className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#006eff] transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-amber-500/10 border border-yellow-200 dark:border-amber-500/20 text-xs text-yellow-700 dark:text-amber-400 leading-relaxed shadow-sm">
              <div className="flex gap-2">
                <Icon name="lightbulb" className="text-amber-500 shrink-0 text-base" />
                <div>
                  <p className="font-bold mb-1">Panduan Konversi & Satuan:</p>
                  <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                    <li><strong>Unit Dasar</strong>: Gunakan satuan <b>terkecil</b> (misal: Pcs, Gram, Butir) agar angka konversi lainnya bulat.</li>
                    <li><strong>Konversi</strong>: Berapa banyak Unit Dasar di dalam 1 satuan ini. Misal: 1 Kg berisi 1000 Gr, maka Unit Dasar adalah <b>Gr</b> dan Konversi Kg adalah <b>1000</b>.</li>
                    <li><strong>Bonus Gratis</strong>: Jumlah barang gratis <b>tambahan</b> di luar isi konversi. Misal: Promo Beli 12 Gratis 1 (Total 13 Pcs), maka isi Konversi <b>12</b> dan Bonus <b>1</b>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Harga & Stok */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Icon name="payments" className="text-[#006eff] text-lg" />
                Harga Modal & Stok Awal
              </h4>
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-500/20">
                <Icon name="auto_awesome" className="text-[12px]" />
                AUTO-MODAL AKTIF
              </div>
            </div>

            <div className="space-y-6">
              {/* Stok Awal Section */}
              <div className="space-y-2 md:max-w-md">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 truncate">
                  Jumlah Stok Awal <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative group/input flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="inventory_2" className="text-slate-500 text-xs" />
                    </div>
                    <input
                      type="number"
                      value={form.stok}
                      onChange={(e) => setForm({ ...form, stok: e.target.value })}
                      min="0"
                      step="any"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-[#006eff] outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-slate-700 shadow-sm"
                      placeholder="0"
                      required
                    />
                  </div>
                  <CustomSelect
                    value={form.satuan_stok_awal_index}
                    onChange={(e) => {
                      const newIndex = parseInt(e.target.value);
                      const oldKonversi = Number(form.satuans[form.satuan_stok_awal_index]?.konversi || 1);
                      const newKonversi = Number(form.satuans[newIndex]?.konversi || 1);
                      const baseStok = Number(form.stok || 0) * oldKonversi;
                      const convertedStok = baseStok / newKonversi;
                      setForm({ ...form, satuan_stok_awal_index: newIndex, stok: convertedStok });
                    }}
                    className="flex-1"
                    buttonClassName="!py-2.5 text-[#006eff] dark:text-blue-400 font-semibold rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    options={form.satuans.map((s, i) => ({
                      value: i,
                      label: s.nama_satuan || `Satuan ${i + 1}`
                    }))}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
                  Masukkan jumlah stok pertama kali saat ini.
                </p>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center px-4 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">Pilih Salah Satu Cara Input Modal</span>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  {/* Option 1: Modal per Unit */}
                  <div
                    onClick={() => {
                      setModalMode('satuan');
                      if (form.total_harga_nota) {
                        setForm({ ...form, total_harga_nota: '' });
                      }
                      setTimeout(() => document.getElementById('input_harga_beli')?.focus(), 50);
                    }}
                    className={`space-y-4 p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${modalMode === 'satuan' ? 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 opacity-60 hover:opacity-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-400 flex items-center gap-1 cursor-pointer">
                        Cara 1: Harga Beli Satuan
                        {modalMode === 'satuan' && <span className="text-red-500">*</span>}
                        <Tooltip text="Harga beli per satuan dasar (unit terkecil). Jika satuan dasar berubah, sesuaikan harga ini." />
                      </label>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${modalMode === 'satuan' ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>
                        <div className={`w-2 h-2 rounded-full bg-white transition-all ${modalMode === 'satuan' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 text-xs font-medium">Rp</span>
                      </div>
                      <input
                        id="input_harga_beli"
                        type="number"
                        value={form.harga_beli}
                        onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
                        min="0"
                        step="0.01"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border ${(Number(preview.estimatedHpp) >= Number(form.satuans.find(s => s.is_default)?.harga_jual || 0) && preview.estimatedHpp > 0) ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-lg text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-[#006eff] outline-none transition-all placeholder:text-slate-400 shadow-sm disabled:bg-slate-50 disabled:dark:bg-slate-900`}
                        placeholder="Contoh: 5000"
                        required={modalMode === 'satuan'}
                        disabled={modalMode !== 'satuan'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
                      Status: Harga per <b>{form.satuans.find(s => s.is_default)?.nama_satuan || 'Satuan Dasar'}</b>
                    </p>
                  </div>

                  {/* Option 2: Total Nota */}
                  <div
                    onClick={() => {
                      setModalMode('nota');
                      if (form.harga_beli) {
                        setForm({ ...form, harga_beli: '' });
                      }
                      setTimeout(() => document.getElementById('input_total_nota')?.focus(), 50);
                    }}
                    className={`space-y-4 p-3 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer ${modalMode === 'nota' ? 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 opacity-60 hover:opacity-100'}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-400 flex items-center gap-1 cursor-pointer">
                        Cara 2: Total Harga dari Nota
                        {modalMode === 'nota' && <span className="text-red-500">*</span>}
                        <Tooltip text="Masukkan total Rp yang dibayarkan untuk seluruh stok masuk di atas. Harga modal per unit akan dihitung otomatis." />
                      </label>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${modalMode === 'nota' ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>
                        <div className={`w-2 h-2 rounded-full bg-white transition-all ${modalMode === 'nota' ? 'scale-100' : 'scale-0'}`}></div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 text-xs font-medium">Rp</span>
                      </div>
                      <input
                        id="input_total_nota"
                        type="number"
                        value={form.total_harga_nota}
                        onChange={(e) => setForm({ ...form, total_harga_nota: e.target.value })}
                        min="0"
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-[#006eff] outline-none transition-all placeholder:text-slate-400 shadow-sm disabled:bg-slate-50 disabled:dark:bg-slate-900"
                        placeholder="Cth: 1000000"
                        required={modalMode === 'nota'}
                        disabled={modalMode !== 'nota'}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
                      Auto hitung dari: Stok {form.stok || '0'} {form.satuans[form.satuan_stok_awal_index]?.nama_satuan || 'Pcs'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ringkasan Panel */}
              {(preview.stokDasar > 0 || preview.estimatedHpp > 0) && (
                <div className="p-3 sm:p-4 rounded-2xl sm:rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border-2 border-dashed border-blue-200 dark:border-blue-500/20 space-y-3 sm:space-y-4 shadow-inner relative overflow-hidden transition-all duration-300">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-500/10">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                      <Icon name="analytics" className="text-lg" />
                      Ringkasan Stok & Harga Modal
                    </div>
                    {Number(preview.estimatedHpp) >= Number(form.satuans.find(s => s.is_default)?.harga_jual || 0) && preview.estimatedHpp > 0 && (
                      <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                        <Icon name="warning" className="text-sm" /> RUGI/TIDAK UNTUNG
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-650 uppercase font-bold">Total Stok (Unit Dasar)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{preview.stokDasar.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-500">{form.satuans.find(s => s.is_default)?.nama_satuan || 'Pcs'}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] text-slate-650 uppercase font-bold">Estimasi Harga Modal Dasar</span>
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-xs font-bold text-slate-500">Rp</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(preview.estimatedHpp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {Number(preview.estimatedHpp) >= Number(form.satuans.find(s => s.is_default)?.harga_jual || 0) && preview.estimatedHpp > 0 && (
                    <div className="p-2 rounded-lg bg-red-100/50 dark:bg-red-500/10 text-[11px] text-red-700 dark:text-red-400 font-medium leading-normal">
                      <b>Peringatan:</b> Harga Modal per {form.satuans.find(s => s.is_default)?.nama_satuan || 'Unit'} melebihi harga jual. Silakan turunkan Harga Beli atau naikkan Harga Jual di bagian Satuan.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/barang')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-sm"
              >
                <Icon name="close" className="text-sm" />
                Batal
              </button>
              <button
                type="submit"
                disabled={processing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#006eff] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all cursor-pointer text-sm"
              >
                <Icon name="save" className="text-sm" />
                {processing ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {isScannerOpen && (
        <Suspense fallback={null}>
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            mode="single"
            onScanResult={(code) => {
              setForm(prev => ({ ...prev, sku: code }));
              setIsScannerOpen(false);
            }}
          />
        </Suspense>
      )}
    </AppLayout>
  );
}