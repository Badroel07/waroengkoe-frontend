import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import QrisPaymentModal from '@/components/QrisPaymentModal';
import Skeleton from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';
import { formatIDR } from '@/lib/idr';

export default function TransaksiShow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirmDanger, error } = useAlert();
  const toast = useToast();

  const user = useAuthStore((s) => s.user);
  const canDelete = user?.is_admin || user?.can_view_activity_log || user?.can_delete_transaction;

  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === id));
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const fetchTransactionDetail = useTransactionStore((s) => s.fetchTransactionDetail);

  const [loading, setLoading] = useState(true);

  // Modal States
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paymentAmount, setPaymentAmount] = useState<number | string>('');
  const [catatan, setCatatan] = useState('');
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchTransactionDetail(id).finally(() => setLoading(false));
    }
  }, [id, fetchTransactionDetail]);

  // Sync initial payment amount and note when transaction changes
  useEffect(() => {
    if (transaction) {
      const sisa = Math.max(0, transaction.total_harga - transaction.total_bayar);
      setPaymentAmount(sisa);
      setCatatan(transaction.catatan || '');
    }
  }, [transaction]);

  // Dynamic print style injection to prevent @page leak on screen view
  useEffect(() => {
    const handleBeforePrint = () => {
      const style = document.createElement('style');
      style.id = 'print-receipt-styles';
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-receipt, .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: white;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `;
      document.head.appendChild(style);
    };

    const handleAfterPrint = () => {
      const style = document.getElementById('print-receipt-styles');
      if (style) style.remove();
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      const style = document.getElementById('print-receipt-styles');
      if (style) style.remove();
    };
  }, []);

  if (loading) {
    return (
      <AppLayout title="Detail Transaksi" hideBottomNav>
        <div className="space-y-6 max-w-6xl animate-fade-in">
          {/* Header Section Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BackButton />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-3.5 w-64" />
              </div>
            </div>
            <Skeleton className="h-12 w-44 rounded-xl" />
          </div>

          {/* Info Cards Skeleton */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-200 dark:divide-slate-800 p-4 space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>

          {/* Items Table Desktop / Mobile Skeletons */}
          <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6">
            <TableSkeleton rows={3} cols={5} />
          </div>
          <div className="md:hidden space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>

          {/* Summary Card Skeleton */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-8 w-28" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-8 w-28" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-8 w-28" /></div>
            </div>
            <Skeleton className="h-12 w-36 rounded-xl shrink-0" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!transaction) {
    return (
      <AppLayout title="Detail Transaksi" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Transaksi tidak ditemukan</div>
      </AppLayout>
    );
  }

  const sisaTagihan = Math.max(0, transaction.total_harga - transaction.total_bayar);
  const isPending = transaction.status.toLowerCase() === 'pending';

  const playSuccessSound = () => {
    const playFallbackBeep = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1760, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        console.warn('Fallback beep failed:', e);
      }
    };

    const playDefaultFile = () => {
      const audio = new Audio('/audio/transaction_success.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => playFallbackBeep());
    };

    try {
      playDefaultFile();
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  };

  const handlePayment = (e: React.FormEvent | null, fromQris: boolean = false) => {
    if (e) e.preventDefault();

    if (paymentMethod === 'QRIS' && !fromQris) {
      setQrisModalOpen(true);
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const accumulatedTotalBayar = fromQris
        ? transaction.total_harga
        : Number(transaction.total_bayar) + Number(paymentAmount);

      updateTransaction(transaction.id, {
        total_bayar: accumulatedTotalBayar,
        metode_pembayaran: fromQris ? 'QRIS' : 'Tunai',
        status: 'Selesai',
        catatan: catatan,
      });

      playSuccessSound();
      toast.success('Pembayaran berhasil diselesaikan!');
      setPaymentModalOpen(false);
      setProcessing(false);
    }, 500);
  };

  const handleDelete = async () => {
    const confirmed = await confirmDanger(
      'Hapus Transaksi Pending?',
      `Transaksi ${transaction.no_invoice} akan dihapus secara permanen dan stok barang akan dikembalikan. Tindakan ini tidak dapat dibatalkan.`
    );

    if (confirmed) {
      setProcessing(true);
      setTimeout(() => {
        deleteTransaction(transaction.id);
        toast.success('Transaksi berhasil dihapus.');
        navigate(-1);
        setProcessing(false);
      }, 500);
    }
  };

  return (
    <AppLayout title="Detail Transaksi" hideBottomNav>
      {/* Printable Receipt (hidden on screen, shown when printing) */}
      <div className="print-receipt hidden print:block">
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">WAROENGKOE!</h1>
          <p className="text-xs">Sistem Kasir & Toko Modern</p>
          <p className="text-xs">Jl. Contoh Alamat No. 123</p>
          <p className="text-xs">Telp: 0812-3456-7890</p>
          <div className="border-t border-dashed border-black my-2"></div>
        </div>

        <div className="text-xs mb-2">
          <p>No: {transaction.no_invoice}</p>
          <p>Tgl: {new Date(transaction.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p>Kasir: {transaction.kasir}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Items */}
        <div className="text-xs">
          {transaction.items.map((item) => (
            <div key={item.id} className="mb-2">
              <p className="font-bold truncate">{item.nama_barang}</p>
              <div className="flex justify-between">
                <span>
                  {item.qty} {item.satuan} x Rp {new Intl.NumberFormat('id-ID').format(item.harga)}
                </span>
                <span>Rp {new Intl.NumberFormat('id-ID').format(item.subtotal)}</span>
              </div>
              {item.diskon && item.diskon > 0 ? (
                <div className="flex justify-between text-xs italic">
                  <span>Diskon Item</span>
                  <span>-Rp {new Intl.NumberFormat('id-ID').format(item.diskon)}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        {/* Totals */}
        <div className="text-xs">
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.total_harga)}</span>
          </div>
          <div className="flex justify-between">
            <span>BAYAR</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.total_bayar)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>KEMBALI</span>
            <span>Rp {new Intl.NumberFormat('id-ID').format(transaction.kembalian || 0)}</span>
          </div>
        </div>

        {transaction.catatan && (
          <div className="text-xs mt-3 italic border-t border-dashed border-black pt-2">
            <p>Catatan: {transaction.catatan}</p>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-center text-xs mt-4">
          <p>Terima Kasih</p>
          <p>Selamat Berbelanja Kembali</p>
          <p className="mt-2">================================</p>
        </div>
      </div>

      {/* Screen View (hidden when printing) */}
      <div className="space-y-6 max-w-6xl print:hidden">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Detail Transaksi</h1>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-blue-500">
                  {new Date(transaction.created_at).toLocaleDateString('id-ID', { weekday: 'long' })}
                </span>
                <span>•</span>
                <span>
                  {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-row items-center justify-between sm:justify-start gap-3">
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">NO INVOICE</span>
            <span className="font-black text-[#006eff] dark:text-blue-400 text-sm sm:text-base uppercase tracking-tight">{transaction.no_invoice}</span>
          </div>
        </div>

        {/* Info Cards */}
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-200 dark:divide-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-7 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0">
              <Icon name="calendar_today" className="text-slate-500 dark:text-slate-600 text-sm" />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">TANGGAL</p>
              <p className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-tight">
                {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-7 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0">
              <Icon name="person" className="text-slate-500 dark:text-slate-600 text-sm" />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">KASIR</p>
              <p className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-tight">{transaction.kasir}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-7 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0">
              <Icon name="payments" className="text-slate-500 dark:text-slate-600 text-sm" />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">METODE</p>
              <p className="font-black text-blue-600 dark:text-blue-400 text-xs uppercase tracking-tight">{transaction.metode_pembayaran}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="size-7 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center shrink-0">
              <Icon name="check_circle" className="text-slate-500 dark:text-slate-600 text-sm" />
            </div>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">STATUS</p>
              <p className="font-black text-[#006eff] dark:text-blue-400 text-xs uppercase tracking-tight">
                {isPending ? 'Pending' : transaction.status}
              </p>
            </div>
          </div>
        </div>

        {/* Catatan Section */}
        {transaction.catatan && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-5 shadow-sm animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-amber-50 dark:border-transparent">
                <Icon name="notes" className="text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1 mt-0.5">Catatan Transaksi</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium italic mt-1 leading-relaxed">"{transaction.catatan}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Items Table Desktop */}
        <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-[#fcfcfc] dark:bg-slate-900/50 flex items-center justify-between">
            <h2 className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 uppercase tracking-tight">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Icon name="inventory_2" className="text-[#006eff]" />
              </div>
              Daftar Barang
            </h2>
            <span className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-300 dark:border-slate-700">
              {transaction.items.length} Item
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80">
                  <th className="px-8 py-4 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Barang</th>
                  <th className="px-4 py-4 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">QTY</th>
                  <th className="px-4 py-4 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Harga</th>
                  <th className="px-4 py-4 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Diskon</th>
                  <th className="px-8 py-4 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 bg-white dark:bg-slate-950">
                {transaction.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-850 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-all flex items-center justify-center text-slate-400 dark:text-slate-600">
                          {item.gambar_url && !item.gambar_url.startsWith('data:image/') ? (
                            <img src={item.gambar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="inventory_2" className="text-2xl" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight truncate">{item.nama_barang}</p>
                          {item.sku && <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">{item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <span className="px-4 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[11px] uppercase tracking-widest border border-blue-100 dark:border-blue-500/10">
                        {item.qty} {item.satuan}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right text-slate-900 dark:text-slate-200 font-black text-sm uppercase">
                      {formatIDR(item.harga)}
                    </td>
                    <td className="px-4 py-5 text-right font-black text-sm uppercase">
                      {item.diskon && item.diskon > 0 ? (
                        <span className="text-red-500 dark:text-red-400">{formatIDR(item.diskon)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-700 font-normal">-</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-black text-[#006eff] dark:text-blue-400 text-lg uppercase tracking-tight">
                      {formatIDR(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Items List */}
        <div className="md:hidden space-y-4">
          <h2 className="text-[11px] font-black text-slate-500 dark:text-slate-500 py-1 uppercase tracking-widest flex items-center gap-2 px-2">
            <Icon name="inventory_2" className="text-blue-500" />
            Daftar Barang ({transaction.items.length})
          </h2>
          {transaction.items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-5 transition-all active:scale-[0.98]">
              <div className="size-16 rounded-lg bg-slate-50 dark:bg-slate-850 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-inner flex items-center justify-center text-slate-400 dark:text-slate-655">
                {item.gambar_url && !item.gambar_url.startsWith('data:image/') ? (
                  <img src={item.gambar_url} className="w-full h-full object-cover" />
                ) : (
                  <Icon name="inventory_2" className="text-2xl" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 line-clamp-2 text-sm uppercase tracking-tight leading-tight">{item.nama_barang}</h3>
                  <p className="font-black text-[#006eff] dark:text-blue-400 text-sm whitespace-nowrap uppercase tracking-tight">{formatIDR(item.subtotal)}</p>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-550 uppercase tracking-widest">
                    {item.qty} {item.satuan} x {formatIDR(item.harga)}
                  </span>
                  {item.diskon && item.diskon > 0 ? (
                    <span className="text-[9px] font-black text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg uppercase tracking-tight">
                      Disc -{formatIDR(item.diskon)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 lg:p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#006eff]" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 flex-1 gap-4 sm:gap-8">
              {/* Total Tagihan */}
              <div>
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Tagihan</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter tabular-nums leading-none">
                  {formatIDR(transaction.total_harga)}
                </p>
              </div>

              {/* Dibayar */}
              <div className="sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-8">
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Dibayar</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#006eff] dark:text-blue-400 uppercase tracking-tighter tabular-nums leading-none">
                  {formatIDR(transaction.total_bayar)}
                </p>
              </div>

              {/* Kembali */}
              <div className="sm:border-l sm:border-slate-200 sm:dark:border-slate-800 sm:pl-8">
                <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Kembali</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter tabular-nums leading-none">
                  {formatIDR(transaction.kembalian || 0)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full lg:w-auto border-t lg:border-t-0 border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 flex items-center lg:justify-end shrink-0">
              {!isPending && (
                <button
                  onClick={() => window.print()}
                  className="w-full lg:w-auto px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] group shrink-0 cursor-pointer"
                >
                  <Icon name="print" className="text-lg group-hover:rotate-12 transition-transform" />
                  Cetak Struk
                </button>
              )}

              {isPending && (
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={processing}
                      className="flex-1 lg:flex-initial px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] shrink-0 cursor-pointer"
                    >
                      <Icon name="delete" className="text-lg" />
                      Hapus
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    disabled={processing}
                    className="flex-[2] lg:flex-initial px-4 py-3 lg:px-6 lg:py-3.5 rounded-xl bg-[#006eff] dark:bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#0056c7] dark:hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 active:scale-[0.98] group whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Icon name="payments" className="text-lg group-hover:scale-125 transition-transform" />
                    Lanjut Bayar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] sm:max-h-[95vh] border border-white/5 overflow-hidden">
              <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 transition-all shadow-inner">
                  <Icon name="add_card" className="text-blue-500 text-3xl" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Selesaikan Pembayaran</h3>
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1.5 leading-none">No Invoice: {transaction.no_invoice}</p>
              </div>

              <form onSubmit={handlePayment} className="flex flex-col min-h-0 bg-white dark:bg-slate-900">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center group transition-all hover:border-blue-500/20">
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-none">
                      {transaction.total_bayar > 0 ? 'Sisa Tagihan' : 'Total Tagihan'}
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter tabular-nums leading-none">{formatIDR(sisaTagihan)}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-1.5 flex rounded-[14px] border border-slate-200 dark:border-slate-800 transition-all shadow-inner">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Tunai')}
                          className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMethod === 'Tunai'
                              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xl border border-blue-500/10'
                              : 'text-slate-800 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                          }`}
                        >
                          <Icon name="payments" className="text-lg font-normal" />
                          Tunai
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('QRIS')}
                          className={`flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            paymentMethod === 'QRIS'
                              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xl border border-blue-500/10'
                              : 'text-slate-800 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
                          }`}
                        >
                          <Icon name="qr_code_2" className="text-lg font-normal" />
                          QRIS
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'Tunai' && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Jumlah Bayar Tunai</label>
                        <div className="relative group/input">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 dark:text-slate-700 uppercase">Rp</span>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-right text-lg font-black outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50"
                            placeholder="0"
                            required
                            min={sisaTagihan}
                          />
                        </div>
                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest ml-1">Minimal: {formatIDR(sisaTagihan)}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">Catatan Tambahan</label>
                      <textarea
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        className="w-full px-5 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none resize-none h-24 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-800 shadow-sm"
                        placeholder="Tambahkan catatan jika ada..."
                      />
                    </div>
                  </div>

                  {paymentMethod === 'Tunai' && Number(paymentAmount) > sisaTagihan && (
                    <div className="px-6 py-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex justify-between items-center transition-all">
                      <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Kembalian</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight tabular-nums leading-none">
                        {formatIDR(Number(paymentAmount) - sisaTagihan)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8 pt-2 sm:pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-4 shrink-0 bg-white dark:bg-slate-900 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                  <button
                    type="button"
                    onClick={() => !qrisModalOpen && !processing && setPaymentModalOpen(false)}
                    disabled={qrisModalOpen || processing}
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-450 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={processing || (paymentMethod !== 'QRIS' && Number(paymentAmount) < sisaTagihan)}
                    className="flex-[2] py-4 bg-[#006eff] dark:bg-blue-600 hover:bg-[#0056c7] dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-all shadow-xl shadow-blue-500/20 dark:shadow-blue-900/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 group cursor-pointer"
                  >
                    <Icon name="check_circle" className="text-lg group-hover:scale-110 transition-transform" />
                    {processing ? 'Memproses...' : paymentMethod === 'QRIS' ? 'Lanjut QRIS' : 'Konfirmasi Bayar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <QrisPaymentModal
        isOpen={qrisModalOpen}
        onClose={() => setQrisModalOpen(false)}
        onConfirm={async () => {
          await handlePayment(null, true);
          setQrisModalOpen(false);
        }}
        amount={sisaTagihan}
        processing={processing}
      />
    </AppLayout>
  );
}