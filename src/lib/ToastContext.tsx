import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface Toast { id: number; message: string; type: 'ok' | 'err'; }
interface ToastContextValue { notify: (message: string, type?: 'ok' | 'err') => void; }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, type: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const listener = (event: Event) => notify((event as CustomEvent<string>).detail || 'Gagal menghubungi server.', 'err');
    window.addEventListener('school-api-error', listener);
    return () => window.removeEventListener('school-api-error', listener);
  }, [notify]);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
