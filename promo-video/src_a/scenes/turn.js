// Shot 4: empty paper, the light band drifting from x = −420, "Not anymore." (1.5 % push-in, anchored
// on the copy column so the display left edge stays exactly at x = 173).
SCENES.push({ name: "turn", build(tl) {
  const L3 = makeLine("L3", T.L3);
  rise(tl, L3, LN.L3[0]); const e = exitLine(tl, L3, LN.L3[1]);
  vis(L3.el, [LN.L3[0], e]);
  L3.par.style.transformOrigin = "0px 42px";
  upd(t => {
    if (t < LN.L3[0] || t >= e) return;
    const s = 1 + 0.015 * EASE.push(clamp((t - SH.turn[0]) / (SH.turn[1] - SH.turn[0])));
    L3.par.style.transform = `scale(${fmt(s)})`;
  });
} });
