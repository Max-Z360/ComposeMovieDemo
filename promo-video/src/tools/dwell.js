#!/usr/bin/env node
// Line dwell (brief §4 / §8 #5): frames where each display line is fully legible (every word >= 97 % risen or
// blur-in >= 97 %, exit <= 3 %), compared with the brief's dwell column. usage: node src/tools/dwell.js [perceptual]
// 'perceptual' = words >= 95 % risen and exit <= 10 % (opacity >= 0.9, < 1 px drift): what a viewer can read
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const BRIEF = { L1: 1.6, L2: 1.8, L3: 1.1, L4: 2.5, L5: 1.6, L6: 1.7, L7: 1.7, L8: 1.8, L9: 1.8 };
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve('src/index.html')); await p.evaluate(() => window.READY);
  const TH = process.argv[2] === "perceptual" ? [0.95, 0.1] : [0.97, 0.03];
  const res = await p.evaluate(([TH_IN, TH_OUT]) => {
    const out = {};
    for (let f = 0; f < 1260; f++) {
      window.seek(f / 30);
      for (const L of S.lines) {
        const on = f / 30 >= L.tIn - 1e-6 && f / 30 < L.tOut; if (!on) continue;
        const inn = L.mode === 'rise' ? Math.min(...L.words.map((w) => w.p.v)) : L.p.inn;
        if (inn >= TH_IN && L.p.out <= TH_OUT) { const id = L.el.id; out[id] = out[id] || [f, f, 0]; out[id][1] = f; out[id][2]++; }
      }
    }
    return out;
  }, TH);
  for (const k in res) { const [a, z, n] = res[k]; console.log(k, `legible f${a}-f${z}`, `${(n / 30).toFixed(2)} s`, `brief ${BRIEF[k]} s`, n / 30 + 1e-9 >= BRIEF[k] - 0.1 ? 'ok' : 'SHORT'); }
  await b.close();
})();
