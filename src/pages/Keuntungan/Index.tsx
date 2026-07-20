import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import NetworkAwareImage from '@/components/NetworkAwareImage';
import Skeleton from '@/components/Skeleton';
import TableSkeleton from '@/components/TableSkeleton';
import { useProfitStore } from '@/store/profitStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useProductStore } from '@/store/productStore';
import { formatIDR } from '@/lib/idr';

// local helper functions
const todayLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const startOfMonthLocal = () => {
  const d = new Date();
  d.setDate(1);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

// 1. Summary Cards Component
function SummaryCards({ totals, isLoading }: { totals: { bruto: number; tara: number; netto: number }; isLoading?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Omset Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all group hover:shadow-lg dark:hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">
              Omset
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-40 mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatIDR(totals.bruto)}
              </h3>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
            <Icon
              name="payments"
              className="text-blue-600 dark:text-blue-400 text-xl"
            />
          </div>
        </div>
      </div>

      {/* Modal Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all group hover:shadow-lg dark:hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">
              Modal (HPP)
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-40 mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatIDR(totals.tara)}
              </h3>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
            <Icon
              name="account_balance_wallet"
              className="text-amber-600 dark:text-amber-400 text-xl"
            />
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all group hover:shadow-lg dark:hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">
              Keuntungan Bersih
            </p>
            {isLoading ? (
              <Skeleton className="h-8 w-40 mt-1" />
            ) : (
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatIDR(totals.netto)}
              </h3>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
            <Icon
              name="trending_up"
              className="text-emerald-600 dark:text-emerald-400 text-xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Averages Cards Component
interface AverageData {
  revenue: number;
  profit: number;
  months_count?: number;
  years_count?: number;
}
function AveragesCards({
  averages,
  isLoading,
}: {
  averages: { monthly: AverageData; yearly: AverageData };
  isLoading?: boolean;
}) {
  const monthly = averages.monthly;
  const yearly = averages.yearly;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Rata-rata Bulanan Card */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all group hover:shadow-lg dark:hover:border-blue-500/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              Rata-rata Bulanan (All-Time)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <Icon
                name="analytics"
                className="text-blue-600 dark:text-blue-400 text-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Omset Rata-rata
              </p>
              {isLoading ? (
                <Skeleton className="h-7 w-36 mt-1" />
              ) : (
                <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {formatIDR(monthly.revenue)}
                </h4>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Keuntungan Rata-rata
              </p>
              {isLoading ? (
                <Skeleton className="h-7 w-36 mt-1" />
              ) : (
                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatIDR(monthly.profit)}
                </h4>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Data Teranalisis
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase">
            {isLoading ? '...' : `${monthly.months_count} Bulan`}
          </span>
        </div>
      </div>

      {/* Rata-rata Tahunan Card */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all group hover:shadow-lg dark:hover:border-emerald-500/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
              Rata-rata Tahunan (All-Time)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <Icon
                name="summarize"
                className="text-emerald-600 dark:text-emerald-400 text-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Omset Rata-rata
              </p>
              {isLoading ? (
                <Skeleton className="h-7 w-36 mt-1" />
              ) : (
                <h4 className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {formatIDR(yearly.revenue)}
                </h4>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Keuntungan Rata-rata
              </p>
              {isLoading ? (
                <Skeleton className="h-7 w-36 mt-1" />
              ) : (
                <h4 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatIDR(yearly.profit)}
                </h4>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Data Teranalisis
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 uppercase">
            {isLoading ? '...' : `${yearly.years_count} Tahun`}
          </span>
        </div>
      </div>
    </div>
  );
}

// 3. Star Products List
interface StarProduct {
  id: string;
  nama: string;
  gambar_url?: string | null;
  total_terjual: number;
  satuan: string;
  netto: number;
}
function StarProductsList({ starProducts = [], isLoading }: { starProducts?: StarProduct[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="w-5 h-4 shrink-0" />
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </>
    );
  }

  if (starProducts.length > 0) {
    return starProducts.map((prod, i) => (
      <div
        key={`star-${prod.id}-${prod.satuan ?? i}`}
        className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/30"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-5 text-center font-black text-xs ${
              i === 0
                ? 'text-amber-500'
                : i === 1
                  ? 'text-slate-400'
                  : i === 2
                    ? 'text-amber-700 dark:text-amber-600'
                    : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            #{i + 1}
          </span>
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-850 overflow-hidden ring-1 ring-slate-300 dark:ring-slate-700 shrink-0">
            {prod.gambar_url ? (
              <NetworkAwareImage
                src={prod.gambar_url}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 border border-slate-250 dark:border-slate-800">
                <Icon name="inventory_2" className="text-sm" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
              {prod.nama}
            </h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              {prod.total_terjual} {prod.satuan} terjual
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            {formatIDR(prod.netto)}
          </span>
        </div>
      </div>
    ));
  }

  return (
    <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl">
      Belum ada data
    </p>
  );
}

// 4. Low Margin List
interface LowMarginProduct {
  id: string;
  nama: string;
  margin_percent: number;
  netto: number;
  bruto: number;
}
function LowMarginList({ lowMarginProducts = [], isLoading }: { lowMarginProducts?: LowMarginProduct[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-3 rounded-2xl bg-red-50/40 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16 rounded-md shrink-0" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (lowMarginProducts.length > 0) {
    return lowMarginProducts.map((prod, i) => (
      <div
        key={`low-${prod.id}-${i}`}
        className="p-3 rounded-2xl bg-red-50/40 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 transition-all flex flex-col gap-1"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate pr-2">
            {prod.nama}
          </h4>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 whitespace-nowrap">
            Margin {prod.margin_percent}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-medium">
            Netto:{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatIDR(prod.netto)}
            </span>
          </span>
          <span className="text-slate-500 font-medium">
            Bruto:{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatIDR(prod.bruto)}
            </span>
          </span>
        </div>
      </div>
    ));
  }

  return (
    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 rounded-2xl text-center">
      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        ✨ Semua margin produk sehat &gt; 15%
      </p>
    </div>
  );
}

// 5. Laporan Table Component
interface LaporanItem {
  id: string;
  nama: string;
  gambar?: string | null;
  gambar_url?: string | null;
  total_terjual: number;
  satuan: string;
  bruto: number;
  tara: number;
  netto: number;
  latest_invoice?: string;
}
interface LaporanTableProps {
  laporan: LaporanItem[];
  totals: { bruto: number; tara: number; netto: number };
  pagination: { nextCursor: string | null; prevCursor: string | null; hasMore: boolean };
  isLoading?: boolean;
  search?: string;
  kategori?: string;
  handleProductClick: (item: LaporanItem) => void;
  goToCursor: (cursor: string | null) => void;
}
function LaporanTable({
  laporan = [],
  totals,
  pagination,
  isLoading = false,
  search = '',
  kategori = '',
  handleProductClick,
  goToCursor,
}: LaporanTableProps) {
  if (isLoading && laporan.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden p-4">
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className={`transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none duration-150' : ''}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fcfcfc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all font-black">
              <tr>
                <th className="px-4 py-5 text-left text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Produk
                </th>
                <th className="px-4 py-5 text-center text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Terjual
                </th>
                <th className="px-4 py-5 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Bruto
                </th>
                <th className="px-4 py-5 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Modal
                </th>
                <th className="px-4 py-5 text-right text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {laporan.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-center w-full">
                      <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-dashed border-slate-300 dark:border-slate-800 scale-110 shadow-inner mx-auto">
                        <Icon
                          name={search || kategori ? 'manage_search' : 'analytics'}
                          className="text-5xl text-slate-400 dark:text-slate-700"
                        />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mx-auto">
                        {search || kategori ? 'Data Tidak Ditemukan' : 'Belum Ada Laporan'}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto text-sm leading-relaxed italic">
                        {search || kategori
                          ? `Maaf, kami tidak dapat menemukan data laporan dengan filter atau kata kunci "${search || 'tertentu'}".`
                          : 'Belum ada transaksi yang tercatat pada periode ini. Mulai berjualan untuk melihat analisis keuntungan Anda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                laporan.map((item, index) => (
                  <tr
                    key={`${item.id}-${item.satuan}-${index}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group dark:border-b dark:border-slate-800/50"
                    onClick={() => handleProductClick(item)}
                    title="Klik untuk audit detail transaksi"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-300 dark:ring-slate-700">
                          {item.gambar_url ? (
                            <NetworkAwareImage src={item.gambar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800">
                              <Icon name="inventory_2" className="text-lg" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            {item.nama}
                            <Icon name="search" className="text-xs opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">
                            {item.latest_invoice}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold">
                        {item.total_terjual} {item.satuan}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-blue-600 font-medium">
                      {formatIDR(item.bruto)}
                    </td>
                    <td className="px-4 py-4 text-right text-amber-600 font-medium">
                      {formatIDR(item.tara)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-bold ${item.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                        {formatIDR(item.netto)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {laporan.length > 0 && (
              <tfoot className="border-t border-slate-200 dark:border-slate-800 bg-[#fcfcfc] dark:bg-slate-900 transition-all font-black">
                <tr>
                  <td colSpan={2} className="px-4 py-5 text-[11px] text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em]">
                    Total Laporan
                  </td>
                  <td className="px-4 py-5 text-right text-blue-600 dark:text-blue-400 font-black">
                    {formatIDR(totals.bruto)}
                  </td>
                  <td className="px-4 py-5 text-right text-amber-600 dark:text-amber-400 font-black">
                    {formatIDR(totals.tara)}
                  </td>
                  <td className="px-4 py-5 text-right text-emerald-600 dark:text-emerald-400 font-black">
                    {formatIDR(totals.netto)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Desktop Pagination */}
        {(pagination.nextCursor || pagination.prevCursor) && (
          <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-end bg-white dark:bg-slate-900 transition-all">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToCursor(pagination.prevCursor)}
                disabled={!pagination.prevCursor}
                className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                aria-label="Halaman Sebelumnya"
              >
                <Icon name="chevron_left" className="text-xl" />
                <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline text-slate-600 dark:text-slate-400">Sebelumnya</span>
              </button>
              <button
                onClick={() => goToCursor(pagination.nextCursor)}
                disabled={!pagination.nextCursor}
                className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 transition-all shadow-sm active:scale-[0.98]"
                aria-label="Halaman Berikutnya"
              >
                <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline text-slate-600 dark:text-slate-400">Berikutnya</span>
                <Icon name="chevron_right" className="text-xl" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile / Tablet Cards View */}
      <div className="md:hidden space-y-4">
        {laporan.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 shadow-sm transition-all flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5 border border-slate-200 dark:border-slate-700 shadow-inner">
              <Icon
                name={search || kategori ? 'manage_search' : 'analytics'}
                className="text-4xl text-slate-400 dark:text-slate-600"
              />
            </div>
            <h3 className="text-slate-900 dark:text-slate-100 font-black uppercase tracking-tight">
              {search || kategori ? 'TIDAK DITEMUKAN' : 'KOSONG'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto italic leading-relaxed text-center">
              {search || kategori
                ? `Hasil cari "${search || 'filter'}" nihil`
                : 'Belum ada data laporan untuk periode ini.'}
            </p>
          </div>
        ) : (
          laporan.map((item, index) => (
            <div
              key={`${item.id}-${item.satuan}-${index}`}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
              onClick={() => handleProductClick(item)}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-300 dark:ring-slate-700 transition-colors">
                  {item.gambar_url ? (
                    <NetworkAwareImage src={item.gambar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800">
                      <Icon name="inventory_2" className="text-2xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                    {item.nama}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {item.total_terjual} {item.satuan}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {item.latest_invoice}
                    </span>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-slate-400 mt-1" />
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg px-2 transition-all">
                <div className="text-center">
                  <p className="text-[11px] text-slate-800 dark:text-slate-400 uppercase font-black tracking-widest">
                    Bruto
                  </p>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {formatIDR(item.bruto)}
                  </p>
                </div>
                <div className="text-center border-l border-slate-300 dark:border-slate-700">
                  <p className="text-[11px] text-slate-800 dark:text-slate-400 uppercase font-black tracking-widest">
                    Modal
                  </p>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatIDR(item.tara)}
                  </p>
                </div>
                <div className="text-center border-l border-slate-300 dark:border-slate-700">
                  <p className="text-[11px] text-slate-800 dark:text-slate-400 uppercase font-black tracking-widest">
                    Profit
                  </p>
                  <p className={`text-xs font-black mt-0.5 ${item.netto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-650'}`}>
                    {formatIDR(item.netto)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {/* Mobile Pagination */}
        {(pagination.nextCursor || pagination.prevCursor) && (
          <div className="flex items-center gap-4 mt-6 pt-4 justify-center md:hidden">
            <button
              onClick={() => goToCursor(pagination.prevCursor)}
              disabled={!pagination.prevCursor}
              className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-[0.98]"
              aria-label="Halaman Sebelumnya"
            >
              <Icon name="chevron_left" className="text-xl" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Sebelumnya</span>
            </button>
            <button
              onClick={() => goToCursor(pagination.nextCursor)}
              disabled={!pagination.nextCursor}
              className="px-6 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-[0.98]"
              aria-label="Halaman Berikutnya"
            >
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Berikutnya</span>
              <Icon name="chevron_right" className="text-xl" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KeuntunganIndex() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';
  const kategori = searchParams.get('kategori') || '';
  const q = searchParams.get('q') || '';
  const cursor = searchParams.get('cursor') || '';

  const fetchProfitData = useProfitStore((s) => s.fetchProfitData);
  const fetchAverages = useProfitStore((s) => s.fetchAverages);
  const laporan = useProfitStore((s) => s.laporan);
  const totals = useProfitStore((s) => s.totals);
  const pagination = useProfitStore((s) => s.pagination);
  const starProducts = useProfitStore((s) => s.starProducts);
  const lowMarginProducts = useProfitStore((s) => s.lowMarginProducts);
  const averages = useProfitStore((s) => s.averages);
  const categories = useCategoryStore((s) => s.categories);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const [searchVal, setSearchVal] = useState(q);
  const [activePreset, setActivePreset] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const effectiveStartDate = start_date || startOfMonthLocal();
  const effectiveEndDate = end_date || todayLocal();

  // Sync data from production server on load and when dates change
  useEffect(() => {
    let mounted = true;
    const syncData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchProfitData({
            start_date: effectiveStartDate,
            end_date: effectiveEndDate,
            q,
            kategori,
            cursor: cursor || null,
          }),
          fetchAverages()
        ]);
      } catch (err) {
        console.error('Failed to sync data from production server:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    syncData();
    return () => {
      mounted = false;
    };
  }, [effectiveStartDate, effectiveEndDate, q, kategori, cursor, fetchProfitData, fetchAverages]);

  // Calculations and averages are read reactively from the store above

  // Keep search box synced and handle debouncing
  useEffect(() => {
    setSearchVal(q);
  }, [q]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchVal !== q) {
        setIsLoading(true);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchVal) {
            next.set('q', searchVal);
          } else {
            next.delete('q');
          }
          next.delete('cursor');
          return next;
        });
        setTimeout(() => setIsLoading(false), 200);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal, q, setSearchParams]);

  // Sync active preset highlight
  useEffect(() => {
    const todayStr = todayLocal();
    const startMonthStr = startOfMonthLocal();

    const startWeek = new Date();
    const day = startWeek.getDay();
    const diff = startWeek.getDate() - day + (day === 0 ? -6 : 1);
    startWeek.setDate(diff);
    const weekStr = new Date(startWeek.getTime() - startWeek.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const start3M = new Date();
    start3M.setDate(start3M.getDate() - 90);
    const m3Str = new Date(start3M.getTime() - start3M.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const start6M = new Date();
    start6M.setDate(start6M.getDate() - 180);
    const m6Str = new Date(start6M.getTime() - start6M.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const startYear = new Date();
    startYear.setMonth(0);
    startYear.setDate(1);
    const yearStr = new Date(startYear.getTime() - startYear.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    if (effectiveStartDate === startMonthStr && effectiveEndDate === todayStr) {
      setActivePreset('Bulan Ini');
    } else if (effectiveStartDate === todayStr && effectiveEndDate === todayStr) {
      setActivePreset('Hari Ini');
    } else if (effectiveStartDate === weekStr && effectiveEndDate === todayStr) {
      setActivePreset('Minggu Ini');
    } else if (effectiveStartDate === m3Str && effectiveEndDate === todayStr) {
      setActivePreset('3 Bulan Terakhir');
    } else if (effectiveStartDate === m6Str && effectiveEndDate === todayStr) {
      setActivePreset('6 Bulan Terakhir');
    } else if (effectiveStartDate === yearStr && effectiveEndDate === todayStr) {
      setActivePreset('Tahun Ini');
    } else {
      setActivePreset('');
    }
  }, [effectiveStartDate, effectiveEndDate]);

  // Scroll restoration
  useEffect(() => {
    const saved = sessionStorage.getItem('keuntungan_scroll');
    if (saved) {
      sessionStorage.removeItem('keuntungan_scroll');
      const target = parseInt(saved);
      const attempt = () => {
        window.scrollTo({ top: target, behavior: 'instant' });
        if (window.scrollY < target - 10) {
          requestAnimationFrame(attempt);
        }
      };
      requestAnimationFrame(attempt);
    }
  }, []);

  const handleDateChange = (newStart: string | null, newEnd: string | null) => {
    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStart) {
        next.set('start_date', newStart);
      } else {
        next.delete('start_date');
      }
      if (newEnd) {
        next.set('end_date', newEnd);
      } else {
        next.delete('end_date');
      }
      next.delete('cursor');
      return next;
    });
    setTimeout(() => setIsLoading(false), 200);
  };

  const applyQuickFilter = (label: string) => {
    const end = new Date();
    const start = new Date();

    switch (label) {
      case 'Hari Ini':
        break;
      case 'Minggu Ini': {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        break;
      }
      case 'Bulan Ini':
        start.setDate(1);
        break;
      case '3 Bulan Terakhir':
        start.setDate(start.getDate() - 90);
        break;
      case '6 Bulan Terakhir':
        start.setDate(start.getDate() - 180);
        break;
      case 'Tahun Ini':
        start.setMonth(0);
        start.setDate(1);
        break;
      default:
        return;
    }

    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const startStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('start_date', startStr);
      next.set('end_date', endStr);
      next.delete('cursor');
      return next;
    });
    setTimeout(() => setIsLoading(false), 200);
  };

  const goToCursor = (targetCursor: string | null) => {
    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (targetCursor && targetCursor !== 'start') {
        next.set('cursor', targetCursor);
      } else {
        next.delete('cursor');
      }
      return next;
    });
    setTimeout(() => {
      setIsLoading(false);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }, 200);
  };

  const handleProductClick = (item: LaporanItem) => {
    sessionStorage.setItem('keuntungan_scroll', String(window.scrollY));
    navigate(
      `/keuntungan/${item.id}?start_date=${effectiveStartDate}&end_date=${effectiveEndDate}&kategori=${kategori}&q=${q}`
    );
  };

  return (
    <AppLayout
      title="Laporan Keuangan"
      searchConfig={{
        placeholder: 'Cari nama barang, invoice...',
        value: searchVal,
        onSearch: (query) => setSearchVal(query),
      }}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">
              Laporan Keuangan
            </h2>
            <p className="text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">
              Analisis keuntungan per produk
            </p>
          </div>
        </div>

        {/* Averages Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="analytics" className="text-blue-600 dark:text-blue-400 text-lg" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">
              Performa Rata-rata Penghasilan
            </h3>
          </div>
          <AveragesCards averages={averages} isLoading={isLoading} />
        </div>

        {/* Date & Category Filter Card */}
        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            {/* Filter Cepat */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                <Icon name="list_alt" className="text-sm" />
                Filter Cepat
              </label>
              <CustomSelect
                value={activePreset}
                onChange={(e) => applyQuickFilter(e.target.value)}
                placeholder="Pilih Periode..."
                buttonClassName="font-bold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 py-2.5"
                options={[
                  { value: 'Hari Ini', label: 'Hari Ini', icon: 'schedule' },
                  { value: 'Minggu Ini', label: 'Minggu Ini', icon: 'event' },
                  { value: 'Bulan Ini', label: 'Bulan Ini', icon: 'calendar_today' },
                  { value: '3 Bulan Terakhir', label: '3 Bulan Terakhir', icon: 'history' },
                  { value: '6 Bulan Terakhir', label: '6 Bulan Terakhir', icon: 'history' },
                  { value: 'Tahun Ini', label: 'Tahun Ini', icon: 'analytics' },
                ]}
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch my-0.5 bg-slate-200 dark:bg-slate-700/60 rounded-full shrink-0" />

            {/* Dari Tanggal */}
            <div className="flex flex-col gap-1 sm:w-44 shrink-0">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={effectiveStartDate}
                onChange={(e) => handleDateChange(e.target.value, effectiveEndDate)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
              />
            </div>

            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center pb-2.5 text-slate-400 dark:text-slate-600 shrink-0">
              <Icon name="arrow_forward" className="text-base" />
            </div>

            {/* Sampai Tanggal */}
            <div className="flex flex-col gap-1 sm:w-44 shrink-0">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={effectiveEndDate}
                onChange={(e) => handleDateChange(effectiveStartDate, e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/50 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch my-0.5 bg-slate-200 dark:bg-slate-700/60 rounded-full shrink-0" />

            {/* Kategori Produk */}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Kategori Produk
              </label>
              <CustomSelect
                value={kategori}
                onChange={(e) => {
                  setIsLoading(true);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (e.target.value) {
                      next.set('kategori', e.target.value);
                    } else {
                      next.delete('kategori');
                    }
                    next.delete('cursor');
                    return next;
                  });
                  setTimeout(() => setIsLoading(false), 200);
                }}
                placeholder="Semua Kategori"
                buttonClassName="font-bold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700/50 rounded-lg py-2.5 text-slate-900 dark:text-slate-100"
                options={[
                  { value: '', label: 'Semua Kategori' },
                  ...categories.map((k) => ({ value: k.nama, label: k.nama })),
                ]}
              />
            </div>

            {/* Reset Button */}
            <div className="flex flex-col gap-1 shrink-0">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 opacity-0 select-none">Reset</label>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setSearchVal('');
                  setSearchParams(new URLSearchParams());
                  setTimeout(() => setIsLoading(false), 200);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400 transition-all shadow-sm active:scale-[0.98]"
                title="Reset semua filter"
              >
                <Icon name="refresh" className="text-base" />
                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards totals={totals} isLoading={isLoading} />

        {/* Insights Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Star Products */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Icon name="stars" className="text-amber-500 text-lg" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Penyumbang Profit Terbesar
              </h3>
            </div>
            <div className="space-y-3">
              <StarProductsList starProducts={starProducts} isLoading={isLoading} />
            </div>
          </div>

          {/* Low Margin Alerts */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Icon name="warning" className="text-red-500 text-lg" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                Margin Tipis (Perlu Evaluasi)
              </h3>
            </div>
            <div className="space-y-3">
              <LowMarginList lowMarginProducts={lowMarginProducts} isLoading={isLoading} />
            </div>
          </div>
        </div>

        {/* Table & Cards List Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              Rincian Keuntungan Barang
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
              💡 Klik baris produk untuk mengaudit riwayat penjualan
            </span>
          </div>

          <LaporanTable
            laporan={laporan}
            totals={totals}
            pagination={pagination}
            isLoading={isLoading}
            search={q}
            kategori={kategori}
            handleProductClick={handleProductClick}
            goToCursor={goToCursor}
          />
        </div>
      </div>
    </AppLayout>
  );
}
