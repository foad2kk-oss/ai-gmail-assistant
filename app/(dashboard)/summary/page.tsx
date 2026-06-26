'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Mail, AlertTriangle, Clock, Calendar,
  ChevronRight, Loader2, RefreshCw, TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface DailySummaryData {
  total_emails: number;
  urgent_emails: number;
  pending_replies: number;
  meetings_today: number;
  top_priorities: string[];
  arabic_summary: string;
  date: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
}) => (
  <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-sm text-slate-400 font-arabic">{label}</p>
  </div>
);

export default function SummaryPage() {
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/daily-summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const generateSummary = async () => {
    setGenerating(true);
    try {
      // Fetch recent emails for context
      const emailsRes = await fetch('/api/gmail/messages?folder=INBOX&maxResults=30');
      const emailsData = await emailsRes.json();

      const summariesRes = await Promise.allSettled(
        (emailsData.messages ?? []).slice(0, 10).map((e: any) =>
          fetch('/api/ai/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messageId: e.id,
              subject: e.subject,
              from: e.from,
              emailBody: e.body || e.snippet,
            }),
          }).then((r) => r.json())
        )
      );

      const summaries = summariesRes
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);

      const res = await fetch('/api/ai/daily-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: summaries.map((s) => ({
            subject: s.summary_arabic || '',
            from: '',
            priority: s.priority,
            category: s.category,
          })),
          meetings: summaries.flatMap((s) => (s.detected_meeting ? [s.detected_meeting] : [])),
          pendingReplies: emailsData.messages?.filter((e: any) => !e.isRead).length ?? 0,
        }),
      });

      const data = await res.json();
      setSummary(data);
      toast.success('تم إنشاء الملخص اليومي');
    } catch (e) {
      toast.error('فشل في إنشاء الملخص');
    } finally {
      setGenerating(false);
    }
  };

  const today = format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white font-arabic">ملخص اليوم</h1>
          </div>
          <p className="text-sm text-slate-400 font-arabic">{today}</p>
        </div>
        <button
          onClick={generateSummary}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-arabic transition-all disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {summary ? 'تحديث الملخص' : 'إنشاء الملخص'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : summary ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Mail} label="إجمالي الرسائل" value={summary.total_emails} color="bg-blue-600" />
            <StatCard icon={AlertTriangle} label="رسائل عاجلة" value={summary.urgent_emails} color="bg-red-600" />
            <StatCard icon={Clock} label="ردود معلقة" value={summary.pending_replies} color="bg-orange-600" />
            <StatCard icon={Calendar} label="اجتماعات اليوم" value={summary.meetings_today} color="bg-purple-600" />
          </div>

          {/* Arabic Summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-950/60 to-slate-900/60 border border-blue-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white font-arabic">الملخص التنفيذي</h2>
            </div>
            <p className="text-slate-200 leading-loose font-arabic text-sm rtl-prose whitespace-pre-wrap">
              {summary.arabic_summary}
            </p>
          </motion.div>

          {/* Top Priorities */}
          {summary.top_priorities?.length > 0 && (
            <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
              <h2 className="font-bold text-white font-arabic mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                أهم الأولويات
              </h2>
              <ul className="space-y-2">
                {summary.top_priorities.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-arabic">
                    <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutDashboard className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-arabic mb-4">لم يتم إنشاء ملخص اليوم بعد</p>
          <button
            onClick={generateSummary}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-arabic transition-all"
          >
            إنشاء الملخص الآن
          </button>
        </div>
      )}
    </div>
  );
}
