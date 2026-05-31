# DineLinks — Claude Code Instructions

Read this entire file before touching any code.

---

## Project

Digital QR-code menu SaaS for restaurants. Customers scan a table sticker
and view the full menu on their phone in 10 languages. Restaurant owners
manage everything from an admin panel.

- **Repo:** capergav/my-website
- **Live site:** https://dinelinks.com
- **Supabase project:** zqhyeyrbqygisephzvoo
- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4,
  Supabase, Vercel, Stripe (live mode), Resend

---

## How to work on this project

**Always fetch the actual file from disk before editing it.**
Never assume what a file contains based on memory or previous sessions.
Read first, then change.

**Verify before fixing.**
If asked to fix an issue, confirm the issue actually exists in the file
before writing any code. If it doesn't exist, say so.

**When overwriting is cleaner than patching, overwrite.**
For small files (under 150 lines), rewriting the whole file is more
reliable than find-and-replace. Use the Write tool, not str_replace,
when the change is large or when multiple str_replace calls would be needed.

**Never report a change as done unless you actually wrote it.**
Do not say "I've updated X" if you only planned to. Write the file,
then confirm.

**Commit and push after every logical unit of work.**
```
npm run build   # must pass before every commit
git add .
git commit -m "fix: description"
git push
```

---

## Theme color system — READ THIS CAREFULLY

CSS variables are injected per-restaurant in `app/admin/[slug]/page.tsx`
and `app/menu/[slug]/page.tsx`:

```css
:root {
  --foreground:  /* restaurant font_color        */
  --accent:      /* restaurant accent_color       */
  --background:  /* restaurant background_color   */
  --card:        /* restaurant main_color         */
  --muted:       /* restaurant muted_color        */
  --card-border: #e8e4dd  /* always hardcoded     */
}
```

### Rules — no exceptions

**Admin UI uses restaurant theme colors.**
Use `var(--accent)`, `var(--foreground)`, `var(--background)`, `var(--card)`,
`var(--muted)` everywhere in admin components. This means buttons, tabs,
category pills, item cards, toggles, save buttons — all of it.

**NEVER hardcode #8b6914 (DineLinks gold) in admin or customer menu components.**
The only places hardcoded DineLinks colors are allowed:
- The **trial pill** in the admin header (it's a DineLinks billing concept)
- The **analytics page** (`app/admin/[slug]/analytics/`) — full DineLinks brand
- The **landing page** (`app/page.tsx`) — full DineLinks brand
- The **auth pages** (login, signup, forgot-password)

**Modals always use white background + dark text.**
Theme & Branding, Add item, Add category, Settings, QR Code, Account Danger Zone —
all modals use `bg-white text-gray-900 border-gray-200` regardless of restaurant theme.
Keep `var(--accent)` on primary action buttons inside modals (Save, Create etc).

**Customer menu uses restaurant theme colors.**
`app/menu/[slug]/page.tsx` and all components under it use CSS variables.

---

## RTL (Arabic) — critical rule

**NEVER set `dir` on `document.documentElement` or `document.body`.**
This bleeds into the admin and breaks the layout.

RTL must be handled by:
1. The customer menu page wrapper div: `dir={locale === "ar" ? "rtl" : "ltr"}`
2. The LanguageDropdown uses `isRtl = locale === "ar"` to position the panel

The admin wrapper div must always have `dir="ltr"` explicitly.

---

## Language tracking

Language analytics use a custom event type `language_use`.
This is recorded:
- After **30 seconds** on the initial page language (initial engagement)
- After **8 seconds** of staying on a switched language

**Never record language on page load instantly** — that just records the default.
**Never record on a brief tap** — the 8-second threshold filters those out.

The analytics page queries `language_use` events, not `page_view` events,
for the language chart.

---

## Key file map

```
app/
  page.tsx                          Landing page (DineLinks brand colors only)
  layout.tsx                        Root layout — lang="en", NO dir attribute
  globals.css                       Global styles + CSS variable defaults
  admin/[slug]/
    page.tsx                        Server component — fetches restaurant,
                                    injects CSS variables into :root
    AdminMenuEditor.tsx             Main admin UI (large — read carefully)
    OnboardingTour.tsx              Spotlight tour, fixed bottom tooltip
    settings/SettingsClient.tsx     Settings modal content
    analytics/AnalyticsClient.tsx   Charts — hardcoded DineLinks colors here
  api/
    analytics/route.ts              Accepts page_view, item_view, language_use
    stripe/checkout/route.ts        Requires: userId, userEmail, restaurantSlug
    stripe/portal/route.ts          Requires: userId, restaurantSlug
    stripe/webhook/route.ts         Handles: checkout.completed, sub.created/updated/deleted
    cron/trial-reminders/route.ts   Daily at 12 UTC — skips active subscribers
  components/
    LanguageDropdown.tsx            Uses isRtl for panel positioning
    MenuTabs.tsx                    Category tabs + items on customer menu
    DietaryIcons.tsx                Lucide icons — WheatOff, Leaf, Sprout, etc
  context/
    LanguageContext.tsx             Language state + analytics tracking
  lib/
    themePresets.ts                 NOT standalone — presets are in AdminMenuEditor.tsx
    supabase.ts                     Supabase client (browser)
  menu/[slug]/page.tsx              Customer-facing menu
lib/
  supabaseAdmin.ts                  Service role client (server only)
  useSubscription.ts                Returns: status, daysLeftInTrial,
                                    cancel_at_period_end, current_period_end
  stripe.ts                         Stripe client
```

---

## Database tables (key columns)

### restaurants
`id, owner_id, slug, name, hero_image_url, logo_url`
`main_color → --card`
`accent_color → --accent`
`background_color → --background`
`font_color → --foreground`
`muted_color → --muted`
`font_family: sans|serif|mono|poppins|playfair|bebas|pacifico|orbitron|cinzel`
`show_currency_symbol: bool (default true)`
`allow_auto_translate: bool (default false)`
`default_language: text (default 'en')`

### menu_items
`id, restaurant_id, category, name, description, price (decimal)`
`price_suffix: text (e.g. "/pint")`
`image_url, available: bool, sort_order: int`
`chef_fav, vegan, vegetarian, gluten_free, nut_free, dairy_free, spicy: bool`

### restaurant_categories
`id, restaurant_id, name, sort_order`
`show_image: bool, banner_item_id: uuid`
`image_mode: 'icon' | 'item'`

### subscriptions
`user_id, status: trialing|active|past_due|canceled`
`trial_end, stripe_customer_id, stripe_subscription_id`
`current_period_end, cancel_at_period_end: bool`

### menu_analytics
`event_type: page_view|item_view|language_use`
`session_id, visitor_id (localStorage dl_visitor_id)`
`language, category, item_id, created_at`

---

## Subscription flow

1. Signup → `subscriptions` row created: `status='trialing'`, `trial_end = now+60d`
2. Trial pill in header shows "Xd left — Subscribe" → POST `/api/stripe/checkout`
   with body `{ userId, userEmail, restaurantSlug }`
3. After payment → Stripe webhook sets `status='active'`
4. Trial pill changes:
   - trialing → "Xd left — Subscribe" (checkout)
   - active, cancel_at_period_end=false → "Manage subscription" (portal)
   - active, cancel_at_period_end=true → "Resubscribe" (portal)
   - canceled → "Subscribe to continue" (checkout)
5. Daily cron skips users with `status='active'` for trial reminder emails

---

## Pricing / formatting rules

- Prices always `toFixed(2)` — "$4.50" never "$4.5"
- Currency symbol controlled by `show_currency_symbol` on restaurants table
- Trial always "60-day free trial" — never "2 months"
- Contact email: hello@dinelinks.com (not gavinrgallant@gmail.com)

---

## Code conventions

```
✅ 'use client' only when hooks or browser APIs are needed
✅ Guard browser APIs: typeof window !== 'undefined' or inside useEffect
✅ motion package installed — use it for animations (not framer-motion)
✅ Lucide icons for dietary: WheatOff, Leaf, Sprout, MilkOff, Flame, ShieldCheck, Star
✅ French flag: 🇫🇷 (NOT 🏴󠁣󠁡󠁱󠁣󠁿 — Quebec flag breaks on Windows)
✅ Price formatting: always .toFixed(2)
✅ RTL: on customer menu wrapper div only, never document.body
✅ Admin wrapper: always dir="ltr" explicitly
✅ Slug generation: from restaurant name + 4-char random suffix
✅ Modals: bg-white, text-gray-900, border-gray-200 — never inherit theme
```

---

## Common gotchas

```
⚠️ themePresets array lives in AdminMenuEditor.tsx, NOT themePresets.ts
⚠️ Supabase RLS — check existing policies before adding new tables
⚠️ Password reset uses ?token_hash= (not URL hash fragment)
⚠️ Vercel Hobby plan — cron jobs max once/day, weekly schedules unreliable
⚠️ LIVE_DEMO_URL in page.tsx still points to old menusnap URL — fix it
⚠️ LanguageContext STORAGE_KEY is "menusnap-locale" (legacy name, don't change)
⚠️ Stripe checkout requires userId + userEmail + restaurantSlug in POST body
⚠️ Three.js was installed then uninstalled — do NOT re-add it
⚠️ motion package is "motion" not "framer-motion" — import from "motion/react"
```

---

## Design system

Read `design-system/MASTER.md` before any UI work.
Page-specific overrides in `design-system/pages/`.

### UI/UX Pro Max skill (`.claude/skills/ui-ux`)
67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines.
Most relevant for DineLinks:
- Style #19 Soft UI Evolution — admin panel
- Style #42 Organic Biophilic — customer menu
- Style #21 Conversion-Optimized — landing CTAs
- Palette #38 Hotel/Hospitality — closest to DineLinks brand

Search: `python3 .claude/skills/ui-ux/src/ui-ux-pro-max/scripts/search.py "query" --design-system`

### Claude Mem (`.claude/mem`)
Persistent memory across sessions. Auto-runs on session start.
