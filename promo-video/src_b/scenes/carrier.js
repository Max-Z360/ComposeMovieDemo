// Tipmi film, variant b — THE CARRIER: the hero plate as one mounted object from the reveal to the logo.
// Rect, mat, rotation and push-in are pure keyframe tracks of t; reveals/lift/fades are GSAP proxies.
// Visible 11.429–20.0 (reveal, wall) and 25.143–37.443 (studio, publish, ledger, print); between 20.0 and 25.143
// its pixel-identical copy lives inside the phone column (feed.js) — the hand-offs happen on identical rects.
(function () {
  const TB = (window.TB = window.TB || {});
  const { E, clamp, prog } = TB;
  const C = () => CUES;

  const REVEAL = { x: 1144, y: 220, w: 480, h: 640, m: 24, mb: 24, d: 18 , di: 0, fs: 22 };   // mount (1120,196) 528×688
  const WALLR = { x: 985, y: 200, w: 330, h: 440, m: 12, mb: 12, d: 14 , di: 0, fs: 22 };     // mount (973,188) 354×464
  const STUDIO = { x: 1124, y: 200, w: 510, h: 680, m: 24, mb: 24, d: 18 , di: 0, fs: 22 };   // mount (1100,176) 558×728
  const PRINT = { x: 1120, y: 200, w: 480, h: 640, m: 40, mb: 80, d: 18 , di: 0, fs: 22 };    // mount (1080,160) 560×760, −1.5°
  TB.CARRIER = { REVEAL, WALLR, STUDIO, PRINT };

  TB.sceneCarrier = {
    build(S, tl) {
      const world = document.getElementById('world');
      const g = document.createElement('div'); g.className = 'group'; g.id = 'carrier';
      const mount = document.createElement('div'); mount.className = 'mount';
      const cv = TB.makeCanvas(S.lib.hero.canvas.width, S.lib.hero.canvas.height);
      mount.appendChild(cv);
      const cap = document.createElement('div'); cap.className = 'cap'; cap.textContent = T.ui.heroCaption;
      const capMask = document.createElement('div'); capMask.style.cssText = 'position:absolute;overflow:hidden;padding:2px 0 6px;';
      capMask.appendChild(cap); cap.style.position = 'relative';
      const dot = document.createElement('div'); dot.className = 'dot';
      const pub = document.createElement('div'); pub.className = 'cap muted'; pub.textContent = T.ui.published;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('width', 1920); svg.setAttribute('height', 1080);
      svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
      const frame = document.createElementNS(svgNS, 'rect');
      frame.setAttribute('fill', 'none'); frame.setAttribute('stroke', ACCENT); frame.setAttribute('stroke-width', '2');
      svg.appendChild(frame);
      g.appendChild(mount); g.appendChild(svg); g.appendChild(capMask); g.appendChild(dot); g.appendChild(pub);
      world.appendChild(g);
      const H = (S.hero = { g, mount, cv, cap, capMask, dot, pub, frame, key: -1, p: {} });

      const sh = C().shots, k = C().ratchet;
      H.rect = TB.track([
        { t: 0, v: REVEAL },
        { t: sh.wall[0], dur: 0.8, ease: E.expoOut, v: WALLR },
        { t: 25.143, dur: 1e-6, v: TB.FEED_HERO_HANDOFF },               // the phone copy's rect at 25.143 (flat phone)
        { t: 25.143 + 2e-6, dur: 0.571, ease: E.expoOut, v: STUDIO },
        { t: sh.human[0], dur: 0.9, ease: E.camera, v: PRINT },
      ]);
      H.rot = TB.track([{ t: 0, v: { r: 0 } }, { t: sh.human[0], dur: 0.9, ease: E.camera, v: { r: -1.5 } }]);
      H.push = TB.track([
        { t: 0, v: { s: 1 } },
        { t: sh.reveal[0], dur: 5.714, ease: E.camera, v: { s: 1.02 } },
        { t: sh.wall[0], dur: 0.8, ease: E.expoOut, v: { s: 1.0 } },
        { t: sh.wall[0] + 0.8, dur: 2.057, v: { s: 1.01 } },
        { t: 25.143, dur: 1e-6, v: { s: 1.0 } },
        { t: sh.studio[0], dur: sh.human[0] - sh.studio[0], v: { s: 1.025 } },
        { t: sh.human[0], dur: 0.9, ease: E.camera, v: { s: 1.0 } },
        { t: sh.human[0] + 0.9, dur: 1.957, v: { s: 1.02 } },
      ]);
      H.shadow = TB.track([{ t: 0, v: { p: 0 } }, { t: sh.human[0], dur: 0.9, ease: E.camera, v: { p: 1 } }]);
      const P = H.p;
      TB.tw(tl, P, 'rin', 0, 1, sh.reveal[0], 0.65, E.quintOut);         // plate blur-in from 96 %
      TB.tw(tl, P, 'cap', 0, 1, 12.143, 0.6, E.expoOut);                 // caption masked rise
      TB.tw(tl, P, 'frame', 0, 1, 12.857, 0.5, E.camera);                 // chosen frame draws clockwise
      TB.tw(tl, P, 'frameOut', 0, 1, 14.15, 0.5, E.sineInOut);           // ...its job done, it recedes
      TB.tw(tl, P, 'dot', 0, 1, C().ticks[0], 0.12, E.quintOut);          // the dot sets on the tick (13.357)
      TB.tw(tl, P, 'lift', 0, 1, C().risers.lift[0], 0.4, TB.bezier(0.5, 0, 0.2, 1));   // 30.143 lift (100 ms lead, quint-out)
      TB.tw(tl, P, 'settle', 0, 1, 30.543, 0.36, E.quintOut);            // settles by 30.9
      TB.tw(tl, P, 'pub', 0, 1, 31.0, 0.4, E.quintOut);                  // "Published today"
      TB.tw(tl, P, 'pubOut', 0, 1, sh.human[0], 0.4, E.sineInOut);
      TB.tw(tl, P, 'fade', 0, 1, sh.logo[0], 0.3, E.sineInOut);           // print/caption go; the dot stays (logo.js)
    },
    // full geometry at time t (also used by logo.js for the dot's start)
    geom(t, S) {
      const H = S.hero, P = H.p;
      const r = H.rect(t);
      const mx = r.x - r.m, my = r.y - r.m, mw = r.w + 2 * r.m, mh = r.h + r.m + r.mb;
      const lift = (P.lift || 0) * (1 - (P.settle || 0));
      const rin = P.rin || 0;
      const sc = H.push(t).s * (0.96 + 0.04 * rin) * (1 + 0.05 * lift);
      const cx = mx + mw / 2, cy = my + mh / 2;
      const di = r.di;
      const capTop = my + mh + 16 + (10 - 16) * di;
      const d = r.d;
      return { r, mx, my, mw, mh, cx, cy, sc, rot: H.rot(t).r, ly: -24 * lift, lift, capTop, d, di,
        dotX: mx + (-15 - d / 2) * (1 - di) + 7 * di, dotY: capTop + 15 - 0.5 * di };
    },
    // map a point in the carrier's local (unscaled) coords to stage coords
    toStage(G, x, y) {
      const a = (G.rot * Math.PI) / 180, c = Math.cos(a) * G.sc, s = Math.sin(a) * G.sc;
      const dx = x - G.cx, dy = y - G.cy;
      return { x: G.cx + dx * c - dy * s, y: G.cy + G.ly + dx * s + dy * c };
    },
    update(t, S) {
      const H = S.hero, P = H.p;
      const on = (t >= CUES.shots.reveal[0] && t < CUES.shots.column[0]) || (t >= 25.143 && t < CUES.shots.logo[0] + 0.3);
      H.g.style.display = on ? 'block' : 'none';
      if (!on) return;
      const G = this.geom(t, S);
      H.g.style.transform = `translate(${G.cx.toFixed(2)}px, ${(G.cy + G.ly).toFixed(2)}px) rotate(${G.rot.toFixed(3)}deg) scale(${G.sc.toFixed(5)}) translate(${(-G.cx).toFixed(2)}px, ${(-G.cy).toFixed(2)}px)`;
      const rin = P.rin || 0;
      H.g.style.opacity = (Math.min(1, rin * 1.4) * (1 - (P.fade || 0))).toFixed(4);
      // blur-in only during the reveal window (≤ 1 blurred element at once with L4 not yet in)
      H.mount.style.filter = rin < 0.999 ? `blur(${(10 * (1 - rin)).toFixed(2)}px)` : '';
      const ms = H.mount.style;
      ms.left = G.mx + 'px'; ms.top = G.my + 'px'; ms.width = G.mw + 'px'; ms.height = G.mh + 'px';
      const cs = H.cv.style;
      cs.left = (G.r.m - 1) + 'px'; cs.top = (G.r.m - 1) + 'px'; cs.width = G.r.w + 'px'; cs.height = G.r.h + 'px';
      // shadow: plate -> lifted -> physical print
      const sp = H.shadow(t).p, L = G.lift;
      const a1 = 0.08 + 0.04 * sp + 0.04 * L, y2 = 24 + 8 * sp + 20 * L, b2 = 48 + 16 * sp + 30 * L, a2 = 0.14 + 0.04 * sp + 0.04 * L;
      ms.boxShadow = `${4 + 2 * L}px ${2 + 2 * L}px ${4 + 4 * L}px rgba(20,19,17,${a1.toFixed(3)}), ${10 + 6 * L}px ${y2.toFixed(1)}px ${b2.toFixed(1)}px rgba(20,19,17,${a2.toFixed(3)})` +
        (sp > 0 ? `, inset 0 1px 0 rgba(255,255,255,${(0.9 * sp).toFixed(3)})` : '');
      // content: warmth grade index (studio dial), redrawn only when it changes (pure in its key)
      const key = S.warmK || 0;
      if (key !== H.key) { const c = H.cv.getContext('2d'); c.drawImage(S.lib.warmth[key], 0, 0); H.key = key; }
      // caption (masked rise), dot, published
      const cm = H.capMask.style;
      cm.left = (G.mx + 22 * G.di) + 'px'; cm.top = (G.capTop - 2) + 'px';
      H.cap.style.fontSize = G.r.fs.toFixed(3) + 'px';
      H.cap.style.transform = `translateY(${((1 - (P.cap || 0)) * 120).toFixed(2)}%)`;
      const dv = P.dot || 0;
      const ds = H.dot.style;
      ds.display = dv > 0 ? 'block' : 'none';
      ds.width = ds.height = G.d + 'px';
      ds.left = (G.dotX - G.d / 2) + 'px'; ds.top = (G.dotY - G.d / 2) + 'px';
      ds.transform = `scale(${(0.94 + 0.06 * dv).toFixed(4)})`;
      ds.opacity = t >= CUES.shots.logo[0] ? '0' : '1';            // logo.js flies its own dot from here
      const ps = H.pub.style;
      const pv = (P.pub || 0) * (1 - (P.pubOut || 0));
      ps.display = pv > 0 ? 'block' : 'none';
      ps.left = G.mx + 'px'; ps.top = (G.capTop + 34) + 'px'; ps.opacity = pv.toFixed(4);
      // chosen frame
      const fv = P.frame || 0, fo = 1 - (P.frameOut || 0);
      if (fv > 0 && fo > 0) {
        const f = H.frame;
        f.style.display = 'block';
        f.setAttribute('x', G.mx - 1); f.setAttribute('y', G.my - 1); f.setAttribute('width', G.mw + 2); f.setAttribute('height', G.mh + 2);
        const per = 2 * (G.mw + G.mh + 4);
        f.setAttribute('stroke-dasharray', `${per} ${per}`);
        f.setAttribute('stroke-dashoffset', (per * (1 - fv)).toFixed(2));
        f.style.opacity = fo.toFixed(4);
      } else H.frame.style.display = 'none';
    },
  };
})();
