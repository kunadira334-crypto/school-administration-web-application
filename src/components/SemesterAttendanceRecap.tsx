import { useMemo, useState } from 'react';
import { Attendance, CLASS_LIST, Student } from '../types';
import {
  buildSemesterRecap,
  currentAcademicYearStart,
  currentSemester,
  SemesterType,
} from '../lib/attendanceRecap';
import { Card, EmptyRow, Field, inputCls, Table } from './ui';

interface Props {
  students: Student[];
  attendance: Attendance[];
  fixedClass?: string;
}

export default function SemesterAttendanceRecap({ students, attendance, fixedClass }: Props) {
  const currentStartYear = currentAcademicYearStart();
  const [kelas, setKelas] = useState(fixedClass || '');
  const [semester, setSemester] = useState<SemesterType>(currentSemester());
  const [startYear, setStartYear] = useState(currentStartYear);
  const selectedClass = fixedClass || kelas;
  const academicYears = Array.from({ length: 6 }, (_, index) => currentStartYear + 1 - index);

  const rows = useMemo(
    () =>
      selectedClass
        ? buildSemesterRecap(students, attendance, selectedClass, startYear, semester)
        : [],
    [students, attendance, selectedClass, startYear, semester]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (result, row) => ({
          izin: result.izin + row.Izin,
          sakit: result.sakit + row.Sakit,
          alpha: result.alpha + row.Alpha,
          tidakHadir: result.tidakHadir + row.totalTidakHadir,
        }),
        { izin: 0, sakit: 0, alpha: 0, tidakHadir: 0 }
      ),
    [rows]
  );

  return (
    <Card>
      <div className="mb-4">
        <h3 className="font-bold text-gray-800">Rekap Absensi Satu Semester</h3>
        <p className="text-sm text-gray-500">
          Menampilkan jumlah kehadiran dan seluruh ketidakhadiran masing-masing siswa dalam satu kelas.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${fixedClass ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-3 mb-4`}>
        {!fixedClass && (
          <Field label="Kelas">
            <select className={inputCls} value={kelas} onChange={(event) => setKelas(event.target.value)}>
              <option value="">Pilih Kelas</option>
              {CLASS_LIST.map((item) => (
                <option key={item} value={item}>Kelas {item}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Tahun Ajaran">
          <select className={inputCls} value={startYear} onChange={(event) => setStartYear(Number(event.target.value))}>
            {academicYears.map((year) => (
              <option key={year} value={year}>{year}/{year + 1}</option>
            ))}
          </select>
        </Field>
        <Field label="Semester">
          <select className={inputCls} value={semester} onChange={(event) => setSemester(event.target.value as SemesterType)}>
            <option value="ganjil">Ganjil (Juli–Desember)</option>
            <option value="genap">Genap (Januari–Juni)</option>
          </select>
        </Field>
      </div>

      {!selectedClass ? (
        <p className="py-8 text-center text-sm text-gray-400">Pilih kelas untuk melihat rekap semester.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <SummaryBox label="Total Izin" value={totals.izin} tone="blue" />
            <SummaryBox label="Total Sakit" value={totals.sakit} tone="orange" />
            <SummaryBox label="Total Alpha" value={totals.alpha} tone="red" />
            <SummaryBox label="Semua Tidak Hadir" value={totals.tidakHadir} tone="gray" />
          </div>

          <Table headers={['NIS', 'Nama Siswa', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Tidak Hadir', 'Hari Tercatat', 'Kehadiran']}>
            {rows.length === 0 && <EmptyRow colSpan={9} text="Belum ada siswa pada kelas ini." />}
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-3 py-2">{row.nis}</td>
                <td className="px-3 py-2 font-medium">{row.nama}</td>
                <td className="px-3 py-2 text-emerald-700 font-semibold">{row.Hadir}</td>
                <td className="px-3 py-2">{row.Izin}</td>
                <td className="px-3 py-2">{row.Sakit}</td>
                <td className="px-3 py-2 text-red-700 font-semibold">{row.Alpha}</td>
                <td className="px-3 py-2 font-bold">{row.totalTidakHadir}</td>
                <td className="px-3 py-2">{row.totalTercatat}</td>
                <td className="px-3 py-2">{row.totalTercatat ? `${row.persentaseKehadiran}%` : '-'}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs text-gray-500">
            Tidak hadir = Izin + Sakit + Alpha. Siswa dengan ketidakhadiran terbanyak ditampilkan paling atas.
          </p>
        </>
      )}
    </Card>
  );
}

function SummaryBox({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'orange' | 'red' | 'gray' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    gray: 'bg-gray-50 text-gray-800 border-gray-200',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[tone]}`}>
      <p className="text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
