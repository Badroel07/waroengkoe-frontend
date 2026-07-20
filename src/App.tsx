import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import GoogleCallback from './pages/Auth/GoogleCallback';
import Dashboard from './pages/Dashboard/Dashboard';
import KasirIndex from './pages/Kasir/Index';
import BarangIndex from './pages/Barang/Index';
import BarangCreate from './pages/Barang/Create';
import BarangEdit from './pages/Barang/Edit';
import BarangShow from './pages/Barang/Show';
import KategoriIndex from './pages/Kategori/Index';
import KategoriCreate from './pages/Kategori/Create';
import KategoriEdit from './pages/Kategori/Edit';
import KategoriShow from './pages/Kategori/Show';
import SatuanIndex from './pages/Satuan/Index';
import SatuanCreate from './pages/Satuan/Create';
import SatuanEdit from './pages/Satuan/Edit';
import SatuanShow from './pages/Satuan/Show';
import Riwayat from './pages/Transaksi/Riwayat';
import TransaksiShow from './pages/Transaksi/Show';
import PenggunaIndex from './pages/Pengguna/Index';
import PenggunaCreate from './pages/Pengguna/Create';
import PenggunaEdit from './pages/Pengguna/Edit';
import Pengaturan from './pages/Pengaturan/Index';
import KeuntunganIndex from './pages/Keuntungan/Index';
import KeuntunganProductAudit from './pages/Keuntungan/ProductAudit';
import AuditStokIndex from './pages/AuditStok/Index';
import AuditStokShow from './pages/AuditStok/Show';
import LogAktivitasIndex from './pages/LogAktivitas/Index';
import LogAktivitasShow from './pages/LogAktivitas/Show';
import ErrorPage from './pages/Error';

function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><>{children}</></ProtectedRoute>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/kasir" element={<ProtectedRoute><KasirIndex /></ProtectedRoute>} />
      <Route path="/kasir/riwayat" element={<ProtectedRoute><Riwayat /></ProtectedRoute>} />
      <Route path="/kasir/riwayat/:id" element={<ProtectedRoute><TransaksiShow /></ProtectedRoute>} />
      <Route path="/barang" element={<ProtectedRoute><BarangIndex /></ProtectedRoute>} />
      <Route path="/barang/create" element={<ProtectedRoute><BarangCreate /></ProtectedRoute>} />
      <Route path="/barang/:id" element={<ProtectedRoute><BarangShow /></ProtectedRoute>} />
      <Route path="/barang/:id/edit" element={<ProtectedRoute><BarangEdit /></ProtectedRoute>} />
      <Route path="/kategori" element={<ProtectedRoute><KategoriIndex /></ProtectedRoute>} />
      <Route path="/kategori/create" element={<ProtectedRoute><KategoriCreate /></ProtectedRoute>} />
      <Route path="/kategori/:id" element={<ProtectedRoute><KategoriShow /></ProtectedRoute>} />
      <Route path="/kategori/:id/edit" element={<ProtectedRoute><KategoriEdit /></ProtectedRoute>} />
      <Route path="/satuan" element={<ProtectedRoute><SatuanIndex /></ProtectedRoute>} />
      <Route path="/satuan/create" element={<ProtectedRoute><SatuanCreate /></ProtectedRoute>} />
      <Route path="/satuan/:id" element={<ProtectedRoute><SatuanShow /></ProtectedRoute>} />
      <Route path="/satuan/:id/edit" element={<ProtectedRoute><SatuanEdit /></ProtectedRoute>} />
      <Route path="/pengguna" element={<ProtectedRoute><PenggunaIndex /></ProtectedRoute>} />
      <Route path="/pengguna/create" element={<ProtectedRoute><PenggunaCreate /></ProtectedRoute>} />
      <Route path="/pengguna/:id/edit" element={<ProtectedRoute><PenggunaEdit /></ProtectedRoute>} />
      <Route path="/pengaturan" element={<ProtectedRoute><Pengaturan /></ProtectedRoute>} />
      <Route path="/keuntungan" element={<ProtectedRoute><KeuntunganIndex /></ProtectedRoute>} />
      <Route path="/keuntungan/:id" element={<ProtectedRoute><KeuntunganProductAudit /></ProtectedRoute>} />
      <Route path="/audit-stok" element={<ProtectedRoute><AuditStokIndex /></ProtectedRoute>} />
      <Route path="/audit-stok/:id" element={<ProtectedRoute><AuditStokShow /></ProtectedRoute>} />
      <Route path="/log-aktivitas" element={<ProtectedRoute><LogAktivitasIndex /></ProtectedRoute>} />
      <Route path="/log-aktivitas/:id" element={<ProtectedRoute><LogAktivitasShow /></ProtectedRoute>} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/" element={<Navigate to="/kasir" replace />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
