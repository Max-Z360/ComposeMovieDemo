#!/usr/bin/env node
/**
 * Deterministic frame renderer.
 *
 * Loads src/index.html in headless Chromium, and for every frame calls
 *   window.seek(t)   // t in seconds; must synchronously put the page in the exact state for time t
 * then screenshots the viewport to frames/fNNNNN.png.
 *
 * Page contract (src/index.html must define):
 *   window.DURATION   -> total seconds (number)
 *   window.READY      -> Promise that resolves once fonts/assets are loaded and the timeline is built
 *   window.seek(t)    -> seeks the master timeline + redraws canvases for time t (synchronous)
 *
 * Usage:
 *   node tools/render.js [--fps 30] [--start 0] [--end DURATION] [--workers 4] [--scale 1]
 *                        [--frames frames] [--page src/index.html] [--jpeg]
 *   --scale 0.5  -> 960x540 preview frames (deviceScaleFactor), fast iteration
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require('/opt/node22/lib/node_modules/playwright'); } catch (e) {}
  throw new Error('playwright not found (set NODE_PATH=/opt/node22/lib/node_modules)');
}

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { fps: 30, start: 0, end: null, workers: Math.max(1, Math.min(4, os.cpus().length)), scale: 1, frames: 'frames', page: 'src/index.html', jpeg: false, width: 1920, height: 1080 };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--jpeg') { o.jpeg = true; continue; }
    const v = a[++i];
    if (k === '--fps') o.fps = +v;
    else if (k === '--start') o.start = +v;
    else if (k === '--end') o.end = +v;
    else if (k === '--workers') o.workers = +v;
    else if (k === '--scale') o.scale = +v;
    else if (k === '--frames') o.frames = v;
    else if (k === '--page') o.page = v;
    else if (k === '--width') o.width = +v;
    else if (k === '--height') o.height = +v;
  }
  return o;
}

async function main() {
  const opts = parseArgs();
  const root = path.resolve(__dirname, '..');
  const pageUrl = 'file://' + path.resolve(root, opts.page);
  const framesDir = path.resolve(root, opts.frames);
  fs.mkdirSync(framesDir, { recursive: true });

  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: ['--disable-gpu-vsync', '--disable-frame-rate-limit', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars'],
  });

  // Probe duration with a scout page.
  const scoutCtx = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: opts.scale });
  const scout = await scoutCtx.newPage();
  scout.on('pageerror', e => console.error('[pageerror]', e.message));
  scout.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await scout.goto(pageUrl, { waitUntil: 'load' });
  await scout.evaluate(() => window.READY);
  const duration = await scout.evaluate(() => window.DURATION);
  await scoutCtx.close();
  if (!(duration > 0)) throw new Error('window.DURATION missing or invalid: ' + duration);

  const end = opts.end == null ? duration : Math.min(opts.end, duration);
  const first = Math.round(opts.start * opts.fps);
  const last = Math.ceil(end * opts.fps) - 1; // inclusive
  const total = last - first + 1;
  const ext = opts.jpeg ? 'jpg' : 'png';
  console.log(`duration=${duration}s fps=${opts.fps} frames ${first}..${last} (${total}) workers=${opts.workers} scale=${opts.scale} -> ${framesDir}`);

  const t0 = Date.now();
  let done = 0;
  const chunk = Math.ceil(total / opts.workers);
  const workers = [];
  for (let w = 0; w < opts.workers; w++) {
    const from = first + w * chunk;
    const to = Math.min(last, from + chunk - 1);
    if (from > to) break;
    workers.push((async () => {
      const ctx = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: opts.scale });
      const page = await ctx.newPage();
      page.on('pageerror', e => console.error(`[w${w} pageerror]`, e.message));
      await page.goto(pageUrl, { waitUntil: 'load' });
      await page.evaluate(() => window.READY);
      // CDP capture is ~4x faster than page.screenshot (which uses max PNG compression)
      const cdp = await ctx.newCDPSession(page);
      // warm up: seek twice so layout/fonts settle
      await page.evaluate(t => window.seek(t), from / opts.fps);
      await page.evaluate(t => window.seek(t), from / opts.fps);
      for (let f = from; f <= to; f++) {
        const t = f / opts.fps;
        await page.evaluate(t => window.seek(t), t);
        const file = path.join(framesDir, `f${String(f).padStart(5, '0')}.${ext}`);
        const shot = await cdp.send('Page.captureScreenshot', opts.jpeg ? { format: 'jpeg', quality: 92 } : { format: 'png', optimizeForSpeed: true });
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        done++;
        if (done % 60 === 0 || done === total) {
          const el = (Date.now() - t0) / 1000;
          console.log(`${done}/${total} frames  ${(el).toFixed(1)}s elapsed  ${(el / done * 1000).toFixed(0)} ms/frame  eta ${((total - done) * el / done).toFixed(0)}s`);
        }
      }
      await ctx.close();
    })());
  }
  await Promise.all(workers);
  await browser.close();
  console.log(`done: ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
