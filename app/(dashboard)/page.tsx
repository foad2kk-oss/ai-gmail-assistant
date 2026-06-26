'use client';

import { useState } from 'react';
import { EmailList } from '@/components/email/EmailList';
import { EmailViewer } from '@/components/email/EmailViewer';
import type { GmailMessage } from '@/types';
import { Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InboxPage() {
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [emailCache, setEmailCache] = useState<Record<string, GmailMessage>>({});

  const handleSelectEmail = (email: GmailMessage) => {
    setEmailCache((prev) => ({ ...prev, [email.id]: email }));
    setSelectedEmail(email);
  };

  const handleUpdateEmail = (id: string, update: Partial<GmailMessage>) => {
    setEmailCache((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update },
    }));
    if (selectedEmail?.id === id) {
      setSelectedEmail((prev) => prev ? { ...prev, ...update } : prev);
    }
  };

  return (
    <div className="flex h-full gap-4 min-h-0">
      {/* Email list panel */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          selectedEmail ? 'w-full md:w-2/5 lg:w-1/3' : 'w-full'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-5 h-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white font-arabic">البريد الوارد</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EmailList
            folder="INBOX"
            onSelectEmail={handleSelectEmail}
            selectedId={selectedEmail?.id}
          />
        </div>
      </div>

      {/* Email viewer panel */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            key={selectedEmail.id}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            exit={{ opacity: 0, width: 0 }}
            className="hidden md:flex flex-col flex-1 min-w-0 rounded-2xl overflow-hidden border border-slate-700/50"
          >
            <EmailViewer
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
              onUpdate={handleUpdateEmail}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
