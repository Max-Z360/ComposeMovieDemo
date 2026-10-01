#!/usr/bin/env node
// Acceptance probe (brief §8 #2, #4, #5) over every frame: which display lines are visible, the extents of every
// visible text glyph (safe margins), every mounted plate / phone rect incl. shadow reach (clipping), and — added in
// the column-fly pass — overlapping text (two visible text boxes intersecting) and plate bounds in the fly window.
// usage (from promo-video/):
//   node src/tools/accept.js [step=1] > out/accept.json       DOM probe, summary on stderr
//   node src/tools/accept.js caps [f0=530] [f1=600] [step=10]  per-caption darkest-glyph luminance from screenshots
//                                                             (wall captions must agree within ±4 levels)
//   node src/tools/accept.js bezel [f0=754] [f1=762]           no phone chrome painted over the carrier (pixel diff)
const path = require('path');
const zlib = require('zlib');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const ARGS = { args: ['--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--allow-file-access-from-files'] };

// minimal PNG decoder (8-bit RGB/RGBA, non-interlaced: what Chromium's screenshot writes)
function decodePNG(buf) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; }
    else if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y > 0 ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}

async function caps() {
  const f0 = +(process.argv[3] || 530), f1 = +(process.argv[4] || 600), st = +(process.argv[5] || 10);
  const browser = await chromium.launch(ARGS);
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('src/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  let worstSpread = 0;
  for (let f = f0; f <= f1; f += st) {
    const boxes = await p.evaluate((f) => {
      window.seek(f / 30);
      const out = [];
      document.querySelectorAll('#world .cap').forEach((el) => {
        let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return; o *= +cs.opacity; }
        if (o < 0.99 || !el.textContent.trim() || el.closest('#topbar') || el.closest('.hdr')) return;
        const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect();
        if (r.width < 4) return;
        out.push({ txt: el.textContent, l: Math.floor(r.left), t: Math.floor(r.top), r: Math.ceil(r.right), b: Math.ceil(r.bottom) });
      });
      return out;
    }, f);
    const img = decodePNG(await p.screenshot({ type: 'png' }));
    // the same frame without the moving window-light overlay: the band lifts ink by design, the check is for raster greys
    await p.evaluate(() => { document.getElementById('bandOv').style.display = 'none'; });
    const imgNB = decodePNG(await p.screenshot({ type: 'png' }));
    const res = boxes.map((b) => {
      const dark = (img) => {
        const lum = [];
        for (let y = Math.max(0, b.t); y < Math.min(img.h, b.b); y++) for (let x = Math.max(0, b.l); x < Math.min(img.w, b.r); x++) {
          const i = (y * img.w + x) * img.bpp; lum.push(0.2126 * img.px[i] + 0.7152 * img.px[i + 1] + 0.0722 * img.px[i + 2]);
        }
        lum.sort((a, z) => a - z);
        return { min: Math.round(lum[0]), dark20: +(lum.slice(0, 20).reduce((s, v) => s + v, 0) / Math.min(20, lum.length)).toFixed(1) };
      };
      const a = dark(img), n = dark(imgNB);
      return { txt: b.txt, min: a.min, dark20: a.dark20, nb: n.dark20 };
    });
    const d = res.map((r) => r.nb), spread = d.length ? Math.max(...d) - Math.min(...d) : 0;
    worstSpread = Math.max(worstSpread, spread);
    console.log(`f${f}  spread ${spread.toFixed(1)} (band off)  ` + res.map((r) => `${r.txt.split(' —')[0]}:${r.min}/${r.nb}`).join('  '));
  }
  console.log(`columns: name:darkest pixel (as rendered)/mean of the 20 darkest pixels (band overlay off)`);
  console.log(`worst spread ${worstSpread.toFixed(1)} levels -> ${worstSpread <= 8 ? 'PASS (all within ±4)' : 'FAIL'}`);
  await browser.close();
}

async function dom() {
  const step = +(process.argv[2] || 1);
  const browser = await chromium.launch(ARGS);
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('src/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  const rows = [];
  for (let f = 0; f < 1275; f += step) {
    rows.push(await p.evaluate((f) => {
      window.seek(f / 30);
      const vis = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return o; };
      // clip a rect by overflow-hidden ancestors and inset() clip-paths
      const clip = (el, L, T, R, B) => {
        for (let e = el; e && e.id !== 'stage'; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.overflow === 'hidden' || cs.overflowY === 'hidden') { const q = e.getBoundingClientRect(); L = Math.max(L, q.left); T = Math.max(T, q.top); R = Math.min(R, q.right); B = Math.min(B, q.bottom); }
          const cp = e.style.clipPath; if (cp && cp.startsWith('inset(')) { const v = cp.slice(6).split(/[ )]/).filter((x) => x.endsWith('px')).map(parseFloat); const q = e.getBoundingClientRect(); L = Math.max(L, q.left + v[3]); T = Math.max(T, q.top + v[0]); R = Math.min(R, q.right - v[1]); B = Math.min(B, q.bottom - v[2]); }
        }
        return [L, T, R, B];
      };
      const lines = [];
      document.querySelectorAll('#type .line').forEach((el) => { if (el.id.endsWith('_in') && getComputedStyle(el).display === 'none') return; const o = vis(el); if (o > 0.02) lines.push([el.id.replace('_in', ''), +o.toFixed(3)]); });
      // text glyph extents: every text node with visible opacity, clipped to its overflow:hidden ancestors
      let tx = { l: 1e9, t: 1e9, r: -1e9, b: -1e9, who: {} };
      const boxes = [];
      const w = document.createTreeWalker(document.getElementById('stage'), NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement; const o = vis(el); if (o < 0.05) continue;
        const key = el.closest('.line, .wordmark, .tag') || el;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) {
          if (r.width < 1) continue;
          const [L, T, R, B] = clip(el, r.left, r.top, r.right, r.bottom);
          if (R - L < 1 || B - T < 1) continue;
          boxes.push({ key, s: n.textContent.slice(0, 24), L, T, R, B, o });
          if (L < tx.l) { tx.l = L; tx.who.l = n.textContent.slice(0, 24); }
          if (T < tx.t) { tx.t = T; tx.who.t = n.textContent.slice(0, 24); }
          if (R > tx.r) { tx.r = R; tx.who.r = n.textContent.slice(0, 24); }
          if (B > tx.b) { tx.b = B; tx.who.b = n.textContent.slice(0, 24); }
        }
      }
      // overlapping text: two visible boxes from different blocks intersecting by more than 2 px both ways
      const over = [];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]; if (a.key === b.key) continue;
        const ix = Math.min(a.R, b.R) - Math.max(a.L, b.L), iy = Math.min(a.B, b.B) - Math.max(a.T, b.T);
        if (ix > 2 && iy > 2) over.push(`${a.s}|${b.s}`);
      }
      const mounts = [];
      document.querySelectorAll('.mount, #device, #print').forEach((el) => {
        const o = vis(el); if (o < 0.05) return; const r = el.getBoundingClientRect(); if (r.width < 2) return;
        const [L, T, R, B] = clip(el, r.left, r.top, r.right, r.bottom); if (R - L < 1 || B - T < 1) return;
        mounts.push([el.id || el.className, Math.round(L), Math.round(T), Math.round(R), Math.round(B), getComputedStyle(el).boxShadow.slice(0, 80), +o.toFixed(2)]);
      });
      return { f, lines, over, tx: tx.l < 1e9 ? { l: Math.round(tx.l), t: Math.round(tx.t), r: Math.round(1920 - tx.r), b: Math.round(1080 - tx.b), who: tx.who } : null, mounts };
    }, f));
  }
  await browser.close();
  process.stdout.write(JSON.stringify(rows));
  // summary
  const span = {};
  for (const r of rows) for (const [id] of r.lines) { span[id] = span[id] || [r.f, r.f]; span[id][1] = r.f; }
  console.error('line spans (first..last visible frame):');
  for (const k in span) console.error(' ', k, span[k][0], '..', span[k][1], `(${(span[k][0] / 30).toFixed(3)}..${((span[k][1] + 1) / 30).toFixed(3)} s)`);
  const over = rows.filter((r) => r.lines.length > 1); console.error('frames with >1 display line:', over.length, over.slice(0, 5).map((r) => r.f + ':' + r.lines.map((x) => x[0]).join('+')).join(' '));
  const tov = rows.filter((r) => r.over.length && r.f < 1260);
  console.error('frames with overlapping text boxes:', tov.length, tov.slice(0, 8).map((r) => `f${r.f}:${r.over[0]}`).join('  '));
  let worst = { l: 1e9, t: 1e9, r: 1e9, b: 1e9 };
  for (const r of rows) if (r.tx && r.f < 1260) for (const k of ['l', 't', 'r', 'b']) if (r.tx[k] < worst[k]) worst[k] = r.tx[k], worst[k + 'f'] = r.f, worst[k + 'w'] = r.tx.who[k];
  console.error('text margins (min px to edge) over picture frames 0..1259, ink hook wall excluded n/a (canvas):', JSON.stringify(worst));
  // column fly + chrome dissolve: every visible plate inside the frame (top >= 0, bottom < 1040)
  const fly = rows.filter((r) => (r.f >= 600 && r.f <= 630) || (r.f >= 750 && r.f <= 770));
  const bad = [];
  for (const r of fly) for (const m of r.mounts) if (m[0] === 'mount' && (m[2] < 0 || m[4] >= 1040)) bad.push(`f${r.f}:[${m.slice(1, 5)}]`);
  console.error('plates outside 0..1040 in f600-630 / f750-770:', bad.length, bad.slice(0, 8).join(' '));
  let tmin = { b: 1e9 };
  for (const r of fly) if (r.tx && r.tx.b < tmin.b) tmin = { b: r.tx.b, f: r.f, who: r.tx.who.b };
  console.error('lowest text in those windows (px to bottom edge):', JSON.stringify(tmin));
}

// chrome dissolve (brief §2 Do 1, shot 8): once the carrier has taken over (25.143) nothing of the fading phone —
// bezel ring, glare, header, its shadow or AO — may paint over the hero mount or its caption. Each frame is
// captured as rendered and again with the phone chrome hidden. Inside the carrier's mount and dot the two must agree
// (no pixel differs by more than 2 levels). The caption box is transparent between glyphs, so the fading ring and the
// phone shadow show BEHIND its text for a few frames: there the difference must stay <= 32 levels (ring <= ~12 %).
async function bezel() {
  const f0 = +(process.argv[3] || 754), f1 = +(process.argv[4] || 762);
  const browser = await chromium.launch(ARGS);
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await p.goto('file://' + path.resolve('src/index.html'), { waitUntil: 'load' });
  await p.evaluate(() => window.READY);
  let fails = 0;
  for (let f = f0; f <= f1; f++) {
    const rects = await p.evaluate((f) => {
      window.seek(f / 30);
      const H = window.S.hero;
      if (getComputedStyle(H.g).display === 'none') return null;
      return [H.mount, H.capMask, H.dot].filter((e) => getComputedStyle(e).display !== 'none')
        .map((e) => { const r = e.getBoundingClientRect(); return [Math.ceil(r.left), Math.ceil(r.top), Math.floor(r.right), Math.floor(r.bottom)]; });
    }, f);
    if (!rects) { console.log(`f${f}  carrier not on`); continue; }
    const a = decodePNG(await p.screenshot({ type: 'png' }));
    await p.evaluate(() => { const F = window.S.feed; for (const e of [F.device, F.pshadow, F.ao]) e.style.visibility = 'hidden'; });
    const b = decodePNG(await p.screenshot({ type: 'png' }));
    await p.evaluate(() => { const F = window.S.feed; for (const e of [F.pshadow, F.ao]) e.style.visibility = ''; });
    let n = 0, worst = 0, capWorst = 0; const per = [];
    for (const [ri, [L, T, R, B]] of rects.entries()) {
      let k = 0;
      for (let y = Math.max(0, T); y < Math.min(a.h, B); y++) for (let x = Math.max(0, L); x < Math.min(a.w, R); x++) {
        const i = (y * a.w + x) * a.bpp;
        const d = Math.max(Math.abs(a.px[i] - b.px[i]), Math.abs(a.px[i + 1] - b.px[i + 1]), Math.abs(a.px[i + 2] - b.px[i + 2]));
        if (ri === 1) { if (d > capWorst) capWorst = d; continue; }
        if (d > 2) k++; if (d > worst) worst = d;
      }
      per.push(k); n += k;
    }
    if (n || capWorst > 32) fails++;
    console.log(`f${f}  phone pixels over mount/dot: ${per[0]}/${per[2] || 0} (max diff ${worst}); behind the caption text: max diff ${capWorst}`);
  }
  console.log(fails ? `FAIL: ${fails} frames with phone chrome over the carrier` : 'PASS: the carrier is above the fading phone on every frame');
  await browser.close();
}

const MODE = process.argv[2];
(MODE === 'caps' ? caps() : MODE === 'bezel' ? bezel() : dom()).catch((e) => { console.error(e); process.exit(1); });
