import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { summarizeEmail } from '@/lib/openai';
import { saveEmailSummary, getEmailSummary, getAISettings, saveLog } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { messageId, subject, from, emailBody, force } = body;

  if (!messageId || !emailBody) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // Return cached summary unless forced. This used to run outside the
    // try/catch below, so a Supabase failure here (missing table, bad
    // credentials, etc.) crashed the route with an unhandled exception —
    // the client would get a non-JSON 500 page and silently show "no
    // summary yet" with no indication of what actually went wrong.
    if (!force) {
      const cached = await getEmailSummary(messageId);
      if (cached) return NextResponse.json(cached);
    }

    const settings = await getAISettings(session.user.email!);

    const summary = await summarizeEmail(
      { subject, from, body: emailBody, messageId },
      {
        model: settings?.model,
        temperature: settings?.temperature,
        summaryLength: settings?.summary_length,
        customPrompt: settings?.custom_prompt,
      }
    );

    const saved = await saveEmailSummary({
      message_id: messageId,
      user_email: session.user.email!,
      summary_arabic: summary.summaryArabic,
      action_required: summary.actionRequired,
      priority: summary.priority,
      category: summary.category,
      estimated_reading_time: summary.estimatedReadingTime,
      detected_tasks: summary.detectedTasks,
      detected_deadlines: summary.detectedDeadlines,
      detected_meeting: summary.detectedMeeting ?? null,
    });

    await saveLog({
      user_email: session.user.email!,
      action: 'summarize_email',
      details: `Message ID: ${messageId}`,
      status: 'success',
    });

    return NextResponse.json(saved);
  } catch (err: any) {
    const message = err?.message || 'Unknown error while generating summary';
    console.error('summarize_email error:', err);
    await saveLog({
      user_email: session.user.email!,
      action: 'summarize_email',
      details: message,
      status: 'error',
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
