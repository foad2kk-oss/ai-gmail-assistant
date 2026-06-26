'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GmailMessage, AISummary } from '@/types';
import {
  Star, StarOff, Archive, X, Paperclip, ExternalLink,
  RefreshCw, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { formatFullDate, extractDisplayName, extractEmailAddress, PRIORITY_CONFIG, CATEGORY_CONFIG, cn } from '@/lib/utils';
import { AISummaryPanel } from '@/components/ai/AISummaryPanel';
import { ReplyComposer } from '@/components/ai/ReplyComposer';
import toast from 'react-hot-toast';

interface EmailViewerProps {
  email: GmailMessage;
  onClose: () => void;
  onUpdate?: (id: string, update: Partial<GmailMessage>) => void;
}

export function EmailViewer({ email, onClose, onUpdate }: EmailViewerProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [isStarred, setIsStarred] = useState(email.isStarred);

  useEffect(() => {
    setSummary(null);
    setIsStarred(email.isStarred);
    // Auto-summarize on open
    handleSummarize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email.id]);

  const handleSummarize = async (force = false) => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: email.id,
          subject: email.subject,
          from: email.from,
          emailBody: email.body || email.snippet,
          force,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSummary({
        messageId: data.message_id,
        summaryArabic: data.summary_arabic,
        actionRequired: data.action_required,
        priority: data.priority,
        category: data.category,
        estimatedReadingTime: data.estimated_reading_time,
        detectedMeeting: data.detected_meeting,
        detectedTasks: data.detected_tasks ?? [],
        detectedDeadlines: data.detected_deadlines ?? [],
        generatedAt: data.created_at,
      });
    } catch (err: any) {
      toast.error('فشل في إنشاء الملخص');
    } finally {
      setSummarizing(false);
    }
  };

  const handleStar = async () => {
    const newVal = !isStarred;
    setIsStarred(newVal);
    onUpdate?.(email.id, { isStarred: newVal });
    await fetch(`/api/gmail/thread/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'star', value: newVal }),
    });
  };

  const handleArchive = async () => {
    await fetch(`/api/gmail/thread/${email.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive' }),
    });
    toast.success('تم أرشفة الرسالة');
    onClose();
  };

  const priorityCfg = summary ? PRIORITY_CONFIG[summary.priority] : null;
  const categoryCfg = summary ? CATEGORY_CONFIG[summary.category] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full bg-[#0f172a]"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-700/50 bg-[#1e293b]">
        <div className="flex-1 min-w-0 ml-3">
          <h2 className="text-base font-semibold text-white font-arabic mb-1 line-clamp-2">
            {email.subject}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-arabic">{extractDisplayName(email.from)}</span>
            <span className="ltr text-slate-500">&lt;{extractEmailAddress(email.from)}&gt;</span>
            <span>·</span>
            <span className="font-arabic">{formatFullDate(email.internalDate)}</span>
          </div>

          {/* Badges */}
          {summary && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-arabic', priorityCfg?.bg, priorityCfg?.color)}>
                {priorityCfg?.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600 font-arabic">
                {categoryCfg?.icon} {categoryCfg?.label}
              </span>
              <span className="text-xs text-slate-500 font-arabic">
                ~{summary.estimatedReadingTime} دقيقة قراءة
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleStar}
            className="p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-all"
            title={isStarred ? 'إزالة النجمة' : 'إضافة نجمة'}
          >
            {isStarred ? (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleArchive}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
            title="أرشفة"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Summary */}
        <div className="p-4 border-b border-slate-700/50">
          <AISummaryPanel
            summary={summary}
            loading={summarizing}
            onRefresh={() => handleSummarize(true)}
          />
        </div>

        {/* Email Body */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => setBodyExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-arabic text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            {bodyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            محتوى الرسالة
            {email.bodyHtml && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowHtml((v) => !v); }}
                className="mr-2 text-xs text-blue-400 hover:text-blue-300"
              >
                {showHtml ? 'نص عادي' : 'HTML'}
              </button>
            )}
          </button>

          {bodyExpanded && (
            <div className="email-body rtl-prose">
              {showHtml && email.bodyHtml ? (
                <div
                  className="ltr text-slate-300 text-sm"
                  dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-slate-300 text-sm font-arabic leading-relaxed">
                  {email.body || email.snippet}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments.length > 0 && (
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-sm font-arabic text-slate-400 mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              المرفقات ({email.attachments.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/gmail/attachment?messageId=${email.id}&attachmentId=${att.id}&filename=${encodeURIComponent(att.filename)}`}
                  download={att.filename}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all"
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="ltr">{att.filename}</span>
                  <span className="text-slate-500">
                    ({Math.round(att.size / 1024)} KB)
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reply Composer */}
        <div className="p-4">
          <ReplyComposer email={email} />
        </div>
      </div>
    </motion.div>
  );
}
