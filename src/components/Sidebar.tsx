import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import Icon from './Icon';
import type { User } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  featured?: boolean;
  permission?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Kasir', href: '/kasir', icon: 'point_of_sale', featured: true },
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Produk', href: '/barang', icon: 'inventory_2' },
  { name: 'Kategori', href: '/kategori', icon: 'category', permission: 'can_manage_category' },
  { name: 'Satuan', href: '/satuan', icon: 'straighten', permission: 'can_manage_category' },
  { name: 'Riwayat', href: '/kasir/riwayat', icon: 'receipt_long' },
  { name: 'Audit Stok', href: '/audit-stok', icon: 'fact_check' },
  { name: 'Laporan', href: '/keuntungan', icon: 'summarize' },
  { name: 'Pengguna', href: '/pengguna', icon: 'group', adminOnly: true },
  { name: 'Log Aktivitas', href: '/log-aktivitas', icon: 'history', permission: 'can_view_activity_log' },
  { name: 'Pengaturan', href: '/pengaturan', icon: 'settings' },
];

interface SidebarProps {
  user?: User;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  user,
  mobileOpen,
  onClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Block body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Handle hover expand (desktop only) - instant response
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth >= 768 && collapsed) {
      setCollapsed(false);
    }
  }, [collapsed, setCollapsed]);

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth >= 768 && !collapsed) {
      setCollapsed(true);
    }
  }, [collapsed, setCollapsed]);

  const isActive = (href: string) => {
    const pathname = location.pathname;
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/kasir') return pathname === '/kasir' || pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    useAuthStore.getState().logout();
    navigate('/login');
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4.5
        fixed z-50 h-full shadow-2xl md:shadow-sm hidden md:flex
        md:transition-[width,padding] md:duration-300 md:ease-in-out
        ${collapsed ? 'md:w-20 items-center' : 'md:w-64'}
        max-md:items-stretch
      `}
    >
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        aria-label="Tutup sidebar"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400 md:hidden hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
      >
        <Icon name="close" className="text-[24px]" />
      </button>

      <div className="flex flex-col flex-1 min-h-0 gap-5 w-full">
        {/* Logo */}
        <div
          className={`flex items-center shrink-0 w-full transition-[width,opacity] duration-300 ease-out ${collapsed && !mobileOpen ? 'justify-center' : 'gap-2.5 px-3.5 max-md:px-4'}`}
        >
          <div className={`flex items-center justify-center shrink-0 transform hover:scale-105 transition-all cursor-pointer ${collapsed && !mobileOpen ? 'size-10' : 'size-11'}`}>
            <img src="/images/logo.webp" alt="WaroengKoe Logo" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(29,120,255,0.45)]" />
          </div>
          <div
            className={`flex flex-col transition-[max-width,opacity] duration-300 ease-out overflow-hidden whitespace-nowrap ${mobileOpen || !collapsed ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'} max-md:max-w-none max-md:opacity-100`}
          >
            <h1 className="text-lg font-black leading-tight text-slate-900 dark:text-slate-100 tracking-tight">
              Waroeng
              <span className="text-blue-500 dark:text-blue-400">
                Koe!
              </span>
            </h1>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400/70 tracking-[0.25em] uppercase leading-none">
              Smart System
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex flex-col gap-0.5 flex-1 overflow-y-auto w-full ${collapsed && !mobileOpen ? 'scrollbar-hide items-center px-2' : 'scrollbar-hover px-3.5 max-md:px-4'}`}
        >
          {navItems.map((item) => {
            // Check permission-based access
            if (item.permission) {
              if (!user?.is_admin && !user?.[item.permission as keyof User])
                return null;
            }
            // Check admin-only access
            else if (item.adminOnly && !user?.is_admin) {
              return null;
            }

            const active = isActive(item.href);
            const featured = item.featured;
            const isExpanded = mobileOpen || !collapsed;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                title={!isExpanded ? item.name : undefined}
                className={`
                  group relative flex items-center transition-all duration-200 ease-in-out
                  ${!isExpanded
                    ? `justify-center w-full max-md:justify-start max-md:px-3 max-md:gap-2.5 max-md:rounded-2xl ${featured ? 'py-3.5' : 'py-1.5'}`
                    : `gap-2.5 px-3 rounded-2xl w-full ${featured ? 'py-3 mb-1.5' : 'py-2'}`
                  }
                  ${active
                    ? isExpanded
                      ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/20 shadow-sm'
                      : 'text-blue-700 dark:text-blue-400'
                    : featured
                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/10'
                    : 'text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                  }
                `}
              >
                {/* Active Indicator Line */}
                {active && (
                  <div className={`
                    absolute w-1 h-6 bg-blue-500 dark:bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(0,110,255,0.5)]
                    ${isExpanded ? '-left-4 md:-left-3.5' : '-left-4 md:-left-2'}
                  `} />
                )}

                <div
                  className={`
                    flex items-center justify-center rounded-full shrink-0 transition-all duration-200 ease-in-out
                    ${featured ? 'size-11' : 'size-9'}
                    ${active
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_8px_20px_-4px_rgba(0,110,255,0.5)] scale-110'
                      : featured
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 group-hover:brightness-110'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:shadow-md group-hover:shadow-black/5 group-hover:scale-105'
                    }
                  `}
                >
                  <Icon
                    name={item.icon}
                    className={`${featured ? 'text-[24px]' : 'text-[18px]'} transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5`}
                  />
                </div>
                <span
                  className={`transition-[max-width,opacity] duration-300 ease-out overflow-hidden whitespace-nowrap ${mobileOpen || !collapsed ? 'max-w-[160px] opacity-100 delay-100' : 'max-w-0 opacity-0'} max-md:max-w-none max-md:opacity-100 max-md:delay-0 ${featured ? 'text-sm font-black tracking-tight' : 'text-xs font-bold'}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Theme Selector (Light, System, Dark) */}
      <div
        className={`flex flex-col shrink-0 mt-4 mb-2 transition-all duration-300 ${collapsed && !mobileOpen ? 'items-center px-2' : 'px-3.5 max-md:px-4'}`}
      >
        {(!collapsed || mobileOpen) ? (
          <>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-[0.2em] mb-1.5 px-1">
              Tema Tampilan
            </span>

            <div className="theme-selector p-0.5 bg-slate-100 dark:bg-slate-800 rounded-[10px] flex gap-1">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                title="Mode Terang"
              >
                <Icon name="light_mode" className="text-lg" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                title="Ikuti Sistem"
              >
                <Icon name="settings_brightness" className="text-lg" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                title="Mode Gelap"
              >
                <Icon name="dark_mode" className="text-lg" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => {
              const cycle: Record<string, string> = { light: 'system', system: 'dark', dark: 'light' };
              setTheme((cycle[theme] || 'system') as any);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all hover:scale-110 active:scale-[0.98] shadow-sm"
            title={`Tema: ${theme === 'light' ? 'Terang' : theme === 'dark' ? 'Gelap' : 'Sistem'}`}
          >
            <Icon name={theme === 'light' ? 'light_mode' : theme === 'dark' ? 'dark_mode' : 'settings_brightness'} className="text-lg" />
          </button>
        )}
      </div>

      {/* User Profile */}
      <div
        className={`flex flex-col shrink-0 w-full ${collapsed && !mobileOpen ? 'px-0' : 'px-3.5 max-md:px-4'}`}
      >
        <div
          className={`flex items-center shrink-0 mt-auto mb-0 transition-all duration-200 ease-in-out ${collapsed && !mobileOpen ? 'w-full py-3 justify-center border-t border-slate-200 dark:border-slate-800' : 'gap-2.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 w-full group/profile shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800'}`}
        >
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 ring-2 ring-white dark:ring-slate-700 shadow-blue-500/10 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 transition-transform group-hover/profile:scale-105">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-black">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div
            className={`flex flex-col overflow-hidden transition-[max-width,opacity] duration-300 ease-out whitespace-nowrap ${mobileOpen || !collapsed ? 'max-w-[150px] opacity-100 ml-0 flex-1' : 'max-w-0 opacity-0 ml-0'} max-md:max-w-none max-md:opacity-100 max-md:flex-1`}
          >
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 tracking-wider uppercase">
              {user?.is_admin ? 'Admin Toko' : 'Kasir'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={`text-slate-700 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-[max-width,opacity,transform,background-color] duration-300 ease-out overflow-hidden ${mobileOpen || !collapsed ? 'max-w-[40px] opacity-100 scale-100 p-1.5' : 'max-w-0 opacity-0 scale-0 p-0'} max-md:max-w-none max-md:opacity-100 max-md:scale-100 max-md:p-1.5 cursor-pointer`}
            title="Logout"
            aria-label="Logout"
          >
            <Icon name="logout" className="text-lg" />
          </button>
        </div>
      </div>

      {/* App Version */}
      <div className={`text-center transition-[opacity,height] duration-300 overflow-hidden ${collapsed && !mobileOpen ? 'h-0 opacity-0 mt-0' : 'h-auto opacity-100 mt-1'}`}>
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          WaroengKoe v2.2
        </span>
      </div>
    </aside>
  );
}
