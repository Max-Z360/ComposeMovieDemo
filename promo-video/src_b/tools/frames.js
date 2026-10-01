#!/usr/bin/env node
// Render specific times (seconds) of a page to JPEGs for quick review: node src_b/tools/frames.js page out_dir scale t1 t2 ...
const path = require('path'), fs = require('fs');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const [page, outDir, scale, ...ts] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: +scale });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  const [file, q] = page.split('?');
  const t0 = Date.now();
  await p.goto('file://' + path.resolve(file) + (q ? '?' + q : ''), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  console.log('ready', Date.now() - t0, 'ms');
  const cdp = await ctx.newCDPSession(p);
  for (const t of ts) {
    const a = Date.now();
    await p.evaluate((t) => window.seek(t), +t);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync(path.join(outDir, `t${(+t).toFixed(3).padStart(7, '0')}.jpg`), Buffer.from(shot.data, 'base64'));
    console.log('t', t, Date.now() - a, 'ms');
  }
  await browser.close();
})();
