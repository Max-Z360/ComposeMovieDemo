// Shot 6: the wall, done right — seven more mounted plates around the hero, captions, the hairline rule
// at y = 330, the chosen dots in reading order from 18.300; "Chosen by hand." Shot 7 flies them into
// the column (page-level until 21.0, then the in-screen copies in column.js take over).
SCENES.push({ name: "wall", build(tl) {
  const cam = $("cam"), L = S.lib;
  const t0 = SH.wall[0], tE = 17.183;                        // hero re-targets at 17.143; plates from 17.183
  S.wallPlates = {};
  G.WALL_KEYS.forEach((k, i) => {
    const w = G.WALL[k], src = L.plates[w.lib];
    const P = makePlate(cam, src.canvas);
    const cap = h("div", "cap", cam, src.maker);
    const dot = h("div", "dot", cam);
    const tIn = tE + i * 0.04, tDot = CUES.ticks[1] + i * 0.09;
    S.wallPlates[k] = { P, cap, dot, tIn, tDot, src };
    vis(P.el, [tIn, G.SWAP_IN]); vis(cap, [tIn, G.FLY[k] + 0.15]); vis(dot, [tDot, G.SWAP_IN]);
  });
  // hairline rule at y = 330 from 173 to 1000 (draws from the left; parallax with the plates)
  const rule = h("div", "hair", cam); rule.style.width = "827px";
  vis(rule, [17.343, SH.column[0] + 0.3]);
  tl.fromTo(rule, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: EASE.sineInOut, immediateRender: false }, SH.column[0]);

  const L5 = makeLine("L5", T.L5);
  rise(tl, L5, LN.L5[0]); const e5 = exitLine(tl, L5, LN.L5[1]);
  vis(L5.el, [LN.L5[0], e5]);

  // the flight: one static clip on the page layer = the invisible screen window (paper on paper)
  const camEl = $("cam"), FLYCLIP = screenClip(0, 0, SCR.head);
  upd(t => {
    const cc = (t >= SH.column[0] + 0.03 && t < G.SWAP_IN) ? FLYCLIP : "none";   // f600: the hero still sits in the header band
    if (camEl._clip !== cc) { camEl._clip = cc; camEl.style.clipPath = cc; }
    if (t < t0 || t >= G.SWAP_IN) return;
    const cm = G.wallCam(Math.min(t, SH.column[0]));
    L5.par.style.transform = `translateY(${fmt(-2.2 * cm.d)}px)`;
    rule.style.transform = `translate(173px,${fmt(330 - 1.6 * cm.d)}px) scaleX(${fmt(EASE.expoOut(clamp((t - 17.343) / 0.6)))})`;
    for (const k of G.WALL_KEYS) {
      const o = S.wallPlates[k];
      if (t < o.tIn) continue;
      let r, m = G.WALL_MAT, op = 1, blur = 0, s = 1, clip = null, capL, dotOp = 1, dotS = 1, sh = 1;
      if (t < G.FLY[k]) {
        r = G.wallRect(G.WALL[k], t);
        const u = EASE.quintOut(clamp((t - o.tIn) / 0.6));
        op = u; blur = 6 * (1 - u); s = 0.94 + 0.06 * u;
        capL = G.capLayout(r, "inline");
        const v = EASE.expoOut(clamp((t - o.tDot) / 0.12)); dotOp = v; dotS = 0.94 + 0.06 * v;
      } else {
        const u = EASE.expoOut(clamp((t - G.FLY[k]) / G.FLY_DUR));
        r = rectLerp(G.wallRect(G.WALL[k], SH.column[0]), G.slotPage(k, t), u);
        m = lerp(G.WALL_MAT, G.FEED_MAT, u); sh = 1 - u;
        capL = G.lerpCap(G.capLayout(r, "inline"), G.capLayout(r, "feed"), u);
      }
      renderPlate(o.P, { x: r.x, y: r.y, w: r.w, h: r.h, m: [m, m, m, m], s, op, blur, shadow: plateShadow(sh), clip });
      const ctr = `translate(${fmt(capL.cx)}px,${fmt(capL.cy)}px)`;
      if (o.cap._tr !== ctr) { o.cap._tr = ctr; o.cap.style.transform = ctr; }
      const cop = fmt(t < G.FLY[k] ? op : 1 - clamp((t - G.FLY[k]) / 0.15));
      if (o.cap._op !== cop) { o.cap._op = cop; o.cap.style.opacity = cop; }
      renderDot(o.dot, capL.dx, capL.dy, 14 * dotS, dotOp);
    }
  });
} });
