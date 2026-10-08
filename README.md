# SpaceCheck
AI-powered property intelligence for smarter property decisions in Nigeria.

> Find the right space. Know what you're moving into.

Phase 0 foundation: Next.js + TypeScript + Tailwind + Supabase Auth. See `MyDocument/SpaceCheck PRD.docx` for the full PRD.

## Stack (Option A)
- Next.js 16 App Router (`src/app`), `cacheComponents: false` for simple beginner auth
- Supabase: Postgres + Auth + RLS (`supabase/schema.sql`)
- Hosting: Vercel (frontend) + Supabase (free tier)

## 1. Manual setup you must do (5 min)

1. Create project at https://supabase.com/dashboard > New project
2. SQL Editor > paste `supabase/schema.sql` > Run (creates profiles, properties, reports, saves, viewing_requests, preferences + `property_public` view + RLS)
3. Authentication > URL Configuration > add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`, `http://localhost:3000/reset-password`
4. Copy Settings > API > Project URL + anon key into `.env.local`:
```bash
cp .env.example .env.local
# edit .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 2. Run
```bash
npm install
npm run dev
# open http://localhost:3000
npm run build  # must pass before push
```

## 3. Test Phase 0 milestone
1. Open `/` landing loads
2. `/signup` > email + password + role (Renter / Owner-Agent / Community) > submits via Server Action > lands on `/dashboard`
3. `/login` > log out via Navbar > log back in > stays logged in (cookies via `src/proxy.ts`)
4. `/onboarding` > change role > saved to `profiles` table
5. `/forgot-password` > enter email > check inbox > open `/reset-password` link > set new password
6. Supabase connection: `/dashboard` shows Saved/Viewing counts (0 if fresh). If tables missing, `/search` shows “Database not connected yet”.
7. Create/read test property (SQL Editor):
```sql
insert into properties (property_type, bedrooms, rent, general_area, verification_status, electricity, flood, water)
values ('2 bedroom', 2, 1500000, 'Lekki Phase 1', 'Limited information', 'Not provided', 'Not provided', 'Not provided')
returning id;
-- copy id, open /search then /properties/<id>
-- exact_address / exact_lat / exact_lng are never selected by the app (see property_public view)
```

## Files created in Phase 0
- `src/lib/supabase/client.ts`, `server.ts` — browser vs server clients
- `src/proxy.ts` — refreshes Supabase session (Next 16 name for middleware)
- `src/app/auth/actions.ts` — signup/login/logout/reset/role Server Actions
- `src/app/auth/callback/route.ts` — email-link code exchange
- `src/app/{page,signup,login,forgot-password,reset-password,onboarding,dashboard,search,properties/[id]}` — routes
- `src/components/Navbar.tsx` — shows Log in/Sign up or Dashboard/Log out
- `supabase/schema.sql` — tables + RLS + public view (privacy: exact address hidden)
- `.env.example`, `package.json` (`spacecheck`), `next.config.ts` (cacheComponents off for Phase 0)

## Product rules enforced
- Missing data renders as “Not provided” / “Limited information”, never invented
- Public queries use `property_public` view only (no exact_address/latlng)
- No safety guarantees (“safe area”, “will not flood”) anywhere in UI copy
- No payment logic, so Fit Score cannot be affected

Next: Phase 1 — property submission (owner/agent form + photos + RLS insert).
