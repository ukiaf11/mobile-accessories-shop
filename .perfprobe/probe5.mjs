import { chromium } from 'playwright';
const URL = 'http://localhost:4173/?device=apple-iphone-15-pro';
async function run() {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] });
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
    const times = []; let last = performance.now();
    let raf = requestAnimationFrame(function loop() { const now = performance.now(); times.push(now - last); last = now; raf = requestAnimationFrame(loop); });
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += 220) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 32)); }
    cancelAnimationFrame(raf); return times;
  });
  const s = await p.evaluate(() => ({
    long: window.__long, reveal: window.__reveal,
    nodes: document.querySelectorAll('*').length,
    svg: document.querySelectorAll('svg *').length,
    grads: document.querySelectorAll('linearGradient').length,
    scrollH: document.documentElement.scrollHeight,
    headerBackdrop: getComputedStyle(document.querySelector('header')).backdropFilter,
    headerClass: document.querySelector('header').className,
  }));
  await b.close();
  const sf = [...frames].sort((a, c) => a - c);
  const rev = s.reveal.slice().sort((a, c) => a - c);
  return { nodes: s.nodes, svg: s.svg, grads: s.grads, scrollH: s.scrollH,
    headerBackdrop: s.headerBackdrop, headerClass: s.headerClass.slice(0, 60),
    longCount: s.long.length, longTotal: s.long.reduce((a, c) => a + c, 0),
    frameP50: Math.round(sf[Math.floor(sf.length * 0.5)] || 0),
    over32: frames.filter((f) => f > 32).length + '/' + frames.length,
    revealP95: rev[Math.floor(rev.length * 0.95)] ?? 0, revealN: rev.length };
}
for (let i = 0; i < 4; i++) console.log('HEAD run' + i, JSON.stringify(await run()));
