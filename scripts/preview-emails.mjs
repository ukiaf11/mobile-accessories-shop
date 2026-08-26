/**
 * Renders both transactional emails to `email-preview/` so their layout can be checked
 * without spending a real send. Blueprint 07 Phase 5 asks for a Gmail/mobile render test;
 * this produces the exact HTML that Resend would deliver.
 *
 *   npm run preview:emails
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('tsx/cjs');
const { orderEmail, customRequestEmail } = require('../emails/templates.ts');

const OUT = new URL('../email-preview/', import.meta.url).pathname;
const AT = new Date('2026-08-26T03:00:00.000Z');
const SHOP = process.env.SHOP_NAME || 'Mobile Accessories Shop';

const order = {
  requestType: 'order',
  customer: { name: 'Rahul Kumar', phone: '+919876543210', email: 'rahul@example.com' },
  device: { type: 'smartphone', brand: 'Samsung', model: 'Galaxy A55 5G' },
  items: [
    { productId: 'case-clear-shockproof', name: 'Clear Shockproof Case', variant: 'Color: Midnight', deviceName: 'Samsung Galaxy A55 5G', quantity: 1, unitPrice: 299 },
    { productId: 'glass-privacy', name: 'Privacy Tempered Glass', deviceName: 'Samsung Galaxy A55 5G', quantity: 2, unitPrice: 449 },
    { productId: 'charge-adapter-pd-65w', name: '65W USB-C PD GaN Charger', quantity: 1, unitPrice: 1999 },
    { productId: 'tablet-keyboard-case', name: 'Keyboard Folio Case', quantity: 1 },
  ],
  fulfillment: 'delivery',
  address: 'Flat 402, Sunrise Apartments, Main Market Road, Your City 000000',
  notes: 'Please confirm if the privacy glass is available in matte.\nI can collect after 6 PM.',
  requestId: 'MAS-20260826-8F2K',
};

const custom = {
  requestType: 'custom',
  customer: { name: 'Anita Sharma', phone: '9812345678' },
  device: { type: 'smartphone', brand: 'Nothing', model: 'Nothing Phone (3a)', otherModel: 'Nothing Phone (3a)' },
  item: 'Transparent camera-protection case',
  quantity: 2,
  description:
    'I need a transparent case with a raised camera ring, matte finish if possible. ' +
    'I saw one in a shop in the city for around ₹600. Not urgent, but this week would help.',
  fulfillment: 'pickup',
  requestId: 'MAS-20260826-C7P4',
};

await mkdir(OUT, { recursive: true });

for (const [name, email] of [
  ['order', orderEmail(order, SHOP, AT)],
  ['custom-request', customRequestEmail(custom, SHOP, AT)],
]) {
  await writeFile(`${OUT}${name}.html`, email.html, 'utf8');
  await writeFile(`${OUT}${name}.txt`, `Subject: ${email.subject}\n\n${email.text}`, 'utf8');
  console.log(`${name}: ${email.subject}`);
}

console.log(`\nWritten to ${OUT}`);
