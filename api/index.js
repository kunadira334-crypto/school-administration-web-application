import crypto from 'node:crypto';

const CLASS_LIST = ['1', '2', '3', '4', '5', '6A', '6B'];
const ATTENDANCE_HEADERS = ['id', 'tanggal', 'kelas', 'siswaId', 'nama', 'status', 'catatan', 'inputOleh', 'createdAt'];
const SCHEMAS = {
  Users: ['username', 'password', 'role', 'nama', 'kelas', 'aktif', 'createdAt'],
  Settings: ['key', 'value'],
  'Template Surat': ['id', 'judul', 'isi', 'aktif'],
  'Log Aktivitas': ['timestamp', 'username', 'aksi', 'detail'],
  'Arsip Surat': ['id', 'namaSiswa', 'kelas', 'tanggalIzin', 'alasan', 'nomorSurat', 'html', 'createdAt'],
  ...Object.fromEntries(CLASS_LIST.map((k) => [`Kehadiran ${k}`, ATTENDANCE_HEADERS])),
  ...Object.fromEntries(CLASS_LIST.map((k) => [`Kelas ${k}`, ['id', 'nis', 'nisn', 'nama', 'jenisKelamin', 'kelas', 'namaAyah', 'namaIbu', 'noHpOrtu', 'alamat', 'aktif']])),
};

const DEFAULT_SETTINGS = {
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

let accessTokenCache = null;
let setupPromise = null;

function env() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Environment Google belum lengkap. Isi GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, dan GOOGLE_PRIVATE_KEY di Vercel.');
  }
  return { spreadsheetId, clientEmail, privateKey };
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) return accessTokenCache.token;
  const { clientEmail, privateKey } = env();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error_description || 'Gagal memperoleh akses Google API.');
  accessTokenCache = { token: result.access_token, expiresAt: Date.now() + result.expires_in * 1000 };
  return result.access_token;
}

async function googleFetch(url, options = {}) {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof Buffer) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let result = {};
  try { result = text ? JSON.parse(text) : {}; } catch { result = { text }; }
  if (!response.ok) {
    const message = result?.error?.message || result?.text || `Google API error ${response.status}`;
    throw new Error(message);
  }
  return result;
}

function sheetRange(name, range = 'A:Z') {
  return encodeURIComponent(`'${name.replaceAll("'", "''")}'!${range}`);
}

async function getValues(name, range = 'A:Z') {
  const { spreadsheetId } = env();
  const result = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(name, range)}?majorDimension=ROWS`);
  return result.values || [];
}

async function updateValues(name, values, range = 'A1') {
  const { spreadsheetId } = env();
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(name, range)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ range: `'${name}'!${range}`, majorDimension: 'ROWS', values }),
  });
}

async function clearValues(name) {
  const { spreadsheetId } = env();
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(name, 'A:Z')}:clear`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

async function appendValues(name, values) {
  const { spreadsheetId } = env();
  return googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange(name, 'A:Z')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values }),
  });
}

async function ensureSheets() {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    const { spreadsheetId } = env();
    const metadata = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`);
    const existing = new Set((metadata.sheets || []).map((s) => s.properties.title));
    const missing = Object.keys(SCHEMAS).filter((name) => !existing.has(name));
    if (missing.length) {
      await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }),
      });
    }
    await Promise.all(Object.entries(SCHEMAS).map(async ([name, headers]) => {
      const rows = await getValues(name);
      if (!rows.length) {
        await updateValues(name, [headers]);
        return;
      }
      if (name.startsWith('Kelas ') && rows[0].join('|') !== headers.join('|')) {
        const oldHeaders = rows[0];
        const migratedRows = rows.slice(1).filter((row) => row.some((value) => value !== '')).map((row) => {
          const old = Object.fromEntries(oldHeaders.map((key, index) => [key, row[index] ?? '']));
          const student = {
            ...old,
            namaAyah: old.namaAyah || old.namaOrtu || '',
            namaIbu: old.namaIbu || '',
          };
          return headers.map((key) => student[key] ?? '');
        });
        await clearValues(name);
        await updateValues(name, [headers, ...migratedRows]);
      }
    }));
    const users = await getTable('Users');
    if (!users.length) {
      await appendValues('Users', [['admin', sha256('admin123'), 'admin', 'Administrator', '', true, new Date().toISOString()]]);
    }
    const settings = await getTable('Settings');
    if (!settings.length) await appendValues('Settings', Object.entries(DEFAULT_SETTINGS));
    await migrateLegacyAttendance(existing);
  })().catch((error) => {
    setupPromise = null;
    throw error;
  });
  return setupPromise;
}

function columnName(count) {
  let n = count;
  let out = '';
  while (n > 0) {
    n--;
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

function parseValue(key, value) {
  if (['aktif'].includes(key)) return value === true || String(value).toLowerCase() === 'true';
  return value ?? '';
}

async function getTable(name) {
  const headers = SCHEMAS[name];
  const rows = await getValues(name);
  if (rows.length < 2) return [];
  return rows.slice(1).filter((row) => row.some((v) => v !== '')).map((row) =>
    Object.fromEntries(headers.map((key, index) => [key, parseValue(key, row[index])]))
  );
}

async function writeTable(name, objects) {
  const headers = SCHEMAS[name];
  const rows = objects.map((obj) => headers.map((key) => obj[key] ?? ''));
  await clearValues(name);
  await updateValues(name, [headers, ...rows]);
}

async function migrateLegacyAttendance(existingSheets) {
  const settings = await getTable('Settings');
  if (settings.some((item) => item.key === 'attendancePerClassMigrated' && String(item.value) === 'true')) return;

  if (existingSheets.has('Kehadiran')) {
    const rows = await getValues('Kehadiran');
    const headers = rows[0]?.length ? rows[0] : ATTENDANCE_HEADERS;
    const legacyAttendance = rows.slice(1).filter((row) => row.some((value) => value !== '')).map((row) =>
      Object.fromEntries(headers.map((key, index) => [key, parseValue(key, row[index])]))
    );

    await Promise.all(CLASS_LIST.map(async (kelas) => {
      const sheetName = `Kehadiran ${kelas}`;
      const existingClassAttendance = await getTable(sheetName);
      if (!existingClassAttendance.length) {
        await writeTable(sheetName, legacyAttendance.filter((item) => String(item.kelas) === kelas));
      }
    }));
  }

  await appendValues('Settings', [['attendancePerClassMigrated', 'true']]);
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function tokenSecret() {
  return env().privateKey;
}

function createToken(user) {
  const payload = base64url(JSON.stringify({
    username: user.username,
    role: user.role,
    kelas: user.kelas || '',
    nama: user.nama,
    exp: Date.now() + 6 * 60 * 60 * 1000,
  }));
  const signature = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(req) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const [payload, signature] = token.split('.');
  if (!payload || !signature) throw new Error('Sesi tidak ditemukan. Silakan login kembali.');
  const expected = crypto.createHmac('sha256', tokenSecret()).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Sesi tidak valid. Silakan login kembali.');
  }
  const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
  if (session.exp < Date.now()) throw new Error('Sesi telah berakhir. Silakan login kembali.');
  return session;
}

function requireAdmin(session) {
  if (session.role !== 'admin') throw new Error('Akses hanya untuk administrator.');
}

async function getSettings() {
  const rows = await getTable('Settings');
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) };
}

async function getAllStudents() {
  const groups = await Promise.all(CLASS_LIST.map((k) => getTable(`Kelas ${k}`)));
  return groups.flat();
}

async function getAllAttendance() {
  const groups = await Promise.all(CLASS_LIST.map((k) => getTable(`Kehadiran ${k}`)));
  return groups.flat();
}

async function bootstrap(session) {
  const [settings, students, attendance, templates] = await Promise.all([
    getSettings(), getAllStudents(), getAllAttendance(), getTable('Template Surat'),
  ]);
  const isAdmin = session.role === 'admin';
  const scopedStudents = isAdmin ? students : students.filter((s) => s.kelas === session.kelas);
  const scopedAttendance = isAdmin ? attendance : attendance.filter((a) => a.kelas === session.kelas);
  const [users, logs, letters] = isAdmin
    ? await Promise.all([getTable('Users'), getTable('Log Aktivitas'), getTable('Arsip Surat')])
    : [[], [], []];
  return {
    settings,
    students: scopedStudents,
    attendance: scopedAttendance,
    templates,
    users: users.map(({ password, ...user }) => ({ ...user, password: '' })),
    logs: logs.reverse(),
    letters: letters.reverse(),
  };
}

async function replaceResource(session, resource, data) {
  if (!Array.isArray(data) && resource !== 'settings') throw new Error('Format data tidak valid.');
  if (resource === 'students') {
    requireAdmin(session);
    await Promise.all(CLASS_LIST.map((kelas) => writeTable(`Kelas ${kelas}`, data.filter((s) => s.kelas === kelas))));
    return;
  }
  if (resource === 'users') {
    requireAdmin(session);
    const existing = await getTable('Users');
    const oldPasswords = new Map(existing.map((u) => [u.username, u.password]));
    const rows = data.map((u) => ({
      ...u,
      password: u.password ? sha256(u.password) : oldPasswords.get(u.username) || sha256('123456'),
      createdAt: u.createdAt || new Date().toISOString(),
    }));
    await writeTable('Users', rows);
    return;
  }
  if (resource === 'attendance') {
    if (session.role === 'wali_kelas') {
      const allowed = data.filter((a) => a.kelas === session.kelas);
      await writeTable(`Kehadiran ${session.kelas}`, allowed);
    } else {
      await Promise.all(CLASS_LIST.map((kelas) =>
        writeTable(`Kehadiran ${kelas}`, data.filter((a) => a.kelas === kelas))
      ));
    }
    return;
  }
  if (resource === 'templates') {
    requireAdmin(session);
    await writeTable('Template Surat', data);
    return;
  }
  if (resource === 'settings') {
    requireAdmin(session);
    await writeTable('Settings', Object.entries({ ...DEFAULT_SETTINGS, ...data }).map(([key, value]) => ({ key, value })));
    return;
  }
  throw new Error('Resource tidak dikenal.');
}

async function uploadLogo(session, body) {
  requireAdmin(session);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error('Isi GOOGLE_DRIVE_FOLDER_ID di Environment Variables Vercel untuk mengunggah logo.');
  const match = String(body.dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Format gambar tidak valid.');
  const mimeType = match[1];
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 2 * 1024 * 1024) throw new Error('Ukuran logo maksimal 2 MB.');
  const boundary = `school-app-${Date.now()}`;
  const metadata = JSON.stringify({ name: body.fileName || `logo-${Date.now()}`, parents: [folderId] });
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const token = await getAccessToken();
  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  const uploadResult = await uploadResponse.json();
  if (!uploadResponse.ok) throw new Error(uploadResult?.error?.message || 'Upload logo gagal.');
  await googleFetch(`https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions`, {
    method: 'POST',
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  return { url: `https://drive.google.com/uc?export=view&id=${uploadResult.id}` };
}

function send(res, status, payload) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(payload);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'Gunakan metode POST.' });
  try {
    await ensureSheets();
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action;

    if (action === 'publicSettings') return send(res, 200, { ok: true, data: await getSettings() });

    if (action === 'login') {
      const users = await getTable('Users');
      const username = String(body.username || '').trim().toLowerCase();
      const user = users.find((item) => String(item.username).toLowerCase() === username);
      if (!user || !user.aktif || user.password !== sha256(body.password || '')) {
        return send(res, 401, { ok: false, error: 'Username atau password salah.' });
      }
      const safeUser = { username: user.username, password: '', role: user.role, nama: user.nama, kelas: user.kelas || '', aktif: true };
      await appendValues('Log Aktivitas', [[new Date().toISOString(), user.username, 'LOGIN_BERHASIL', `Role: ${user.role}`]]);
      return send(res, 200, { ok: true, data: { token: createToken(user), user: safeUser } });
    }

    const session = verifyToken(req);
    if (action === 'bootstrap') return send(res, 200, { ok: true, data: await bootstrap(session) });
    if (action === 'replace') {
      await replaceResource(session, body.resource, body.data);
      return send(res, 200, { ok: true });
    }
    if (action === 'appendLog') {
      await appendValues('Log Aktivitas', [[new Date().toISOString(), session.username, body.aksi || '', body.detail || '']]);
      return send(res, 200, { ok: true });
    }
    if (action === 'appendLetter') {
      requireAdmin(session);
      const letter = body.data || {};
      await appendValues('Arsip Surat', [SCHEMAS['Arsip Surat'].map((key) => letter[key] ?? '')]);
      return send(res, 200, { ok: true });
    }
    if (action === 'uploadLogo') return send(res, 200, { ok: true, data: await uploadLogo(session, body) });
    return send(res, 400, { ok: false, error: 'Aksi API tidak dikenal.' });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    const status = /sesi|login/i.test(message) ? 401 : 500;
    return send(res, status, { ok: false, error: message });
  }
}
