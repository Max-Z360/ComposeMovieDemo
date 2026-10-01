// idempotency: seek(a) vs seek(a);seek(b);seek(a) must be byte-identical (PNG)
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('src_b/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  const cdp = await ctx.newCDPSession(p);
  const shot = async (t) => { await p.evaluate((t) => window.seek(t), t); return (await cdp.send('Page.captureScreenshot', { format: 'png' })).data; };
  const pairs = [[1.0, 30], [13.4, 2.0], [18.5, 25.3], [21.8, 35], [24.0, 12], [26.6, 40], [30.4, 20.5], [37.6, 13.0], [39.9, 0.5], [4.2, 26.5], [25.2, 25.0]];
  let bad = 0;
  for (const [a, b] of pairs) {
    const s1 = await shot(a); await shot(b); const s2 = await shot(a);
    const ok = s1 === s2; if (!ok) bad++;
    console.log(a, '<->', b, ok ? 'identical' : 'DIFFERENT');
  }
  console.log(bad ? `FAIL ${bad}` : 'ALL IDENTICAL');
  await browser.close();
})();
