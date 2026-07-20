import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BackButton from '@/components/BackButton';
import Icon from '@/components/Icon';
import { useUserStore } from '@/store/userStore';

export default function PenggunaEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.users.find((u) => u.id === id));
  const updateUser = useUserStore((s) => s.updateUser);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: false,
    can_view_activity_log: false,
    can_manage_category: false,
    can_delete_transaction: false,
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        is_admin: user.is_admin || false,
        can_view_activity_log: user.can_view_activity_log || false,
        can_manage_category: user.can_manage_category || false,
        can_delete_transaction: user.can_delete_transaction || false,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <AppLayout title="Edit Pengguna" hideBottomNav>
        <div className="py-16 text-center text-slate-500">Pengguna tidak ditemukan</div>
      </AppLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    updateUser(user.id, {
      name: form.name,
      email: form.email,
      is_admin: form.is_admin,
      can_view_activity_log: form.can_view_activity_log,
      can_manage_category: form.can_manage_category,
      can_delete_transaction: form.can_delete_transaction,
    });
    navigate('/pengguna');
  };

  return (
    <AppLayout title={`Edit ${user.name}`} hideBottomNav>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight uppercase">Edit Pengguna</h2>
            <p className="text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest mt-0.5">Update informasi "{user.name}"</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Icon name="person" className="text-[#006eff]" />
              Informasi Pengguna
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Password (Opsional)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-1 focus:ring-[#006eff] focus:border-[#006eff] outline-none transition-all"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Role</label>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_admin: false })}
                    disabled={user.name === 'Admin Waroeng'}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      !form.is_admin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                    } disabled:opacity-50`}
                  >
                    Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_admin: true })}
                    disabled={user.name === 'Admin Waroeng'}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      form.is_admin ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
                    } disabled:opacity-50`}
                  >
                    Admin
                  </button>
                </div>
                {user.name === 'Admin Waroeng' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">User default tidak dapat mengubah role</p>
                )}
              </div>
            </div>
          </div>

          {!form.is_admin && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
              <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                <Icon name="admin_panel_settings" className="text-[#006eff]" />
                Permissions
              </h4>
              <div className="space-y-3">
                {[
                  { key: 'can_view_activity_log', label: 'Lihat Log Aktivitas', desc: 'Kasir dapat melihat riwayat perubahan data' },
                  { key: 'can_manage_category', label: 'Kelola Kategori', desc: 'Kasir dapat menambah, mengedit, dan menghapus kategori' },
                  { key: 'can_delete_transaction', label: 'Hapus Transaksi', desc: 'Kasir dapat menghapus transaksi pending' },
                ].map((perm) => (
                  <div key={perm.key} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[perm.key as keyof typeof form] as boolean}
                        onChange={(e) => setForm({ ...form, [perm.key]: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-400 text-[#006eff] focus:ring-[#006eff]"
                      />
                      <div>
                        <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">{perm.label}</span>
                        <span className="block text-xs text-slate-600 dark:text-slate-400">{perm.desc}</span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-all text-sm"
            >
              <Icon name="close" className="text-sm" />
              Batal
            </button>
            <button
              type="submit"
              disabled={processing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#006eff] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0056c7] shadow-md shadow-blue-500/20 transition-all text-sm"
            >
              <Icon name="save" className="text-sm" />
              {processing ? 'Menyimpan...' : 'Update Pengguna'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
