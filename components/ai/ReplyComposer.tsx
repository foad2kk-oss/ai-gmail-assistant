'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GmailMessage, ReplyTone } from '@/types';
import {
  Wand2, Send, Save, Loader2, ChevronDown, RefreshCw,
  Scissors, Expand, Languages, Edit3, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const TONES: { value: ReplyTone; label: string }[] = [
  { value: 'professional', label: 'مهني' },
  { value: 'friendly', label: 'ودي' },
  { value: 'formal', label: 'رسمي' },
  { value: 'short', label: 'مختصر' },
  { value: 'detailed', label: 'مفصل' },
];

interface ReplyComposerProps {
  email: GmailMessage;
}

export function ReplyComposer({ email }: ReplyComposerProps) {
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [arabicText, setArabicText] = useState('');
  const [tone, setTone] = useState<ReplyTone>('professional');
  const [loading, setLoading] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<'english' | 'arabic'>('english');
  const [instruction, setInstruction] = useState('');

  const callReplyAPI = async (action: string, extra?: object) => {
    setLoading(action);
    try {
      const res = await fetch('/api/ai/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          messageId: email.id,
          subject: email.subject,
          from: email.from,
          emailBody: email.body || email.snippet,
          tone,
          currentReply: replyText,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.replyText as string;
    } finally {
      setLoading(null);
    }
  };

  const handleGenerate = async () => {
    const text = await callReplyAPI('generate', { force: true }).catch((e) => {
      toast.error(e.message); return null;
    });
    if (text) setReplyText(text);
  };

  const handleImprove = async () => {
    if (!replyText) return toast.error('أدخل نص الرد أولاً');
    const text = await callReplyAPI('improve', { instruction: instruction || 'Make it better' }).catch((e) => {
      toast.error(e.message); return null;
    });
    if (text) setReplyText(text);
  };

  const handleShorten = async () => {
    if (!replyText) return;
    const text = await callReplyAPI('shorten').catch((e) => {
      toast.error(e.message); return null;
    });
    if (text) setReplyText(text);
  };

  const handleExpand = async () => {
    if (!replyText) return;
    const text = await callReplyAPI('expand').catch((e) => {
      toast.error(e.message); return null;
    });
    if (text) setReplyText(text);
  };

  const handleTranslate = async () => {
    if (!arabicText) return toast.error('أدخل النص العربي أولاً');
    setLoading('translate');
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arabicText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReplyText(data.translatedText);
      setMode('english');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleSend = async (saveDraft = false) => {
    if (!replyText.trim()) return toast.error('الرد فارغ');
    setLoading('send');
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.fromEmail || email.from,
          subject: `Re: ${email.subject}`,
          replyText,
          threadId: email.threadId,
          saveDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(saveDraft ? 'تم حفظ المسودة' : 'تم إرسال الرد ✓');
      if (!saveDraft) { setSent(true); setOpen(false); }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/50 hover:bg-slate-800 transition-all"
      >
        <div className="flex items-center gap-2 font-arabic text-sm text-slate-300">
          <Edit3 className="w-4 h-4 text-blue-400" />
          {sent ? (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" /> تم إرسال الرد
            </span>
          ) : (
            'إنشاء رد'
          )}
        </div>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-[#0f172a]">
              {/* Mode switcher */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setMode('english')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-arabic transition-all',
                    mode === 'english' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  إنجليزي
                </button>
                <button
                  onClick={() => setMode('arabic')}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-arabic transition-all',
                    mode === 'arabic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  عربي → إنجليزي
                </button>
              </div>

              {/* Tone selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-arabic transition-all border',
                      tone === t.value
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Arabic input */}
              {mode === 'arabic' && (
                <div className="space-y-2">
                  <textarea
                    value={arabicText}
                    onChange={(e) => setArabicText(e.target.value)}
                    placeholder="اكتب ردك بالعربية هنا..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 font-arabic resize-none focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    onClick={handleTranslate}
                    disabled={!!loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-arabic transition-all disabled:opacity-50"
                  >
                    {loading === 'translate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                    ترجم إلى الإنجليزية
                  </button>
                </div>
              )}

              {/* AI action buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleGenerate}
                  disabled={!!loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-arabic transition-all disabled:opacity-50"
                >
                  {loading === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  توليد رد
                </button>
                <button
                  onClick={handleShorten}
                  disabled={!!loading || !replyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-arabic transition-all disabled:opacity-50"
                >
                  {loading === 'shorten' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                  اختصار
                </button>
                <button
                  onClick={handleExpand}
                  disabled={!!loading || !replyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-arabic transition-all disabled:opacity-50"
                >
                  {loading === 'expand' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Expand className="w-3.5 h-3.5" />}
                  توسيع
                </button>
              </div>

              {/* Improve instruction */}
              <div className="flex gap-2">
                <input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="تعليمات التحسين... (مثال: اجعله أكثر رسمية)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-arabic focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleImprove}
                  disabled={!!loading || !replyText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-arabic transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {loading === 'improve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  تحسين
                </button>
              </div>

              {/* Reply textarea */}
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="سيظهر الرد هنا للمراجعة والتعديل قبل الإرسال..."
                rows={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 ltr resize-none focus:outline-none focus:border-blue-500 transition-colors"
                dir="ltr"
              />

              {/* Send buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSend(false)}
                  disabled={!!loading || !replyText.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-arabic transition-all disabled:opacity-50 flex-1 justify-center shadow-lg shadow-blue-600/20"
                >
                  {loading === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  إرسال الرد
                </button>
                <button
                  onClick={() => handleSend(true)}
                  disabled={!!loading || !replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-arabic transition-all disabled:opacity-50 border border-slate-600"
                >
                  {loading === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  مسودة
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
