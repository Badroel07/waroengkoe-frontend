import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Icon from '@/components/Icon';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  const [email, setEmail] = useState('admin@waroengkoe');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/kasir', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password harus diisi');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      const success = await login(email, password);
      if (success) {
        navigate('/kasir', { replace: true });
      } else {
        setError('Email atau password salah');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex transition-colors duration-500 overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 relative overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        {/* Decorative shapes - top left */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-80 pointer-events-none" />
        <div className="absolute top-8 left-20 w-20 h-20 bg-indigo-400 rounded-full opacity-60 pointer-events-none" />

        <div className="w-full max-w-md m-auto relative z-10">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transform hover:scale-110 transition-transform cursor-pointer">
              <img src="/images/logo.webp" alt="WaroengKoe Logo" className="w-full h-full object-contain drop-shadow-[0_6px_20px_rgba(29,120,255,0.5)]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">
              Waroeng<span className="text-blue-500">Koe</span>
            </h1>
            <p className="text-[11px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.3em] mb-8">
              Premium Point of Sale
            </p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
              Selamat Datang
            </h2>
          </div>

          {/* Google Login - First */}
          <button
            onClick={() => {
              // Simulated Google OAuth redirect/success in frontend-only version
              setLoading(true);
              setTimeout(() => {
                login('admin@waroengkoe.com', 'password');
                navigate('/kasir', { replace: true });
              }, 500);
            }}
            className="w-full py-4 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-4 shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Masuk via Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-6 text-[11px] font-black text-slate-500 dark:text-slate-600 bg-white dark:bg-slate-950 uppercase tracking-[0.2em] transition-colors">
                Kredensial Email
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-700"
                placeholder="Alamat Email"
                required
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-14 py-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-700"
                placeholder="Kata Sandi"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-blue-500 transition-colors cursor-pointer"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-xl" />
              </button>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pb-2">
              <label className="flex items-center gap-3 cursor-pointer group/check">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-5 rounded-md border-2 border-slate-300 dark:border-slate-800 text-blue-500 focus:ring-0 transition-all cursor-pointer bg-white dark:bg-slate-900 group-hover/check:border-blue-500/50"
                  />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-500 uppercase tracking-widest">
                  Ingat Saya
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98] group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Login Sekarang</span>
                  <Icon name="arrow_forward" className="text-lg group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts Box */}
          <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2">Akun Demo</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Admin:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">admin@waroengkoe.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Kasir:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">kasir@waroengkoe.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Password:</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">(sembarang)</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-12 text-center text-[11px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} WaroengKoe! • Smart POS System
          </p>
        </div>
      </div>

      {/* Right Side - Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-50 dark:bg-slate-900 items-center justify-center p-12 relative overflow-hidden transition-colors duration-500">
        {/* Abstract high-end decorative elements */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-lg">
          <div className="size-24 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl mx-auto mb-10 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-all duration-500 border border-slate-200 dark:border-slate-700">
            <Icon name="point_of_sale" className="text-blue-500 text-5xl" />
          </div>
          <h2 className="text-5xl font-black text-slate-900 dark:text-slate-100 leading-[1.1] tracking-tighter uppercase mb-6">
            Kelola Toko <br />
            <span className="text-blue-500 dark:text-blue-400">Lebih Elegant</span>
          </h2>
          <p className="text-sm font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
            Sistem Kasir Modern dengan Pengalaman <br /> Visual yang Memukau di Setiap Klik.
          </p>
        </div>

        {/* Minimalist Grid Pattern */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-800 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-slate-800 to-transparent" />
      </div>
    </div>
  );
}