import type { CustomRequestInput, OrderRequestInput } from '../shared/validation';
import { escapeHtml, formatIst, money } from '../shared/text';

/**
 * Transactional email templates.
 *
 * Written as table-based HTML with inline styles on purpose: Gmail strips <style> blocks in
 * some clients, and Outlook ignores most modern CSS. No flexbox, no grid, no web fonts, no
 * external images — blueprint 05 section 5 ("keep the email usable in Gmail/mobile clients").
 *
 * Every interpolated value passes through escapeHtml. The body is entirely customer-supplied
 * text, so this is the injection boundary (blueprint 08 section 2).
 */

const BRAND = '#6d5dfc';
const INK = '#111827';
const MUTED = '#667085';
const LINE = '#e5e7eb';
const SOFT = '#f7f8fa';

interface ShellOptions {
  shopName: string;
  heading: string;
  requestId: string;
  submittedAt: Date;
  body: string;
}

function shell({ shopName, heading, requestId, submittedAt, body }: ShellOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${SOFT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
${escapeHtml(heading)} — ${escapeHtml(requestId)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SOFT};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <tr>
    <td style="background:${BRAND};padding:22px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
            ${escapeHtml(shopName)}
          </td>
          <td align="right" style="color:#ffffff;font-size:12px;opacity:0.85;">
            ${escapeHtml(formatIst(submittedAt))}
          </td>
        </tr>
      </table>
      <div style="color:#ffffff;font-size:21px;font-weight:800;margin-top:10px;line-height:1.25;">
        ${escapeHtml(heading)}
      </div>
      <div style="display:inline-block;margin-top:12px;background:rgba(255,255,255,0.18);border-radius:999px;padding:6px 14px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
        ${escapeHtml(requestId)}
      </div>
    </td>
  </tr>

  <tr><td style="padding:24px;">${body}</td></tr>

  <tr>
    <td style="background:${SOFT};border-top:1px solid ${LINE};padding:16px 24px;color:${MUTED};font-size:12px;line-height:1.6;">
      Sent automatically from the ${escapeHtml(shopName)} website.
      Reply to this email to reach the customer directly.
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function sectionTitle(text: string): string {
  return `<div style="color:${MUTED};font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;margin:22px 0 8px;">${escapeHtml(text)}</div>`;
}

function rows(pairs: Array<[string, string | undefined]>): string {
  const visible = pairs.filter((pair): pair is [string, string] => Boolean(pair[1]));
  if (visible.length === 0) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:10px;overflow:hidden;">
${visible
  .map(
    ([label, value], index) => `<tr style="background:${index % 2 === 0 ? '#ffffff' : SOFT};">
  <td style="padding:10px 14px;color:${MUTED};font-size:13px;width:36%;vertical-align:top;">${escapeHtml(label)}</td>
  <td style="padding:10px 14px;color:${INK};font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
</tr>`,
  )
  .join('\n')}
</table>`;
}

/** `smartphone` -> `Smartphone`. The value is an internal enum, not customer text. */
function titleCase(value: string | undefined): string | undefined {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function noteCard(label: string, text: string): string {
  return `${sectionTitle(label)}
<div style="border:1px solid ${LINE};border-left:3px solid ${BRAND};border-radius:10px;padding:13px 15px;color:${INK};font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(text)}</div>`;
}

function callButton(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;">
  <tr><td style="background:${BRAND};border-radius:10px;">
    <a href="tel:${escapeHtml(digits)}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
      Call ${escapeHtml(phone)}
    </a>
  </td></tr>
</table>`;
}

/* ── Order request ─────────────────────────────────────────────────────────── */

export function orderEmail(
  payload: OrderRequestInput,
  shopName: string,
  submittedAt: Date,
): { subject: string; html: string; text: string } {
  const total = payload.items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.quantity,
    0,
  );
  const hasAskPrice = payload.items.some((item) => item.unitPrice === undefined);

  const itemRows = payload.items
    .map(
      (item, index) => `<tr style="background:${index % 2 === 0 ? '#ffffff' : SOFT};">
  <td style="padding:11px 14px;color:${INK};font-size:14px;vertical-align:top;">
    <strong>${escapeHtml(item.name)}</strong>
    ${item.variant ? `<br><span style="color:${MUTED};font-size:12px;">${escapeHtml(item.variant)}</span>` : ''}
    ${item.deviceName ? `<br><span style="color:${BRAND};font-size:12px;">${escapeHtml(item.deviceName)}</span>` : ''}
  </td>
  <td align="center" style="padding:11px 8px;color:${INK};font-size:14px;font-weight:700;white-space:nowrap;vertical-align:top;">
    ${item.quantity} ×
  </td>
  <td align="right" style="padding:11px 14px;color:${INK};font-size:14px;font-weight:700;white-space:nowrap;vertical-align:top;">
    ${escapeHtml(money(item.unitPrice === undefined ? undefined : item.unitPrice * item.quantity))}
  </td>
</tr>`,
    )
    .join('\n');

  const body = `
<p style="margin:0;color:${INK};font-size:15px;line-height:1.6;">
  A customer has sent an order request from the website. Call them to confirm availability
  and the final price.
</p>

${sectionTitle('Customer')}
${rows([
  ['Name', payload.customer.name],
  ['Phone', payload.customer.phone],
  ['Email', payload.customer.email],
])}
${callButton(payload.customer.phone)}

${sectionTitle('Device')}
${rows([
  ['Type', titleCase(payload.device.type)],
  ['Brand', payload.device.brand],
  ['Model', payload.device.model ?? 'Not specified'],
])}

${sectionTitle(`Items (${payload.items.length})`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:10px;overflow:hidden;">
${itemRows}
<tr style="background:${INK};">
  <td colspan="2" style="padding:12px 14px;color:#ffffff;font-size:13px;font-weight:600;">
    ${hasAskPrice ? 'Estimated subtotal (some items priced on request)' : 'Estimated subtotal'}
  </td>
  <td align="right" style="padding:12px 14px;color:#ffffff;font-size:15px;font-weight:800;white-space:nowrap;">
    ${hasAskPrice ? 'from ' : ''}${escapeHtml(money(total))}
  </td>
</tr>
</table>

${sectionTitle('Fulfillment')}
${rows([
  ['Preference', payload.fulfillment === 'delivery' ? 'Local delivery' : 'Shop pickup'],
  ['Address', payload.address],
])}

${payload.notes ? noteCard('Customer notes', payload.notes) : ''}

${sectionTitle('Submitted at')}
<div style="color:${INK};font-size:14px;font-weight:600;">${escapeHtml(formatIst(submittedAt))}</div>
`;

  const text = [
    'NEW ORDER REQUEST',
    '',
    `Request ID: ${payload.requestId}`,
    'Request Type: Product Order',
    '',
    'CUSTOMER',
    `Name: ${payload.customer.name}`,
    `Phone: ${payload.customer.phone}`,
    payload.customer.email ? `Email: ${payload.customer.email}` : null,
    '',
    'DEVICE',
    payload.device.type ? `Type: ${titleCase(payload.device.type)}` : null,
    payload.device.brand ? `Brand: ${payload.device.brand}` : null,
    `Model: ${payload.device.model ?? 'Not specified'}`,
    '',
    'ITEMS',
    ...payload.items.map(
      (item) =>
        `${item.quantity} × ${item.name}` +
        `${item.variant ? ` (${item.variant})` : ''}` +
        `${item.deviceName ? ` — ${item.deviceName}` : ''}` +
        ` — ${money(item.unitPrice === undefined ? undefined : item.unitPrice * item.quantity)}`,
    ),
    `${hasAskPrice ? 'Estimated subtotal (from): ' : 'Estimated subtotal: '}${money(total)}`,
    '',
    'FULFILLMENT',
    payload.fulfillment === 'delivery' ? 'Local delivery' : 'Shop pickup',
    payload.address ? `Address: ${payload.address}` : null,
    '',
    payload.notes ? 'NOTES' : null,
    payload.notes ?? null,
    payload.notes ? '' : null,
    'SUBMITTED AT',
    formatIst(submittedAt),
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    subject: `New Mobile Accessories Order Request — ${payload.requestId}`,
    html: shell({
      shopName,
      heading: 'New order request',
      requestId: payload.requestId,
      submittedAt,
      body,
    }),
    text,
  };
}

/* ── Custom request ────────────────────────────────────────────────────────── */

export function customRequestEmail(
  payload: CustomRequestInput,
  shopName: string,
  submittedAt: Date,
): { subject: string; html: string; text: string } {
  const model = payload.device.model ?? payload.device.otherModel ?? 'Not specified';

  const body = `
<p style="margin:0;color:${INK};font-size:15px;line-height:1.6;">
  A customer could not find what they need in the catalog and has described it directly.
</p>

${sectionTitle('Customer')}
${rows([
  ['Name', payload.customer.name],
  ['Phone', payload.customer.phone],
  ['Email', payload.customer.email],
])}
${callButton(payload.customer.phone)}

${sectionTitle('Device')}
${rows([
  ['Type', titleCase(payload.device.type)],
  ['Brand', payload.device.brand],
  ['Model', model],
  payload.device.otherModel && payload.device.model !== payload.device.otherModel
    ? ['Typed by customer', payload.device.otherModel]
    : ['', undefined],
])}

${sectionTitle('Requested item')}
${rows([
  ['Item', payload.item],
  ['Quantity', String(payload.quantity)],
])}

${noteCard('Description', payload.description)}

${sectionTitle('Fulfillment')}
${rows([
  ['Preference', payload.fulfillment === 'delivery' ? 'Local delivery' : 'Shop pickup'],
  ['Address', payload.address],
])}

${sectionTitle('Submitted at')}
<div style="color:${INK};font-size:14px;font-weight:600;">${escapeHtml(formatIst(submittedAt))}</div>
`;

  const text = [
    'CUSTOM ACCESSORY REQUEST',
    '',
    `Request ID: ${payload.requestId}`,
    'Request Type: Custom Request',
    '',
    'CUSTOMER',
    `Name: ${payload.customer.name}`,
    `Phone: ${payload.customer.phone}`,
    payload.customer.email ? `Email: ${payload.customer.email}` : null,
    '',
    'DEVICE',
    payload.device.type ? `Type: ${titleCase(payload.device.type)}` : null,
    payload.device.brand ? `Brand: ${payload.device.brand}` : null,
    `Model: ${model}`,
    '',
    'REQUESTED ITEM',
    `Item: ${payload.item}`,
    `Quantity: ${payload.quantity}`,
    '',
    'DESCRIPTION',
    payload.description,
    '',
    'FULFILLMENT',
    payload.fulfillment === 'delivery' ? 'Local delivery' : 'Shop pickup',
    payload.address ? `Address: ${payload.address}` : null,
    '',
    'SUBMITTED AT',
    formatIst(submittedAt),
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    subject: `Custom Accessory Request — ${payload.requestId}`,
    html: shell({
      shopName,
      heading: 'Custom accessory request',
      requestId: payload.requestId,
      submittedAt,
      body,
    }),
    text,
  };
}
