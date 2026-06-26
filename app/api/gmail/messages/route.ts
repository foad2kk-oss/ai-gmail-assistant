import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listMessages, getMessage, markAsRead } from '@/lib/gmail';
import { saveLog } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') ?? 'INBOX';
  const maxResults = Number(searchParams.get('maxResults') ?? '20');
  const pageToken = searchParams.get('pageToken') ?? undefined;
  const q = searchParams.get('q') ?? undefined;

  const labelMap: Record<string, string[]> = {
    INBOX: ['INBOX'],
    UNREAD: ['INBOX', 'UNREAD'],
    STARRED: ['STARRED'],
    SENT: ['SENT'],
    ARCHIVE: [],
    SPAM: ['SPAM'],
  };

  const labelIds = labelMap[folder.toUpperCase()] ?? ['INBOX'];
  const query = folder.toUpperCase() === 'ARCHIVE'
    ? (q ? q + ' -in:inbox' : '-in:inbox')
    : q;

  try {
    const { messages, nextPageToken } = await listMessages(session.accessToken, {
      maxResults,
      labelIds: labelIds.length ? labelIds : undefined,
      q: query,
      pageToken,
    });

    if (!messages.length) {
      return NextResponse.json({ messages: [], nextPageToken: null });
    }

    const detailed = await Promise.allSettled(
      messages.map((m) => getMessage(session.accessToken, m.id))
    );

    const result = detailed
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    return NextResponse.json({ messages: result, nextPageToken });
  } catch (err: any) {
    await saveLog({
      user_email: session.user.email!,
      action: 'fetch_messages',
      details: err.message,
      status: 'error',
    });
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
