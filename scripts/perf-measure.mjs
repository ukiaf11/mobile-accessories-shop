import { chromium } from 'playwright';

const b = await chromium.launch({ headless: true, channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await p.context().newCDPSession(p);
// Throttle to something like a mid-range phone so the effect is visible at all.
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

await p.goto(`${process.env.PERF_URL || 'http://localhost:4173'}/?device=apple-iphone-15-pro`, { waitUntil: 'load' });
await p.waitForTimeout(1500);

// Instrument: long tasks + when each card actually reaches full opacity after
// its box enters the viewport.
await p.evaluate(() => {
  window.__long = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__long.push(Math.round(e.duration));
  }).observe({ entryTypes: ['longtask'] });

  window.__reveal = [];
  const seen = new WeakMap();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || seen.has(e.target)) continue;
      seen.set(e.target, performance.now());
      const start = performance.now();
      const tick = () => {
        const op = Number(getComputedStyle(e.target).opacity);
        if (op > 0.99) window.__reveal.push(Math.round(performance.now() - start));
        else if (performance.now() - start < 3000) requestAnimationFrame(tick);
        else window.__reveal.push(-1);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.01 });
  document.querySelectorAll('.catalog-grid > li, #categories li, section li').forEach((el) => io.observe(el));
});

// Scroll the whole page the way a person would.
const frames = await p.evaluate(async () => {
  const times = [];
  let last = performance.now();
  let raf = 0;
  const loop = () => {
    const now = performance.now();
    times.push(now - last);
    last = now;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const total = document.documentElement.scrollHeight;
  for (let y = 0; y < total; y += 220) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 32));
  }
  cancelAnimationFrame(raf);
  return times;
});

const stats = await p.evaluate(() => ({
  long: window.__long,
  reveal: window.__reveal,
  nodes: document.querySelectorAll('*').length,
  svgNodes: document.querySelectorAll('svg *').length,
  gradients: document.querySelectorAll('linearGradient').length,
  cards: document.querySelectorAll('.catalog-grid > li').length,
}));

const sorted = [...frames].sort((a, b) => a - b);
const pct = (q) => Math.round(sorted[Math.floor(sorted.length * q)] || 0);
const dropped = frames.filter((f) => f > 32).length;
const reveals = stats.reveal.filter((r) => r >= 0).sort((a, b) => a - b);

console.log(JSON.stringify({
  dom: { nodes: stats.nodes, svgNodes: stats.svgNodes, gradients: stats.gradients, cards: stats.cards },
  frames: { count: frames.length, p50: pct(0.5), p95: pct(0.95), max: Math.round(Math.max(...frames)), over32ms: dropped },
  longTasks: { count: stats.long.length, totalMs: stats.long.reduce((a, c) => a + c, 0), max: Math.max(0, ...stats.long) },
  revealMs: { count: reveals.length, p50: reveals[Math.floor(reveals.length * 0.5)], p95: reveals[Math.floor(reveals.length * 0.95)], max: reveals.at(-1) },
}, null, 2));

await b.close();
