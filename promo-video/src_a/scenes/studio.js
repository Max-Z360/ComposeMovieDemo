// Shots 9–10: Studio — make (WARMTH dial in 7 detents, three hairline sliders, PUBLISH) and the
// long press (oxblood ring → lift). The hero's grade/lift live in carrier.js.
SCENES.push({ name: "studio", build(tl) {
  const st = h("div", null, $("cam")); st.id = "studio";
  // three rising groups, each in its own mask (masked rise + 94 → 100 %)
  const group = (x, y, w, hh) => { const m = h("div", "mask", st); Object.assign(m.style, { left: x + "px", top: y + "px", width: w + "px", height: hh + "px" }); const g = h("div", "grp", m); g.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${hh}px;transform-origin:0 0`; return { m, g, hh }; };
  const g1 = group(165, 392, 560, 216), g2 = group(165, 618, 640, 164), g3 = group(165, 830, 216, 66);
  // label + dial + WARMTH readout (g1 local origin = (165, 392))
  const lab = h("div", "cap muted", g1.g, T.studio); lab.style.transform = "translate(8px,8px)";
  const D = svgEl("svg", { width: 160, height: 160, viewBox: "0 0 160 160" }, g1.g);
  D.style.cssText = "position:absolute;left:8px;top:48px;overflow:visible";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    svgEl("line", { x1: fmt(80 + 66 * Math.cos(a)), y1: fmt(80 + 66 * Math.sin(a)), x2: fmt(80 + 76 * Math.cos(a)), y2: fmt(80 + 76 * Math.sin(a)), stroke: "#C9C4BA", "stroke-width": 1 }, D);
  }
  const act = svgEl("line", { x1: 80, y1: 80 - 63, x2: 80, y2: 80 - 79, stroke: ACCENT, "stroke-width": 2, "stroke-linecap": "butt" }, D);
  const needle = svgEl("line", { x1: 80, y1: 80, x2: 80, y2: 80 - 54, stroke: "#141311", "stroke-width": 2, "stroke-linecap": "round" }, D);
  svgEl("circle", { cx: 80, cy: 80, r: 4, fill: "#141311" }, D);
  const wl = h("div", "caps", g1.g, T.warmth); wl.style.cssText += ";position:absolute;left:192px;top:94px";
  const ro = h("div", "cap", g1.g, "+0"); ro.style.transform = "translate(192px,124px)";
  // sliders: label left, 420 px hairline track, 10 px thumb (g2 local origin = (165, 618))
  const SL = [[T.exposure, 640, 0.62], [T.grain, 700, 0.34], [T.crop, 760, 0.78]];
  SL.forEach(([name, y, v]) => {
    const l = h("div", "caps", g2.g, name); l.style.cssText += `;position:absolute;left:8px;top:${y - 618 - 13}px`;
    const tr = h("div", "hair", g2.g); tr.style.cssText += `;left:188px;top:${y - 618}px;width:420px;background:#C9C4BA`;
    const th = h("div", null, g2.g); th.style.cssText = `position:absolute;left:${188 + 420 * v}px;top:${y - 618 + 0.5}px;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#3A3835`;
  });
  // PUBLISH (g3 local origin = (165, 830)); the button is at (173, 840) 200×48
  const btn = h("div", null, g3.g); btn.id = "pubBtn"; btn.style.left = "8px"; btn.style.top = "10px";
  const bl = h("div", "caps", btn, T.publish);
  // the long-press ring: r 32, 2.5 px, centred on the button, fills clockwise 28.929–30.143
  const R = svgEl("svg", { width: 80, height: 80, viewBox: "0 0 80 80" }, st);
  R.style.cssText = "position:absolute;left:233px;top:824px;overflow:visible";
  const C2 = 2 * Math.PI * 32;
  const ring = svgEl("circle", { cx: 40, cy: 40, r: 32, fill: "none", stroke: ACCENT, "stroke-width": 2.5, transform: "rotate(-90 40 40)", "stroke-dasharray": C2.toFixed(2), "stroke-dashoffset": C2.toFixed(2) }, R);

  const tA = SH.studio[0], lift = CUES.risers.lift[0], press = CUES.ticks[3];
  vis(st, [tA + 0.08, lift + 0.12 + 0.35 + 0.01]);
  [g1, g2, g3].forEach((g, i) => {
    const t0 = tA + 0.08 * (i + 1);
    tl.fromTo(g.g, { y: fmt(g.hh * 1.1), scale: 0.94 }, { y: 0, scale: 1, duration: 0.6, ease: EASE.expoOut, immediateRender: false }, t0);
    tl.fromTo(g.g, { y: 0, opacity: 1 }, { y: 40, opacity: 0, duration: 0.35, ease: EASE.expoIn, immediateRender: false }, lift + 0.06 * i);
  });
  // press: scale 0.98 (120 ms) held through the long press; the label yields to the ring
  tl.fromTo(btn, { scale: 1 }, { scale: 0.98, duration: 0.12, ease: EASE.expoOut, immediateRender: false }, press);
  tl.fromTo(bl, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: EASE.sineInOut, immediateRender: false }, press);
  vis(R, [press, lift + 0.3]);
  tl.fromTo(ring, { attr: { "stroke-dashoffset": C2 } }, { attr: { "stroke-dashoffset": 0 }, duration: lift - press, ease: cubicBezier(0.25, 0.08, 0.75, 0.92), immediateRender: false }, press);
  tl.fromTo(R, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: EASE.sineInOut, immediateRender: false }, lift);

  // "Published today" under the caption (31.0), gone with the ledger (34.286)
  const pub = h("div", "cap muted", $("cam"), T.published); pub.id = "pubToday";
  vis(pub, [31.0, SH.human[0] + 0.4]);
  tl.fromTo(pub, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.quintOut, immediateRender: false }, 31.0);
  tl.fromTo(pub, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, SH.human[0]);

  const L7 = makeLine("L7", T.L7);
  rise(tl, L7, LN.L7[0]); const e7 = exitLine(tl, L7, LN.L7[1]);
  vis(L7.el, [LN.L7[0], e7]);

  // the ratchet: 7 detents (expo-out between), readout +1…+7, active oxblood tick follows the needle
  upd(t => {
    if (t < tA || t > lift + 1) return;
    let k = 0, a = 0;
    S.DET.forEach((d, i) => { const s0 = d - 0.03; if (t >= s0) a = i + EASE.expoOut(clamp((t - s0) / 0.03)); if (t >= d - 1e-6) k = i + 1; });
    const ang = fmt(15 * a);
    needle.setAttribute("transform", `rotate(${ang} 80 80)`);
    act.setAttribute("transform", `rotate(${15 * k} 80 80)`);
    const txt = "+" + k; if (ro.textContent !== txt) ro.textContent = txt;
  });
  upd(t => {
    if (t < 31.0 || t >= SH.human[0] + 0.4) return;
    const p = S.capAt(t); if (!p) return;
    const tr = `translate(${fmt(p.cx)}px,${fmt(p.cy + 34)}px)`;
    if (pub._tr !== tr) { pub._tr = tr; pub.style.transform = tr; }
  });
} });
