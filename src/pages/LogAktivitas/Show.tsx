import { useParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import OverflowMarquee from '@/components/OverflowMarquee';
import { useActivityLogStore, getRelativeTime } from '@/store/activityLogStore';

export default function LogAktivitasShow() {
  const { id } = useParams<{ id: string }>();
  const log = useActivityLogStore((s) => s.logs.find((l) => l.id === id));

  if (!log) {
    return (
      <AppLayout title="Detail Log" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Log tidak ditemukan</div>
      </AppLayout>
    );
  }

  // Calculate formatted time and relative time dynamically
  const dateObj = new Date(log.created_at);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const relativeTime = getRelativeTime(log.created_at);

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      create: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
      update: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
      delete: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
    };
    const icons: Record<string, string> = {
      create: "add_circle",
      update: "edit",
      delete: "delete",
    };
    return {
      style: styles[action] || "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
      icon: icons[action] || "info",
    };
  };

  const badge = getActionBadge(log.action);

  // Field label mapper
  const getFieldLabel = (field: string) => {
    if (field.startsWith('visibility_')) {
      return `Status Jual: ${field.replace('visibility_', '')}`;
    }
    const labels: Record<string, string> = {
      nama_barang: 'Nama',
      nama: 'Nama',
      stok: 'Stok',
      gambar: 'Gambar',
      gambar_url: 'Gambar',
      harga_beli: 'Harga Beli',
      jenis_kategori: 'Kategori',
      kategori_nama: 'Kategori',
      sku: 'SKU',
      deskripsi: 'Deskripsi',
      status: 'Status',
      tipe_kuantitas: 'Satuan',
      satuan_dasar: 'Satuan',
      satuans: 'Multi-Satuan',
      is_visible_satuan: 'Status Jual Satuan',
      warna: 'Warna',
      harga_jual: 'Harga Jual',
      harga_jual_baru: 'Jadwal Harga Baru',
      konversi: 'Isi per Satuan',
      qty_gratis: 'Gratis (Bonus)',
      alias: 'Alias',
    };
    return labels[field] || field;
  };

  // Format value for display
  const formatValue = (field: string, value: any, record: any = {}) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">kosong</span>;
    }

    if ((field === 'gambar' || field === 'gambar_url') && typeof value === 'string') {
      const url = value.startsWith('data:') || value.startsWith('http') ? value : `/storage/${value}`;
      return (
        <div className="mt-2 relative group-preview">
          <img
            src={url}
            alt="Preview"
            className="h-24 w-auto rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-110"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>
      );
    }

    if (field === 'satuans' && Array.isArray(value)) {
      return (
        <div className="space-y-2 mt-1">
          {value.map((s: any, i: number) => {
            const namaSatuan = s.nama_satuan || s.nama || '';
            const hargaJual = s.harga_jual || 0;
            const konversi = s.konversi || 1;
            const isDefault = s.is_default || false;
            const isVisible = s.is_visible !== false;

            return (
              <div
                key={i}
                className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate shrink-0">
                    {namaSatuan}
                  </span>
                  {isDefault && (
                    <span className="text-[9px] font-black tracking-widest text-[#006eff] bg-blue-50 dark:bg-blue-500/10 px-1.5 rounded-md border border-blue-200 dark:border-blue-500/20">
                      DEFAULT
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-655 dark:text-slate-350 font-bold shrink-0">
                      Rp{Number(hargaJual).toLocaleString('id-ID')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 font-black tracking-widest uppercase">
                      x{konversi}
                    </span>
                  </div>
                  {!isVisible && (
                    <span className="text-red-500 font-black tracking-widest text-[9px]">
                      HIDDEN
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
    if (typeof value === 'object') {
      return (
        <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg overflow-x-auto text-slate-700 dark:text-slate-300">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (['harga_beli', 'harga_jual', 'modal_awal'].includes(field)) {
      return `Rp ${Number(value).toLocaleString('id-ID')}`;
    }

    if (field === 'stok') {
      const units = record.satuans || [];
      const defaultSatuan = Array.isArray(units) ? units.find((s: any) => s.is_default) : null;
      const unitName = defaultSatuan ? (defaultSatuan.nama_satuan || defaultSatuan.nama) : record.satuan_dasar || record.tipe_kuantitas || '';
      return `${value} ${unitName}`;
    }

    return String(value);
  };

  const hasChanges = log.action === 'update' && log.changed_fields && log.changed_fields.length > 0;

  return (
    <AppLayout title={`Detail Aktivitas - ${log.barang_nama}`} hideBottomNav>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Detail Aktivitas</h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">Informasi lengkap riwayat perubahan data</p>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-all">
              {/* General Log Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-850/50 p-6 rounded-lg border border-slate-200/80 dark:border-slate-800/80 transition-colors">
                <div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest block mb-1">
                    Waktu Aktivitas
                  </span>
                  <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
                    {formattedDate}
                  </p>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block mt-0.5">
                    {relativeTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest block mb-1">
                    Oleh Pengguna
                  </span>
                  <p className="font-black text-slate-900 dark:text-slate-100 uppercase text-sm">
                    {log.user_name}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest block mb-1.5">
                    Jenis Aktivitas
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${badge.style}`}
                    >
                      <Icon name={badge.icon} className="text-sm" />
                      {log.action_label}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest block mb-1">
                    Nama Barang
                  </span>
                  <OverflowMarquee className="font-black text-slate-900 dark:text-slate-100 uppercase text-sm">
                    {log.barang_nama}
                  </OverflowMarquee>
                </div>
              </div>

              {/* Description Box */}
              {log.description && (
                <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 transition-colors">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              )}
            </div>

            {/* Render changes based on action */}
            {log.action === 'update' && (
              hasChanges ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-400 flex items-center gap-2.5 uppercase tracking-[0.2em] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                      <Icon name="compare_arrows" className="text-amber-500 text-sm" />
                    </div>
                    Perubahan Detail Data
                  </h4>
                  <div className="space-y-4">
                    {log.changed_fields?.map((field) => (
                      <div
                        key={field}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900 transition-all"
                      >
                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-widest">
                            {getFieldLabel(field)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                          <div className="p-5 bg-white dark:bg-slate-900 transition-colors">
                            <span className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-widest block mb-2">
                              Sebelum Perubahan
                            </span>
                            <div className="text-sm font-bold text-red-600 dark:text-red-400 leading-relaxed overflow-hidden">
                              {formatValue(field, log.old_values?.[field], log.old_values)}
                            </div>
                          </div>
                          <div className="p-5 bg-white dark:bg-slate-900 transition-colors">
                            <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest block mb-2">
                              Sesudah Perubahan
                            </span>
                            <div className="text-sm font-black text-blue-600 dark:text-blue-400 leading-relaxed overflow-hidden">
                              {formatValue(field, log.new_values?.[field], log.new_values)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-350 dark:border-slate-800">
                  <Icon name="search_off" className="text-5xl text-slate-300 dark:text-slate-700 mb-4" />
                  <p className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Tidak Ada Data Perubahan</p>
                  <p className="text-xs text-slate-500 mt-2">Log ini tidak memiliki data perubahan yang tersimpan</p>
                </div>
              )
            )}

            {/* Create action layout */}
            {log.action === 'create' && log.new_values && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-400 flex items-center gap-2.5 uppercase tracking-[0.2em] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Icon name="add_circle" className="text-[#006eff] text-sm" />
                  </div>
                  Data yang Ditambahkan
                </h4>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900 transition-all">
                  <div className="p-5 space-y-4">
                    {Object.entries(log.new_values).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors gap-1"
                      >
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                          {getFieldLabel(key)}
                        </span>
                        <div className="overflow-hidden">
                          <span className="text-xs text-slate-900 dark:text-slate-200 font-bold uppercase tracking-tight whitespace-normal break-words">
                            {formatValue(key, value, log.new_values)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Delete action layout */}
            {log.action === 'delete' && log.old_values && (
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-400 flex items-center gap-2.5 uppercase tracking-[0.2em] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <Icon name="delete_forever" className="text-red-500 text-sm" />
                  </div>
                  Data yang Dihapus
                </h4>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900 transition-all">
                  <div className="p-5 space-y-4">
                    {Object.entries(log.old_values).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors gap-1"
                      >
                        <span className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                          {getFieldLabel(key)}
                        </span>
                        <div className="overflow-hidden">
                          <span className="text-xs text-slate-900 dark:text-slate-200 font-bold uppercase tracking-tight whitespace-normal break-words">
                            {formatValue(key, value, log.old_values)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
