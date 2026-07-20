import { useState, useEffect, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Icon from '@/components/Icon';

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID').format(value);

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  amount: number;
  qrisStatic?: any;
  processing?: boolean;
}

export default function QrisPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  qrisStatic,
  processing: externalProcessing = false
}: QrisPaymentModalProps) {
  const [qrImage, setQrImage] = useState('');
  const [qrDownload, setQrDownload] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && amount > 0) {
      generateQris();
    }
  }, [isOpen, amount, qrisStatic]);

  const generateQris = () => {
    setLoading(true);
    setError('');
    
    // Mock the backend QRIS generation client-side using a free QR code generator API
    setTimeout(() => {
      try {
        const payload = `WaroengKoe_INV_${Date.now()}_Total_Rp${amount}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;
        setQrImage(`<img src="${qrUrl}" alt="QRIS" class="w-full h-full object-contain" />`);
        setQrDownload(qrUrl);
        setLoading(false);
      } catch {
        setError('Gagal generate QRIS');
        setLoading(false);
      }
    }, 800);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  };

  const handleDownload = () => {
    if (!qrDownload) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `QRIS_Rp${formatCurrency(amount)}.png`;
      link.href = qrDownload;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999] font-sans" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-transparent lg:bg-transparent transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden lg:overflow-y-auto">
          <div className="flex h-full lg:min-h-full items-stretch lg:items-center justify-center text-center lg:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex w-full h-full lg:h-auto lg:max-w-4xl lg:rounded-3xl text-left transition-all bg-white dark:bg-slate-950 overflow-hidden shadow-2xl lg:border lg:border-white/10 lg:ring-1 lg:ring-black/5">
                <div className="flex flex-col w-full h-full lg:h-auto relative">
                  {/* Header */}
                  <div className="flex-shrink-0 p-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors flex items-center justify-between z-10">
                    <Dialog.Title className="font-black text-slate-900 dark:text-slate-100 transition-colors flex items-center gap-3 text-lg uppercase tracking-tight">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Icon name="qr_code_2" className="text-[#006eff] text-2xl" />
                      </div>
                      Pembayaran QRIS
                    </Dialog.Title>
                    <button
                      type="button"
                      className="size-11 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-sm cursor-pointer"
                      onClick={onClose}
                    >
                      <Icon name="close" className="text-xl" />
                    </button>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 transition-colors lg:overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-stretch min-h-full lg:min-h-0">
                      {/* Left: QR Code */}
                      <div className="flex flex-col items-center justify-center p-6 lg:p-10 lg:flex-1 lg:border-r lg:border-slate-200 lg:dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col items-center border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
                          {loading ? (
                            <div className="w-56 h-56 lg:w-64 lg:h-64 flex flex-col items-center justify-center">
                              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-400">Generating QRIS...</p>
                            </div>
                          ) : error ? (
                            <div className="w-56 h-56 lg:w-64 lg:h-64 flex flex-col items-center justify-center text-center">
                              <Icon name="error" className="text-4xl text-red-400 mb-3" />
                              <p className="text-sm text-red-500 mb-4">{error}</p>
                              <button
                                type="button"
                                onClick={generateQris}
                                className="px-5 py-2.5 bg-blue-500 dark:bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors cursor-pointer"
                              >
                                Coba Lagi
                              </button>
                            </div>
                          ) : qrImage ? (
                            <div
                              ref={qrContainerRef}
                              className="w-56 h-56 lg:w-64 lg:h-64 flex items-center justify-center bg-white rounded-2xl p-3 transition-all select-none"
                              dangerouslySetInnerHTML={{ __html: qrImage }}
                            />
                          ) : (
                            <div className="w-56 h-56 lg:w-64 lg:h-64 flex flex-col items-center justify-center text-center">
                              <Icon name="qr_code_2" className="text-4xl text-slate-400 mb-3" />
                              <p className="text-sm text-slate-500">QR Code akan muncul di sini</p>
                            </div>
                          )}
                        </div>

                        {qrImage && !loading && !error && (
                          <div className="mt-6 flex flex-col items-center gap-4">
                            <div className="text-center">
                              <p className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.3em] leading-none">WaroengKoe!</p>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 mt-2 uppercase tracking-widest">
                                Dana • OVO • GoPay • LinkAja
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleDownload}
                              disabled={downloading}
                              className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                              <Icon name="download" className="text-base" />
                              {downloading ? 'Mengunduh...' : 'Simpan QR'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Info + Steps */}
                      <div className="flex flex-col justify-center p-8 lg:p-12 lg:flex-1 gap-8">
                        <div>
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-widest mb-2">Total Pembayaran</p>
                          <p className="text-4xl lg:text-5xl font-black text-[#006eff] dark:text-blue-400 tracking-tight">
                            Rp {formatCurrency(amount)}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-widest mb-3">Cara Bayar</p>
                          {[
                            'Buka aplikasi m-banking / e-wallet',
                            'Arahkan kamera ke QR Code',
                            'Pastikan nominal sesuai & konfirmasi',
                          ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3.5">
                              <span className="w-7 h-7 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black ring-1 ring-blue-200 dark:ring-blue-500/20">{i + 1}</span>
                              <span className="text-slate-700 dark:text-slate-300 text-[13px] font-bold">{step}</span>
                            </div>
                          ))}
                        </div>

                        <div className="hidden lg:flex gap-4 mt-4">
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200/50 dark:border-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Icon name="close" className="text-lg" />
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading || !!error || confirming || externalProcessing}
                            className="flex-[2] py-4 bg-[#006eff] dark:bg-blue-600 hover:bg-[#0056c7] dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-[0.98] group cursor-pointer"
                          >
                            <Icon name="check_circle" className="text-lg group-hover:scale-110 transition-transform" />
                            {confirming || externalProcessing ? 'Memproses...' : 'Konfirmasi Bayar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer - mobile only */}
                  <div className="flex-shrink-0 p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 z-10 transition-colors shadow-[0_-10px_20px_rgba(0,0,0,0.02)] lg:hidden">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200/50 dark:border-red-500/20 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1 cursor-pointer"
                    >
                      <Icon name="close" className="text-2xl" />
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={loading || !!error || confirming || externalProcessing}
                      className="flex-[2] py-4 bg-[#006eff] dark:bg-blue-600 hover:bg-[#0056c7] dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 active:scale-[0.98] group cursor-pointer"
                    >
                      <Icon name="check_circle" className="text-2xl group-hover:scale-110 transition-transform" />
                      {confirming || externalProcessing ? 'Memproses...' : 'Konfirmasi Bayar'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
