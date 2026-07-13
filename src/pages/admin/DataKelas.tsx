import { db } from '../../lib/storage';
import { CLASS_LIST } from '../../types';
import { Card, PageTitle } from '../../components/ui';

export default function DataKelas() {
  const students = db.getStudents();
  return (
    <div>
      <PageTitle title="Data Kelas" subtitle="Daftar rombongan belajar (Kelas 1 s/d 6, dengan Kelas 6A & 6B)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {CLASS_LIST.map((k) => {
          const count = students.filter((s) => s.kelas === k).length;
          return (
            <Card key={k}>
              <h3 className="font-bold text-teal-800 text-lg">Kelas {k}</h3>
              <p className="text-sm text-gray-500 mt-1">{count} siswa terdaftar</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
