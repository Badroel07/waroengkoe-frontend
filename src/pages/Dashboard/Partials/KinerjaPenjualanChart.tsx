import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.defaults.font.family = "'Sora', ui-sans-serif, system-ui, sans-serif";
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartDataLabels
);

const currencyFormatter = new Intl.NumberFormat("id-ID");
const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCompact = (value: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact" }).format(value);

interface KinerjaPenjualanChartProps {
  monthlyRevenue?: {
    labels?: string[];
    data?: number[];
    profitData?: number[];
    total?: number;
    totalProfit?: number;
  };
  resolvedTheme?: string;
  filters?: {
    period?: string;
    year?: string | number;
  };
  availableYears?: Array<string | number>;
  handlePeriodChange: (period: string) => void;
  handleYearChange: (year: string) => void;
}

export default function KinerjaPenjualanChart({
  monthlyRevenue,
  resolvedTheme,
  filters = { period: '6', year: new Date().getFullYear() },
  availableYears = [],
  handlePeriodChange,
  handleYearChange,
}: KinerjaPenjualanChartProps) {
  const chartRef = useRef<any>(null);
  const chartLabels = monthlyRevenue?.labels || [];
  const chartData = monthlyRevenue?.data || [];
  const chartProfitData = monthlyRevenue?.profitData || [];
  const chartTotal = monthlyRevenue?.total || 0;
  const chartTotalProfit = monthlyRevenue?.totalProfit || 0;
  const isDark = resolvedTheme === "dark";

  const crosshairPlugin = {
    id: "crosshair",
    afterDraw(chart: any) {
      const {
        tooltip,
        ctx,
        chartArea: { top, bottom },
      } = chart;
      if (!tooltip || !tooltip.opacity || !tooltip.dataPoints?.length)
        return;

      const x = tooltip.caretX;

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isDark
        ? "rgba(148, 163, 184, 0.4)"
        : "rgba(100, 116, 139, 0.3)";
      ctx.lineWidth = 1;
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, bottom - 6, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? "rgba(148, 163, 184, 0.4)"
        : "rgba(100, 116, 139, 0.3)";
      ctx.fill();
      ctx.restore();
    },
  };

  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: "Omset",
        data: chartData,
        borderColor: "#006eff",
        backgroundColor: (context: any) => {
          if (!context.chart.chartArea) return "rgba(0, 110, 255, 0.05)";
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, "rgba(0, 110, 255, 0.15)");
          gradient.addColorStop(0.3, "rgba(0, 110, 255, 0.07)");
          gradient.addColorStop(0.6, "rgba(0, 110, 255, 0.03)");
          gradient.addColorStop(1, "rgba(0, 110, 255, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: isDark ? "#0f172a" : "#ffffff",
        pointBorderColor: "#006eff",
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 4,
        datalabels: {
          color: "#006eff",
          font: { weight: "bold" as const, size: 11 },
          anchor: "end" as const,
          align: "end" as const,
          offset: 2,
          formatter: (value: number) => "Rp" + formatCompact(value),
        },
      },
      {
        label: "Keuntungan Bersih",
        data: chartProfitData,
        borderColor: "#10b981",
        backgroundColor: (context: any) => {
          if (!context.chart.chartArea) return "rgba(16, 185, 129, 0.05)";
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.15)");
          gradient.addColorStop(0.3, "rgba(16, 185, 129, 0.07)");
          gradient.addColorStop(0.6, "rgba(16, 185, 129, 0.03)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
          return gradient;
        },
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: isDark ? "#0f172a" : "#ffffff",
        pointBorderColor: "#10b981",
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 4,
        datalabels: {
          color: "#10b981",
          font: { weight: "bold" as const, size: 11 },
          anchor: "end" as const,
          align: "end" as const,
          offset: 2,
          formatter: (value: number) => "Rp" + formatCompact(value),
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1800,
      easing: "easeInOutQuart" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(30, 41, 59, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#f1f5f9" : "#111827",
        bodyColor: isDark ? "#94a3b8" : "#374151",
        borderColor: isDark
          ? "rgba(51, 65, 85, 0.8)"
          : "rgba(229, 231, 235, 0.8)",
        borderWidth: 1,
        padding: 14,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { weight: "bold" as const, size: 13 },
        bodyFont: { size: 12 },
        callbacks: {
          title: (items: any[]) => items[0]?.label || "",
          label: (context: any) => {
            const labels = ["Omset", "Keuntungan Bersih"];
            return (
              labels[context.datasetIndex] +
              ": Rp " +
              formatCurrency(context.parsed.y)
            );
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          borderDash: [2, 4],
        },
        ticks: {
          color: isDark ? "#475569" : "#94a3b8",
          font: { size: 11 },
          padding: 8,
          callback: (value: any) =>
            "Rp " +
            new Intl.NumberFormat("id-ID", {
              notation: "compact",
            }).format(value),
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: isDark ? "#475569" : "#94a3b8",
          font: { size: 11 },
        },
        border: { display: false },
      },
    },
    interaction: {
      mode: "index" as const,
      axis: "x" as const,
      intersect: false,
    },
    elements: {
      point: {
        hoverBorderWidth: 3,
      },
    },
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold">Kinerja Penjualan</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                  Omset
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                  Rp {formatCurrency(chartTotal)}
                </span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
                  Keuntungan Bersih
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                  Rp {formatCurrency(chartTotalProfit)}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded whitespace-nowrap ml-auto hidden sm:block">
              {filters?.period == "12"
                ? "Tahun " + filters?.year
                : (filters?.period || "6") + " Bulan Terakhir"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CustomSelect
            value={filters?.period || "6"}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-[160px]"
            buttonClassName="font-medium text-slate-900 dark:text-slate-100"
            options={[
              { value: "3", label: "3 Bulan Terakhir" },
              { value: "6", label: "6 Bulan Terakhir" },
              { value: "12", label: "1 Tahun Penuh" },
            ]}
          />
          {filters?.period == "12" && (
            <CustomSelect
              value={filters?.year || ""}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-[100px]"
              buttonClassName="font-medium text-slate-900 dark:text-slate-100"
              options={availableYears.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
            />
          )}
        </div>
      </div>
      <div className="h-64">
        <Line
          ref={chartRef}
          options={chartOptions}
          data={chartDataConfig}
          plugins={[crosshairPlugin]}
        />
      </div>
    </>
  );
}
