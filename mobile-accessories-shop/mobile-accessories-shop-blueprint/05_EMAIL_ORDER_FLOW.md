# Order & Email Flow

## 1. Primary Order Flow

```text
Customer selects phone
        ↓
Customer selects accessory
        ↓
Add to cart
        ↓
Open cart
        ↓
Enter customer details
        ↓
Client-side validation
        ↓
POST /api/order
        ↓
Server-side validation
        ↓
Spam/rate-limit checks
        ↓
Generate request ID
        ↓
Send transactional email
        ↓
Return success
        ↓
Show request ID to customer
```

## 2. Custom Request Flow

```text
Custom Request CTA
      ↓
Customer enters exact requirement
      ↓
Select brand/model or Other
      ↓
Enter description
      ↓
Submit
      ↓
Server validates
      ↓
Email shop owner
      ↓
Show confirmation
```

## 3. Email Content

Recommended email subject:

```text
New Mobile Accessories Order Request — MAS-20260826-8F2K
```

Email body should have clear sections:

```text
NEW ORDER REQUEST

Request ID: MAS-20260826-8F2K
Request Type: Product Order

CUSTOMER
Name: Rahul Kumar
Phone: +91XXXXXXXXXX
Email: customer@example.com

DEVICE
Type: Smartphone
Brand: Samsung
Model: Galaxy A55

ITEMS
1 × Clear Shockproof Case — ₹299
1 × Tempered Glass — ₹199

FULFILLMENT
Pickup

NOTES
Please confirm availability.

SUBMITTED AT
26 Aug 2026, 08:30 IST
```

## 4. Custom Request Email

Subject:

```text
Custom Accessory Request — MAS-20260826-C7P4
```

Include:

- Customer details.
- Device details.
- Requested item.
- Description.
- Quantity.
- Any optional attachment metadata.

## 5. Email Design

Use an HTML email with:

- Shop logo.
- Branded header.
- Request ID badge.
- Customer section.
- Product table.
- Device section.
- Notes card.
- Simple footer.

Keep the email usable in Gmail/mobile clients. Avoid complex CSS dependencies.

## 6. Important Security Rule

Do NOT send the request directly from browser JavaScript using a private email API key.

Correct:

```text
Browser → Serverless API → Resend → Shop Owner
```

Avoid:

```text
Browser → Resend with secret key
```

## 7. Idempotency

Use a request/order ID and an idempotency strategy to reduce accidental duplicate submissions.

The email service supports idempotency keys for email requests. citeturn494913search9

## 8. Customer Confirmation

Do not promise an order is accepted or paid unless the shop actually implements those operations.

Use language such as:

> Your request has been sent to the shop. The shop will confirm availability and final pricing.

## 9. Optional Customer Confirmation Email

Phase 2 can send the customer a copy of the request.

That second email should be optional because the initial requirement is only delivery to the shop owner.

## 10. Email Failure Behavior

If email delivery fails:

1. Do not show false success.
2. Preserve the request data in memory/client form.
3. Show a retry action.
4. Provide a shop phone/contact fallback.
5. Log the server-side error without exposing sensitive provider details.
