// Tipmi film, variant b — shots 5(top bar) 6–8: the wall, the column, the phone drawn around it, the device rest.
// One set of mounted plates: wall rect -> column rect (inside a full-stage clip that tightens to the screen) ->
// scroll -> bezel draws + thickens -> 7° dolly -> flat -> chrome dissolves while the hero re-targets (carrier.js).
(function () {
  const TB = (window.TB = window.TB || {});
  const { E, clamp, prog, smoothstep, lerp } = TB;

  // ---- wall layout (mount rects; image = mount inset by the 12 px mat). Reading order = array order.
  const WALL = [
    { lib: 9, m: [173, 356, 324, 249] },    // P1 Elin Sato — Dusk, 02
    { lib: 17, m: [573, 356, 240, 312] },   // P2 Clara Nyberg — Velvet, dusk
    { lib: 12, m: [1391, 188, 324, 424] },  // P7 Kofi Mensah — Contours
    { lib: 3, m: [173, 687, 324, 249] },    // P4 Jun Park — Clay, studies
    { lib: 7, m: [573, 736, 204, 204] },    // P3 Aya Toda — Mass & void
    { lib: 14, m: [973, 728, 288, 222] },   // P5 Ilse Brandt — Weather, 04
    { lib: 5, m: [1391, 676, 204, 264] },   // P6 Tomas Reyes — Tide, no. 7
  ];
  // ---- phone column order (lib ids; 0 = hero, second from top)
  const COL = [17, 0, 9, 7, 3, 14, 5, 12];
  const SCR = { x: 975, y: 97, w: 410, h: 886, r: 52 };
  const HDR = 102, PADX = 16, IMGW = 362, MAT = 8;
  const RATIO = { 0: 4 / 3, 9: 0.75, 17: 4 / 3, 7: 1, 3: 0.75, 14: 0.75, 5: 4 / 3, 12: 4 / 3 };
  const colY = {}; // mount top at scroll 0
  { let y = SCR.y + HDR + 16; for (const id of COL) { colY[id] = y; y += IMGW * RATIO[id] + 2 * MAT + 10 + 26 + 24; } }
  const TAP = 24.286, HERO_TOP_AT_TAP = 223;
  const B = colY[0] - HERO_TOP_AT_TAP - 40 * (TAP - 22.857), A = B / 2;
  function scroll(t) {
    if (t < 20.7) return 0;
    if (t < 21.6) return A * smoothstep(20.7, 21.6, t);
    if (t < 22.0) return A;
    if (t < 22.857) return A + (B - A) * smoothstep(22.0, 22.857, t);
    return B + 40 * (Math.min(t, TAP) - 22.857);
  }
  function colRect(id, t) {
    const y = colY[id] - scroll(t);
    return { x: SCR.x + PADX + MAT, y: y + MAT, w: IMGW, h: IMGW * RATIO[id], m: MAT, mb: MAT, d: 14, di: 1, fs: 21 };
  }
  TB.FEED_HERO_HANDOFF = colRect(0, 25.143);
  TB.FEED = { colRect, scroll, SCR };

  const wallPush = (t) => 1 + 0.01 * prog(t, 17.943, 2.057);

  TB.sceneFeed = {
    build(S, tl) {
      const world = document.getElementById('world');
      const P = (S.feedP = {});
      // ---------- top bar (page): appears 14.286, goes with the column 20.0
      const top = document.createElement('div'); top.id = 'topbar'; top.className = 'layer';
      top.innerHTML = `<div class="brand"></div><div class="today cap muted"></div><div class="rule"></div>`;
      top.querySelector('.brand').textContent = BRAND_NAME;
      top.querySelector('.today').textContent = T.ui.today;
      world.appendChild(top);
      const wallRule = document.createElement('div');
      wallRule.style.cssText = 'position:absolute;left:173px;top:330px;width:736px;height:1px;background:var(--rule);transform-origin:0 0';
      world.appendChild(wallRule);
      TB.tw(tl, P, 'top', 0, 1, CUES.hits.reveal + 2.857, 0.4, E.sineInOut);
      TB.tw(tl, P, 'topOut', 0, 1, CUES.shots.column[0], 0.3, E.sineInOut);
      TB.tw(tl, P, 'rule', 0, 1, CUES.shots.wall[0] + 0.1, 0.6, E.expoOut);

      // ---------- phone: shadow + AO (stage plane), device (screen clip + bezel + glare)
      const ao = document.createElement('div');
      ao.style.cssText = 'position:absolute;left:898px;top:955px;width:564px;height:90px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%, rgba(205,198,186,.55), rgba(205,198,186,0) 70%)';
      const pshadow = document.createElement('div');
      pshadow.style.cssText = 'position:absolute;left:963px;top:85px;width:434px;height:910px;border-radius:64px;box-shadow:0 4px 10px rgba(20,19,17,.14), 0 30px 64px rgba(20,19,17,.22)';
      world.appendChild(ao); world.appendChild(pshadow);
      const device = document.createElement('div'); device.id = 'device'; device.className = 'layer';
      const screen = document.createElement('div'); screen.id = 'screen'; screen.className = 'layer';
      device.appendChild(screen);
      world.appendChild(device);

      // header inside the screen
      const hdr = document.createElement('div'); hdr.className = 'hdr';
      hdr.style.cssText = `left:${SCR.x}px;top:${SCR.y}px;width:${SCR.w}px;height:${HDR}px;`;
      hdr.innerHTML =
        `<div class="status"><span style="position:absolute;left:30px" class="tnum"></span>` +
        `<svg style="position:absolute;right:26px;top:17px" width="62" height="12" viewBox="0 0 62 12" fill="none" stroke="#6E6A63" stroke-width="1">` +
        `<path d="M1 11V8M5 11V6M9 11V3.5M13 11V1"/><path d="M24 4.5a9 9 0 0 1 12 0M26.5 7.2a5 5 0 0 1 7 0"/><circle cx="30" cy="10" r="0.9" fill="#6E6A63" stroke="none"/>` +
        `<rect x="41.5" y="1.5" width="17" height="9" rx="2.5"/><path d="M60.5 4.5v3"/><rect x="43.5" y="3.5" width="10" height="5" rx="1" fill="#6E6A63" stroke="none"/></svg></div>` +
        `<div class="appbar"><span class="b" style="position:absolute;left:20px;top:13px;font:500 25px/1 Fraunces;letter-spacing:-0.015em;color:var(--ink);font-variation-settings:'opsz' 72,'SOFT' 50"></span>` +
        `<span class="cap muted" style="position:absolute;right:20px;top:16px;font-size:21px"></span></div>`;
      hdr.querySelector('.tnum').textContent = T.ui.time;
      hdr.querySelector('.b').textContent = BRAND_NAME;
      hdr.querySelector('.appbar .cap').textContent = T.ui.today;
      // glare
      const glare = document.createElement('div');
      glare.style.cssText = `position:absolute;left:${SCR.x}px;top:${SCR.y}px;width:${SCR.w}px;height:${SCR.h}px;border-radius:${SCR.r}px;` +
        'background:linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.16) 46%, rgba(255,255,255,0) 62%);background-size:300% 100%;background-repeat:no-repeat';
      // bezel: one rounded-rect path on the ring's mid-line, drawn then thickened to 12 px (fills the ring exactly)
      const svgNS = 'http://www.w3.org/2000/svg';
      const bez = document.createElementNS(svgNS, 'svg');
      bez.setAttribute('width', 1920); bez.setAttribute('height', 1080); bez.style.cssText = 'position:absolute;left:0;top:0';
      const ring = document.createElementNS(svgNS, 'rect');
      const RX = 969, RY = 91, RW = 422, RH = 898, RR = 58;
      Object.entries({ x: RX, y: RY, width: RW, height: RH, rx: RR, ry: RR, fill: 'none', stroke: '#1A1917' }).forEach(([k, v]) => ring.setAttribute(k, v));
      const edge = document.createElementNS(svgNS, 'rect');
      Object.entries({ x: 963.5, y: 85.5, width: 433, height: 909, rx: 63.5, ry: 63.5, fill: 'none', stroke: 'rgba(250,247,241,.14)', 'stroke-width': 1 }).forEach(([k, v]) => edge.setAttribute(k, v));
      const inner = document.createElementNS(svgNS, 'rect');
      Object.entries({ x: 975.5, y: 97.5, width: 409, height: 885, rx: 51.5, ry: 51.5, fill: 'none', stroke: 'rgba(250,247,241,.10)', 'stroke-width': 1 }).forEach(([k, v]) => inner.setAttribute(k, v));
      bez.appendChild(ring); bez.appendChild(edge); bez.appendChild(inner);
      const per = 2 * (RW + RH) - 8 * RR + 2 * Math.PI * RR;

      // ---------- plates (7 wall works + the hero's phone copy)
      const mk = (libId, canvasSrc) => {
        const g = document.createElement('div'); g.className = 'group';
        const mount = document.createElement('div'); mount.className = 'mount';
        const cv = TB.makeCanvas(canvasSrc.width, canvasSrc.height);
        cv.getContext('2d').drawImage(canvasSrc, 0, 0);
        mount.appendChild(cv);
        const cap = document.createElement('div'); cap.className = 'cap';
        cap.textContent = S.lib.plates[libId].caption;
        const dot = document.createElement('div'); dot.className = 'dot';
        g.appendChild(mount); g.appendChild(cap); g.appendChild(dot);
        screen.appendChild(g);
        return { g, mount, cv, cap, dot, lib: libId, p: {} };
      };
      const items = [];
      WALL.forEach((w, i) => {
        const it = mk(w.lib, S.lib.plates[w.lib].canvas);
        it.wall = { x: w.m[0] + 12, y: w.m[1] + 12, w: w.m[2] - 24, h: w.m[3] - 24, m: 12, mb: 12, d: 14, di: 0, fs: 22 };
        TB.tw(tl, it.p, 'enter', 0, 1, CUES.shots.wall[0] + 0.04 * i, 0.6, E.quintOut);
        TB.tw(tl, it.p, 'dot', 0, 1, CUES.ticks[1] + 0.09 * i, 0.12, E.quintOut);
        items.push(it);
      });
      const heroCopy = mk(0, S.lib.hero.canvas);
      heroCopy.wall = Object.assign({}, TB.CARRIER.WALLR, { di: 0, fs: 22 });
      heroCopy.isHero = true;
      heroCopy.p.enter = 1; heroCopy.p.dot = 1;
      items.push(heroCopy);
      items.forEach((it) => {
        const k = COL.indexOf(it.lib);
        it.colIdx = k;
        TB.tw(tl, it.p, 'fly', 0, 1, CUES.shots.column[0] + 0.04 * k, 0.7, E.expoOut);
      });
      screen.appendChild(hdr); screen.appendChild(glare);
      device.appendChild(bez);
      TB.tw(tl, P, 'clip', 0, 1, CUES.shots.column[0], 0.7, E.expoOut);
      TB.tw(tl, P, 'hdr', 0, 1, 20.3, 0.4, E.sineInOut);
      TB.tw(tl, P, 'draw', 0, 1, 21.429, 0.5, E.camera);
      TB.tw(tl, P, 'thick', 0, 1, 21.929, 0.671, E.expoOut);
      TB.tw(tl, P, 'shadow', 0, 1, 22.3, 0.557, E.sineInOut);
      TB.tw(tl, P, 'rotIn', 0, 1, CUES.hits.device, 1.286, E.camera);
      TB.tw(tl, P, 'rotOut', 0, 1, TAP, 0.571, E.expoOut);
      TB.tw(tl, P, 'tapDn', 0, 1, TAP, 0.06, E.quintOut);
      TB.tw(tl, P, 'tapUp', 0, 1, TAP + 0.06, 0.06, E.quintOut);
      TB.tw(tl, P, 'chrome', 0, 1, 25.0, 0.4, E.sineInOut);
      Object.assign(S, { feed: { top, wallRule, ao, pshadow, device, screen, hdr, glare, bez, ring, edge, inner, per, items } });
    },
    update(t, S) {
      const F = S.feed, P = S.feedP;
      // top bar + wall rule
      const tv = (P.top || 0) * (1 - (P.topOut || 0));
      F.top.style.display = tv > 0 ? 'block' : 'none';
      F.top.style.opacity = tv.toFixed(4);
      const rv = (P.rule || 0) * (1 - (P.topOut || 0));
      F.wallRule.style.display = rv > 0 && t < 20.3 ? 'block' : 'none';
      F.wallRule.style.transform = `scaleX(${(P.rule || 0).toFixed(4)})`;
      F.wallRule.style.opacity = (1 - (P.topOut || 0)).toFixed(4);

      const on = t >= CUES.shots.wall[0] && t < 25.4;
      F.device.style.display = on ? 'block' : 'none';
      const phoneOn = t >= 21.429 && t < 25.4;
      F.ao.style.display = F.pshadow.style.display = phoneOn && (P.shadow || 0) > 0 ? 'block' : 'none';
      if (!on) return;
      const chrome = 1 - (P.chrome || 0);
      // screen clip: full stage -> screen rect (20.0–20.7)
      const c = P.clip || 0;
      if (t < 20.0) F.screen.style.clipPath = 'none';
      else F.screen.style.clipPath = `inset(${(SCR.y * c).toFixed(2)}px ${((1920 - SCR.x - SCR.w) * c).toFixed(2)}px ${((1080 - SCR.y - SCR.h) * c).toFixed(2)}px ${(SCR.x * c).toFixed(2)}px round ${(SCR.r * c).toFixed(2)}px)`;
      // header
      const hv = (P.hdr || 0) * chrome;
      F.hdr.style.display = hv > 0 ? 'block' : 'none';
      F.hdr.style.opacity = hv.toFixed(4);
      // bezel
      const dv = P.draw || 0;
      F.bez.style.display = dv > 0 ? 'block' : 'none';
      F.ring.setAttribute('stroke-dasharray', `${F.per} ${F.per}`);
      F.ring.setAttribute('stroke-dashoffset', (F.per * (1 - dv)).toFixed(2));
      F.ring.setAttribute('stroke-width', (1 + 11 * (P.thick || 0)).toFixed(3));
      F.ring.style.opacity = chrome.toFixed(4);
      F.edge.style.opacity = F.inner.style.opacity = ((P.thick || 0) * chrome).toFixed(4);
      const sv = (P.shadow || 0) * chrome;
      F.ao.style.opacity = (sv * 0.9).toFixed(4); F.pshadow.style.opacity = sv.toFixed(4);
      // device dolly (max 7° / 3°) and return to flat before the re-target
      const rk = (P.rotIn || 0) * (1 - (P.rotOut || 0));
      const push = 1 + 0.03 * rk;
      F.device.style.transform = rk > 1e-5 ? `perspective(1800px) rotateY(${(-7 * rk).toFixed(4)}deg) rotateX(${(3 * rk).toFixed(4)}deg) scale(${push.toFixed(5)})` : 'none';
      F.pshadow.style.transform = `translateX(${(10 * rk).toFixed(2)}px) scale(${push.toFixed(5)})`;
      F.glare.style.display = t >= CUES.hits.device && chrome > 0 ? 'block' : 'none';
      F.glare.style.backgroundPosition = `${(100 - 70 * rk - 20 * prog(t, 22.857, 2.2)).toFixed(2)}% 0`;
      F.glare.style.opacity = (Math.min(1, rk * 2) * chrome).toFixed(4);

      // plates
      const wp = wallPush(t);
      for (const it of F.items) {
        const p = it.p;
        let vis = true;
        if (it.isHero) vis = t >= CUES.shots.column[0] && t < 25.143;
        else vis = (p.enter || 0) > 0;
        it.g.style.display = vis ? 'block' : 'none';
        if (!vis) continue;
        const f = p.fly || 0;
        const W = it.wall, Cr = colRect(it.lib, t);
        const r = {};
        for (const k of ['x', 'y', 'w', 'h', 'm', 'mb', 'd', 'di', 'fs']) r[k] = lerp(W[k], Cr[k], f);
        const mx = r.x - r.m, my = r.y - r.m, mw = r.w + 2 * r.m, mh = r.h + r.m + r.mb;
        const cx = mx + mw / 2, cy = my + mh / 2;
        const en = p.enter || 0;
        let sc = (1 + (wp - 1) * (1 - f)) * (0.94 + 0.06 * en);
        if (it.isHero) sc *= 1 - 0.02 * (P.tapDn || 0) * (1 - (P.tapUp || 0));
        it.g.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${sc.toFixed(5)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`;
        it.g.style.opacity = (Math.min(1, en * 1.3) * (it.isHero ? 1 : chrome)).toFixed(4);
        it.mount.style.filter = en < 0.999 ? `blur(${(6 * (1 - en)).toFixed(2)}px)` : '';
        const ms = it.mount.style;
        ms.left = mx + 'px'; ms.top = my + 'px'; ms.width = mw + 'px'; ms.height = mh + 'px';
        const sh = 1 - f; // gallery shadow on the wall, flat UI in the phone
        ms.boxShadow = sh > 0.001 ? `${(4 * sh).toFixed(2)}px ${(2 * sh).toFixed(2)}px ${(4 * sh).toFixed(2)}px rgba(20,19,17,${(0.08 * sh).toFixed(3)}), ${(10 * sh).toFixed(2)}px ${(24 * sh).toFixed(2)}px ${(48 * sh).toFixed(2)}px rgba(20,19,17,${(0.14 * sh).toFixed(3)})` : 'none';
        const cs = it.cv.style;
        cs.left = (r.m - 1) + 'px'; cs.top = (r.m - 1) + 'px'; cs.width = r.w + 'px'; cs.height = r.h + 'px';
        const capTop = my + mh + lerp(16, 10, r.di);
        it.cap.style.left = (mx + 22 * r.di) + 'px'; it.cap.style.top = capTop + 'px'; it.cap.style.fontSize = r.fs.toFixed(3) + 'px';
        const dv2 = p.dot || 0;
        const ds = it.dot.style;
        ds.display = dv2 > 0 ? 'block' : 'none';
        const dcx = mx + lerp(-15 - r.d / 2, 7, r.di), dcy = capTop + lerp(15, 14.5, r.di);
        ds.width = ds.height = r.d + 'px'; ds.left = (dcx - r.d / 2) + 'px'; ds.top = (dcy - r.d / 2) + 'px';
        ds.transform = `scale(${(0.94 + 0.06 * dv2).toFixed(4)})`;
      }
    },
  };
})();
