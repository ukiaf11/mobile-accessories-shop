# Security, Abuse Prevention & Testing Checklist

## 1. Secrets

- [ ] No Resend API key in frontend source.
- [ ] No API key in Git.
- [ ] Production secrets stored in hosting environment variables.
- [ ] `.env` ignored.

## 2. Input Validation

- [ ] Validate all fields client-side for UX.
- [ ] Validate all fields server-side for security.
- [ ] Limit string lengths.
- [ ] Sanitize or safely escape user-provided email content.
- [ ] Reject unexpected fields where practical.

## 3. Spam Prevention

- [ ] Hidden honeypot field.
- [ ] Rate-limit order API.
- [ ] Consider CAPTCHA only when required.
- [ ] Limit request body size.

## 4. Email Abuse Prevention

Do not let customers supply arbitrary recipient addresses.

Bad:

```json
{
  "to": "attacker@example.com"
}
```

Good:

```text
Server always sends to SHOP_OWNER_EMAIL.
```

The customer email should be treated as reply-to/contact information, not as the destination.

## 5. File Uploads

For future custom-request images:

- [ ] Allow only expected MIME types.
- [ ] Restrict file size.
- [ ] Generate safe filenames.
- [ ] Scan/process files where appropriate.
- [ ] Prefer object storage rather than sending arbitrary files through the email API.

## 6. Testing Scenarios

### Normal order

```text
Apple → iPhone 15 Pro → Case → Qty 1 → Submit
```

### Multiple items

```text
iPhone 15 Pro case + tempered glass + charger
```

### Unsupported model

```text
Unknown brand/model → Custom Request
```

### Invalid phone

Expected: inline validation.

### Email service failure

Expected: no false success.

### Spam

Expected: rate-limit response after threshold.

### Duplicate click

Expected: duplicate submission protection.

### Network disconnect

Expected: recoverable error without losing entered data.

## 7. Production Readiness

The first version should not be considered production-ready until:

- Email delivery is verified.
- Server secrets are protected.
- Rate limiting exists.
- Forms have server-side validation.
- Mobile layout is tested.
- Error handling is tested.
- The owner can receive a real order request end-to-end.
