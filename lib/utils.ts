import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Priority, EmailCategory } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEmailDate(dateString: string): string {
  try {
    const date = new Date(Number(dateString));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return format(date, 'h:mm a');
    } else if (diffHours < 48) {
      return 'أمس';
    } else if (diffHours < 168) {
      return formatDistanceToNow(date, { locale: ar, addSuffix: true });
    } else {
      return format(date, 'd MMM', { locale: ar });
    }
  } catch {
    return dateString;
  }
}

export function formatFullDate(dateString: string): string {
  try {
    const date = new Date(Number(dateString));
    return format(date, 'EEEE، d MMMM yyyy - h:mm a', { locale: ar });
  } catch {
    return dateString;
  }
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'عاجل', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  high:   { label: 'مرتفع', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  medium: { label: 'متوسط', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  low:    { label: 'منخفض', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
};

export const CATEGORY_CONFIG: Record<EmailCategory, { label: string; icon: string; color: string }> = {
  projects:    { label: 'المشاريع', icon: '📁', color: 'text-blue-400' },
  clients:     { label: 'العملاء', icon: '👤', color: 'text-purple-400' },
  engineering: { label: 'الهندسة', icon: '⚙️', color: 'text-cyan-400' },
  invoices:    { label: 'الفواتير', icon: '💰', color: 'text-green-400' },
  meetings:    { label: 'الاجتماعات', icon: '📅', color: 'text-yellow-400' },
  contracts:   { label: 'العقود', icon: '📄', color: 'text-orange-400' },
  hr:          { label: 'الموارد البشرية', icon: '👥', color: 'text-pink-400' },
  personal:    { label: 'شخصي', icon: '🏠', color: 'text-indigo-400' },
  marketing:   { label: 'التسويق', icon: '📢', color: 'text-rose-400' },
  spam:        { label: 'بريد مزعج', icon: '🚫', color: 'text-gray-400' },
  other:       { label: 'أخرى', icon: '📌', color: 'text-slate-400' },
};

export function extractEmailAddress(from: string): string {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
}

export function extractDisplayName(from: string): string {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim().replace(/"/g, '') : from;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function decodeBase64(encoded: string): string {
  try {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch {
    return '';
  }
}
