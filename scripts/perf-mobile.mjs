/**
 * Scroll performance on a mid-range phone profile.
 *
 * The desktop harness (`perf-measure.mjs`) throttles the CPU 4x at 1440px. This one is
 * harsher and closer to how the shop's customers actually browse: 390x844, DPR 3, 6x CPU.
 *
 *   npx vite preview --port 4173 &
 *   node scripts/perf-mobile.mjs
 *
 * `revealP95` is the number that matters — milliseconds from a card intersecting the
 * viewport to it being fully opaque. That is the metric behind the reported
 * "cards take time to load while scrolling".
 */
import { chromium } from 'playwright';

const BASE = process.env.PERF_URL || 'http://localhost:4173';
const RUNS = Number(process.env.PERF_RUNS || 2);

async function run(label) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });

  await page.goto(`${BASE}/?device=apple-iphone-15-pro`, { waitUntil: 'load' });
  await page.waitForTimeout(1800);

  await page.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__long.push(entry.duration);
    }).observe({ entryTypes: ['longtask'] });

    window.__reveal = [];
    const seen = new WeakSet();
    const io = new IntersectionObserver(
      (entries) => {
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
      },
      { threshold: 0.01 },
    );
    document.querySelectorAll('#catalog .catalog-grid > li').forEach((el) => io.observe(el));
  });

  const frames = await page.evaluate(async () => {
    const times = [];
    let last = performance.now();
    let raf = requestAnimationFrame(function loop() {
      const now = performance.now();
      times.push(now - last);
      last = now;
      raf = requestAnimationFrame(loop);
    });
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += 300) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    cancelAnimationFrame(raf);
    return times;
  });

  const stats = await page.evaluate(() => ({ long: window.__long, reveal: window.__reveal }));
  await browser.close();

  const pct = (values, q) => {
    const sorted = [...values].sort((a, b) => a - b);
    return Math.round(sorted[Math.floor(sorted.length * q)] ?? 0);
  };

  console.log(
    `${label}  longTasks=${stats.long.length}/${Math.round(stats.long.reduce((a, c) => a + c, 0))}ms` +
    `  frameP50=${pct(frames, 0.5)}ms  frameP95=${pct(frames, 0.95)}ms` +
    `  revealP50=${pct(stats.reveal, 0.5)}ms  revealP95=${pct(stats.reveal, 0.95)}ms  n=${stats.reveal.length}`,
  );
}

for (let i = 1; i <= RUNS; i += 1) {
  await run(`mobile 390px / 6x CPU  run ${i}:`);
}
