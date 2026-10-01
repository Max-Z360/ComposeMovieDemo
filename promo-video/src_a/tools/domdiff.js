const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const [t, ...pre] = process.argv.slice(2).map(Number);
  const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files'] });
  const snap = async (order) => {
    const p = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    await p.goto('file://' + path.resolve('src_a/index.html'), { waitUntil: 'load' }); await p.evaluate(() => window.READY);
    for (const x of order) await p.evaluate(x => window.seek(x), x);
    return p.evaluate(() => [...document.querySelectorAll('#stage *')].map((e, i) => i + ' ' + e.tagName + '#' + e.id + '.' + (e.getAttribute('class') || '') + ' ' + (e.getAttribute('style') || '') + ' ' + [...e.attributes].filter(a => a.name !== 'style').map(a => a.name + '=' + a.value).join(' ')));
  };
  const a = await snap([t]), b = await snap([...pre, t]);
  a.forEach((x, i) => { if (x !== b[i]) console.log('A: ' + x.slice(0, 300) + '\nB: ' + b[i].slice(0, 300) + '\n'); });
  await browser.close();
})();
