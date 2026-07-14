import { Attendance, AttendanceStatus, Student } from '../types';

export type SemesterType = 'ganjil' | 'genap';

export interface SemesterRecapRow {
  key: string;
  nis: string;
  nama: string;
  kelas: string;
  Hadir: number;
  Izin: number;
  Sakit: number;
  Alpha: number;
  totalTidakHadir: number;
  totalTercatat: number;
  persentaseKehadiran: number;
}

export function currentAcademicYearStart(date = new Date()) {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
}

export function currentSemester(date = new Date()): SemesterType {
  return date.getMonth() >= 6 ? 'ganjil' : 'genap';
}

export function semesterDateRange(startYear: number, semester: SemesterType) {
  return semester === 'ganjil'
    ? { start: `${startYear}-07-01`, end: `${startYear}-12-31` }
    : { start: `${startYear + 1}-01-01`, end: `${startYear + 1}-06-30` };
}

function studentKey(student: Student) {
  if (student.id) return `id:${student.id}`;
  if (student.nis) return `nis:${student.nis}`;
  return `nama:${student.kelas}:${student.nama.trim().toLowerCase()}`;
}

function attendanceKey(item: Attendance, students: Student[]) {
  if (item.siswaId) {
    const matchingStudent = students.find((student) => student.id === item.siswaId);
    if (matchingStudent) return studentKey(matchingStudent);
  }
  const matchingByName = students.find(
    (student) =>
      String(student.kelas).trim() === String(item.kelas).trim() &&
      student.nama.trim().toLowerCase() === item.nama.trim().toLowerCase()
  );
  return matchingByName ? studentKey(matchingByName) : `arsip:${item.kelas}:${item.nama.trim().toLowerCase()}`;
}

export function buildSemesterRecap(
  students: Student[],
  attendance: Attendance[],
  kelas: string,
  startYear: number,
  semester: SemesterType
) {
  const selectedStudents = students.filter(
    (student) => student.aktif !== false && String(student.kelas).trim() === String(kelas).trim()
  );
  const { start, end } = semesterDateRange(startYear, semester);
  const selectedAttendance = attendance.filter(
    (item) =>
      String(item.kelas).trim() === String(kelas).trim() &&
      item.tanggal >= start &&
      item.tanggal <= end
  );

  const rows = new Map<string, SemesterRecapRow>();
  selectedStudents.forEach((student) => {
    const key = studentKey(student);
    rows.set(key, {
      key,
      nis: student.nis || '-',
      nama: student.nama,
      kelas: student.kelas,
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alpha: 0,
      totalTidakHadir: 0,
      totalTercatat: 0,
      persentaseKehadiran: 0,
    });
  });

  selectedAttendance.forEach((item) => {
    const key = attendanceKey(item, selectedStudents);
    if (!rows.has(key)) {
      rows.set(key, {
        key,
        nis: '-',
        nama: item.nama,
        kelas: item.kelas,
        Hadir: 0,
        Izin: 0,
        Sakit: 0,
        Alpha: 0,
        totalTidakHadir: 0,
        totalTercatat: 0,
        persentaseKehadiran: 0,
      });
    }
    const row = rows.get(key)!;
    row[item.status as AttendanceStatus] += 1;
  });

  return Array.from(rows.values())
    .map((row) => {
      const totalTidakHadir = row.Izin + row.Sakit + row.Alpha;
      const totalTercatat = row.Hadir + totalTidakHadir;
      return {
        ...row,
        totalTidakHadir,
        totalTercatat,
        persentaseKehadiran: totalTercatat ? Math.round((row.Hadir / totalTercatat) * 100) : 0,
      };
    })
    .sort((a, b) => b.totalTidakHadir - a.totalTidakHadir || a.nama.localeCompare(b.nama, 'id'));
}
