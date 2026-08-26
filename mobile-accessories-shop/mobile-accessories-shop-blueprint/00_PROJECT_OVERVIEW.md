# Mobile Accessories Shop — Project Blueprint

## 1. Project Vision

Build a premium, modern single-page e-commerce-style website for a mobile accessories shop that sells accessories for a wide range of smartphone and tablet models.

The experience should feel like a polished retail storefront rather than a generic product catalog. Customers should be able to:

- Browse accessories by category.
- Select their mobile/tablet brand and exact model.
- Find products compatible with that model.
- Add products to a cart.
- Submit an order/request with contact details.
- Submit a completely custom requirement when they cannot find a product.
- Receive a clear confirmation after submission.
- Trigger an email directly to the shop owner through a secure server-side email service.

## 2. Recommended Product Scope

### Core mobile accessories

- Phone covers / cases
- Rugged protective cases
- Transparent silicone cases
- MagSafe-compatible cases
- Wallet cases
- Flip covers
- Camera lens protectors
- Tempered glass
- Privacy tempered glass
- Full-adhesive / edge-to-edge glass
- Hydrogel screen protectors
- Back film / skin protectors
- Charging cables
- USB-C cables
- Lightning cables
- Micro-USB cables
- Fast chargers
- USB-C PD chargers
- Car chargers
- Wireless chargers
- MagSafe chargers
- Power banks
- Bluetooth headphones
- TWS earbuds
- Neckbands
- Wired earphones
- Bluetooth speakers
- Mini hand fans
- Mobile stands
- Foldable phone stands
- Car phone holders
- Ring holders / finger grips
- Pop grips
- Selfie sticks
- Tripods
- OTG adapters
- USB-C hubs
- Card readers
- SIM ejector tools
- Cleaning kits
- Charging adapters
- Travel charging kits
- Smartwatch straps
- Tablet covers
- Tablet tempered glass
- Laptop / tablet sleeves

## 3. Device Coverage

The catalog should support model-level compatibility rather than only brand-level filtering.

### Apple

- iPhone SE series
- iPhone 11 / 11 Pro / 11 Pro Max
- iPhone 12 / 12 mini / 12 Pro / 12 Pro Max
- iPhone 13 family
- iPhone 14 family
- iPhone 15 family
- iPhone 16 family
- Newer iPhone models should be addable without changing application logic.
- iPad / iPad Air / iPad mini / iPad Pro families

### Samsung

- Galaxy S series
- Galaxy A series
- Galaxy M series
- Galaxy F series
- Galaxy Note series
- Galaxy Z Fold series
- Galaxy Z Flip series
- Galaxy Tab series

### Google

- Pixel 6 family
- Pixel 7 family
- Pixel 8 family
- Pixel 9 family
- Pixel 10 family or future additions
- Pixel A-series

### Other Android brands

- OnePlus
- Xiaomi
- Redmi
- POCO
- Realme
- Oppo
- Vivo
- Motorola
- Nothing
- Nokia
- Asus
- Infinix
- Tecno
- iQOO
- Honor
- Huawei
- Lava
- Itel

The system must make it easy for the shop owner/developer to add future brands and models through data files instead of hardcoding UI logic.

## 4. Core UX Principle

The customer should not have to understand the technical catalog structure.

Primary question presented by the UI:

> "What phone do you have?"

Then:

> "What do you need for it?"

The interface progressively narrows results based on device compatibility.

## 5. Success Criteria

A successful MVP should allow a customer to complete an order request in approximately 1–3 minutes.

The customer should always know:

- What they selected.
- Which mobile model the selection applies to.
- Quantity.
- Approximate/actual product price where available.
- Their contact details.
- Whether the request has been successfully sent.

## 6. Non-Goals for MVP

Avoid unnecessary complexity in the first release:

- No customer account system.
- No password/authentication flow.
- No online payment gateway unless business requirements change.
- No large admin dashboard initially.
- No inventory-management system initially.
- No complex delivery tracking initially.

The website should function primarily as a beautiful catalog + order/request collection system.
