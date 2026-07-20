import {
  useState,
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar, { type SearchConfig } from './Topbar';
import BottomNav from './BottomNav';
import { useToast } from './ToastProvider';
import LoadingErrorBoundary from './LoadingErrorBoundary';
import { useAuthStore } from '@/store/authStore';
import Icon from './Icon';

interface SidebarContextType {
  sidebarMobileOpen: boolean;
  setSidebarMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarContext.Provider');
  return context;
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  searchConfig?: SearchConfig;
  actionButton?: ReactNode;
  hideBottomNav?: boolean;
}

export default function AppLayout({
  children,
  title,
  searchConfig,
  actionButton,
  hideBottomNav,
}: AppLayoutProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const indexPaths = [
    '/', '/dashboard', '/kasir', '/kasir/riwayat',
    '/barang', '/kategori', '/satuan',
    '/pengguna', '/pengaturan', '/keuntungan',
    '/audit-stok', '/log-aktivitas',
  ];
  const isIndexPage = indexPaths.includes(location.pathname);

  const finalHideBottomNav =
    hideBottomNav !== undefined ? hideBottomNav : !isIndexPage;

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const toast = useToast();

  const toggleMobileSidebar = () => setSidebarMobileOpen((v) => !v);
  const closeMobileSidebar = () => setSidebarMobileOpen(false);

  // --- ROBUST SCROLL RESTORATION ---
  const prevPathRef = useRef<string>(location.pathname + location.search);

  useEffect(() => {
    const contentArea = document.getElementById('main-content');
    if (!contentArea) return;

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    let isHistoryVisit = false;
    const handlePopstate = () => {
      isHistoryVisit = true;
    };
    window.addEventListener('popstate', handlePopstate);

    const getScrollPos = () =>
      window.innerWidth < 768 ? window.scrollY : contentArea.scrollTop;

    const applyScrollPos = (pos: number) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (window.innerWidth < 768) {
            window.scrollTo({ top: pos, behavior: 'instant' as any });
          } else {
            const area = document.getElementById('main-content');
            if (area) area.scrollTop = pos;
          }
        });
      });
    };

    // Save scroll position for the PREVIOUS page before we navigated
    const handleBeforeNavigate = () => {
      const currentUrl = prevPathRef.current;
      const pos = getScrollPos();
      sessionStorage.setItem(`scroll_${currentUrl}`, pos.toString());
    };

    // Listen to scroll to update current page scroll position
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isHistoryVisit) return;
        const url = location.pathname + location.search;
        const pos = getScrollPos();
        sessionStorage.setItem(`scroll_${url}`, pos.toString());
      }, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    contentArea.addEventListener('scroll', handleScroll, { passive: true });

    // Restore scroll for the NEW page
    const nextUrl = location.pathname + location.search;
    const savedScroll = sessionStorage.getItem(`scroll_${nextUrl}`);

    if (isHistoryVisit && savedScroll) {
      applyScrollPos(parseInt(savedScroll, 10));
    } else {
      applyScrollPos(0);
    }
    isHistoryVisit = false;

    // Save current path to ref for the next change
    prevPathRef.current = nextUrl;

    return () => {
      window.removeEventListener('popstate', handlePopstate);
      window.removeEventListener('scroll', handleScroll);
      contentArea.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [location.pathname, location.search]);

  return (
    <SidebarContext.Provider
      value={{
        sidebarMobileOpen,
        setSidebarMobileOpen,
      }}
    >
      {/* Main Container */}
      <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full bg-slate-50 dark:bg-slate-950 md:overflow-hidden">
        {sidebarMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 hidden"
            onClick={closeMobileSidebar}
          />
        )}

        <Sidebar
          user={user ?? undefined}
          mobileOpen={sidebarMobileOpen}
          onClose={closeMobileSidebar}
        />

        <main className="flex-1 flex flex-col min-h-screen md:min-h-0 md:h-full md:overflow-hidden md:ml-20">
          <Topbar
            title={title}
            onToggleSidebar={toggleMobileSidebar}
            searchConfig={searchConfig}
            actionButton={actionButton}
          />

          <div id="main-content" className="flex-1 md:overflow-y-auto">
            <div
              className={`p-5 pt-[84px] md:p-8 md:pt-8 md:pb-8 ${
                finalHideBottomNav
                  ? 'pb-8 sm:p-6 sm:pb-8'
                  : 'pb-32 sm:p-6 sm:pb-36'
              }`}
            >
              {searchConfig && (
                <div className="md:hidden fixed top-[72px] left-0 right-0 z-20 px-5 pt-3 pb-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-all">
                  <div className="relative w-full group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5 text-slate-500 dark:text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Icon
                        name="search"
                        className="text-[20px]"
                      />
                    </div>
                    <input
                      id="mobile-search-input"
                      type="text"
                      value={searchConfig.value || ''}
                      onChange={(e) => searchConfig.onSearch?.(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-11 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all"
                      placeholder={searchConfig.placeholder || 'Cari...'}
                    />
                    {searchConfig.value && (
                      <button
                        onClick={() => searchConfig.onSearch?.('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <Icon
                          name="close"
                          className="text-xl"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {searchConfig && <div className="md:hidden h-[64px]" />}

              {searchConfig && (
                <div className="md:hidden flex flex-col gap-3 mb-2">
                  {actionButton && <div className="flex w-full">{actionButton}</div>}
                  {searchConfig.subHeader && <div className="w-full">{searchConfig.subHeader}</div>}
                </div>
              )}

              <div className="flex flex-col gap-8 pt-4 md:pt-0 animate-fade-in-up">
                <LoadingErrorBoundary>{children}</LoadingErrorBoundary>
              </div>
            </div>
          </div>
        </main>

        {!finalHideBottomNav && <BottomNav user={user ?? undefined} />}
      </div>
    </SidebarContext.Provider>
  );
}
