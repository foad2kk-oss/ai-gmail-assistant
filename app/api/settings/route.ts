import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAISettings, upsertAISettings } from '@/lib/supabase';

const DEFAULTS = {
  model: 'gpt-4o',
  temperature: 0.3,
  summary_length: 'medium',
  reply_style: 'professional',
  auto_summarize: true,
  auto_generate_reply: false,
  custom_prompt: '',
};

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const settings = await getAISettings(session.user.email!);
  return NextResponse.json(settings ?? { ...DEFAULTS, user_email: session.user.email });
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();

  const saved = await upsertAISettings({
    user_email: session.user.email!,
    model: body.model ?? DEFAULTS.model,
    temperature: body.temperature ?? DEFAULTS.temperature,
    summary_length: body.summary_length ?? DEFAULTS.summary_length,
    reply_style: body.reply_style ?? DEFAULTS.reply_style,
    auto_summarize: body.auto_summarize ?? DEFAULTS.auto_summarize,
    auto_generate_reply: body.auto_generate_reply ?? DEFAULTS.auto_generate_reply,
    custom_prompt: body.custom_prompt ?? DEFAULTS.custom_prompt,
  });

  return NextResponse.json(saved);
}
