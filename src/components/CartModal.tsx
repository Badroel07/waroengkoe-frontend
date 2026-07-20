import { Fragment, useState, memo, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Icon from '@/components/Icon';
import OverflowMarquee from '@/components/OverflowMarquee';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import CustomSelect from '@/components/CustomSelect';
import { useCartStore } from '@/store/cartStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { useAlert } from '@/components/Alert';
import { formatIDR } from '@/lib/idr';
import type { CartItemType } from '@/types';
import QrisPaymentModal from './QrisPaymentModal';

const formatCurrency = (value: number | string) => {
  const num = Number(value);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  preventClose?: boolean;
}

export default function CartModal({
  isOpen,
  onClose,
  preventClose = false,
}: CartModalProps) {
  const user = useAuthStore((s) => s.user);
  const products = useProductStore((s) => s.products);
  const {
    items: cart,
    diskonGlobal: storeDiskonGlobal,
    metodePembayaran: paymentMethod,
    setDiskonGlobal,
    setMetodePembayaran: setPaymentMethod,
    updateQty,
    updateCartItemQty,
    updateSatuan,
    removeItem: removeFromCart,
    clearCart: handleClearCart,
    getTotals,
  } = useCartStore();

  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const { warning, success, confirm, confirmDanger } = useAlert();

  const [isPaymentDetailsVisible, setPaymentDetailsVisible] = useState(false);
  const [bayar, setBayar] = useState('');
  const [catatan, setCatatan] = useState('');
  const [processing, setProcessing] = useState(false);
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const payInputRef = useRef<HTMLInputElement>(null);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotals = getTotals();
  const diskonGlobal = String(storeDiskonGlobal);

  const successSound = useRef(new Audio('/audio/transaction_success.mp3'));

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
        console.warn("Fallback beep failed:", e);
      }
    };

    try {
      successSound.current.currentTime = 0;
      successSound.current.play().catch(() => playFallbackBeep());
    } catch {
      playFallbackBeep();
    }
  };

  const processPayment = async (status: 'Selesai' | 'Pending', fromQris: boolean = false) => {
    if (cart.length === 0) return;

    if (status === 'Pending' && !catatan?.trim()) {
      warning('Harap isi catatan jika catatan belum diisi', 'Catatan Wajib');
      return;
    }

    if (status === 'Selesai' && paymentMethod === 'QRIS' && !fromQris) {
      setQrisModalOpen(true);
      return;
    }

    const payVal = paymentMethod === 'QRIS' ? cartTotals.total : (parseInt(bayar.replace(/\D/g, '')) || 0);

    if (status === 'Selesai') {
      if (paymentMethod === 'Tunai' && (!bayar || payVal === 0)) {
        warning('Silakan isi jumlah uang yang dibayarkan pelanggan!', 'Peringatan');
        return;
      }

      if (payVal < cartTotals.total) {
        warning('Jumlah pembayaran kurang dari total belanja!', 'Pembayaran Kurang');
        return;
      }
    }

    // Dialog Konfirmasi sebelum memproses transaksi
    if (status === 'Pending') {
      const pendingConfirmContent = (
        <div className="space-y-4 text-left">
          <p className="text-center text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-4">
            Apakah Anda yakin ingin menunda transaksi ini?
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Belanja</span>
              <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">Rp {formatCurrency(cartTotals.total)}</span>
            </div>
            
            <div className="flex flex-col gap-1 border-t border-slate-200/60 dark:border-slate-700/50 pt-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Catatan</span>
              <span className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-medium italic">
                {catatan ? `"${catatan}"` : 'Tidak ada catatan'}
              </span>
            </div>
          </div>
        </div>
      );

      const confirmed = await confirm(
        pendingConfirmContent,
        'Tunda Transaksi',
        {
          confirmText: 'Ya, Tunda',
          cancelText: 'Batal',
          configOverrides: {
            iconName: 'hourglass_top',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            icon: 'text-amber-600 dark:text-amber-400',
            ring: 'ring-amber-500/20 dark:ring-amber-500/10',
            buttonBg: 'bg-amber-500 hover:bg-amber-600',
          }
        }
      );
      if (!confirmed) return;
    } else {
      const confirmContent = (
        <div className="space-y-4 text-left">
          <p className="text-center text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed mb-4">
            Apakah Anda yakin ingin memproses pembayaran ini?
          </p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Belanja</span>
              <span className="text-base text-slate-900 dark:text-slate-100 font-extrabold">Rp {formatCurrency(cartTotals.total)}</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-200/60 dark:border-slate-700/50 pt-2.5">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Metode</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/20">
                <Icon name={paymentMethod === 'Tunai' ? 'payments' : 'add_card'} className="text-sm" />
                {paymentMethod}
              </span>
            </div>

            {paymentMethod === 'Tunai' && (
              <>
                <div className="flex justify-between items-center border-t border-slate-200/60 dark:border-slate-700/50 pt-2.5">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Uang Bayar</span>
                  <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">Rp {formatCurrency(payVal)}</span>
                </div>
                
                <div className="flex justify-between items-center bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl p-3 border border-emerald-500/20 dark:border-emerald-500/30 mt-1">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Kembalian</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400 font-black">Rp {formatCurrency(payVal - cartTotals.total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      );

      const confirmed = await confirm(
        confirmContent,
        'Konfirmasi Pembayaran',
        {
          confirmText: 'Ya, Bayar',
          cancelText: 'Batal',
          configOverrides: {
            iconName: 'payments',
          }
        }
      );
      if (!confirmed) return;
    }

    setProcessing(true);
    setTimeout(async () => {
      const computedKembalian = payVal - cartTotals.total;

      addTransaction({
        items: cart.map((i) => ({
          id: i.id,
          nama_barang: i.nama,
          sku: i.id ? (products.find((p) => p.id === i.id)?.sku || '') : '',
          qty: i.qty,
          satuan: i.satuan_nama,
          harga: i.harga,
          subtotal: i.subtotal,
          gambar_url: i.gambar_url,
        })),
        total_harga: cartTotals.total,
        total_bayar: payVal,
        metode_pembayaran: paymentMethod.toLowerCase(),
        kasir: user?.name || 'User',
        kasir_id: user?.id || '',
      });

      if (status === 'Pending') {
        useTransactionStore.getState().transactions[0].status = 'pending';
        localStorage.setItem('waroengkoe_transactions', JSON.stringify(useTransactionStore.getState().transactions));
      }

      playSuccessSound();

      const receiptContent = (
        <div className="space-y-3 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-500">Total Belanja</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Rp {formatCurrency(cartTotals.subtotal)}</span>
          </div>

          {cartTotals.diskonItem + cartTotals.diskonGlobal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-500">Diskon</span>
              <span className="text-red-500 font-medium">- Rp {formatCurrency(cartTotals.diskonItem + cartTotals.diskonGlobal)}</span>
            </div>
          )}

          <div className="border-t border-dashed border-slate-400 dark:border-slate-700 my-2"></div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-500">Total Bayar</span>
            <span className="text-slate-900 dark:text-slate-100 font-bold">Rp {formatCurrency(cartTotals.total)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-500">Dibayar</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Rp {formatCurrency(status === 'Pending' ? 0 : payVal)}</span>
          </div>

          <div className="border-t-2 border-blue-200 dark:border-blue-500/20 my-2"></div>

          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3 -mx-1 border border-blue-100 dark:border-blue-500/20">
            <span className="text-blue-700 dark:text-blue-400 font-semibold">Kembalian</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">Rp {formatCurrency(status === 'Pending' ? 0 : computedKembalian)}</span>
          </div>
        </div>
      );

      await success(receiptContent, status === 'Pending' ? 'Transaksi Ditunda!' : 'Transaksi Berhasil!');

      handleClearCart();
      setBayar('');
      setCatatan('');
      setProcessing(false);
      onClose();
    }, 800);
  };

  const handleClearCartClick = async () => {
    if (cart.length === 0) return;

    const confirmed = await confirmDanger(
      `Yakin ingin mengosongkan keranjang? (${cart.length} item akan dihapus)`,
      'Kosongkan Keranjang',
      {
        confirmText: 'Ya, Kosongkan',
        cancelText: 'Batal'
      }
    );

    if (confirmed) {
      handleClearCart();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();

        if (paymentMethod === 'QRIS') {
          if (!processing) processPayment('Selesai');
          return;
        }

        if (document.activeElement !== payInputRef.current) {
          payInputRef.current?.focus();
        } else if (!bayar || parseInt(String(bayar).replace(/\D/g, '')) === 0) {
          // Stay focused
        } else {
          if (!processing) processPayment('Selesai');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMethod, bayar, processing]);

  // Sync cash input for QRIS
  useEffect(() => {
    if (paymentMethod === 'QRIS') {
      setBayar(String(cartTotals.total));
    } else {
      setBayar('');
    }
  }, [paymentMethod, cartTotals.total]);

  // Compute change (kembalian)
  const numericBayar = paymentMethod === 'QRIS' ? cartTotals.total : (parseInt(bayar.replace(/\D/g, '')) || 0);
  const kembalian = numericBayar - cartTotals.total;
  const showKembalian = numericBayar > 0;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-sans" static={preventClose || qrisModalOpen} onClose={(preventClose || qrisModalOpen) ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden lg:overflow-y-auto">
          <div className="flex h-full lg:min-h-full items-stretch justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex w-full h-full text-left transition-all bg-white dark:bg-slate-950 overflow-hidden shadow-2xl border-x-0 lg:border-x border-white/5">
                <div className="flex flex-col w-full h-full relative">
                  {/* Header */}
                  <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors flex items-center justify-between z-10">
                    <Dialog.Title className="font-black text-slate-900 dark:text-slate-100 transition-colors flex items-center gap-3 text-lg uppercase tracking-tight">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Icon name="shopping_cart" className="text-[#006eff] text-2xl" />
                      </div>
                      Keranjang
                      {cartCount > 0 && (
                        <span className="ml-1 px-3 py-1 bg-[#006eff] dark:bg-blue-600 text-white text-[11px] font-black rounded-full shadow-lg shadow-blue-500/20">{cartCount}</span>
                      )}
                    </Dialog.Title>
                    <div className="flex items-center gap-2">
                      {cart.length > 0 && (
                        <button
                          onClick={handleClearCartClick}
                          className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/10 cursor-pointer"
                        >
                          <Icon name="delete_sweep" className="text-xl" />
                          <span className="hidden sm:inline">Bersihkan</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="size-11 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-sm cursor-pointer"
                        onClick={onClose}
                      >
                        <Icon name="close" className="text-xl" />
                      </button>
                    </div>
                  </div>

                  {/* Main Content Layout */}
                  <div className="flex-1 bg-white dark:bg-slate-950 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-h-0 relative transition-colors">
                    {/* Left Column: Cart Items */}
                    <div className="flex-1 lg:col-span-7 flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 min-h-0 overflow-hidden transition-colors">
                      <div className="flex-1 overflow-y-auto p-3 lg:p-6 pb-2">
                        {cart.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-850 dark:text-slate-500 pt-10">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 shadow-inner">
                              <Icon name="help" className="text-4xl text-slate-400 dark:text-slate-700" />
                            </div>
                            <p className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Keranjang Kosong</p>
                            <p className="text-sm font-medium text-center max-w-[240px] mt-2 leading-relaxed">Pilih produk dari daftar untuk menambahkannya ke keranjang belanja Anda.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cart.map((item) => (
                              <CartItem
                                key={item.cartKey}
                                item={item}
                                formatCurrency={formatCurrency}
                                updateQty={updateQty}
                                updateCartItemQty={updateCartItemQty}
                                removeFromCart={removeFromCart}
                                updateSatuan={updateSatuan}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Payment Details */}
                    <div className="flex-none lg:flex-1 lg:col-span-5 flex flex-col lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 z-20 transition-colors overflow-hidden">
                      {cart.length > 0 && (
                        <>
                          {/* Mobile-only toggle button */}
                          <div className="p-4 lg:hidden bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-200 dark:border-slate-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentDetailsVisible(!isPaymentDetailsVisible);
                              }}
                              className="w-full flex justify-between items-center py-1 cursor-pointer"
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest">{isPaymentDetailsVisible ? 'Sembunyikan' : 'Tampilkan'} Rincian</span>
                                {!isPaymentDetailsVisible && (
                                  <span className="text-lg font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight mt-1">Total: Rp {formatCurrency(cartTotals.total)}</span>
                                )}
                              </div>
                              <div className={`size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 ${isPaymentDetailsVisible ? 'rotate-180' : 'animate-bounce'}`}>
                                <Icon name="chevron_left" className="text-2xl rotate-90" />
                              </div>
                            </button>
                          </div>

                          {/* Collapsible Payment Details */}
                          <div className={`transition-all duration-500 ease-in-out flex flex-col ${isPaymentDetailsVisible ? 'max-h-[70vh]' : 'max-h-0'} lg:max-h-full lg:flex-1 min-h-0 overflow-hidden`}>
                            <div className="overflow-y-auto p-6 space-y-6">
                              <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">Rincian Pembayaran</h3>
                                <div className="space-y-3">
                                  <div className="flex justify-between text-xs font-black uppercase tracking-widest transition-colors"><span className="text-slate-800 dark:text-slate-500">Subtotal</span><span className="text-slate-900 dark:text-slate-200">Rp {formatCurrency(cartTotals.subtotal)}</span></div>
                                  {cartTotals.diskonItem > 0 && (<div className="flex justify-between text-xs font-black uppercase tracking-widest transition-colors"><span className="text-slate-800 dark:text-slate-500">Diskon Item</span><span className="text-red-500 dark:text-red-400">-Rp {formatCurrency(cartTotals.diskonItem)}</span></div>)}
                                  {cartTotals.diskonGlobal > 0 && (<div className="flex justify-between text-xs font-black uppercase tracking-widest transition-colors"><span className="text-slate-800 dark:text-slate-500">Diskon Global</span><span className="text-red-500 dark:text-red-400">-Rp {formatCurrency(cartTotals.diskonGlobal)}</span></div>)}
                                  <div className="flex justify-between items-end pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors"><span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] pb-1">Total Belanja</span><span className="text-2xl font-black text-[#006eff] dark:text-blue-400 uppercase">Rp {formatCurrency(cartTotals.total)}</span></div>
                                </div>
                              </div>

                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="col-span-2 bg-slate-50/50 dark:bg-slate-850 p-1.5 flex rounded-[14px] border border-slate-200 dark:border-slate-800 transition-all shadow-inner relative">
                                    <div
                                      className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-lg bg-white dark:bg-slate-700 shadow-xl border border-blue-500/10 transition-all duration-300 ease-out ${paymentMethod === 'Tunai' ? 'left-1.5' : 'left-[calc(50%+0.125rem)]'}`}
                                    />
                                    <button
                                      onClick={() => setPaymentMethod('Tunai')}
                                      className={`relative flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 z-10 cursor-pointer ${paymentMethod === 'Tunai' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'} active:scale-[0.98] md:hover:scale-[1.02]`}
                                    >
                                      <Icon name="payments" className="text-xl" />
                                      Tunai
                                    </button>
                                    <button
                                      onClick={() => setPaymentMethod('QRIS')}
                                      className={`relative flex-1 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 z-10 cursor-pointer ${paymentMethod === 'QRIS' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'} active:scale-[0.98] md:hover:scale-[1.02]`}
                                    >
                                      <Icon name="qr_code_2" className="text-xl" />
                                      QRIS
                                    </button>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-500 mb-2 block uppercase tracking-widest ml-1">Potongan Global</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 dark:text-slate-600 uppercase">Rp</span>
                                      <input type="text" value={diskonGlobal && diskonGlobal !== '0' ? formatCurrency(parseInt(diskonGlobal)) : ''} onChange={(e) => setDiskonGlobal(Number(e.target.value.replace(/\D/g, '')) || 0)} placeholder="0" className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-right text-base font-black focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 outline-none transition-all placeholder:text-slate-350 shadow-sm" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-black text-slate-800 dark:text-slate-500 mb-2 block uppercase tracking-widest ml-1">Bayar Tunai</label>
                                    <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 dark:text-slate-600 uppercase">Rp</span>
                                      <input ref={payInputRef} type="text" value={paymentMethod === 'QRIS' ? formatCurrency(cartTotals.total) : (bayar ? formatCurrency(parseInt(bayar)) : '')} onChange={(e) => { if (paymentMethod === 'Tunai') setBayar(e.target.value.replace(/\D/g, '')) }} disabled={paymentMethod === 'QRIS'} placeholder="0" className={`w-full pl-10 pr-4 py-3 border rounded-lg text-slate-900 dark:text-slate-100 text-right text-base font-black focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-350 shadow-sm ${paymentMethod === 'QRIS' ? 'bg-slate-55 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`} />
                                    </div>
                                  </div>

                                  {paymentMethod === 'Tunai' && (
                                    <DenominationPanel bayar={bayar} setBayar={setBayar} total={cartTotals.total} />
                                  )}
                                </div>
                                <div>
                                  <label className="text-[11px] font-black text-slate-800 dark:text-slate-500 mb-2 block uppercase tracking-widest ml-1">Catatan Tambahan</label>
                                  <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tulis catatan transaksi jika ada..." className="w-full px-5 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-[#006eff]/20 focus:border-[#006eff]/50 outline-none resize-none h-24 lg:h-28 transition-all placeholder:text-slate-350 shadow-sm" />
                                </div>
                              </div>
                            </div>
                            {/* Footer with Payment buttons */}
                            <div className="flex-shrink-0 p-6 space-y-4 border-t border-slate-200 dark:border-slate-800 transition-colors bg-white dark:bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                              {showKembalian && (
                                <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800/60 transition-all shadow-inner relative overflow-hidden group">
                                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006eff]"></div>
                                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-500 uppercase tracking-[0.2em]">Kembalian Tunai</span>
                                  <span className={`font-black text-2xl lg:text-3xl transition-transform group-hover:scale-105 ${kembalian >= 0 ? 'text-[#006eff] dark:text-blue-400' : 'text-red-500'}`}>Rp {formatCurrency(Math.abs(kembalian))}</span>
                                </div>
                              )}
                              <div className="flex gap-3 lg:pt-2">
                                <button onClick={() => processPayment('Pending')} disabled={processing} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"><Icon name="hourglass_empty" className="text-2xl" />{processing ? '...' : 'Tunda'}</button>
                                <button onClick={() => processPayment('Selesai')} disabled={processing || (paymentMethod === 'Tunai' && kembalian < 0)} className="flex-[2] py-4 bg-[#006eff] hover:bg-[#0056c7] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer disabled:opacity-50"><Icon name="check_circle" className="text-2xl group-hover:scale-110 transition-transform" />{processing ? 'Memproses...' : (paymentMethod === 'QRIS' ? 'Proses QRIS' : 'Selesaikan Transaksi')}</button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      <QrisPaymentModal
        isOpen={qrisModalOpen}
        onClose={() => setQrisModalOpen(false)}
        onConfirm={async () => {
          processPayment('Selesai', true);
          setQrisModalOpen(false);
        }}
        amount={cartTotals.total}
        processing={processing}
      />
    </Transition.Root>
  );
}

interface CartItemProps {
  item: any;
  formatCurrency: (value: number | string) => string;
  updateQty: (key: string, amount: number) => void;
  updateCartItemQty: (key: string, qty: string) => void;
  removeFromCart: (key: string) => void;
  updateSatuan: (key: string, satuanId: string) => void;
}

const CartItem = memo(({ item, formatCurrency, updateQty, updateCartItemQty, removeFromCart, updateSatuan }: CartItemProps) => {
  const [localQty, setLocalQty] = useState(String(item.qty));

  useEffect(() => {
    setLocalQty(String(item.qty));
  }, [item.qty]);

  const handleQtyChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    setLocalQty(cleanVal);

    if (cleanVal !== '' && parseInt(cleanVal, 10) > 0) {
      updateCartItemQty(item.cartKey, cleanVal);
    }
  };

  const handleBlur = () => {
    if (localQty === '' || parseInt(localQty, 10) < 1) {
      setLocalQty(String(item.qty));
    }
  };

  return (
    <div className="w-full p-3 lg:p-5 bg-transparent lg:bg-white lg:dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:border lg:border-slate-200 lg:dark:border-slate-850 lg:rounded-2xl lg:shadow-sm transition-all hover:border-blue-500/30 group">
      <div className="flex gap-4 lg:gap-6">
        <div className="hidden lg:block size-16 lg:size-24 rounded-2xl bg-slate-50 dark:bg-slate-850 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800 transition-all shadow-inner group-hover:scale-105">
          {item.gambar_url && !item.gambar_url.startsWith('data:image/') ? <NetworkAwareImage src={item.gambar_url} alt={item.nama} className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800"><Icon name="inventory_2" className="text-3xl" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <OverflowMarquee className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {item.nama}
              </OverflowMarquee>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {item.satuans && item.satuans.length > 1 ? (
                  <CustomSelect
                    value={item.satuan_id}
                    onChange={(e) => updateSatuan(item.cartKey, e.target.value)}
                    buttonClassName="font-black uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-[#006eff] outline-none shadow-sm text-slate-800 dark:text-slate-400"
                    className="w-36"
                    options={item.satuans?.filter((s: any) => s.is_visible === true || s.id === item.satuan_id).map((s: any) => ({
                      value: s.id as string | number,
                      label: s.nama || s.nama_satuan || ''
                    }))}
                  />
                ) : <p className="text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-widest">{item.satuan_nama}</p>}
              </div>
            </div>

            {/* Mobile Action Row */}
            <div className="flex flex-col items-end gap-2 lg:hidden">
              <span className="text-sm font-black text-[#006eff] dark:text-blue-400">Rp {formatCurrency(item.subtotal)}</span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 transition-all shadow-inner">
                  <button onClick={() => updateQty(item.cartKey, -1)} className="w-6 h-6 flex items-center justify-center text-slate-900 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all font-black text-sm cursor-pointer">-</button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={localQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    onBlur={handleBlur}
                    className="w-8 text-center text-xs text-slate-900 dark:text-slate-100 font-black bg-transparent border-none p-0 focus:ring-0"
                  />
                  <button onClick={() => updateQty(item.cartKey, 1)} className="w-6 h-6 flex items-center justify-center text-slate-900 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm rounded-lg transition-all font-black text-sm cursor-pointer">+</button>
                </div>
                <button onClick={() => removeFromCart(item.cartKey)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"><Icon name="delete" className="text-[16px]" /></button>
              </div>
            </div>
          </div>

          <div className="hidden lg:block text-lg mt-2"><span className="text-[#006eff] dark:text-blue-400 font-black">Rp {formatCurrency(item.subtotal)}</span></div>
        </div>

        {/* Desktop Column Actions */}
        <div className="hidden lg:flex flex-col items-end justify-between py-1">
          <button onClick={() => removeFromCart(item.cartKey)} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shadow-sm cursor-pointer"><Icon name="delete" className="text-[20px]" /></button>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 p-1 transition-all shadow-inner mt-2">
            <button onClick={() => updateQty(item.cartKey, -1)} className="w-9 h-9 flex items-center justify-center text-slate-900 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-750 hover:shadow-sm rounded-lg transition-all font-black text-lg cursor-pointer">-</button>
            <input
              type="text"
              inputMode="numeric"
              value={localQty}
              onChange={(e) => handleQtyChange(e.target.value)}
              onBlur={handleBlur}
              className="w-12 text-center text-sm text-slate-900 dark:text-slate-100 font-black bg-transparent border-none p-0 focus:ring-0"
            />
            <button onClick={() => updateQty(item.cartKey, 1)} className="w-9 h-9 flex items-center justify-center text-slate-900 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-750 hover:shadow-sm rounded-lg transition-all font-black text-lg cursor-pointer">+</button>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

const DENOMINATIONS = [
  { value: 500, label: '500' },
  { value: 1000, label: '1.000' },
  { value: 2000, label: '2.000' },
  { value: 5000, label: '5.000' },
  { value: 10000, label: '10.000' },
  { value: 20000, label: '20.000' },
  { value: 50000, label: '50.000' },
  { value: 100000, label: '100.000' },
];

interface DenominationPanelProps {
  bayar: string;
  setBayar: (bayar: string) => void;
  total: number;
}

function DenominationPanel({ bayar, setBayar, total }: DenominationPanelProps) {
  const currentAmount = parseInt(String(bayar).replace(/\D/g, '')) || 0;

  const handleUangPas = () => {
    setBayar(String(total));
  };

  const handleAdd = (value: number) => {
    setBayar(String(currentAmount + value));
  };

  const handleReset = () => {
    setBayar('');
  };

  return (
    <div className="col-span-2 mt-1">
      <button
        type="button"
        onClick={handleUangPas}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 mb-4 rounded-xl bg-[#006eff] hover:bg-[#0056c7] text-white text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer animate-pulse"
      >
        <Icon name="payments" className="text-lg" />
        Bayar Uang Pas: Rp {formatCurrency(total)}
      </button>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-widest ml-1">
          Pecahan Uang
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {DENOMINATIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleAdd(value)}
            className="flex items-center justify-center py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-300 dark:hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-300 text-xs font-black transition-all active:scale-[0.98] active:bg-blue-100 dark:active:bg-blue-500/20 select-none shadow-sm cursor-pointer"
          >
            Rp {label}
          </button>
        ))}
      </div>

      {currentAmount > 0 && (
        <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total dipilih</span>
          <span className="text-sm font-black text-blue-700 dark:text-blue-300">Rp {formatCurrency(currentAmount)}</span>
        </div>
      )}
    </div>
  );
}
