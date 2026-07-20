import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import BottomSheet from './BottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import type { User } from '@/types';

interface BottomNavProps {
  user?: User;
}

export default function BottomNav({ user }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const navBg = isDark ? '#111317' : '#ffffff';
  const navBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';
  const centerBtnBorder = isDark ? '#111317' : '#ffffff';

  const getActiveIndex = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/barang')) return 0;
    if (pathname.startsWith('/kasir/riwayat')) return 1;
    if (pathname === '/kasir' || pathname === '/') return 2;
    if (pathname.startsWith('/keuntungan')) return 3;
    return -1;
  };

  const activeIndex = getActiveIndex();

  const navItems = [
    { name: 'Produk', href: '/barang', icon: 'inventory_2', index: 0 },
    { name: 'Riwayat', href: '/kasir/riwayat', icon: 'receipt_long', index: 1 },
    { name: 'Kasir', href: '/kasir', icon: 'point_of_sale', isCenter: true, index: 2 },
    { name: 'Laporan', href: '/keuntungan', icon: 'summarize', index: 3 },
  ];

  return (
    <>
      <style>{`
        @keyframes spring-pop {
          0% { transform: scale(0.85) translateY(0); }
          50% { transform: scale(1.12) translateY(-4px); }
          80% { transform: scale(0.96) translateY(0.5px); }
          100% { transform: scale(1.05) translateY(-1px); }
        }
        .active-spring-icon { animation: spring-pop 0.35s cubic-bezier(0.25, 0.8, 0.25, 1.3) forwards; }
        .sliding-active-bar { transition: left 0.45s cubic-bezier(0.34, 1.4, 0.5, 1), opacity 0.3s ease-out, transform 0.45s cubic-bezier(0.34, 1.4, 0.5, 1); }
      `}</style>
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden select-none" style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          <div className="h-16 flex items-end relative w-full">
            <div className="flex-1 h-full border-t" style={{ backgroundColor: navBg, borderColor: navBorder }} />
            <div className="w-24 h-20 relative shrink-0">
              <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 96 80" fill="none">
                <path d="M 0 16 C 18 16, 22 0, 48 0 C 74 0, 78 16, 96 16 L 96 80 L 0 80 Z" fill={navBg} />
                <path d="M 0 16 C 18 16, 22 0, 48 0 C 74 0, 78 16, 96 16" fill="none" stroke={navBorder} strokeWidth="1.2" />
              </svg>
            </div>
            <div className="flex-1 h-full border-t" style={{ backgroundColor: navBg, borderColor: navBorder }} />
          </div>
          <div className="w-full" style={{ backgroundColor: navBg, height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
        <div className="absolute inset-0 flex flex-col">
          <div className="h-16 grid grid-cols-5 items-center w-full relative">
            <div className="absolute bottom-0 h-1 flex justify-center sliding-active-bar pointer-events-none" style={{ width: '20%', left: `${activeIndex >= 0 ? activeIndex * 20 : 0}%`, opacity: (activeIndex === 0 || activeIndex === 1 || activeIndex === 3) ? 1 : 0, transform: (activeIndex === 0 || activeIndex === 1 || activeIndex === 3) ? 'scaleX(1)' : 'scaleX(0)' }}>
              <span className="w-10 h-full bg-[#1d6eff] rounded-t-full shadow-[0_-2px_8px_rgba(29,110,255,0.6)]" />
            </div>
            {navItems.map((item) => {
              const active = activeIndex === item.index;
              if (item.isCenter) {
                return (
                  <button key={item.href} onClick={() => navigate(item.href)} className="relative -top-5 flex flex-col items-center group z-50 transition-transform active:scale-[0.98] w-full justify-center" aria-label="Kasir">
                    <div className={`flex items-center justify-center rounded-2xl size-13 bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-4 shadow-[0_4px_12px_rgba(29,110,255,0.4)] transition-all duration-200 group-hover:brightness-110 ${active ? 'scale-105' : ''}`} style={{ borderColor: centerBtnBorder }}>
                      <Icon name={item.icon} className="text-[24px]" />
                    </div>
                    <span className={`text-[9px] font-black mt-0.5 tracking-tight ${active ? 'text-blue-400 font-extrabold' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name}</span>
                  </button>
                );
              }
              return (
                <button key={item.href} onClick={() => navigate(item.href)} className={`flex flex-col items-center justify-center w-full h-full py-1 active:scale-[0.98] transition-transform ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                  <div className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all duration-300 relative ${active ? (isDark ? 'text-white' : 'text-slate-900') + ' scale-110 active-spring-icon' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Icon name={item.icon} className="text-[20px]" />
                  </div>
                  <span className={`text-[9px] font-black mt-0.5 tracking-tight transition-all duration-300 ${active ? (isDark ? 'text-white' : 'text-slate-900') + ' scale-105' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name}</span>
                </button>
              );
            })}
            <button onClick={() => setSheetOpen(true)} className={`flex flex-col items-center justify-center w-full h-full py-1 active:scale-[0.98] transition-transform ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`} aria-label="Menu Lainnya">
              <div className={`flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 transition-all duration-300 ${sheetOpen ? 'text-blue-400' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                <Icon name="menu" className="text-[20px]" />
              </div>
              <span className={`text-[9px] font-black mt-0.5 tracking-tight transition-colors ${sheetOpen ? 'text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lainnya</span>
            </button>
          </div>
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
        </div>
      </div>
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} user={user} />
    </>
  );
}
