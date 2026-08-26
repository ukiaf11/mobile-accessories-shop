# Functional & Non-Functional Requirements

## 1. Functional Requirements

### FR-01 — Hero section

Display:

- Shop identity/logo.
- Strong headline.
- Supporting description.
- Primary CTA: `Find Accessories`.
- Secondary CTA: `Custom Request`.
- Visual product composition with subtle floating animation.

Suggested value proposition:

> Covers, tempered glass & mobile accessories for almost every phone model.

### FR-02 — Device selector

Provide a highly visible device selector with:

1. Device type: Smartphone / Tablet.
2. Brand.
3. Model.
4. Optional variant where needed.

The selector should update catalog results dynamically.

### FR-03 — Product categories

Recommended categories:

- Cases
- Tempered Glass
- Audio
- Charging
- Power
- Holders & Stands
- Tablet Accessories
- Smart Accessories
- Utility Accessories
- Custom / Other

### FR-04 — Product catalog

Each product card should support:

- Product image.
- Product name.
- Category.
- Compatible model(s).
- Price or `Ask Price`.
- Availability status.
- Badge such as `Popular`, `New`, `Best Seller`.
- Add-to-cart CTA.
- Quick-view CTA.

### FR-05 — Compatibility filter

Filters should include:

- Brand.
- Model.
- Category.
- Price range.
- Availability.
- Feature/tag.

Example tags:

- MagSafe
- Shockproof
- Transparent
- Privacy
- Fast Charging
- Wireless
- Foldable
- Premium

### FR-06 — Product detail drawer/modal

Do not navigate away from the SPA for basic product inspection.

The quick-view modal should display:

- Large product image.
- Product name.
- Description.
- Compatibility.
- Price.
- Available variants/colors where relevant.
- Quantity selector.
- Add to cart.

### FR-07 — Cart

A floating cart should be accessible from every point of the page.

Cart should show:

- Product.
- Selected device model.
- Quantity.
- Unit price.
- Estimated subtotal.
- Remove action.
- Edit quantity.
- Continue shopping.
- Proceed to order.

### FR-08 — Order form

Required fields:

- Customer name.
- Mobile number.
- Optional email.
- Delivery/pickup preference.
- Address or locality if delivery is supported.
- Selected products.
- Device model.
- Additional note.

### FR-09 — Custom order request

Customers should be able to submit:

- Customer name.
- Contact number.
- Email (optional).
- Brand.
- Model.
- Requested item.
- Quantity.
- Detailed description.
- Optional reference image upload in a later phase.

Example:

> "I need a transparent camera-protection case for Samsung Galaxy A55. I cannot find the model in the catalog."

### FR-10 — Order email

After form validation, send an email to the shop owner containing:

- Request type.
- Customer information.
- Selected device.
- Product list.
- Quantity.
- Customer notes.
- Timestamp.
- Unique request/order reference.

### FR-11 — Success state

Show a polished success state, not a browser alert.

Example:

> Request received
>
> Your requirement has been sent to the shop. Please keep your phone available for confirmation.
>
> Request ID: MAS-20260826-8F2K

### FR-12 — Error handling

Provide clear UI errors for:

- Invalid phone number.
- Missing required fields.
- Unsupported model.
- Email service failure.
- Network failure.
- Rate-limit response.

Never expose API keys, server errors, stack traces, or provider-specific secrets to customers.

## 2. Non-Functional Requirements

### Performance

Target:

- Lighthouse performance: 90+ where practical.
- Responsive images.
- Lazy-loaded catalog images.
- Minimal JavaScript for static sections.

### Accessibility

- Keyboard navigable.
- Visible focus states.
- Semantic HTML.
- Proper labels for form fields.
- Sufficient contrast.
- Reduced-motion support.
- Alt text for product imagery.

### Responsive design

Design from mobile upward.

Breakpoints should support:

- Small mobile.
- Large mobile.
- Tablet.
- Desktop.
- Wide desktop.

### Security

- Email provider credentials only on server-side.
- Server-side input validation.
- Rate limiting for order endpoint.
- Spam protection/honeypot.
- Strict file validation if uploads are added.
- No customer-sensitive data stored in localStorage beyond temporary cart information.

## 3. SEO

Although the experience is a SPA, include:

- Descriptive page title.
- Meta description.
- Open Graph metadata.
- Product/category structured data where appropriate.
- Semantic heading hierarchy.
- Clean descriptive copy.

## 4. Analytics (optional)

Track high-level events:

- `device_selected`
- `category_selected`
- `product_viewed`
- `add_to_cart`
- `cart_opened`
- `order_started`
- `order_submitted`
- `custom_request_submitted`

Do not collect unnecessary personal information for analytics.
