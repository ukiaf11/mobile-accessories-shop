# Recommended Project Structure

```text
mobile-accessories-shop/
│
├── public/
│   ├── favicon.svg
│   ├── og-image.png
│   └── assets/
│       ├── brand/
│       ├── devices/
│       └── categories/
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AnnouncementBar.tsx
│   │   │
│   │   ├── hero/
│   │   │   ├── HeroSection.tsx
│   │   │   └── FloatingProduct.tsx
│   │   │
│   │   ├── device-finder/
│   │   │   ├── DeviceFinder.tsx
│   │   │   ├── BrandSelect.tsx
│   │   │   └── ModelSelect.tsx
│   │   │
│   │   ├── catalog/
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductQuickView.tsx
│   │   │   └── ProductFilters.tsx
│   │   │
│   │   ├── cart/
│   │   │   ├── CartButton.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   └── CartItem.tsx
│   │   │
│   │   ├── order/
│   │   │   ├── OrderForm.tsx
│   │   │   ├── OrderSummary.tsx
│   │   │   ├── CustomRequestForm.tsx
│   │   │   └── SuccessState.tsx
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       ├── Drawer.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       └── Toast.tsx
│   │
│   ├── data/
│   │   ├── brands.ts
│   │   ├── devices.ts
│   │   ├── categories.ts
│   │   └── products.ts
│   │
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useDeviceFilter.ts
│   │   └── useOrder.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── formatters.ts
│   │   └── validation.ts
│   │
│   ├── store/
│   │   └── cartStore.ts
│   │
│   ├── types/
│   │   ├── product.ts
│   │   ├── device.ts
│   │   └── order.ts
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   └── main.tsx
│
├── api/
│   ├── order.ts
│   └── custom-request.ts
│
├── emails/
│   ├── OrderRequestEmail.tsx
│   └── CustomRequestEmail.tsx
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## 1. Architectural Boundaries

### `components/`

UI and interaction only.

### `data/`

Catalog and compatibility data.

### `types/`

Shared TypeScript domain types.

### `lib/`

Reusable non-UI utilities.

### `api/`

Server-side request handling.

### `emails/`

Transactional email templates.

## 2. Important Rule

Do not put product compatibility business rules inside visual components.

Bad:

```ts
if (brand === 'Apple' && model === 'iPhone 15 Pro') {
  // custom product logic
}
```

Good:

```ts
const compatibleProducts = products.filter(product =>
  product.compatibleDeviceIds.includes(selectedDevice.id)
);
```

## 3. State Management

MVP can use:

- React Context + reducer, or
- Zustand.

Recommended for simplicity:

- Zustand for cart/UI state.
- URL/query parameters for shareable filters.

## 4. URL Behavior

Although the app is visually a SPA, use URLs such as:

```text
/?device=iphone-15-pro
/?category=tempered-glass
/?device=galaxy-a55&category=cases
```

This enables:

- Shareable product discovery.
- Better navigation.
- More useful browser history.
