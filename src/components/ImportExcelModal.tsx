import { useState, useRef } from 'react';
import Icon from './Icon';

interface ImportExcelModalProps {
  onClose: () => void;
}

export default function ImportExcelModal({ onClose }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setDone(true);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 animate-modal-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
          <Icon name="close" className="text-lg" />
        </button>

        <div className="text-center mb-4">
          <div className="size-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-3">
            <Icon name="file_upload" className="text-2xl text-blue-600" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Import Produk</h3>
          <p className="text-xs text-slate-500 mt-1">Upload file Excel (.xlsx, .xls, .csv)</p>
        </div>

        {!done ? (
          <>
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              {file ? (
                <div>
                  <Icon name="description" className="text-3xl text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{file.name}</p>
                  <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <Icon name="cloud_upload" className="text-3xl text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Klik untuk pilih file</p>
                  <p className="text-[10px] text-slate-500 mt-1">atau drag & drop</p>
                </div>
              )}
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {importing ? 'Mengimport...' : 'Import'}
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="size-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <Icon name="check_circle" className="text-2xl text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Import Berhasil!</p>
            <p className="text-xs text-slate-500 mt-1">Produk telah ditambahkan</p>
            <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700">OK</button>
          </div>
        )}
      </div>
    </div>
  );
}
