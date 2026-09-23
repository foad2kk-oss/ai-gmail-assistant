import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Client-side Supabase client (uses anon key). Only constructed when both
// public env vars are present so a missing var doesn't crash every page
// that imports this module — callers still get a clear error if they try
// to use it without configuration.
export const supabase = (supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null) as SupabaseClient;

let adminClient: SupabaseClient | null = null;

// Server-side admin client (uses service role key — never expose to browser).
// Built lazily (and cached) on first use, so a missing/invalid env var
// throws a clear, catchable error from inside the API route's try/catch
// instead of crashing the whole module at import time with an opaque
// "supabaseUrl is required" error.
export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Supabase is not configured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable(s).'
    );
  }

  adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

export async function saveEmailSummary(summary: {
  message_id: string;
  user_email: string;
  summary_arabic: string;
  action_required: string;
  priority: string;
  category: string;
  estimated_reading_time: number;
  detected_tasks: string[];
  detected_deadlines: string[];
  detected_meeting: object | null;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('email_summaries')
    .upsert(summary, { onConflict: 'message_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEmailSummary(messageId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('email_summaries')
    .select('*')
    .eq('message_id', messageId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveGeneratedReply(reply: {
  message_id: string;
  user_email: string;
  reply_text: string;
  tone: string;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('generated_replies')
    .upsert(reply, { onConflict: 'message_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getGeneratedReply(messageId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('generated_replies')
    .select('*')
    .eq('message_id', messageId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveLog(log: {
  user_email: string;
  action: string;
  details: string;
  status: 'success' | 'error' | 'info';
}) {
  // Logging must never be the reason a request fails — swallow any error
  // (including Supabase being unconfigured) and just report it to the
  // server console instead of throwing back into the caller's catch block.
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('logs').insert(log);
    if (error) console.error('Log save error:', error);
  } catch (err) {
    console.error('Log save error:', err);
  }
}

export async function getAISettings(userEmail: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ai_settings')
    .select('*')
    .eq('user_email', userEmail)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertAISettings(settings: {
  user_email: string;
  model: string;
  temperature: number;
  summary_length: string;
  reply_style: string;
  auto_summarize: boolean;
  auto_generate_reply: boolean;
  custom_prompt: string;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('ai_settings')
    .upsert(settings, { onConflict: 'user_email' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveDailySummary(summary: {
  user_email: string;
  date: string;
  total_emails: number;
  urgent_emails: number;
  pending_replies: number;
  meetings_today: number;
  top_priorities: string[];
  arabic_summary: string;
}) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('daily_summaries')
    .upsert(summary, { onConflict: 'user_email,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
