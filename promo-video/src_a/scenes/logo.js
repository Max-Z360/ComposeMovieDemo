// Shot 13: the end card. The dot travels into the first tittle (carrier.js); the wordmark blur-ins
// (90 % at 38.571); second tittle at 38.661; tagline (44 px, "Chosen" firms 400 → 600); 40 px rule;
// CTA. 1 % push-in anchored on the copy column (x = 173 stays exact); hold to 42.000; cut to black.
SCENES.push({ name: "logo", build(tl) {
  const card = h("div", null, $("cam")); card.id = "card";
  card.style.display = "block";
  const WM = Wordmark.buildWordmark(card, BRAND_NAME, 520, { stemDx: 0 });
  const tag = h("div", "tagline", card);
  const words = (ZH ? [T.L10] : T.L10.split(" "));
  const wsp = [];
  words.forEach((w, i) => { const m = h("span", "m", tag); wsp.push(h("span", "w", m, w)); if (i < words.length - 1) tag.appendChild(document.createTextNode(" ")); });
  tag.style.top = "0px"; tag.style.top = (660 - Wordmark.baselineOf(tag)) + "px";
  if (ZH) tag.style.fontFamily = '"Noto Sans SC"';
  const rule = h("div", "hair", card); rule.style.cssText += ";left:173px;top:700px;width:40px";
  const cta = h("div", "cap", card, T.L11); cta.style.left = "173px"; cta.style.top = "0px";
  cta.style.top = (740 - Wordmark.baselineOf(cta)) + "px";
  card.style.display = "none";
  vis(card, [38.0, C.pictureEnd]);
  vis($("black"), [C.pictureEnd, 1e9]);

  // wordmark blur-in: quint-out sized so the reveal is at 90 % exactly on the logo hit (38.571)
  let lo = 0.6, hi = 4; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (EASE.quintOut((C.hits.logo - 38.0) / m) > 0.9) lo = m; else hi = m; }
  const D = (lo + hi) / 2; S.wordmarkDur = D;
  blurIn(tl, WM.el, 38.0, D, "0px 50%");
  const t2 = WM.tittles[1];
  if (t2) tl.fromTo(t2.el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: EASE.quintOut, immediateRender: false }, C.hits.logo + 0.09);
  if (WM.tittles[0]) WM.tittles[0].el.style.visibility = "hidden";   // the travelling dot IS the first tittle
  // tagline (masked rise at 39.286), rule (39.7), CTA (39.857–40.257)
  wsp.forEach((w, i) => tl.fromTo(w, { y: 68 }, { y: 0, duration: 0.6, ease: EASE.expoOut, immediateRender: false }, LN.L10[0] + i * 0.055));
  tl.fromTo(rule, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: EASE.sineInOut, immediateRender: false }, 39.7);
  tl.fromTo(cta, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: EASE.sineInOut, immediateRender: false }, LN.L11[0]);

  // card push-in 1 %, origin on the copy column at the wordmark baseline
  const O = { x: 173, y: 520 };
  const push = t => 1 + 0.01 * EASE.push(clamp((t - SH.logo[0]) / (C.pictureEnd - SH.logo[0])));
  card.style.transformOrigin = `${O.x}px ${O.y}px`;
  const p1 = WM.tittles[0] || { x: 262, y: 390, d: 24 };
  S.tittle1 = t => { const s = push(t); return { x: O.x + (p1.x - O.x) * s, y: O.y + (p1.y - O.y) * s, d: 24 * s }; };
  S.wordmark = WM;
  const chosen = wsp[0];
  // "Chosen" firms 400 → 600 inside a fixed-width, left-aligned block: the rest of the line never moves
  if (!ZH) {
    card.style.display = "block";
    chosen.style.fontVariationSettings = `"opsz" 144, "wght" 600, "SOFT" 50, "WONK" 0`;
    const wMax = chosen.getBoundingClientRect().width;
    chosen.style.fontVariationSettings = "";
    chosen.parentElement.style.width = Math.ceil(wMax + 1) + "px";
    card.style.display = "none";
  }
  upd(t => {
    if (t < 38.0 || t >= C.pictureEnd) return;
    card.style.transform = `scale(${fmt(push(t))})`;
    if (!ZH) {
      const w = Math.round(400 + 200 * EASE.quintOut(clamp((t - 39.5) / 0.7)));
      chosen.style.fontVariationSettings = `"opsz" 144, "wght" ${fmt(w)}, "SOFT" 50, "WONK" 0`;
    }
  });
} });
