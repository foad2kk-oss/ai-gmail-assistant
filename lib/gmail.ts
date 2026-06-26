import { google } from 'googleapis';
import type { GmailMessage, EmailAttachment } from '@/types';
import { decodeBase64 } from '@/lib/utils';

export function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractBody(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  function walk(part: any) {
    if (!part) return;
    if (part.mimeType === 'text/plain' && part.body?.data) {
      text = decodeBase64(part.body.data);
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      html = decodeBase64(part.body.data);
    } else if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);

  // Fallback: body directly on payload
  if (!text && !html && payload?.body?.data) {
    if (payload.mimeType === 'text/html') {
      html = decodeBase64(payload.body.data);
    } else {
      text = decodeBase64(payload.body.data);
    }
  }

  return { text, html };
}

function extractAttachments(payload: any, messageId: string): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];

  function walk(part: any) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size ?? 0,
      });
    }
    if (part.parts) part.parts.forEach(walk);
  }

  walk(payload);
  return attachments;
}

export async function listMessages(
  accessToken: string,
  options: {
    maxResults?: number;
    labelIds?: string[];
    q?: string;
    pageToken?: string;
  } = {}
): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string }> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options.maxResults ?? 20,
    labelIds: options.labelIds,
    q: options.q,
    pageToken: options.pageToken,
  });
  return {
    messages: (res.data.messages ?? []) as { id: string; threadId: string }[],
    nextPageToken: res.data.nextPageToken ?? undefined,
  };
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const msg = res.data;
  const headers = (msg.payload?.headers ?? []) as { name: string; value: string }[];
  const { text, html } = extractBody(msg.payload);

  return {
    id: msg.id!,
    threadId: msg.threadId!,
    labelIds: (msg.labelIds ?? []) as string[],
    snippet: msg.snippet ?? '',
    internalDate: msg.internalDate ?? '',
    subject: getHeader(headers, 'Subject') || '(بدون موضوع)',
    from: getHeader(headers, 'From'),
    fromEmail: getHeader(headers, 'From').replace(/.*<(.+)>.*/, '$1').trim(),
    to: getHeader(headers, 'To'),
    cc: getHeader(headers, 'Cc'),
    body: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    bodyHtml: html,
    attachments: extractAttachments(msg.payload, msg.id!),
    isRead: !(msg.labelIds ?? []).includes('UNREAD'),
    isStarred: (msg.labelIds ?? []).includes('STARRED'),
    isImportant: (msg.labelIds ?? []).includes('IMPORTANT'),
  };
}

export async function getThread(accessToken: string, threadId: string) {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
  return res.data;
}

export async function sendMessage(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<string> {
  const gmail = getGmailClient(accessToken);

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  const raw = Buffer.from(messageParts.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  });
  return res.data.id!;
}

export async function markAsRead(accessToken: string, messageId: string): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  });
}

export async function toggleStar(
  accessToken: string,
  messageId: string,
  star: boolean
): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: star
      ? { addLabelIds: ['STARRED'] }
      : { removeLabelIds: ['STARRED'] },
  });
}

export async function archiveMessage(accessToken: string, messageId: string): Promise<void> {
  const gmail = getGmailClient(accessToken);
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['INBOX'] },
  });
}

export async function createDraft(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  threadId?: string
): Promise<string> {
  const gmail = getGmailClient(accessToken);

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  const raw = Buffer.from(messageParts.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw, threadId } },
  });
  return res.data.id!;
}

export async function getAttachment(
  accessToken: string,
  messageId: string,
  attachmentId: string
): Promise<{ data: string; size: number }> {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });
  return {
    data: res.data.data ?? '',
    size: res.data.size ?? 0,
  };
}

export async function getProfile(accessToken: string) {
  const gmail = getGmailClient(accessToken);
  const res = await gmail.users.getProfile({ userId: 'me' });
  return res.data;
}
