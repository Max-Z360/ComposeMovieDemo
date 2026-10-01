// per-layer cost probe: node src_b/tools/prof.js t
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
(async () => {
  const t = +(process.argv[2] || 15);
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files', '--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('file://' + path.resolve('src_b/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  const cdp = await ctx.newCDPSession(p);
  async function bench(label, setup) {
    await p.evaluate(setup);
    let tot = 0, seekT = 0;
    for (let i = 0; i < 12; i++) {
      const tt = t + i / 30;
      const a = Date.now();
      const s = await p.evaluate((tt) => { const a = performance.now(); window.seek(tt); window.__hook && window.__hook(); return performance.now() - a; }, tt);
      await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
      if (i >= 2) { tot += Date.now() - a; seekT += s; }
    }
    console.log(label.padEnd(18), (tot / 10).toFixed(0), 'ms/frame  seek', (seekT / 10).toFixed(1), 'ms');
  }
  await bench('baseline', () => { window.__hook = null; });
  await bench('no grain', () => { window.__hook = () => { document.getElementById('grain').style.display = 'none'; }; });
  await bench('no grain/band', () => { window.__hook = () => { document.getElementById('grain').style.display = 'none'; document.getElementById('bandOv').style.display = 'none'; }; });
  await bench('+no vignette', () => { window.__hook = () => { document.getElementById('grain').style.display = 'none'; document.getElementById('bandOv').style.display = 'none'; document.getElementById('vignette').style.display = 'none'; }; });
  await bench('+no bg', () => { window.__hook = () => { ['grain','bandOv','vignette','bg'].forEach(id => document.getElementById(id).style.display = 'none'); }; });
  await browser.close();
})();
