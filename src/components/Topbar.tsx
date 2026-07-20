import { useState, useEffect, type ReactNode } from 'react';
import Icon from './Icon';
import OverflowMarquee from './OverflowMarquee';
import { useAuthStore } from '@/store/authStore';

export interface SearchConfig {
  value?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
  rightContent?: ReactNode;
  subHeader?: ReactNode;
}

interface TopbarProps {
  title?: string;
  onToggleSidebar: () => void;
  searchConfig?: SearchConfig;
  actionButton?: ReactNode;
}

export default function Topbar({ title, onToggleSidebar, searchConfig, actionButton }: TopbarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const showSearch = !!searchConfig;

  return (
    <header className="flex h-[72px] items-center bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/60 px-4 md:px-8 py-3 z-30 fixed top-0 left-0 right-0 md:sticky md:top-0 gap-2 md:gap-4">
      <button onClick={onToggleSidebar} className="hidden mr-1 size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
        <Icon name="menu" className="text-xl" />
      </button>

      <div className={`${showSearch ? 'shrink-0' : 'flex-1'} min-w-0 max-w-[65vw] md:max-w-[55%]`}>
        <OverflowMarquee>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight ml-1 md:ml-0 uppercase whitespace-nowrap">
            {title || 'Dashboard'}
          </h1>
        </OverflowMarquee>
      </div>

      {showSearch && (
        <div className="hidden md:block flex-1 max-w-md ml-4">
          <div className="relative w-full group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-800 dark:text-slate-400 group-focus-within:text-blue-500">
              <Icon name="search" className="text-[20px]" />
            </div>
            <input
              id="global-search-input"
              type="text"
              value={searchConfig?.value || ''}
              onChange={(e) => searchConfig?.onSearch?.(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-gray-700 dark:placeholder-slate-500 focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 shadow-sm transition-all"
              placeholder={searchConfig?.placeholder ? `${searchConfig.placeholder} [F4 / Spasi]` : 'Cari... [F4 / Spasi]'}
            />
            {searchConfig?.value && (
              <button onClick={() => searchConfig?.onSearch?.('')} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <Icon name="close" className="text-xl" />
              </button>
            )}
          </div>
        </div>
      )}

      {(actionButton || searchConfig?.rightContent) && (
        <div className="hidden md:flex ml-2">{actionButton || searchConfig?.rightContent}</div>
      )}

      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        <div className="hidden md:flex items-center gap-3 text-slate-900 dark:text-slate-100 bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <div className="flex items-center gap-2">
            <Icon name="schedule" className="text-blue-500 dark:text-blue-400 text-[18px]" />
            <span className="text-sm font-black">{currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="h-4 w-px bg-[#e5e7eb] dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <Icon name="calendar_today" className="text-blue-500 dark:text-blue-400 text-[18px]" />
            <span className="text-[11px] font-black uppercase tracking-widest">{formatDate(currentDate)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
