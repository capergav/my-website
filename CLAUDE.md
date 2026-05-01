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
