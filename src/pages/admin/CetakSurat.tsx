import { useMemo, useState } from 'react';
import { db } from '../../lib/storage';
import { CLASS_LIST } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { buildLetterHtml } from '../../lib/letter';
import { Btn, Card, Field, inputCls, PageTitle } from '../../components/ui';

export default function CetakSurat() {
  const { user } = useAuth();
  const { notify } = useToast();
  const templates = db.getTemplates();
  const settings = db.getSettings();
  const allStudents = db.getStudents();

  const [kelas, setKelas] = useState('');
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [alasan, setAlasan] = useState('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [archiveInfo, setArchiveInfo] = useState('');

  const studentsInClass = useMemo(() => allStudents.filter((s) => s.kelas === kelas), [kelas, allStudents]);

  function cetak() {
    const student = studentsInClass.find((s) => s.id === siswaId);
    const tpl = templates.find((t) => t.id === templateId) || templates[0];
    if (!student) {
      notify('Pilih siswa terlebih dahulu', 'err');
      return;
    }
    if (!tpl) {
      notify('Template surat belum tersedia', 'err');
      return;
    }
    if (!tanggal || !alasan) {
      notify('Tanggal izin dan alasan wajib diisi', 'err');
      return;
    }
    const finalNomor =
      nomorSurat || `${settings.nomorSuratPrefix}${new Date().getMonth() + 1}/${new Date().getFullYear()}`;

    const html = buildLetterHtml(
      {
        namaSiswa: student.nama,
        nis: student.nis,
        kelas: student.kelas,
        tanggalIzin: tanggal,
        alasan,
        templateIsi: tpl.isi,
        templateJudul: tpl.judul,
      },
      settings,
      finalNomor
    );

    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }

    db.addLetter({
      id: db.generateId('SURAT'),
      namaSiswa: student.nama,
      kelas: student.kelas,
      tanggalIzin: tanggal,
      alasan,
      nomorSurat: finalNomor,
      html,
      createdAt: new Date().toISOString(),
    });
    db.addLog(user!.username, 'CETAK_SURAT_IZIN', `${student.nama} - ${tanggal}`);
    setArchiveInfo(`Surat berhasil dibuat & diarsipkan (nomor: ${finalNomor}). Total arsip: ${db.getLetters().length}`);
    notify('Surat berhasil dibuat');
  }

  return (
    <div>
      <PageTitle title="Cetak Surat Izin" subtitle="Buat surat izin otomatis berdasarkan data siswa" />
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Kelas">
            <select
              className={inputCls}
              value={kelas}
              onChange={(e) => {
                setKelas(e.target.value);
                setSiswaId('');
              }}
            >
              <option value="">Pilih Kelas</option>
              {CLASS_LIST.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nama Siswa">
            <select className={inputCls} value={siswaId} onChange={(e) => setSiswaId(e.target.value)}>
              <option value="">Pilih Siswa</option>
              {studentsInClass.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tanggal Izin">
            <input type="date" className={inputCls} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </Field>
          <Field label="Alasan">
            <input
              className={inputCls}
              placeholder="mis. sakit demam / acara keluarga"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
            />
          </Field>
          <Field label="Nomor Surat (opsional, otomatis jika kosong)">
            <input className={inputCls} value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} />
          </Field>
          <Field label="Template Surat">
            <select className={inputCls} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.judul}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Btn onClick={cetak}>🖨️ Buat &amp; Cetak Surat</Btn>
        {archiveInfo && <p className="text-sm text-gray-500 mt-3">{archiveInfo}</p>}
      </Card>

      <Card className="mt-4">
        <h3 className="font-bold text-gray-700 mb-2">Arsip Surat Terbaru</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {db.getLetters().length === 0 && <p className="text-sm text-gray-400">Belum ada surat yang dicetak.</p>}
          {db.getLetters().map((l) => (
            <div key={l.id} className="flex justify-between items-center border-b border-gray-100 pb-2 text-sm">
              <div>
                <p className="font-semibold">{l.namaSiswa} (Kelas {l.kelas})</p>
                <p className="text-xs text-gray-400">
                  {l.nomorSurat} &middot; {l.tanggalIzin} &middot; {l.alasan}
                </p>
              </div>
              <button
                className="text-teal-700 text-xs font-semibold"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.open();
                    w.document.write(l.html);
                    w.document.close();
                  }
                }}
              >
                Buka
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
