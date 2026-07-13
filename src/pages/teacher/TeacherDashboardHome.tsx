import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/storage';
import { Card, PageTitle, StatCard } from '../../components/ui';

export default function TeacherDashboardHome() {
  const { user } = useAuth();
  const students = db.getStudents().filter((s) => s.kelas === user?.kelas);
  const attendance = db.getAttendance().filter((a) => a.kelas === user?.kelas);
  const today = new Date().toISOString().slice(0, 10);
  const hadirHariIni = attendance.filter((a) => a.tanggal === today && a.status === 'Hadir').length;
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const alphaBulanIni = attendance.filter(
    (a) => a.status === 'Alpha' && a.tanggal >= firstOfMonth.toISOString().slice(0, 10)
  ).length;

  return (
    <div>
      <PageTitle title="Dashboard Wali Kelas" subtitle={`Selamat datang, ${user?.nama} (Kelas ${user?.kelas})`} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Jumlah Siswa" value={students.length} />
        <StatCard label="Hadir Hari Ini" value={hadirHariIni} />
        <StatCard label="Alpha Bulan Ini" value={alphaBulanIni} />
      </div>
      <Card>
        <h3 className="font-bold text-gray-700 mb-1">Informasi</h3>
        <p className="text-sm text-gray-500">
          Anda login sebagai Wali Kelas {user?.kelas}. Anda hanya dapat melihat dan mengelola data siswa serta
          kehadiran pada kelas ini.
        </p>
      </Card>
    </div>
  );
}
