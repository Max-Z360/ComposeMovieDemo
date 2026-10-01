// History-independence sweep: page A renders every frame sequentially (like one render.js worker);
// page B renders every Nth frame right after a jump from a far-away frame. Byte-compare the JPEGs.
// usage: node src/tools/sweep.js [step=3] [startF=0] [endF=1274]
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const STEP = +(process.argv[2] || 3), F0 = +(process.argv[3] || 0), F1 = +(process.argv[4] || 1274);
(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const open = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); p.on('pageerror', (e) => console.error('[pageerror]', e.message));
    await p.goto('file://' + path.resolve('src/index.html'), { waitUntil: 'load' }); await p.evaluate(() => window.READY);
    return { p, cdp: await ctx.newCDPSession(p) };
  };
  const [A, B] = await Promise.all([open(), open()]);
  const cap = async (X, f) => { await X.p.evaluate((t) => window.seek(t), f / 30); return (await X.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 })).data; };
  const seqA = (async () => { const out = {}; await cap(A, F0); for (let f = F0; f <= F1; f++) { const d = await cap(A, f); if ((f - F0) % STEP === 0) out[f] = d; } return out; })();
  const jumpB = (async () => { const out = {}; for (let f = F0; f <= F1; f += STEP) { await cap(B, (f + 637) % 1275); out[f] = await cap(B, f); } return out; })();
  const [a, b] = await Promise.all([seqA, jumpB]);
  const bad = Object.keys(b).filter((f) => a[f] !== b[f]);
  if (bad.length) { require('fs').writeFileSync('/tmp/claude-0/-home-user-ComposeMovieDemo/64014344-234f-5de2-b409-8b908b1da61a/scratchpad/ha.png', Buffer.from(a[bad[Math.floor(bad.length/2)]], 'base64')); require('fs').writeFileSync('/tmp/claude-0/-home-user-ComposeMovieDemo/64014344-234f-5de2-b409-8b908b1da61a/scratchpad/hb.png', Buffer.from(b[bad[Math.floor(bad.length/2)]], 'base64')); }
  console.log(`checked ${Object.keys(b).length} frames, history-dependent: ${bad.length}`, bad.join(' '));
  await browser.close();
})();
