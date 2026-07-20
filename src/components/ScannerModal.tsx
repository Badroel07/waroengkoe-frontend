import { useState, useEffect, useRef, Fragment, type MouseEvent } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Icon from '@/components/Icon';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';

interface TempCartItem {
  sku: string;
  nama: string;
  id: number;
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'batch' | 'single';
  onScanResult?: (code: string) => void;
  scanDelay?: number;
}

export default function ScannerModal({ isOpen, onClose, mode = 'batch', onScanResult, scanDelay = 1500 }: ScannerModalProps) {
  const [barcode, setBarcode] = useState('');
  const [tempCart, setTempCart] = useState<TempCartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [nativeZoom, setNativeZoom] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 5, step: 0.1 });
  const [zoomValue, setZoomValue] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef(0);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  
  const products = useProductStore((s) => s.products);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (isOpen) {
      setTempCart([]);
      setBarcode('');
      setActiveTab('camera');
      setCameraError(null);
      setTorchOn(false);
      setTorchSupported(false);
      setZoomSupported(false);
      setNativeZoom(false);
      setZoomValue(1);
      lastScanTimeRef.current = 0;
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const stopScanner = async () => {
    const scanner = scannerInstanceRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (state === 2) {
        await scanner.stop();
      }
      if (scannerInstanceRef.current) {
        scanner.clear();
      }
    } catch (err: any) {
      if (!err.toString().includes("transition")) {
        console.error("Failed to stop scanner cleanly", err);
      }
    } finally {
      const video = document.querySelector('#reader video') as HTMLVideoElement | null;
      if (video) {
        video.style.transform = '';
      }
      scannerInstanceRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (isOpen && activeTab === 'camera') {
      const timeoutId = setTimeout(async () => {
        const element = document.getElementById("reader");
        if (!element) return;

        await stopScanner();
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode("reader", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
          ],
          verbose: false
        });
        scannerInstanceRef.current = html5QrCode;

        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length) {
            if (isMounted) {
              await html5QrCode.start(
                { facingMode: "environment" },
                {
                  fps: 20,
                  qrbox: (viewfinderWidth, viewfinderHeight) => {
                    return { width: viewfinderWidth * 0.8, height: viewfinderHeight * 0.4 };
                  },
                  aspectRatio: undefined,
                  disableFlip: true,
                },
                (decodedText) => {
                  if (isMounted) onScanSuccess(decodedText);
                },
                () => { }
              );

              setPermissionGranted(true);

              setTimeout(() => {
                try {
                  const stream = (document.querySelector('video') as HTMLVideoElement | null)?.srcObject as MediaStream | null;
                  const track = stream?.getVideoTracks()[0];

                  if (track) {
                    const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    setTorchSupported(!!caps.torch || isMobile);

                    if (caps.zoom) {
                      setNativeZoom(true);
                      setZoomRange({
                        min: caps.zoom.min || 1,
                        max: caps.zoom.max || 5,
                        step: caps.zoom.step || 0.1
                      });
                      setZoomValue(caps.zoom.min || 1);
                    } else {
                      setNativeZoom(false);
                      setZoomRange({ min: 1, max: 4, step: 0.1 });
                      setZoomValue(1);
                    }
                    setZoomSupported(true);
                  } else {
                    setTorchSupported(true);
                    setZoomSupported(true);
                    setNativeZoom(false);
                    setZoomRange({ min: 1, max: 4, step: 0.1 });
                    setZoomValue(1);
                  }
                } catch {
                  setTorchSupported(true);
                  setZoomSupported(true);
                  setNativeZoom(false);
                  setZoomRange({ min: 1, max: 4, step: 0.1 });
                  setZoomValue(1);
                }
              }, 1000);
            }
          } else {
            if (isMounted) setCameraError("Tidak ada kamera yang terdeteksi.");
          }
        } catch {
          if (isMounted) {
            setCameraError("Gagal mengakses kamera. Mohon izinkan akses.");
            setPermissionGranted(false);
          }
        }
      }, 500);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        stopScanner();
      };
    } else if (activeTab === 'manual' && isOpen) {
      stopScanner();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  const beepSound = useRef(new Audio('/audio/barcode_beep.mp3'));

  const playBeep = () => {
    try {
      beepSound.current.currentTime = 0;
      beepSound.current.play().catch(() => { });
    } catch {}
  };

  const onScanSuccess = (decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < scanDelay) {
      return;
    }
    lastScanTimeRef.current = now;

    if (mode === 'single') {
      playBeep();
      if (onScanResult) {
        onScanResult(decodedText);
      }
      onClose();
    } else {
      validateAndAdd(decodedText);
    }
  };

  const toggleTorch = async () => {
    if (!scannerInstanceRef.current) return;
    try {
      const newTorchStatus = !torchOn;
      await (scannerInstanceRef.current as any).applyVideoConstraints({
        advanced: [{ torch: newTorchStatus }]
      });
      setTorchOn(newTorchStatus);
    } catch {}
  };

  const applyZoom = async (newValue: number) => {
    const clamped = Math.min(Math.max(newValue, zoomRange.min), zoomRange.max);
    const rounded = Math.round(clamped * 10) / 10;
    setZoomValue(rounded);

    if (nativeZoom) {
      try {
        const stream = (document.querySelector('video') as HTMLVideoElement | null)?.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          await track.applyConstraints({ advanced: [{ zoom: rounded }] } as any);
        }
      } catch {}
    } else {
      const video = document.querySelector('#reader video') as HTMLVideoElement | null;
      if (video) {
        video.style.transform = `scale(${rounded})`;
        video.style.transformOrigin = 'center center';
      }
    }
  };

  const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await applyZoom(parseFloat(e.target.value));
  };

  const stepZoom = async (direction: 'in' | 'out') => {
    const step = nativeZoom ? zoomRange.step : 0.5;
    await applyZoom(zoomValue + (direction === 'in' ? step : -step));
  };

  const getZoomPresets = () => {
    const list = [{ label: '1x', value: 1.0 }];
    if (zoomRange.max >= 2.0) {
      list.push({ label: '2x', value: 2.0 });
    }
    if (zoomRange.max >= 3.0) {
      list.push({ label: '3x', value: 3.0 });
    }
    if (zoomRange.max >= 4.0) {
      list.push({ label: '4x', value: 4.0 });
    }
    return list;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomValue;
    }
  };

  const handleTouchMove = async (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newZoom = touchStartZoomRef.current * factor;
      await applyZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const triggerFocus = async (e: MouseEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    if (!scannerInstanceRef.current) return;
    const ripple = document.createElement('div');
    ripple.className = 'absolute border-2 border-white/50 rounded-full w-16 h-16 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-ping z-30';
    ripple.style.left = `${e.nativeEvent.offsetX}px`;
    ripple.style.top = `${e.nativeEvent.offsetY}px`;
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1000);

    try {
      const stream = (document.querySelector('video') as HTMLVideoElement | null)?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [
            { focusMode: "manual", focusDistance: 0 },
            { focusMode: "continuous" }
          ]
        } as any);
      }
    } catch {}
  };

  const validateAndAdd = (sku: string) => {
    if (!sku) return;
    setScanError(null);

    const product = products.find((p) => p.sku === sku && p.status === 'aktif');
    if (product) {
      playBeep();
      const newItem: TempCartItem = {
        sku: sku,
        nama: product.nama,
        id: Date.now()
      };
      setTempCart((prev) => [newItem, ...prev]);
      setBarcode('');
    } else {
      setScanError(`SKU "${sku}" tidak ditemukan di database atau nonaktif.`);
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const handleManualInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcode.trim() !== '') {
        if (mode === 'single') {
          playBeep();
          if (onScanResult) onScanResult(barcode.trim());
          onClose();
        } else {
          validateAndAdd(barcode.trim());
        }
      }
    }
  };

  const handleFinishBatch = () => {
    if (tempCart.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      tempCart.forEach((item) => {
        const product = products.find((p) => p.sku === item.sku);
        if (product) {
          const defaultUnit = product.satuans.find((u) => u.is_default) || product.satuans[0];
          if (defaultUnit) {
            addItem({ id: product.id, nama: product.nama, satuan: defaultUnit });
          }
        }
      });
      setIsProcessing(false);
      onClose();
    }, 500);
  };

  const removeTempItem = (id: number) => {
    setTempCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 font-sans" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/95 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden">
          <div className="flex h-full items-stretch justify-center text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex w-full h-full text-left transition-all bg-white dark:bg-slate-950 overflow-hidden shadow-2xl">
                <div className="flex flex-col w-full h-full relative">
                  <div className="flex-shrink-0 p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors flex items-center justify-between z-10">
                    <Dialog.Title className="font-black text-slate-900 dark:text-slate-100 transition-colors flex items-center gap-2 lg:gap-3 text-sm lg:text-lg uppercase tracking-tight">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Icon name={mode === 'batch' ? 'barcode_reader' : 'qr_code_scanner'} className="text-[#006eff] text-lg lg:text-2xl" />
                      </div>
                      {mode === 'batch' ? 'Batch Scanner' : 'Product Scanner'}
                      {tempCart.length > 0 && mode === 'batch' && (
                        <span className="ml-1 px-2 py-0.5 lg:px-3 lg:py-1 bg-[#006eff] dark:bg-blue-600 text-white text-[8px] lg:text-[11px] font-black rounded-full shadow-lg shadow-blue-500/20">{tempCart.length}</span>
                      )}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="size-9 lg:size-11 flex items-center justify-center rounded-lg lg:rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-sm"
                      onClick={onClose}
                    >
                      <Icon name="close" className="text-lg lg:text-xl" />
                    </button>
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-950 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 min-h-0 relative transition-colors">
                    <div className="flex-none h-[40vh] lg:h-full lg:col-span-7 flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 min-h-0 overflow-hidden transition-colors">
                      <div className="p-2 lg:p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl lg:rounded-2xl max-w-sm mx-auto shadow-inner">
                          <button
                            onClick={() => setActiveTab('camera')}
                            className={`flex-1 py-2 lg:py-3 rounded-lg lg:rounded-2xl text-[8px] lg:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'camera' ? 'bg-white dark:bg-slate-700 text-[#006eff] dark:text-blue-400 shadow-lg border border-blue-500/10' : 'text-slate-600 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                          >
                            <Icon name="videocam" className="text-base lg:text-xl" />
                            Kamera
                          </button>
                          <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 py-2 lg:py-3 rounded-lg lg:rounded-2xl text-[8px] lg:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 text-[#006eff] dark:text-blue-400 shadow-lg border border-blue-500/10' : 'text-slate-600 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
                          >
                            <Icon name="keyboard" className="text-base lg:text-xl" />
                            Manual
                          </button>
                        </div>
                      </div>

                      {scanError && (
                        <div className="bg-red-500 text-white text-[11px] font-black uppercase tracking-widest py-3 px-6 text-center animate-pulse z-20">
                          {scanError}
                        </div>
                      )}

                      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                        {activeTab === 'camera' ? (
                          <div 
                            className="w-full h-full max-w-3xl aspect-[1/1] lg:aspect-video rounded-2xl bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/10 group" 
                            onClick={triggerFocus}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            {cameraError ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white space-y-4">
                                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                  <Icon name="videocam_off" className="text-4xl text-red-500" />
                                </div>
                                <p className="font-bold text-lg uppercase tracking-tight">{cameraError}</p>
                                <button onClick={() => setActiveTab('manual')} className="px-8 py-3.5 bg-white text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-[0.98]">Gunakan Input Manual</button>
                              </div>
                            ) : (
                              <>
                                <div id="reader" className="w-full h-full grayscale-[10%] brightness-[1.05] overflow-hidden [&_#qr-shaded-region]:!border-none [&_#qr-shaded-region_>_div]:!hidden [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!transition-transform [&_video]:!duration-200 [&_canvas]:!hidden"></div>
 
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-12 z-20">
                                  <div className="w-full max-w-md aspect-[2/1] border-2 border-white/20 rounded-2xl relative">
                                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
 
                                    <div className="absolute top-0 left-8 right-8 h-1 bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scanner-line opacity-80"></div>
                                  </div>
                                </div>
 
                                {permissionGranted && torchSupported && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleTorch(); }} 
                                    className={`absolute top-4 right-4 z-30 size-11 rounded-full flex items-center justify-center transition-all border shadow-lg ${
                                      torchOn 
                                        ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-yellow-500/40' 
                                        : 'bg-black/40 text-white border-white/10 hover:bg-black/60'
                                    }`}
                                  >
                                    <Icon name={torchOn ? 'flash_on' : 'flash_off'} className="text-xl" />
                                  </button>
                                )}
 
                                <div className="absolute bottom-5 left-0 right-0 z-20 flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  {zoomValue > 1.05 && (
                                    <span className="text-[11px] font-black text-white bg-black/60 px-2.5 py-1 rounded-full border border-white/10 shadow-sm animate-fade-in pointer-events-none">
                                      {zoomValue.toFixed(1)}×
                                    </span>
                                  )}
                                  
                                  {permissionGranted && zoomSupported && (
                                    <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
                                      {getZoomPresets().map((preset) => {
                                        const isCurrent = Math.abs(zoomValue - preset.value) < 0.15;
                                        return (
                                          <button
                                            key={preset.label}
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              await applyZoom(preset.value);
                                            }}
                                            className={`size-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                              isCurrent 
                                                ? 'bg-[#006eff] text-white shadow-md shadow-blue-500/30 scale-110' 
                                                : 'bg-black/50 text-white/90 hover:bg-black/70 hover:scale-105 border border-white/10'
                                            }`}
                                          >
                                            {preset.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="w-full max-w-xs animate-fade-in text-center px-4 space-y-4">
                            <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-500/20">
                              <Icon name="barcode" className="text-2xl text-[#006eff]" />
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Input SKU Manual</h4>
                              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-snug">Masukkan kode barcode atau SKU barang</p>
                            </div>

                            <input
                              ref={inputRef}
                              type="text"
                              value={barcode}
                              onChange={(e) => setBarcode(e.target.value)}
                              onKeyDown={handleManualInput}
                              className="w-full px-5 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-xl font-black text-center tracking-[0.2em] focus:border-[#006eff] focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800 shadow-lg dark:shadow-none"
                              placeholder="000000"
                              autoFocus
                            />

                            <div className="flex items-center justify-center gap-2 text-slate-300 dark:text-slate-700">
                              <div className="h-px w-8 bg-current" />
                              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600">Tekan ENTER</p>
                              <div className="h-px w-8 bg-current" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 lg:col-span-5 flex flex-col lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 z-20 transition-colors overflow-hidden">
                      {mode === 'batch' ? (
                        <>
                          <div className="p-4 lg:p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors flex items-center justify-between">
                            <div className="space-y-0.5 lg:space-y-1">
                              <h3 className="text-[8px] lg:text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] lg:tracking-[0.3em] ">Daftar Pemindaian</h3>
                              <p className="text-sm lg:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{tempCart.length} <span className="text-[11px] lg:text-sm text-slate-400">Barang</span></p>
                            </div>
                            {tempCart.length > 0 && (
                              <button
                                onClick={() => setTempCart([])}
                                className="size-9 lg:size-12 rounded-xl lg:rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                title="Bersihkan Semua"
                              >
                                <Icon name="delete_sweep" className="text-lg lg:text-2xl" />
                              </button>
                            )}
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/30 dark:bg-slate-950/20 transition-colors">
                            <div className="space-y-2 lg:space-y-4">
                              {tempCart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-600 py-10 lg:py-20">
                                  <div className="size-16 lg:size-24 rounded-xl lg:rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 lg:mb-8 shadow-inner border border-dashed border-slate-400 dark:border-slate-800">
                                    <Icon name="view_in_ar" className="text-3xl lg:text-5xl text-slate-400 dark:text-slate-700" />
                                  </div>
                                  <p className="text-[11px] lg:text-sm font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] mb-1">Daftar Kosong</p>
                                  <p className="text-[8px] lg:text-[11px] uppercase tracking-widest font-bold opacity-50">Silakan scan barang</p>
                                </div>
                              ) : (
                                tempCart.map((item, index) => (
                                  <div key={item.id} className="w-full p-3 lg:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl lg:rounded-2xl shadow-sm transition-all hover:border-[#006eff]/30 group flex items-center gap-3 lg:gap-5 animate-slide-in relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 lg:w-1.5 h-full bg-[#006eff] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="size-8 lg:size-12 rounded-lg lg:rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/10 shrink-0 text-xs lg:text-sm">
                                      {tempCart.length - index}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs lg:text-base font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">{item.nama}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Icon name="barcode" className="text-[11px] text-slate-400" />
                                        <p className="text-[8px] lg:text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.1em] lg:tracking-[0.2em]">{item.sku}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => removeTempItem(item.id)} className="size-8 lg:size-11 rounded-lg lg:rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-700 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all">
                                      <Icon name="delete" className="text-base lg:text-xl" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 p-4 lg:p-8 space-y-4 border-t border-slate-200 dark:border-slate-800 transition-colors bg-white dark:bg-slate-900 shadow-[0_-15px_30px_rgba(0,0,0,0.03)] z-10">
                            <div className="flex gap-2 lg:gap-4">
                              <button
                                onClick={onClose}
                                className="flex-1 py-3 lg:py-5 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 text-[8px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] rounded-xl lg:rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                              >
                                Batal
                              </button>
                              <button
                                onClick={handleFinishBatch}
                                disabled={tempCart.length === 0 || isProcessing}
                                className={`flex-[2.5] py-3 lg:py-5 rounded-xl lg:rounded-xl text-white text-[8px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] shadow-xl flex items-center justify-center gap-2 lg:gap-3 transition-all active:scale-[0.98] group relative overflow-hidden ${tempCart.length === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600' : 'bg-[#006eff] hover:bg-[#0056c7] shadow-blue-500/30'}`}
                              >
                                <Icon name={isProcessing ? 'hourglass_top' : 'check_circle'} className={`${isProcessing ? 'animate-spin' : 'group-hover:scale-110'} text-lg lg:text-2xl transition-transform`} />
                                {isProcessing ? 'Proses...' : `Simpan ke Kasir`}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 bg-white dark:bg-slate-950 transition-colors">
                          <div className="size-32 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center border border-amber-100 dark:border-amber-500/20 shadow-inner group">
                            <Icon name="qr_code_scanner" className="text-6xl text-amber-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-tight">Single Scan Mode</h3>
                            <p className="text-sm text-slate-500 max-w-sm leading-relaxed mx-auto italic">Pindai barcode apa pun untuk segera menemukan barang dan menambahkannya ke keranjang.</p>
                          </div>
                          <div className="w-full max-w-xs pt-8 border-t border-slate-100 dark:border-slate-900 transition-colors">
                            <button onClick={onClose} className="w-full py-5 bg-red-50 dark:bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl border border-red-100 dark:border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-[0.98]">Selesai Memindai</button>
                          </div>
                        </div>
                      )}
                    </div>
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
