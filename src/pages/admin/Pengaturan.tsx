import { useRef, useState } from 'react';
import { db } from '../../lib/storage';
import { Settings } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { Btn, Card, Field, inputCls, PageTitle } from '../../components/ui';

export default function Pengaturan() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [settings, setSettings] = useState<Settings>(db.getSettings());
  const logoSekolahRef = useRef<HTMLInputElement>(null);
  const logoSuratRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(ref: React.RefObject<HTMLInputElement | null>, key: 'logoSekolahUrl' | 'logoSuratUrl') {
    const file = ref.current?.files?.[0];
    if (!file) {
      notify('Pilih file terlebih dahulu', 'err');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const updated = { ...settings, [key]: url };
      setSettings(updated);
      db.saveSettings(updated);
      db.addLog(user!.username, 'UPLOAD_LOGO', key);
      notify('Logo berhasil diunggah');
    };
    reader.readAsDataURL(file);
  }

  function saveAll() {
    db.saveSettings(settings);
    db.addLog(user!.username, 'UPDATE_SETTINGS', 'Profil sekolah & surat');
    notify('Pengaturan disimpan');
  }

  const set = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings({ ...settings, [key]: e.target.value });

  return (
    <div>
      <PageTitle title="Pengaturan Aplikasi & Surat" subtitle="Kelola profil sekolah, logo, dan elemen surat resmi" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="font-bold text-gray-700 mb-2">Logo Aplikasi (Sekolah)</h3>
          <div className="h-20 border border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2 bg-gray-50">
            {settings.logoSekolahUrl ? (
              <img src={settings.logoSekolahUrl} className="h-16 object-contain" />
            ) : (
              <span className="text-xs text-gray-400">Belum ada logo</span>
            )}
          </div>
          <input type="file" accept="image/*" ref={logoSekolahRef} className="text-xs" />
          <div className="mt-2">
            <Btn onClick={() => handleLogoUpload(logoSekolahRef, 'logoSekolahUrl')}>Unggah &amp; Simpan</Btn>
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-gray-700 mb-2">Logo Kop Surat</h3>
          <div className="h-20 border border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2 bg-gray-50">
            {settings.logoSuratUrl ? (
              <img src={settings.logoSuratUrl} className="h-16 object-contain" />
            ) : (
              <span className="text-xs text-gray-400">Belum ada logo</span>
            )}
          </div>
          <input type="file" accept="image/*" ref={logoSuratRef} className="text-xs" />
          <div className="mt-2">
            <Btn onClick={() => handleLogoUpload(logoSuratRef, 'logoSuratUrl')}>Unggah &amp; Simpan</Btn>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-gray-700 mb-3">Profil Yayasan &amp; Madrasah</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Nama Yayasan">
            <input className={inputCls} value={settings.namaYayasan} onChange={set('namaYayasan')} />
          </Field>
          <Field label="Nama Madrasah">
            <input className={inputCls} value={settings.namaMadrasah} onChange={set('namaMadrasah')} />
          </Field>
          <Field label="Alamat">
            <input className={inputCls} value={settings.alamat} onChange={set('alamat')} />
          </Field>
          <Field label="Telepon">
            <input className={inputCls} value={settings.telepon} onChange={set('telepon')} />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={settings.email} onChange={set('email')} />
          </Field>
          <Field label="NPSN">
            <input className={inputCls} value={settings.npsn} onChange={set('npsn')} />
          </Field>
          <Field label="Nama Kepala Madrasah">
            <input className={inputCls} value={settings.namaKepalaSekolah} onChange={set('namaKepalaSekolah')} />
          </Field>
          <Field label="NIP Kepala Madrasah">
            <input className={inputCls} value={settings.nipKepalaSekolah} onChange={set('nipKepalaSekolah')} />
          </Field>
          <Field label="Prefix Nomor Surat">
            <input className={inputCls} value={settings.nomorSuratPrefix} onChange={set('nomorSuratPrefix')} />
          </Field>
          <Field label="Warna Tema (hex)">
            <input className={inputCls} value={settings.warnaTema} onChange={set('warnaTema')} />
          </Field>
        </div>
        <Btn onClick={saveAll}>Simpan Pengaturan</Btn>
      </Card>
    </div>
  );
}
