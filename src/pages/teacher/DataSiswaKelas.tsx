import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/storage';
import { Card, EmptyRow, PageTitle, Table } from '../../components/ui';

export default function DataSiswaKelas() {
  const { user } = useAuth();
  const students = db.getStudents().filter((s) => s.kelas === user?.kelas);
  return (
    <div>
      <PageTitle
        title="Data Siswa Kelas Saya"
        subtitle="Anda hanya dapat melihat siswa pada kelas yang Anda ampu."
      />
      <Card>
        <Table headers={['NIS', 'Nama', 'L/P', 'Nama Ayah', 'Nama Ibu', 'No HP']}>
          {students.length === 0 && <EmptyRow colSpan={6} />}
          {students.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2">{s.nis}</td>
              <td className="px-3 py-2 font-medium">{s.nama}</td>
              <td className="px-3 py-2">{s.jenisKelamin}</td>
              <td className="px-3 py-2">{s.namaAyah || '-'}</td>
              <td className="px-3 py-2">{s.namaIbu || '-'}</td>
              <td className="px-3 py-2">{s.noHpOrtu || '-'}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
