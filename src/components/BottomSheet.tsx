import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import Icon from './Icon';
import type { User } from '@/types';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  user?: User;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Kategori', href: '/kategori', icon: 'category', permission: 'can_manage_category' },
  { name: 'Satuan', href: '/satuan', icon: 'straighten', permission: 'can_manage_category' },
  { name: 'Audit Stok', href: '/audit-stok', icon: 'fact_check' },
  { name: 'Pengguna', href: '/pengguna', icon: 'group', adminOnly: true },
  { name: 'Log Aktivitas', href: '/log-aktivitas', icon: 'history', permission: 'can_view_activity_log' },
  { name: 'Pengaturan', href: '/pengaturan', icon: 'settings' },
];

export default function BottomSheet({ open, onClose, user }: BottomSheetProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="px-5 pb-6 overflow-y-auto">
          <div className="flex flex-col gap-1 pt-4">
            {navItems.map((item) => {
              if (item.permission && !user?.is_admin && !user?.[item.permission as keyof User]) return null;
              if (item.adminOnly && !user?.is_admin) return null;
              return (
                <button key={item.href} onClick={() => { navigate(item.href); onClose(); }} className="flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
                  <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                    <Icon name={item.icon} className="text-lg" />
                  </div>
                  <span className="text-sm font-bold">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Tema Tampilan</span>
            <div className="mt-2 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-[10px] flex gap-1">
              <button onClick={() => setTheme('light')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}><Icon name="light_mode" className="text-lg" /></button>
              <button onClick={() => setTheme('system')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}><Icon name="settings_brightness" className="text-lg" /></button>
              <button onClick={() => setTheme('dark')} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}><Icon name="dark_mode" className="text-lg" /></button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            {user && (
              <div className="flex items-center gap-3 px-1 py-2">
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-black shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                  <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 tracking-wider uppercase">{user.is_admin ? 'Admin Toko' : 'Kasir'}</p>
                </div>
                <button onClick={() => { useAuthStore.getState().logout(); navigate('/login'); }} className="size-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                  <Icon name="logout" className="text-lg" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
