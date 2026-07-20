import { useState, useMemo, useCallback, useEffect, useRef, memo, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useAlert } from '@/components/Alert';
import QrisPaymentModal from '@/components/QrisPaymentModal';
const ScannerModal = lazy(() => import('@/components/ScannerModal'));
import FloatingCartIcon from '@/components/FloatingCartIcon';
import CartModal from '@/components/CartModal';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import UnitSelectionModal from '@/components/UnitSelectionModal';
import VoiceScanModal from '@/components/VoiceScanModal';
import OverflowMarquee from '@/components/OverflowMarquee';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import { useProductStore } from '@/store/productStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useCartStore } from '@/store/cartStore';
import type { Product, ProductUnit } from '@/types';

// Format currency helper
const formatCurrency = (value: number | string) => new Intl.NumberFormat('id-ID').format(Number(value));

// Product Card Component - Memoized to prevent unnecessary re-renders
interface ProductCardProps {
  product: Product;
  isPopular?: boolean;
  availableStock: number;
  onAddToCart: (product: Product) => void;
  priority?: boolean;
}

const ProductCard = memo(({ product, isPopular = false, availableStock, onAddToCart, priority = false }: ProductCardProps) => {
  const isOutOfStock = availableStock <= 0;
  
  // Filter visible units
  const visibleUnits = useMemo(() => {
    if (!product.satuans) return [];
    return product.satuans.filter(s => s.is_visible === true);
  }, [product.satuans]);

  const hasMultipleUnits = visibleUnits.length > 1;

  // Calculate price range or display string
  const priceDisplay = useMemo(() => {
    if (!hasMultipleUnits) {
      const defaultUnit = visibleUnits[0] || product.satuans[0];
      return `Rp ${formatCurrency(defaultUnit?.harga_jual || product.harga_beli)}`;
    }
    const prices = visibleUnits.map(s => Number(s.harga_jual));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return `Rp ${formatCurrency(minPrice)}`;
    return `Rp ${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }, [product, hasMultipleUnits, visibleUnits]);

  // Unit list string
  const unitDisplay = useMemo(() => {
    if (visibleUnits.length === 0) return product.satuan_dasar;
    if (visibleUnits.length === 1) return visibleUnits[0].nama;

    return visibleUnits
      .sort((a, b) => a.konversi - b.konversi)
      .map(s => s.nama)
      .join(' • ');
  }, [product, visibleUnits]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
      }}
      disabled={isOutOfStock}
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border overflow-hidden transition-all duration-300 text-left ${isOutOfStock
        ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800'
        : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:border-blue-500/30 hover:border-[#006eff]/30 cursor-pointer'
        }`}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-50 dark:bg-slate-850 relative overflow-hidden">
        {product.gambar_url && !product.gambar_url.startsWith('data:image/') ? (
          <NetworkAwareImage
            src={product.gambar_url}
            alt={product.nama}
            decoding="async"
            className="w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800">
            <Icon name="inventory_2" className="text-4xl" />
          </div>
        )}
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-md">Habis</span>
          </div>
        )}
        {product.promo && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
            PROMO
          </span>
        )}
        {isPopular && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-md flex items-center gap-1">
            <Icon name="local_fire_department" className="text-xs" />
            Popular
          </span>
        )}
        {hasMultipleUnits && !isOutOfStock && (
          <span className="absolute bottom-2 right-2 px-2 py-1 bg-blue-500/90 text-white text-[11px] font-bold rounded-md">
            Multi Satuan
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 line-clamp-2 mb-1 uppercase tracking-tight leading-snug">{product.nama}</h3>
        <div className="mb-3 h-4">
          <OverflowMarquee className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
            {unitDisplay}
          </OverflowMarquee>
        </div>
        <div className="mt-auto">
          <p className={`font-black text-[#006eff] dark:text-blue-400 ${hasMultipleUnits && priceDisplay.length > 15 ? 'text-xs' : 'text-base'}`}>
            {priceDisplay}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${availableStock <= (product.batas_stok_rendah ?? 5) && availableStock > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}></span>
            <p className={`text-[11px] font-black uppercase tracking-wider ${availableStock <= (product.batas_stok_rendah ?? 5) && availableStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-500'}`}>
              Stok: {availableStock}
            </p>
          </div>
        </div>
      </div>

      {/* Add overlay - only show when not out of stock */}
      {!isOutOfStock && (
        <div className="absolute inset-0 bg-[#006eff]/0 group-hover:bg-[#006eff]/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Icon name={hasMultipleUnits ? "more_horiz" : "add_shopping_cart"} className="text-[#006eff] text-3xl transform scale-0 group-hover:scale-100 transition-transform" />
        </div>
      )}
    </button>
  );
});

ProductCard.displayName = 'ProductCard';

const ProductSkeleton = () => (
  <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden h-full">
    {/* Image */}
    <div className="aspect-square bg-slate-50 dark:bg-slate-850 relative overflow-hidden">
      <Skeleton className="w-full h-full rounded-none" />
    </div>

    {/* Info */}
    <div className="p-4 flex-1 flex flex-col overflow-hidden">
      <div className="space-y-1 mb-1">
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
      <div className="mb-3 h-4">
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
      <div className="mt-auto space-y-2">
        <Skeleton className="h-5 w-2/3 rounded" />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton className="w-1.5 h-1.5 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  </div>
);

const PopularProductsSkeleton = () => (
  <div className="mb-6">
    <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
      <Icon name="local_fire_department" className="text-amber-500 text-2xl animate-pulse" />
      Produk Populer
    </h3>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
      {[...Array(6)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  </div>
);



// ─── Category Bar with search popover ────────────────────────────────────────
interface CategoryBarProps {
  categories: string[];
  activeCategory: string;
  onSelect: (cat: string) => void;
  size?: 'sm' | 'md';
}

const CategoryBar = memo(({ categories, activeCategory, onSelect, size = 'md' }: CategoryBarProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 256 });

  const allCats = ['Semua', ...categories];
  const filtered = allCats.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll when open
  useEffect(() => {
    if (!open) return;
    const handler = () => { setOpen(false); setSearch(''); };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const DROPDOWN_W = isMobile ? window.innerWidth - 32 : 280;
      const MARGIN = 16;

      if (isMobile) {
        setDropdownPos({ top: rect.bottom + 8, left: 16, width: DROPDOWN_W });
      } else {
        const idealLeft = rect.right - DROPDOWN_W;
        const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - DROPDOWN_W - MARGIN));
        setDropdownPos({ top: rect.bottom + 8, left: clampedLeft, width: DROPDOWN_W });
      }
    }
    setOpen(prev => !prev);
  };

  const handleSelect = (cat: string) => {
    onSelect(cat);
    setOpen(false);
    setSearch('');
  };

  const isFiltered = activeCategory !== 'Semua';

  return (
    <>
      {/* Single trigger button — always shows category name, active state = biru */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl border transition-all duration-200 shrink-0 font-black uppercase tracking-widest flex-1 sm:flex-initial w-full sm:w-auto cursor-pointer ${
          size === 'sm'
            ? 'h-10 px-4 text-[11px]'
            : 'h-11 px-4 text-sm'
        } ${
          isFiltered
            ? 'bg-[#006eff] text-white border-[#006eff] shadow-sm shadow-blue-500/20'
            : open
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icon name="category" className={size === 'sm' ? 'text-sm' : 'text-base'} />
          <span className="truncate max-w-[200px] sm:max-w-[140px]">{activeCategory}</span>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-sm shrink-0" />
      </button>

      {/* Popover — fixed positioning, no layout shift */}
      {open && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          className="fixed z-[200] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Header — active category label + search */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Filter Kategori
              </p>
              {isFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wide">
                  <Icon name="check" className="text-[10px]" />
                  {activeCategory}
                </span>
              )}
            </div>
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari kategori..."
                className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
                onKeyDown={e => {
                  if (e.key === 'Escape') { setOpen(false); setSearch(''); }
                  if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0]);
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Category list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">Tidak ditemukan</p>
            ) : (
              filtered.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <span>{cat}</span>
                  {activeCategory === cat && (
                    <Icon name="check" className="text-sm text-blue-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer — reset shortcut */}
          {isFiltered && (
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSelect('Semua')}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
              >
                <Icon name="close" className="text-xs" />
                Reset Filter
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
});

CategoryBar.displayName = 'CategoryBar';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetPopoverProps {
  activeLetter: string;
  onSelect: (letter: string) => void;
  size?: 'sm' | 'md';
}

const AlphabetPopover = memo(({ activeLetter, onSelect, size = 'md' }: AlphabetPopoverProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 256 });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on scroll when open
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      const MARGIN = 16;

      if (isMobile) {
        const DROPDOWN_W = window.innerWidth - 32;
        setDropdownPos({ top: rect.bottom + 8, left: 16, width: DROPDOWN_W });
      } else {
        const DROPDOWN_W = 280;
        const idealLeft = rect.left;
        const clampedLeft = Math.max(MARGIN, Math.min(idealLeft, window.innerWidth - DROPDOWN_W - MARGIN));
        setDropdownPos({ top: rect.bottom + 8, left: clampedLeft, width: DROPDOWN_W });
      }
    }
    setOpen(prev => !prev);
  };

  const handleSelect = (letter: string) => {
    onSelect(letter);
    setOpen(false);
  };

  const hasActiveLetter = activeLetter !== '';

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center justify-between sm:justify-start gap-2 rounded-xl border transition-all duration-200 shrink-0 font-black uppercase tracking-widest flex-1 sm:flex-initial w-full sm:w-auto cursor-pointer ${
          size === 'sm'
            ? 'h-10 px-4 text-[11px]'
            : 'h-11 px-4 text-sm'
        } ${
          hasActiveLetter
            ? 'bg-[#006eff] text-white border-[#006eff] shadow-sm shadow-blue-500/20'
            : open
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400'
        }`}
        title="Filter Abjad A-Z"
      >
        <div className="flex items-center gap-2 truncate">
          <Icon name="sort_by_alpha" className={size === 'sm' ? 'text-sm' : 'text-base'} />
          <span>{hasActiveLetter ? `Abjad: ${activeLetter}` : 'A-Z'}</span>
        </div>
        <Icon name={open ? 'expand_less' : 'expand_more'} className="text-sm shrink-0" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          className="fixed z-[200] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-3"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5 px-1">
            Pilih Huruf Awal
          </p>

          {/* A-Z Grid Layout (6 columns) */}
          <div className="grid grid-cols-6 gap-1">
            {ALPHABET.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => handleSelect(letter)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-black uppercase transition-all cursor-pointer ${
                  activeLetter === letter
                    ? 'bg-[#006eff] text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Reset Button */}
          {hasActiveLetter && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer"
              >
                <Icon name="close" className="text-xs" />
                Reset Abjad
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
});

AlphabetPopover.displayName = 'AlphabetPopover';

// Simple mock for Deferred component from Inertia to keep JSX clean & matched to original
const Deferred = ({ children, fallback, data }: { children: React.ReactNode; fallback?: React.ReactNode; data?: any }) => {
  return <>{children}</>;
};

export default function KasirIndex() {
  const navigate = useNavigate();
  const { warning, success } = useAlert();

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeLetter, setActiveLetter] = useState('');

  // Modals & triggers
  const [cartOpen, setCartOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVoiceScanOpen, setIsVoiceScanOpen] = useState(false);
  const [unitSelectionModalOpen, setUnitSelectionModalOpen] = useState(false);
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<Product | null>(null);

  // Global Stores
  const products = useProductStore((s) => s.products);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const categoriesList = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);
  const categories = useMemo(() => categoriesList.map(c => c.nama), [categoriesList]);

  // Fetch data on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);
  
  const { items: cart, addItem, updateQty, updateCartItemQty, updateSatuan, removeItem: removeFromCart, clearCart, getTotals } = useCartStore();

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotals = getTotals();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const targetTag = target?.tagName?.toLowerCase();
      const isTyping = targetTag === 'input' || targetTag === 'textarea';

      if (e.key === 'F4') {
        e.preventDefault();
        const input = document.getElementById('global-search-input') || document.getElementById('mobile-search-input');
        input?.focus();
      } else if (e.key === ' ' && !isTyping && !cartOpen && !isScannerOpen && !isVoiceScanOpen && !unitSelectionModalOpen) {
        e.preventDefault();
        const input = document.getElementById('global-search-input') || document.getElementById('mobile-search-input');
        input?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setCartOpen(true);
        } else {
          warning('Belum ada produk di keranjang', 'Keranjang Kosong');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, cartOpen, isScannerOpen, isVoiceScanOpen, unitSelectionModalOpen, warning]);

  // Client-side stock calculations
  const getCartStockUsed = useCallback((productId: string) => {
    return cart.reduce((total, item) => {
      if (item.id === productId) {
        // Multiply by conversion rate of the unit used
        const matchedUnit = item.satuans?.find((s: any) => s.id === item.satuan_id);
        const conversion = matchedUnit?.konversi || 1;
        return total + (item.qty * conversion);
      }
      return total;
    }, 0);
  }, [cart]);

  const getAvailableStock = useCallback((product: Product) => {
    const serverStock = product.stok;
    const cartUsed = getCartStockUsed(product.id);
    return Math.max(0, serverStock - cartUsed);
  }, [getCartStockUsed]);

  const addToCart = useCallback((product: Product) => {
    const availableStock = getAvailableStock(product);
    if (availableStock <= 0) {
      warning('Stok produk ini sudah habis!', 'Stok Habis');
      return;
    }

    const visibleUnits = product.satuans?.filter(s => s.is_visible === true) || [];

    if (visibleUnits.length > 1) {
      setSelectedProductForUnit(product);
      setUnitSelectionModalOpen(true);
      return;
    }

    if (visibleUnits.length === 1) {
      addItem({ id: product.id, nama: product.nama, satuan: visibleUnits[0] });
      return;
    }

    if (visibleUnits.length === 0) {
      warning('Produk tidak memiliki satuan yang dapat dijual!', 'Error');
      return;
    }
  }, [getAvailableStock, warning, addItem]);

  const handleUnitSelect = useCallback((product: Product, satuan: ProductUnit) => {
    const availableStock = getAvailableStock(product);
    const konversi = satuan.konversi || 1;

    if (availableStock < konversi) {
      warning(`Stok tidak cukup untuk satuan ${satuan.nama}`, 'Stok Kurang');
      return;
    }

    addItem({ id: product.id, nama: product.nama, satuan });
    setUnitSelectionModalOpen(false);
    setSelectedProductForUnit(null);
  }, [getAvailableStock, addItem, warning]);

  // Voice scan integration
  const handleAddVoiceItems = useCallback((voiceItems: any[]) => {
    let addedCount = 0;
    let cappedCount = 0;

    voiceItems.forEach(({ product, qty, satuan_id }) => {
      const selectedSatuan = product.satuans?.find((s: any) => s.id === satuan_id)
        || product.satuans?.find((s: any) => s.is_visible && s.konversi === 1)
        || product.satuans?.find((s: any) => s.is_visible)
        || product.satuans?.[0];

      if (!selectedSatuan) return;

      const konversi = selectedSatuan.konversi || 1;
      const serverStok = product.stok;
      const cartUsed = getCartStockUsed(product.id);
      const availableBase = Math.max(0, serverStok - cartUsed);
      const maxQty = Math.floor(availableBase / konversi);
      const actualQty = Math.min(qty, Math.max(0, maxQty));

      if (actualQty <= 0) return;
      if (actualQty < qty) cappedCount += qty - actualQty;

      // Add to store in bulk
      addItem({ id: product.id, nama: product.nama, satuan: selectedSatuan }, actualQty);
      addedCount += actualQty;
    });

    if (addedCount > 0) {
      success(`Berhasil menambahkan ${addedCount} item dari voice scan.${cappedCount > 0 ? ` ${cappedCount} item dikurangi karena stok tidak mencukupi.` : ''}`, 'Voice Scan Berhasil');
    }
  }, [getCartStockUsed, addItem, success]);

  // Client-side filtering & search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'aktif') return false;
      if (activeCategory !== 'Semua' && p.kategori_nama !== activeCategory) return false;
      if (activeLetter && !p.nama.toUpperCase().startsWith(activeLetter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.nama.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeCategory, activeLetter, searchQuery]);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [activeCategory, activeLetter, searchQuery]);

  // Infinite scroll effect using a single observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + 24);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  // Popular products: pick first 12 active products as a mock
  const popularProducts = useMemo(() => {
    return products.filter(p => p.status === 'aktif').slice(0, 12);
  }, [products]);

  const handleCategoryFilter = useCallback((category: string) => {
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLetterFilter = useCallback((letter: string) => {
    setActiveLetter(prev => prev === letter ? '' : letter);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <AppLayout
      title="Kasir"
      searchConfig={{
        placeholder: 'Cari produk, SKU...',
        value: searchQuery,
        onSearch: setSearchQuery,
        subHeader: (
          <div className="py-1 shrink-0 flex flex-col gap-1.5 w-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-0.5">
              Filter & Urutan
            </p>
            <div className="flex items-center gap-2 w-full">
              <CategoryBar
                categories={categories}
                activeCategory={activeCategory}
                onSelect={handleCategoryFilter}
                size="sm"
              />
              <AlphabetPopover
                activeLetter={activeLetter}
                onSelect={handleLetterFilter}
                size="sm"
              />
            </div>
          </div>
        )
      }}
      actionButton={
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setIsVoiceScanOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#006eff] hover:bg-[#0056c7] text-white shadow-lg shadow-blue-500/20 px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] text-[11px] font-black uppercase tracking-widest group cursor-pointer"
          >
            <Icon name="keyboard_voice" className="text-lg group-hover:animate-pulse" />
            <span>Voice Scan</span>
          </button>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#006eff] hover:bg-[#0056c7] text-white shadow-lg shadow-blue-500/20 px-5 py-2.5 rounded-xl transition-all active:scale-[0.98] text-[11px] font-black uppercase tracking-widest group cursor-pointer"
          >
            <Icon name="qr_code_scanner" className="text-lg" />
            <span>Scan Barcode</span>
          </button>
        </div>
      }
    >
      <div className="flex-1 overflow-hidden">
        {/* Main Content: Product Grid */}
        <div className="md:pr-2 pb-20">

          {/* DESKTOP CATEGORY DROPDOWN */}
          <div className="hidden md:block mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-black text-slate-900 dark:text-slate-100 text-xl uppercase tracking-tight">Daftar Produk</h2>
                <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">Pilih Produk atau Scan Barcode</p>
              </div>
              <div className="flex items-center gap-2">
                <CategoryBar
                  categories={categories}
                  activeCategory={activeCategory}
                  onSelect={handleCategoryFilter}
                  size="md"
                />
                <AlphabetPopover
                  activeLetter={activeLetter}
                  onSelect={handleLetterFilter}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Popular Section */}
          {activeCategory === 'Semua' && !searchQuery && !activeLetter && (
            <Deferred data="popularProducts" fallback={<PopularProductsSkeleton />}>
              {popularProducts && popularProducts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Icon name="local_fire_department" className="text-amber-500 text-2xl" />
                    Produk Populer
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                    {popularProducts.slice(0, 12).map((product, index) => (
                      <ProductCard
                        key={`pop-${product.id}`}
                        product={product}
                        isPopular
                        availableStock={getAvailableStock(product)}
                        onAddToCart={addToCart}
                        priority={index === 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Deferred>
          )}

          {/* All Products */}
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-3">
              {activeCategory === 'Semua' ? 'Semua Produk' : activeCategory}
              <Deferred data={["products", "pagination"]} fallback={<span className="inline-block w-16 h-4 ml-2 animate-pulse bg-slate-200 dark:bg-slate-800 rounded"></span>}>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-2">({filteredProducts.length} item)</span>
              </Deferred>
            </h3>

            <Deferred data="products" fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {[...Array(12)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            }>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 shadow-inner">
                    <Icon name="inventory_2" className="text-4xl text-slate-500 dark:text-slate-600" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    {searchQuery ? `Barang '${searchQuery}' Tidak Ditemukan` : 'Tidak Ada Barang'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-500 text-sm mt-2 mb-8 max-w-[240px] leading-relaxed mx-auto text-center whitespace-normal">
                    {searchQuery
                      ? `Maaf, kami tidak dapat menemukan produk dengan kata kunci tersebut. Silakan coba kata kunci lain.`
                      : 'Belum ada produk yang tersedia untuk dijual. Tambahkan produk atau sesuaikan filter Anda.'}
                  </p>
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                      }}
                      className="mt-8 px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Icon name="refresh" className="text-sm" />
                      Reset Pencarian
                    </button>
                  ) : (
                    <Link
                      to="/barang"
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#006eff] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#0056c7] transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Icon name="add_circle" className="text-lg" />
                      Kelola Data Barang
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                    {filteredProducts.slice(0, visibleCount).map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        availableStock={getAvailableStock(product)}
                        onAddToCart={addToCart}
                        priority={index === 0}
                      />
                    ))}
                  </div>
                  {visibleCount < filteredProducts.length && (
                    <div ref={sentinelRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mt-3">
                      {[...Array(6)].map((_, i) => (
                        <ProductSkeleton key={`sentinel-skele-${i}`} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </Deferred>
          </div>
        </div>
      </div>

      <FloatingCartIcon count={cartCount} onClick={() => setCartOpen(true)} />

      {/* F9 Shortcut Hint */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-24 right-5 z-40 animate-bounce pointer-events-none hidden md:block">
          <span className="bg-white dark:bg-slate-800 text-[#006eff] dark:text-blue-400 text-[11px] font-black px-2 py-1 rounded-md shadow-lg border border-blue-100 dark:border-slate-700">
            Tekan [F9]
          </span>
        </div>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {isScannerOpen && (
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            mode="single"
            onScanResult={(sku) => {
              const matched = products.find((p) => p.sku === sku && p.status === 'aktif');
              if (matched) addToCart(matched);
            }}
          />
        )}
      </Suspense>

      {isVoiceScanOpen && (
        <VoiceScanModal
          isOpen={isVoiceScanOpen}
          onClose={() => setIsVoiceScanOpen(false)}
          onAddItems={handleAddVoiceItems}
        />
      )}

      <UnitSelectionModal
        isOpen={unitSelectionModalOpen}
        onClose={() => {
          setUnitSelectionModalOpen(false);
          setSelectedProductForUnit(null);
        }}
        onConfirm={handleUnitSelect}
        product={selectedProductForUnit}
        availableStock={selectedProductForUnit ? getAvailableStock(selectedProductForUnit) : 0}
      />

      {cartOpen && (
        <CartModal
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
        />
      )}
    </AppLayout>
  );
}