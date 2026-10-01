#!/usr/bin/env node
// Screenshot a debug page after window.READY. Usage: node src_b/tools/snap.js <page.html[?q]> <out.png> [w] [h] [evalJS]
const path = require('path');
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require('/opt/node22/lib/node_modules/playwright');
}
(async () => {
  const [page, out, w = '1920', h = '1080', js] = process.argv.slice(2);
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  let errors = 0;
  p.on('pageerror', (e) => { errors++; console.error('[pageerror]', e.message); });
  p.on('console', (m) => console.log('[console]', m.type(), m.text()));
  p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) console.error('[network]', r.url()); });
  const [file, q] = page.split('?');
  const url = 'file://' + path.resolve(file) + (q ? '?' + q : '');
  const t0 = Date.now();
  await p.goto(url, { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  console.log('ready in', Date.now() - t0, 'ms');
  if (js) console.log('eval:', JSON.stringify(await p.evaluate(js)));
  await p.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('wrote', out, 'errors', errors);
})();
