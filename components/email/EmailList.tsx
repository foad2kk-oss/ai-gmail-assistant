'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEmailDate, extractDisplayName, extractEmailAddress, cn } from '@/lib/utils';
import { Star, Paperclip, AlertCircle, Loader2, RefreshCw, ChevronDown } from 'lucide-react';
import type { GmailMessage } from '@/types';
import { EmailSkeleton } from '@/components/email/EmailSkeleton';

interface EmailListProps {
  folder?: string;
  query?: string;
  onSelectEmail: (email: GmailMessage) => void;
  selectedId?: string;
}

export function EmailList({ folder = 'INBOX', query, onSelectEmail, selectedId }: EmailListProps) {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = useCallback(
    async (pageToken?: string) => {
      if (!pageToken) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const params = new URLSearchParams({ folder, maxResults: '25' });
        if (pageToken) params.set('pageToken', pageToken);
        if (query) params.set('q', query);

        const res = await fetch(`/api/gmail/messages?${params}`);
        if (!res.ok) throw new Error('فشل في تحميل الرسائل');
        const data = await res.json();

        setEmails((prev) => (pageToken ? [...prev, ...data.messages] : data.messages));
        setNextPageToken(data.nextPageToken ?? null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [folder, query]
  );

  useEffect(() => {
    setEmails([]);
    fetchEmails();
  }, [fetchEmails]);

  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <EmailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-400 font-arabic mb-4">{error}</p>
        <button
          onClick={() => fetchEmails()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-arabic transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!emails.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-400 font-arabic">لا توجد رسائل</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {emails.map((email, idx) => (
          <motion.div
            key={email.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02, duration: 0.2 }}
          >
            <EmailRow
              email={email}
              isSelected={email.id === selectedId}
              onClick={() => onSelectEmail(email)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {nextPageToken && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchEmails(nextPageToken)}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-sm font-arabic transition-all"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            تحميل المزيد
          </button>
        </div>
      )}
    </div>
  );
}

function EmailRow({
  email,
  isSelected,
  onClick,
}: {
  email: GmailMessage;
  isSelected: boolean;
  onClick: () => void;
}) {
  const name = extractDisplayName(email.from);
  const addr = extractEmailAddress(email.from);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-right flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 group',
        isSelected
          ? 'bg-blue-600/10 border-blue-500/30'
          : 'bg-transparent border-transparent hover:bg-slate-800/60 hover:border-slate-700/50',
        !email.isRead && !isSelected && 'bg-slate-800/30 border-slate-700/30'
      )}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
        {name[0]?.toUpperCase() ?? '?'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn('text-sm truncate', email.isRead ? 'text-slate-300' : 'text-white font-semibold')}>
            {name || addr}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0 mr-2">
            {formatEmailDate(email.internalDate)}
          </span>
        </div>

        <p className={cn('text-sm truncate mb-1', email.isRead ? 'text-slate-400' : 'text-slate-200')}>
          {email.subject}
        </p>

        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-500 truncate flex-1">{email.snippet}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {email.isStarred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
            {email.attachments.length > 0 && <Paperclip className="w-3 h-3 text-slate-400" />}
            {email.isImportant && <AlertCircle className="w-3 h-3 text-orange-400" />}
            {!email.isRead && (
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
