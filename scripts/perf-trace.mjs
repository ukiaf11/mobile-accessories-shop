import { chromium } from 'playwright';
import { readFileSync, unlinkSync } from 'node:fs';

const OUT = '/tmp/claude-1000/-home-bol7-Desktop-upendra/dd9ec773-20ef-47d9-896e-87a2aa3a5012/scratchpad/trace.json';

async function profile(label, reduced) {
  const b = await chromium.launch({ headless: true, channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto('http://localhost:4173/?device=apple-iphone-15-pro', { waitUntil: 'load' });
  await p.waitForTimeout(1500);

  await b.startTracing(p, { path: OUT, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
  await p.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += 220) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 32));
    }
  });
  await b.stopTracing();

  const events = JSON.parse(readFileSync(OUT, 'utf8')).traceEvents;
  const buckets = {
    scripting: ['FunctionCall', 'EvaluateScript', 'V8.Execute', 'TimerFire', 'FireAnimationFrame', 'EventDispatch', 'RunMicrotasks'],
    style: ['UpdateLayoutTree', 'ScheduleStyleRecalculation', 'RecalculateStyles'],
    layout: ['Layout', 'UpdateLayerTree'],
    paint: ['Paint', 'PaintImage', 'Rasterize', 'RasterTask', 'DecodeImage'],
    composite: ['CompositeLayers', 'Commit'],
  };
  const totals = { scripting: 0, style: 0, layout: 0, paint: 0, composite: 0 };
  for (const e of events) {
    if (e.ph !== 'X' || !e.dur) continue;
    for (const [bucket, names] of Object.entries(buckets)) {
      if (names.includes(e.name)) { totals[bucket] += e.dur / 1000; break; }
    }
  }
  await b.close();
  try { unlinkSync(OUT); } catch {}
  return { label, ...Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Math.round(v)])) };
}

const rows = [await profile('baseline (animations on)', false), await profile('reduced-motion', true)];
const cols = ['label', 'scripting', 'style', 'layout', 'paint', 'composite'];
const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
console.log(cols.map((c, i) => c.padEnd(w[i])).join('  ') + '   (ms)');
console.log(w.map((x) => '-'.repeat(x)).join('  '));
for (const r of rows) console.log(cols.map((c, i) => String(r[c]).padEnd(w[i])).join('  '));
