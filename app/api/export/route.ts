import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'json';
  const limit = Number(searchParams.get('limit') ?? '100');

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from('email_summaries')
    .select('*')
    .eq('user_email', session.user.email!)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (format === 'csv') {
    const rows = (data ?? []).map((r) => ({
      'معرف الرسالة': r.message_id,
      'الملخص': r.summary_arabic,
      'الإجراء المطلوب': r.action_required,
      'الأولوية': r.priority,
      'الفئة': r.category,
      'وقت القراءة (دقيقة)': r.estimated_reading_time,
      'التاريخ': r.created_at,
    }));

    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="email-summaries.csv"',
      },
    });
  }

  return NextResponse.json(data ?? []);
}
