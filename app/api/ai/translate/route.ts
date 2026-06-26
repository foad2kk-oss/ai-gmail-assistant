import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { translateToEnglish } from '@/lib/openai';
import { saveLog } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { arabicText } = await req.json();
  if (!arabicText) {
    return NextResponse.json({ error: 'Missing arabicText' }, { status: 400 });
  }

  try {
    const translated = await translateToEnglish(arabicText);
    await saveLog({
      user_email: session.user.email!,
      action: 'translate',
      details: 'Arabic to English translation',
      status: 'success',
    });
    return NextResponse.json({ translatedText: translated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
