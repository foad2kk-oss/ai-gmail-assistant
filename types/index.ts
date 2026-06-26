export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export type EmailCategory =
  | 'projects'
  | 'clients'
  | 'engineering'
  | 'invoices'
  | 'meetings'
  | 'contracts'
  | 'hr'
  | 'personal'
  | 'marketing'
  | 'spam'
  | 'other';

export type ReplyTone =
  | 'professional'
  | 'friendly'
  | 'formal'
  | 'short'
  | 'detailed';

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo';

export interface EmailHeader {
  name: string;
  value: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  subject: string;
  from: string;
  fromEmail: string;
  to: string;
  cc?: string;
  body: string;
  bodyHtml?: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
}

export interface AISummary {
  id?: string;
  messageId: string;
  summaryArabic: string;
  actionRequired: string;
  priority: Priority;
  category: EmailCategory;
  estimatedReadingTime: number;
  detectedMeeting?: DetectedMeeting;
  detectedTasks: string[];
  detectedDeadlines: string[];
  generatedAt: string;
}

export interface GeneratedReply {
  id?: string;
  messageId: string;
  replyText: string;
  tone: ReplyTone;
  generatedAt: string;
}

export interface DetectedMeeting {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  meetingLink?: string;
  participants: string[];
}

export interface AISettings {
  model: AIModel;
  temperature: number;
  language: string;
  summaryLength: 'short' | 'medium' | 'detailed';
  replyStyle: ReplyTone;
  autoSummarize: boolean;
  autoGenerateReply: boolean;
}

export interface DailySummary {
  date: string;
  totalEmails: number;
  urgentEmails: number;
  pendingReplies: number;
  meetingsToday: number;
  topPriorities: string[];
  arabicSummary: string;
}

export interface LogEntry {
  id: string;
  action: string;
  details: string;
  status: 'success' | 'error' | 'info';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  aiSettings: AISettings;
}
