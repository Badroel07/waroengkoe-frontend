import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import { useProductStore } from '@/store/productStore';

export default function Show() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error, confirmDanger } = useAlert();
  const toast = useToast();
  
  const product = useProductStore((s) => s.getProduct(id || ''));
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const enrichAllProducts = useProductStore((s) => s.enrichAllProducts);
  
  const [processing, setProcessing] = useState(false);

  // Refresh dynamic "terjual" counts from transactions when mounting detail page
  useEffect(() => {
    enrichAllProducts();
  }, [enrichAllProducts]);

  const formatCurrency = (value: number | string) => new Intl.NumberFormat('id-ID').format(Number(value));

  const handleDelete = async () => {
    if (!product) return;
    const confirmed = await confirmDanger(
      'Hapus Barang',
      'Yakin ingin menghapus barang ini?'
    );
    if (!confirmed) return;

    setProcessing(true);
    try {
      await deleteProduct(product.id);
      toast.success('Barang berhasil dihapus');
      navigate('/barang');
    } catch (err) {
      toast.error('Gagal menghapus barang');
    } finally {
      setProcessing(false);
    }
  };

  if (!product) {
    return (
      <AppLayout title="Detail Produk" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Produk tidak ditemukan</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Detail ${product.nama}`} hideBottomNav>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Detail Produk</h2>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">Informasi lengkap {product.nama}</p>
            </div>
          </div>
          
          <div className="flex flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleDelete}
              disabled={processing}
              className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 text-sm font-bold transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Icon name="delete" className="text-[18px]" />
              Hapus Produk
            </button>
            <button
              onClick={() => navigate(`/barang/${product.id}/edit`)}
              className="px-5 py-2.5 rounded-xl bg-[#006eff] text-white hover:bg-[#0056c7] text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center active:scale-[0.98] cursor-pointer"
            >
              <Icon name="edit" className="text-[18px]" />
              Edit Produk
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-5">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Image Section */}
            <div className="w-full md:w-48 aspect-square bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-350 dark:border-slate-850 flex items-center justify-center relative group overflow-hidden shadow-inner transition-all shrink-0">
              {product.gambar_url && !product.gambar_url.startsWith('data:image/') ? (
                <NetworkAwareImage
                  alt={product.nama}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src={product.gambar_url}
                />
              ) : (
                <Icon name="inventory_2" className="text-5xl text-slate-400 dark:text-slate-700" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Icon name="zoom_in" className="text-white text-3xl" />
              </div>
            </div>

            {/* Main Info Section */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-650 dark:text-slate-500">Nama Barang</span>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight mt-0.5 uppercase tracking-tight">{product.nama}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-1">SKU ID</span>
                  <span className="text-slate-900 dark:text-slate-400 font-mono text-xs font-bold">{product.sku || '-'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-1">Kategori</span>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100/50 text-blue-800 dark:bg-blue-500/10 dark:text-[#006eff] border border-blue-200/50 dark:border-blue-500/20 mt-0.5">
                    {product.kategori_nama}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 block mb-1">Alias</span>
                  <span className="text-slate-900 dark:text-slate-400 font-mono text-xs font-bold">{product.alias || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unit Section */}
            <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 transition-all h-full">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="straighten" className="text-[#006eff] text-base" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Satuan Produk</h3>
              </div>

              <div className="overflow-hidden border border-slate-350 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-all">
                {/* Desktop View - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#fcfcfc] dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/50">
                      <tr>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest">Unit</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest text-center">Isi</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest text-center">Bonus</th>
                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest text-right">Harga Jual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {product.satuans?.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{s.nama}</div>
                            {s.is_default && (
                              <span className="text-[9px] px-1.5 py-0.5 mt-0.5 inline-block bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-center font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">Unit Dasar</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center text-slate-800 dark:text-slate-400 font-mono font-bold text-xs">{s.konversi}</td>
                          <td className="px-4 py-2.5 text-center">
                            {(s.qty_gratis ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                                <Icon name="auto_awesome" className="text-[10px]" />
                                +{s.qty_gratis}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-650 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-black text-[#006eff] text-sm">Rp {formatCurrency(s.harga_jual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View - Card-like List */}
                <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800 transition-all">
                  {product.satuans?.map((s, idx) => (
                    <div key={s.id || idx} className="p-3 space-y-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Nama Unit</span>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-sm uppercase">{s.nama}</span>
                            {s.is_default && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-500/20">
                                <Icon name="check_circle" className="text-[10px]" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Dasar</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Harga Jual</span>
                          <span className="font-black text-[#006eff] dark:text-blue-400 text-sm">Rp {formatCurrency(s.harga_jual)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Isi Konversi</span>
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {s.konversi} {product.satuan_dasar}
                        </span>
                      </div>
                      
                      {(s.qty_gratis ?? 0) > 0 && (
                        <div className="flex justify-between items-center p-2.5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Icon name="auto_awesome" className="text-emerald-600 dark:text-emerald-400 text-[14px]" />
                            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em]">Bonus Gratis</span>
                          </div>
                          <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs">
                            +{s.qty_gratis} {product.satuan_dasar}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & Stock Section */}
            <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-4 transition-all h-full">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="inventory_2" className="text-[#006eff] text-base" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Harga & Stok</h3>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-lg shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Harga Beli</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">Rp {formatCurrency(product.harga_beli ?? 0)} <span className="text-[10px] text-slate-500">/ {product.satuan_dasar || 'Pcs'}</span></span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-lg shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850">
                  <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Stok Tersedia</span>
                  <span className={`font-black text-sm ${product.stok === 0 ? 'text-red-500' : product.stok <= product.batas_stok_rendah ? 'text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                    {product.stok} {product.satuan_dasar}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-lg shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850">
                  <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Status</span>
                  {product.status !== 'aktif' ? (
                    <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500">
                      <Icon name="block" className="text-[13px]" />
                      <span>Nonaktif</span>
                    </div>
                  ) : product.stok <= 0 ? (
                    <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-500">
                      <Icon name="error" className="text-[13px]" />
                      <span>Habis</span>
                    </div>
                  ) : product.stok <= product.batas_stok_rendah ? (
                    <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500">
                      <Icon name="warning" className="text-[13px]" />
                      <span>Hampir Habis</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider px-2 py-1 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-500">
                      <Icon name="check_circle" className="text-[13px]" />
                      <span>In Stock</span>
                    </div>
                  )}
                </div>
                {/* Terjual count */}
                <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 rounded-lg shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-850">
                  <span className="text-[10px] font-black text-slate-650 dark:text-slate-500 uppercase tracking-[0.2em]">Terjual</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    {product.terjual || 0} {product.satuan_dasar}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl shadow-sm transition-all">
            <div className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Icon name="description" className="text-blue-500 text-[18px]" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest mb-1">Deskripsi & Informasi Tambahan</h4>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/70 leading-relaxed font-medium whitespace-pre-line">
                  {product.deskripsi || 'Sistem mencatat tidak ada deskripsi tambahan untuk produk ini. Pastikan informasi harga dan stok selalu diperbarui untuk akurasi laporan keuangan.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}