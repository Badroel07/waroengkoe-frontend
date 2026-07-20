import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  user?: User;
}

const sheetNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Kategori', href: '/kategori', icon: 'category', permission: 'can_manage_category' },
  { name: 'Satuan', href: '/satuan', icon: 'straighten', permission: 'can_manage_category' },
  { name: 'Audit Stok', href: '/audit-stok', icon: 'fact_check' },
  { name: 'Pengguna', href: '/pengguna', icon: 'group', adminOnly: true },
  { name: 'Log Aktivitas', href: '/log-aktivitas', icon: 'history', permission: 'can_view_activity_log' },
  { name: 'Pengaturan', href: '/pengaturan', icon: 'settings' },
];

const DISMISS_DURATION = 280;
const OPEN_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

export default function BottomSheet({ open, onClose, user }: BottomSheetProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    if (open) {
      sheet.style.zIndex = '';
      backdrop.style.zIndex = '';

      sheet.style.visibility = 'visible';
      backdrop.style.visibility = 'visible';

      sheet.style.pointerEvents = 'auto';

      sheet.style.transition = 'none';
      sheet.style.transform = 'translateY(100%)';
      backdrop.style.transition = 'none';
      backdrop.style.opacity = '0';
      backdrop.style.pointerEvents = 'auto';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sheet.style.transition = `transform 0.35s ${OPEN_EASING}`;
          sheet.style.transform = 'translateY(0)';
          backdrop.style.transition = 'opacity 0.35s ease';
          backdrop.style.opacity = '1';
        });
      });
    } else {
      sheet.style.pointerEvents = 'none';
      backdrop.style.pointerEvents = 'none';

      sheet.style.transition = `transform 0.3s ${OPEN_EASING}`;
      sheet.style.transform = 'translateY(100%)';
      backdrop.style.transition = 'opacity 0.3s ease';
      backdrop.style.opacity = '0';

      const timer = setTimeout(() => {
        sheet.style.zIndex = '-1';
        sheet.style.visibility = 'hidden';
        backdrop.style.zIndex = '-1';
        backdrop.style.visibility = 'hidden';
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  const isActive = (href: string) => {
    const pathname = location.pathname;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const visibleItems = sheetNavItems.filter((item) => {
    if (item.permission) return user?.is_admin || user?.[item.permission as keyof User];
    if (item.adminOnly) return user?.is_admin;
    return true;
  });

  const themeOptions = [
    { value: 'light' as const, icon: 'light_mode', label: 'Terang' },
    { value: 'system' as const, icon: 'settings_brightness', label: 'Sistem' },
    { value: 'dark' as const, icon: 'dark_mode', label: 'Gelap' },
  ];

  return (
    <>
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 z-[60] md:hidden bg-black/60"
        style={{ opacity: 0, pointerEvents: 'none', visibility: 'hidden' }}
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[61] md:hidden bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800"
        style={{
          transform: 'translateY(100%)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          willChange: 'transform',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        {/* Branding + Close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2.5">
          <div className="flex items-center gap-3">
            <div className="size-11 flex items-center justify-center shrink-0">
              <img src="/images/logo.webp" alt="WaroengKoe Logo" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(29,120,255,0.45)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black leading-tight text-slate-900 dark:text-slate-100 tracking-tight">
                Waroeng
                <span className="text-blue-500 dark:text-blue-400">Koe!</span>
              </h1>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400/70 tracking-[0.25em] uppercase leading-none">
                Smart System
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Tutup"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="px-4 pb-2 flex flex-col gap-0.5 max-h-[42vh] overflow-y-auto">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => { navigate(item.href); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div
                  className={`flex items-center justify-center rounded-xl size-9 shrink-0 transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon name={item.icon} className="text-[18px]" />
                </div>
                <span className="text-sm font-bold flex-1">{item.name}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-slate-100 dark:border-slate-800" />

        {/* Theme Selector */}
        <div className="px-4 pb-3">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1 block mb-2">
            Tema Tampilan
          </span>
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex gap-1">
            {themeOptions.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  theme === t.value
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon name={t.icon} className="text-base" />
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="size-10 rounded-full ring-2 ring-white dark:ring-slate-700 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-sm font-black">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 tracking-wider uppercase">
                {user?.is_admin ? 'Admin Toko' : 'Kasir'}
              </p>
            </div>
            <button
              onClick={() => { useAuthStore.getState().logout(); navigate('/login'); }}
              className="p-2 rounded-xl text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
              title="Logout"
              aria-label="Logout"
            >
              <Icon name="logout" className="text-lg" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              WaroengKoe v2.2
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
