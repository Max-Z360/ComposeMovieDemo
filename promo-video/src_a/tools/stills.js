#!/usr/bin/env node
// Render a list of timestamps of src_a/index.html to JPEGs and a labelled montage (review helper).
// node src_a/tools/stills.js <outdir> <scale> t1 t2 ...
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
(async () => {
  const [out, scale, ...ts] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/^s_.*\.jpg$/.test(f)) fs.unlinkSync(path.join(out, f));
  const browser = await pw.chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: +scale });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.error('[pageerror]', e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + (process.env.Q || ''), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  const cdp = await ctx.newCDPSession(p);
  const files = [];
  for (const t of ts) {
    await p.evaluate(t => window.seek(t), +t);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    const f = path.join(out, `s_${(+t).toFixed(3).padStart(7, '0')}.jpg`);
    fs.writeFileSync(f, Buffer.from(shot.data, 'base64')); files.push([f, t]);
  }
  await browser.close();
  const font = execSync("fc-match -f '%{file}' 'DejaVu Sans'").toString();
  const tiles = files.map(([f, t], i) => { const o = path.join(out, `tile_${String(i).padStart(3, '0')}.png`); execSync(`ffmpeg -y -hide_banner -loglevel error -i ${f} -vf "scale=640:-1,drawtext=fontfile=${font}:text='${(+t).toFixed(3)}s':x=10:y=8:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6" ${o}`); return o; });
  const cols = Math.min(3, tiles.length), rows = Math.ceil(tiles.length / cols);
  execSync(`ffmpeg -y -hide_banner -loglevel error -framerate 1 -i ${out}/tile_%03d.png -vf "tile=${cols}x${rows}:padding=6:margin=6:color=0x202020" -frames:v 1 ${out}/montage.png`);
  tiles.forEach(t => fs.unlinkSync(t));
  console.log('montage', path.join(out, 'montage.png'));
})().catch(e => { console.error(e); process.exit(1); });
