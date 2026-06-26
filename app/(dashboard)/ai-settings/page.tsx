'use client';

import { useState, useEffect } from 'react';
import { Settings, Loader2, Save, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { AIModel, ReplyTone } from '@/types';

interface AISettingsData {
  model: AIModel;
  temperature: number;
  summary_length: 'short' | 'medium' | 'detailed';
  reply_style: ReplyTone;
  auto_summarize: boolean;
  auto_generate_reply: boolean;
}

const DEFAULTS: AISettingsData = {
  model: 'gpt-4o',
  temperature: 0.3,
  summary_length: 'medium',
  reply_style: 'professional',
  auto_summarize: true,
  auto_generate_reply: false,
};

const MODELS: { value: AIModel; label: string; description: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'الأفضل — دقيق وسريع (مُوصى به)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'أسرع وأرخص، دقة جيدة' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'دقيق جداً، أبطأ قليلاً' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'الأسرع والأرخص' },
];

const SUMMARY_LENGTHS = [
  { value: 'short', label: 'مختصر', desc: '1-2 جملة' },
  { value: 'medium', label: 'متوسط', desc: '2-3 جمل' },
  { value: 'detailed', label: 'مفصل', desc: '4-5 جمل' },
];

const REPLY_STYLES: { value: ReplyTone; label: string }[] = [
  { value: 'professional', label: 'مهني' },
  { value: 'friendly', label: 'ودي' },
  { value: 'formal', label: 'رسمي' },
  { value: 'short', label: 'مختصر' },
  { value: 'detailed', label: 'مفصل' },
];

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data) setSettings({ ...DEFAULTS, ...data }); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('فشل');
      toast.success('تم حفظ الإعدادات');
    } catch {
      toast.error('فشل في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white font-arabic">إعدادات الذكاء الاصطناعي</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettings(DEFAULTS)}
            className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-xl text-sm font-arabic transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة تعيين
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-arabic transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-4">نموذج الذكاء الاصطناعي</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSettings((s) => ({ ...s, model: m.value }))}
              className={cn(
                'text-right p-3 rounded-xl border transition-all',
                settings.model === m.value
                  ? 'bg-blue-600/15 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
              )}
            >
              <p className="font-semibold text-sm ltr">{m.label}</p>
              <p className="text-xs text-slate-400 font-arabic mt-0.5">{m.description}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Temperature */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white font-arabic">درجة الإبداعية</h2>
          <span className="text-blue-400 font-bold tabular-nums">{settings.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings((s) => ({ ...s, temperature: parseFloat(e.target.value) }))}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 font-arabic mt-1">
          <span>دقيق (0.0)</span>
          <span>متوازن (0.5)</span>
          <span>إبداعي (1.0)</span>
        </div>
      </motion.div>

      {/* Summary Length */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-4">طول الملخص</h2>
        <div className="flex gap-2">
          {SUMMARY_LENGTHS.map((l) => (
            <button
              key={l.value}
              onClick={() => setSettings((s) => ({ ...s, summary_length: l.value as any }))}
              className={cn(
                'flex-1 p-3 rounded-xl border text-center transition-all',
                settings.summary_length === l.value
                  ? 'bg-blue-600/15 border-blue-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              )}
            >
              <p className={cn('text-sm font-semibold font-arabic', settings.summary_length === l.value ? 'text-blue-300' : 'text-slate-300')}>
                {l.label}
              </p>
              <p className="text-xs text-slate-500 font-arabic">{l.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Reply Style */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-4">أسلوب الرد الافتراضي</h2>
        <div className="flex flex-wrap gap-2">
          {REPLY_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSettings((st) => ({ ...st, reply_style: s.value }))}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm font-arabic transition-all',
                settings.reply_style === s.value
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Automation */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-4">الأتمتة</h2>
        <div className="space-y-3">
          {[
            { key: 'auto_summarize', label: 'تلخيص تلقائي عند فتح البريد', desc: 'يقوم بتلخيص كل بريد عند فتحه تلقائياً' },
            { key: 'auto_generate_reply', label: 'توليد رد تلقائي', desc: 'إنشاء ردود مقترحة تلقائياً لكل بريد' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm text-slate-200 font-arabic">{label}</p>
                <p className="text-xs text-slate-500 font-arabic">{desc}</p>
              </div>
              <div
                onClick={() => setSettings((s) => ({ ...s, [key]: !s[key as keyof AISettingsData] }))}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-all flex-shrink-0 cursor-pointer',
                  (settings as any)[key] ? 'bg-blue-600' : 'bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                    (settings as any)[key] ? 'right-0.5' : 'left-0.5'
                  )}
                />
              </div>
            </label>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
