import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import LoginPage from './components/LoginPage';
import Layout, { MenuItem } from './components/Layout';

import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import DataSekolah from './pages/admin/DataSekolah';
import DataKelas from './pages/admin/DataKelas';
import DataSiswa from './pages/admin/DataSiswa';
import AkunPengguna from './pages/admin/AkunPengguna';
import Pengaturan from './pages/admin/Pengaturan';
import TemplateSurat from './pages/admin/TemplateSurat';
import CetakSurat from './pages/admin/CetakSurat';
import RekapKehadiranAdmin from './pages/admin/RekapKehadiranAdmin';
import LogAktivitas from './pages/admin/LogAktivitas';

import TeacherDashboardHome from './pages/teacher/TeacherDashboardHome';
import DataSiswaKelas from './pages/teacher/DataSiswaKelas';
import InputKehadiran from './pages/teacher/InputKehadiran';
import RekapKehadiranKelas from './pages/teacher/RekapKehadiranKelas';

const ADMIN_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'sekolah', label: 'Data Sekolah', icon: '🏫' },
  { id: 'kelas', label: 'Data Kelas', icon: '📚' },
  { id: 'siswa', label: 'Data Siswa', icon: '🧑‍🎓' },
  { id: 'users', label: 'Akun Pengguna', icon: '👥' },
  { id: 'kehadiran', label: 'Rekap Kehadiran', icon: '📅' },
  { id: 'template', label: 'Template Surat', icon: '✉️' },
  { id: 'cetak', label: 'Cetak Surat Izin', icon: '🖨️' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
  { id: 'log', label: 'Log Aktivitas', icon: '📜' },
];

const TEACHER_MENU: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'siswa', label: 'Data Siswa', icon: '🧑‍🎓' },
  { id: 'input', label: 'Input Kehadiran', icon: '📝' },
  { id: 'rekap', label: 'Rekap Kehadiran', icon: '📅' },
];

function AdminApp() {
  const [page, setPage] = useState('dashboard');
  return (
    <Layout menuItems={ADMIN_MENU} activePage={page} onNavigate={setPage}>
      {page === 'dashboard' && <AdminDashboardHome />}
      {page === 'sekolah' && <DataSekolah />}
      {page === 'kelas' && <DataKelas />}
      {page === 'siswa' && <DataSiswa />}
      {page === 'users' && <AkunPengguna />}
      {page === 'kehadiran' && <RekapKehadiranAdmin />}
      {page === 'template' && <TemplateSurat />}
      {page === 'cetak' && <CetakSurat />}
      {page === 'settings' && <Pengaturan />}
      {page === 'log' && <LogAktivitas />}
    </Layout>
  );
}

function TeacherApp() {
  const [page, setPage] = useState('dashboard');
  return (
    <Layout menuItems={TEACHER_MENU} activePage={page} onNavigate={setPage}>
      {page === 'dashboard' && <TeacherDashboardHome />}
      {page === 'siswa' && <DataSiswaKelas />}
      {page === 'input' && <InputKehadiran />}
      {page === 'rekap' && <RekapKehadiranKelas />}
    </Layout>
  );
}

function Main() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-teal-950 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white px-8 py-6 text-center shadow-xl">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" />
          <p className="font-semibold text-teal-900">Menghubungkan ke Google Spreadsheet…</p>
          <p className="mt-1 text-xs text-gray-500">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }
  if (!user) return <LoginPage />;
  return user.role === 'admin' ? <AdminApp /> : <TeacherApp />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Main />
      </AuthProvider>
    </ToastProvider>
  );
}
