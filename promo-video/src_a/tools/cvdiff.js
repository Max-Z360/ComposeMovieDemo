const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const [t, ...pre] = process.argv.slice(2).map(Number);
  const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files'] });
  const snap = async (order) => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } }); const p = await ctx.newPage();
    await p.goto('file://' + path.resolve('src_a/index.html'), { waitUntil: 'load' }); await p.evaluate(() => window.READY);
    for (const x of order) await p.evaluate(x => window.seek(x), x);
    const cv = await p.evaluate(() => [...document.querySelectorAll('canvas')].map((c, i) => i + ':' + (c.parentElement && c.parentElement.id) + ':' + c.toDataURL().length + ':' + c.toDataURL().slice(-40)));
    await p.screenshot({ path: `/tmp/claude-0/dd_${order.length}.png` });
    return cv;
  };
  const a = await snap([t]), b = await snap([...pre, t]);
  a.forEach((x, i) => { if (x !== b[i]) console.log('A ' + x + '\nB ' + b[i]); });
  await browser.close();
})();
