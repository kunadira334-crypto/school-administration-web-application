import { useState } from 'react';
import { db } from '../../lib/storage';
import { LetterTemplate } from '../../types';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../lib/ToastContext';
import { Btn, Card, Field, inputCls, PageTitle } from '../../components/ui';

export default function TemplateSurat() {
  const { user } = useAuth();
  const { notify } = useToast();
  const templates = db.getTemplates();
  const [tpl, setTpl] = useState<LetterTemplate>(
    templates[0] || { id: '', judul: '', isi: '', aktif: true }
  );

  function save() {
    const list = db.getTemplates();
    let updated: LetterTemplate[];
    if (tpl.id) {
      updated = list.map((t) => (t.id === tpl.id ? tpl : t));
    } else {
      const newTpl = { ...tpl, id: db.generateId('TPL') };
      updated = [...list, newTpl];
      setTpl(newTpl);
    }
    db.saveTemplates(updated);
    db.addLog(user!.username, 'SIMPAN_TEMPLATE_SURAT', tpl.judul);
    notify('Template disimpan');
  }

  return (
    <div>
      <PageTitle
        title="Template Surat Izin"
        subtitle="Gunakan placeholder: {{namaYayasan}}, {{namaMadrasah}}, {{alamat}}, {{namaSiswa}}, {{kelas}}, {{nis}}, {{tanggalIzin}}, {{alasan}}"
      />
      <Card>
        <Field label="Judul Surat">
          <input className={inputCls} value={tpl.judul} onChange={(e) => setTpl({ ...tpl, judul: e.target.value })} />
        </Field>
        <Field label="Isi Surat">
          <textarea
            className={inputCls}
            rows={12}
            value={tpl.isi}
            onChange={(e) => setTpl({ ...tpl, isi: e.target.value })}
          />
        </Field>
        <Btn onClick={save}>Simpan Template</Btn>
      </Card>
    </div>
  );
}
