import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateReply, improveReply, shortenText, expandText } from '@/lib/openai';
import { saveGeneratedReply, getGeneratedReply, getAISettings, saveLog } from '@/lib/supabase';
import type { ReplyTone } from '@/types';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { action, messageId, subject, from, emailBody, tone, currentReply, instruction } = body;

  try {
    const settings = await getAISettings(session.user.email!);
    const opts = {
      model: settings?.model,
      temperature: settings?.temperature,
    };

    let result = '';

    if (action === 'generate') {
      const cached = await getGeneratedReply(messageId);
      if (cached && !body.force) {
        return NextResponse.json({ replyText: cached.reply_text });
      }

      const reply = await generateReply(
        { subject, from, body: emailBody, messageId },
        (tone as ReplyTone) ?? settings?.reply_style ?? 'professional',
        opts
      );

      await saveGeneratedReply({
        message_id: messageId,
        user_email: session.user.email!,
        reply_text: reply.replyText,
        tone: reply.tone,
      });

      result = reply.replyText;
    } else if (action === 'improve') {
      result = await improveReply(currentReply, instruction ?? 'Make it better', opts);
    } else if (action === 'shorten') {
      result = await shortenText(currentReply, opts);
    } else if (action === 'expand') {
      result = await expandText(currentReply, opts);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await saveLog({
      user_email: session.user.email!,
      action: `reply_${action}`,
      details: `Message ID: ${messageId}`,
      status: 'success',
    });

    return NextResponse.json({ replyText: result });
  } catch (err: any) {
    await saveLog({
      user_email: session.user.email!,
      action: `reply_action`,
      details: err.message,
      status: 'error',
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
