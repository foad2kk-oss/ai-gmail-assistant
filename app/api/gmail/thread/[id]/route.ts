import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getMessage, markAsRead, toggleStar, archiveMessage } from '@/lib/gmail';
import { saveLog } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const message = await getMessage(session.accessToken, params.id);
    // Auto mark as read when opening
    if (!message.isRead) {
      await markAsRead(session.accessToken, params.id).catch(() => {});
    }
    return NextResponse.json(message);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'star') {
      await toggleStar(session.accessToken, params.id, body.value ?? true);
    } else if (action === 'archive') {
      await archiveMessage(session.accessToken, params.id);
    } else if (action === 'markRead') {
      await markAsRead(session.accessToken, params.id);
    }

    await saveLog({
      user_email: session.user.email!,
      action: `email_${action}`,
      details: `Message ID: ${params.id}`,
      status: 'success',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
