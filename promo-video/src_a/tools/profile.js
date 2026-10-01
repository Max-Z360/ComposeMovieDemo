// Profile: READY time, per-frame seek (JS) time and capture time, at 1920×1080 JPEG q95 (one worker).
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const [a, b] = process.argv.slice(2).map(Number);
  const br = await pw.chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const ctx = await br.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await ctx.newPage();
  let t0 = Date.now(); await p.goto('file://' + path.resolve(__dirname, '../index.html') + (process.env.Q || ''), { waitUntil: 'load' }); await p.evaluate(() => window.READY);
  console.log('load+READY ms', Date.now() - t0);
  const cdp = await ctx.newCDPSession(p); let js = 0, cap = 0, n = 0;
  for (let f = Math.round(a * 30); f < Math.round(b * 30); f += 3) {
    let s = Date.now(); await p.evaluate(t => window.seek(t), f / 30); js += Date.now() - s;
    s = Date.now(); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 }); cap += Date.now() - s; n++;
  }
  console.log(`window ${a}-${b}: seek ${(js / n).toFixed(0)} ms, capture ${(cap / n).toFixed(0)} ms, total ${((js + cap) / n).toFixed(0)} ms/frame`);
  await br.close();
})();
