import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'danger';

export interface AlertConfigOverrides {
    bg?: string;
    iconBg?: string;
    icon?: string;
    iconName?: string;
    buttonBg?: string;
    ring?: string;
}

export interface AlertInstance {
    id: number;
    type: AlertType;
    title?: string;
    message: ReactNode;
    buttonText?: string;
    confirmText?: string;
    cancelText?: string;
    requireAction?: boolean;
    configOverrides?: AlertConfigOverrides;
    resolve: (result: boolean) => void;
}

export interface ShowAlertOptions {
    type?: AlertType;
    title?: string;
    message: ReactNode;
    buttonText?: string;
    confirmText?: string;
    cancelText?: string;
    requireAction?: boolean;
    config?: AlertConfigOverrides;
    configOverrides?: AlertConfigOverrides;
}

interface AlertContextType {
    showAlert: (options: ShowAlertOptions) => Promise<boolean>;
    alert: (message: ReactNode, title?: string) => Promise<boolean>;
    success: (message: ReactNode, title?: string) => Promise<boolean>;
    error: (message: ReactNode, title?: string) => Promise<boolean>;
    warning: (message: ReactNode, title?: string) => Promise<boolean>;
    confirm: (message: ReactNode, title?: string, options?: { confirmText?: string; cancelText?: string; danger?: boolean; config?: AlertConfigOverrides; configOverrides?: AlertConfigOverrides }) => Promise<boolean>;
    confirmDanger: (message: ReactNode, title?: string, options?: { confirmText?: string; cancelText?: string; config?: AlertConfigOverrides; configOverrides?: AlertConfigOverrides }) => Promise<boolean>;
}

// Alert Context
const AlertContext = createContext<AlertContextType | null>(null);

// Alert types configuration
const alertConfigs: Record<AlertType, Required<AlertConfigOverrides>> = {
    success: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
        iconName: 'check_circle',
        buttonBg: 'bg-emerald-500 hover:bg-emerald-600',
        ring: 'ring-emerald-500/20 dark:ring-emerald-500/10',
    },
    error: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        icon: 'text-red-600 dark:text-red-400',
        iconName: 'error',
        buttonBg: 'bg-red-500 hover:bg-red-600',
        ring: 'ring-red-500/20 dark:ring-red-500/10',
    },
    warning: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        icon: 'text-amber-600 dark:text-amber-400',
        iconName: 'warning',
        buttonBg: 'bg-amber-500 hover:bg-amber-600',
        ring: 'ring-amber-500/20 dark:ring-amber-500/10',
    },
    info: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        icon: 'text-[#006eff] dark:text-blue-400',
        iconName: 'info',
        buttonBg: 'bg-[#006eff] hover:bg-blue-600',
        ring: 'ring-blue-500/20 dark:ring-blue-500/10',
    },
    confirm: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-blue-50 dark:bg-slate-800',
        icon: 'text-[#006eff] dark:text-blue-400',
        iconName: 'help',
        buttonBg: 'bg-[#006eff] hover:bg-blue-600',
        ring: 'ring-blue-500/20 dark:ring-blue-500/10',
    },
    danger: {
        bg: 'bg-white dark:bg-slate-900',
        iconBg: 'bg-red-50 dark:bg-red-900/30',
        icon: 'text-red-600 dark:text-red-400',
        iconName: 'warning',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        ring: 'ring-red-500/20 dark:ring-red-500/10',
    },
};

interface AlertModalProps {
    alert: AlertInstance;
    onClose: (result: boolean) => void;
}

// Alert Modal Component
function AlertModal({ alert, onClose }: AlertModalProps) {
    const [visible, setVisible] = useState(false);
    const [iconPulse, setIconPulse] = useState(false);
    const baseConfig = alertConfigs[alert.type] || alertConfigs.info;
    const config = {
        ...baseConfig,
        ...(alert.configOverrides || {})
    };

    useEffect(() => {
        // Animate in
        requestAnimationFrame(() => {
            setVisible(true);
            // Icon pulse animation
            setTimeout(() => setIconPulse(true), 150);
        });

        // Handle escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleClose = (result = false) => {
        setVisible(false);
        setTimeout(() => {
            onClose(result);
        }, 200);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => !alert.requireAction && handleClose(false)}
            />

            {/* Alert Card */}
            <div
                className={`
                    relative w-full max-w-sm ${config.bg} rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 overflow-hidden
                    transform transition-all duration-300 ease-out
                    ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}
                `}
            >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${config.buttonBg.split(' ')[0]}`} />

                {/* Content */}
                <div className="p-8 pt-10">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div
                            className={`
                                w-20 h-20 rounded-full flex items-center justify-center
                                ${config.iconBg} ring-[12px] ${config.ring}
                                transform transition-all duration-700
                                ${iconPulse ? 'scale-100 rotate-0' : 'scale-75 rotate-12'}
                            `}
                        >
                            <Icon
                                name={config.iconName}
                                className={`text-5xl ${config.icon}`}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    {alert.title && (
                        <h3 className="text-2xl font-black text-center text-slate-900 dark:text-slate-100 mb-3 tracking-tight uppercase">
                            {alert.title}
                        </h3>
                    )}

                    {/* Message */}
                    <div className="text-center text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line px-2">
                        {alert.message}
                    </div>
                </div>

                {/* Actions */}
                <div className={`p-6 py-5 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50 ${ (alert.type === 'confirm' || alert.type === 'danger') ? 'grid grid-cols-2 gap-4' : ''}`}>
                    {(alert.type === 'confirm' || alert.type === 'danger') ? (
                        <>
                             <button
                                onClick={() => handleClose(false)}
                                className="w-full py-4 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer"
                            >
                                {alert.cancelText || 'Batal'}
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                className={`w-full py-4 px-4 ${config.buttonBg} text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.98] shadow-xl cursor-pointer ${alert.type === 'danger' ? 'shadow-red-500/25' : 'shadow-blue-500/25'}`}
                            >
                                {alert.confirmText || (alert.type === 'danger' ? 'Ya, Hapus' : 'Ya, Lanjutkan')}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleClose(true)}
                            className={`w-full py-4 px-4 ${config.buttonBg} text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.98] shadow-xl cursor-pointer`}
                            autoFocus
                        >
                             {alert.buttonText || 'OK'}
                        </button>
                    )}
                </div>

                {/* Decorative circles */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-slate-400/5 dark:bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-slate-400/5 dark:bg-white/5 pointer-events-none" />
            </div>
        </div>,
        document.body
    );
}

// Alert Provider Component
export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<AlertInstance[]>([]);

    const showAlert = useCallback((options: ShowAlertOptions) => {
        return new Promise<boolean>((resolve) => {
            const id = Date.now();
            const alert: AlertInstance = {
                id,
                type: options.type || 'info',
                title: options.title,
                message: options.message,
                buttonText: options.buttonText,
                confirmText: options.confirmText,
                cancelText: options.cancelText,
                requireAction: options.requireAction || false,
                configOverrides: options.configOverrides || options.config || {},
                resolve,
            };
            setAlerts(prev => [...prev, alert]);
        });
    }, []);

    const handleClose = useCallback((id: number, result: boolean) => {
        setAlerts(prev => {
            const alert = prev.find(a => a.id === id);
            if (alert) {
                alert.resolve(result);
            }
            return prev.filter(a => a.id !== id);
        });
    }, []);

    // Shorthand methods
    const alert = useCallback((message: ReactNode, title?: string) =>
        showAlert({ type: 'info', message, title }), [showAlert]);

    const success = useCallback((message: ReactNode, title = 'Berhasil!') =>
        showAlert({ type: 'success', message, title }), [showAlert]);

    const error = useCallback((message: ReactNode, title = 'Error!') =>
        showAlert({ type: 'error', message, title }), [showAlert]);

    const warning = useCallback((message: ReactNode, title = 'Peringatan!') =>
        showAlert({ type: 'warning', message, title }), [showAlert]);

    const confirm = useCallback((message: ReactNode, title = 'Konfirmasi', options: { confirmText?: string; cancelText?: string; danger?: boolean; config?: AlertConfigOverrides; configOverrides?: AlertConfigOverrides } = {}) =>
        showAlert({
            type: options.danger ? 'danger' : 'confirm',
            message,
            title,
            confirmText: options.confirmText,
            cancelText: options.cancelText,
            requireAction: true,
            configOverrides: options.configOverrides || options.config || {}
        }), [showAlert]);

    // Shorthand for danger confirmation
    const confirmDanger = useCallback((message: ReactNode, title = 'Konfirmasi', options: { confirmText?: string; cancelText?: string; config?: AlertConfigOverrides; configOverrides?: AlertConfigOverrides } = {}) =>
        confirm(message, title, { ...options, danger: true }), [confirm]);

    return (
        <AlertContext.Provider value={{ showAlert, alert, success, error, warning, confirm, confirmDanger }}>
            {children}
            {alerts.map(alert => (
                <AlertModal
                    key={alert.id}
                    alert={alert}
                    onClose={(result) => handleClose(alert.id, result)}
                />
            ))}
        </AlertContext.Provider>
    );
}

// Hook to use alert
export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

export default AlertProvider;
