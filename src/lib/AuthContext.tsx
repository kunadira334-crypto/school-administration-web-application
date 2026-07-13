import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { db } from './storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = 'sim_session_user';

function storedUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(storedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        const current = storedUser();
        const currentToken = db.getToken();
        if (current && currentToken) {
          await db.initialize(currentToken);
          if (active) setUser(current);
        } else {
          await db.loadPublicSettings();
          if (active) setUser(null);
        }
      } catch {
        db.setToken('');
        localStorage.removeItem(SESSION_KEY);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await db.login(username, password);
      db.setToken(result.token);
      await db.initialize(result.token);
      setUser(result.user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Gagal login.' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    db.setToken('');
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
