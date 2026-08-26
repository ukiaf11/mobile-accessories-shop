import { chromium } from 'playwright';

const URL = process.env.PERF_URL || 'http://localhost:4173/?device=apple-iphone-15-pro';

async function run(label, opts) {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, ...opts.page });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await p.goto(opts.url || URL, { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  await p.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__long.push(Math.round(e.duration));
    }).observe({ entryTypes: ['longtask'] });

    window.__reveal = [];
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || seen.has(e.target)) continue;
        seen.add(e.target);
        const start = performance.now();
        const tick = () => {
          const op = Number(getComputedStyle(e.target).opacity);
          if (op > 0.99) window.__reveal.push(Math.round(performance.now() - start));
          else if (performance.now() - start < 3000) requestAnimationFrame(tick);
          else window.__reveal.push(3000);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.01 });
    document.querySelectorAll('.catalog-grid > li, #categories li, section li').forEach((el) => io.observe(el));
  });

  const frames = await p.evaluate(async () => {
    const times = [];
    let last = performance.now();
    let raf = requestAnimationFrame(function loop() {
      const now = performance.now();
      times.push(now - last);
      last = now;
      raf = requestAnimationFrame(loop);
    });
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += 220) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 32));
    }
    cancelAnimationFrame(raf);
    return times;
  });

  const s = await p.evaluate(() => ({
    long: window.__long,
    reveal: window.__reveal,
    nodes: document.querySelectorAll('*').length,
    svg: document.querySelectorAll('svg *').length,
    grads: document.querySelectorAll('linearGradient').length,
  }));
  await b.close();

  const sortedF = [...frames].sort((a, c) => a - c);
  const rev = s.reveal.slice().sort((a, c) => a - c);
  return {
    label,
    nodes: s.nodes,
    svg: s.svg,
    grads: s.grads,
    longCount: s.long.length,
    longTotal: s.long.reduce((a, c) => a + c, 0),
    longMax: Math.max(0, ...s.long),
    frameP50: Math.round(sortedF[Math.floor(sortedF.length * 0.5)] || 0),
    frameP95: Math.round(sortedF[Math.floor(sortedF.length * 0.95)] || 0),
    over32: frames.filter((f) => f > 32).length + '/' + frames.length,
    revealP50: rev[Math.floor(rev.length * 0.5)] ?? 0,
    revealP95: rev[Math.floor(rev.length * 0.95)] ?? 0,
    revealMax: rev.at(-1) ?? 0,
  };
}

const rows = [];
rows.push(await run('baseline', {}));
rows.push(await run('reduced-motion (animations off)', { page: { reducedMotion: 'reduce' } }));
rows.push(await run('single category (12 cards)', { url: URL + '&category=cases' }));

const cols = ['label', 'nodes', 'svg', 'grads', 'longCount', 'longTotal', 'longMax', 'frameP50', 'frameP95', 'over32', 'revealP50', 'revealP95', 'revealMax'];
const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
console.log(cols.map((c, i) => c.padEnd(w[i])).join('  '));
console.log(w.map((x) => '-'.repeat(x)).join('  '));
for (const r of rows) console.log(cols.map((c, i) => String(r[c]).padEnd(w[i])).join('  '));
