/*******************************************************************************
 * SISTEM ADMINISTRASI SEKOLAH
 * Yayasan Mambaul Ulum - MI Mambaul Ulum Sumberduren
 * Backend: Google Apps Script + Google Spreadsheet (database) + Google Drive (storage)
 *
 * CARA PASANG:
 * 1. Buat Google Spreadsheet baru, beri nama misalnya "DB_MI_MambaulUlum".
 * 2. Buka Extensions > Apps Script.
 * 3. Buat file Code.js (script) lalu tempel seluruh isi file ini.
 * 4. Buat file HTML: Index, Stylesheet, JavaScriptClient, Login, AdminDashboard,
 *    TeacherDashboard, Settings, PrintLetter (isi masing-masing sesuai file
 *    terpisah pada folder ini).
 * 5. Jalankan fungsi setupSpreadsheet() sekali dari editor Apps Script untuk
 *    membuat semua sheet + header + akun & data contoh.
 * 6. Deploy > New deployment > Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone (atau sesuai kebutuhan sekolah)
 * 7. Salin URL Web App, ini yang dibagikan ke Admin & Wali Kelas.
 ******************************************************************************/

// ============================= KONFIGURASI ================================
var CONFIG = {
  // Kosongkan untuk memakai spreadsheet aktif (Container-bound script).
  // Jika script berdiri sendiri (standalone), isi dengan ID Spreadsheet.
  SPREADSHEET_ID: '',
  // ID folder Google Drive utama tempat menyimpan logo & arsip surat.
  // Kosongkan agar dibuat otomatis pada saat setupSpreadsheet().
  DRIVE_ROOT_FOLDER_ID: '',
  SESSION_DURATION_SECONDS: 6 * 60 * 60, // 6 jam
  APP_NAME: 'SIM MI Mambaul Ulum Sumberduren'
};

var CLASS_LIST = ['1', '2', '3', '4', '5', '6A', '6B'];

var SHEET_NAMES = {
  USERS: 'Users',
  SETTINGS: 'Settings',
  TEMPLATE_SURAT: 'Template Surat',
  KEHADIRAN: 'Kehadiran',
  LOG: 'Log Aktivitas'
};

function classSheetName(kelas) {
  return 'Kelas ' + kelas;
}

// ============================= UTIL SPREADSHEET ============================
function getSS() {
  return CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, headers) {
  var ss = getSS();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (headers && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    obj._row = i + 1; // nomor baris asli di sheet (untuk update/hapus)
    result.push(obj);
  }
  return result;
}

function appendObject(sheet, headers, obj) {
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateRowByColumn(sheet, headers, matchColumn, matchValue, newObj) {
  var data = sheet.getDataRange().getValues();
  var colIndex = headers.indexOf(matchColumn);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(matchValue)) {
      var row = headers.map(function (h) {
        return newObj[h] !== undefined ? newObj[h] : data[i][headers.indexOf(h)];
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return true;
    }
  }
  return false;
}

function deleteRowByColumn(sheet, headers, matchColumn, matchValue) {
  var data = sheet.getDataRange().getValues();
  var colIndex = headers.indexOf(matchColumn);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(matchValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function generateId(prefix) {
  return prefix + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
}

// ============================= WEB APP ENTRY ================================
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  template.appName = CONFIG.APP_NAME;
  return template
    .evaluate()
    .setTitle(CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================= SETUP AWAL ================================
/**
 * Jalankan fungsi ini SATU KALI secara manual dari editor Apps Script
 * untuk membuat seluruh sheet, header kolom, folder Drive, akun default,
 * dan data contoh.
 */
function setupSpreadsheet() {
  // 1. Folder Drive
  var root = getOrCreateDriveFolder(CONFIG.DRIVE_ROOT_FOLDER_ID, 'SIM_MI_MambaulUlum_Files');
  var logoFolder = getOrCreateSubFolder(root, 'Logo');
  var suratFolder = getOrCreateSubFolder(root, 'Arsip Surat');
  PropertiesService.getScriptProperties().setProperty('ROOT_FOLDER_ID', root.getId());
  PropertiesService.getScriptProperties().setProperty('LOGO_FOLDER_ID', logoFolder.getId());
  PropertiesService.getScriptProperties().setProperty('SURAT_FOLDER_ID', suratFolder.getId());

  // 2. Sheet Users
  var usersSheet = getOrCreateSheet(SHEET_NAMES.USERS, [
    'username', 'password', 'role', 'nama', 'kelas', 'aktif', 'createdAt'
  ]);
  if (sheetToObjects(usersSheet).length === 0) {
    appendObject(usersSheet, getHeaders(usersSheet), {
      username: 'admin', password: hashPassword('admin123'), role: 'admin',
      nama: 'Administrator', kelas: '', aktif: true, createdAt: new Date()
    });
    CLASS_LIST.forEach(function (kls, idx) {
      appendObject(usersSheet, getHeaders(usersSheet), {
        username: 'wali' + kls.toLowerCase(),
        password: hashPassword('wali123'),
        role: 'wali_kelas',
        nama: 'Wali Kelas ' + kls,
        kelas: kls,
        aktif: true,
        createdAt: new Date()
      });
    });
  }

  // 3. Sheet Settings (key-value)
  var settingsSheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, ['key', 'value']);
  if (sheetToObjects(settingsSheet).length === 0) {
    var defaults = {
      namaYayasan: 'YAYASAN MAMBAUL ULUM',
      namaMadrasah: 'MI MAMBAUL ULUM SUMBERDUREN',
      alamat: 'Jl. Pendidikan No. 1, Sumberduren, Kec. ..., Kab. ..., Jawa Timur',
      telepon: '08xxxxxxxxxx',
      email: 'mi.mambaululum.sumberduren@gmail.com',
      npsn: '-',
      logoSekolahUrl: '',
      logoSuratUrl: '',
      namaKepalaSekolah: 'Kepala Madrasah',
      nipKepalaSekolah: '-',
      nomorSuratPrefix: 'MI.MU/SD/',
      warnaTema: '#0f766e'
    };
    Object.keys(defaults).forEach(function (k) {
      appendObject(settingsSheet, ['key', 'value'], { key: k, value: defaults[k] });
    });
  }

  // 4. Sheet per kelas (roster siswa)
  CLASS_LIST.forEach(function (kls) {
    var sh = getOrCreateSheet(classSheetName(kls), [
      'id', 'nis', 'nisn', 'nama', 'jenisKelamin', 'kelas', 'namaOrtu', 'noHpOrtu', 'alamat', 'aktif'
    ]);
    if (sheetToObjects(sh).length === 0 && (kls === '1' || kls === '6A')) {
      // contoh 3 siswa untuk kelas 1 dan 6A
      var sampleNames = kls === '1'
        ? [['Ahmad Fauzan', 'L'], ['Siti Aisyah', 'P'], ['Muhammad Rizki', 'L']]
        : [['Nur Kholis', 'L'], ['Fatimatuz Zahro', 'P'], ['Bagas Setiawan', 'L']];
      sampleNames.forEach(function (s, i) {
        appendObject(sh, getHeaders(sh), {
          id: generateId('SIS'),
          nis: '20250' + kls + (i + 1),
          nisn: '00000000' + (i + 1),
          nama: s[0],
          jenisKelamin: s[1],
          kelas: kls,
          namaOrtu: 'Wali dari ' + s[0],
          noHpOrtu: '08123456789' + i,
          alamat: 'Sumberduren',
          aktif: true
        });
      });
    }
  });

  // 5. Sheet Kehadiran
  getOrCreateSheet(SHEET_NAMES.KEHADIRAN, [
    'id', 'tanggal', 'kelas', 'siswaId', 'nama', 'status', 'catatan', 'inputOleh', 'createdAt'
  ]);

  // 6. Sheet Template Surat
  var templateSheet = getOrCreateSheet(SHEET_NAMES.TEMPLATE_SURAT, [
    'id', 'judul', 'isi', 'aktif'
  ]);
  if (sheetToObjects(templateSheet).length === 0) {
    appendObject(templateSheet, getHeaders(templateSheet), {
      id: generateId('TPL'),
      judul: 'Surat Izin Tidak Masuk Sekolah',
      isi: 'Yang bertanda tangan di bawah ini, Kepala {{namaMadrasah}} menerangkan bahwa:\n\n' +
        'Nama\t: {{namaSiswa}}\nKelas\t: {{kelas}}\nNIS\t: {{nis}}\n\n' +
        'Diizinkan tidak mengikuti kegiatan belajar mengajar pada tanggal {{tanggalIzin}} ' +
        'dikarenakan {{alasan}}.\n\n' +
        'Demikian surat izin ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
      aktif: true
    });
  }

  // 7. Sheet Log Aktivitas
  getOrCreateSheet(SHEET_NAMES.LOG, ['timestamp', 'username', 'aksi', 'detail']);

  return 'Setup selesai. Sheet, folder Drive, dan data contoh berhasil dibuat.';
}

function getOrCreateDriveFolder(id, name) {
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* fallback create */ }
  }
  var it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function getOrCreateSubFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

// ============================= AUTH / SESSION ================================
function hashPassword(plain) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain);
  return digest.map(function (b) { return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0'); }).join('');
}

function loginUser(username, password) {
  username = (username || '').trim();
  var sheet = getOrCreateSheet(SHEET_NAMES.USERS, ['username', 'password', 'role', 'nama', 'kelas', 'aktif', 'createdAt']);
  var users = sheetToObjects(sheet);
  var user = users.find(function (u) { return String(u.username).toLowerCase() === username.toLowerCase(); });

  if (!user) {
    logActivity(username, 'LOGIN_GAGAL', 'Username tidak ditemukan');
    return { success: false, message: 'Username atau password salah.' };
  }
  if (user.aktif === false || String(user.aktif).toUpperCase() === 'FALSE') {
    logActivity(username, 'LOGIN_GAGAL', 'Akun nonaktif');
    return { success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' };
  }
  if (user.password !== hashPassword(password)) {
    logActivity(username, 'LOGIN_GAGAL', 'Password salah');
    return { success: false, message: 'Username atau password salah.' };
  }

  var token = Utilities.getUuid();
  var session = { username: user.username, role: user.role, nama: user.nama, kelas: user.kelas };
  CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify(session), CONFIG.SESSION_DURATION_SECONDS);
  logActivity(username, 'LOGIN_BERHASIL', 'Role: ' + user.role);

  return { success: true, token: token, user: session };
}

function logoutUser(token) {
  var session = getSession(token);
  CacheService.getScriptCache().remove('SESSION_' + token);
  if (session) logActivity(session.username, 'LOGOUT', '');
  return { success: true };
}

function getSession(token) {
  if (!token) return null;
  var raw = CacheService.getScriptCache().get('SESSION_' + token);
  return raw ? JSON.parse(raw) : null;
}

/** Melempar error jika token tidak valid / role tidak diizinkan */
function requireAuth(token, allowedRoles) {
  var session = getSession(token);
  if (!session) throw new Error('SESSION_EXPIRED');
  if (allowedRoles && allowedRoles.indexOf(session.role) === -1) {
    throw new Error('AKSES_DITOLAK');
  }
  return session;
}

function logActivity(username, aksi, detail) {
  try {
    var sheet = getOrCreateSheet(SHEET_NAMES.LOG, ['timestamp', 'username', 'aksi', 'detail']);
    sheet.appendRow([new Date(), username, aksi, detail || '']);
  } catch (e) { /* ignore logging error */ }
}

function getActivityLog(token) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.LOG, ['timestamp', 'username', 'aksi', 'detail']);
  var rows = sheetToObjects(sheet).reverse();
  return rows.slice(0, 300);
}

// ============================= SETTINGS ================================
function getSettings(token) {
  requireAuth(token, ['admin', 'wali_kelas']);
  var sheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, ['key', 'value']);
  var rows = sheetToObjects(sheet);
  var obj = {};
  rows.forEach(function (r) { obj[r.key] = r.value; });
  return obj;
}

function saveSettings(token, settingsObj) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.SETTINGS, ['key', 'value']);
  Object.keys(settingsObj).forEach(function (key) {
    var updated = updateRowByColumn(sheet, ['key', 'value'], 'key', key, { key: key, value: settingsObj[key] });
    if (!updated) appendObject(sheet, ['key', 'value'], { key: key, value: settingsObj[key] });
  });
  logActivity(session.username, 'UPDATE_SETTINGS', JSON.stringify(Object.keys(settingsObj)));
  return { success: true };
}

/**
 * Upload logo (sekolah / surat) ke Google Drive.
 * base64Data: string base64 tanpa prefix data:...
 * jenis: 'sekolah' | 'surat'
 */
function uploadLogo(token, base64Data, mimeType, fileName, jenis) {
  var session = requireAuth(token, ['admin']);
  var folderId = PropertiesService.getScriptProperties().getProperty('LOGO_FOLDER_ID');
  var folder = folderId ? DriveApp.getFolderById(folderId) : getOrCreateDriveFolder('', 'SIM_MI_MambaulUlum_Files');
  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var url = 'https://drive.google.com/uc?export=view&id=' + file.getId();

  var key = jenis === 'surat' ? 'logoSuratUrl' : 'logoSekolahUrl';
  saveSettings(token, (function () { var o = {}; o[key] = url; return o; })());

  logActivity(session.username, 'UPLOAD_LOGO', jenis + ' -> ' + url);
  return { success: true, url: url };
}

// ============================= KELAS ================================
function getClasses(token) {
  requireAuth(token, ['admin', 'wali_kelas']);
  return CLASS_LIST;
}

// ============================= SISWA ================================
var STUDENT_HEADERS = ['id', 'nis', 'nisn', 'nama', 'jenisKelamin', 'kelas', 'namaOrtu', 'noHpOrtu', 'alamat', 'aktif'];

function resolveClassForRole(session, requestedKelas) {
  if (session.role === 'wali_kelas') return session.kelas; // wali dipaksa ke kelasnya sendiri
  return requestedKelas;
}

function getStudents(token, kelas) {
  var session = requireAuth(token, ['admin', 'wali_kelas']);
  var targetKelas = resolveClassForRole(session, kelas);
  if (!targetKelas) {
    // admin minta semua kelas
    var all = [];
    CLASS_LIST.forEach(function (k) {
      var sh = getOrCreateSheet(classSheetName(k), STUDENT_HEADERS);
      all = all.concat(sheetToObjects(sh));
    });
    return all;
  }
  var sheet = getOrCreateSheet(classSheetName(targetKelas), STUDENT_HEADERS);
  return sheetToObjects(sheet);
}

function addStudent(token, student) {
  var session = requireAuth(token, ['admin']);
  if (CLASS_LIST.indexOf(String(student.kelas)) === -1) throw new Error('Kelas tidak valid');
  var sheet = getOrCreateSheet(classSheetName(student.kelas), STUDENT_HEADERS);
  student.id = generateId('SIS');
  student.aktif = true;
  appendObject(sheet, STUDENT_HEADERS, student);
  logActivity(session.username, 'TAMBAH_SISWA', student.nama + ' - Kelas ' + student.kelas);
  return { success: true, data: student };
}

function updateStudent(token, student) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(classSheetName(student.kelas), STUDENT_HEADERS);
  var ok = updateRowByColumn(sheet, STUDENT_HEADERS, 'id', student.id, student);
  logActivity(session.username, 'UPDATE_SISWA', student.nama);
  return { success: ok };
}

function deleteStudent(token, id, kelas) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(classSheetName(kelas), STUDENT_HEADERS);
  var ok = deleteRowByColumn(sheet, STUDENT_HEADERS, 'id', id);
  logActivity(session.username, 'HAPUS_SISWA', id);
  return { success: ok };
}

// ============================= USERS (Admin & Wali Kelas) ================================
var USER_HEADERS = ['username', 'password', 'role', 'nama', 'kelas', 'aktif', 'createdAt'];

function getUsers(token) {
  requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.USERS, USER_HEADERS);
  return sheetToObjects(sheet).map(function (u) { delete u.password; return u; });
}

function addUser(token, user) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.USERS, USER_HEADERS);
  var existing = sheetToObjects(sheet).find(function (u) { return u.username === user.username; });
  if (existing) throw new Error('Username sudah digunakan');
  user.password = hashPassword(user.password || '123456');
  user.aktif = true;
  user.createdAt = new Date();
  appendObject(sheet, USER_HEADERS, user);
  logActivity(session.username, 'TAMBAH_USER', user.username + ' (' + user.role + ')');
  return { success: true };
}

function updateUser(token, user) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.USERS, USER_HEADERS);
  if (user.password) {
    user.password = hashPassword(user.password);
  } else {
    delete user.password;
  }
  var data = sheetToObjects(sheet);
  var current = data.find(function (u) { return u.username === user.username; });
  if (!current) throw new Error('User tidak ditemukan');
  var merged = Object.assign({}, current, user);
  var ok = updateRowByColumn(sheet, USER_HEADERS, 'username', user.username, merged);
  logActivity(session.username, 'UPDATE_USER', user.username);
  return { success: ok };
}

function deleteUser(token, username) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.USERS, USER_HEADERS);
  var ok = deleteRowByColumn(sheet, USER_HEADERS, 'username', username);
  logActivity(session.username, 'HAPUS_USER', username);
  return { success: ok };
}

// ============================= KEHADIRAN ================================
var ATTENDANCE_HEADERS = ['id', 'tanggal', 'kelas', 'siswaId', 'nama', 'status', 'catatan', 'inputOleh', 'createdAt'];

function saveAttendanceBatch(token, records) {
  var session = requireAuth(token, ['admin', 'wali_kelas']);
  var sheet = getOrCreateSheet(SHEET_NAMES.KEHADIRAN, ATTENDANCE_HEADERS);
  var existing = sheetToObjects(sheet);

  records.forEach(function (rec) {
    if (session.role === 'wali_kelas' && String(rec.kelas) !== String(session.kelas)) {
      throw new Error('AKSES_DITOLAK: Anda hanya bisa mengelola kelas ' + session.kelas);
    }
    // cek duplikat (tanggal + siswaId) -> update, else -> insert
    var dup = existing.find(function (e) { return e.tanggal === rec.tanggal && e.siswaId === rec.siswaId; });
    rec.inputOleh = session.username;
    rec.createdAt = new Date();
    if (dup) {
      rec.id = dup.id;
      updateRowByColumn(sheet, ATTENDANCE_HEADERS, 'id', dup.id, rec);
    } else {
      rec.id = generateId('HDR');
      appendObject(sheet, ATTENDANCE_HEADERS, rec);
    }
  });
  logActivity(session.username, 'INPUT_KEHADIRAN', records.length + ' data, kelas ' + (records[0] ? records[0].kelas : ''));
  return { success: true };
}

function getAttendance(token, filters) {
  var session = requireAuth(token, ['admin', 'wali_kelas']);
  filters = filters || {};
  var sheet = getOrCreateSheet(SHEET_NAMES.KEHADIRAN, ATTENDANCE_HEADERS);
  var rows = sheetToObjects(sheet);

  if (session.role === 'wali_kelas') filters.kelas = session.kelas;

  return rows.filter(function (r) {
    if (filters.kelas && String(r.kelas) !== String(filters.kelas)) return false;
    if (filters.tanggal && String(r.tanggal) !== String(filters.tanggal)) return false;
    if (filters.tanggalMulai && String(r.tanggal) < filters.tanggalMulai) return false;
    if (filters.tanggalSelesai && String(r.tanggal) > filters.tanggalSelesai) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.siswaId && r.siswaId !== filters.siswaId) return false;
    return true;
  });
}

function getAttendanceRecap(token, filters) {
  var rows = getAttendance(token, filters);
  var recap = {}; // per siswa
  rows.forEach(function (r) {
    if (!recap[r.siswaId]) {
      recap[r.siswaId] = { siswaId: r.siswaId, nama: r.nama, kelas: r.kelas, Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    }
    if (recap[r.siswaId][r.status] !== undefined) recap[r.siswaId][r.status]++;
  });
  return Object.values(recap);
}

// ============================= TEMPLATE SURAT ================================
var TEMPLATE_HEADERS = ['id', 'judul', 'isi', 'aktif'];

function getLetterTemplates(token) {
  requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.TEMPLATE_SURAT, TEMPLATE_HEADERS);
  return sheetToObjects(sheet);
}

function saveLetterTemplate(token, tpl) {
  var session = requireAuth(token, ['admin']);
  var sheet = getOrCreateSheet(SHEET_NAMES.TEMPLATE_SURAT, TEMPLATE_HEADERS);
  if (tpl.id) {
    updateRowByColumn(sheet, TEMPLATE_HEADERS, 'id', tpl.id, tpl);
  } else {
    tpl.id = generateId('TPL');
    tpl.aktif = true;
    appendObject(sheet, TEMPLATE_HEADERS, tpl);
  }
  logActivity(session.username, 'SIMPAN_TEMPLATE_SURAT', tpl.judul);
  return { success: true, data: tpl };
}

// ============================= CETAK SURAT IZIN ================================
/**
 * Menghasilkan HTML surat izin yang sudah di-merge dengan data siswa,
 * pengaturan sekolah, dan template terpilih. Juga menyimpan arsip HTML/PDF ke Drive.
 */
function generateLetter(token, payload) {
  var session = requireAuth(token, ['admin']);
  var settings = getSettings(token);
  var templates = getLetterTemplates(token);
  var tpl = templates.find(function (t) { return t.id === payload.templateId; }) || templates[0];
  if (!tpl) throw new Error('Template surat belum tersedia');

  var nomorSurat = payload.nomorSurat ||
    (settings.nomorSuratPrefix + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'MM/yyyy'));

  var isi = tpl.isi
    .replace(/{{namaYayasan}}/g, settings.namaYayasan || '')
    .replace(/{{namaMadrasah}}/g, settings.namaMadrasah || '')
    .replace(/{{alamat}}/g, settings.alamat || '')
    .replace(/{{namaSiswa}}/g, payload.namaSiswa || '')
    .replace(/{{kelas}}/g, payload.kelas || '')
    .replace(/{{nis}}/g, payload.nis || '')
    .replace(/{{tanggalIzin}}/g, payload.tanggalIzin || '')
    .replace(/{{alasan}}/g, payload.alasan || '')
    .replace(/\n/g, '<br/>');

  var html = buildLetterHtml({
    settings: settings,
    nomorSurat: nomorSurat,
    judul: tpl.judul,
    isi: isi,
    tanggalDibuat: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT+7', 'dd MMMM yyyy')
  });

  // Arsipkan sebagai file HTML ke Drive (dan opsional PDF)
  var archiveUrl = '';
  try {
    var folderId = PropertiesService.getScriptProperties().getProperty('SURAT_FOLDER_ID');
    var folder = folderId ? DriveApp.getFolderById(folderId) : getOrCreateDriveFolder('', 'SIM_MI_MambaulUlum_Files');
    var blob = Utilities.newBlob(html, 'text/html', 'Surat_' + payload.namaSiswa + '_' + payload.tanggalIzin + '.html');
    var pdfBlob = HtmlService.createHtmlOutput(html).getBlob().getAs('application/pdf');
    pdfBlob.setName('Surat_' + payload.namaSiswa + '_' + payload.tanggalIzin + '.pdf');
    var file = folder.createFile(pdfBlob);
    archiveUrl = file.getUrl();
  } catch (e) {
    archiveUrl = '';
  }

  logActivity(session.username, 'CETAK_SURAT_IZIN', payload.namaSiswa + ' - ' + payload.tanggalIzin);

  return { success: true, html: html, nomorSurat: nomorSurat, archiveUrl: archiveUrl };
}

function buildLetterHtml(data) {
  var s = data.settings;
  return '' +
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + data.judul + '</title>' +
    '<style>' +
    'body{font-family:"Times New Roman",serif;padding:40px;color:#111;}' +
    '.kop{display:flex;align-items:center;border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:20px;}' +
    '.kop img{height:80px;margin-right:15px;}' +
    '.kop h1{margin:0;font-size:20px;text-transform:uppercase;}' +
    '.kop h2{margin:0;font-size:16px;text-transform:uppercase;}' +
    '.kop p{margin:0;font-size:12px;}' +
    '.judul{text-align:center;margin:20px 0;}' +
    '.judul h3{text-decoration:underline;margin:0;}' +
    'table.info td{padding:2px 8px;vertical-align:top;}' +
    '.isi{margin-top:20px;line-height:1.8;text-align:justify;}' +
    '.ttd{margin-top:60px;display:flex;justify-content:flex-end;}' +
    '.ttd .kotak{text-align:center;}' +
    '.ttd .spasi{height:70px;}' +
    '@media print{ .no-print{display:none;} }' +
    '</style></head><body>' +
    '<div class="kop">' +
    (s.logoSuratUrl ? '<img src="' + s.logoSuratUrl + '"/>' : (s.logoSekolahUrl ? '<img src="' + s.logoSekolahUrl + '"/>' : '')) +
    '<div><h1>' + (s.namaYayasan || '') + '</h1><h2>' + (s.namaMadrasah || '') + '</h2>' +
    '<p>' + (s.alamat || '') + '</p><p>Telp: ' + (s.telepon || '') + ' | Email: ' + (s.email || '') + '</p></div>' +
    '</div>' +
    '<div class="judul"><h3>' + data.judul + '</h3><p>Nomor: ' + data.nomorSurat + '</p></div>' +
    '<div class="isi">' + data.isi + '</div>' +
    '<div class="ttd"><div class="kotak">' +
    '<p>Sumberduren, ' + data.tanggalDibuat + '</p><p>Kepala Madrasah</p>' +
    '<div class="spasi"></div>' +
    '<p><strong><u>' + (s.namaKepalaSekolah || '') + '</u></strong></p>' +
    '<p>NIP. ' + (s.nipKepalaSekolah || '-') + '</p>' +
    '</div></div>' +
    '<div class="no-print" style="margin-top:30px;text-align:center;">' +
    '<button onclick="window.print()">Cetak / Simpan PDF</button></div>' +
    '</body></html>';
}
