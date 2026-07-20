import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import Skeleton from '@/components/Skeleton';
import { useProductStore } from '@/store/productStore';
import { useProfitStore } from '@/store/profitStore';
import { formatIDR } from '@/lib/idr';

// local date helper
const todayLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const startOfMonthLocal = () => {
  const d = new Date();
  d.setDate(1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

export default function ProductAudit() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';
  const satuan = searchParams.get('satuan') || '';
  const q = searchParams.get('q') || '';
  const kategori = searchParams.get('kategori') || '';
  const cursor = searchParams.get('cursor') || '';

  const getProduct = useProductStore((s) => s.getProduct);
  const fetchProductDetails = useProfitStore((s) => s.fetchProductDetails);
  const details = useProfitStore((s) => s.details);
  const totals = useProfitStore((s) => s.detailsTotals);
  const pagination = useProfitStore((s) => s.detailsPagination);

  const product = productId ? getProduct(productId) : null;

  const [isLoading, setIsLoading] = useState(true);

  const effectiveStartDate = start_date || startOfMonthLocal();
  const effectiveEndDate = end_date || todayLocal();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchProductDetails(productId || '', {
          start_date: effectiveStartDate,
          end_date: effectiveEndDate,
          satuan: satuan || undefined,
          cursor: cursor || null,
        });
      } catch (err) {
        console.error('fetchProductDetails failed:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [productId, effectiveStartDate, effectiveEndDate, satuan, cursor, fetchProductDetails]);

  const [startDateInput, setStartDateInput] = useState(effectiveStartDate);
  const [endDateInput, setEndDateInput] = useState(effectiveEndDate);

  // Sync inputs with url params
  useEffect(() => {
    setStartDateInput(effectiveStartDate);
  }, [effectiveStartDate]);

  useEffect(() => {
    setEndDateInput(effectiveEndDate);
  }, [effectiveEndDate]);

  if (!product) {
    return (
      <AppLayout title="Audit Penjualan" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Produk tidak ditemukan</div>
      </AppLayout>
    );
  }

  const handleDateFilter = (newStart: string, newEnd: string) => {
    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('start_date', newStart);
      next.set('end_date', newEnd);
      next.delete('cursor'); // Reset cursor on filter change
      return next;
    });
    setTimeout(() => setIsLoading(false), 200);
  };

  const goToCursor = (targetCursor: string | null) => {
    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (targetCursor && targetCursor !== 'start') {
        next.set('cursor', targetCursor);
      } else {
        next.delete('cursor');
      }
      return next;
    });
    setTimeout(() => {
      setIsLoading(false);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }, 200);
  };

  // Build return URL for back button
  const backParams = new URLSearchParams();
  if (start_date) backParams.set('start_date', start_date);
  if (end_date) backParams.set('end_date', end_date);
  if (q) backParams.set('q', q);
  if (kategori) backParams.set('kategori', kategori);
  const backUrl = `/keuntungan?${backParams.toString()}`;

  const title = `Audit Penjualan — ${product.nama}`;

  return (
    <AppLayout title={title} hideBottomNav>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton href={backUrl} />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Audit Penjualan</h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">Detail transaksi penjualan produk</p>
          </div>
        </div>

        {/* Combined Card: Product Info, Date Picker & Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col gap-6">
          {/* Product Info Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
              {product.gambar_url && !product.gambar_url.startsWith('data:image/') ? (
                <NetworkAwareImage
                  src={product.gambar_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <Icon name="inventory_2" className="text-3xl" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded inline-block mb-1">
                Audit Penjualan
              </span>
              <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase truncate">
                {product.nama}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {product.satuan_dasar && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {product.satuan_dasar}
                  </span>
                )}
                {product.kategori_nama && (
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {product.kategori_nama}
                  </span>
                )}
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  HPP: {formatIDR(product.harga_beli)}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80" />

          {/* Filter and Stats Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Date Filter (Left/Top side) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Filter Periode
              </h3>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => {
                      setStartDateInput(e.target.value);
                      handleDateFilter(e.target.value, endDateInput);
                    }}
                    className="w-full pl-4 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
                  />
                </div>

                <div className="hidden sm:flex items-center justify-center pt-5 text-slate-400">
                  <Icon name="arrow_forward" className="text-xl" />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest pl-1">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={endDateInput}
                    onChange={(e) => {
                      setEndDateInput(e.target.value);
                      handleDateFilter(startDateInput, e.target.value);
                    }}
                    className="w-full pl-4 pr-6 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Summary Stats (Right/Bottom side) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Ringkasan Keuangan
              </h3>
              <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total Bruto
                  </span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatIDR(totals.bruto)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Total HPP
                  </span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatIDR(totals.tara)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 dark:border-slate-800/40">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Net Profit
                  </span>
                  <span
                    className={`text-sm font-black ${
                      totals.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                    }`}
                  >
                    {formatIDR(totals.netto)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className={`space-y-3 transition-opacity duration-250 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Riwayat Transaksi
            </h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {details.length} transaksi terpilih
            </span>
          </div>

          {details.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
              <Icon name="search_off" className="text-5xl text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                Tidak Ada Transaksi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic max-w-[280px] mx-auto">
                Tidak ditemukan rincian transaksi untuk produk ini pada periode yang dipilih.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#fcfcfc] dark:bg-slate-900 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Invoice / Tanggal</th>
                      <th className="px-4 py-3.5 text-center">Jumlah</th>
                      <th className="px-4 py-3.5 text-right">Harga Jual / Beli</th>
                      <th className="px-4 py-3.5 text-right">Diskon</th>
                      <th className="px-4 py-3.5 text-right">Bruto</th>
                      <th className="px-4 py-3.5 text-right">HPP</th>
                      <th className="px-4 py-3.5 text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {details.map((det: any) => (
                      <tr key={`${det.no_invoice}-${det.id}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {det.no_invoice}
                          </span>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {det.created_at}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                          {det.jumlah_terjual} {det.satuan}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            J: {formatIDR(det.harga_satuan)}
                          </p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            B: {formatIDR(det.harga_beli)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right text-red-500 font-medium">
                          <p>Itm: {formatIDR(det.diskon_item)}</p>
                          <p className="text-[10px] mt-0.5">
                            Gbl: {formatIDR(det.porsi_diskon_global)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right text-blue-600 dark:text-blue-400 font-semibold">
                          {formatIDR(det.bruto)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400 font-semibold">
                          {formatIDR(det.tara)}
                        </td>
                        <td
                          className={`px-4 py-3.5 text-right font-black ${
                            det.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}
                        >
                          {formatIDR(det.netto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer totals */}
                  <tfoot className="border-t border-slate-200 dark:border-slate-800 bg-[#fcfcfc] dark:bg-slate-900 font-black">
                    <tr>
                      <td colSpan={4} className="px-4 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Total Terpilih
                      </td>
                      <td className="px-4 py-3.5 text-right text-blue-600 dark:text-blue-400 font-black text-xs">
                        {formatIDR(totals.bruto)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-amber-600 dark:text-amber-400 font-black text-xs">
                        {formatIDR(totals.tara)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-black text-xs ${
                          totals.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {formatIDR(totals.netto)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Desktop Pagination */}
                {(pagination?.nextCursor || pagination?.prevCursor) && (
                  <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToCursor(pagination?.prevCursor ?? null)}
                        disabled={!pagination?.prevCursor}
                        className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <Icon name="chevron_left" className="text-lg" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sebelumnya</span>
                      </button>
                      <button
                        onClick={() => goToCursor(pagination?.nextCursor ?? null)}
                        disabled={!pagination?.nextCursor}
                        className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Berikutnya</span>
                        <Icon name="chevron_right" className="text-lg" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {details.map((det: any) => (
                  <div
                    key={`${det.no_invoice}-${det.id}`}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-2.5"
                  >
                    {/* Invoice header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {det.no_invoice}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{det.created_at}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {det.jumlah_terjual} {det.satuan}
                      </span>
                    </div>

                    {/* Financial grid */}
                    <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">
                          Harga Jual/Beli
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-300">
                          J: {formatIDR(det.harga_satuan)} / B: {formatIDR(det.harga_beli)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">
                          Total Diskon
                        </span>
                        <span className="font-medium text-red-500">
                          {formatIDR(det.diskon_item + det.porsi_diskon_global)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">
                          Bruto / HPP
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-300">
                          {formatIDR(det.bruto)} / {formatIDR(det.tara)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 uppercase tracking-wider font-bold text-[9px]">
                          Net Profit
                        </span>
                        <span
                          className={`font-black ${
                            det.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                          }`}
                        >
                          {formatIDR(det.netto)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile Pagination */}
                {(pagination?.nextCursor || pagination?.prevCursor) && (
                  <div className="flex items-center gap-4 pt-4 justify-center">
                    <button
                      onClick={() => goToCursor(pagination?.prevCursor ?? null)}
                      disabled={!pagination?.prevCursor}
                      className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98]"
                    >
                      <Icon name="chevron_left" className="text-lg" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sebelumnya</span>
                    </button>
                    <button
                      onClick={() => goToCursor(pagination?.nextCursor ?? null)}
                      disabled={!pagination?.nextCursor}
                      className="px-6 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all active:scale-[0.98]"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Berikutnya</span>
                      <Icon name="chevron_right" className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
