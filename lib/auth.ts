import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export interface AuthSession extends Session {
  accessToken: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await getServerSession(authOptions);
  return session as AuthSession | null;
}

export async function requireAuth(): Promise<
  { session: AuthSession; error: null } | { session: null; error: NextResponse }
> {
  const session = await getAuthSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const allowed = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim());
  if (!allowed.includes(session.user?.email || '')) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { session, error: null };
}
