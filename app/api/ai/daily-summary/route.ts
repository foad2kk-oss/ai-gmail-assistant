import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateDailySummary } from '@/lib/openai';
import { saveDailySummary, saveLog } from '@/lib/supabase';
import { format } from 'date-fns';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { emails, meetings, pendingReplies } = body;

  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    const urgentEmails = (emails ?? []).filter((e: any) => e.priority === 'urgent').length;

    const arabicSummary = await generateDailySummary(
      emails ?? [],
      meetings ?? [],
      pendingReplies ?? 0
    );

    const summaryData = {
      user_email: session.user.email!,
      date: today,
      total_emails: (emails ?? []).length,
      urgent_emails: urgentEmails,
      pending_replies: pendingReplies ?? 0,
      meetings_today: (meetings ?? []).length,
      top_priorities: (emails ?? [])
        .filter((e: any) => e.priority === 'urgent' || e.priority === 'high')
        .slice(0, 5)
        .map((e: any) => e.subject),
      arabic_summary: arabicSummary,
    };

    const saved = await saveDailySummary(summaryData);

    await saveLog({
      user_email: session.user.email!,
      action: 'generate_daily_summary',
      details: `Date: ${today}`,
      status: 'success',
    });

    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { getSupabaseAdmin } = await import('@/lib/supabase');
  const admin = getSupabaseAdmin();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data } = await admin
    .from('daily_summaries')
    .select('*')
    .eq('user_email', session.user.email!)
    .eq('date', today)
    .single();

  return NextResponse.json(data ?? null);
}
