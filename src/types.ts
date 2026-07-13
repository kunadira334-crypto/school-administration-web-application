export type Role = 'admin' | 'wali_kelas';

export interface User {
  username: string;
  password: string;
  role: Role;
  nama: string;
  kelas: string; // kosong untuk admin
  aktif: boolean;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  kelas: string;
  namaOrtu: string;
  noHpOrtu: string;
  alamat: string;
  aktif: boolean;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface Attendance {
  id: string;
  tanggal: string; // yyyy-mm-dd
  kelas: string;
  siswaId: string;
  nama: string;
  status: AttendanceStatus;
  catatan: string;
  inputOleh: string;
  createdAt: string;
}

export interface LetterTemplate {
  id: string;
  judul: string;
  isi: string;
  aktif: boolean;
}

export interface Settings {
  namaYayasan: string;
  namaMadrasah: string;
  alamat: string;
  telepon: string;
  email: string;
  npsn: string;
  logoSekolahUrl: string;
  logoSuratUrl: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  nomorSuratPrefix: string;
  warnaTema: string;
}

export interface ActivityLog {
  timestamp: string;
  username: string;
  aksi: string;
  detail: string;
}

export interface ArchivedLetter {
  id: string;
  namaSiswa: string;
  kelas: string;
  tanggalIzin: string;
  alasan: string;
  nomorSurat: string;
  html: string;
  createdAt: string;
}

export const CLASS_LIST = ['1', '2', '3', '4', '5', '6A', '6B'];
