import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { google } from 'googleapis';

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: 'v3', auth });
}

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const calendar = getCalendarClient(session.accessToken);
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    const events = (res.data.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary ?? 'بدون عنوان',
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      location: e.location,
      meetingLink: e.hangoutLink ?? e.conferenceData?.entryPoints?.[0]?.uri,
      participants: (e.attendees ?? []).map((a) => a.email),
      description: e.description,
    }));

    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const { title, date, time, location, meetingLink, participants, description } = body;

  if (!title || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const startDateTime = time
    ? new Date(`${date}T${time}:00`)
    : new Date(`${date}T09:00:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  try {
    const calendar = getCalendarClient(session.accessToken);
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        description: description
          ? `${description}${meetingLink ? `\n\nرابط الاجتماع: ${meetingLink}` : ''}`
          : meetingLink,
        location,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        attendees: (participants ?? []).map((email: string) => ({ email })),
        conferenceData: meetingLink
          ? {
              entryPoints: [{ entryPointType: 'video', uri: meetingLink }],
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, eventId: event.data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
