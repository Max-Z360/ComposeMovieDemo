// Tipmi film, variant b — shot 13: the dot travels and becomes the first tittle; the wordmark blurs in around it;
// the second tittle arrives 90 ms later; tagline (Chosen firms 400 -> 600), hairline, CTA. Hard cut at 42.0.
(function () {
  const TB = (window.TB = window.TB || {});
  const { E, lerp } = TB;

  function placeBaseline(el, y) {
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    el.appendChild(probe);
    const off = probe.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.removeChild(probe);
    el.style.top = (y - off) + 'px';
  }

  TB.sceneLogo = {
    build(S, tl) {
      const world = document.getElementById('world');
      const host = document.createElement('div'); host.id = 'logo'; host.className = 'layer';
      host.style.transformOrigin = '173px 520px';
      world.appendChild(host);
      const wm = TB.buildWordmark(host, BRAND_NAME, { size: 176, x: 173, baseline: 520 });
      const wmClone = wm.el.cloneNode(true);
      wmClone.style.transformOrigin = '0px 80%';
      host.insertBefore(wmClone, wm.el);
      wm.tittles.forEach((tt) => { tt.el.style.display = 'none'; });
      // tagline
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.style.cssText = 'position:absolute;left:173px;top:0;font:400 44px/1 Fraunces;letter-spacing:-0.015em;color:var(--ink);white-space:nowrap;' +
        'font-variation-settings:"opsz" 144,"SOFT" 50,"WONK" 0';
      if (LANG === 'zh') tag.style.fontFamily = '"Noto Sans SC"';
      const mask = document.createElement('span'); mask.style.cssText = 'display:inline-block;overflow:hidden;padding:0.08em 0 0.24em;margin:-0.08em 0 -0.24em;vertical-align:baseline';
      const full = T.L10, firm = T.L10_firm;
      const rest = full.slice(firm.length);
      const words = [];
      const wFirm = document.createElement('span'); wFirm.textContent = firm; wFirm.style.cssText = 'display:inline-block;white-space:pre;position:relative';
      words.push(wFirm);
      (LANG === 'zh' ? [rest] : rest.split(/(?<= )/)).forEach((p) => { const s = document.createElement('span'); s.textContent = p; s.style.cssText = 'display:inline-block;white-space:pre;position:relative'; words.push(s); });
      words.forEach((w) => mask.appendChild(w));
      tag.appendChild(mask); host.appendChild(tag);
      placeBaseline(tag, 660);
      const hair = document.createElement('div');
      hair.style.cssText = 'position:absolute;left:173px;top:700px;width:40px;height:1px;background:var(--rule)';
      host.appendChild(hair);
      const cta = document.createElement('div'); cta.className = 'cap'; cta.textContent = CTA_TEXT();
      cta.style.left = '173px';
      host.appendChild(cta);
      placeBaseline(cta, 740);
      // the travelling dot (the same oxblood mark that has followed the work)
      const fly = document.createElement('div'); fly.className = 'dot'; fly.id = 'flyDot';
      world.appendChild(fly);
      const P = {};
      const sh = CUES.shots.logo;
      TB.tw(tl, P, 'fly', 0, 1, 37.3, 0.8, E.camera);
      // wordmark blur-in: quart in-out timed so it reaches 90 % exactly on the logo hit (brief §4 / §8 #15-16) —
      // a quint-out reached 90 % by 38.2 s and the word read 'Tipmı' for ~17 frames before the second tittle (38.661)
      const quartInOut = (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2);
      const U90 = 1 - Math.pow(0.2, 0.25) / 2;                       // quartInOut(U90) = 0.9
      TB.tw(tl, P, 'wm', 0, 1, CUES.lines.W[0], (CUES.hits.logo - CUES.lines.W[0]) / U90, quartInOut);
      // second tittle: its 90 ms fade starts on the logo hit (A5) and is complete on the E6 chime (38.661), so the
      // sharp word reads 'Tipmı' for at most the 2-3 frames before the hit (cubic-out: ≈ 70 % one frame after the hit)
      TB.tw(tl, P, 't2', 0, 1, CUES.hits.logo, 0.09, (x) => 1 - Math.pow(1 - x, 3));
      words.forEach((w, i) => { w.p = {}; TB.tw(tl, w.p, 'v', 0, 1, CUES.lines.L10[0] + 0.055 * i, 0.6, E.expoOut); });
      TB.tw(tl, P, 'firm', 0, 1, 39.5, 0.7, E.sineInOut);
      TB.tw(tl, P, 'hair', 0, 1, 39.7, 0.3, E.sineInOut);
      TB.tw(tl, P, 'cta', 0, 1, CUES.lines.L11[0], 0.4, E.sineInOut);
      TB.tw(tl, P, 'push', 0, 1, sh[0], sh[1] - sh[0], E.linear);
      S.logo = { host, wm, wmClone, tag, words, wFirm, hair, cta, fly, P };
      // second tittle is shown by its own element; the first is the flying dot
      S.logo.t2 = wm.tittles[1] ? wm.tittles[1].el : null;
    },
    update(t, S) {
      const Lo = S.logo, P = Lo.P;
      const on = t >= CUES.shots.logo[0];
      Lo.host.style.display = on ? 'block' : 'none';
      Lo.fly.style.display = on ? 'block' : 'none';
      if (!on) return;
      const push = 1 + 0.01 * (P.push || 0);
      Lo.host.style.transform = `scale(${push.toFixed(5)})`;
      // wordmark blur-in (reaches 90 % by 38.571)
      // blur-in on a clone; the resting wordmark is never filtered/transformed (crisp, history-independent)
      const w = P.wm || 0;
      const entering = w > 0 && w < 0.9999;
      const cs = Lo.wmClone.style, ws = Lo.wm.el.style;
      cs.display = entering ? 'block' : 'none';
      ws.display = w >= 0.9999 ? 'block' : 'none';
      if (entering) {
        cs.opacity = w.toFixed(4);
        cs.filter = `blur(${(10 * (1 - w)).toFixed(2)}px)`;
        cs.transform = `scale(${(1.03 - 0.03 * w).toFixed(4)})`;
      }
      // second tittle
      if (Lo.t2) {
        const v = P.t2 || 0, T2 = Lo.wm.tittles[1], dd = T2.d * (0.94 + 0.06 * v);
        Lo.t2.style.display = v > 0 ? 'block' : 'none';
        Lo.t2.style.opacity = v.toFixed(4);
        Lo.t2.style.width = Lo.t2.style.height = dd.toFixed(3) + 'px';
        Lo.t2.style.left = (T2.x - dd / 2).toFixed(3) + 'px'; Lo.t2.style.top = (T2.y - dd / 2).toFixed(3) + 'px';
      }
      // the flying dot: from the print's dot (stage coords at 37.143) to tittle 1 (host coords under push)
      const G = TB.sceneCarrier.geom(CUES.shots.logo[0], S);
      const p0 = TB.sceneCarrier.toStage(G, G.dotX, G.dotY);
      const t1 = Lo.wm.tittles[0];
      const o = { x: 173, y: 520 };
      const p1 = { x: o.x + (t1.x - o.x) * push, y: o.y + (t1.y - o.y) * push };
      const f = P.fly || 0;
      const d = lerp(G.d * G.sc, t1.d * push, f);
      const x = lerp(p0.x, p1.x, f), y = lerp(p0.y, p1.y, f);
      const fs = Lo.fly.style;
      fs.width = fs.height = d.toFixed(3) + 'px';
      fs.left = (x - d / 2).toFixed(3) + 'px'; fs.top = (y - d / 2).toFixed(3) + 'px';
      // tagline
      for (const wd of Lo.words) wd.style.top = `${((1 - (wd.p.v || 0)) * 1.3).toFixed(4)}em`;
      Lo.tag.style.display = (Lo.words[0].p.v || 0) > 0 ? 'block' : 'none';
      Lo.wFirm.style.fontVariationSettings = `"opsz" 144, "SOFT" 50, "WONK" 0, "wght" ${(400 + 200 * (P.firm || 0)).toFixed(1)}`;
      Lo.hair.style.opacity = (P.hair || 0).toFixed(4);
      Lo.cta.style.opacity = (P.cta || 0).toFixed(4);
    },
  };
  function CTA_TEXT() { return T.L11; }
})();
