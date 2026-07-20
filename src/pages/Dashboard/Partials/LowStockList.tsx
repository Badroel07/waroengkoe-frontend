import Icon from '@/components/Icon';
import OverflowMarquee from '@/components/OverflowMarquee';

interface LowStockItemType {
  id: string;
  nama: string;
  kategori_nama: string;
  stok: number;
  batas_stok_rendah: number;
  satuan_dasar: string;
}

export default function LowStockList({ lowStockItems = [] }: { lowStockItems?: LowStockItemType[] }) {
  if (lowStockItems && lowStockItems.length > 0) {
    return (
      <div className="space-y-3">
        {lowStockItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (item.stok ?? 0) === 0
                  ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  : (item.stok ?? 0) <= (item.batas_stok_rendah ?? 5)
                    ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                    : "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
              }`}
            >
              <Icon name={(item.stok ?? 0) === 0 ? "block" : "inventory"} className="text-lg" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <OverflowMarquee text={item.nama}>
                <p className="text-sm font-semibold whitespace-nowrap">
                  {item.nama}
                </p>
              </OverflowMarquee>
              <p className="text-xs text-slate-800 dark:text-slate-400">
                {item.kategori_nama || "Tanpa Kategori"}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  (item.stok ?? 0) === 0
                    ? "bg-red-500"
                    : (item.stok ?? 0) <= (item.batas_stok_rendah ?? 5)
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                }`}
              />
              <span className="text-xs font-black ml-1 text-slate-900 dark:text-slate-100">
                {(item.stok ?? 0) === 0 ? "Habis" : `${item.stok} ${item.satuan_dasar ?? "pcs"}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-3">
        <Icon name="check_circle" className="text-blue-500 dark:text-blue-400 text-2xl" />
      </div>
      <p className="text-sm font-medium">Stok Aman!</p>
      <p className="text-xs text-slate-800 dark:text-slate-400 mt-1">
        Semua produk memiliki stok yang cukup.
      </p>
    </div>
  );
}
