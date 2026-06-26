# مساعد البريد الذكي — AI Gmail Assistant

مساعد بريد إلكتروني مدعوم بالذكاء الاصطناعي يقرأ Gmail تلقائياً، يلخص الرسائل بالعربية، يصنفها، ويولد ردوداً إنجليزية احترافية.

---

## المتطلبات

- Node.js 18+
- حساب Supabase
- حساب Google Cloud (OAuth + Gmail API + Calendar API)
- مفتاح OpenAI API
- حساب Vercel (للنشر)

---

## خطوات الإعداد

### 1. استنساخ المشروع وتثبيت الحزم

```bash
cd C:\Users\foad2k\Desktop\ai-gmail-assistant
npm install
```

---

### 2. إعداد Google Cloud Console

1. اذهب إلى [console.cloud.google.com](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل هذه APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google People API**
4. اذهب إلى **APIs & Services → Credentials**
5. أنشئ **OAuth 2.0 Client ID** من نوع **Web application**
6. أضف في Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
7. احفظ `Client ID` و `Client Secret`

---

### 3. إعداد Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. اذهب إلى **SQL Editor → New Query**
3. الصق محتوى ملف `supabase/schema.sql` وشغّله
4. احفظ من إعدادات المشروع:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

---

### 4. إعداد ملف البيئة

```bash
cp .env.example .env.local
```

عدّل `.env.local` بالقيم الحقيقية:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_32_char_secret

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o

TOKEN_ENCRYPTION_KEY=your_exactly_32_char_key_here!!!!

ADMIN_EMAIL=foad2kk@gmail.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

لتوليد `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

لتوليد `TOKEN_ENCRYPTION_KEY` (بالضبط 32 حرف):
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

### 5. تشغيل محلياً

```bash
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

---

## النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# إضافة متغيرات البيئة في Vercel Dashboard → Settings → Environment Variables
# أضف جميع المتغيرات من .env.local

# نشر إنتاجي
vercel --prod
```

**مهم:** بعد النشر، أضف URL الإنتاجي في Google Cloud Console:
```
https://your-app.vercel.app/api/auth/callback/google
```

---

## هيكل المشروع

```
ai-gmail-assistant/
├── app/
│   ├── (auth)/login/          # صفحة تسجيل الدخول
│   ├── (dashboard)/
│   │   ├── page.tsx           # البريد الوارد
│   │   ├── summary/           # ملخص اليوم
│   │   ├── starred/           # المميزة بنجمة
│   │   ├── sent/              # المرسلة
│   │   ├── archive/           # الأرشيف
│   │   ├── search/            # البحث
│   │   ├── calendar/          # التقويم
│   │   ├── ai-settings/       # إعدادات الذكاء الاصطناعي
│   │   ├── prompt-settings/   # إعدادات البرومبت
│   │   └── logs/              # السجلات
│   └── api/
│       ├── auth/[...nextauth]/ # Google OAuth
│       ├── gmail/             # Gmail API endpoints
│       ├── ai/                # OpenAI endpoints
│       ├── calendar/          # Google Calendar API
│       ├── settings/          # AI Settings CRUD
│       ├── logs/              # Activity logs
│       └── export/            # CSV/JSON export
├── components/
│   ├── email/                 # Email list, viewer, skeleton
│   ├── ai/                    # AI summary panel, reply composer
│   └── layout/                # Sidebar, TopBar
├── lib/
│   ├── gmail.ts               # Gmail API helpers
│   ├── openai.ts              # OpenAI helpers
│   ├── supabase.ts            # Supabase client & queries
│   ├── auth.ts                # Auth session helpers
│   └── utils.ts               # Utilities
├── types/index.ts             # TypeScript types
├── supabase/schema.sql        # Database schema
├── middleware.ts              # Route protection
└── .env.example               # Environment template
```

---

## الميزات

| الميزة | الوصف |
|--------|--------|
| 🔐 Google OAuth | تسجيل دخول آمن — المسؤول فقط |
| 📧 Gmail API | قراءة، إرسال، أرشفة، تمييز |
| 🤖 ملخص عربي | تلخيص كل رسالة بالذكاء الاصطناعي |
| 📊 تصنيف تلقائي | 11 فئة + 4 مستويات أولوية |
| ✍️ رد إنجليزي | 5 أنماط + تحسين + اختصار + توسيع |
| 🌐 ترجمة | كتابة بالعربية وترجمة للإنجليزية |
| 📅 تقويم | كشف اجتماعات وإضافة للتقويم |
| 📋 ملخص يومي | تقرير صباحي شامل بالعربية |
| 📎 مرفقات | تحميل مرفقات البريد |
| 📤 تصدير | CSV و JSON |
| 🔍 بحث | فلاتر متقدمة + بحث نصي |
| 🌙 داكن/فاتح | وضعا الإضاءة |
| 📱 متجاوب | يعمل على الهاتف والجهاز اللوحي |

---

## الأمان

- لا يتم تخزين كلمة مرور Gmail مطلقاً
- OAuth tokens محمية بـ NextAuth JWT
- مفتاح التشفير مخزن في متغيرات البيئة
- حماية جميع routes بـ middleware
- تحقق من البريد الإلكتروني للمسؤول في كل طلب

---

## استكشاف الأخطاء

**خطأ 401:** تأكد من تسجيل الدخول بالبريد الصحيح (`ADMIN_EMAIL`)

**خطأ Gmail:** تأكد من تفعيل Gmail API في Google Cloud Console

**خطأ Supabase:** تأكد من تشغيل `schema.sql` وصحة المفاتيح

**خطأ OpenAI:** تأكد من صحة `OPENAI_API_KEY` ووجود رصيد

---

## المتطلبات النهائية

```
Node.js >= 18
npm >= 9
```

الحزم الرئيسية:
- Next.js 14, React 18, TypeScript
- next-auth 4 (Google OAuth)
- googleapis (Gmail + Calendar)
- openai SDK
- @supabase/supabase-js
- tailwindcss, framer-motion
- lucide-react, react-hot-toast
