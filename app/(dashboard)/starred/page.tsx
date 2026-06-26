'use client';

import { useState } from 'react';
import { EmailList } from '@/components/email/EmailList';
import { EmailViewer } from '@/components/email/EmailViewer';
import type { GmailMessage } from '@/types';
import { Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StarredPage() {
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);

  return (
    <div className="flex h-full gap-4 min-h-0">
      <div className={`flex flex-col transition-all duration-300 ${selectedEmail ? 'w-full md:w-2/5 lg:w-1/3' : 'w-full'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h1 className="text-lg font-bold text-white font-arabic">المميزة بنجمة</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EmailList folder="STARRED" onSelectEmail={setSelectedEmail} selectedId={selectedEmail?.id} />
        </div>
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
  );
}
