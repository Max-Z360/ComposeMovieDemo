#!/usr/bin/env node
// Seek-order determinism: render times in forward order, then shuffled/reverse order in the same page,
// and compare screenshots byte-for-byte (seek(a); seek(b); seek(a) must equal seek(a)).
const path = require('path'), crypto = require('crypto');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const ts = process.argv.slice(2).map(Number);
  const browser = await pw.chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const run = async (order) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 });
    const p = await ctx.newPage(); p.on('pageerror', e => console.error('[pageerror]', e.message));
    await p.goto('file://' + path.resolve(__dirname, '../index.html'), { waitUntil: 'load' });
    await p.evaluate(() => window.READY);
    const cdp = await ctx.newCDPSession(p); const out = {};
    for (const t of order) { await p.evaluate(t => window.seek(t), t); const s = await cdp.send('Page.captureScreenshot', { format: 'png' }); out[t] = crypto.createHash('md5').update(s.data).digest('hex'); if (process.env.DUMP) require('fs').writeFileSync(`${process.env.DUMP}/r${order === ts ? 'a' : 'b'}_${t}.png`, Buffer.from(s.data, 'base64')); }
    await ctx.close(); return out;
  };
  const SAME = process.env.SAME; const a = await run(ts), b = await run(SAME ? ts : [...ts].reverse()), c = await run(SAME ? ts : ts.map((t, i) => ts[(i * 7) % ts.length]));
  let bad = 0; for (const t of ts) { const ok = a[t] === b[t] && a[t] === c[t]; if (!ok) { bad++; console.log('MISMATCH t=' + t); } }
  console.log(bad ? `${bad} mismatches` : `all ${ts.length} times identical across 3 seek orders`);
  await browser.close();
})();
