# Technical Stack & Architecture

## 1. Recommended Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Hook Form
- Zod
- Lucide React

### Backend/API

Use a very small serverless backend rather than a traditional server for the MVP.

Recommended:

- Vercel serverless/route function
- Node.js runtime
- Resend email API

### Optional persistence

For the first release:

- Product/device data stored as typed local JSON/TS data.
- Cart stored only in client state.
- No database required.

For Phase 2:

- Supabase/PostgreSQL for catalog, order records and availability.

## 2. Why This Architecture

The website is primarily a storefront/catalog and request collector. A full backend would add operational complexity before it is needed.

A serverless email endpoint gives the project:

- Low infrastructure overhead.
- No permanent server to maintain.
- Secure handling of the email API key.
- Easy deployment.
- Simple future expansion into database-backed orders.

## 3. High-Level Architecture

```text
Customer Browser
      |
      | React SPA
      v
+------------------------+
| Catalog / Device UX    |
| Cart / Order Forms     |
| Custom Request Form    |
+------------------------+
      |
      | HTTPS POST
      v
+------------------------+
| Serverless Order API   |
| - validate input       |
| - rate-limit           |
| - build email          |
| - send request         |
+------------------------+
      |
      | HTTPS API
      v
+------------------------+
| Resend                 |
| Transactional Email    |
+------------------------+
      |
      v
Shop Owner Inbox
```

## 4. Email Provider Decision

### Recommended: Resend

Current official pricing lists a Free tier with:

- 3,000 emails/month.
- 100 emails/day.
- 3 verified domains.
- 30-day data retention.

This is a good fit for a small local shop where order emails are transactional and low volume. citeturn494913search2turn494913search8

### Alternative: EmailJS

EmailJS currently advertises a Free plan with 200 monthly requests and 2 email templates. It is viable for a small MVP, but the recommended architecture is still server-side email delivery when possible. citeturn494913search0

## 5. Environment Variables

Example:

```env
RESEND_API_KEY=re_xxxxxxxxx
SHOP_OWNER_EMAIL=owner@example.com
MAIL_FROM=orders@yourdomain.com
```

Never expose `RESEND_API_KEY` to Vite client-side variables such as `VITE_RESEND_API_KEY`.

## 6. Request/Response Contract

### POST /api/order

Request:

```json
{
  "requestType": "order",
  "customer": {
    "name": "Rahul",
    "phone": "+91XXXXXXXXXX",
    "email": "customer@example.com"
  },
  "device": {
    "type": "smartphone",
    "brand": "Samsung",
    "model": "Galaxy A55"
  },
  "items": [
    {
      "productId": "case-clear-001",
      "name": "Clear Shockproof Case",
      "quantity": 1,
      "unitPrice": 299
    }
  ],
  "fulfillment": "pickup",
  "notes": "Please confirm availability."
}
```

Response:

```json
{
  "success": true,
  "requestId": "MAS-20260826-8F2K"
}
```

## 7. Validation Rules

Validate with Zod on the server even if the client also validates with the same schema.

Important rules:

- Name: 2–80 characters.
- Phone: reasonable Indian/international mobile format.
- Email: optional but valid if supplied.
- Brand/model: values from catalog or explicit `other` path.
- Quantity: integer 1–20 per line item unless business rules change.
- Notes: maximum length such as 1,500 characters.

## 8. Rate Limiting

The public order endpoint must not be unlimited.

MVP options:

- Vercel-compatible IP-based rate limiting.
- Upstash Redis if a persistent distributed limiter is needed.
- Temporary lightweight protection for early development.

A production deployment should also use a honeypot field and/or CAPTCHA only when abuse appears.

## 9. Deployment

Recommended:

```text
GitHub
  -> Vercel
     -> React/Vite build
     -> Serverless API
```

Domain:

```text
www.yourshop.in
```

Email:

```text
orders@yourshop.in
```

Use a verified sending domain for production email.
