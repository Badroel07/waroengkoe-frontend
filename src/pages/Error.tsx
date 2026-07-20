import { useNavigate, useLocation } from 'react-router-dom';

export default function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const errorCode = (location.state as { status?: number })?.status || 404;

  const is404 = errorCode === 404;

  return (
    <div className="min-h-[100dvh] w-full bg-[#020617] text-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden relative selection:bg-blue-500/30">
      <div className="relative z-10 text-center max-w-2xl px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="relative mb-6 select-none">
          <h1 className="text-7xl md:text-8xl font-extrabold leading-none tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            {errorCode}
          </h1>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight">
          {is404 ? 'Halaman Tidak Ditemukan' : 'Terjadi Kesalahan'}
        </h2>
        <p className="text-slate-400 leading-relaxed mb-10 text-sm md:text-base">
          {is404
            ? 'Halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.'
            : 'Terjadi kesalahan internal. Silakan coba lagi.'}
        </p>

        <button
          onClick={() => navigate('/kasir')}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-all duration-200 text-sm md:text-base hover:-translate-y-0.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Kembali ke Beranda
        </button>

        <div className="text-slate-500 text-xs font-medium tracking-wide mt-10">
          &copy; {new Date().getFullYear()} WaroengKoe!
        </div>
      </div>
    </div>
  );
}
