import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import Tooltip from '@/components/Tooltip';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useUnitStore } from '@/store/unitStore';
import { generateId } from '@/lib/utils';
import type { ProductUnit } from '@/types';

// Lazy load ScannerModal
const ScannerModal = lazy(() => import('@/components/ScannerModal'));

interface SatuanFormItem {
  id?: string;
  nama_satuan: string;
  konversi: number;
  qty_gratis: number;
  harga_jual: string;
  is_default: boolean;
  is_visible: boolean;
}

interface EditFormState {
  sku: string;
  nama_barang: string;
  alias: string;
  jenis_kategori: string;
  harga_beli: string;
  stok: number | string;
  stock_mode: string;
  satuan_tambah_stok_index: number | string;
  satuan_set_stok_index: number | string;
  status: string;
  deskripsi: string;
  gambar: File | null;
  satuans: SatuanFormItem[];
}

export default function BarangEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { warning } = useAlert();
  const toast = useToast();

  const product = useProductStore((s) => s.getProduct(id || ''));
  const updateProduct = useProductStore((s) => s.updateProduct);
  const categories = useCategoryStore((s) => s.categories);
  const units = useUnitStore((s) => s.units);

  const [form, setForm] = useState<EditFormState>({
    sku: "",
    nama_barang: "",
    alias: "",
    jenis_kategori: "",
    harga_beli: "",
    stok: 0,
    stock_mode: "add",
    satuan_tambah_stok_index: 0,
    satuan_set_stok_index: 0,
    status: "aktif",
    deskripsi: "",
    gambar: null,
    satuans: [
      {
        nama_satuan: "",
        konversi: 1,
        qty_gratis: 0,
        harga_jual: "",
        is_default: true,
        is_visible: true,
      },
    ],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Load product data into form
  useEffect(() => {
    if (product && !initialized) {
      const defaultUnitIndex = product.satuans?.findIndex((s) => s.is_default) ?? 0;
      const initialUnitIndex = defaultUnitIndex >= 0 ? defaultUnitIndex : 0;

      setForm({
        sku: product.sku || "",
        nama_barang: product.nama || "",
        alias: product.alias || "",
        jenis_kategori: product.kategori_id || "",
        harga_beli: product.harga_beli !== undefined && product.harga_beli !== null ? product.harga_beli.toString() : "",
        stok: 0,
        stock_mode: "add",
        satuan_tambah_stok_index: initialUnitIndex,
        satuan_set_stok_index: initialUnitIndex,
        status: product.status || "aktif",
        deskripsi: product.deskripsi || "",
        gambar: null,
        satuans: product.satuans && product.satuans.length > 0
          ? product.satuans.map((s) => ({
              id: s.id,
              nama_satuan: s.nama || "",
              konversi: s.konversi,
              qty_gratis: s.qty_gratis || 0,
              harga_jual: s.harga_jual !== undefined && s.harga_jual !== null ? s.harga_jual.toString() : "",
              is_default: s.is_default || false,
              is_visible: s.is_visible ?? true,
            }))
          : [
              {
                nama_satuan: "",
                konversi: 1,
                qty_gratis: 0,
                harga_jual: "",
                is_default: true,
                is_visible: true,
              },
            ],
      });
      setPreviewImage(product.gambar_url);
      setImageRemoved(false);
      setInitialized(true);
    }
  }, [product, initialized]);

  // Add satuan
  const addSatuan = () => {
    setForm((prev) => ({
      ...prev,
      satuans: [
        ...prev.satuans,
        {
          nama_satuan: "",
          konversi: 1,
          qty_gratis: 0,
          harga_jual: "",
          is_default: false,
          is_visible: true,
        },
      ],
    }));
  };

  // Remove satuan
  const removeSatuan = (index: number) => {
    if (form.satuans.length <= 1) {
      warning("Minimal harus ada 1 satuan!", "Tidak Dapat Dihapus");
      return;
    }
    const wasDefault = form.satuans[index].is_default;
    const newSatuans = form.satuans.filter((_, i) => i !== index);
    if (wasDefault && newSatuans.length > 0) {
      newSatuans[0].is_default = true;
    }
    setForm((prev) => ({ ...prev, satuans: newSatuans }));
  };

  // Update satuan
  const updateSatuan = (index: number, field: keyof SatuanFormItem, value: any) => {
    const newSatuans = [...form.satuans];
    (newSatuans[index] as any)[field] = value;
    setForm((prev) => ({ ...prev, satuans: newSatuans }));
  };

  // Set default satuan
  const setDefaultSatuan = (index: number) => {
    const newKonversi = Number(form.satuans[index]?.konversi || 1);
    if (newKonversi <= 0) return;

    // Recalculate everything relative to the NEW base unit
    const newSatuans = form.satuans.map((s, i) => ({
      ...s,
      is_default: i === index,
      konversi: s.konversi / newKonversi,
    }));

    setForm((prev) => ({
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
        setForm((prev) => ({ ...prev, gambar: file }));
        setImageRemoved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image
  const clearImage = () => {
    setForm((prev) => ({ ...prev, gambar: null }));
    setPreviewImage(null);
    setImageRemoved(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
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

    // Calculate final stock based on stock mode
    const stokLama = Number(product.stok || 0);
    const formStok = Number(form.stok || 0);
    let stokBaru = stokLama;

    const defaultSatuan = form.satuans.find((s) => s.is_default) || form.satuans[0];
    const hargaJualDasar = Number(defaultSatuan?.harga_jual || 0);

    if (form.stock_mode === "set") {
      const selectedSatuan = form.satuans[Number(form.satuan_set_stok_index)];
      const konversi = selectedSatuan?.konversi || 1;
      stokBaru = formStok * konversi;
    } else if (form.stock_mode === "add") {
      const selectedSatuan = form.satuans[Number(form.satuan_tambah_stok_index)];
      const konversi = selectedSatuan?.konversi || 1;
      stokBaru = stokLama + (formStok * konversi);
    } else if (form.stock_mode === "subtract") {
      stokBaru = Math.max(0, stokLama - formStok);
    }

    const hargaBeliDasar = Number(form.harga_beli || 0);
    if (hargaBeliDasar >= hargaJualDasar && hargaJualDasar > 0) {
      setErrors({ general: `Harga beli (Rp ${hargaBeliDasar.toLocaleString('id-ID')}) tidak boleh melebihi atau sama dengan harga jual unit dasar (${defaultSatuan.nama_satuan}: Rp ${hargaJualDasar.toLocaleString('id-ID')})` });
      setProcessing(false);
      return;
    }

    // Find category ID and Name
    const category = categories.find(c => c.id === form.jenis_kategori || c.nama === form.jenis_kategori);
    const kategori_id = category ? category.id : '';
    const kategori_nama = category ? category.nama : '';

    // Map Product Units
    const mappedSatuans: ProductUnit[] = form.satuans.map(s => ({
      id: s.id || generateId(),
      nama: s.nama_satuan,
      konversi: Number(s.konversi) || 1,
      harga_jual: Number(s.harga_jual) || 0,
      is_visible: s.is_visible,
      is_default: s.is_default,
      qty_gratis: Number(s.qty_gratis) || 0
    }));

    try {
      await updateProduct(product.id, {
        sku: form.sku,
        nama: form.nama_barang,
        alias: form.alias || undefined,
        deskripsi: form.deskripsi || undefined,
        gambar_url: imageRemoved ? null : (previewImage || product.gambar_url),
        satuan_dasar: defaultSatuan.nama_satuan || 'Pcs',
        harga_beli: hargaBeliDasar,
        stok: stokBaru,
        status: form.status,
        kategori_id,
        kategori_nama,
        satuans: mappedSatuans,
      });

      toast.success(`"${form.nama_barang}" berhasil diupdate!`);
      const destination = sessionStorage.getItem('last_barang_url') || '/barang';
      sessionStorage.setItem('should_restore_scroll_flag', 'true');
      navigate(destination);
    } catch (err) {
      toast.error('Gagal memperbarui produk');
    } finally {
      setProcessing(false);
    }
  };

  if (!product) {
    return (
      <AppLayout title="Edit Produk" hideBottomNav>
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Icon name="error" className="text-5xl mb-3 opacity-30" />
          <p className="text-sm font-semibold">Produk tidak ditemukan</p>
          <button onClick={() => navigate('/barang')} className="btn-primary mt-4 px-4 py-2 text-xs cursor-pointer">
            Kembali ke Produk
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit: ${product.nama}`} hideBottomNav>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Edit Produk</h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Update informasi produk "{product.nama}"
            </p>
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
              Kategori
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
                Satuan Produk
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
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 flex items-center gap-2">
              <Icon name="payments" className="text-[#006eff]" />
              Harga & Stok
            </h4>

            <div className="space-y-8">
              {/* Top Row: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Harga Beli (per unit dasar)
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-xs font-bold">
                        Rp
                      </span>
                    </div>
                    <input
                      type="number"
                      value={form.harga_beli}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          harga_beli: e.target.value,
                        })
                      }
                      min="0"
                      step="0.01"
                      className={`w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-950 border ${Number(form.harga_beli) >= Number(form.satuans.find((s) => s.is_default)?.harga_jual || 0) && Number(form.harga_beli) > 0 ? "border-amber-500 ring-1 ring-amber-500" : "border-slate-200 dark:border-slate-800"} rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-[#006eff]/20 focus:border-[#006eff] outline-none transition-all shadow-sm`}
                      placeholder="0"
                    />
                  </div>
                  {Number(form.harga_beli) >= Number(form.satuans.find((s) => s.is_default)?.harga_jual || 0) && Number(form.harga_beli) > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <Icon name="warning" className="text-sm shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium leading-tight">
                        Peringatan: Harga beli melebihi/sama dengan harga jual.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Status Produk
                  </label>
                  <CustomSelect
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    buttonClassName="text-sm py-2.5 font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    options={[
                      { value: "aktif", label: "Aktif (Dijual)", icon: "check_circle" },
                      { value: "nonaktif", label: "Arsip / Tidak Aktif", icon: "archive" }
                    ]}
                  />
                </div>
              </div>

              {/* Section Divider */}
              <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

              {/* Bottom Section: Dynamic Stock Management */}
              <div>
                <div className="p-3 sm:p-5 lg:p-8 rounded-2xl sm:rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-widest">
                      Update Manajemen Stok
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: "add",
                        label: "Tambah Stok",
                        icon: "add_circle",
                        color: "text-emerald-500",
                        bg: "hover:bg-emerald-50 dark:hover:bg-emerald-500/5",
                        active: "bg-white dark:bg-slate-800 ring-2 ring-emerald-500/20 border-emerald-500/50 shadow-md",
                        info: "Pilih ini jika Anda baru saja membeli barang atau stok bertambah dari supplier.",
                      },
                      {
                        id: "subtract",
                        label: "Kurangi Stok",
                        icon: "remove_circle",
                        color: "text-red-500",
                        bg: "hover:bg-red-50 dark:hover:bg-red-500/5",
                        active: "bg-white dark:bg-slate-800 ring-2 ring-red-500/20 border-red-500/50 shadow-md",
                        info: "Pilih ini jika stok berkurang karena barang rusak, hilang, atau alasan lain.",
                      },
                      {
                        id: "set",
                        label: "Set Stok Total",
                        icon: "inventory",
                        color: "text-blue-500",
                        bg: "hover:bg-blue-50 dark:hover:bg-blue-500/5",
                        active: "bg-white dark:bg-slate-800 ring-2 ring-blue-500/20 border-blue-500/50 shadow-md",
                        info: "Gunakan ini untuk menyesuaikan stok sistem agar sama persis dengan stok fisik gudang.",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const newStok = m.id === "set" ? (product.stok ?? 0) : 0;
                          const defaultIndex = form.satuans.findIndex((s) => s.is_default) || 0;
                          setForm((prev) => ({
                            ...prev,
                            stock_mode: m.id,
                            stok: newStok,
                            satuan_set_stok_index: m.id === "set" ? (defaultIndex >= 0 ? defaultIndex : 0) : prev.satuan_set_stok_index,
                          }));
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent transition-all gap-2 group cursor-pointer ${
                          form.stock_mode === m.id
                            ? m.active
                            : `bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/50 ${m.bg}`
                        }`}
                      >
                        <div className="relative w-full flex flex-col items-center gap-2">
                          <Icon
                            name={m.icon}
                            className={`text-2xl transition-transform group-hover:scale-110 ${form.stock_mode === m.id ? m.color : "text-slate-500"}`}
                          />
                          <span
                            className={`text-[11px] font-black uppercase tracking-widest ${form.stock_mode === m.id ? "text-slate-900 dark:text-white" : "text-slate-650"}`}
                          >
                            {m.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {/* Row 1: Amount and Unit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 ml-1 flex items-center gap-1">
                          Jumlah Perubahan Stok
                          <Tooltip text="Masukkan jumlah stok yang masuk atau keluar. Gunakan angka positif saja." />
                        </label>
                        <div className="flex gap-2 w-full max-w-md">
                          <div className="relative group/input flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span
                                className={`text-lg font-black ${
                                  form.stock_mode === "add"
                                    ? "text-emerald-500"
                                    : form.stock_mode === "subtract"
                                      ? "text-red-500"
                                      : "text-blue-500"
                                }`}
                              >
                                {form.stock_mode === "add"
                                  ? "+"
                                  : form.stock_mode === "subtract"
                                    ? "-"
                                    : "="}
                              </span>
                            </div>
                            <input
                              type="number"
                              value={form.stok}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  stok: e.target.value,
                                })
                              }
                              min="0"
                              step="any"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white text-lg font-black focus:ring-4 focus:ring-blue-500/10 focus:border-[#006eff] outline-none transition-all shadow-sm shadow-black/5"
                              placeholder="0"
                            />
                          </div>
                          {form.stock_mode === "set" && (
                            <CustomSelect
                              value={form.satuan_set_stok_index}
                              onChange={(e) => {
                                const newIndex = e.target.value === "" ? "" : parseInt(e.target.value);
                                const oldKonversi = form.satuan_set_stok_index !== "" ? form.satuans[Number(form.satuan_set_stok_index)]?.konversi || 1 : 1;
                                const newKonversi = newIndex !== "" ? form.satuans[newIndex as number]?.konversi || 1 : 1;
                                const baseStok = Number(form.stok || 0) * oldKonversi;
                                const convertedStok = baseStok / newKonversi;
                                setForm({
                                  ...form,
                                  satuan_set_stok_index: newIndex,
                                  stok: convertedStok,
                                });
                              }}
                              className="flex-1"
                              buttonClassName="!py-3 text-[#006eff] dark:text-blue-400 text-lg font-black rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                              options={form.satuans.map((s, i) => ({
                                value: i,
                                label: s.nama_satuan || `Satuan ${i + 1}`
                              }))}
                            />
                          )}
                          {form.stock_mode === "add" && (
                            <CustomSelect
                              value={form.satuan_tambah_stok_index}
                              onChange={(e) => {
                                const newIndex = e.target.value === "" ? "" : parseInt(e.target.value);
                                const oldKonversi = form.satuan_tambah_stok_index !== "" ? form.satuans[Number(form.satuan_tambah_stok_index)]?.konversi || 1 : 1;
                                const newKonversi = newIndex !== "" ? form.satuans[newIndex as number]?.konversi || 1 : 1;
                                const baseStok = Number(form.stok || 0) * oldKonversi;
                                const convertedStok = baseStok / newKonversi;
                                setForm({
                                  ...form,
                                  satuan_tambah_stok_index: newIndex,
                                  stok: convertedStok,
                                });
                              }}
                              className="flex-1"
                              buttonClassName="!py-3 text-[#006eff] dark:text-blue-400 text-lg font-black rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                              options={form.satuans.map((s, i) => ({
                                value: i,
                                label: s.nama_satuan || `Satuan ${i + 1}`
                              }))}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col h-full justify-end pb-1.5">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-inner">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                              Stok Saat Ini
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {product?.stok || 0}{" "}
                              {form.satuans.find((s) => s.is_default)?.nama_satuan || product?.satuan_dasar || "Pcs"}
                            </span>
                          </div>
                          {Number(form.stok) > 0 && (
                            <>
                              <Icon
                                name="trending_flat"
                                className="text-slate-400 dark:text-slate-700 mx-2"
                              />
                              <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">
                                  Estimasi Akhir
                                </span>
                                <span
                                  className={`text-sm font-black ${
                                    form.stock_mode === "subtract"
                                      ? Number(product?.stok || 0) - Number(form.stok || 0) < 0
                                        ? "text-red-500"
                                        : "text-emerald-500"
                                      : "text-emerald-500"
                                  }`}
                                >
                                  {(() => {
                                    if (form.stock_mode === "add") {
                                      const konversi = form.satuan_tambah_stok_index !== "" ? form.satuans[Number(form.satuan_tambah_stok_index)]?.konversi || 1 : 1;
                                      return Number(product?.stok || 0) + Number(form.stok || 0) * konversi;
                                    }
                                    if (form.stock_mode === "subtract") {
                                      return Number(product?.stok || 0) - Number(form.stok || 0);
                                    }
                                    // set mode
                                    const konversiSet = form.satuan_set_stok_index !== "" ? form.satuans[Number(form.satuan_set_stok_index)]?.konversi || 1 : 1;
                                    return Number(form.stok || 0) * konversiSet;
                                  })()}{" "}
                                  {form.satuans.find((s) => s.is_default)?.nama_satuan || product?.satuan_dasar || "Pcs"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
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