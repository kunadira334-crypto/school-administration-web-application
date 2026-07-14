import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/storage';
import { AttendanceStatus } from '../../types';
import { Badge, Card, EmptyRow, Field, inputCls, PageTitle, Table } from '../../components/ui';
import SemesterAttendanceRecap from '../../components/SemesterAttendanceRecap';

export default function RekapKehadiranKelas() {
  const { user } = useAuth();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'detail' | 'semester'>('detail');

  const attendance = db.getAttendance().filter((a) => a.kelas === user?.kelas);

  const filtered = useMemo(() => {
    return attendance.filter((a) => {
      if (dari && a.tanggal < dari) return false;
      if (sampai && a.tanggal > sampai) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }, [attendance, dari, sampai, status]);

  const recap = useMemo(() => {
    const map: Record<string, { siswaId: string; nama: string; Hadir: number; Izin: number; Sakit: number; Alpha: number }> = {};
    filtered.forEach((a) => {
      if (!map[a.siswaId]) map[a.siswaId] = { siswaId: a.siswaId, nama: a.nama, Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
      map[a.siswaId][a.status as AttendanceStatus]++;
    });
    return Object.values(map);
  }, [filtered]);

  return (
    <div>
      <PageTitle title="Rekap Kehadiran Kelas Saya" subtitle="Lihat rekap harian atau rangkuman ketidakhadiran satu semester" />
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Jenis rekap kehadiran">
        <button
          type="button"
          onClick={() => setMode('detail')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            mode === 'detail' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Rekap Harian
        </button>
        <button
          type="button"
          onClick={() => setMode('semester')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            mode === 'semester' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          Rekap Semester
        </button>
      </div>

      {mode === 'semester' ? (
        <SemesterAttendanceRecap
          students={db.getStudents()}
          attendance={attendance}
          fixedClass={user?.kelas || ''}
        />
      ) : (
        <>
      <Card className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Dari Tanggal">
            <input type="date" className={inputCls} value={dari} onChange={(e) => setDari(e.target.value)} />
          </Field>
          <Field label="Sampai Tanggal">
            <input type="date" className={inputCls} value={sampai} onChange={(e) => setSampai(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua</option>
              <option>Hadir</option>
              <option>Izin</option>
              <option>Sakit</option>
              <option>Alpha</option>
            </select>
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="font-bold text-gray-700 mb-2">Rekap per Siswa</h3>
        <Table headers={['Nama', 'Hadir', 'Izin', 'Sakit', 'Alpha']}>
          {recap.length === 0 && <EmptyRow colSpan={5} />}
          {recap.map((r) => (
            <tr key={r.siswaId}>
              <td className="px-3 py-2 font-medium">{r.nama}</td>
              <td className="px-3 py-2">{r.Hadir}</td>
              <td className="px-3 py-2">{r.Izin}</td>
              <td className="px-3 py-2">{r.Sakit}</td>
              <td className="px-3 py-2">{r.Alpha}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card>
        <h3 className="font-bold text-gray-700 mb-2">Detail Kehadiran</h3>
        <Table headers={['Tanggal', 'Nama', 'Status', 'Catatan']}>
          {filtered.length === 0 && <EmptyRow colSpan={4} />}
          {filtered.map((a) => (
            <tr key={a.id}>
              <td className="px-3 py-2">{a.tanggal}</td>
              <td className="px-3 py-2">{a.nama}</td>
              <td className="px-3 py-2">
                <Badge status={a.status} />
              </td>
              <td className="px-3 py-2">{a.catatan || '-'}</td>
            </tr>
          ))}
        </Table>
      </Card>
        </>
      )}
    </div>
  );
}
