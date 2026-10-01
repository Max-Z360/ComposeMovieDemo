// Shots 1–3: the work (developing plate on ink), the wall, tension → freeze. The wall itself is drawn
// into the background canvas by gen/wall.js; the hero cell is the carrier (scenes/carrier.js).
SCENES.push({ name: "hook", build(tl) {
  Wall.build(S.lib, SEED);
  const L1 = makeLine("L1", T.L1, { bone: true });
  rise(tl, L1, LN.L1[0]); const e1 = exitLine(tl, L1, LN.L1[1]);
  vis(L1.el, [LN.L1[0], e1]);
  const L2 = makeLine("L2", T.L2, { bone: true });
  rise(tl, L2, LN.L2[0]); const e2 = exitLine(tl, L2, LN.L2[1]);
  vis(L2.el, [LN.L2[0], e2]);
} });
