import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: Toast | null;
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-300', icon: '✓' },
  error: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20', text: 'text-red-800 dark:text-red-300', icon: '✕' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-800 dark:text-amber-300', icon: '⚠' },
  info: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', text: 'text-blue-800 dark:text-blue-300', icon: 'ℹ' },
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = ++toastId;
    setToast({ id, type, message });
    const tid = setTimeout(() => {
      setToast(null);
    }, 4000);
    setTimeoutId(tid);
  }, [timeoutId]);

  const dismiss = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId);
    setToast(null);
  }, [timeoutId]);

  const colors = toast ? COLORS[toast.type] : null;

  return (
    <ToastContext.Provider value={{
      toast, showToast, dismiss,
      success: (m: string) => showToast('success', m),
      error: (m: string) => showToast('error', m),
      warning: (m: string) => showToast('warning', m),
      info: (m: string) => showToast('info', m),
    }}>
      {children}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in-up">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${colors?.bg} ${colors?.border} min-w-[280px] max-w-[90vw]`}>
            <span className={`font-bold text-sm ${colors?.text}`}>{colors?.icon}</span>
            <span className={`text-xs font-semibold ${colors?.text} flex-1`}>{toast.message}</span>
            <button onClick={dismiss} className={`${colors?.text} hover:opacity-70 text-lg leading-none`}>&times;</button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
