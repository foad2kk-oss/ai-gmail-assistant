'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Link2, Users, Plus,
  Loader2, RefreshCw, ChevronRight,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  meetingLink?: string;
  participants: string[];
  description?: string;
}

function formatEventDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return `اليوم ${format(d, 'h:mm a')}`;
    if (isTomorrow(d)) return `غداً ${format(d, 'h:mm a')}`;
    return format(d, 'EEEE، d MMM - h:mm a', { locale: ar });
  } catch {
    return dateStr;
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    location: '',
    meetingLink: '',
    participants: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar/events');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('فشل تحميل الأحداث');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          participants: form.participants.split(',').map((p) => p.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error('فشل');
      toast.success('تمت إضافة الحدث للتقويم');
      setShowForm(false);
      setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '10:00', location: '', meetingLink: '', participants: '', description: '' });
      fetchEvents();
    } catch {
      toast.error('فشل إضافة الحدث');
    } finally {
      setSubmitting(false);
    }
  };

  const todayEvents = events.filter((e) => {
    try { return isToday(parseISO(e.start)); } catch { return false; }
  });

  const upcomingEvents = events.filter((e) => {
    try { return !isToday(parseISO(e.start)); } catch { return false; }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h1 className="text-lg font-bold text-white font-arabic">التقويم</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-arabic transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة حدث
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e293b] border border-slate-700/50 rounded-2xl p-5"
        >
          <h2 className="font-bold text-white font-arabic mb-4">حدث جديد</h2>
          <form onSubmit={handleAddEvent} className="space-y-3">
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان الحدث *"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 font-arabic text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-colors ltr"
              />
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-colors ltr"
              />
            </div>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="الموقع (اختياري)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 font-arabic text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
            <input
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              placeholder="رابط الاجتماع (اختياري)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors ltr"
              dir="ltr"
            />
            <input
              value={form.participants}
              onChange={(e) => setForm({ ...form, participants: e.target.value })}
              placeholder="المشاركون (بريد إلكتروني مفصول بفاصلة)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors ltr"
              dir="ltr"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-arabic transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                إضافة
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-arabic transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Today's Events */}
          {todayEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 font-arabic mb-3">اليوم</h2>
              <div className="space-y-2">
                {todayEvents.map((event) => (
                  <EventCard key={event.id} event={event} highlight />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 font-arabic mb-3">القادمة (7 أيام)</h2>
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400 font-arabic">لا توجد أحداث قادمة</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event, highlight }: { event: CalendarEvent; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${
        highlight
          ? 'bg-purple-500/10 border-purple-500/30'
          : 'bg-[#1e293b] border-slate-700/50'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-white font-arabic">{event.title}</h3>
        {highlight && (
          <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-arabic">
            اليوم
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-arabic">
          <Clock className="w-3.5 h-3.5" />
          {formatEventDate(event.start)}
        </span>
        {event.location && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-arabic">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </span>
        )}
        {event.participants.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span className="ltr">{event.participants.slice(0, 2).join(', ')}</span>
            {event.participants.length > 2 && <span className="font-arabic">+{event.participants.length - 2}</span>}
          </span>
        )}
      </div>

      {event.meetingLink && (
        <a
          href={event.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors ltr"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span className="truncate">{event.meetingLink}</span>
        </a>
      )}
    </motion.div>
  );
}
