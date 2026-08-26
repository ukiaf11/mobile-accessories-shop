# Project Memory — Mobile Accessories Shop

Living record of decisions, state and gotchas for this repo. Update it as work lands;
do not let it drift from reality.

---

## 1. What this is

A premium single-page storefront for a mobile accessories shop. The customer picks their exact
phone/tablet model, browses only accessories that fit it, builds a request cart, and submits an
order request. A serverless endpoint validates the request and emails the shop owner. There is
**no payment, no login, no database** in the MVP — by design (see `00_PROJECT_OVERVIEW.md` §6).

Blueprint lives at `mobile-accessories-shop/mobile-accessories-shop-blueprint/` (10 docs).
That nested path is where the user placed it; it is intentionally left in place so existing
references keep working.

Core loop: **Find my phone → find compatible accessory → add to request → enter contact →
send → shop receives email.**

---

## 2. Decisions taken (2026-08-26)

| Decision | Choice | Why |
| --- | --- | --- |
| Hosting | **Vercel** | Blueprint recommendation; SPA + serverless API in one deploy. Vercel CLI already installed on this machine. |
| Shop identity | **Placeholders in `src/config/shop.ts`** | Every user-facing name/phone/address/email is read from one file so the owner swaps real values in one place. Nothing hardcoded in components. |
| Catalog size | **Broad & realistic** | ~20 brands, ~150+ device models, 9 categories, ~60–80 products. Enough to feel like a real shop without a database. |
| Email provider | **Resend** | Per blueprint §02.4. Free tier 3,000/mo, 100/day. Key stays server-side only. |
| State | **Zustand** | Blueprint §06.3 recommendation; cart + UI state. |
| Compatibility | **Rule-based, expanded to `compatibleDeviceIds` at load** | Blueprint §04.9 warns against duplicating product records for large catalogs. Products declare rules (brand/series/device/type); a resolver expands them. Public `Product` type still exposes `compatibleDeviceIds` exactly as the blueprint specifies. |

### Stack as actually installed

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 (`@tailwindcss/vite`, no JS config file —
tokens live in `@theme` inside `src/styles/globals.css`) · Framer Motion 13 · React Hook Form 7 ·
Zod 4 · Zustand 5 · Lucide React · Resend 6 · oxlint (Vite 8's default linter, replaces ESLint).

---

## 3. Gotchas that cost time

- **Tailwind v4 has no `tailwind.config.ts`.** The blueprint's project-structure doc lists one
  (written against v3). Design tokens are declared with `@theme` in CSS instead. Do not add a JS
  config expecting it to be read.
- **Zod v4 renames:** use `z.email()` not `z.string().email()`, and `z.strictObject()` not
  `.strict()`. The old forms are deprecated and noisy.
- **Push needs the `github-second` SSH alias.** The default key on this machine (`upendrabol7`)
  is DENIED on `ukiaf11` repos. Remote must be `git@github-second:ukiaf11/mobile-accessories-shop.git`,
  same as Hotel-Web, ACO and portfolio.
- **Vercel scope is resolved.** `vercel login` as `ukiaf11-7428` now reaches team
  `upendras-projects-34931334`, which holds hotel-web, portfolio and this project. The older note
  about a token seeing zero projects no longer applies to the CLI session on this machine.
- **`RESEND_API_KEY` must never be `VITE_`-prefixed.** Anything prefixed `VITE_` is inlined into
  the client bundle. Blueprint §02.5.
- **Playwright matches accessible names as a case-insensitive *substring*.** `name: 'Send Order
  Request'` also matched the dialog's `Close send order request` button. `exact: true` fixes it,
  but `getByLabel` then breaks because the label text includes the required asterisk — use
  `getByRole('combobox', { name })` for selects instead.
- **Three Vercel-specific traps cost the most time here, and none show up locally:**
  1. Vercel compiles `api/**` with the **root `tsconfig.json`**, not `tsconfig.api.json`. Ours had
     only `references` and no `compilerOptions`, so it defaulted to `moduleResolution: nodenext`
     and no Node types — every function failed to build. The root config now carries real options.
  2. Vercel **transpiles but does not bundle** the functions, so Node ESM has to resolve the
     relative imports itself and needs explicit `.js` extensions. Everything under `api/`,
     `emails/` and `shared/` imports as `'../shared/validation.js'`. TS bundler resolution,
     Vite and Vitest all map that back to the `.ts` file, so one spelling works everywhere.
  3. Vercel's Node runtime invokes handlers as `(req: IncomingMessage, res: ServerResponse)`,
     **not** with a Web `Request` — `export const config = { runtime: 'nodejs' }` does not change
     that. `api/_lib/node-adapter.ts` bridges the two so the pipeline and its tests stay
     Web-standard. Symptom was `request.headers.get is not a function`.

  All three only appear in the deployed function's **runtime** logs
  (`vercel logs <deployment-url>`); the build log only showed the first.
- **Do not run `pkill -f vercel` from a shell whose own command line contains "vercel"** — it
  matches and kills itself, and the rest of the command silently never runs.

---

## 4. Current state

Tracked in [TODO.md](TODO.md) — that file is the authoritative task list. Summary here only.

Phases 1–7 are **done and verified**. Phase 8 is blocked on the owner's accounts.

- Catalog: 21 brands, 200 device models (183 phones, 17 tablets), 9 categories, 68 products,
  10,195 resolved compatibility edges.
- `npm test` — 99 unit tests green (catalog integrity, validation, API pipeline, endpoints,
  email templates, request IDs).
- `npm run qa` — 37 browser checks green against the production build.
- `npm run build` — clean. `npm run lint` — clean.
- **Live: https://mobile-accessories-shop-fawn.vercel.app** (Vercel project
  `mobile-accessories-shop` under team `upendras-projects-34931334`). Both endpoints verified
  against production, including validation, recipient-smuggling rejection and rate limiting.

### Bugs QA caught that code review had not

Worth remembering because none of them were visible from reading the code:

1. **`useOverlayBehaviour` depended on `onClose`**, a fresh closure every render, so the effect
   tore down and re-ran constantly — cancelling autofocus and yanking focus back to the trigger.
   The focus trap did not work at all. Fixed by holding `onClose` in a ref and keying the effect
   on `open` alone.
2. **`body { overflow: hidden }` lost the scroll position.** Opening the cart threw the customer
   to the top of the page. Replaced with a proper `position: fixed` lock in `src/lib/scroll-lock.ts`.
3. **Adding to the cart swapped the grid for skeletons**, collapsing page height mid-scroll.
   Skeletons now render on first paint only; filter changes just dip opacity.
4. **Quick-view quantity reset to 1 on every render** because `product.variants ?? []` allocated a
   new array each time and re-triggered a reset effect. The stepper was unusable. The parent
   already remounts via `key`, so the effect was deleted outright.
5. **`content-visibility: auto`** mis-estimated card heights, which moved the scroll position and
   left the grid blank in print and full-page screenshots. Removed in favour of `contain: layout`.

The lesson: the E2E harness in `scripts/qa.mjs` earns its keep. Run it after any change to
overlays, the grid, or scroll behaviour.

---

## 5. What the owner must supply before launch

1. Real values in `src/config/shop.ts` (name, phone, WhatsApp, address, hours, maps link).
2. A Resend account, a verified sending domain, and an API key.
3. Vercel env vars: `RESEND_API_KEY`, `SHOP_OWNER_EMAIL`, `MAIL_FROM`.
4. A Vercel login in the scope that should own the project.

Until `RESEND_API_KEY` is set the API returns a clean, explicit failure — it never fakes success.
That is deliberate (blueprint §05.10).
