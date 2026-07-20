import AutoFitText from '@/components/AutoFitText';
import Icon from '@/components/Icon';

const currencyFormatter = new Intl.NumberFormat("id-ID");
const formatCurrency = (value: number) => currencyFormatter.format(value);

type ChangeDirection = "up" | "down" | "neutral";

interface StatChange {
  percent: number;
  delta: number;
  direction: ChangeDirection;
}

interface StatsCardsProps {
  penjualanHariIni?: number;
  pesananHariIni?: number;
  produkTerjualHariIni?: number;
  pendapatanBersihHariIni?: number;
  statsChanges?: {
    penjualan: StatChange;
    pesanan: StatChange;
    produkTerjual: StatChange;
    pendapatanBersih: StatChange;
  };
}

function ChangeBadge({
  change,
  isCurrency = false,
}: {
  change?: StatChange;
  isCurrency?: boolean;
}) {
  if (!change) return null;

  const { percent, delta, direction } = change;

  const isUp = direction === "up";
  const isDown = direction === "down";
  const isNeutral = direction === "neutral";

  const badgeClass = isUp
    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : isDown
      ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";

  const arrowIcon = isUp ? "arrow_upward" : isDown ? "arrow_downward" : "remove";

  const deltaAbs = Math.abs(delta);
  const deltaLabel = isCurrency
    ? `${delta >= 0 ? "+" : "-"}Rp ${formatCurrency(deltaAbs)}`
    : `${delta >= 0 ? "+" : ""}${Math.round(delta)}`;

  const percentLabel = isNeutral ? "0%" : `${delta >= 0 ? "+" : "-"}${percent}%`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px]">
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-black ${badgeClass}`}
      >
        <Icon name={arrowIcon} className="text-[11px]" />
        {percentLabel}
      </span>
      <span
        className={`font-bold ${
          isUp
            ? "text-emerald-500 dark:text-emerald-400"
            : isDown
              ? "text-red-500 dark:text-red-400"
              : "text-slate-400 dark:text-slate-500"
        }`}
      >
        ({deltaLabel})
      </span>
      <span className="text-slate-400 dark:text-slate-500 font-medium">
        vs kemarin
      </span>
    </div>
  );
}

export default function StatsCards({
  penjualanHariIni = 0,
  pesananHariIni = 0,
  produkTerjualHariIni = 0,
  pendapatanBersihHariIni = 0,
  statsChanges,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Penjualan */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="space-y-1">
          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
            Penjualan Hari Ini
          </p>
          <div className="text-slate-900 dark:text-white">
            <AutoFitText maxFontSize={24} minFontSize={18}>
              <span className="font-black tracking-tighter">
                Rp {formatCurrency(penjualanHariIni)}
              </span>
            </AutoFitText>
          </div>
          <ChangeBadge change={statsChanges?.penjualan} isCurrency />
        </div>
      </div>

      {/* Pendapatan Bersih */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="space-y-1">
          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
            Pendapatan Bersih
          </p>
          <div className="text-slate-900 dark:text-white">
            <AutoFitText maxFontSize={24} minFontSize={18}>
              <span className="font-black tracking-tighter">
                Rp {formatCurrency(pendapatanBersihHariIni)}
              </span>
            </AutoFitText>
          </div>
          <ChangeBadge change={statsChanges?.pendapatanBersih} isCurrency />
        </div>
      </div>

      {/* Jumlah Pembeli */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="space-y-1">
          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
            Jumlah Pembeli
          </p>
          <div className="text-slate-900 dark:text-white">
            <AutoFitText maxFontSize={24} minFontSize={18}>
              <span className="font-black tracking-tighter text-3xl">
                {pesananHariIni}
              </span>
            </AutoFitText>
          </div>
          <ChangeBadge change={statsChanges?.pesanan} />
        </div>
      </div>

      {/* Produk Terjual */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="space-y-1">
          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] leading-none">
            Produk Terjual
          </p>
          <div className="text-slate-900 dark:text-white">
            <AutoFitText maxFontSize={24} minFontSize={18}>
              <span className="font-black tracking-tighter text-3xl">
                {produkTerjualHariIni}
              </span>
            </AutoFitText>
          </div>
          <ChangeBadge change={statsChanges?.produkTerjual} />
        </div>
      </div>
    </div>
  );
}
