# ✈️ TravelCal

> Coordinate your crew's availability in seconds. No more "when works for everyone?" threads.

A trip-first availability planner built with Next.js 14, Tailwind CSS, and Supabase.

---

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd travelcal
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and paste the entire contents of `supabase/schema.sql`
3. Click **Run** — this creates all tables, RLS policies, and the user trigger

### 3. Enable Google OAuth in Supabase

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Enable **Google**
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a project → **APIs & Services → Credentials → Create OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
7. Copy the Client ID and Secret back into Supabase

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find these in Supabase → **Settings → API**.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Project Structure

```
travelcal/
├── app/
│   ├── layout.tsx              # Root layout (fonts, toasts)
│   ├── globals.css             # Global styles & CSS variables
│   ├── page.tsx                # Landing / login page
│   ├── not-found.tsx           # 404 page
│   ├── auth/
│   │   └── callback/route.ts   # OAuth callback handler
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard (server component)
│   │   └── DashboardClient.tsx # Trip list + create modal
│   └── trip/[id]/
│       ├── page.tsx            # Trip page (server component)
│       └── TripClient.tsx      # Calendar + realtime + side panel
├── lib/
│   └── supabase/
│       ├── client.ts           # Supabase client helpers
│       └── types.ts            # TypeScript types for DB
├── supabase/
│   └── schema.sql              # Full DB schema — run this first
├── middleware.ts               # Auth middleware
└── tailwind.config.ts          # Tailwind + custom colors/fonts
```

---

## ✨ Features

### Phase 0 (implemented)
- ✅ Google OAuth login
- ✅ Create trips with emoji, name, date range
- ✅ Trip dashboard (upcoming + past)
- ✅ Click to cycle availability: Free 🟢 → Tentative 🟡 → Busy 🔴 → None
- ✅ Instant optimistic UI updates
- ✅ Realtime sync via Supabase subscriptions
- ✅ Per-person hover tooltip on calendar dates
- ✅ Crew side panel with response counts

### Phase 1 (invite links — implemented)
- ✅ Shareable `/trip/:id` URL
- ✅ Auto-join trip on visit
- ✅ Copy invite link button

### Phase 2 ideas
- [ ] Combined availability overlay on calendar (best days highlighted)
- [ ] Email notifications when someone responds
- [ ] Public/private trips + follow public trips
- [ ] Trip comments / notes per date
- [ ] Suggested "best window" algorithm

---

## 🎨 Design Decisions

- **Airbnb aesthetic**: Coral red (`#ff385c`), warm sand backgrounds, Playfair Display + Nunito fonts
- **Trip-first UX**: Everything starts from a trip, not a global calendar
- **Optimistic UI**: Date clicks feel instant — Supabase syncs in background
- **Realtime**: Supabase Postgres Changes keep all users in sync live

---

## 🚢 Deployment

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in Vercel dashboard → Project Settings → Environment Variables.

Update `NEXT_PUBLIC_APP_URL` to your production URL, and add it to Supabase's allowed redirect URLs under **Authentication → URL Configuration**.

---

## 🐛 Troubleshooting

**"relation does not exist" errors** → Make sure you ran `supabase/schema.sql` in full

**Google login redirects to wrong URL** → Check the redirect URI in Google Cloud Console matches your Supabase callback URL exactly

**RLS policy errors** → Make sure you're logged in and the user was created in `profiles` table (the trigger handles this automatically)

**Realtime not working** → Check that you enabled realtime for the `availability` table (the schema SQL does this)
