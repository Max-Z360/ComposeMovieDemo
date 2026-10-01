// history-dependence probe: frame T rendered fresh vs after sequential frames from T0
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const [T0, T, mod] = [+process.argv[2], +process.argv[3], process.argv[4] || ''];
async function grab(browser, seq) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('file://' + path.resolve('src_b/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  if (mod) await p.evaluate(mod);
  const cdp = await ctx.newCDPSession(p);
  const frames = seq ? [] : [];
  if (seq) for (let f = Math.round(T0 * 30); f < Math.round(T * 30); f++) { await p.evaluate((t) => window.seek(t), f / 30); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 }); }
  else { await p.evaluate((t) => window.seek(t), T); await p.evaluate((t) => window.seek(t), T); }
  await p.evaluate((t) => window.seek(t), T);
  const s = (await cdp.send('Page.captureScreenshot', { format: 'png' })).data;
  await ctx.close();
  return s;
}
(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const a = await grab(browser, false), b = await grab(browser, true);
  require('fs').writeFileSync('/tmp/claude-0/-home-user-ComposeMovieDemo/64014344-234f-5de2-b409-8b908b1da61a/scratchpad/ha.png', Buffer.from(a, 'base64')); require('fs').writeFileSync('/tmp/claude-0/-home-user-ComposeMovieDemo/64014344-234f-5de2-b409-8b908b1da61a/scratchpad/hb.png', Buffer.from(b, 'base64'));
  console.log(T0, '->', T, mod ? '[' + mod.slice(0, 60) + ']' : '', a === b ? 'IDENTICAL' : 'DIFFERENT');
  await browser.close();
})();
