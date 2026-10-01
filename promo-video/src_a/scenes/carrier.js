// THE carrier: one element (#hero) — the hero plate, its caption and its oxblood dot — re-targeted
// across the whole film (0 → 37.4 s); the dot continues into the wordmark as the first tittle.
SCENES.push({ name: "carrier", build(tl) {
  const L = S.lib, cam = $("cam");
  const hero = makePlate(cam, null);
  hero.el.id = "hero"; hero.cv.width = L.hero.width; hero.cv.height = L.hero.height;
  const hctx = hero.cv.getContext("2d", { willReadFrequently: true });
  S.hero = hero;
  // chosen frame (reveal): SVG rect drawn clockwise around the mat
  const fsvg = svgEl("svg", { id: "heroFrame", width: 528, height: 688, viewBox: "0 0 528 688" }, hero.el);
  const per = 2 * (528 + 688);
  const frect = svgEl("rect", { x: 0, y: 0, width: 528, height: 688, fill: "none", stroke: ACCENT, "stroke-width": 2, "stroke-dasharray": per, "stroke-dashoffset": per }, fsvg);
  vis(fsvg, [12.857, 16.95]);
  tl.fromTo(frect, { attr: { "stroke-dashoffset": per } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.5, ease: EASE.camera, immediateRender: false }, 12.857);
  tl.fromTo(fsvg, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: EASE.sineInOut, immediateRender: false }, 16.6);

  // caption (Inter 22, masked rise at 12.143) and the dot
  const cap = h("div", "cap", cam); cap.id = "heroCap";
  const capWords = [];
  T.hero.split(" ").forEach((w, i, a) => { const m = h("span", "m", cap); capWords.push(h("span", "w", m, w)); if (i < a.length - 1) cap.appendChild(document.createTextNode(" ")); });
  capWords.forEach((w, i) => tl.fromTo(w, { y: 40 }, { y: 0, duration: 0.6, ease: EASE.expoOut, immediateRender: false }, 12.143 + i * 0.055));
  tl.fromTo(cap, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: EASE.linear, immediateRender: false }, 20.0);
  tl.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.quintOut, immediateRender: false }, 25.5);
  tl.fromTo(cap, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: EASE.linear, immediateRender: false }, SH.logo[0]);
  vis(cap, [12.143, 20.15], [25.5, SH.logo[0] + 0.3]);
  const dot = h("div", "dot", cam); dot.id = "heroDot"; dot.style.zIndex = 8;
  vis(dot, [CUES.ticks[0], 21.0], [G.SWAP_OUT, C.pictureEnd]);
  vis(hero.el, [0, SH.turn[0]], [SH.reveal[0], G.SWAP_IN], [G.SWAP_OUT, SH.logo[0] + 0.3]);
  S.heroDotEl = dot;

  const PLATE_SH = k => `0 2px 4px rgba(20,19,17,.08), 0 ${fmt(24 + 8 * k)}px ${fmt(48 + 16 * k)}px rgba(20,19,17,${fmt(0.14 + 0.04 * k)})` + (k > 0 ? `, inset 0 1px 0 rgba(255,255,255,${fmt(k)})` : "");
  const cen = r => [r.x + r.w / 2, r.y + r.h / 2];
  const pushOf = (t, t0, t1, a) => 1 + a * EASE.push(clamp((t - t0) / (t1 - t0)));
  // detent frames for the warmth ratchet (brief §8 check 14): f793, 795, 797, 798, 800, 802, 804
  const DET = [0, 1, 2, 3, 4, 5, 6].map(k => Math.round(793 + 1.8 * k) / 30);
  S.DET = DET;
  const detent = t => { let k = 0; for (const d of DET) if (t >= d - 1e-6) k++; return k; };
  const liftEase = u => u < 0.2 ? 0.2 * EASE.expoIn(u / 0.2) : 0.2 + 0.8 * EASE.quintOut((u - 0.2) / 0.8);

  // the hero state at visual time t
  function state(t) {
    const st = { m: [0, 0, 0, 0], s: 1, rot: 0, op: 1, blur: 0, dim: 0, shadow: "none", edgeColor: "rgba(236,232,225,.10)", bg: "transparent", content: "g0", clip: null };
    let r, capMode = null, capU = 0, capFrom = null, dotD = 18, dotOp = 1, capS = 1, capRect = null;
    const paper = () => { st.shadow = PLATE_SH(0); st.edgeColor = "var(--rule)"; st.bg = "var(--paper-deep)"; };
    const M = m => [m, m, m, m];
    if (t < SH.hookB[0]) {                                                      // 1. hook A
      r = G.HOOK; st.s = pushOf(t, 0, SH.hookA[1], 0.02);
      const v = clamp((t - 0.2) / 1.4) * 15;
      st.content = t >= 1.6 ? "g0" : "d" + Math.floor(v) + ":" + (v - Math.floor(v)).toFixed(3);
    } else if (t < 3.357) {                                                     // the fall (expo-in)
      const r0 = scaleRect(G.HOOK, 1.02, ...cen(G.HOOK)), r1 = Wall.heroCell(t);
      r = rectLerp(r0, r1, EASE.expoIn(clamp((t - SH.hookB[0]) / 0.5)));
    } else if (t < SH.turn[0]) {                                                // 2–3. carried by the wall
      r = Wall.heroCell(t); st.dim = 0.65 * smoothstep((t - 3.4) / 1.6);
    } else if (t < SH.reveal[0]) { return null; }
    else if (t < SH.wall[0]) {                                                  // 5. reveal
      paper(); st.m = M(24); r = G.REVEAL;
      const u = EASE.quintOut(clamp((t - SH.reveal[0]) / 0.65));
      st.op = u; st.blur = 10 * (1 - u);
      capS = pushOf(t, SH.reveal[0], SH.reveal[1], 0.02);
      st.s = (0.96 + 0.04 * u) * capS;
      capMode = "hang";
      const k = EASE.expoOut(clamp((t - CUES.ticks[0]) / 0.12));
      dotOp = t >= CUES.ticks[0] ? k : 0; dotD = 18 * (0.94 + 0.06 * k);
    } else if (t < SH.column[0]) {                                              // 6. into the wall
      paper();
      const u = EASE.expoOut(clamp((t - SH.wall[0]) / 0.8));
      const r0 = scaleRect(G.REVEAL, 1.02, ...cen(G.REVEAL));
      r = rectLerp(r0, G.wallRect(G.WALL.hero, t), u); st.m = M(lerp(24, 12, u));
      capFrom = G.capLayout(r, "hang"); capMode = "inline"; capU = u; dotD = lerp(18, 14, u);
    } else if (t < G.SWAP_IN) {                                                 // 7. flying to the column
      paper();
      const u = EASE.expoOut(clamp((t - G.FLY.hero) / G.FLY_DUR));
      r = rectLerp(G.wallRect(G.WALL.hero, SH.column[0]), G.slotPage("hero", t), u); st.m = M(lerp(12, 8, u)); st.shadow = plateShadow(1 - u);
      capFrom = G.capLayout(r, "inline"); capMode = "feed"; capU = u; dotD = 14;
    } else if (t < G.SWAP_OUT) { return null; }
    else if (t < SH.studio[0] - 0.001) {                                        // 8→9. re-target to the studio
      paper();
      const u = EASE.expoOut(clamp((t - G.SWAP_OUT) / 0.57));
      r = rectLerp(G.slotPage("hero", G.SWAP_OUT), G.STUDIO, u); st.m = M(lerp(8, 24, u)); st.shadow = plateShadow(u);
      capFrom = G.capLayout(r, "feed"); capMode = "hang"; capU = u; dotD = lerp(14, 18, u);
    } else if (t < SH.ledger[0] + 0.0) {                                        // 9–10. studio + publish
      paper(); st.m = M(24); r = G.STUDIO; capMode = "hang";
      const k = detent(t); st.content = "g" + k;
      const sPush = pushOf(t, SH.studio[0], CUES.risers.lift[0], 0.015);
      capS = t < CUES.risers.lift[0] ? sPush : 1;
      if (t < CUES.risers.lift[0]) st.s = sPush;
      else if (t < 30.643) { const u = liftEase((t - CUES.risers.lift[0]) / 0.5); st.s = lerp(1.015, 1.05, u); st.dy = -24 * u; capS = lerp(1.015, 1, u); }
      else { const u = EASE.quintOut(clamp((t - 30.643) / 0.257)); st.s = lerp(1.05, 1, u); st.dy = -24 * (1 - u); }
    } else if (t < SH.human[0]) {                                               // 11. ledger
      paper(); st.m = M(24); r = G.STUDIO; capMode = "hang"; st.content = "g7";
      st.s = capS = pushOf(t, SH.ledger[0], SH.ledger[1], 0.015);
    } else if (t < SH.logo[0] + 0.3) {                                          // 12. the print
      const u = EASE.quintOut(clamp((t - SH.human[0]) / 0.9));
      st.content = "g7"; st.edgeColor = "var(--rule)"; st.bg = "var(--paper-deep)"; st.shadow = PLATE_SH(u);
      r = rectLerp(G.STUDIO, G.PRINT, u);
      st.m = [lerp(24, 40, u), lerp(24, 40, u), lerp(24, 40, u), lerp(24, 80, u)];
      st.rot = -1.5 * u; st.s = capS = 1.015 + 0.02 * EASE.push(clamp((t - SH.human[0]) / (SH.human[1] - SH.human[0])));
      capFrom = G.capLayout(G.STUDIO, "hang"); capRect = r; capMode = "print"; capU = u;
      st.op = 1 - clamp((t - SH.logo[0]) / 0.3);
    } else return null;
    st.x = r.x; st.y = r.y + (st.dy || 0); st.w = r.w; st.h = r.h;
    st.capMode = capMode; st.capU = capU; st.capFrom = capFrom; st.dotD = dotD; st.dotOp = dotOp; st.capS = capS; st.r = r;
    return st;
  }
  S.heroState = state;

  // canvas content: dissolve develop (hook) or warmth grade k
  let lastKey = null;
  function content(key) {
    if (key === lastKey) return; lastKey = key;
    hctx.clearRect(0, 0, hero.cv.width, hero.cv.height);
    if (key[0] === "g") { hctx.globalAlpha = 1; hctx.drawImage(L.heroGrades[+key.slice(1)], 0, 0); return; }
    const [k, f] = key.slice(1).split(":").map(Number);
    hctx.globalAlpha = 1; hctx.drawImage(L.dissolve[Math.min(15, k)], 0, 0);
    if (f > 0 && k < 15) { hctx.globalAlpha = f; hctx.drawImage(L.dissolve[k + 1], 0, 0); hctx.globalAlpha = 1; }
  }

  // caption + dot from the (push-scaled, un-lifted) mat rect — pure in the state
  function capDot(st) {
    const r = st.r, [ox, oy] = cen(r), rs = scaleRect(r, st.capS, ox, oy);
    let to;
    if (st.capMode === "print") {
      const pr = scaleRect(G.PRINT, st.capS, ...cen(G.PRINT)); const p = G.capLayout(pr, "hang");
      p.cy += 8; p.dy += 8;                                   // the print's weighted foot needs more air
      to = G.lerpCap(G.capLayout(scaleRect(G.STUDIO, 1.015, ...cen(G.STUDIO)), "hang"), p, st.capU);
    } else {
      to = G.capLayout(rs, st.capMode);
      if (st.capFrom) to = G.lerpCap(st.capFrom, to, st.capU);
    }
    return to;
  }
  S.capAt = t => { const st = state(t); return st && st.capMode ? capDot(st) : null; };
  const TRAVEL = [37.3, 38.1];
  upd(t => {
    const st = state(t);
    if (st) { content(st.content); renderPlate(hero, st); }
    if (st && st.capMode) {
      const p = capDot(st);
      const tr = `translate(${fmt(p.cx)}px,${fmt(p.cy)}px) scale(${fmt(st.capS)})`;
      if (cap._tr !== tr) { cap._tr = tr; cap.style.transform = tr; }
      if (t < TRAVEL[0]) {
        const d = st.dotD * st.capS;
        renderDot(dot, p.dx, p.dy, d, st.dotOp);
      }
    }
    if (t >= TRAVEL[0] && t < C.pictureEnd) {                 // the dot travels to the first tittle
      const s0 = state(TRAVEL[0]), p0 = capDot(s0), tit = S.tittle1(t);
      const u = EASE.camera(clamp((t - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0])));
      renderDot(dot, lerp(p0.dx, tit.x, u), lerp(p0.dy, tit.y, u), lerp(18 * s0.capS, tit.d, u), 1);
    }
  });
} });
