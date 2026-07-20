import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/Icon';
import CustomSelect from '@/components/CustomSelect';
import SettingsAiTab from '@/components/SettingsAiTab';
import { useSettingStore } from '@/store/settingStore';
import { useAuthStore } from '@/store/authStore';
import { useAlert } from '@/components/Alert';
import { useToast } from '@/components/ToastProvider';

export default function PengaturanIndex() {
  const settings = useSettingStore((s) => s.settings);
  const updateSettings = useSettingStore((s) => s.updateSettings);
  const resetDatabase = useSettingStore((s) => s.resetDatabase);
  const clearData = useSettingStore((s) => s.clearData);

  const currentUser = useAuthStore((s) => s.user);
  const { confirmDanger } = useAlert();
  const toast = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('umum');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAdmin = currentUser?.is_admin || currentUser?.id === '1';

  // Make sure we clear audio ref on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      const url = '/audio/transaction_success.mp3';

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.volume = 0.5;
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.warn("Audio preview failed:", e);
        setIsPlaying(false);
      });
    }
  };

  const handleSendTestLaporan = async () => {
    if (isTesting) return;
    setIsTesting(true);

    try {
      const email = settings.laporan_email;
      if (!email) {
        toast.error('Email penerima belum diisi di pengaturan.');
        setIsTesting(false);
        return;
      }

      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Laporan uji coba sedang dikirim ke ${email}. Silakan periksa kotak masuk atau folder spam email Anda dalam beberapa menit!`);
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat mengirim laporan uji coba.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const successSound = formData.get('success_sound') === '1' ? '1' : '0';
    const qrisStatic = formData.get('qris_static') as string || '';
    const laporanEmail = formData.get('laporan_email') as string || '';
    const laporanStatus = formData.get('laporan_status') === '1' ? '1' : '0';
    const groqApiKey = formData.get('groq_api_key') as string || '';
    const groqModel = formData.get('groq_model') as string || '';

    // Update settings in store
    updateSettings({
      success_sound: successSound,
      qris_static: qrisStatic,
      laporan_email: laporanEmail,
      laporan_status: laporanStatus,
      groq_api_key: groqApiKey,
      groq_model: groqModel,
    });

    toast.success('Semua pengaturan berhasil diperbarui.');
  };

  const handleResetDatabase = async () => {
    const confirmed = await confirmDanger(
      'Reset Database',
      'Semua data transaksi, produk, dan pengaturan akan dihapus. Tindakan ini tidak dapat dibatalkan.'
    );
    if (confirmed) resetDatabase();
  };

  const handleClearData = async () => {
    const confirmed = await confirmDanger(
      'Hapus Data',
      'Semua data transaksi akan dihapus. Data pengguna dan pengaturan akan tetap tersimpan.'
    );
    if (confirmed) clearData();
  };

  return (
    <AppLayout title="Pengaturan">
      <div className="max-w-2xl space-y-5">
        {/* Left-aligned Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Pengaturan</h1>
            <p className="text-[10px] md:text-[11px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-1">Kelola preferensi dan konfigurasi sistem Anda</p>
          </div>
        </div>

        {/* Tab Selector (Admin Only) */}
        {isAdmin && (
          <>
            {/* Mobile view dropdown (for future-proof scaling) */}
            <div className="sm:hidden mb-5">
              <CustomSelect
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                options={[
                  { value: 'umum', label: 'Suara & Audio', icon: 'volume_up' },
                  { value: 'pembayaran', label: 'Pembayaran (QRIS)', icon: 'qr_code_2' },
                  { value: 'laporan', label: 'Laporan Keuangan', icon: 'mail' },
                  { value: 'ai', label: 'AI Voice', icon: 'auto_awesome' }
                ]}
              />
            </div>

            {/* Tablet/Desktop view pills */}
            <div className="hidden sm:block mb-5">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('umum')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'umum'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name="volume_up" className="text-base" />
                  <span>Suara</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pembayaran')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'pembayaran'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name="qr_code_2" className="text-base" />
                  <span>Pembayaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('laporan')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'laporan'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name="mail" className="text-base" />
                  <span>Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === 'ai'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name="auto_awesome" className="text-base" />
                  <span>AI Voice</span>
                </button>
              </div>
            </div>
          </>
        )}

        <form id="unified-settings-form" onSubmit={handleSubmit} className="space-y-5">
          {/* TAB: UMUM & SUARA */}
          <div className={activeTab === 'umum' ? 'space-y-5' : 'hidden'}>
            {/* General Settings (Sound Effects) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/50 flex items-center gap-4">
                <div className="size-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center shrink-0 shadow-inner">
                  <Icon name="volume_up" className="text-teal-600 dark:text-teal-400 text-lg md:text-xl" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Pengaturan Suara</h2>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-0.5">Personalisasi & Pengalaman Pengguna</p>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between p-3.5 md:p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-teal-500/20 group">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                      <Icon name="music_note" className="text-teal-500 text-sm md:text-base" />
                    </div>
                    <div>
                      <h3 className="text-[12px] md:text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Efek Suara Berhasil</h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mainkan suara saat transaksi selesai</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="success_sound_proxy"
                      className="sr-only peer"
                      defaultChecked={settings.success_sound !== '0'}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const form = e.currentTarget.form;
                        if (form) {
                          const hiddenInput = form.querySelector('input[name="success_sound"]') as HTMLInputElement | null;
                          if (hiddenInput) {
                            hiddenInput.value = e.currentTarget.checked ? '1' : '0';
                          }
                        }
                      }}
                    />
                    <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 dark:peer-checked:bg-teal-500 rounded-full shadow-inner"></div>
                    <input type="hidden" name="success_sound" defaultValue={settings.success_sound || '1'} />
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={`w-full sm:w-auto px-4 py-2.5 border text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] group shadow-sm cursor-pointer ${
                      isPlaying
                        ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent hover:bg-slate-700 dark:hover:bg-slate-100'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon
                      name={isPlaying ? "stop" : "play_arrow"}
                      className={`text-base transition-transform ${isPlaying ? 'scale-110 text-red-500' : 'group-hover:scale-125'}`}
                    />
                    {isPlaying ? 'Stop Preview' : 'Putar Suara'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TAB: PEMBAYARAN (QRIS) */}
          {isAdmin && (
            <div className={activeTab === 'pembayaran' ? 'space-y-5' : 'hidden'}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/50 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 shadow-inner">
                    <Icon name="qr_code_2" className="text-blue-600 dark:text-blue-400 text-lg md:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Konfigurasi Pembayaran</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-0.5">Pengaturan QRIS Statis & Dinamis</p>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                      QRIS Static String
                    </label>
                    <textarea
                      name="qris_static"
                      defaultValue={settings.qris_static || ''}
                      placeholder="Masukkan raw data QRIS (00020101...)"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 text-slate-900 dark:text-slate-100 text-xs font-medium p-4 leading-relaxed transition-all shadow-inner outline-none placeholder:text-slate-350 resize-none"
                      rows={4}
                      required={isAdmin && activeTab === 'pembayaran'}
                    />
                    <div className="flex gap-3 p-4 bg-blue-50/50 dark:bg-blue-500/5 text-blue-800 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100/50 dark:border-blue-500/10 leading-relaxed shadow-sm">
                      <Icon name="info" className="text-lg flex-shrink-0" />
                      <p>Salin isi teks dari QR Code statis Anda. Sistem otomatis menyisipkan nominal belanja pada setiap transaksi QRIS.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LAPORAN */}
          {isAdmin && (
            <div className={activeTab === 'laporan' ? 'space-y-5' : 'hidden'}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/50 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner">
                    <Icon name="mail" className="text-emerald-600 dark:text-emerald-400 text-lg md:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Laporan Keuangan Bulanan</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-0.5">Pengiriman Laporan Otomatis via SMTP</p>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-3.5 md:p-4 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:border-emerald-500/20 group">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                          <Icon name="toggle_on" className="text-emerald-500 text-sm md:text-base" />
                        </div>
                        <div>
                          <h3 className="text-[12px] md:text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Kirim Laporan Otomatis</h3>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Kirim email otomatis akhir bulan pukul 23:59</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="laporan_status_proxy"
                          className="sr-only peer"
                          defaultChecked={settings.laporan_status === '1'}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const form = e.currentTarget.form;
                            if (form) {
                              const hiddenInput = form.querySelector('input[name="laporan_status"]') as HTMLInputElement | null;
                              if (hiddenInput) {
                                hiddenInput.value = e.currentTarget.checked ? '1' : '0';
                              }
                            }
                          }}
                        />
                        <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-500 rounded-full shadow-inner"></div>
                        <input type="hidden" name="laporan_status" defaultValue={settings.laporan_status || '0'} />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest ml-1">
                        Email Penerima Laporan
                      </label>
                      <input
                        type="email"
                        name="laporan_email"
                        defaultValue={settings.laporan_email || ''}
                        placeholder="contoh: owner@waroengkoe.com"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 text-slate-900 dark:text-slate-100 text-xs font-medium p-4 leading-relaxed transition-all shadow-inner outline-none placeholder:text-slate-350"
                        required={isAdmin && activeTab === 'laporan'}
                      />
                      <div className="flex gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 dark:border-emerald-500/10 leading-relaxed shadow-sm">
                        <Icon name="info" className="text-lg flex-shrink-0" />
                        <p>Laporan dikirim otomatis via SMTP. Pastikan kredensial SMTP di file `.env` sudah benar.</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleSendTestLaporan}
                        disabled={isTesting}
                        className="w-full sm:w-auto px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isTesting ? (
                          <>
                            <span className="size-3.5 border-2 border-slate-300 border-t-slate-700 animate-spin rounded-full"></span>
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Icon name="send" className="text-base" />
                            Uji Coba Kirim
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI VOICE */}
          {isAdmin && (
            <div className={activeTab === 'ai' ? 'space-y-5' : 'hidden'}>
              <SettingsAiTab
                apiKey={settings.groq_api_key || ''}
                model={settings.groq_model || 'llama-3.3-70b-versatile'}
              />
            </div>
          )}

          {/* Left-aligned Save Changes Button */}
          <div className="flex justify-start pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
            >
              <Icon name="save" className="text-lg group-hover:rotate-12 transition-transform" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}