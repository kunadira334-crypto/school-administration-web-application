import { useState } from 'react';
import { db } from '../../lib/storage';
import { CLASS_LIST, User } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { Badge, Btn, Card, EmptyRow, Field, inputCls, Modal, PageTitle, Table } from '../../components/ui';

const emptyUser = (): User => ({ username: '', password: '', role: 'wali_kelas', nama: '', kelas: '1', aktif: true });

export default function AkunPengguna() {
  const { user: current } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<User>(emptyUser());
  const [isEdit, setIsEdit] = useState(false);

  function openAdd() {
    setForm(emptyUser());
    setIsEdit(false);
    setModalOpen(true);
  }
  function openEdit(u: User) {
    setForm({ ...u, password: '' });
    setIsEdit(true);
    setModalOpen(true);
  }

  function submit() {
    if (!form.username.trim() || !form.nama.trim()) {
      notify('Username dan Nama wajib diisi', 'err');
      return;
    }
    if (!isEdit && users.some((u) => u.username === form.username)) {
      notify('Username sudah digunakan', 'err');
      return;
    }
    let updated: User[];
    if (isEdit) {
      updated = users.map((u) =>
        u.username === form.username
          ? { ...form, password: form.password ? form.password : u.password, kelas: form.role === 'wali_kelas' ? form.kelas : '' }
          : u
      );
      db.addLog(current!.username, 'UPDATE_USER', form.username);
    } else {
      const newUser: User = { ...form, password: form.password || '123456', kelas: form.role === 'wali_kelas' ? form.kelas : '' };
      updated = [...users, newUser];
      db.addLog(current!.username, 'TAMBAH_USER', `${newUser.username} (${newUser.role})`);
    }
    setUsers(updated);
    db.saveUsers(updated);
    notify('Akun disimpan');
    setModalOpen(false);
  }

  function remove(username: string) {
    if (username === current?.username) {
      notify('Tidak dapat menghapus akun yang sedang digunakan', 'err');
      return;
    }
    if (!confirm(`Hapus akun ${username}?`)) return;
    const updated = users.filter((u) => u.username !== username);
    setUsers(updated);
    db.saveUsers(updated);
    db.addLog(current!.username, 'HAPUS_USER', username);
    notify('Akun dihapus');
  }

  function toggleActive(u: User) {
    const updated = users.map((x) => (x.username === u.username ? { ...x, aktif: !x.aktif } : x));
    setUsers(updated);
    db.saveUsers(updated);
    db.addLog(current!.username, 'UBAH_STATUS_USER', `${u.username} -> ${!u.aktif}`);
  }

  return (
    <div>
      <PageTitle title="Akun Pengguna (Admin & Wali Kelas)" subtitle="Kelola akun login untuk admin dan wali kelas" />
      <div className="mb-4">
        <Btn onClick={openAdd}>+ Tambah Akun</Btn>
      </div>
      <Card>
        <Table headers={['Username', 'Nama', 'Role', 'Kelas', 'Status', 'Aksi']}>
          {users.length === 0 && <EmptyRow colSpan={6} />}
          {users.map((u) => (
            <tr key={u.username}>
              <td className="px-3 py-2 font-mono">{u.username}</td>
              <td className="px-3 py-2">{u.nama}</td>
              <td className="px-3 py-2">{u.role === 'admin' ? 'Admin' : 'Wali Kelas'}</td>
              <td className="px-3 py-2">{u.kelas || '-'}</td>
              <td className="px-3 py-2">
                <button onClick={() => toggleActive(u)}>
                  <Badge status={u.aktif ? 'Aktif' : 'Nonaktif'} />
                </button>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <button className="text-teal-700 text-xs font-semibold mr-3" onClick={() => openEdit(u)}>
                  Edit
                </button>
                <button className="text-red-600 text-xs font-semibold" onClick={() => remove(u.username)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {modalOpen && (
        <Modal title={isEdit ? 'Edit Akun' : 'Tambah Akun'} onClose={() => setModalOpen(false)}>
          <Field label="Username">
            <input
              className={inputCls}
              disabled={isEdit}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label={`Password ${isEdit ? '(kosongkan jika tidak diubah)' : ''}`}>
            <input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Nama Lengkap">
            <input className={inputCls} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          </Field>
          <Field label="Role">
            <select
              className={inputCls}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'wali_kelas' })}
            >
              <option value="admin">Admin</option>
              <option value="wali_kelas">Wali Kelas</option>
            </select>
          </Field>
          {form.role === 'wali_kelas' && (
            <Field label="Kelas Diampu">
              <select className={inputCls} value={form.kelas} onChange={(e) => setForm({ ...form, kelas: e.target.value })}>
                {CLASS_LIST.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </Field>
          )}
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
