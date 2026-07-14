import { useState } from 'react';
import { db } from '../../lib/storage';
import { CLASS_LIST, Student } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { Btn, Card, EmptyRow, Field, inputCls, Modal, PageTitle, Table } from '../../components/ui';

const emptyStudent = (): Student => ({
  id: '',
  nis: '',
  nisn: '',
  nama: '',
  jenisKelamin: 'L',
  kelas: '1',
  namaAyah: '',
  namaIbu: '',
  noHpOrtu: '',
  alamat: '',
  aktif: true,
});

export default function DataSiswa() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [students, setStudents] = useState<Student[]>(db.getStudents());
  const [filterKelas, setFilterKelas] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Student>(emptyStudent());
  const [isEdit, setIsEdit] = useState(false);

  const filtered = filterKelas ? students.filter((s) => s.kelas === filterKelas) : students;

  function openAdd() {
    setForm(emptyStudent());
    setIsEdit(false);
    setModalOpen(true);
  }
  function openEdit(s: Student) {
    setForm(s);
    setIsEdit(true);
    setModalOpen(true);
  }

  function submit() {
    if (!form.nama.trim() || !form.nis.trim()) {
      notify('Nama dan NIS wajib diisi', 'err');
      return;
    }
    let updated: Student[];
    if (isEdit) {
      updated = students.map((s) => (s.id === form.id ? form : s));
      db.addLog(user!.username, 'UPDATE_SISWA', form.nama);
    } else {
      const newStudent = { ...form, id: db.generateId('SIS') };
      updated = [...students, newStudent];
      db.addLog(user!.username, 'TAMBAH_SISWA', `${newStudent.nama} - Kelas ${newStudent.kelas}`);
    }
    setStudents(updated);
    db.saveStudents(updated);
    notify('Data siswa disimpan');
    setModalOpen(false);
  }

  function remove(id: string) {
    if (!confirm('Hapus data siswa ini?')) return;
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    db.saveStudents(updated);
    db.addLog(user!.username, 'HAPUS_SISWA', id);
    notify('Siswa dihapus');
  }

  return (
    <div>
      <PageTitle title="Data Siswa" subtitle="Kelola data siswa per kelas" />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Field label="Filter Kelas">
          <select className={inputCls + ' min-w-[160px]'} value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}>
            <option value="">Semua Kelas</option>
            {CLASS_LIST.map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </Field>
        <Btn onClick={openAdd}>+ Tambah Siswa</Btn>
      </div>

      <Card>
        <Table headers={['NIS', 'Nama', 'L/P', 'Kelas', 'Nama Ayah', 'Nama Ibu', 'No HP', 'Aksi']}>
          {filtered.length === 0 && <EmptyRow colSpan={8} />}
          {filtered.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-2">{s.nis}</td>
              <td className="px-3 py-2 font-medium">{s.nama}</td>
              <td className="px-3 py-2">{s.jenisKelamin}</td>
              <td className="px-3 py-2">{s.kelas}</td>
              <td className="px-3 py-2">{s.namaAyah || '-'}</td>
              <td className="px-3 py-2">{s.namaIbu || '-'}</td>
              <td className="px-3 py-2">{s.noHpOrtu || '-'}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button className="text-teal-700 text-xs font-semibold mr-3" onClick={() => openEdit(s)}>
                  Edit
                </button>
                <button className="text-red-600 text-xs font-semibold" onClick={() => remove(s.id)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {modalOpen && (
        <Modal title={isEdit ? 'Edit Siswa' : 'Tambah Siswa'} onClose={() => setModalOpen(false)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="NIS">
              <input className={inputCls} value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
            </Field>
            <Field label="NISN">
              <input className={inputCls} value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} />
            </Field>
          </div>
          <Field label="Nama Lengkap">
            <input className={inputCls} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Jenis Kelamin">
              <select
                className={inputCls}
                value={form.jenisKelamin}
                onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value as 'L' | 'P' })}
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
            <Field label="Kelas">
              <select className={inputCls} value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })}>
                {CLASS_LIST.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3">
            <Field label="Nama Ayah">
              <input className={inputCls} value={form.namaAyah} onChange={(e) => setForm({ ...form, namaAyah: e.target.value })} />
            </Field>
            <Field label="Nama Ibu">
              <input className={inputCls} value={form.namaIbu} onChange={(e) => setForm({ ...form, namaIbu: e.target.value })} />
            </Field>
          </div>
          <Field label="No HP Orang Tua">
            <input className={inputCls} value={form.noHpOrtu} onChange={(e) => setForm({ ...form, noHpOrtu: e.target.value })} />
          </Field>
          <Field label="Alamat">
            <textarea className={inputCls} rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 mt-4">
            <Btn variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Btn>
            <Btn onClick={submit}>Simpan</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
