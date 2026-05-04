# DineLinks — Master Design System

> Generated from UI/UX Pro Max skill data (restaurant + micro-SaaS product types).  
> Stack: Next.js + Tailwind CSS + shadcn/ui  
> Source query: "restaurant menu QR SaaS subscription"

---

## Product Classification

| Field | Value |
|-------|-------|
| Primary type | Restaurant/Food Service (UI/UX Pro Max #34) |
| Secondary type | Micro SaaS (UI/UX Pro Max #2) |
| Audience | Restaurant owners (admin) + diners (public menu) |
| Surfaces | Admin dashboard, public menu page, landing page, auth flows |

---

## Pattern

**Landing page**: Hero-Centric + Social Proof + Conversion-Optimized  
- Above-fold hero with QR scan demo  
- Social proof after hero (restaurant count / testimonials)  
- Pricing CTA repeated after trust section  
- Trial/subscription flow prominent

**Admin dashboard**: Feature-Rich Showcase + Trust & Authority  
- Sticky header with restaurant branding  
- Category tabs + item cards  
- Inline editing, drag-to-reorder  
- Banners for trial/billing status

**Public menu**: Hero-Centric  
- Hero image banner  
- Horizontal category scroll  
- Card-based item grid  
- Language switcher top-right

---

## Style

**Primary**: Soft UI Evolution (#19 in UI/UX Pro Max styles)  
- Improved contrast, modern aesthetics, subtle depth  
- Accessibility-focused (WCAG AA+)  
- 200–300ms smooth transitions  
- `border-radius: 10–14px` on cards

**Secondary**: Organic Biophilic elements  
- Warm earth tones, cream backgrounds, natural shadows  
- Rounded corners everywhere (12–16px)  
- Soft box-shadows, no harsh lines

**Avoid**: Aurora/neon gradients, dark OLED mode as default, AI purple/pink, harsh animations, Brutalism, heavy Claymorphism.

---

## Colors

> Source: Hotel/Hospitality + Luxury/Premium palettes, overridden with DineLinks brand.

| Variable | Hex | Role |
|----------|-----|------|
| `--accent` | `#8b6914` | Primary gold — CTAs, active states, links |
| `--foreground` | `#2c2a26` | Dark brown text |
| `--background` | `#faf8f5` | Warm cream page background |
| `--card` | `#ffffff` | Card / modal surface |
| `--card-border` | `#e8e4dd` | Subtle warm border |
| `--muted` | `#5a564f` | Secondary text, labels, icons |
| `--accent-light` | `#d4b87a` | Lighter gold for hover/active rings |
| `--accent-dark` | `#6f5310` | Darker gold for pressed states |

**Admin always uses these brand values** — restaurant theme only applies to `/menu/[slug]`.

---

## Typography

**Primary pairing**: Playfair Display SC + Karla (UI/UX Pro Max "Restaurant Menu" #33)  
- Display/headings: Playfair Display (elegant small caps feel)  
- Body/UI: Geist Sans (default system-friendly sans)  
- Mono: Geist Mono (prices, codes)

**Available font families** (restaurant-selectable, public menu only):  

| Value | Font | Mood |
|-------|------|------|
| `sans` | Geist Sans | Clean default |
| `serif` | Cormorant Garamond | Classic editorial |
| `playfair` | Playfair Display | Elegant upscale |
| `poppins` | Poppins | Modern friendly |
| `bebas` | Bebas Neue | Industrial bold |
| `pacifico` | Pacifico | Playful café |
| `orbitron` | Orbitron | Sci-fi tech |
| `cinzel` | Cinzel | Roman formal |
| `mono` | Geist Mono | Minimal mono |

**Admin UI always uses `var(--font-geist-sans)`** regardless of restaurant font selection.

---

## Spacing & Layout

```css
--radius-sm:  8px;   /* badges, tags */
--radius-md:  12px;  /* inputs, small cards */
--radius-lg:  16px;  /* cards, sheets */
--radius-xl:  20px;  /* modals, dialogs */
--radius-2xl: 24px;  /* hero sections */

--shadow-sm:  0 1px 3px rgba(44,42,38,0.08);
--shadow-md:  0 4px 12px rgba(44,42,38,0.10);
--shadow-lg:  0 20px 50px rgba(44,42,38,0.18);
```

Max content width: `max-w-4xl` (admin), `max-w-2xl` (item list), `max-w-lg` (modals)  
Mobile-first: default classes for 375px, `sm:` for 640px, `md:` for 768px, `lg:` for 1024px

---

## Key Effects

- Hover cards: `y: -2px` translate + elevated shadow + border color shift (200ms ease)  
- Button tap: `scale: 0.96` (100ms, via framer-motion `whileTap`)  
- Modals: `fadeIn 0.15s ease-out` + `modalIn 0.15s ease-out`  
- Mobile sheets: slide down from header (not bottom sheet)  
- Category tabs: horizontal scroll, `overflow-x-auto`, `scrollbar-none`  
- Toast: sticky top, 3s auto-dismiss  
- Trial banner: pulsing dot `animate-ping` on active trial

---

## Component Tokens

### Buttons
```
Primary CTA:    bg-[#8b6914]  text-white  rounded-xl  px-5 h-11  font-semibold
Secondary:      bg-white/10   text-white  border border-white/30  rounded-xl
Destructive:    text-red-600  hover:bg-red-50  (inline, no background)
Ghost:          border border-[#e8e4dd]  text-[#5a564f]  rounded-xl
```

### Cards
```
Surface:   bg-[var(--card)]  border border-[var(--card-border)]  rounded-2xl  shadow-sm
Hover:     translateY(-2px)  shadow-md  border-color: var(--main-color)
```

### Inputs
```
border border-[var(--card-border)]  bg-[var(--background)]  rounded-xl  
focus:ring-2 focus:ring-[var(--accent)]  text-[var(--foreground)]
```

### Admin Header
```
bg-[#1a1816]  min-height: 13rem  
Gradient overlay: from-black/85 via-black/50 to-black/20
Restaurant name: font-serif text-3xl text-white drop-shadow-md
```

---

## Anti-Patterns (avoid in DineLinks)

- ❌ Injecting restaurant theme colors into admin `:root` (breaks admin readability)  
- ❌ AI purple/pink gradients  
- ❌ Neon or high-saturation color schemes in admin shell  
- ❌ `window`/`document` access outside `useEffect` or `typeof window !== 'undefined'` guard  
- ❌ Hardcoded hex values inside components — use CSS variables  
- ❌ Bottom sheet on mobile (DineLinks sheets animate down from header)  
- ❌ Emojis as icons — use SVG (Lucide)  
- ❌ Dark mode as default  
- ❌ `pointer-events-none` on anything a user might need to tap  
- ❌ Skipping `min-h-[44px]` on touch targets

---

## Pre-Delivery Checklist

- [ ] No emojis as icons (use Lucide SVG)  
- [ ] `cursor-pointer` on all clickable elements  
- [ ] Hover states 150–300ms transitions  
- [ ] Text contrast ≥ 4.5:1 on both admin and menu  
- [ ] Focus rings visible (keyboard nav)  
- [ ] Touch targets ≥ 44px  
- [ ] Mobile responsive: 375px, 640px, 1024px  
- [ ] `typeof window !== 'undefined'` guard on browser APIs  
- [ ] Restaurant theme scoped to `/menu/[slug]` only  
- [ ] Admin always uses DineLinks brand colors (`#8b6914`, `#faf8f5`, `#2c2a26`)
