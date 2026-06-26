'use client';

import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Bell, Sun, Moon, LogOut, RefreshCw } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface TopBarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function TopBar({ user }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSyncing(false);
    toast.success('تم تحديث البريد');
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-[#1e293b] border-b border-slate-700/50 flex-shrink-0">
      {/* Left: greeting */}
      <div className="font-arabic text-slate-400 text-sm hidden md:block">
        مرحبًا، <span className="text-white font-semibold">{user?.name?.split(' ')[0]}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 mr-auto">
        {/* Sync */}
        <button
          onClick={handleSync}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          title={theme === 'dark' ? 'وضع النهار' : 'وضع الليل'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-700 transition-all"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ''}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0] ?? 'A'}
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-12 w-56 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl z-50 p-1">
              <div className="px-3 py-2 border-b border-slate-700 mb-1">
                <p className="text-sm font-semibold text-white font-arabic">{user?.name}</p>
                <p className="text-xs text-slate-400 ltr">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all font-arabic"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
