# Implementation TODO

Derived from `mobile-accessories-shop-blueprint/07_IMPLEMENTATION_ROADMAP.md` and the functional
requirements in `01_REQUIREMENTS.md`. Every item traces back to a blueprint clause.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked on the shop owner

---

## Phase 1 — Foundation

- [x] Initialize React + TypeScript + Vite
- [x] Install Tailwind CSS (v4, `@tailwindcss/vite`)
- [x] Install Framer Motion
- [x] Install React Hook Form + Zod + `@hookform/resolvers`
- [x] Install Zustand + Lucide React
- [x] Establish design tokens (`@theme` in `src/styles/globals.css`, palette from §03.2)
- [x] Set up linting (oxlint, Vite 8 default) + `npm run typecheck`
- [x] Add reusable UI primitives — Button, Input, Select, Modal, Drawer, Badge, Toast, Skeleton

## Phase 2 — Catalog Data

- [x] Add brands — 21
- [x] Add device models — 200 (183 smartphones, 17 tablets)
- [x] Add categories (9 + custom path)
- [x] Add products — 68
- [x] Add compatibility mappings (rule-based resolver, §04.9)
- [x] Add product imagery (37 parametric inline-SVG art keys — no external CDN, no network)
- [x] Add product badges/tags (`MagSafe`, `Shockproof`, `Privacy`, `Fast Charging`, …)

## Phase 3 — Core UI

- [x] AnnouncementBar
- [x] Navbar (desktop nav + mobile hamburger + cart icon)
- [x] Hero (split composition, floating accessory cards, parallax) — FR-01
- [x] Device finder (type → brand → model → variant) — FR-02
- [x] Category section — FR-03
- [x] Product grid + product card — FR-04
- [x] Product filters (brand, model, category, price, availability, tag) — FR-05
- [x] Product quick-view modal — FR-06
- [x] Cart drawer + floating cart pill/sticky bar — FR-07
- [x] Compatibility / Why-shop / Contact CTA / Footer sections
- [x] Responsive behaviour, mobile-first

## Phase 4 — Ordering

- [x] Order form — FR-08
- [x] Custom request form — FR-09
- [x] Shared validation schemas (one Zod module used by client *and* server)
- [x] Request ID generation (`MAS-YYYYMMDD-XXXX`) — FR-10
- [x] Loading / success / error states — FR-11, FR-12
- [x] Duplicate-submission protection (idempotency key + in-flight lock)

## Phase 5 — Email Backend

- [!] Create Resend account — owner
- [!] Verify sending domain — owner
- [!] Create API key — owner
- [x] Document server environment variables (`.env.example`)
- [x] Build `POST /api/order`
- [x] Build `POST /api/custom-request`
- [x] Server-side validation (same Zod schemas, `strictObject`)
- [x] Rate limiting (IP + sliding window)
- [x] Branded HTML email templates (+ plain-text alternative)
- [x] Honeypot + body size limit + idempotency
- [x] Render templates and check layout — `npm run preview:emails` writes real HTML to
      `email-preview/`, verified at 420px and 800px. A live Gmail send still needs a real key.

## Phase 6 — Polish

- [x] Motion system (3 levels per §03.13)
- [x] `prefers-reduced-motion` handling
- [x] Skeleton loaders
- [x] Empty states (§03.14)
- [x] Toast notifications
- [x] Accessibility pass (focus trap, Escape, labels, aria, contrast)
- [x] SEO metadata (title, description, OG, Twitter, JSON-LD)
- [x] Image optimisation (inline SVG art, no raster payload; `contain: layout` on cards)

## Phase 7 — QA

Two suites, both runnable: `npm test` (99 unit tests) and `npm run qa` (37 browser checks
driven through Chrome against the production build). Everything below is asserted by one of
them, not just eyeballed.

### Functional — all green

- [x] Brand filtering narrows the model list
- [x] Model filtering shows only compatible products (MagSafe never offered for a Galaxy)
- [x] Tablet accessories never appear for a phone
- [x] URL state is shareable and restores filters
- [x] Cart quantities work, and survive a reload
- [x] Quick-view quantity and variant selection work
- [x] Order request submits and shows a request ID
- [x] A successful order clears the cart
- [x] Custom request submits
- [x] Invalid phone is rejected inline and never reaches the API
- [x] Delivery requires an address
- [x] Failed send shows an error, keeps the typed data, offers retry + a phone fallback
- [x] Network drop is recoverable without data loss
- [x] Rate-limit response is explained, not swallowed
- [x] A double-click sends exactly one request
- [x] Opening/closing an overlay preserves scroll position
- [x] Adding to the cart does not move the page
- [x] Empty state routes into a custom request

### Responsive — all green

- [x] 360 / 390 / 768 / 1024 / 1440 / 1920 — no horizontal overflow at any width
- [x] Primary tap targets ≥ 32px on mobile

### Accessibility — all green

- [x] Skip link is the first tab stop
- [x] Focus trapped in dialogs; Escape closes and restores focus
- [x] Every form control has an accessible name
- [x] Every image-role SVG carries a label; decorative art is `aria-hidden`
- [x] One `h1`, no heading-level jumps
- [x] Reduced motion stops the hero animation
- [x] Mobile menu reports its expanded state

### Bugs found in production and fixed

- [x] Vercel compiled `api/` with the ROOT `tsconfig.json`, which had no compilerOptions and
      defaulted to `moduleResolution: nodenext` — every function failed to build
- [x] Vercel transpiles but does not bundle, so Node ESM could not resolve extensionless
      relative imports at runtime (`ERR_MODULE_NOT_FOUND`) — `.js` extensions added
- [x] Vercel's Node runtime passes an `IncomingMessage`, not a Web `Request`, so the pipeline
      crashed on `request.headers.get is not a function` — `api/_lib/node-adapter.ts` bridges it

### Bugs found by QA and fixed

- [x] Dialogs re-ran their effect every render, cancelling autofocus and bouncing focus back
      to the trigger — the focus trap did not work at all (`useOverlayBehaviour`)
- [x] Opening any overlay reset the page scroll to 0 and left it there (`lib/scroll-lock.ts`)
- [x] Adding to the cart swapped the grid for skeletons, collapsing page height mid-scroll
- [x] Quick-view quantity reset to 1 on every render, so the stepper was unusable
- [x] `content-visibility: auto` mis-estimated card heights and destabilised scrolling
- [x] The quick-view pill was invisible but still tappable on touch devices
- [x] Decorative hero SVGs were announced as unlabelled images
- [x] Phone validation accepted 16 digits, one above the E.164 maximum

## Phase 8 — Launch

- [x] Push project to GitHub (branch `build/mvp-implementation`)
- [x] Deploy frontend/API to Vercel — **live at https://mobile-accessories-shop-fawn.vercel.app**
      Both endpoints verified in production: 405 on GET, 422 with field errors on a bad body,
      503 `not_configured` on a valid one (no mail key yet), recipient smuggling rejected,
      rate limiting active.
- [!] Add production environment variables — owner (`RESEND_API_KEY`, `SHOP_OWNER_EMAIL`,
      `MAIL_FROM`). Until these are set the live API correctly answers 503 rather than
      pretending an order went through.
- [!] Verify email domain — owner
- [!] Configure custom domain — owner
- [!] Submit real test orders / confirm owner receives email — owner
- [x] Confirm mobile usability
- [ ] Add analytics if required (event names already emitted, see `src/lib/analytics.ts`)

## Phase 9 — Future Enhancements (not in MVP)

- [ ] Supabase catalog database
- [ ] Admin panel
- [ ] Order history / inventory status
- [ ] Customer confirmation email
- [ ] WhatsApp notification integration
- [ ] Image upload for custom requests
- [ ] Online payment / coupons / delivery zones
- [ ] Product reviews / wishlist / PWA install
