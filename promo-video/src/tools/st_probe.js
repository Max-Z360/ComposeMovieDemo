const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const dump = async (seq) => {
    const p = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    await p.goto('file://' + path.resolve('src/index.html')); await p.evaluate(() => window.READY);
    if (seq) for (let f = 669; f < 672; f++) await p.evaluate((t) => window.seek(t), f / 30);
    await p.evaluate((t) => window.seek(t), 672 / 30);
    return p.evaluate(() => { const el = document.getElementById('L6'); return [el.style.cssText, ...[...el.querySelectorAll('.w')].map((w) => w.style.cssText), JSON.stringify({out:S.lines[5].p.out}), JSON.stringify(S.lines[5].words.map(w=>w.p.v))]; });
  };
  const a = await dump(false), b = await dump(true);
  a.forEach((x, i) => { if (x !== b[i]) console.log('DIFF', i, '\n fresh:', x, '\n seq  :', b[i]); });
  console.log('done');
  await browser.close();
})();
