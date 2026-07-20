import type { ReactNode } from 'react';
import { useLoadingStore } from '@/store/loadingStore';
import Icon from './Icon';
import { useToast } from './ToastProvider';

interface LoadingErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}

export default function LoadingErrorBoundary({
  children,
  onRetry,
  className = ""
}: LoadingErrorBoundaryProps) {
  const { errorType, resetLoading } = useLoadingStore();
  const { warning } = useToast();

  const handleRetry = () => {
    if (!navigator.onLine) {
      warning('Koneksi internet Anda belum kembali. Silakan periksa jaringan Anda.');
      return;
    }
    resetLoading();
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleReloadPage = () => {
    if (!navigator.onLine) {
      warning('Koneksi internet Anda belum kembali. Halaman tidak dapat dimuat.');
      return;
    }
    resetLoading();
    window.location.reload();
  };

  if (!errorType) {
    return <>{children}</>;
  }

  const isNetworkError = errorType === 'network';

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] p-4 text-center ${className}`}>
      {/* Glassmorphic Container Card */}
      <div className="w-full max-w-md p-6 sm:p-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-2xl animate-fade-in-up transition-colors duration-300">
        
        {/* Premium Animated Icon Container */}
        <div className="flex items-center justify-center mb-6">
          <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-500 hover:scale-105 shadow-lg
            ${isNetworkError 
              ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 shadow-amber-500/10" 
              : "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 shadow-indigo-500/10"
            }`}
          >
            <Icon 
              name={isNetworkError ? "wifi_off" : "hourglass_top"} 
              className="text-4xl animate-pulse" 
            />
            {/* Orbit Ring Decoration */}
            <div className={`absolute inset-0 rounded-2xl border-2 border-dashed animate-[spin_20s_linear_infinite] opacity-30
              ${isNetworkError ? "border-amber-500" : "border-indigo-500"}`}
            />
          </div>
        </div>

        {/* Header Text */}
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-2 uppercase">
          {isNetworkError ? "Koneksi Terputus" : "Permintaan Habis Waktu"}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-xs mx-auto">
          {isNetworkError 
            ? "Gagal memuat data karena koneksi internet Anda terputus. Silakan periksa jaringan Anda dan coba lagi."
            : "Server membutuhkan waktu terlalu lama untuk merespons. Sinyal mungkin lambat atau server sedang sibuk."
          }
        </p>

        {/* Action Buttons Stack (Mobile-first vertical stack, row on sm) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* Primary Retry Button */}
          <button
            onClick={handleRetry}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer
              ${isNetworkError
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
              }`}
          >
            <Icon name="sync" className="text-base" />
            Coba Lagi
          </button>

          {/* Secondary Full Page Reload Button */}
          <button
            onClick={handleReloadPage}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="refresh" className="text-base" />
            Segarkan
          </button>
        </div>

      </div>
    </div>
  );
}
