import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? '50');
  const status = searchParams.get('status');

  const admin = getSupabaseAdmin();
  let query = admin
    .from('logs')
    .select('*')
    .eq('user_email', session.user.email!)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error: dbError } = await query;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const admin = getSupabaseAdmin();
  const { error: dbError } = await admin
    .from('logs')
    .delete()
    .eq('user_email', session.user.email!);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
