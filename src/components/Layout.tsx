import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

interface LayoutProps {
  menuItems: MenuItem[];
  activePage: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
}

export default function Layout({ menuItems, activePage, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const settings = db.getSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="text-xl text-gray-600 hover:text-gray-900 md:hidden"
          >
            ☰
          </button>
          {settings.logoSekolahUrl ? (
            <img src={settings.logoSekolahUrl} alt="logo" className="h-9 w-9 object-contain" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
              MI
            </div>
          )}
          <div>
            <p className="font-bold text-teal-800 leading-tight text-sm md:text-base">
              SIM {settings.namaMadrasah || 'MI Mambaul Ulum Sumberduren'}
            </p>
            <p className="text-[11px] text-gray-400 hidden md:block">{settings.namaYayasan}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-700">{user?.nama}</p>
            <p className="text-[11px] text-gray-400">
              {user?.role === 'admin' ? 'Administrator' : `Wali Kelas ${user?.kelas}`}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-xs font-semibold border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`bg-teal-900 text-white min-h-[calc(100vh-64px)] transition-all duration-200 ${
            sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
          } md:w-60 md:block ${sidebarOpen ? 'block' : 'hidden'}`}
        >
          <nav className="py-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-5 py-2.5 text-sm flex items-center gap-2 transition ${
                  activePage === item.id
                    ? 'bg-white/10 border-r-4 border-white font-semibold'
                    : 'text-teal-100 hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
