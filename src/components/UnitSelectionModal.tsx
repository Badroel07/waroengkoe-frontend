import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';
import OverflowMarquee from '@/components/OverflowMarquee';
import type { Product, ProductUnit } from '@/types';

// Format currency helper
const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID').format(value);

interface UnitSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (product: Product, satuan: ProductUnit) => void;
    product: Product | null;
    availableStock: number; // Base unit available stock
}

export default function UnitSelectionModal({
    isOpen,
    onClose,
    onConfirm,
    product,
    availableStock
}: UnitSelectionModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.overflowY = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.overflowY = '';
            }
        }
        return () => {
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.overflowY = '';
            }
        };
    }, [isOpen]);

    if (!isOpen || !mounted || !product) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 animate-modal-backdrop font-sans"
            style={{ touchAction: 'manipulation' }}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-modal-content flex flex-col border border-white/5 transition-all"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="h-7 mb-0.5">
                                <OverflowMarquee className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                    {product.nama || ''}
                                </OverflowMarquee>
                            </div>
                            <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest">Pilih Satuan</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all shrink-0 cursor-pointer"
                    >
                        <Icon name="close" className="text-lg" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                    <div className="grid gap-3">
                        {product.satuans?.filter(s => s.is_visible === true).map((satuan) => {
                            const stockInUnit = Math.floor(availableStock / (satuan.konversi || 1));
                            const isOutOfStock = stockInUnit <= 0;

                            return (
                                <button
                                    key={satuan.id}
                                    onClick={() => !isOutOfStock && onConfirm(product, satuan)}
                                    disabled={isOutOfStock}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all text-left group cursor-pointer
                                        ${isOutOfStock
                                            ? 'bg-slate-55 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                                             : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:shadow-lg hover:shadow-blue-500/10'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                                                {satuan.nama}
                                            </span>
                                            {satuan.konversi > 1 && (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                                    @{satuan.konversi} {product.satuan_dasar}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={`font-medium ${isOutOfStock ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                Stok: {stockInUnit}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-base font-black text-[#006eff] dark:text-blue-400">
                                            Rp {formatCurrency(satuan.harga_jual)}
                                        </div>
                                        {!isOutOfStock && (
                                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 mt-1">
                                                <span>Pilih</span>
                                                <Icon name="arrow_forward" className="text-xs" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
