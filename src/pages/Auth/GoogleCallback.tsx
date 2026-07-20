import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { mapBackendUser } from '@/store/authStore';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (!token) {
      setError('Token tidak ditemukan.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    localStorage.setItem('waroengkoe_token', token);

    apiFetch('/api/me')
      .then((res) => {
        const rawUser = res.user || res.data || res;
        if (rawUser && rawUser.id) {
          const user = mapBackendUser(rawUser);
          useAuthStore.setState({ user });
          localStorage.setItem('waroengkoe_auth', JSON.stringify({ user }));
          navigate('/kasir', { replace: true });
        } else {
          setError('Gagal memuat data pengguna.');
        }
      })
      .catch(() => {
        localStorage.removeItem('waroengkoe_token');
        setError('Sesi tidak valid. Silakan coba lagi.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      });
  }, []);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center">
          <div className="size-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
            <span className="text-red-500 text-2xl font-black">!</span>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="text-sm text-slate-500 mt-2">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Memproses login Google...</p>
      </div>
    </div>
  );
}
