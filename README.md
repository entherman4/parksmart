# ParkSmart UMBC — Week 1 Setup Guide

## What this is
A Next.js web app with:
- UMBC email authentication (magic link, no password)
- Real-time campus parking map (Leaflet + OpenStreetMap)
- Live occupancy data per lot from Supabase
- Permit-aware filtering (A/B/C/R/V)

---

## Step 1 — Create your Supabase project (15 min)

1. Go to https://supabase.com and create a free account
2. Click "New project" — name it `parksmart-umbc`
3. Choose a strong database password (save it somewhere)
4. Wait ~2 minutes for it to spin up
5. Go to **SQL Editor** and paste the entire contents of `supabase_schema.sql`
6. Click **Run** — this creates all tables, triggers, and seed data

### Get your API keys
- Go to **Settings → API**
- Copy `Project URL` and `anon public` key

---

## Step 2 — Configure auth (5 min)

In your Supabase dashboard:
1. Go to **Authentication → Providers → Email**
2. Make sure "Enable Email Provider" is ON
3. Turn ON "Enable Confirmations" (magic link mode)
4. Go to **Authentication → URL Configuration**
5. Set **Site URL** to `http://localhost:3000` (change to your Vercel URL later)
6. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

---

## Step 3 — Run locally (5 min)

```bash
# Clone or download this folder, then:
cd parksmart-umbc

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local

# Edit .env.local and paste your Supabase keys:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Start the dev server
npm run dev
```

Open http://localhost:3000

---

## Step 4 — Test it

1. Enter your `@umbc.edu` email on the login page
2. Check your email for the magic link
3. Click it — you'll be redirected back and logged in
4. The map shows 6 UMBC lots with mock occupancy data
5. Click a permit type to filter which lots are valid for you
6. Click a lot pin on the map to see details

---

## Step 5 — Deploy to Vercel (10 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts, then add your env variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then update your Supabase **Site URL** and **Redirect URLs** to your Vercel domain.

---

## Project structure

```
src/
  lib/
    supabase.ts     ← Supabase client + types + helpers
    auth.tsx        ← Auth context (login state for whole app)
    useLots.ts      ← Real-time lots hook
  components/
    CampusMap.tsx   ← Leaflet map with live lot markers
    LotCard.tsx     ← Sidebar lot card with occupancy bar
    PermitSelector.tsx ← A/B/C/R/V permit filter buttons
  pages/
    index.tsx       ← Main dashboard (map + sidebar)
    login.tsx       ← Login page
    auth/
      callback.tsx  ← Magic link redirect handler
  styles/
    globals.css     ← Base styles
supabase_schema.sql ← Run this in Supabase SQL editor
```

---

## Week 2 preview
Next you'll add the **community reports** feature:
- Report submission form (lot + status + note)
- Live feed of recent reports
- Auto-update lot occupancy from aggregated reports
- Upvote system to confirm accurate reports

---

## Updating real lot coordinates

The seed data uses approximate coordinates. To fix them:
1. Open Google Maps, find each lot, right-click → "What's here?" to get lat/lng
2. Run this SQL in Supabase to update:

```sql
update lots set lat = 39.XXXX, lng = -76.XXXX where short_name = 'Lot 1';
```
