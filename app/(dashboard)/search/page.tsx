'use client';

import { useState, useCallback } from 'react';
import { EmailList } from '@/components/email/EmailList';
import { EmailViewer } from '@/components/email/EmailViewer';
import type { GmailMessage } from '@/types';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

const QUICK_FILTERS = [
  { label: 'مرفقات', q: 'has:attachment' },
  { label: 'غير مقروء', q: 'is:unread' },
  { label: 'عاجل', q: 'is:important' },
  { label: 'هذا الأسبوع', q: 'newer_than:7d' },
  { label: 'هذا الشهر', q: 'newer_than:30d' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالمرسل أو الموضوع أو الكلمات المفتاحية..."
            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 pr-11 text-slate-200 placeholder-slate-500 font-arabic focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSubmitted(''); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.q}
              type="button"
              onClick={() => { setQuery(f.q); setSubmitted(f.q); }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 font-arabic transition-all"
            >
              {f.label}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      <div className="flex flex-1 gap-4 min-h-0">
        <div className={`flex flex-col transition-all duration-300 ${selectedEmail ? 'w-full md:w-2/5 lg:w-1/3' : 'w-full'}`}>
          {submitted ? (
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs text-slate-500 font-arabic mb-3">
                نتائج البحث عن: <span className="text-slate-300">{submitted}</span>
              </p>
              <EmailList
                folder="INBOX"
                query={submitted}
                onSelectEmail={setSelectedEmail}
                selectedId={selectedEmail?.id}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Search className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 font-arabic">ابدأ بكتابة كلمة للبحث</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedEmail && (
            <motion.div
              key={selectedEmail.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:flex flex-col flex-1 min-w-0 rounded-2xl overflow-hidden border border-slate-700/50"
            >
              <EmailViewer email={selectedEmail} onClose={() => setSelectedEmail(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
