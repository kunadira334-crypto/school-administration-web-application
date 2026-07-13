import { db } from '../../lib/storage';
import { Card, PageTitle } from '../../components/ui';

export default function DataSekolah() {
  const s = db.getSettings();
  const rows: [string, string][] = [
    ['Nama Yayasan', s.namaYayasan],
    ['Nama Madrasah', s.namaMadrasah],
    ['Alamat', s.alamat],
    ['Telepon', s.telepon],
    ['Email', s.email],
    ['NPSN', s.npsn],
    ['Kepala Madrasah', s.namaKepalaSekolah],
  ];
  return (
    <div>
      <PageTitle title="Data Sekolah" subtitle="Profil Yayasan & Madrasah. Untuk mengubah, buka menu Pengaturan." />
      <Card>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 font-semibold text-gray-500 w-48">{label}</td>
                <td className="py-2">{value || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
