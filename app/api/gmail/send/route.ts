import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendMessage, createDraft } from '@/lib/gmail';
import { saveLog } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { to, subject, replyText, threadId, saveDraft } = body;

  if (!to || !replyText) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    let id: string;
    if (saveDraft) {
      id = await createDraft(session.accessToken, to, subject ?? '(بدون موضوع)', replyText, threadId);
    } else {
      id = await sendMessage(session.accessToken, to, subject ?? '(بدون موضوع)', replyText, threadId);
    }

    await saveLog({
      user_email: session.user.email!,
      action: saveDraft ? 'save_draft' : 'send_email',
      details: `To: ${to} | Subject: ${subject}`,
      status: 'success',
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    await saveLog({
      user_email: session.user.email!,
      action: saveDraft ? 'save_draft' : 'send_email',
      details: err.message,
      status: 'error',
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
