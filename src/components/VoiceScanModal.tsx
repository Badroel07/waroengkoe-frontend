import { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Icon from '@/components/Icon';
import { useProductStore } from '@/store/productStore';
import type { Product } from '@/types';

const MAX_RECORDING_SECONDS = 60;

interface VoiceResultItem {
  product: Product;
  qty: number;
  query: string;
  satuan_id?: string | null;
  stock_warning?: boolean;
}

interface VoiceAmbiguousGroup {
  query: string;
  qty: number;
  unit?: string | null;
  products: Product[];
}

interface VoiceAddItem {
  product: Product;
  qty: number;
  satuan_id?: string | null;
  stock_warning?: boolean;
}

interface VoiceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: VoiceAddItem[]) => void;
}

type Step = 'testing' | 'idle' | 'listening' | 'processing' | 'result';

export default function VoiceScanModal({ isOpen, onClose, onAddItems }: VoiceScanModalProps) {
  const [step, setStep] = useState<Step>('testing');
  const [transcript, setTranscript] = useState('');
  const [results, setResults] = useState<{
    items: VoiceResultItem[];
    ambiguous: (VoiceAmbiguousGroup & { selectedIndex: number | null })[];
    unmatched: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const products = useProductStore((s) => s.products);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
    }
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const poll = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg);
        animFrameRef.current = requestAnimationFrame(poll);
      };
      animFrameRef.current = requestAnimationFrame(poll);
      return stream;
    } catch {
      return null;
    }
  };

  const stopAudioVisualizer = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    try {
      audioContextRef.current?.close();
    } catch {}
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  const testConnection = () => {
    setError(null);
    setStep('testing');
    setTimeout(() => {
      setStep('idle');
    }, 800);
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopAudioVisualizer();
  }, []);

  // Client-side fuzzy matching for products
  const matchProducts = (text: string) => {
    setStep('processing');
    
    // Simple parser: split by comma or "dan"
    const commands = text.toLowerCase().split(/,|dan/);
    const parsedItems: VoiceResultItem[] = [];
    const ambiguousGroups: VoiceAmbiguousGroup[] = [];
    const unmatchedItems: string[] = [];

    commands.forEach((cmd) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;

      // Extract quantity (number) if exists
      const numMatch = trimmed.match(/(\d+)/);
      const qty = numMatch ? parseInt(numMatch[1], 10) : 1;
      
      // Clean query by removing the quantity number and common words
      const query = trimmed.replace(/\d+/g, '').replace(/(buah|pcs|bungkus|pack|dus|kg|liter)/g, '').trim();
      if (!query) return;

      // Search products
      const matches = products.filter((p) => 
        p.nama.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
      );

      if (matches.length === 1) {
        const product = matches[0];
        const defaultUnit = product.satuans.find((u) => u.is_default) || product.satuans[0];
        parsedItems.push({
          product,
          qty,
          query: trimmed,
          satuan_id: defaultUnit?.id || null,
          stock_warning: product.stok < qty,
        });
      } else if (matches.length > 1) {
        ambiguousGroups.push({
          query: trimmed,
          qty,
          products: matches,
        });
      } else {
        unmatchedItems.push(trimmed);
      }
    });

    setTimeout(() => {
      setResults({
        items: parsedItems,
        ambiguous: ambiguousGroups.map((g) => ({ ...g, selectedIndex: null })),
        unmatched: unmatchedItems,
      });
      setStep('result');
    }, 600);
  };

  const startRecording = useCallback(async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      const stream = await startAudioVisualizer();

      recognition.onstart = () => {
        setStep('listening');
        setRecordingTime(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        matchProducts(resultText);
      };

      recognition.onerror = (event: any) => {
        setError('Gagal mengenali suara: ' + event.error);
        setStep('idle');
        stopRecording();
      };

      recognition.onend = () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        stopRecording();
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setError('Gagal mengakses mikrofon. Pastikan Anda memberikan izin akses.');
      setStep('idle');
    }
  }, [products]);

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setResults(null);
      setError(null);
      testConnection();
    } else {
      stopRecording();
    }
  }, [isOpen, stopRecording]);

  const handleStartListening = () => {
    setTranscript('');
    setResults(null);
    setError(null);
    startRecording();
  };

  const handleSelectAmbiguous = (groupIndex: number, productIndex: number) => {
    setResults((prev) => {
      if (!prev) return prev;
      const ambiguous = [...prev.ambiguous];
      ambiguous[groupIndex] = { ...ambiguous[groupIndex], selectedIndex: productIndex };
      return { ...prev, ambiguous };
    });
  };

  const handleConfirmAll = () => {
    if (!results) return;

    const selectedItems: VoiceAddItem[] = [];

    results.items.forEach((item) => {
      selectedItems.push({
        product: item.product,
        qty: item.qty,
        satuan_id: item.satuan_id ?? null,
        stock_warning: item.stock_warning ?? false,
      });
    });

    results.ambiguous.forEach((g) => {
      if (g.selectedIndex !== null) {
        const selectedProd = g.products[g.selectedIndex];
        const defaultUnit = selectedProd.satuans.find((u) => u.is_default) || selectedProd.satuans[0];
        selectedItems.push({
          product: selectedProd,
          qty: g.qty,
          satuan_id: defaultUnit?.id || null,
        });
      }
    });

    if (selectedItems.length > 0) {
      onAddItems(selectedItems);
    }

    onClose();
  };

  const SpeechNotSupported = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-4">
      <div className="size-20 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
        <Icon name="mic_off" className="text-4xl text-red-500" />
      </div>
      <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
        Browser Tidak Mendukung
      </p>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        Fitur ini memerlukan akses mikrofon. Gunakan browser modern atau scan manual.
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 bg-[#006eff] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all"
      >
        Tutup
      </button>
    </div>
  );

  const TestingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-5">
      {error ? (
        <>
          <div className="size-20 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20 animate-bounce">
            <Icon name="error_outline" className="text-4xl text-red-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            Tes API AI Gagal
          </p>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            Fitur Voice Scan tidak dapat digunakan karena tes koneksi API/Model AI gagal: {error}
          </p>
          <div className="pt-2 flex gap-3 w-full max-w-xs">
            <button
              onClick={testConnection}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
            >
              Coba Lagi
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
            >
              Tutup
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
            <Icon name="auto_awesome" className="text-3xl text-[#006eff] animate-pulse" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            Mengetes Koneksi AI...
          </p>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            Memeriksa apakah API model AI siap merespons perintah suara Anda.
          </p>
        </>
      )}
    </div>
  );

  const IdleState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-6">
      <button
        onClick={handleStartListening}
        className="size-28 rounded-full bg-[#006eff] hover:bg-[#0056c7] text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 transition-all active:scale-[0.98] hover:scale-105"
      >
        <Icon name="keyboard_voice" className="text-5xl" />
      </button>
      <div className="space-y-1">
        <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
          Voice Scan
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Tekan tombol mikrofon, lalu sebutkan nama barang beserta jumlahnya.
        </p>
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 max-w-sm w-full text-left">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2">Contoh:</p>
        <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#006eff]" />
            "indomie goreng 2, coca cola 3"
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#006eff]" />
            "susu ultra 1, aqua 2, beras 5kg 1"
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#006eff]" />
            "telur 1 kg dan minyak goreng 2"
          </li>
        </ul>
      </div>
    </div>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ListeningState = () => {
    const levelPct = Math.min(100, Math.round((audioLevel / 255) * 100));
    const remainingPct = ((MAX_RECORDING_SECONDS - recordingTime) / MAX_RECORDING_SECONDS) * 100;

    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-6">
        <div className="relative flex items-center justify-center py-6">
          <div
            className="absolute rounded-full bg-[#006eff]/10 dark:bg-[#006eff]/5 transition-all duration-75"
            style={{
              width: `${6 + (levelPct / 100) * 6}rem`,
              height: `${6 + (levelPct / 100) * 6}rem`,
              opacity: 0.15 + (levelPct / 100) * 0.4,
            }}
          />
          <div
            className="absolute rounded-full bg-[#006eff]/20 dark:bg-[#006eff]/10 transition-all duration-150"
            style={{
              width: `${5 + (levelPct / 100) * 4}rem`,
              height: `${5 + (levelPct / 100) * 4}rem`,
            }}
          />
          <button
            onClick={stopRecording}
            className="relative size-20 rounded-full bg-[#006eff] hover:bg-[#0056c7] text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 transition-all active:scale-[0.98]"
          >
            <Icon name="keyboard_voice" className="text-4xl" />
          </button>
        </div>

        <div className="w-full max-w-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-sm font-black text-[#006eff] uppercase tracking-widest flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#006eff] animate-pulse" />
              Mendengarkan...
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {formatTime(recordingTime)}
            </p>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.max(4, levelPct)}%`,
                background: levelPct > 60
                  ? 'linear-gradient(90deg, #006eff, #00c4ff)'
                  : levelPct > 20
                    ? 'linear-gradient(90deg, #006eff, #60a5fa)'
                    : '#94a3b8',
              }}
            />
          </div>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-1000"
              style={{ width: `${remainingPct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
            Maks {MAX_RECORDING_SECONDS}s · sisa {MAX_RECORDING_SECONDS - recordingTime}s
          </p>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
          {levelPct < 5
            ? '🎙️ Tidak ada suara terdeteksi — periksa mikrofon'
            : 'Sedang merekam. Ketuk tombol di atas jika sudah selesai berbicara.'}
        </p>

        <div className="w-full pt-2 flex gap-3 max-w-xs">
          <button
            onClick={() => { stopRecording(); setStep('idle'); }}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            Batal
          </button>
          <button
            onClick={stopRecording}
            className="flex-[2] py-3 bg-[#006eff] hover:bg-[#0056c7] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  };

  const ProcessingState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 space-y-5">
      <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
        <Icon name="hourglass_top" className="text-3xl text-[#006eff] animate-spin" />
      </div>
      <p className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
        Memproses...
      </p>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
        Mencocokkan suara dengan database produk...
      </p>
    </div>
  );

  const ResultState = () => {
    if (!results) return null;

    const { items, ambiguous, unmatched } = results;
    const totalAdded = items.length;
    const totalAmbiguous = ambiguous.length;
    const totalUnmatched = unmatched.length;

    return (
      <div className="flex flex-col h-full px-6 lg:px-10">
        <div className="py-6 space-y-1">
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Hasil Voice Scan
          </p>
          <p className="text-sm text-slate-500">
            {totalAdded > 0 && `${totalAdded} barang langsung ditambahkan. `}
            {totalAmbiguous > 0 && `${totalAmbiguous} barang perlu dipilih. `}
            {totalUnmatched > 0 && `${totalUnmatched} barang tidak ditemukan.`}
            {totalAdded === 0 && totalAmbiguous === 0 && totalUnmatched === 0 && 'Tidak ada barang yang dikenali.'}
          </p>
        </div>

        {transcript && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-2 text-xs text-slate-650 dark:text-slate-400 italic shrink-0">
            <p className="font-black uppercase tracking-wider text-[10px] text-slate-400 dark:text-slate-500 not-italic mb-1 flex items-center gap-1">
              <Icon name="keyboard_voice" className="text-sm" />
              Transkrip Suara:
            </p>
            "{transcript}"
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {items.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="check_circle" className="text-sm" />
                Barang Ditemukan ({items.length})
              </p>
              <div className="space-y-1.5">
                {items.map((item, i) => {
                  const satuan = item.satuan_id
                    ? item.product.satuans?.find((s: any) => s.id === item.satuan_id)
                    : null;
                  return (
                    <div key={`item-${i}`} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                      item.stock_warning
                        ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                    }`}>
                      <Icon name={item.stock_warning ? 'warning' : 'check_circle'} className={`text-lg shrink-0 ${item.stock_warning ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.product.nama}</p>
                        <p className="text-[11px] text-slate-500">
                          Qty: {item.qty}
                          {satuan ? ` ${satuan.nama}` : ''}
                          {' | '}{item.product.sku}
                        </p>
                        {item.stock_warning && (
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <Icon name="inventory_2" className="text-xs" />
                            Stok tersisa {item.product.stok ?? 0}
                          </p>
                        )}
                      </div>
                      <span className={`text-[11px] font-black uppercase shrink-0 ${item.stock_warning ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.stock_warning ? 'STOK KURANG' : 'OK'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ambiguous.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="help" className="text-sm" />
                Pilih Barang ({ambiguous.length})
              </p>
              <div className="space-y-3">
                {ambiguous.map((group, gi) => (
                  <div key={`ambig-${gi}`} className="p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-slate-500">
                      "{group.query}" — pilih barang yang dimaksud:
                    </p>
                    <div className="space-y-1">
                      {group.products.map((prod, pi) => (
                        <button
                          key={prod.id}
                          onClick={() => handleSelectAmbiguous(gi, pi)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${group.selectedIndex === pi
                            ? 'bg-[#006eff] text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500/50'
                            }`}
                        >
                          {prod.nama}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Qty: {group.qty}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unmatched.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icon name="search_off" className="text-sm" />
                Tidak Ditemukan ({unmatched.length})
              </p>
              <div className="space-y-1.5">
                {unmatched.map((text, i) => (
                  <div key={`unmatched-${i}`} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <Icon name="cancel" className="text-slate-400 text-lg shrink-0" />
                    <p className="text-sm text-slate-500 italic">"{text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 pb-6 flex gap-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleStartListening}
            className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
          >
            Scan Ulang
          </button>
          {results && (results.items.length > 0 || results.ambiguous.length > 0) ? (
            <button
              onClick={handleConfirmAll}
              className="flex-[2] py-3.5 bg-[#006eff] hover:bg-[#0056c7] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              Tambahkan Ke Keranjang ({results.items.length + results.ambiguous.filter(g => g.selectedIndex !== null).length})
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-[2] py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98]"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    );
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
                  <div className="flex-shrink-0 p-4 lg:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between z-10">
                    <Dialog.Title className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 lg:gap-3 text-sm lg:text-lg uppercase tracking-tight">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Icon name="keyboard_voice" className="text-[#006eff] text-lg lg:text-2xl" />
                      </div>
                      Voice Scan
                    </Dialog.Title>
                    <button
                      type="button"
                      className="size-9 lg:size-11 flex items-center justify-center rounded-lg lg:rounded-2xl bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-850 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-sm"
                      onClick={onClose}
                    >
                      <Icon name="close" className="text-lg lg:text-xl" />
                    </button>
                  </div>

                  <div className="flex-1 bg-white dark:bg-slate-950 overflow-hidden min-h-0">
                    {error && step !== 'testing' && (
                      <div className="bg-red-500 text-white text-[11px] font-black uppercase tracking-widest py-3 px-6 text-center animate-pulse">
                        {error}
                      </div>
                    )}

                    {!browserSupported ? (
                      <SpeechNotSupported />
                    ) : step === 'testing' ? (
                      <TestingState />
                    ) : step === 'idle' ? (
                      <IdleState />
                    ) : step === 'listening' ? (
                      <ListeningState />
                    ) : step === 'processing' ? (
                      <ProcessingState />
                    ) : step === 'result' ? (
                      <ResultState />
                    ) : null}
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
