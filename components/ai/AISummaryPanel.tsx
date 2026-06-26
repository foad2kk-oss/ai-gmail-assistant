'use client';

import { motion } from 'framer-motion';
import type { AISummary } from '@/types';
import { PRIORITY_CONFIG, CATEGORY_CONFIG, cn } from '@/lib/utils';
import { Brain, RefreshCw, Calendar, CheckSquare, AlertTriangle, Loader2 } from 'lucide-react';

interface AISummaryPanelProps {
  summary: AISummary | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AISummaryPanel({ summary, loading, onRefresh }: AISummaryPanelProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-950/50 to-slate-900/50 border border-blue-500/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-blue-300 font-arabic">ملخص الذكاء الاصطناعي</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
          title="إعادة التلخيص"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400 font-arabic">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            جارٍ تحليل الرسالة...
          </div>
          <div className="h-3 w-3/4 skeleton rounded" />
          <div className="h-3 w-full skeleton rounded" />
          <div className="h-3 w-2/3 skeleton rounded" />
        </div>
      ) : summary ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {/* Arabic Summary */}
          <p className="text-sm text-slate-200 leading-relaxed font-arabic rtl-prose">
            {summary.summaryArabic}
          </p>

          {/* Action Required */}
          {summary.actionRequired && summary.actionRequired !== 'لا يوجد إجراء مطلوب' && (
            <div className="flex items-start gap-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-400 font-arabic mb-0.5">إجراء مطلوب</p>
                <p className="text-xs text-slate-300 font-arabic">{summary.actionRequired}</p>
              </div>
            </div>
          )}

          {/* Detected Tasks */}
          {summary.detectedTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 font-arabic mb-1.5 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                المهام المكتشفة
              </p>
              <ul className="space-y-1">
                {summary.detectedTasks.map((task, i) => (
                  <li key={i} className="text-xs text-slate-300 font-arabic flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Deadlines */}
          {summary.detectedDeadlines.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 font-arabic mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                المواعيد النهائية
              </p>
              <ul className="space-y-1">
                {summary.detectedDeadlines.map((dl, i) => (
                  <li key={i} className="text-xs text-red-300 font-arabic">{dl}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Meeting */}
          {summary.detectedMeeting && (
            <MeetingCard meeting={summary.detectedMeeting} />
          )}
        </motion.div>
      ) : (
        <p className="text-sm text-slate-500 font-arabic">لا يوجد ملخص بعد</p>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: NonNullable<AISummary['detectedMeeting']> }) {
  const handleAddToCalendar = async () => {
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    });
    if (res.ok) {
      const { toast } = await import('react-hot-toast');
      toast.success('تمت إضافة الاجتماع للتقويم');
    }
  };

  return (
    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-purple-400 font-arabic flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          اجتماع مكتشف
        </p>
        <button
          onClick={handleAddToCalendar}
          className="text-xs text-purple-400 hover:text-purple-300 underline font-arabic"
        >
          أضف للتقويم
        </button>
      </div>
      <p className="text-sm text-slate-200 font-arabic font-medium">{meeting.title}</p>
      {(meeting.date || meeting.time) && (
        <p className="text-xs text-slate-400 font-arabic mt-1">
          {meeting.date} {meeting.time}
        </p>
      )}
      {meeting.location && (
        <p className="text-xs text-slate-400 font-arabic">{meeting.location}</p>
      )}
      {meeting.meetingLink && (
        <a
          href={meeting.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 ltr block mt-1 truncate"
        >
          {meeting.meetingLink}
        </a>
      )}
    </div>
  );
}
