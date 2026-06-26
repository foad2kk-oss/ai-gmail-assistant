'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Inbox, LayoutDashboard, Star, Send, Archive, Search,
  Calendar, Settings, FileText, ScrollText, Wifi, WifiOff,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/', icon: Inbox, label: 'البريد الوارد', badge: null },
  { href: '/summary', icon: LayoutDashboard, label: 'ملخص اليوم', badge: null },
  { href: '/starred', icon: Star, label: 'المميزة بنجمة', badge: null },
  { href: '/sent', icon: Send, label: 'المرسلة', badge: null },
  { href: '/archive', icon: Archive, label: 'الأرشيف', badge: null },
  { href: '/search', icon: Search, label: 'البحث', badge: null },
  { href: '/calendar', icon: Calendar, label: 'التقويم', badge: null },
  { href: '/ai-settings', icon: Settings, label: 'إعدادات الذكاء', badge: null },
  { href: '/prompt-settings', icon: FileText, label: 'إعدادات البرومبت', badge: null },
  { href: '/logs', icon: ScrollText, label: 'السجلات', badge: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-[#1e293b] border-l border-slate-700/50 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Inbox className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm font-arabic">مساعد البريد</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all',
            collapsed && 'mx-auto'
          )}
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-arabic transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-blue-400')} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status footer */}
      <div className={cn(
        'p-3 border-t border-slate-700/50 flex items-center gap-2',
        collapsed && 'justify-center'
      )}>
        {online ? (
          <Wifi className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
        {!collapsed && (
          <span className={cn('text-xs font-arabic', online ? 'text-green-400' : 'text-red-400')}>
            {online ? 'متصل' : 'غير متصل'}
          </span>
        )}
      </div>
    </aside>
  );
}
