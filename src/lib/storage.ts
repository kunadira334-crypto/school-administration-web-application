import {
  ActivityLog,
  ArchivedLetter,
  Attendance,
  CLASS_LIST,
  LetterTemplate,
  Settings,
  Student,
  User,
} from '../types';

const KEYS = {
  USERS: 'sim_users',
  STUDENTS: 'sim_students',
  ATTENDANCE: 'sim_attendance',
  TEMPLATES: 'sim_templates',
  SETTINGS: 'sim_settings',
  LOGS: 'sim_logs',
  LETTERS: 'sim_letters',
  SEEDED: 'sim_seeded_v1',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const sampleNamesByClass: Record<string, [string, 'L' | 'P'][]> = {
  '1': [
    ['Ahmad Fauzan', 'L'],
    ['Siti Aisyah', 'P'],
    ['Muhammad Rizki', 'L'],
    ['Nayla Putri', 'P'],
  ],
  '2': [
    ['Dwi Cahyono', 'L'],
    ['Indah Lestari', 'P'],
    ['Rafi Ardiansyah', 'L'],
  ],
  '3': [
    ['Salsabila Zahra', 'P'],
    ['Yusuf Hidayat', 'L'],
    ['Putri Amelia', 'P'],
  ],
  '4': [
    ['Fajar Nugroho', 'L'],
    ['Alya Ramadhani', 'P'],
    ['Bintang Saputra', 'L'],
  ],
  '5': [
    ['Zaskia Aulia', 'P'],
    ['Dimas Prasetyo', 'L'],
    ['Wulan Sari', 'P'],
  ],
  '6A': [
    ['Nur Kholis', 'L'],
    ['Fatimatuz Zahro', 'P'],
    ['Bagas Setiawan', 'L'],
  ],
  '6B': [
    ['Rehan Maulana', 'L'],
    ['Diah Ayu Kusuma', 'P'],
    ['Irfan Maulidan', 'L'],
  ],
};

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function seedIfNeeded() {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  const users: User[] = [
    { username: 'admin', password: 'admin123', role: 'admin', nama: 'Administrator', kelas: '', aktif: true },
  ];
  CLASS_LIST.forEach((k) => {
    users.push({
      username: 'wali' + k.toLowerCase(),
      password: 'wali123',
      role: 'wali_kelas',
      nama: 'Wali Kelas ' + k,
      kelas: k,
      aktif: true,
    });
  });
  write(KEYS.USERS, users);

  const students: Student[] = [];
  CLASS_LIST.forEach((k) => {
    (sampleNamesByClass[k] || []).forEach((s, i) => {
      students.push({
        id: generateId('SIS'),
        nis: `2025${k}0${i + 1}`,
        nisn: `000000${k}${i + 1}`,
        nama: s[0],
        jenisKelamin: s[1],
        kelas: k,
        namaOrtu: 'Wali dari ' + s[0],
        noHpOrtu: '0812345678' + i,
        alamat: 'Sumberduren',
        aktif: true,
      });
    });
  });
  write(KEYS.STUDENTS, students);

  write(KEYS.ATTENDANCE, [] as Attendance[]);

  const templates: LetterTemplate[] = [
    {
      id: generateId('TPL'),
      judul: 'Surat Izin Tidak Masuk Sekolah',
      isi:
        'Yang bertanda tangan di bawah ini, Kepala {{namaMadrasah}} menerangkan bahwa:\n\n' +
        'Nama\t: {{namaSiswa}}\nKelas\t: {{kelas}}\nNIS\t: {{nis}}\n\n' +
        'Diizinkan tidak mengikuti kegiatan belajar mengajar pada tanggal {{tanggalIzin}} dikarenakan {{alasan}}.\n\n' +
        'Demikian surat izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
      aktif: true,
    },
  ];
  write(KEYS.TEMPLATES, templates);

  const settings: Settings = {
    namaYayasan: 'YAYASAN MAMBAUL ULUM',
    namaMadrasah: 'MI MAMBAUL ULUM SUMBERDUREN',
    alamat: 'Jl. Pendidikan No. 1, Sumberduren, Jawa Timur',
    telepon: '08xxxxxxxxxx',
    email: 'mi.mambaululum.sumberduren@gmail.com',
    npsn: '-',
    logoSekolahUrl: '',
    logoSuratUrl: '',
    namaKepalaSekolah: 'H. Abdul Rohman, S.Pd.I',
    nipKepalaSekolah: '-',
    nomorSuratPrefix: 'MI.MU/SD/',
    warnaTema: '#0f766e',
  };
  write(KEYS.SETTINGS, settings);

  write(KEYS.LOGS, [] as ActivityLog[]);
  write(KEYS.LETTERS, [] as ArchivedLetter[]);

  localStorage.setItem(KEYS.SEEDED, '1');
}

seedIfNeeded();

export const db = {
  getUsers: (): User[] => read(KEYS.USERS, []),
  saveUsers: (u: User[]) => write(KEYS.USERS, u),

  getStudents: (): Student[] => read(KEYS.STUDENTS, []),
  saveStudents: (s: Student[]) => write(KEYS.STUDENTS, s),

  getAttendance: (): Attendance[] => read(KEYS.ATTENDANCE, []),
  saveAttendance: (a: Attendance[]) => write(KEYS.ATTENDANCE, a),

  getTemplates: (): LetterTemplate[] => read(KEYS.TEMPLATES, []),
  saveTemplates: (t: LetterTemplate[]) => write(KEYS.TEMPLATES, t),

  getSettings: (): Settings => read(KEYS.SETTINGS, {} as Settings),
  saveSettings: (s: Settings) => write(KEYS.SETTINGS, s),

  getLogs: (): ActivityLog[] => read(KEYS.LOGS, []),
  addLog: (username: string, aksi: string, detail: string) => {
    const logs = read<ActivityLog[]>(KEYS.LOGS, []);
    logs.unshift({ timestamp: new Date().toISOString(), username, aksi, detail });
    write(KEYS.LOGS, logs.slice(0, 300));
  },

  getLetters: (): ArchivedLetter[] => read(KEYS.LETTERS, []),
  addLetter: (l: ArchivedLetter) => {
    const letters = read<ArchivedLetter[]>(KEYS.LETTERS, []);
    letters.unshift(l);
    write(KEYS.LETTERS, letters);
  },

  generateId,
};

export function resetDemoData() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  seedIfNeeded();
}
