// Shots 7–8: the column (the phone, drawn) and the device, once. The in-screen DOM is authored at the
// final screen size (410×886) from the first frame it exists — never scaled up.
SCENES.push({ name: "column", build(tl) {
  const L = S.lib;
  const layer = h("div", null, $("stage")); layer.id = "phoneLayer";
  $("stage").insertBefore(layer, $("cam"));
  const phone = h("div", null, layer); phone.id = "phone";
  const shadow = h("div", null, phone); shadow.id = "phoneShadow";
  const screen = h("div", null, phone); screen.id = "screen";
  const feedClip = h("div", null, screen); feedClip.style.cssText = "position:absolute;inset:0;clip-path:inset(102px 0 0 0)";
  const feed = h("div", null, feedClip); feed.id = "feed";
  const status = h("div", null, screen); status.id = "status"; status.style.background = "none";
  h("div", "time", status, T.time);
  status.insertAdjacentHTML("beforeend", `<svg width="58" height="10" viewBox="0 0 58 10" fill="none" stroke="#8A867E" stroke-width="1">
    <path d="M1 9.5h2M5 9.5V6.5M9 9.5V4.5M13 9.5V2"/><path d="M22 4.2a8 8 0 0 1 10 0M24.2 6.6a4.6 4.6 0 0 1 5.6 0"/><circle cx="27" cy="8.6" r=".9" fill="#8A867E" stroke="none"/>
    <rect x="38.5" y="1.5" width="16" height="8" rx="2"/><path d="M56.5 4.5v2"/><rect x="40.5" y="3.5" width="9" height="4" rx=".8" fill="#8A867E" stroke="none"/></svg>`);
  const head = h("div", null, screen); head.id = "apphead"; head.style.background = "none";
  h("div", "brand", head, BRAND_NAME); h("div", "today", head, T.today); h("div", "rule", head);
  const glare = h("div", null, phone); glare.id = "glare";
  // bezel: a 1 px ink rounded rect (434×910, r 64) drawn clockwise, then thickened into the 12 px bezel
  const bsvg = svgEl("svg", { id: "bezelSvg", width: 434, height: 910, viewBox: "0 0 434 910" }, phone);
  const P0 = 2 * (433 + 909) - 8 * 63.5 + 2 * Math.PI * 63.5;
  const brect = svgEl("rect", { fill: "none", stroke: "#141311", "stroke-dasharray": P0.toFixed(2), "stroke-dashoffset": P0.toFixed(2) }, bsvg);
  const bedge = svgEl("rect", { x: 0.5, y: 0.5, width: 433, height: 909, rx: 63.5, fill: "none", stroke: "rgba(250,247,241,.14)", "stroke-width": 1, opacity: 0 }, bsvg);

  vis(phone, [SH.column[0], 25.4]);
  // header (status bar + app header) fades in at 20.3
  for (const e of [status, head]) {
    tl.fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, 20.3);
    tl.fromTo(e, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, 25.0);
  }
  // in-screen copies of the eight plates (native screen size)
  S.feed = {};
  G.FEED_ORDER.forEach(k => {
    const src = k === "hero" ? L.hero : L.plates[G.WALL[k].lib].canvas;
    const s = G.SLOT[k];
    const P = makePlate(feed, src);
    renderPlate(P, { x: s.x, y: s.y, w: s.w, h: s.h, m: [8, 8, 8, 8], shadow: "none" });
    const lbl = k === "hero" ? T.hero : (L.plates[G.WALL[k].lib].caption);
    const c = h("div", "fcap", feed, lbl);
    const cl = G.capLayout(s, "feed");
    c.style.left = cl.cx + "px"; c.style.top = cl.cy + "px";
    if (c.getBoundingClientRect().width > 0 && c.scrollWidth > 394 - cl.cx) c.textContent = k === "hero" ? HERO_MAKER : L.plates[G.WALL[k].lib].maker;
    const d = h("div", "fdot", feed); d.style.left = cl.dx + "px"; d.style.top = cl.dy + "px";
    S.feed[k] = { P, c, d };
    const end = k === "hero" ? G.SWAP_OUT : 25.4;
    vis(P.el, [G.SWAP_IN, end]); vis(c, [G.SWAP_IN, 25.4]); vis(d, [G.SWAP_IN, end]);
    tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.quintOut, immediateRender: false }, G.SWAP_IN);
    tl.fromTo(c, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, 25.0);
    if (k !== "hero") {
      tl.fromTo([P.el, d], { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, 25.0);
    }
  });
  // phone shadow + AO fade in 22.3–22.857; chrome dissolves 25.0–25.4
  tl.fromTo(shadow, { opacity: 0 }, { opacity: 1, duration: 0.557, ease: EASE.sineInOut, immediateRender: false }, 22.3);
  tl.fromTo([shadow, bsvg], { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, 25.0);
  S.aoAlpha = t => t < 22.3 || t >= 25.4 ? 0 : t < 25.0 ? EASE.sineInOut(clamp((t - 22.3) / 0.557)) : 1 - EASE.sineInOut((t - 25.0) / 0.4);

  const L6 = makeLine("L6", T.L6, { maxWidth: 780 });
  rise(tl, L6, LN.L6[0]); const e6 = exitLine(tl, L6, LN.L6[1]);
  vis(L6.el, [LN.L6[0], e6]);

  const wOf = t => t < 21.929 ? 1 : 1 + 11 * EASE.expoOut(clamp((t - 21.929) / 0.671));
  const ink = [20, 19, 17], bez = [26, 25, 23];
  upd(t => {
    if (t < SH.column[0] || t >= 25.4) return;
    // scroll
    const sc = G.scroll(t);
    feed.style.transform = `translateY(${fmt(-sc)}px)`;
    // the bezel draw + thicken
    const draw = EASE.camera(clamp((t - 21.429) / 0.5));
    const w = wOf(t), k = clamp((w - 1) / 11);
    brect.setAttribute("x", fmt(w / 2)); brect.setAttribute("y", fmt(w / 2));
    brect.setAttribute("width", fmt(434 - w)); brect.setAttribute("height", fmt(910 - w));
    brect.setAttribute("rx", fmt(64 - w / 2)); brect.setAttribute("stroke-width", fmt(w));
    brect.setAttribute("stroke-dashoffset", fmt(P0 * (1 - draw)));
    brect.setAttribute("stroke", `rgb(${ink.map((v, i) => Math.round(lerp(v, bez[i], k))).join(",")})`);
    brect.style.display = t < 21.429 ? "none" : "";
    bedge.setAttribute("opacity", fmt(EASE.sineInOut(clamp((t - 22.6) / 0.257))));
    // the dolly (3D), glare tied to the rotation
    const d = G.dolly(t);
    const tr = (d.ry > 1e-4 || d.rx > 1e-4 || Math.abs(d.s - 1) > 1e-5) ? `rotateY(${fmt(d.ry)}deg) rotateX(${fmt(d.rx)}deg) scale(${fmt(d.s)})` : "none";
    if (phone._tr !== tr) { phone._tr = tr; phone.style.transform = tr; }
    const g = d.ry / 7;
    glare.style.opacity = fmt(g);
    glare.style.backgroundPosition = `${fmt(100 - 70 * g)}% 0%`;
    // the tap (scale 0.98 for 120 ms)
    const hp = S.feed.hero.P;
    const tap = t < G.TAP ? 1 : t < G.TAP + 0.06 ? lerp(1, 0.98, EASE.expoOut((t - G.TAP) / 0.06)) : lerp(0.98, 1, EASE.quintOut(clamp((t - G.TAP - 0.06) / 0.18)));
    const s = G.SLOT.hero;
    renderPlate(hp, { x: s.x, y: s.y, w: s.w, h: s.h, m: [8, 8, 8, 8], s: tap, shadow: "none" });
  });
} });
