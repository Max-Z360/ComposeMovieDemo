// Shot 12: the human beat — the plate becomes a physical print (carrier.js); "For people who make
// things." in Fraunces Italic, two lines, slow exit (450 ms).
SCENES.push({ name: "human", build(tl) {
  const L9 = makeLine("L9", T.L9, { ital: true });
  rise(tl, L9, LN.L9[0]); const e9 = exitLine(tl, L9, LN.L9[1], 0.45);
  vis(L9.el, [LN.L9[0], e9]);
} });
