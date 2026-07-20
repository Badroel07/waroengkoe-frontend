import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import AutoFitText from '@/components/AutoFitText';
import Icon from '@/components/Icon';
import Skeleton from '@/components/Skeleton';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { apiFetch } from '@/lib/api';

const StatsCards = lazy(() => import('./Partials/StatsCards'));
const KinerjaPenjualanChart = lazy(() => import('./Partials/KinerjaPenjualanChart'));
const LowStockList = lazy(() => import('./Partials/LowStockList'));

const currencyFormatter = new Intl.NumberFormat("id-ID");
const formatCurrency = (value: number) => currencyFormatter.format(value);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const formatFullDate = (date: Date) =>
  `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

const ClockDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-start md:items-end flex-shrink-0">
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter leading-none">
          {time.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
      </div>
      <p className="text-[8px] md:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1.5 md:mt-2">
        WIB
      </p>
    </div>
  );
};

const GreetingHeader = ({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreetingDetails = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 11)
      return { text: "Selamat Pagi", icon: "light_mode", color: "text-amber-500" };
    if (hour >= 11 && hour < 15)
      return { text: "Selamat Siang", icon: "light_mode", color: "text-blue-500" };
    if (hour >= 15 && hour < 18)
      return { text: "Selamat Sore", icon: "light_mode", color: "text-orange-500" };
    return { text: "Selamat Malam", icon: "dark_mode", color: "text-indigo-400" };
  };

  const g = getGreetingDetails();

  return (
    <div className="relative py-4 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-100 dark:border-slate-800">
      <div className="flex flex-row items-center gap-4 md:gap-8 min-w-0">
        <div className="relative shrink-0 w-fit group">
          <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative size-14 md:size-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500 transform transition-transform group-hover:scale-105 duration-500">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl md:text-3xl font-black">
                {displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 size-4 md:size-5 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center p-0.5 shadow-lg z-10">
            <div className="size-full rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-1.5 md:space-y-2 min-w-0">
          <div className="flex items-center gap-2 opacity-50 uppercase tracking-[0.2em] font-black text-[8px] md:text-[11px] dark:text-slate-400">
            <Icon name={g.icon} className="text-[11px] md:text-xs" />
            <span className="truncate">
              {g.text} • {formatFullDate(currentTime)}
            </span>
          </div>
          <h1 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate">
            Halo,{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {displayName}
            </span>
          </h1>
        </div>
      </div>

      <ClockDisplay />
    </div>
  );
};

const StatCardSkeleton = ({ label }: { label: string }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-500">
    <div className="space-y-1">
      <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
        {label}
      </p>
      <div className="text-slate-900 dark:text-white">
        <Skeleton className="h-7 w-3/4" />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const products = useProductStore((s) => s.products);
  const { resolvedTheme } = useTheme();

  const [period, setPeriod] = useState('6');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // API-driven state
  type ChangeDirection = 'up' | 'down' | 'neutral';
  interface StatChange { percent: number; delta: number; direction: ChangeDirection }
  const [stats, setStats] = useState<{
    penjualanHariIni: number;
    pesananHariIni: number;
    produkTerjualHariIni: number;
    pendapatanBersihHariIni: number;
    statsChanges: {
      penjualan: StatChange;
      pesanan: StatChange;
      produkTerjual: StatChange;
      pendapatanBersih: StatChange;
    };
  }>({
    penjualanHariIni: 0, pesananHariIni: 0, produkTerjualHariIni: 0, pendapatanBersihHariIni: 0,
    statsChanges: {
      penjualan: { percent: 0, delta: 0, direction: 'neutral' },
      pesanan: { percent: 0, delta: 0, direction: 'neutral' },
      produkTerjual: { percent: 0, delta: 0, direction: 'neutral' },
      pendapatanBersih: { percent: 0, delta: 0, direction: 'neutral' },
    },
  });
  const [chart, setChart] = useState<{ labels: string[]; data: number[]; profitData: number[]; total: number; totalProfit: number }>({ labels: [], data: [], profitData: [], total: 0, totalProfit: 0 });
  const [lowStockItems, setLowStockItems] = useState<{ id: string; nama: string; kategori_nama: string; stok: number; batas_stok_rendah: number; satuan_dasar: string }[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('waroengkoe_token');
    if (!token) return;

    setChartLoading(true);

    Promise.all([
      apiFetch<{ success: boolean; data: any }>('/api/dashboard?period=' + period + '&year=' + year),
      apiFetch<{ success: boolean; data: any }>('/api/sync/down'),
    ]).then(([dashboardRes, syncRes]) => {
      const d = dashboardRes?.data || {};

      // Stats
      const statsChangesRaw = d.stats_changes || {};
      const parseChange = (raw: any) => {
        if (!raw) return { percent: 0, delta: 0, direction: 'neutral' as const };
        const percent = Number(raw.percent || 0);
        const delta = Number(raw.delta || 0);
        let direction: 'up' | 'down' | 'neutral' = raw.direction || 'neutral';
        if (direction !== 'up' && direction !== 'down' && direction !== 'neutral') {
          direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
        }
        return { percent, delta, direction };
      };

      setStats({
        penjualanHariIni: Number(d.penjualan_hari_ini || 0),
        pesananHariIni: Number(d.pesanan_hari_ini || 0),
        produkTerjualHariIni: Number(d.produk_terjual_hari_ini || 0),
        pendapatanBersihHariIni: Number(d.pendapatan_bersih_hari_ini || 0),
        statsChanges: {
          penjualan: parseChange(statsChangesRaw.penjualan),
          pesanan: parseChange(statsChangesRaw.pesanan),
          produkTerjual: parseChange(statsChangesRaw.produk_terjual),
          pendapatanBersih: parseChange(statsChangesRaw.pendapatan_bersih),
        },
      });

      // Chart
      const chartData = d.chart || {};
      setChart({
        labels: Array.isArray(chartData.labels) ? chartData.labels : [],
        data: Array.isArray(chartData.data) ? chartData.data : [],
        profitData: Array.isArray(chartData.profit_data) ? chartData.profit_data : [],
        total: Number(chartData.total || 0),
        totalProfit: Number(chartData.total_profit || 0),
      });

      // Available years
      if (Array.isArray(d.available_years)) {
        setAvailableYears(d.available_years);
      }

      // Low stock from /api/barang/stats or dashboard
      const lowStock = d.low_stock_items || [];
      setLowStockItems(Array.isArray(lowStock) ? lowStock.slice(0, 5).map((item: any) => ({
        id: String(item.id),
        nama: item.nama || '',
        kategori_nama: item.kategori_nama || '',
        stok: Number(item.stok || 0),
        batas_stok_rendah: Number(item.batas_stok_rendah || 5),
        satuan_dasar: item.satuan_dasar || 'Pcs',
      })) : []);

      // Update product store with sync data
      if (syncRes?.data?.products) {
        const mapped = syncRes.data.products
          .filter((p: any) => !p.deleted_at)
          .map((p: any) => ({
            id: String(p.id),
            sku: p.sku || '',
            nama: p.nama_barang || '',
            gambar_url: p.gambar || null,
            satuan_dasar: p.satuan_dasar || 'Pcs',
            harga_beli: Number(p.harga_beli || 0),
            stok: Number(p.stok || 0),
            status: p.status === 'active' ? 'aktif' : (p.status || 'aktif'),
            kategori_id: String(p.kategori_id || ''),
            kategori_nama: p.kategori_nama || p.kategori?.nama || '',
            satuans: (p.satuans || []).map((s: any) => ({
              id: String(s.id),
              nama: s.nama_satuan || 'Pcs',
              konversi: Number(s.konversi || 1),
              harga_jual: Number(s.harga_jual || 0),
              is_visible: true,
              is_default: Boolean(s.is_default),
              qty_gratis: s.qty_gratis || 0,
            })),
            batas_stok_rendah: p.batas_stok_rendah || 5,
            created_at: p.created_at || '',
            harga: Number(p.harga_jual || 0),
          }));
        useProductStore.setState({ products: mapped });
      }
    }).catch(err => console.error('Dashboard fetch error:', err))
    .finally(() => { setLoading(false); setChartLoading(false); });
  }, [period, year]);

  // If no user, fallback to local store for low stock
  useEffect(() => {
    if (lowStockItems.length === 0 && products.length > 0) {
      const local = products
        .filter((p) => p.stok <= p.batas_stok_rendah && p.status === 'aktif')
        .slice(0, 5)
        .map(p => ({ id: p.id, nama: p.nama, kategori_nama: p.kategori_nama, stok: p.stok, batas_stok_rendah: p.batas_stok_rendah, satuan_dasar: p.satuan_dasar }));
      setLowStockItems(local);
    }
  }, [products, lowStockItems.length]);

  const displayName = useMemo(() => {
    const fullName = user?.name;
    if (!fullName) return "User";
    const nameParts = fullName.trim().split(" ").filter(Boolean);
    return nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0];
  }, [user]);

  // If dashboard API fails, compute monthly chart from local transactions
  const monthlyRevenue = chart.labels.length > 0 ? chart : { labels: MONTHS, data: [], profitData: [], total: 0, totalProfit: 0 };

  return (
    <AppLayout title="Dashboard">
      <GreetingHeader
        displayName={displayName}
        avatarUrl={user?.avatar}
      />

      <div className="mt-6">
        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tighter">
          Ringkasan Toko
        </h3>
        <p className="text-slate-650 dark:text-slate-400 text-sm font-medium mt-1">
          Pantau kinerja toko Anda hari ini.
        </p>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton label="Penjualan Hari Ini" />
            <StatCardSkeleton label="Pendapatan Bersih" />
            <StatCardSkeleton label="Jumlah Pembeli" />
            <StatCardSkeleton label="Produk Terjual" />
          </div>
        ) : (
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCardSkeleton label="Penjualan Hari Ini" />
              <StatCardSkeleton label="Pendapatan Bersih" />
              <StatCardSkeleton label="Jumlah Pembeli" />
              <StatCardSkeleton label="Produk Terjual" />
            </div>
          }>
            <StatsCards
              penjualanHariIni={stats.penjualanHariIni}
              pesananHariIni={stats.pesananHariIni}
              produkTerjualHariIni={stats.produkTerjualHariIni}
              pendapatanBersihHariIni={stats.pendapatanBersihHariIni}
              statsChanges={stats.statsChanges}
            />
          </Suspense>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 text-slate-900 dark:text-slate-100">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none">
          {chartLoading ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Suspense fallback={
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
                <Skeleton className="h-64 w-full" />
              </div>
            }>
              <KinerjaPenjualanChart
                monthlyRevenue={monthlyRevenue}
                resolvedTheme={resolvedTheme}
                filters={{ period, year }}
                availableYears={availableYears}
                handlePeriodChange={setPeriod}
                handleYearChange={setYear}
              />
            </Suspense>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <Icon
                  name="warning"
                  className="text-red-500 dark:text-red-400 text-lg"
                />
              </div>
              <h3 className="text-lg font-bold">Stok Menipis</h3>
            </div>
            <a
              href="/barang?stok_filter=rendah"
              onClick={(e) => {
                e.preventDefault();
                navigate('/barang');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
            >
              Lihat Semua
            </a>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-64">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex flex-col gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              }>
                <LowStockList lowStockItems={lowStockItems} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
