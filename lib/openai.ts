import OpenAI from 'openai';
import type { AISummary, GeneratedReply, ReplyTone, EmailCategory, Priority } from '@/types';
import { estimateReadingTime } from '@/lib/utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function getOpenAI() {
  return openai;
}

interface SummarizeOptions {
  model?: string;
  temperature?: number;
  summaryLength?: 'short' | 'medium' | 'detailed';
  customPrompt?: string;
}

export async function summarizeEmail(
  email: {
    subject: string;
    from: string;
    body: string;
    messageId: string;
  },
  options: SummarizeOptions = {}
): Promise<Omit<AISummary, 'id' | 'generatedAt'>> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';
  const temperature = options.temperature ?? 0.3;
  const length = options.summaryLength ?? 'medium';

  const lengthGuide =
    length === 'short'
      ? '1-2 جمل قصيرة'
      : length === 'detailed'
      ? '4-5 جمل مفصلة'
      : '2-3 جمل';

  const systemPrompt =
    options.customPrompt ||
    `أنت مساعد ذكاء اصطناعي متخصص في تحليل رسائل البريد الإلكتروني وتصنيفها باللغة العربية.
قم بتحليل الرسائل بدقة واستخراج المعلومات المطلوبة.`;

  const userPrompt = `حلل رسالة البريد الإلكتروني التالية وأعد استجابة JSON فقط:

من: ${email.from}
الموضوع: ${email.subject}
المحتوى: ${email.body.slice(0, 4000)}

أعد JSON بالتنسيق التالي بالضبط:
{
  "summaryArabic": "ملخص الرسالة بالعربية في ${lengthGuide}",
  "actionRequired": "الإجراء المطلوب باللغة العربية أو 'لا يوجد إجراء مطلوب'",
  "priority": "urgent|high|medium|low",
  "category": "projects|clients|engineering|invoices|meetings|contracts|hr|personal|marketing|spam|other",
  "detectedMeeting": null أو {"title":"...","date":"...","time":"...","location":"...","meetingLink":"...","participants":[]},
  "detectedTasks": ["مهمة 1", "مهمة 2"],
  "detectedDeadlines": ["موعد نهائي 1"]
}

قواعد التصنيف:
- urgent: يتطلب ردًا فوريًا أو موعد نهائي خلال 24 ساعة
- high: موضوع مهم يحتاج معالجة سريعة
- medium: بريد عادي
- low: رسائل إعلامية أو تسويقية`;

  const response = await openai.chat.completions.create({
    model,
    temperature,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices[0].message.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    messageId: email.messageId,
    summaryArabic: parsed.summaryArabic ?? 'تعذر إنشاء الملخص',
    actionRequired: parsed.actionRequired ?? 'لا يوجد إجراء مطلوب',
    priority: (parsed.priority as Priority) ?? 'medium',
    category: (parsed.category as EmailCategory) ?? 'other',
    estimatedReadingTime: estimateReadingTime(email.body),
    detectedMeeting: parsed.detectedMeeting ?? undefined,
    detectedTasks: parsed.detectedTasks ?? [],
    detectedDeadlines: parsed.detectedDeadlines ?? [],
  };
}

export async function generateReply(
  email: {
    subject: string;
    from: string;
    body: string;
    messageId: string;
  },
  tone: ReplyTone = 'professional',
  options: SummarizeOptions = {}
): Promise<Omit<GeneratedReply, 'id' | 'generatedAt'>> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';
  const temperature = options.temperature ?? 0.5;

  const toneMap: Record<ReplyTone, string> = {
    professional: 'professional and business-like',
    friendly: 'friendly and warm',
    formal: 'formal and very polished',
    short: 'brief and to the point (2-3 sentences max)',
    detailed: 'comprehensive and detailed',
  };

  const response = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      {
        role: 'system',
        content: `You are an expert email writer. Generate clear, ${toneMap[tone]} English email replies.
Do not include subject line. Start directly with the greeting. Sign off with "Best regards," without adding a name.`,
      },
      {
        role: 'user',
        content: `Write a reply to this email:\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\n${email.body.slice(0, 3000)}`,
      },
    ],
  });

  return {
    messageId: email.messageId,
    replyText: response.choices[0].message.content ?? '',
    tone,
  };
}

export async function improveReply(
  currentReply: string,
  instruction: string,
  options: SummarizeOptions = {}
): Promise<string> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'You are an expert email editor. Improve the provided email reply based on the instruction.',
      },
      {
        role: 'user',
        content: `Instruction: ${instruction}\n\nCurrent reply:\n${currentReply}\n\nProvide only the improved reply text, nothing else.`,
      },
    ],
  });

  return response.choices[0].message.content ?? currentReply;
}

export async function translateToEnglish(
  arabicText: string,
  options: SummarizeOptions = {}
): Promise<string> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: 'Translate the following Arabic email text to professional English. Preserve the tone and intent. Return only the translated text.',
      },
      { role: 'user', content: arabicText },
    ],
  });

  return response.choices[0].message.content ?? arabicText;
}

export async function shortenText(text: string, options: SummarizeOptions = {}): Promise<string> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: 'Shorten the following email reply while keeping the key message. Return only the shortened text.',
      },
      { role: 'user', content: text },
    ],
  });

  return response.choices[0].message.content ?? text;
}

export async function expandText(text: string, options: SummarizeOptions = {}): Promise<string> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: 'Expand the following email reply to be more detailed and comprehensive. Return only the expanded text.',
      },
      { role: 'user', content: text },
    ],
  });

  return response.choices[0].message.content ?? text;
}

export async function generateDailySummary(
  emails: { subject: string; from: string; priority: string; category: string }[],
  meetings: { title: string; date?: string; time?: string }[],
  pendingReplies: number,
  options: SummarizeOptions = {}
): Promise<string> {
  const model = options.model ?? process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o';

  const emailList = emails
    .slice(0, 20)
    .map((e, i) => `${i + 1}. من: ${e.from} | الموضوع: ${e.subject} | الأولوية: ${e.priority}`)
    .join('\n');

  const meetingList = meetings
    .map((m) => `- ${m.title} ${m.time ? `الساعة ${m.time}` : ''}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: 'أنت مساعد تنفيذي. اكتب ملخصًا يوميًا شاملاً ومحفزًا بالعربية.',
      },
      {
        role: 'user',
        content: `اكتب ملخصًا يوميًا شاملاً للبريد الإلكتروني بالعربية:

الرسائل الواردة اليوم:
${emailList || 'لا توجد رسائل'}

الاجتماعات:
${meetingList || 'لا توجد اجتماعات'}

الردود المعلقة: ${pendingReplies}

اكتب ملخصًا مفيدًا ومنظمًا يغطي: أهم الرسائل، الإجراءات المطلوبة، والأولويات.`,
      },
    ],
  });

  return response.choices[0].message.content ?? 'تعذر إنشاء الملخص اليومي.';
}
