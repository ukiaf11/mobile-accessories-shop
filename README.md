# Mobile Accessories Shop

A single-page storefront for a mobile accessories shop. The customer picks their exact phone or
tablet model, sees only the accessories that fit it, builds a request list, and sends it to the
shop. A serverless endpoint validates the request and emails the owner.

There is no payment, no login and no database — by design. The site is a **catalog and order
request collector**, not a checkout.

Built from the specification in
[`mobile-accessories-shop/mobile-accessories-shop-blueprint/`](mobile-accessories-shop/mobile-accessories-shop-blueprint/).

---

## The one flow that matters

```text
Find my phone → find a compatible accessory → add to the request list
    → enter contact details → send → the shop receives an email
```

Catalog coverage today: **21 brands · 200 device models** (183 phones, 17 tablets) ·
**9 categories · 68 products**.

---

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
```

The API endpoints are Vercel functions and do not run under `vite dev`. Submitting a request
locally will fail with a clear "could not reach the shop" error, which is the correct behaviour.
To exercise the API locally, run `npx vercel dev` with a Vercel login, or run the test suite,
which covers the whole pipeline without sending anything.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck (`tsc -b`) then production build |
| `npm run preview` | Serve the production build |
| `npm test` | 99 unit tests: catalog integrity, validation, API pipeline, email templates |
| `npm run qa` | 37 end-to-end checks in a real browser (functional, a11y, responsive) |
| `npm run qa -- --shots` | …and write screenshots to `qa-screenshots/` |
| `npm run preview:emails` | Render both emails to `email-preview/` for a Gmail render check |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` across app, api and node configs |

`npm run qa` needs a Chrome or Chromium binary; it uses Playwright with `channel: 'chrome'`.

---

## Before this goes live

Four things are on the shop owner, not the code:

1. **Shop details.** Fill in [`src/config/shop.ts`](src/config/shop.ts) — name, phone, WhatsApp,
   address, hours, maps link. Every user-facing string reads from that one file. Then update the
   matching static tags in [`index.html`](index.html) (title, description, Open Graph, JSON-LD),
   which cannot read from it.
2. **A Resend account** with a verified sending domain and an API key.
3. **Environment variables** on the host — see [`.env.example`](.env.example):
   `RESEND_API_KEY`, `SHOP_OWNER_EMAIL`, `MAIL_FROM`, and optionally `SHOP_NAME`.
   Never prefix any of these with `VITE_`; that would inline the key into the browser bundle.
4. **A Vercel project** connected to this repo.

Until `RESEND_API_KEY` is set the API returns an explicit failure and the UI tells the customer to
call the shop. It never fakes a success.

---

## Architecture

```text
Browser (React SPA)
    │  HTTPS POST /api/order  ·  /api/custom-request
    ▼
Vercel serverless function
    │  validate (Zod) → rate-limit → honeypot → idempotency
    ▼
Resend  ──►  Shop owner's inbox
```

### Layout

```text
src/
  config/shop.ts        Single source of truth for shop identity
  types/                Domain types (device, product, order)
  data/                 Brands, devices, categories, products, compatibility resolver
  hooks/                Catalog filtering + URL sync, overlay behaviour, motion, submission
  lib/                  API client, formatters, request IDs, scroll lock, analytics
  store/                Zustand: cart (persisted), UI overlays, toasts
  components/           layout · hero · device-finder · catalog · cart · order · ui
  styles/globals.css    Design tokens (Tailwind v4 `@theme`) — there is no tailwind.config
shared/validation.ts    Zod schemas used by BOTH the browser and the server
api/                    Serverless endpoints and their pipeline
emails/templates.ts     Transactional HTML + plain-text email
scripts/                QA harness, email preview generator
```

### Three decisions worth knowing

**Compatibility is a rule, not a list.** A product declares *what kind* of device it fits
(`{ brandIds: ['apple'], series: ['iPhone 15'] }`) and
[`src/data/compatibility.ts`](src/data/compatibility.ts) expands that into concrete device ids at
module load. Adding a phone is one line in [`src/data/devices.ts`](src/data/devices.ts); no
product record changes, and no component ever branches on a model name.

**Validation is written once.** [`shared/validation.ts`](shared/validation.ts) is imported by the
React forms *and* by the serverless handlers. The client uses it for UX; the server re-runs it
because client validation is not a security control. `z.strictObject` also means a request cannot
smuggle in an unexpected field — notably its own `to` address.

**Artwork is inline SVG.** The shop has no photography yet, and stock image URLs would make the
catalog depend on a CDN that can rot. Each product declares an art key which
[`ProductArt.tsx`](src/components/catalog/ProductArt.tsx) draws from a small set of parametric
shapes. Crisp at any size, zero network requests. Swapping in real photos later means changing
`Product.images` and that one component.

---

## Security

Covered by [`08_SECURITY_TESTING_CHECKLIST.md`](mobile-accessories-shop/mobile-accessories-shop-blueprint/08_SECURITY_TESTING_CHECKLIST.md)
and tested in [`api/_lib/__tests__/`](api/_lib/__tests__/):

- The API key lives only on the server. `.env` is git-ignored.
- **The recipient is always `SHOP_OWNER_EMAIL`.** The customer's address is used as reply-to and
  nothing else, so a request can never redirect mail to a third party.
- Every field is validated server-side, length-capped, and HTML-escaped before it reaches the
  email body — that body is entirely customer-controlled text.
- A hidden honeypot field, a 32 KB body cap, and IP rate limiting (8 requests / 10 minutes).
- Idempotency: the same request id is collapsed to one email, so a double-click or a retry after
  a timeout cannot mail the shop twice.
- Provider errors are logged server-side and never returned to the customer.

**Known limitation:** rate limiting and idempotency fall back to per-instance memory. Set
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` for a limiter shared across serverless
instances; without them the in-memory limiter is a speed bump, not a security boundary. The
server logs a warning at startup when it falls back.

---

## Progress and context

- [`TODO.md`](TODO.md) — the task list, traced back to the blueprint.
- [`memory.md`](memory.md) — decisions taken, gotchas, and what is still blocked on the owner.
