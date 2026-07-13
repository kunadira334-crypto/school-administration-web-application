import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const settings = db.getSettings();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(username, password);
    if (!res.success) setError(res.message || 'Gagal login');
    setSubmitting(false);
  }

  function quickFill(u: string, p: string) {
    setUsername(u);
    setPassword(p);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #164e63 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 md:p-10">
        <div className="flex justify-center mb-4">
          {settings.logoSekolahUrl ? (
            <img src={settings.logoSekolahUrl} alt="Logo sekolah" className="h-16 w-16 object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-teal-700 flex items-center justify-center text-white text-2xl font-bold">MI</div>
          )}
        </div>
        <h1 className="text-lg font-bold text-center text-teal-800">SIM {settings.namaMadrasah || 'MI Mambaul Ulum Sumberduren'}</h1>
        <p className="text-center text-xs text-gray-500 mt-1 mb-6">{settings.namaYayasan || 'Sistem Administrasi Sekolah'}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Username</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="mis. admin" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold rounded-lg py-2.5 text-sm transition">
            {submitting ? 'Menghubungkan ke Spreadsheet…' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">Akun awal:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={() => quickFill('admin', 'admin123')} className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100">Admin</button>
            <button type="button" onClick={() => quickFill('wali1', 'wali123')} className="text-xs bg-teal-50 text-teal-700 px-3 py-1 rounded-full hover:bg-teal-100">Wali Kelas 1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
