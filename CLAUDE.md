# DineLinks

Digital QR code menu SaaS for restaurants. Customers scan a QR to view
the menu in 10 languages. Built for indie restaurants, cafes, food trucks,
and bistros.

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Vercel hosting
- Resend SMTP for transactional email
- Tailwind CSS

## Project info
- Repo: capergav/my-website
- Production: https://dinelinks.com
- Supabase project ID: zqhyeyrbqygisephzvoo

## Code conventions
- Server Components by default; only use 'use client' when interactivity
  or hooks are needed
- ALWAYS guard window/document/sessionStorage access with
  `typeof window !== 'undefined'` or move into useEffect — top-level
  access crashes SSR
- Tailwind utility classes preferred over inline styles
- Mobile-first responsive: default classes target mobile, md:/lg: for larger
- Theme colors live in CSS variables (globals.css) — don't hardcode hex
  values inside components

## Brand
- Primary gold: #8b6914
- Warm background: #faf8f5
- Dark text: #2c2a26
- Logo: gold rounded square with cream "DL" cutout
- Wordmark: Georgia serif — "Dine" dark + "Links" gold bold

## Key file paths
- Landing page: app/page.tsx
- Auth flows: app/login, app/signup, app/forgot-password, app/reset-password
- Admin editor: app/admin/[slug]/page.tsx + AdminMenuEditor.tsx
- Public menu (customer-facing): app/menu/[slug]/page.tsx

## Gotchas
- Supabase RLS policies must be reviewed for every new table
- Reset password flow uses ?token_hash=, NOT the URL hash fragment
- Resend free plan only sends to verified email addresses unless
  dinelinks.com is verified as a domain in Resend
- Mobile admin/menu sheets animate down from the header, not up from bottom
- The customer-facing menu page must NEVER pull theme styles from the
  landing page CSS — they must be scoped to /menu/[slug] only
- Admin UI ALWAYS uses hardcoded DineLinks brand colors — restaurant theme
  colors must NEVER be injected into :root on the admin page

## Design system
The canonical design system lives at design-system/MASTER.md.
Before writing any UI code, read it for colors, spacing, component tokens,
and the anti-patterns list. Page-specific overrides go in design-system/pages/.

## Tools

### UI/UX Pro Max skill (.claude/skills/ui-ux)
Design intelligence with 67 styles, 161 color palettes, 57 font pairings,
99 UX guidelines. Auto-activates when Claude is asked to build or improve UI.

Relevant styles for DineLinks:
- Soft UI Evolution (#19) — primary admin style: modern SaaS, WCAG AA+, subtle depth
- Organic Biophilic (#42) — warm earthy tones, cream bg, natural shadows (public menu)
- Minimalism & Swiss Style (#1) — clarity for data-heavy admin views
- Conversion-Optimized (#21) — landing page and subscription CTAs

Relevant palettes:
- Hotel/Hospitality (#38) — luxury navy + gold service (closest to DineLinks brand)
- Luxury/Premium Brand (#33) — dark + gold accent
- Restaurant/Food Service (#34) — warm food tones (public menu context)

Relevant typography:
- "Restaurant Menu" (#33): Playfair Display SC + Karla — headings/menu items
- "Classic Elegant" (#1): Playfair Display + Inter — admin headers
- "Luxury Serif" (#12): Cormorant + Montserrat — premium public menu variant

To run a design system search (requires Python 3):
  python3 .claude/skills/ui-ux/src/ui-ux-pro-max/scripts/search.py "query" --design-system

To persist a page-specific design system:
  python3 .claude/skills/ui-ux/src/ui-ux-pro-max/scripts/search.py "query" \
    --design-system --persist -p "DineLinks" --page "page-name"

### Claude Mem (.claude/mem / ~/.claude/plugins/marketplaces/thedotmack)
Persistent memory across sessions. Installed at v12.5.0.
Hooks auto-run: SessionStart injects past context, PostToolUse captures observations.
Worker runs on port 37777 via bun. Settings: ~/.claude-mem/settings.json
Viewer UI: http://127.0.0.1:37777 (when worker is running)

Note: bun is at C:\Users\Gavin\.bun\bin\bun.exe — the bun-runner.js script
finds it automatically; no manual PATH setup needed for hooks.
