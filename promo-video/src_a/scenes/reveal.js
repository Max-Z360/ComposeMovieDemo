// Shot 5: the hero mounted, chosen (frame draw + dot — in carrier.js), "Only the work worth seeing."
// (blur-in, 2 lines) and the app top bar at 14.286.
SCENES.push({ name: "reveal", build(tl) {
  const L4 = makeLine("L4", T.L4);
  blurIn(tl, L4.el, LN.L4[0], 0.55, "0px 84px");
  const e = exitLine(tl, L4, LN.L4[1], 0.33);
  vis(L4.el, [LN.L4[0], e]);
  // top bar: Tipmi (Fraunces 28) · Today — 31 chosen (Inter 22, muted, right-aligned to 1747) · rule y=104
  const tb = h("div", null, $("cam")); tb.id = "topbar";
  h("div", "brand", tb, BRAND_NAME);
  const td = h("div", "cap muted today", tb, T.today);
  h("div", "rule", tb);
  S.topbar = tb; S.topbarToday = td;
  tl.fromTo(tb, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, C.bars[5]);
  tl.fromTo(tb, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: EASE.sineInOut, immediateRender: false }, SH.column[0]);
  vis(tb, [C.bars[5], SH.column[0] + 0.3]);
} });
