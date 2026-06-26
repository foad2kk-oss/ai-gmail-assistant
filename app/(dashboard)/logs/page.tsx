'use client';

import { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Trash2, CheckCircle2, XCircle, Info, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface LogEntry {
  id: string;
  action: string;
  details: string;
  status: 'success' | 'error' | 'info';
  created_at: string;
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'نجاح' },
  error:   { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'خطأ' },
  info:    { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'معلومة' },
};

const ACTION_LABELS: Record<string, string> = {
  fetch_messages: 'جلب الرسائل',
  summarize_email: 'تلخيص البريد',
  reply_generate: 'توليد رد',
  reply_improve: 'تحسين رد',
  reply_shorten: 'اختصار رد',
  reply_expand: 'توسيع رد',
  translate: 'ترجمة',
  send_email: 'إرسال بريد',
  save_draft: 'حفظ مسودة',
  email_star: 'تمييز بنجمة',
  email_archive: 'أرشفة',
  email_markRead: 'تمييز كمقروء',
  generate_daily_summary: 'ملخص يومي',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?limit=100');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClear = async () => {
    if (!confirm('هل أنت متأكد من حذف جميع السجلات؟')) return;
    await fetch('/api/logs', { method: 'DELETE' });
    setLogs([]);
    toast.success('تم حذف السجلات');
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.status === filter);

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === 'success').length,
    error: logs.filter((l) => l.status === 'error').length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white font-arabic">سجلات النظام</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm font-arabic transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              مسح السجلات
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'إجمالي', value: stats.total, color: 'text-slate-300' },
          { label: 'نجاح', value: stats.success, color: 'text-green-400' },
          { label: 'أخطاء', value: stats.error, color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 font-arabic">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        <Filter className="w-4 h-4 text-slate-400" />
        {['all', 'success', 'error', 'info'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-arabic transition-all border',
              filter === f
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
            )}
          >
            {f === 'all' ? 'الكل' : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label}
          </button>
        ))}
      </div>

      {/* Log list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ScrollText className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-400 font-arabic">لا توجد سجلات</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((log, i) => {
            const cfg = STATUS_CONFIG[log.status];
            const Icon = cfg.icon;
            const actionLabel = ACTION_LABELS[log.action] ?? log.action;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.01 }}
                className="flex items-start gap-3 p-3.5 bg-[#1e293b] border border-slate-700/50 rounded-xl"
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                  <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-slate-200 font-arabic">{actionLabel}</span>
                    <span className="text-xs text-slate-500 ltr flex-shrink-0 mr-2">
                      {format(new Date(log.created_at), 'dd/MM HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 ltr truncate">{log.details}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
