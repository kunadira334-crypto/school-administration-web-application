import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/storage';
import { CLASS_LIST } from '../../types';
import { Card, PageTitle, StatCard } from '../../components/ui';

export default function AdminDashboardHome() {
  const { user } = useAuth();
  const students = db.getStudents();
  const users = db.getUsers();
  const today = new Date().toISOString().slice(0, 10);
  const attendance = db.getAttendance();
  const hadirHariIni = attendance.filter((a) => a.tanggal === today && a.status === 'Hadir').length;

  return (
    <div>
      <PageTitle title="Dashboard Admin" subtitle="Ringkasan data sekolah MI Mambaul Ulum Sumberduren" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Siswa" value={students.length} />
        <StatCard label="Total Kelas" value={CLASS_LIST.length} />
        <StatCard label="Wali Kelas" value={users.filter((u) => u.role === 'wali_kelas').length} />
        <StatCard label="Hadir Hari Ini" value={hadirHariIni} />
      </div>
      <Card>
        <h3 className="font-bold text-gray-700 mb-1">Selamat datang, {user?.nama} 👋</h3>
        <p className="text-sm text-gray-500">
          Gunakan menu di samping untuk mengelola data sekolah, kelas, siswa, wali kelas, kehadiran, template
          surat, dan mencetak surat izin secara otomatis. Semua data aplikasi tersimpan dan tersinkronisasi
          langsung dengan Google Spreadsheet melalui API server Vercel.
        </p>
      </Card>
    </div>
  );
}
