import { db } from '../../lib/storage';
import { Card, EmptyRow, PageTitle, Table } from '../../components/ui';

export default function LogAktivitas() {
  const logs = db.getLogs();
  return (
    <div>
      <PageTitle title="Log Aktivitas" subtitle="Riwayat aktivitas pengguna (300 log terbaru)" />
      <Card>
        <Table headers={['Waktu', 'Username', 'Aksi', 'Detail']}>
          {logs.length === 0 && <EmptyRow colSpan={4} />}
          {logs.map((l, i) => (
            <tr key={i}>
              <td className="px-3 py-2 whitespace-nowrap">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
              <td className="px-3 py-2 font-mono">{l.username}</td>
              <td className="px-3 py-2">{l.aksi}</td>
              <td className="px-3 py-2">{l.detail || '-'}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
