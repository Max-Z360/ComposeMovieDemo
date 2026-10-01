#!/usr/bin/env node
// Debug screenshot helper for variant a (not part of the render pipeline).
// node src_a/tools/shot.js <page.html> <out.png> [width] [height] [t]
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const [page, out, W = 1920, H = 1080, t] = process.argv.slice(2);
  const browser = await pw.chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  p.on('console', m => console.log('[console]', m.type(), m.text()));
  await p.goto('file://' + path.resolve(page), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  if (t !== undefined) await p.evaluate(t => window.seek(t), +t);
  await p.screenshot({ path: out });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
