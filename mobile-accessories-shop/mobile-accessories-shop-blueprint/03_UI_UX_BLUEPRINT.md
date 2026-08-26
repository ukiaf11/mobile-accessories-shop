# UI/UX Blueprint

## 1. Visual Direction

Theme: premium mobile-tech retail.

Design characteristics:

- Large rounded cards.
- Glassmorphism used selectively.
- Soft shadows.
- Floating product visuals.
- Gradient accents.
- High-quality device/product mockups.
- Smooth micro-interactions.
- Large typography for major headlines.
- Compact, clean supporting text.

Avoid making every element animated. Motion should reinforce hierarchy and interaction.

## 2. Suggested Color System

Use a neutral base with one strong brand accent.

Example tokens:

```css
--background: #f7f8fa;
--surface: #ffffff;
--surface-soft: #eef1f5;
--text: #111827;
--text-muted: #667085;
--border: #e5e7eb;
--accent: #6d5dfc;
--accent-strong: #5143d9;
--success: #15803d;
--danger: #dc2626;
```

Exact colors can be adjusted to match the shop logo.

## 3. Page Structure

```text
App
├── AnnouncementBar
├── Navbar
├── HeroSection
├── DeviceFinderSection
├── CategorySection
├── FeaturedProductsSection
├── CompatibilitySection
├── WhyShopSection
├── CustomRequestSection
├── ContactCTASection
└── Footer
```

Overlay components:

```text
├── CartDrawer
├── ProductQuickView
├── OrderModal
├── ToastSystem
└── LoadingOverlay
```

## 4. Navigation

Desktop:

- Logo
- Home
- Accessories
- Find by Phone
- Custom Request
- Contact
- Cart icon

Mobile:

- Logo
- Cart icon
- Hamburger menu

Navbar should remain readable over hero imagery.

## 5. Hero UX

Use a split composition.

Left:

- Small eyebrow: `MOBILE ACCESSORIES`
- Main headline.
- Short description.
- `Find Accessories` CTA.
- `Custom Request` secondary CTA.

Right:

- Phone render.
- Floating case card.
- Floating tempered-glass card.
- Earbuds card.
- Cable/charger card.

Animation:

- Gentle vertical floating.
- Staggered entrance.
- Subtle parallax on pointer movement.

Respect `prefers-reduced-motion`.

## 6. Device Finder

This is the most important conversion section.

Headline:

> Find the right accessory for your phone

Interaction:

```text
[ Smartphone ] [ Tablet ]

Brand
[ Apple ▼ ]

Model
[ iPhone 15 Pro ▼ ]

[ Show compatible accessories ]
```

After selection, display a result summary:

> Accessories for iPhone 15 Pro

Then the category/product grid appears.

## 7. Category Cards

Display visually distinct cards:

- Cases
- Tempered Glass
- Audio
- Charging
- Power
- Holders
- Tablet
- More

Hover interaction:

- Slight lift.
- Image scale 1.03.
- Accent glow.

## 8. Product Cards

Recommended composition:

```text
┌────────────────────────────┐
│                 [Badge]    │
│                            │
│      Product Image         │
│                            │
├────────────────────────────┤
│ Clear MagSafe Case         │
│ iPhone 15 Pro              │
│                            │
│ ₹499             [Add]     │
└────────────────────────────┘
```

Mobile cards should not become too dense. Prefer 2-column grids on normal phones only when image/text remain legible.

## 9. Floating Cart

Desktop:

Small floating pill/card near bottom-right.

Example:

```text
🛒 3 items   ₹1,247    View Cart
```

Mobile:

Sticky bottom bar with safe-area spacing.

## 10. Order Drawer

Use a right-side drawer on desktop.

On mobile use a full-screen sheet.

Sections:

1. Customer details.
2. Device details.
3. Cart summary.
4. Fulfillment.
5. Notes.
6. Submit.

Submit CTA copy:

> Send Order Request

Avoid misleading payment language if no online payment exists.

## 11. Custom Request Section

This section should feel intentional rather than like an error fallback.

Headline:

> Can't find your model or accessory?

Supporting copy:

> Tell us what you need. We’ll check availability for your exact phone model.

Form should visibly support model-specific requests.

## 12. Trust Section

Suggested benefits:

- Model-specific fitting.
- Wide range of accessories.
- Local support.
- Easy order request.
- Quick availability confirmation.

Use icons and concise descriptions.

## 13. Motion System

Suggested motion levels:

### Level 1 — micro

- Button press.
- Hover lift.
- Icon rotate.

### Level 2 — component

- Card entrance.
- Modal slide-in.
- Drawer slide-in.

### Level 3 — hero

- Floating accessory layers.
- Subtle parallax.

Do not use continuous animation on every product card.

## 14. Empty States

Example:

> No matching accessories yet.
>
> Tell us your exact requirement and we’ll help you find it.
>
> [Send Custom Request]

## 15. Error/Success UX

Success:

- Checkmark animation.
- Request ID.
- Clear next step.

Error:

- Keep entered form data.
- State what failed.
- Offer retry.

## 16. Accessibility

- Avoid text embedded only inside images.
- Ensure interactive cards have actual buttons/links.
- Use `aria-label` where icon meaning is otherwise ambiguous.
- Trap focus inside modals.
- Close dialogs with Escape.
- Support keyboard navigation.
