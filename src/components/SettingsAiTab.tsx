import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { useSettingStore } from '@/store/settingStore';

interface AiModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
}

interface AiUsage {
  usage: number;
  usage_daily: number;
  usage_weekly: number;
  usage_monthly: number;
  is_free_tier: boolean;
  daily_limit: number;
  daily_remaining: number;
}

interface SettingsAiTabProps {
  apiKey: string;
  model: string;
}

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

export default function SettingsAiTab({ apiKey, model: defaultModel }: SettingsAiTabProps) {
  const settings = useSettingStore((s) => s.settings);
  const updateSettings = useSettingStore((s) => s.updateSettings);

  const savedKey = apiKey || settings.groq_api_key || '';
  const savedModel = defaultModel || settings.groq_model || DEFAULT_MODEL;

  const [typedKey, setTypedKey] = useState(savedKey);
  const [models, setModels] = useState<AiModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(savedModel);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const initialFetchDone = useRef(false);

  const hasTypedKey = typedKey.length > 0;

  // Mock API usage query
  const doFetchUsage = async (key: string) => {
    if (!key) {
      setUsage(null);
      return;
    }
    setLoadingUsage(true);
    // Simulate API fetch delay
    setTimeout(() => {
      if (key.startsWith('gsk_')) {
        setUsage({
          usage: 12,
          usage_daily: 12,
          usage_weekly: 45,
          usage_monthly: 120,
          is_free_tier: true,
          daily_limit: 1440,
          daily_remaining: 1428,
        });
      } else {
        setUsage(null);
      }
      setLoadingUsage(false);
    }, 500);
  };

  // Mock AI model list query
  const doFetchModels = async (key: string) => {
    if (!key) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    setFetchError(null);
    setTimeout(() => {
      if (key.startsWith('gsk_')) {
        const mockModels: AiModel[] = [
          { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Versatile)', description: 'Model serbaguna performa tinggi', context_length: 32768 },
          { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Instant)', description: 'Model super cepat latency rendah', context_length: 8192 },
          { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (MoE)', description: 'Model campuran ahli presisi tinggi', context_length: 32768 },
          { id: 'gemma2-9b-it', name: 'Gemma 2 9B (Instruct)', description: 'Model instruksi Google efisien', context_length: 8192 },
        ];
        setModels(mockModels);
        if (mockModels.length > 0 && !mockModels.find(m => m.id === selectedModel)) {
          setSelectedModel(mockModels[0].id);
        }
      } else {
        setFetchError('API Key Groq tidak valid. Harus diawali dengan "gsk_".');
        setModels([]);
      }
      setLoadingModels(false);
      initialFetchDone.current = true;
    }, 700);
  };

  useEffect(() => {
    if (!savedKey) return;
    doFetchModels(savedKey);
    doFetchUsage(savedKey);

    pollRef.current = setInterval(() => doFetchUsage(savedKey), 30_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') doFetchUsage(savedKey);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const handleKeyChange = (val: string) => {
    setTypedKey(val);
    setUsage(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length > 0) {
      debounceRef.current = setTimeout(() => {
        initialFetchDone.current = false;
        doFetchModels(val);
        doFetchUsage(val);
        // Persist to store immediately
        updateSettings({ groq_api_key: val });
      }, 600);
    } else {
      setModels([]);
      setFetchError(null);
      updateSettings({ groq_api_key: '' });
    }
  };

  useEffect(() => {
    if (selectedModel) {
      updateSettings({ groq_model: selectedModel });
    }
  }, [selectedModel, updateSettings]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isLoaded = models.length > 0;
  const currentModelName = models.find(m => m.id === selectedModel)?.name;

  const statusLabel = hasTypedKey
    ? isLoaded
      ? `${models.length} model gratis`
      : loadingModels
        ? 'Memuat...'
        : 'Cek API key'
    : 'Fallback regex';

  const statusColor = hasTypedKey
    ? isLoaded
      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  const usagePercent = usage && usage.daily_limit > 0
    ? Math.round((usage.usage_daily / usage.daily_limit) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all">
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/50 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0 shadow-inner">
            <Icon name="auto_awesome" className="text-purple-600 dark:text-purple-400 text-lg md:text-xl" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Pengaturan AI Voice</h2>
            <p className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-550 uppercase tracking-widest mt-0.5">Groq — AI Speech-to-Text Parser</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              API Key Groq
              <span className={`px-2 py-0.5 rounded-full text-[8px] tracking-wider ${statusColor}`}>
                {statusLabel}
              </span>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                name="groq_api_key"
                value={typedKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-955 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-slate-900 dark:text-slate-100 text-xs font-mono p-4 pr-12 leading-relaxed transition-all shadow-inner outline-none placeholder:text-slate-350"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 cursor-pointer"
                aria-label={showKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                <Icon name={showKey ? 'visibility_off' : 'visibility'} className="text-lg" />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 px-1 leading-relaxed">
              Daftar di{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 underline hover:no-underline">
                console.groq.com/keys
              </a>
              {' '}(gratis/berbayar, perlu login). Kosongkan untuk menggunakan parser regex bawaan.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
              Model AI
            </label>
            <div className="flex gap-2">
              <select
                name="groq_model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-slate-900 dark:text-slate-100 text-xs font-medium p-4 transition-all shadow-inner outline-none cursor-pointer"
              >
                {isLoaded ? models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.context_length.toLocaleString()} token)
                  </option>
                )) : (
                  <option value={savedModel}>
                    {loadingModels
                      ? 'Memuat model...'
                      : hasTypedKey
                        ? currentModelName || savedModel
                        : savedModel}
                  </option>
                )}
              </select>
              {hasTypedKey && (
                <button
                  type="button"
                  onClick={() => {
                    initialFetchDone.current = false;
                    doFetchModels(typedKey);
                  }}
                  disabled={loadingModels}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 shrink-0 cursor-pointer"
                  title="Refresh daftar model"
                >
                  <Icon name={loadingModels ? 'hourglass_top' : 'refresh'} className={`text-lg ${loadingModels ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            {fetchError && (
              <p className="text-[9px] text-red-500 dark:text-red-400 px-1 flex items-center gap-1">
                <Icon name="error" className="text-xs" />
                {fetchError}
              </p>
            )}
          </div>

          {usage && (
            <div className="rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="analytics" className="text-purple-600 dark:text-purple-400 text-sm" />
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">
                  Sisa Kuota Permintaan
                </span>
                {loadingUsage && (
                  <span className="size-3 border-2 border-purple-300 border-t-purple-700 animate-spin rounded-full ml-auto"></span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-purple-800 dark:text-purple-300">
                  {usage.daily_remaining}
                </span>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  / {usage.daily_limit} permintaan
                </span>
              </div>
              <div className="relative h-2 bg-purple-200 dark:bg-purple-900/40 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                    usagePercent > 80
                      ? 'bg-red-500'
                      : usagePercent > 50
                        ? 'bg-amber-500'
                        : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-purple-600 dark:text-purple-400/70 uppercase tracking-wider">
                <span>{usage.usage_daily} digunakan</span>
                {usagePercent > 80 && (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Icon name="warning" className="text-xs" />
                    Hampir habis
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
