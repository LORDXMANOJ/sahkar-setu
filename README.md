# Sahkar Setu

**From the training hall to a job, on one passport.**

A prototype for Smart India Hackathon problem **26087**: an integrated training, certification and employment platform for the National Council for Cooperative Training (NCCT), Ministry of Cooperation.

Every trainee gets one **Skill Passport**. Each step adds a stamp to it: nominated by their society, marked present, lessons learned (even offline), certified with a signature anyone can check, and matched to real jobs.

## Run it

Requires Node.js 20.9 or later.

```bash
npm install
npm run build
npm start          # http://localhost:3000
```

For development with hot reload: `npm run dev`. The service worker (offline mode) only registers in production builds.

Copy `.env.example` to `.env.local` to configure the following. Everything works without them in demo mode.

| Variable | What it does |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public URL, used inside QR codes |
| `GEMINI_API_KEY` | Free ([get one](https://aistudio.google.com/apikey)). Powers Sahayak and translation into any language. |
| `GROQ_API_KEY` | Free ([get one](https://console.groq.com/keys)). Automatic backup when Gemini fails or hits its limit. |
| `PASSPORT_SIGNING_KEY` | Ed25519 key that signs certificates. Without it, a temporary key is generated at startup. |

> Camera scanning needs HTTPS or `localhost`. To demo on a phone over Wi-Fi, deploy (for example to Vercel) or use `next dev --experimental-https`.

## Sign-in and database (Supabase)

Without Supabase the app runs in **demo mode**: no sign-in, one visitor can act as every role, and data lives in memory. With Supabase it has real accounts (trainee, trainer, employer) and stores everything in Postgres.

1. Create a free project at [supabase.com](https://supabase.com/dashboard).
2. **SQL Editor → New query**, paste all of `supabase/setup.sql`, press **Run**.
3. **Project Settings → API Keys**: copy the project URL, the publishable key and a secret key into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), and set any long random `DEMO_PASSWORD`.
4. Run `npm run seed`. This creates three one-tap demo accounts and uploads the prepared language packs.

## Deploy (Vercel)

1. On [vercel.com](https://vercel.com/new), import the GitHub repository. Framework: Next.js (detected).
2. Add every variable from `.env.local` under **Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL` set to the Vercel address (for example `https://sahkar-setu.vercel.app`).
3. Deploy. Every push to `main` updates the same link; use another branch for risky changes, and **Instant Rollback** if a deploy goes wrong.

## Five-minute demo script

1. **Home page** (`/`). Switch the language at the top. English, Hindi and Tamil are built in; the other 8 Indian languages download once and then work offline. With an AI key, every word on every page is translated, including lessons and new job posts.
2. **Attendance** (`/app/attendance`). As the trainer, press **Start session**. You get one code for the whole class (like `NA8-3JZ`), a QR and a shareable link. As a trainee (on a phone on the same Wi-Fi), type the code or open the link and tap **Mark me present**. Then show the protections:
   - A phone off the classroom network is refused.
   - One phone can't mark a second person, and the trainer sees a warning.
   - **New code** replaces the code; **End session** closes it.
3. **Final assessment** (`/app/exam`). The trainee accepts the monitoring notice, the exam goes fullscreen, and leaving the screen or pasting is logged. The trainer sees it under **Insights → Exam activity**.
4. **Offline learning** (`/app/learn`). Open a lesson and press **Read this lesson aloud**. Turn off Wi-Fi, answer the quiz, turn Wi-Fi back on, and the result syncs.
5. **Certificate check** (`/verify`). Try `NCCT-2026-GNR-0412`, then edit the `sig=` in the QR link and it is flagged as altered.
6. **Jobs and employer** (`/app/jobs`, `/app/employer`). Explainable match scores, apply with the passport, employer sees ranked applicants.
7. **Sahayak**. Ask in any supported language, by voice or text.

## Phone as an app (next step)

The same code can be wrapped as an Android app with [Capacitor](https://capacitorjs.com) without a rewrite. As an app it can lock the phone to the exam (Android screen pinning), which a website cannot. It will never read other apps' content: that is not allowed under India's DPDP Act or Play Store policy.

## What's in it

| Problem statement asks for | Where |
|---|---|
| Online registration and nominations | Programme calendar on `/`, role-based accounts (Supabase Auth) |
| Participant, institute and trainee profiles | Skill Passport, trainee home, employer view |
| Interactive multilingual e-learning | `/app/learn`: 11 Indian languages as downloadable packs, live translation of all text, read-aloud lessons, quizzes, monitored exams |
| Digital attendance (QR) | `/app/attendance`: one code per session (typed, link or QR), same-Wi-Fi check, one phone per person |
| Timetable, hostel, logistics | Today's timetable and hostel room on `/app` |
| LMS with assessments and certification | Lesson quizzes feed the passport; signed certificates |
| Skill certificate repository and verification | `/verify`: Ed25519 signatures, tamper detection |
| Career counselling chatbot | Sahayak (Gemini, then Groq, then an offline guide), voice in and out |
| Employer and recruiter dashboard | `/app/employer`: post jobs, ranked candidates, one-click verification |
| Mobile-friendly and offline | Installable PWA, service worker, offline quiz outbox with idempotent sync |
| Centralised database and analytics | `/app/insights`, Supabase Postgres with row-level security |

## Architecture

- **Next.js 16** (App Router, React 19, Turbopack) and **Tailwind CSS 4**
- **Design**: neutral zinc palette with one blue accent, Noto Sans for every Indian script, a 4/8px spacing grid, and small, quick motion that respects `prefers-reduced-motion`.
- **Security**: nonce-based CSP per request (`src/proxy.ts`), HSTS, frame denial, a strict Permissions-Policy, same-origin checks and rate limits on every write, Zod validation on every input, and `server-only` guards around keys. Details are on `/security`.
- **Data**: Supabase Postgres (`supabase/setup.sql`), accessed only from the server after role checks; every table has row-level security on and no public access. Programmes, lessons and sample trainees are in `src/lib/data.ts`.

```
src/
  app/            routes: /, /verify, /security, /app/*, /api/*
  components/     landing, passport and stamp, app UI, charts, assistant
  lib/            data, crypto (signatures, attendance), insights (matching, risk),
                  i18n (en, hi, ta), offline queue, rate limiting, request guards
supabase/setup.sql  database tables (paste into Supabase SQL Editor)
scripts/seed.mjs    demo accounts and language packs
public/sw.js      offline service worker
```

## Still to do for production

- Phone-number sign-in (OTP) for trainees without email
- Face recognition as an optional second attendance factor
- SMS and WhatsApp notifications for nominations and timetables
