import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { db } from '../../lib/storage';
import { Attendance, AttendanceStatus, Student } from '../../types';
import { Btn, Card, Field, inputCls, PageTitle } from '../../components/ui';

interface RowState {
  student: Student;
  status: AttendanceStatus;
  catatan: string;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

export default function InputKehadiran() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [tanggal, setTanggal] = useState('');
  const [rows, setRows] = useState<RowState[]>([]);
  const [loaded, setLoaded] = useState(false);

  function loadForm() {
    if (!tanggal) {
      notify('Pilih tanggal terlebih dahulu', 'err');
      return;
    }
    const students = db.getStudents().filter((s) => s.kelas === user?.kelas);
    const existing = db.getAttendance().filter((a) => a.tanggal === tanggal && a.kelas === user?.kelas);
    const rowsData: RowState[] = students.map((s) => {
      const found = existing.find((e) => e.siswaId === s.id);
      return { student: s, status: found?.status || 'Hadir', catatan: found?.catatan || '' };
    });
    setRows(rowsData);
    setLoaded(true);
  }

  function updateRow(idx: number, patch: Partial<RowState>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function submit() {
    if (!tanggal || rows.length === 0) {
      notify('Tidak ada data untuk disimpan', 'err');
      return;
    }
    const attendance = db.getAttendance();
    const others = attendance.filter((a) => !(a.tanggal === tanggal && a.kelas === user?.kelas));
    const newRecords: Attendance[] = rows.map((r) => ({
      id: db.generateId('HDR'),
      tanggal,
      kelas: user!.kelas,
      siswaId: r.student.id,
      nama: r.student.nama,
      status: r.status,
      catatan: r.catatan,
      inputOleh: user!.username,
      createdAt: new Date().toISOString(),
    }));
    db.saveAttendance([...others, ...newRecords]);
    db.addLog(user!.username, 'INPUT_KEHADIRAN', `${newRecords.length} data, kelas ${user?.kelas}`);
    notify('Kehadiran berhasil disimpan');
  }

  return (
    <div>
      <PageTitle title="Input Kehadiran Siswa" subtitle="Pilih tanggal, lalu tentukan status kehadiran tiap siswa" />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Field label="Tanggal">
          <input type="date" className={inputCls} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </Field>
        <Btn onClick={loadForm}>Muat Data</Btn>
      </div>

      {loaded && (
        <Card>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Belum ada siswa di kelas ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="text-left px-3 py-2">Nama</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r, idx) => (
                    <tr key={r.student.id}>
                      <td className="px-3 py-2 font-medium">{r.student.nama}</td>
                      <td className="px-3 py-2">
                        <select
                          className={inputCls}
                          value={r.status}
                          onChange={(e) => updateRow(idx, { status: e.target.value as AttendanceStatus })}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputCls}
                          placeholder="Catatan (opsional)"
                          value={r.catatan}
                          onChange={(e) => updateRow(idx, { catatan: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Btn className="mt-4" onClick={submit}>
                Simpan Kehadiran
              </Btn>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
