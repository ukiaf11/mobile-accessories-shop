/**
 * End-to-end QA harness — blueprint 07_IMPLEMENTATION_ROADMAP.md Phase 7.
 *
 * Boots the production build, drives it in a real browser, and checks the functional,
 * responsive and accessibility items on the roadmap. The serverless API is not running
 * under `vite preview`, so `/api/*` is intercepted per test to exercise the success,
 * failure, rate-limit and offline paths deterministically.
 *
 *   npm run qa            # run everything
 *   npm run qa -- --shots # also write screenshots to qa-screenshots/
 */
import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = new URL('../qa-screenshots/', import.meta.url).pathname;

const results = [];
let currentGroup = '';

function group(name) {
  currentGroup = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

async function check(name, fn) {
  try {
    await fn();
    results.push({ group: currentGroup, name, ok: true });
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (error) {
    results.push({ group: currentGroup, name, ok: false, error: error.message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}\n      ${error.message.split('\n')[0]}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} (expected ${expected}, got ${actual})`);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`preview server did not start on ${url}`);
}

/** Canned API responses so the submit paths can be exercised without a mail provider. */
function mockApi(page, behaviour) {
  return page.route('**/api/**', async (route) => {
    const payload = route.request().postDataJSON();
    if (behaviour === 'success') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, requestId: payload.requestId }),
      });
    }
    if (behaviour === 'rate_limited') {
      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'rate_limited',
          error: 'Too many requests from this connection. Please wait a few minutes.',
        }),
      });
    }
    if (behaviour === 'offline') return route.abort('internetdisconnected');
    return route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        code: 'email_failed',
        error: 'We could not deliver your request to the shop just now.',
      }),
    });
  });
}

/** Walks the device finder: type → brand → model. */
async function pickDevice(page, { brand = 'Apple', model = 'iPhone 15 Pro' } = {}) {
  await page.getByRole('button', { name: brand, exact: true }).click();
  await page.getByRole('button', { name: model, exact: true }).click();
  await page.locator('#device-finder').getByText(`Accessories for ${brand} ${model}`).waitFor();
}

/**
 * `.catalog-grid` uses `content-visibility: auto`, so offscreen cards are not rendered and
 * their text is not queryable. Scroll the whole grid past the viewport once to realise it.
 */
async function revealCatalog(page) {
  await page.locator('#catalog').scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;
    const step = window.innerHeight * 0.8;
    for (let y = grid.offsetTop; y < grid.offsetTop + grid.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });
  await page.waitForTimeout(300);
}

async function addFirstProduct(page) {
  const addButton = page.locator('#catalog button', { hasText: /^Add$/ }).first();
  await addButton.scrollIntoViewIfNeeded();
  await addButton.click();
}

async function fillCustomer(page, { name = 'Rahul Kumar', phone = '9876543210' } = {}) {
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Mobile number').fill(phone);
}

async function main() {
  if (SHOTS) {
    await rm(SHOT_DIR, { recursive: true, force: true });
    await mkdir(SHOT_DIR, { recursive: true });
  }

  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  });

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  try {
    await waitForServer(BASE);

    /* ─────────────────────────── Functional QA ─────────────────────────── */
    group('Functional QA');

    await check('page loads with the shop heading', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await page.getByRole('heading', { level: 1 }).waitFor();
      const title = await page.title();
      assert(title.includes('Mobile Accessories'), `unexpected title: ${title}`);
      await page.close();
    });

    await check('brand filtering narrows the model list', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Apple', exact: true }).click();
      await page.getByRole('button', { name: 'iPhone 15 Pro', exact: true }).waitFor();
      const samsungModel = page.getByRole('button', { name: 'Galaxy A55', exact: true });
      assertEqual(await samsungModel.count(), 0, 'Samsung model leaked into the Apple list');
      await page.close();
    });

    await check('model filtering shows only compatible products', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await pickDevice(page, { brand: 'Samsung', model: 'Galaxy A55 5G' });
      await revealCatalog(page);
      // MagSafe is Apple-only; it must not appear for a Galaxy.
      const magsafe = page.locator('#catalog').getByText('MagSafe Clear Case');
      assertEqual(await magsafe.count(), 0, 'MagSafe case offered for a Samsung device');
      await page.close();
    });

    await check('an Apple model does surface the MagSafe case', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro&category=cases`);
      await revealCatalog(page);
      await page.locator('#catalog').getByText('MagSafe Clear Case').first().waitFor();
      await page.close();
    });

    await check('tablet accessories never appear for a phone', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await revealCatalog(page);
      const folio = page.locator('#catalog').getByText('Tablet Folio Smart Case');
      assertEqual(await folio.count(), 0, 'tablet folio offered for a phone');
      await page.close();
    });

    await check('URL state is shareable and restores filters', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await pickDevice(page);
      const url = page.url();
      assert(url.includes('device=apple-iphone-15-pro'), `device missing from URL: ${url}`);

      const restored = await browser.newPage();
      await restored.goto(url);
      await restored.locator('#catalog h2')
        .getByText('Accessories for Apple iPhone 15 Pro').waitFor();
      await restored.close();
      await page.close();
    });

    await check('adding to the cart updates the count and the floating bar', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list, 1 items/ }).waitFor();
      await page.getByText(/^item in request$/).waitFor();
      await page.close();
    });

    await check('cart quantities can be increased and removed', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();

      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await dialog.getByRole('button', { name: /^Increase quantity/ }).first().click();
      const quantity = dialog.locator('input[type="number"]').first();
      assertEqual(await quantity.inputValue(), '2', 'quantity did not increment');

      await dialog.getByRole('button', { name: /^Remove / }).first().click();
      await dialog.getByText('Your request list is empty').waitFor();
      await page.close();
    });

    await check('cart survives a page reload', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list, 1 items/ }).waitFor();
      await page.reload();
      await page.getByRole('button', { name: /Open request list, 1 items/ }).waitFor();
      await page.close();
    });

    await check('an order request submits and shows a request ID', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'success');
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();

      const dialog = page.getByRole('dialog');
      await fillCustomer(page);
      await dialog.getByRole('button', { name: 'Send Order Request', exact: true }).click();

      await dialog.getByText('Request received').waitFor();
      const id = await dialog.locator('.font-mono').first().innerText();
      assert(/^MAS-\d{8}-[0-9A-Z]{4}$/.test(id), `bad request id shown: ${id}`);
      await page.close();
    });

    await check('a successful order clears the cart', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'success');
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page);
      await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();
      await page.getByText('Request received').waitFor();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      assertEqual(
        await page.getByRole('button', { name: /Open request list, / }).count(),
        0,
        'cart badge still present after a successful order',
      );
      await page.close();
    });

    await check('a custom request submits', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'success');
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Custom Request', exact: true }).first().click();

      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      await fillCustomer(page);
      await dialog.getByRole('combobox', { name: 'Brand' }).selectOption('samsung');
      await dialog.getByRole('combobox', { name: 'Model' }).selectOption({ label: 'Galaxy A55 5G' });
      await dialog.getByLabel('Item you are looking for').fill('Transparent camera case');
      await dialog.getByLabel('Describe the requirement')
        .fill('I need a transparent camera-protection case, matte finish if possible.');
      await dialog.getByRole('button', { name: 'Send Custom Request', exact: true }).click();
      await dialog.getByText('Request received').waitFor();
      await page.close();
    });

    await check('invalid phone number is rejected inline, not sent', async () => {
      const page = await browser.newPage();
      let apiCalled = false;
      await page.route('**/api/**', (route) => {
        apiCalled = true;
        route.fulfill({ status: 200, body: '{"success":true,"requestId":"MAS-20260826-AAAA"}' });
      });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page, { phone: '12345' });
      await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();
      await page.getByText('Please enter a valid mobile number.').waitFor();
      assertEqual(apiCalled, false, 'invalid form reached the API');
      await page.close();
    });

    await check('a delivery choice demands an address', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'success');
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page);
      await page.getByRole('dialog').getByRole('radio', { name: /Local delivery/ }).check();
      await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();
      await page.getByText(/Please add a delivery address/).waitFor();
      await page.close();
    });

    await check('a failed send shows an error and keeps the typed data', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'email_failed');
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page);
      await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();

      await page.getByRole('alert').getByText(/could not deliver/i).waitFor();
      assertEqual(
        await page.getByLabel('Full name').inputValue(),
        'Rahul Kumar',
        'form data was lost on failure',
      );
      assertEqual(
        await page.getByText('Request received').count(),
        0,
        'showed false success after a failed send',
      );
      await page.getByRole('button', { name: 'Try again' }).waitFor();
      await page.close();
    });

    await check('a network drop is recoverable without losing data', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'offline');
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page);
      await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();
      await page.getByRole('alert').getByText(/connection/i).waitFor();
      assertEqual(await page.getByLabel('Mobile number').inputValue(), '9876543210', 'phone lost');
      await page.close();
    });

    await check('a rate-limit response is explained, not swallowed', async () => {
      const page = await browser.newPage();
      await mockApi(page, 'rate_limited');
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Custom Request', exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await fillCustomer(page);
      await dialog.getByRole('combobox', { name: 'Brand' }).selectOption('samsung');
      await dialog.getByRole('combobox', { name: 'Model' }).selectOption({ label: 'Galaxy A55 5G' });
      await dialog.getByLabel('Item you are looking for').fill('Clear case');
      await dialog.getByLabel('Describe the requirement').fill('A plain clear case please.');
      await dialog.getByRole('button', { name: 'Send Custom Request', exact: true }).click();
      await page.getByRole('alert').getByText(/Too many requests/i).waitFor();
      await page.close();
    });

    await check('a double-click sends exactly one request', async () => {
      const page = await browser.newPage();
      let calls = 0;
      await page.route('**/api/order', async (route) => {
        calls += 1;
        const payload = route.request().postDataJSON();
        await new Promise((resolve) => setTimeout(resolve, 400));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, requestId: payload.requestId }),
        });
      });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await addFirstProduct(page);
      await page.getByRole('button', { name: /Open request list/ }).click();
      await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
      await fillCustomer(page);

      const submit = page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true });
      await submit.click();
      await submit.click({ force: true }).catch(() => {});
      await submit.click({ force: true }).catch(() => {});
      await page.getByText('Request received').waitFor();
      assertEqual(calls, 1, `double-click produced ${calls} requests`);
      await page.close();
    });

    await check('quick view quantity and variant selection work', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro&category=cases`);
      await revealCatalog(page);
      // "Options" appears on products that have variants.
      await page.locator('#catalog button', { hasText: /^Options$/ }).first().click();

      const dialog = page.getByRole('dialog');
      await dialog.waitFor();

      const increase = dialog.getByRole('button', { name: 'Increase quantity', exact: true });
      await increase.click();
      await increase.click();
      const shown = await dialog.getByText(/^[0-9]+$/).first().innerText();
      assertEqual(shown.trim(), '3', 'quantity stepper did not hold its value');

      // Picking a variant must not reset the quantity either.
      const options = dialog.locator('fieldset button');
      if (await options.count() > 1) {
        await options.nth(1).click();
        assertEqual(
          (await dialog.getByText(/^[0-9]+$/).first().innerText()).trim(),
          '3',
          'choosing a variant reset the quantity',
        );
      }

      await dialog.getByRole('button', { name: 'Add to request', exact: true }).click();
      await page.getByRole('button', { name: /Open request list, 3 items/ }).waitFor();
      await page.close();
    });

    await check('opening and closing an overlay keeps the scroll position', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await revealCatalog(page);
      await page.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => window.scrollY);
      assert(before > 1000, `test setup did not scroll (at ${before})`);

      // The lock pins the body with `position: fixed`, so window.scrollY is 0 by
      // definition while it is held. What matters is that nothing MOVES on screen,
      // so compare a real element's viewport position instead.
      const marker = page.locator('#catalog h2');
      const markerBefore = (await marker.boundingBox()).y;

      // Click through the DOM: Playwright's own auto-scroll targets the sticky header's
      // static position and would move the page before the app ever runs.
      await page.evaluate(() => {
        document.querySelector('header button[aria-label*="request list"]').click();
      });
      await page.getByRole('dialog').waitFor();
      await page.waitForTimeout(500);
      const markerDuring = (await marker.boundingBox()).y;

      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => window.scrollY);

      assert(
        Math.abs(markerDuring - markerBefore) < 4,
        `page moved while the drawer was open (${markerBefore} → ${markerDuring})`,
      );
      assert(Math.abs(after - before) < 4, `scroll not restored on close (${before} → ${after})`);
      await page.close();
    });

    await check('adding to the cart does not move the page', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await revealCatalog(page);
      // Park the viewport inside the grid so an Add button is already on screen.
      await page.evaluate(() => {
        const grid = document.querySelector('.catalog-grid');
        window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 100, behavior: 'instant' });
      });
      await page.waitForTimeout(400);
      // Click a button that is ALREADY on screen — scrollIntoViewIfNeeded would move
      // the page itself and mask the behaviour under test.
      const visibleAdd = page.locator('#catalog button', { hasText: /^Add$/ });
      const count = await visibleAdd.count();
      let clicked = false;
      for (let i = 0; i < count; i += 1) {
        const box = await visibleAdd.nth(i).boundingBox();
        if (box && box.y > 80 && box.y < 800) {
          const before = await page.evaluate(() => window.scrollY);
          await visibleAdd.nth(i).click();
          await page.waitForTimeout(500);
          const after = await page.evaluate(() => window.scrollY);
          assert(Math.abs(after - before) < 4, `grid moved on add (${before} → ${after})`);
          clicked = true;
          break;
        }
      }
      assert(clicked, 'no Add button was on screen to click');
      await page.close();
    });

    await check('the empty state routes into a custom request', async () => {
      const page = await browser.newPage();
      // A filter combination that cannot match anything.
      await page.goto(`${BASE}/?device=apple-iphone-15-pro&category=cases&tags=Privacy`);
      await page.locator('#catalog').scrollIntoViewIfNeeded();
      await page.getByText('No matching accessories yet.').waitFor();
      await page.getByRole('button', { name: 'Send Custom Request', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await page.close();
    });

    /* ─────────────────────────── Performance QA ────────────────────────── */
    group('Performance QA');

    await check('cards are visible almost immediately after scrolling into view', async () => {
      /*
       * This is the regression guard for the user-reported "cards take time to load".
       * Measured on a 4x-throttled CPU: how long after an element intersects the viewport
       * does it reach full opacity. Before the fix this was p95 914 ms, because each card
       * started at opacity 0 and waited for a stagger delay plus a 350 ms animation that
       * could not even begin until the card was already on screen.
       */
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`, { waitUntil: 'load' });
      await page.waitForTimeout(1200);

      await page.evaluate(() => {
        window.__reveal = [];
        const seen = new WeakSet();
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting || seen.has(entry.target)) continue;
            seen.add(entry.target);
            const start = performance.now();
            const tick = () => {
              if (Number(getComputedStyle(entry.target).opacity) > 0.99) {
                window.__reveal.push(performance.now() - start);
              } else if (performance.now() - start < 3000) {
                requestAnimationFrame(tick);
              } else {
                window.__reveal.push(3000);
              }
            };
            requestAnimationFrame(tick);
          }
        }, { threshold: 0.01 });
        document.querySelectorAll('.catalog-grid > li, #categories li').forEach((el) => io.observe(el));
      });

      await page.evaluate(async () => {
        const total = document.documentElement.scrollHeight;
        for (let y = 0; y < total; y += 220) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 32));
        }
      });

      const reveal = await page.evaluate(() => window.__reveal.slice().sort((a, b) => a - b));
      await page.close();

      assert(reveal.length >= 20, `only ${reveal.length} cards measured`);
      const p95 = Math.round(reveal[Math.floor(reveal.length * 0.95)]);
      // Generous ceiling: measured ~45 ms, was ~914 ms. Anything over 250 ms means a
      // viewport-gated entrance animation has crept back in.
      assert(p95 < 250, `card reveal p95 regressed to ${p95} ms (budget 250 ms)`);
    });

    await check('nothing outside the hero uses backdrop-filter', async () => {
      /*
       * A backdrop-filter on a sticky or always-visible element forces a re-snapshot and
       * re-blur of its backdrop on every scrolled frame. An interleaved A/B on the shipped
       * build put that at ~20% more frames over 32 ms (compositor cost, not main thread).
       * Only the hero floaters may keep it: they scroll away.
       *
       * The positive control matters. An earlier version of this check was deleted on the
       * false premise that headless Chrome always reports "none" — it does not, as the
       * control proves. What IS true is that lightningcss minification currently drops the
       * standard `backdrop-filter` from the built CSS and keeps only
       * `-webkit-backdrop-filter`, which Chrome 150 no longer honours. So this assertion is
       * weaker than it looks today; the control at least guarantees it is not vacuous
       * because the harness cannot see the property at all.
       */
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.getByRole('heading', { level: 1 }).waitFor();

      const { control, offenders } = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.backdropFilter = 'blur(8px)';
        document.body.appendChild(probe);
        const control = getComputedStyle(probe).backdropFilter;
        probe.remove();

        return {
          control,
          offenders: [...document.querySelectorAll('*')]
            .filter((el) => {
              const applied = getComputedStyle(el).backdropFilter;
              return applied && applied !== 'none' && !el.closest('#top');
            })
            .map((el) => {
              const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') ?? '');
              return `${el.tagName}.${cls.slice(0, 40)}`;
            }),
        };
      });
      await page.close();

      assertEqual(control, 'blur(8px)', 'harness cannot read backdrop-filter, so this check would be vacuous');
      assertEqual(offenders.length, 0, `backdrop-filter outside the hero: ${offenders.join(' | ')}`);
    });

    await check('card hover and press transitions actually animate', async () => {
      /*
       * Tailwind v4 compiles `-translate-y-*` to the standalone `translate` property and
       * `scale-*` to `scale`, NOT to the `transform` shorthand. An arbitrary transition
       * list naming only `transform` therefore leaves them un-animated and the hover lift
       * teleports in a single frame — verified frame-by-frame: with `transform` the value
       * jumps straight to "0px -6px", with `translate` it eases through -1.3, -4.0, -5.4.
       * Nothing else in this suite drives a hover animation, so assert the computed
       * transition-property covers the property each utility actually writes.
       */
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.locator('#catalog .catalog-grid').waitFor();

      const result = await page.evaluate(() => {
        const card = document.querySelector('#catalog .catalog-grid > li article');
        if (!card) return { error: 'no card found' };
        const buttons = [...card.querySelectorAll('button')];
        const addButton = buttons.at(-1);
        const pill = card.querySelector('.rounded-full')?.parentElement;
        const prop = (el) => (el ? getComputedStyle(el).transitionProperty : '');
        return { card: prop(card), addButton: prop(addButton), pill: prop(pill) };
      });
      await page.close();

      assert(!result.error, String(result.error));
      assert(
        /\btranslate\b|\ball\b/.test(result.card),
        `card lift will not animate: transition-property is "${result.card}"`,
      );
      assert(
        /\bscale\b|\ball\b/.test(result.addButton),
        `button press will not animate: transition-property is "${result.addButton}"`,
      );
      assert(
        /\btranslate\b|\ball\b/.test(result.pill),
        `quick-view pill slide will not animate: transition-property is "${result.pill}"`,
      );
    });

    await check('the catalog grid renders its real cards in the first commit', async () => {
      // No skeleton phase: the catalog is local data, so a loading placeholder could only
      // delay content that was already available.
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`, { waitUntil: 'domcontentloaded' });
      await page.locator('#catalog .catalog-grid').waitFor();
      const skeletons = await page.locator('.skeleton').count();
      const cards = await page.locator('#catalog .catalog-grid > li').count();
      await page.close();
      assert(cards > 20, `expected the real grid, found ${cards} cards`);
      assertEqual(skeletons, 0, `${skeletons} skeletons rendered instead of real cards`);
    });

    await check('gradient definitions are shared, not duplicated per card', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.locator('#catalog .catalog-grid').waitFor();
      const { gradients, duplicateIds } = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
        const counts = new Map();
        for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
        return {
          gradients: document.querySelectorAll('linearGradient').length,
          duplicateIds: [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id),
        };
      });
      await page.close();
      // 210 before hoisting, ~80 after. Duplicate ids are invalid and unreachable by paint.
      assert(gradients < 120, `${gradients} gradients: the per-card <defs> may be back`);
      assertEqual(duplicateIds.length, 0, `duplicate element ids: ${duplicateIds.slice(0, 5).join(', ')}`);
    });

    /* ────────────────────────── Accessibility QA ────────────────────────── */
    group('Accessibility QA');

    await check('Escape closes a dialog and restores focus', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      const cartButton = page.getByRole('button', { name: /Open request list/ });
      await cartButton.click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      const focusedLabel = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      );
      assert(/Open request list/.test(focusedLabel), `focus not restored (on: ${focusedLabel})`);
      await page.close();
    });

    await check('focus is trapped inside a dialog', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByRole('button', { name: 'Custom Request', exact: true }).first().click();
      await page.getByRole('dialog').waitFor();
      for (let i = 0; i < 40; i += 1) await page.keyboard.press('Tab');
      const inside = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement));
      });
      assert(inside, 'focus escaped the dialog after 40 tabs');
      await page.close();
    });

    await check('a skip link is the first thing a keyboard user reaches', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      // Wait for React to render, or Tab lands on <body> before the skip link exists.
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.keyboard.press('Tab');
      const text = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
      assertEqual(text, 'Skip to accessories', 'first tab stop is not the skip link');
      await page.close();
    });

    await check('every form control has an accessible name', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      await page.getByRole('button', { name: 'Custom Request', exact: true }).first().click();
      await page.getByRole('dialog').waitFor();
      const unnamed = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return ['no dialog'];
        return [...dialog.querySelectorAll('input,select,textarea')]
          .filter((element) => {
            if (element.type === 'hidden') return false;
            const id = element.id;
            const labelled =
              (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
              element.getAttribute('aria-label') ||
              element.closest('label');
            return !labelled;
          })
          .map((element) => element.name || element.id || element.tagName);
      });
      assertEqual(unnamed.length, 0, `controls without labels: ${unnamed.join(', ')}`);
      await page.close();
    });

    await check('every image-role graphic carries a label', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.locator('#catalog').scrollIntoViewIfNeeded();
      const missing = await page.evaluate(() =>
        [...document.querySelectorAll('svg[role="img"]')]
          .filter((svg) => !svg.getAttribute('aria-label') && !svg.querySelector('title'))
          .length,
      );
      assertEqual(missing, 0, `${missing} img-role SVGs without a label`);
      await page.close();
    });

    await check('headings form a sane hierarchy with exactly one h1', async () => {
      const page = await browser.newPage();
      await page.goto(BASE);
      const counts = await page.evaluate(() => {
        const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .map((heading) => Number(heading.tagName[1]));
        let jump = 0;
        for (let i = 1; i < levels.length; i += 1) {
          if (levels[i] - levels[i - 1] > 1) jump += 1;
        }
        return { h1: levels.filter((level) => level === 1).length, jump };
      });
      assertEqual(counts.h1, 1, `expected one h1, found ${counts.h1}`);
      assertEqual(counts.jump, 0, `${counts.jump} heading-level jumps`);
      await page.close();
    });

    await check('reduced motion disables the floating hero animation', async () => {
      const page = await browser.newPage({ reducedMotion: 'reduce' });
      await page.goto(BASE);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForTimeout(600);
      const moved = await page.evaluate(async () => {
        const card = document.querySelector('.glass-panel.flex.items-center');
        if (!card) return 'no floater';
        const first = card.getBoundingClientRect().top;
        await new Promise((resolve) => setTimeout(resolve, 900));
        return Math.abs(card.getBoundingClientRect().top - first);
      });
      assert(typeof moved === 'number' && moved < 1, `hero still animating (moved ${moved}px)`);
      await page.close();
    });

    await check('reduced motion never leaves content invisible', async () => {
      /*
       * The reduced-motion reset shortens animations to 0.01ms. Any animation using
       * `animation-fill-mode: backwards` with a delay would otherwise hold its `from`
       * keyframe — opacity 0 — for the whole delay. This asserts every CSS-animated
       * element is actually visible, which the "hero animation" check does not cover
       * (that one only measures movement, and an invisible element does not move either).
       */
      const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForTimeout(150);

      const invisible = await page.evaluate(() =>
        ['.hero-float', '.hero-float-in', '.card-enter']
          .flatMap((sel) => [...document.querySelectorAll(sel)])
          .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
          .map((el) => String(el.className).slice(0, 40)),
      );
      await page.close();
      assertEqual(invisible.length, 0, `still transparent under reduced motion: ${invisible.join(' | ')}`);
    });

    await check('the mobile menu button reports its expanded state', async () => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto(BASE);
      const toggle = page.getByRole('button', { name: 'Open menu' });
      assertEqual(await toggle.getAttribute('aria-expanded'), 'false', 'aria-expanded not false');
      await toggle.click();
      await page.getByRole('button', { name: 'Close menu' }).waitFor();
      await page.close();
    });

    /* ─────────────────────────── Responsive QA ─────────────────────────── */
    group('Responsive QA');

    const VIEWPORTS = [
      { name: '360-mobile', width: 360, height: 740 },
      { name: '390-mobile', width: 390, height: 844 },
      { name: '768-tablet', width: 768, height: 1024 },
      { name: '1024-laptop', width: 1024, height: 768 },
      { name: '1440-desktop', width: 1440, height: 900 },
      { name: '1920-wide', width: 1920, height: 1080 },
    ];

    for (const viewport of VIEWPORTS) {
      await check(`${viewport.width}px — no horizontal overflow`, async () => {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        });
        await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        // Settle lazy sections before measuring.
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const offenders = [...document.querySelectorAll('body *')]
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.right > doc.clientWidth + 1;
            })
            .slice(0, 3)
            .map((element) => `${element.tagName}.${element.className?.toString().slice(0, 40)}`);
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            offenders,
          };
        });

        assert(
          overflow.scrollWidth <= overflow.clientWidth + 1,
          `page scrolls sideways (${overflow.scrollWidth} > ${overflow.clientWidth}): ${overflow.offenders.join(', ')}`,
        );

        if (SHOTS) {
          await page.screenshot({
            path: `${SHOT_DIR}${viewport.name}.png`,
            fullPage: viewport.width >= 1024,
          });
        }
        await page.close();
      });
    }

    await check('primary tap targets are at least 40px on mobile', async () => {
      const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
      await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
      await page.locator('#catalog').scrollIntoViewIfNeeded();
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('#catalog button, header button')]
          .filter((button) => {
            const rect = button.getBoundingClientRect();
            return rect.width > 0 && (rect.height < 32 || rect.width < 32);
          })
          .map((button) => button.getAttribute('aria-label') || button.textContent?.trim())
          .slice(0, 5),
      );
      assertEqual(small.length, 0, `tap targets under 32px: ${small.join(' | ')}`);
      await page.close();
    });

    if (SHOTS) {
      await check('captured overlay screenshots', async () => {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await mockApi(page, 'success');
        await page.goto(`${BASE}/?device=apple-iphone-15-pro`);
        await page.locator('#catalog').scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOT_DIR}catalog.png` });

        await page.locator('#catalog').getByRole('button', { name: /^Quick view/ }).first().click();
        await page.getByRole('dialog').waitFor();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOT_DIR}quick-view.png` });
        await page.keyboard.press('Escape');

        await addFirstProduct(page);
        await page.getByRole('button', { name: /Open request list/ }).click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOT_DIR}cart.png` });

        await page.getByRole('button', { name: 'Continue to details', exact: true }).click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOT_DIR}order-form.png` });

        await fillCustomer(page);
        await page.getByRole('dialog').getByRole('button', { name: 'Send Order Request', exact: true }).click();
        await page.getByText('Request received').waitFor();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SHOT_DIR}success.png` });
        await page.close();
      });
    }
  } finally {
    await browser.close();
    try {
      process.kill(-server.pid);
    } catch {
      server.kill();
    }
  }

  const failed = results.filter((result) => !result.ok);
  console.log(
    `\n\x1b[1m${results.length - failed.length}/${results.length} checks passed\x1b[0m` +
    (SHOTS ? `\nScreenshots: ${SHOT_DIR}` : ''),
  );
  if (failed.length > 0) {
    console.log('\nFailures:');
    for (const failure of failed) console.log(`  ${failure.group} → ${failure.name}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
