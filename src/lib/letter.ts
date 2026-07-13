import { Settings } from '../types';

export interface LetterPayload {
  namaSiswa: string;
  nis: string;
  kelas: string;
  tanggalIzin: string;
  alasan: string;
  nomorSurat?: string;
  templateIsi: string;
  templateJudul: string;
}

export function mergeTemplate(isi: string, payload: LetterPayload, settings: Settings) {
  return isi
    .replace(/{{namaYayasan}}/g, settings.namaYayasan || '')
    .replace(/{{namaMadrasah}}/g, settings.namaMadrasah || '')
    .replace(/{{alamat}}/g, settings.alamat || '')
    .replace(/{{namaSiswa}}/g, payload.namaSiswa || '')
    .replace(/{{kelas}}/g, payload.kelas || '')
    .replace(/{{nis}}/g, payload.nis || '')
    .replace(/{{tanggalIzin}}/g, formatTanggal(payload.tanggalIzin))
    .replace(/{{alasan}}/g, payload.alasan || '')
    .replace(/\n/g, '<br/>');
}

export function formatTanggal(iso: string) {
  if (!iso) return '-';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function buildLetterHtml(payload: LetterPayload, settings: Settings, nomorSurat: string) {
  const isi = mergeTemplate(payload.templateIsi, payload, settings);
  const tanggalDibuat = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const logo = settings.logoSuratUrl || settings.logoSekolahUrl || '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${payload.templateJudul}</title>
  <style>
    body{font-family:'Times New Roman',serif;padding:40px;color:#111;}
    .kop{display:flex;align-items:center;border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:20px;}
    .kop img{height:80px;margin-right:15px;}
    .kop h1{margin:0;font-size:20px;text-transform:uppercase;}
    .kop h2{margin:0;font-size:16px;text-transform:uppercase;}
    .kop p{margin:0;font-size:12px;}
    .judul{text-align:center;margin:20px 0;}
    .judul h3{text-decoration:underline;margin:0;}
    .isi{margin-top:20px;line-height:1.8;text-align:justify;}
    .ttd{margin-top:60px;display:flex;justify-content:flex-end;}
    .ttd .kotak{text-align:center;}
    .ttd .spasi{height:70px;}
    @media print{ .no-print{display:none;} }
  </style></head><body>
  <div class="kop">
    ${logo ? `<img src="${logo}"/>` : ''}
    <div>
      <h1>${settings.namaYayasan || ''}</h1>
      <h2>${settings.namaMadrasah || ''}</h2>
      <p>${settings.alamat || ''}</p>
      <p>Telp: ${settings.telepon || '-'} | Email: ${settings.email || '-'}</p>
    </div>
  </div>
  <div class="judul"><h3>${payload.templateJudul}</h3><p>Nomor: ${nomorSurat}</p></div>
  <div class="isi">${isi}</div>
  <div class="ttd"><div class="kotak">
    <p>Sumberduren, ${tanggalDibuat}</p>
    <p>Kepala Madrasah</p>
    <div class="spasi"></div>
    <p><strong><u>${settings.namaKepalaSekolah || ''}</u></strong></p>
    <p>NIP. ${settings.nipKepalaSekolah || '-'}</p>
  </div></div>
  <div class="no-print" style="margin-top:30px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 22px;background:#0f766e;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">Cetak / Simpan PDF</button>
  </div>
  </body></html>`;
}
