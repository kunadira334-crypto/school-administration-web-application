import {
  ActivityLog,
  ArchivedLetter,
  Attendance,
  LetterTemplate,
  Settings,
  Student,
  User,
} from '../types';

const DEFAULT_SETTINGS: Settings = {
  namaYayasan: 'YAYASAN MAMBAUL ULUM',
  namaMadrasah: 'MI MAMBAUL ULUM SUMBERDUREN',
  alamat: 'Sumberduren, Jawa Timur',
  telepon: '',
  email: '',
  npsn: '-',
  logoSekolahUrl: '',
  logoSuratUrl: '',
  namaKepalaSekolah: 'Kepala Madrasah',
  nipKepalaSekolah: '-',
  nomorSuratPrefix: 'MI.MU/SD/',
  warnaTema: '#0f766e',
};

type Snapshot = {
  users: User[];
  students: Student[];
  attendance: Attendance[];
  templates: LetterTemplate[];
  settings: Settings;
  logs: ActivityLog[];
  letters: ArchivedLetter[];
};

let token = localStorage.getItem('sim_api_token') || '';
let cache: Snapshot = {
  users: [], students: [], attendance: [], templates: [],
  settings: DEFAULT_SETTINGS, logs: [], letters: [],
};

const queues: Record<string, Promise<unknown>> = {};

function reportError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Gagal menyimpan data ke server.';
  console.error(error);
  window.dispatchEvent(new CustomEvent('school-api-error', { detail: message }));
}

async function apiCall<T>(payload: Record<string, unknown>, authenticated = true): Promise<T> {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({ ok: false, error: 'Respons server tidak valid.' }));
  if (!response.ok || !result.ok) {
    if (response.status === 401 && authenticated) {
      localStorage.removeItem('sim_api_token');
      localStorage.removeItem('sim_session_user');
    }
    throw new Error(result.error || `Server error ${response.status}`);
  }
  return result.data as T;
}

function queueSync(resource: string, data: unknown): Promise<void> {
  const previous = queues[resource] || Promise.resolve();
  const next = previous.catch(() => undefined).then(() => apiCall<void>({ action: 'replace', resource, data }));
  queues[resource] = next;
  next.catch(reportError);
  return next;
}

export const db = {
  setToken(value: string) {
    token = value;
    if (value) localStorage.setItem('sim_api_token', value);
    else localStorage.removeItem('sim_api_token');
  },

  getToken: () => token,

  async loadPublicSettings() {
    try {
      cache.settings = await apiCall<Settings>({ action: 'publicSettings' }, false);
    } catch (error) {
      reportError(error);
    }
  },

  async login(username: string, password: string) {
    return apiCall<{ token: string; user: User }>({ action: 'login', username, password }, false);
  },

  async initialize(value?: string) {
    if (value) db.setToken(value);
    const snapshot = await apiCall<Snapshot>({ action: 'bootstrap' });
    cache = { ...snapshot, settings: { ...DEFAULT_SETTINGS, ...snapshot.settings } };
  },

  getUsers: () => cache.users,
  saveUsers(users: User[]) {
    cache.users = users;
    return queueSync('users', users);
  },

  getStudents: () => cache.students,
  saveStudents(students: Student[]) {
    cache.students = students;
    return queueSync('students', students);
  },

  getAttendance: () => cache.attendance,
  saveAttendance(attendance: Attendance[]) {
    cache.attendance = attendance;
    return queueSync('attendance', attendance);
  },

  getTemplates: () => cache.templates,
  saveTemplates(templates: LetterTemplate[]) {
    cache.templates = templates;
    return queueSync('templates', templates);
  },

  getSettings: () => cache.settings,
  saveSettings(settings: Settings) {
    cache.settings = settings;
    return queueSync('settings', settings);
  },

  getLogs: () => cache.logs,
  addLog(username: string, aksi: string, detail: string) {
    const item = { timestamp: new Date().toISOString(), username, aksi, detail };
    cache.logs = [item, ...cache.logs].slice(0, 500);
    apiCall<void>({ action: 'appendLog', aksi, detail }).catch(reportError);
  },

  getLetters: () => cache.letters,
  addLetter(letter: ArchivedLetter) {
    cache.letters = [letter, ...cache.letters];
    apiCall<void>({ action: 'appendLetter', data: letter }).catch(reportError);
  },

  async uploadLogo(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Gagal membaca file logo.'));
      reader.readAsDataURL(file);
    });
    return apiCall<{ url: string }>({ action: 'uploadLogo', dataUrl, fileName: file.name });
  },

  generateId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  },
};
