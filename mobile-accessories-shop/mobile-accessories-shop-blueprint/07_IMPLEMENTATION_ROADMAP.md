# Implementation Roadmap

## Phase 1 — Foundation

- [ ] Initialize React + TypeScript + Vite.
- [ ] Install Tailwind CSS.
- [ ] Install Framer Motion.
- [ ] Install React Hook Form.
- [ ] Install Zod.
- [ ] Add Lucide React.
- [ ] Establish design tokens.
- [ ] Set up ESLint/Prettier.
- [ ] Add reusable UI primitives.

## Phase 2 — Catalog Data

- [ ] Add brands.
- [ ] Add device models.
- [ ] Add categories.
- [ ] Add initial products.
- [ ] Add compatibility mappings.
- [ ] Add product images.
- [ ] Add product badges/tags.

Start with a manageable catalog and expand it progressively.

## Phase 3 — Core UI

- [ ] Build navbar.
- [ ] Build hero.
- [ ] Build device finder.
- [ ] Build category section.
- [ ] Build product grid.
- [ ] Build product quick-view.
- [ ] Build cart drawer.
- [ ] Add responsive behavior.

## Phase 4 — Ordering

- [ ] Build order form.
- [ ] Build custom request form.
- [ ] Add shared validation schemas.
- [ ] Add request ID generation.
- [ ] Add loading/success/error states.

## Phase 5 — Email Backend

- [ ] Create Resend account.
- [ ] Verify sending domain.
- [ ] Create API key.
- [ ] Configure server environment variables.
- [ ] Build `/api/order`.
- [ ] Build `/api/custom-request`.
- [ ] Add server-side validation.
- [ ] Add rate limiting.
- [ ] Build branded HTML email templates.
- [ ] Test Gmail/mobile rendering.

## Phase 6 — Polish

- [ ] Add motion system.
- [ ] Add reduced-motion handling.
- [ ] Add skeleton loaders.
- [ ] Add empty states.
- [ ] Add toast notifications.
- [ ] Add accessibility review.
- [ ] Add SEO metadata.
- [ ] Optimize images.

## Phase 7 — QA

### Functional QA

- [ ] Brand filtering works.
- [ ] Model filtering works.
- [ ] Compatible products only are shown.
- [ ] Cart quantities work.
- [ ] Order request submits.
- [ ] Custom request submits.
- [ ] Duplicate submissions are controlled.
- [ ] Error state can recover.

### Responsive QA

- [ ] 360px mobile.
- [ ] 390px mobile.
- [ ] 768px tablet.
- [ ] 1024px laptop.
- [ ] 1440px desktop.
- [ ] 1920px large desktop.

### Accessibility QA

- [ ] Keyboard navigation.
- [ ] Focus management.
- [ ] Form labels.
- [ ] Screen-reader names.
- [ ] Reduced motion.
- [ ] Color contrast.

## Phase 8 — Launch

- [ ] Push project to GitHub.
- [ ] Deploy frontend/API.
- [ ] Add production environment variables.
- [ ] Verify email domain.
- [ ] Configure custom domain.
- [ ] Submit real test orders.
- [ ] Confirm owner receives emails.
- [ ] Confirm mobile usability.
- [ ] Add analytics if required.

## Phase 9 — Future Enhancements

Possible future additions:

- [ ] Supabase catalog database.
- [ ] Admin panel.
- [ ] Order history.
- [ ] Inventory status.
- [ ] Customer confirmation email.
- [ ] WhatsApp notification integration.
- [ ] Image upload for custom requests.
- [ ] Online payment.
- [ ] Coupon support.
- [ ] Delivery zones.
- [ ] Product reviews.
- [ ] Wishlist.
- [ ] PWA install support.

## Recommended MVP Boundary

Build the first release around one high-value loop:

```text
Find my phone
    ↓
Find compatible accessory
    ↓
Add to request/cart
    ↓
Enter phone/contact details
    ↓
Send request
    ↓
Shop receives email
```

This keeps the initial product focused while leaving the architecture ready for a full e-commerce system later.
