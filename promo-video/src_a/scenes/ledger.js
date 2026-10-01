// Shot 11: Ledger — paid. A 1 px oxblood rule at y = 440 (173 → 760), then three typeset rows 56 px
// apart on their cues (masked rise, 110 ms word stagger), 1 px --rule between rows. Nothing ticks.
SCENES.push({ name: "ledger", build(tl) {
  const box = h("div", null, $("cam")); box.id = "ledger"; box.style.cssText = "position:absolute;inset:0";
  const t0 = SH.ledger[0], tOut = SH.human[0];
  vis(box, [t0, tOut + 0.4]);
  const acc = h("div", "hair", box); acc.style.cssText += ";left:173px;top:440px;width:587px;background:" + ACCENT;
  tl.fromTo(acc, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: EASE.expoOut, immediateRender: false }, t0);
  const rows = [T.supporter, T.tip, T.print];
  // each row: the text masked-rises on its cue (the sub duck), its separator rule draws 110 ms later
  rows.forEach((txt, i) => {
    const tc = CUES.ledgerRows[i], top = 440 + 56 * i;
    if (i < rows.length - 1) {
      const r = h("div", "hair", box); r.style.cssText += `;left:173px;top:${top + 56}px;width:587px`;
      tl.fromTo(r, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: EASE.expoOut, immediateRender: false }, tc + 0.11);
    }
    if (!txt) return;                                    // blank constant hides the row, timing unchanged
    const row = h("div", "cap", box); row.style.transform = `translate(173px,${top + 15}px)`;
    const m = h("span", "m", row), wi = h("span", "w", m, txt);
    tl.fromTo(wi, { y: 40 }, { y: 0, duration: 0.6, ease: EASE.expoOut, immediateRender: false }, tc);
  });
  tl.fromTo(box, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, tOut);
  const L8 = makeLine("L8", T.L8);
  rise(tl, L8, LN.L8[0]); const e8 = exitLine(tl, L8, LN.L8[1]);
  vis(L8.el, [LN.L8[0], e8]);
} });
