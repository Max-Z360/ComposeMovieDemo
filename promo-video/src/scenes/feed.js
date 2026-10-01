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
  // ---- phone column order (lib ids; 0 = hero, second from top). A landscape plate (Elin Sato) sits above the hero so
  // that, when the hero lands, it and the slot above it both fit inside the screen: nothing lands outside the frame.
  const COL = [9, 0, 17, 7, 3, 14, 5, 12];
  const SCR = { x: 975, y: 97, w: 410, h: 886, r: 52 };
  const HDR = 102, PADX = 16, IMGW = 362, MAT = 8;
  const HB = SCR.y + HDR;                         // 199: bottom of the app header (rule at 198)
  const RATIO = { 0: 4 / 3, 9: 0.75, 17: 4 / 3, 7: 1, 3: 0.75, 14: 0.75, 5: 4 / 3, 12: 4 / 3 };
  const colY = {}; // mount top at scroll 0
  { let y = SCR.y + HDR + 16; for (const id of COL) { colY[id] = y; y += IMGW * RATIO[id] + 2 * MAT + 10 + 26 + 24; } }
  const T_FLY = 20.0, T_SNAP = 21.0;              // fly on the bar; the screen clip is tight at 21.0 (clip tween ends)
  // the rest: the feed drifts 36 px/s and the hero mat is 8 px under the header rule on the tap; together these put the
  // plate above the hero exactly under the header when the rest begins (no sliver of it under the rule) and its
  // caption already fading at the scroll edge
  const TAP = 24.286, HERO_TOP_AT_TAP = HB + 8, DRIFT = 36;
  // landing scroll: the top plate's mat sits 2 px under the screen top; the hero (and its caption) land fully inside
  // the screen and the third plate lands just below it (hidden by the clip once it is tight, so it can re-mount there)
  const S0 = colY[COL[0]] - (SCR.y + 2);
  const B = colY[0] - HERO_TOP_AT_TAP - DRIFT * (TAP - 22.857), A = (S0 + B) / 2;
  function scroll(t) {
    if (t < T_SNAP) return S0;
    if (t < 21.6) return S0 + (A - S0) * smoothstep(T_SNAP, 21.6, t);
    if (t < 22.0) return A;
    if (t < 22.857) return A + (B - A) * smoothstep(22.0, 22.857, t);
    return B + DRIFT * (Math.min(t, TAP) - 22.857);
  }
  function colRect(id, t) {
    const y = colY[id] - scroll(t);
    return { x: SCR.x + PADX + MAT, y: y + MAT, w: IMGW, h: IMGW * RATIO[id], m: MAT, mb: MAT, d: 14, di: 1, fs: 21 };
  }
  TB.FEED_HERO_HANDOFF = colRect(0, 25.143);
  TB.FEED = { colRect, scroll, SCR };

  // the bezel ring as a bitmap: outer rounded rect (434×910, r64) minus inner (inset w, r 64−w); warm 1 px edge highlight
  function drawBezel(c, w, hl) {
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.translate(5, 5);
    ctx.beginPath();
    TB.rrectPath(ctx, 0, 0, 434, 910, 64);
    TB.rrectPath(ctx, w, w, 434 - 2 * w, 910 - 2 * w, Math.max(0, 64 - w));
    ctx.fillStyle = '#1A1917';
    ctx.fill('evenodd');
    if (hl > 0) {
      ctx.beginPath(); TB.rrectPath(ctx, 1.5, 1.5, 431, 907, 62.5);
      ctx.strokeStyle = `rgba(250,247,241,${(0.14 * hl).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
    }
    c.lastW = w;
  }

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
      hdr.style.cssText = `left:${SCR.x}px;top:${SCR.y}px;width:${SCR.w}px;height:${HDR}px;border-radius:${SCR.r}px ${SCR.r}px 0 0;`;
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
      // bezel, phase 1 (21.429–21.929): a 1 px ink line DRAWS clockwise along the phone's outer edge (SVG dash)
      const svgNS = 'http://www.w3.org/2000/svg';
      const bez = document.createElementNS(svgNS, 'svg');
      bez.setAttribute('width', 1920); bez.setAttribute('height', 1080); bez.style.cssText = 'position:absolute;left:0;top:0';
      const ring = document.createElementNS(svgNS, 'rect');
      const RX = 963.5, RY = 85.5, RW = 433, RH = 909, RR = 63.5;
      Object.entries({ x: RX, y: RY, width: RW, height: RH, rx: RR, ry: RR, fill: 'none', stroke: '#1A1917', 'stroke-width': 1 }).forEach(([k, v]) => ring.setAttribute(k, v));
      bez.appendChild(ring);
      const per = 2 * (RW + RH) - 8 * RR + 2 * Math.PI * RR;
      // phase 2 (21.929–22.6): the same line, now a CSS border on the identical rounded rect, thickens inward to the
      // 12 px bezel (inner radius 64 − 12 = 52 = the screen). CSS rrect borders raster deterministically under the 3D
      // dolly; SVG path corners do not (Skia path AA depends on partial-raster history).
      const bezDiv = TB.makeCanvas(444, 920);
      bezDiv.style.cssText = 'position:absolute;left:958px;top:80px;width:444px;height:920px';
      bezDiv.lastW = -1;
      const hl = null;

      // ---------- plates (7 wall works + the hero's phone copy). Plates live in #col (clipped to the feed area during
      // the chrome dissolve); captions and dots live in #capLayer above them and are NEVER under a transform: text
      // inside a scaled group is rasterised small and resampled (two of the eight wall captions came out grey).
      const col = document.createElement('div'); col.className = 'layer'; col.id = 'col';
      const capLayer = document.createElement('div'); capLayer.className = 'layer'; capLayer.id = 'capLayer';
      screen.appendChild(col); col.appendChild(capLayer);
      const mk = (libId, canvasSrc) => {
        const g = document.createElement('div'); g.className = 'group';
        const mount = document.createElement('div'); mount.className = 'mount';
        const cv = TB.makeCanvas(canvasSrc.width, canvasSrc.height);
        cv.getContext('2d').drawImage(canvasSrc, 0, 0);
        mount.appendChild(cv);
        g.appendChild(mount);
        col.insertBefore(g, capLayer);
        const capMask = document.createElement('div'); capMask.className = 'capmask';
        const cap = document.createElement('div'); cap.className = 'cap';
        cap.textContent = S.lib.plates[libId].caption;
        capMask.appendChild(cap);
        const dot = document.createElement('div'); dot.className = 'dot';
        capLayer.appendChild(capMask); capLayer.appendChild(dot);
        return { g, mount, cv, cap, capMask, dot, lib: libId, p: {} };
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
      // ---------- the column fly (20.0): the hero — the one carrier — flies into the screen; the seven other wall plates
      // dissolve where they hang (140 ms, nearest first) and re-mount in the column: the plate above the hero fades
      // into its slot once the header is opaque (it sits partly under it), the rest re-mount below the fold when the
      // screen clip is tight (21.0) and the scroll brings them up. Every caption + dot goes in the first 100 ms; the
      // two visible feed captions masked-rise back. No caption is in flight, no plate path crosses another, nothing
      // is ever covered by the header while it fades in.
      const LEAVE = [5, 1, 2, 6, 0, 4, 3];   // wall index order of the dissolve: nearest to the hero's path first
      items.forEach((it) => {
        it.colIdx = COL.indexOf(it.lib);
        it.carried = !!it.isHero;
        TB.tw(tl, it.p, 'capOut', 0, 1, T_FLY, 0.1, E.sineInOut);
        if (it.isHero) {
          TB.tw(tl, it.p, 'fly', 0, 1, T_FLY, 0.7, E.expoOut);
          TB.tw(tl, it.p, 'capIn', 0, 1, 20.72, 0.6, E.expoOut);
        } else {
          TB.tw(tl, it.p, 'leave', 0, 1, T_FLY + 0.02 * LEAVE.indexOf(items.indexOf(it)), 0.14, E.sineInOut);
          if (it.colIdx === 0) {
            it.remount = 20.72;
            // mat + hairline + plate arrive together: 120 ms expo-out with a 6 px upward settle, so the mat edge is
            // there from the first frame (a 300 ms opacity ramp read as a grey placeholder loading)
            TB.tw(tl, it.p, 'feedIn', 0, 1, 20.72, 0.12, E.expoOut);
            TB.tw(tl, it.p, 'capIn', 0, 1, 20.86, 0.6, E.expoOut);
          } else it.remount = T_SNAP;
        }
      });
      screen.appendChild(hdr); screen.appendChild(glare);
      device.appendChild(bez); device.appendChild(bezDiv);
      TB.tw(tl, P, 'clip', 0, 1, CUES.shots.column[0] + 0.15, 0.85, E.camera);
      TB.tw(tl, P, 'hdr', 0, 1, 20.3, 0.4, E.sineInOut);
      TB.tw(tl, P, 'draw', 0, 1, 21.429, 0.5, E.camera);
      TB.tw(tl, P, 'thick', 0, 1, 21.929, 0.671, E.expoOut);
      TB.tw(tl, P, 'shadow', 0, 1, 22.3, 0.557, E.sineInOut);
      TB.tw(tl, P, 'rotIn', 0, 1, CUES.hits.device, 1.286, E.camera);
      TB.tw(tl, P, 'rotOut', 0, 1, TAP, 0.571, E.expoOut);
      TB.tw(tl, P, 'tapDn', 0, 1, TAP, 0.06, E.quintOut);
      TB.tw(tl, P, 'tapUp', 0, 1, TAP + 0.06, 0.06, E.quintOut);
      // chrome dissolve (25.0): the feed's other plates go first (they are gone when the hero starts to move at
      // 25.143), the header/status strip in 200 ms, the bezel + shadow + glare in 400 ms. The feed is clipped to the
      // area under the header from 25.0, so nothing that scrolled under the header can show through it as it fades.
      TB.tw(tl, P, 'platesOut', 0, 1, 25.0, 0.143, E.sineInOut);
      TB.tw(tl, P, 'hdrOut', 0, 1, 25.0, 0.2, E.sineInOut);
      TB.tw(tl, P, 'chrome', 0, 1, 25.0, 0.4, E.sineInOut);
      // the bezel ring itself goes in 300 ms: from 25.233 the growing caption crosses the ring's right side (behind
      // the text, the carrier is above the phone from the swap), and by then the ring is at 12 % and fading out
      TB.tw(tl, P, 'ringOut', 0, 1, 25.0, 0.3, E.sineInOut);
      Object.assign(S, { feed: { top, wallRule, ao, pshadow, device, screen, col, hdr, glare, bez, ring, bezDiv, per, items } });
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
      // the device stays a permanent composited layer (raster scale locked at 1 from page load, see styles.css):
      // display:none would recreate it with a history-dependent raster scale once the 3D dolly starts
      F.device.style.visibility = on ? 'visible' : 'hidden';
      const phoneOn = t >= 21.429 && t < 25.4;
      F.ao.style.display = F.pshadow.style.display = phoneOn && (P.shadow || 0) > 0 ? 'block' : 'none';
      if (!on) return;
      const chrome = 1 - (P.chrome || 0);
      // screen clip: full stage -> screen rect (20.0–20.7)
      const c = P.clip || 0;
      if (t < 20.0) F.screen.style.clipPath = 'none';
      else if (t < 22.6) F.screen.style.clipPath = `inset(${(SCR.y * c).toFixed(2)}px ${((1920 - SCR.x - SCR.w) * c).toFixed(2)}px ${((1080 - SCR.y - SCR.h) * c).toFixed(2)}px ${(SCR.x * c).toFixed(2)}px round ${(SCR.r * c).toFixed(2)}px)`;
      // once the 12 px bezel is solid it covers the corner wedges: a plain rectangular clip avoids the compositor's
      // rounded-corner mask, whose anti-aliasing under the 3D dolly depends on raster history (non-deterministic)
      else F.screen.style.clipPath = `inset(${SCR.y}px ${1920 - SCR.x - SCR.w}px ${1080 - SCR.y - SCR.h}px ${SCR.x}px)`;
      // the feed under the header only, from the start of the chrome dissolve (phone flat; plain rect clip)
      F.col.style.clipPath = t >= 25.0 ? `inset(${HB}px ${1920 - SCR.x - SCR.w}px ${1080 - SCR.y - SCR.h}px ${SCR.x}px)` : 'none';
      // header
      const hv = (P.hdr || 0) * (1 - (P.hdrOut || 0));
      F.hdr.style.display = hv > 0 ? 'block' : 'none';
      F.hdr.style.opacity = hv.toFixed(4);
      // bezel: SVG draw phase, then the CSS border thickens
      const dv = P.draw || 0, th = P.thick || 0;
      const svgPhase = dv > 0 && t < 21.929;
      F.bez.style.display = svgPhase ? 'block' : 'none';
      F.ring.setAttribute('stroke-dasharray', `${F.per} ${F.per}`);
      F.ring.setAttribute('stroke-dashoffset', (F.per * (1 - dv)).toFixed(2));
      const ringV = 1 - (P.ringOut || 0);
      F.bezDiv.style.display = t >= 21.929 && ringV > 0 ? 'block' : 'none';
      const bw = Math.round((1 + 11 * th) * 100) / 100;
      if (bw !== F.bezDiv.lastW) drawBezel(F.bezDiv, bw, th);
      F.bezDiv.style.opacity = ringV.toFixed(4);
      // full repaint of the device layer every frame (frame-parity toggle of an invisible background): no partial
      // raster reuse, so a frame is identical whether a worker arrives here sequentially or by a jump
      F.device.style.backgroundImage = (Math.round(t * 30) % 2) ? 'linear-gradient(transparent, transparent)' : 'none';
      const sv = (P.shadow || 0) * chrome;
      F.ao.style.opacity = (sv * 0.9).toFixed(4); F.pshadow.style.opacity = sv.toFixed(4);
      // device dolly (max 7° / 3°) and return to flat before the re-target
      const rk = (P.rotIn || 0) * (1 - (P.rotOut || 0));
      const push = 1 + 0.03 * rk;
      // always the same 3D form (identity when idle): the layer is created once at load with raster scale 1 and never re-decided
      F.device.style.transform = `perspective(1800px) rotateY(${(-7 * rk).toFixed(4)}deg) rotateX(${(3 * rk).toFixed(4)}deg) scale(${push.toFixed(5)})`;
      // layout, not transform (transformed boxes keep a history-dependent raster translation)
      { const w = 434 * push, h = 910 * push, ps = F.pshadow.style;
        ps.left = (1180 - w / 2 + 10 * rk).toFixed(3) + 'px'; ps.top = (540 - h / 2).toFixed(3) + 'px';
        ps.width = w.toFixed(3) + 'px'; ps.height = h.toFixed(3) + 'px'; ps.borderRadius = (64 * push).toFixed(3) + 'px'; }
      F.glare.style.display = t >= CUES.hits.device && chrome > 0 ? 'block' : 'none';
      F.glare.style.backgroundPosition = `${(100 - 70 * rk - 20 * prog(t, 22.857, 2.2)).toFixed(2)}% 0`;
      F.glare.style.opacity = (Math.min(1, rk * 2) * chrome).toFixed(4);

      // plates
      const wp = wallPush(t);
      const hdrIn = P.hdr || 0;
      for (const it of F.items) {
        const p = it.p;
        const snapped = !it.carried && t >= it.remount;      // a dissolved wall plate, re-mounted in the column
        let vis, fx, fy, alpha = 1, scK = 1;
        if (it.isHero) vis = t >= T_FLY && t < 25.143;
        else vis = (p.enter || 0) > 0;
        let dx = 0, dy = 0;
        if (it.carried) { fx = fy = p.fly || 0; }
        else if (snapped) { fx = fy = 1; if (p.feedIn != null) { alpha = p.feedIn; dy = 6 * (1 - p.feedIn); } }
        else {
          // fade + a 10 px drift toward the phone (1180, 540), front-loaded so it reads while the plate is still
          // there: the departure points at the column. No scale: a scale change under a fading group rasterises
          // history-dependently.
          fx = fy = 0; const lv = p.leave || 0; alpha = 1 - lv; if (lv >= 1) vis = false;
          if (lv > 0) {
            const W0 = it.wall, vx = 1180 - (W0.x + W0.w / 2), vy = 540 - (W0.y + W0.h / 2), n = Math.hypot(vx, vy) || 1;
            const k = 10 * (1 - (1 - lv) * (1 - lv));
            dx = Math.round((k * vx) / n * 100) / 100; dy = Math.round((k * vy) / n * 100) / 100;
          }
        }
        if (!it.isHero) alpha *= 1 - (P.platesOut || 0);
        const W = it.wall, Cr = colRect(it.lib, t);
        const r = {
          x: lerp(W.x, Cr.x, fx) + dx, y: lerp(W.y, Cr.y, fy) + dy,
          w: lerp(W.w, Cr.w, fy), h: lerp(W.h, Cr.h, fy), m: lerp(W.m, Cr.m, fy), mb: lerp(W.mb, Cr.mb, fy),
          d: lerp(W.d, Cr.d, fy), di: fy >= 0.5 ? 1 : 0, fs: fy >= 0.5 ? Cr.fs : W.fs,
        };
        const mx = r.x - r.m, my = r.y - r.m, mw = r.w + 2 * r.m, mh = r.h + r.m + r.mb;
        // re-mounted plates outside the screen are not drawn (they are clipped anyway)
        if (snapped && (my > SCR.y + SCR.h || my + mh + 60 < SCR.y)) vis = false;
        if (alpha <= 0) vis = false;
        it.g.style.display = vis ? 'block' : 'none';
        if (!vis) { it.capMask.style.display = it.dot.style.display = 'none'; continue; }
        const cx = mx + mw / 2, cy = my + mh / 2;
        const en = p.enter || 0;
        const f = Math.min(fx, fy);
        let sc = (1 + (wp - 1) * (1 - f)) * (0.94 + 0.06 * en) * scK;
        if (it.isHero) sc *= 1 - 0.02 * (P.tapDn || 0) * (1 - (P.tapUp || 0));
        it.g.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${sc.toFixed(5)}) translate(${(-cx).toFixed(2)}px, ${(-cy).toFixed(2)}px)`;
        const go = Math.min(1, en * 1.3) * alpha;
        it.g.style.opacity = go.toFixed(4);
        it.mount.style.filter = en < 0.999 ? `blur(${(6 * (1 - en)).toFixed(2)}px)` : '';
        const ms = it.mount.style;
        ms.left = mx + 'px'; ms.top = my + 'px'; ms.width = mw + 'px'; ms.height = mh + 'px';
        const sh = 1 - f; // gallery shadow on the wall, flat UI in the phone
        // fixed geometry, alpha-only fade: a blur radius that changes every frame rasterises history-dependently
        ms.boxShadow = sh > 0.001 ? `4px 2px 4px rgba(20,19,17,${(0.08 * sh).toFixed(3)}), 10px 24px 48px rgba(20,19,17,${(0.14 * sh).toFixed(3)})` : 'none';
        const cs = it.cv.style;
        cs.left = (r.m - 1) + 'px'; cs.top = (r.m - 1) + 'px'; cs.width = r.w + 'px'; cs.height = r.h + 'px';
        // caption + dot: positions follow the group's scale, glyphs are never scaled
        const S2 = (x, y) => [cx + (x - cx) * sc, cy + (y - cy) * sc];
        const [capL, capT] = S2(mx + 22 * r.di, my + mh + lerp(16, 10, r.di));
        let co, rise = 0, dotK = 1;
        if ((p.capIn || 0) > 0) { co = 1; rise = 1 - p.capIn; dotK = Math.min(1, p.capIn * 1.6); }
        else if (t < T_FLY || (snapped && p.capIn == null)) co = 1;
        else if (snapped) co = 0;
        else co = 1 - (p.capOut || 0);
        // scroll edge: a caption fades out as it nears the header rule instead of being sliced by it
        const edge = 1 - hdrIn * (1 - smoothstep(HB + 2, HB + 20, capT));
        const capO = co * go * edge;
        const cm = it.capMask.style;
        cm.display = capO > 0.002 ? 'block' : 'none';
        cm.left = capL.toFixed(2) + 'px'; cm.top = (capT - 2).toFixed(2) + 'px'; cm.opacity = capO.toFixed(4);
        it.cap.style.fontSize = r.fs + 'px';
        it.cap.style.top = (rise * 28).toFixed(3) + 'px';
        // the hero's chosen dot never leaves the work: it rides the mat through the fly (only the caption goes and
        // masked-rises back); every other plate's dot goes and comes with its caption
        if (it.isHero) dotK = 1;
        const dv2 = (p.dot || 0) * dotK;
        const dO = it.isHero ? (dv2 > 0 ? go * edge : 0) : capO > 0.002 && dv2 > 0 ? (rise > 0 ? go * edge * dotK : capO) : 0;
        const ds = it.dot.style;
        ds.display = dO > 0.002 ? 'block' : 'none';
        // dot offset: wall slot (left of the caption) -> feed slot; continuous with the fly for the hero (no jump at mid-flight)
        const dk = it.isHero ? fy : r.di;
        const [dcx, dcy] = S2(mx + lerp(-15 - r.d / 2, 7, dk), my + mh + lerp(16, 10, dk) + lerp(15, 14.5, dk));
        const dd = r.d * (0.94 + 0.06 * dv2) * sc;
        ds.width = ds.height = dd.toFixed(3) + 'px'; ds.left = (dcx - dd / 2).toFixed(3) + 'px'; ds.top = (dcy - dd / 2).toFixed(3) + 'px';
        ds.opacity = dO.toFixed(4);
      }
    },
  };
})();
