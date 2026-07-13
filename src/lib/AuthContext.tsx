import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '../types';
import { db } from './storage';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'sim_session_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((username: string, password: string) => {
    const users = db.getUsers();
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) {
      db.addLog(username, 'LOGIN_GAGAL', 'Username tidak ditemukan');
      return { success: false, message: 'Username atau password salah.' };
    }
    if (!found.aktif) {
      db.addLog(username, 'LOGIN_GAGAL', 'Akun nonaktif');
      return { success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi admin.' };
    }
    if (found.password !== password) {
      db.addLog(username, 'LOGIN_GAGAL', 'Password salah');
      return { success: false, message: 'Username atau password salah.' };
    }
    setUser(found);
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    db.addLog(found.username, 'LOGIN_BERHASIL', 'Role: ' + found.role);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (user) db.addLog(user.username, 'LOGOUT', '');
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, [user]);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
