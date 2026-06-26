'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, Loader2, RotateCcw, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PROMPT = `أنت مساعد ذكاء اصطناعي متخصص في تحليل رسائل البريد الإلكتروني وتصنيفها باللغة العربية.
قم بتحليل الرسائل بدقة واستخراج المعلومات المطلوبة.
استخدم لغة عربية فصيحة وسهلة الفهم.
كن دقيقاً في تحديد الأولويات والتصنيف.`;

export default function PromptSettingsPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data?.custom_prompt) setPrompt(data.custom_prompt); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_prompt: prompt }),
      });
      if (!res.ok) throw new Error();
      toast.success('تم حفظ البرومبت');
    } catch {
      toast.error('فشل في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white font-arabic">إعدادات البرومبت</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPrompt(DEFAULT_PROMPT)}
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

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300 font-arabic leading-relaxed">
          يُستخدم هذا البرومبت كتعليمات للذكاء الاصطناعي عند تلخيص رسائل البريد.
          يمكنك تخصيصه ليتناسب مع أسلوبك وطبيعة عملك.
        </p>
      </div>

      {/* Prompt editor */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-3">نص البرومبت المخصص</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={14}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-slate-200 text-sm font-arabic leading-relaxed resize-none focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="اكتب تعليمات البرومبت هنا..."
          dir="rtl"
        />
        <p className="text-xs text-slate-500 font-arabic mt-2">
          {prompt.length} حرف
        </p>
      </div>

      {/* Tips */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5">
        <h2 className="font-semibold text-white font-arabic mb-3">نصائح كتابة البرومبت</h2>
        <ul className="space-y-2 text-sm text-slate-400 font-arabic">
          {[
            'حدد دورك ومهمتك بوضوح في البداية',
            'اذكر لغة الإخراج المطلوبة (عربي/إنجليزي)',
            'حدد الأسلوب المطلوب (رسمي، ودي، مختصر)',
            'يمكنك إضافة سياق عن طبيعة عملك وقطاعك',
            'تجنب التعليمات المتناقضة',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
