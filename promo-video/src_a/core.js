// Shared runtime for variant a: the asset bag S, DOM helpers, line builders, visibility windows,
// per-frame updaters and the mounted-plate renderer. Everything here is pure in t.
const S = { el: {}, vis: [], upd: [], lines: {} };
const C = CUES, SH = CUES.shots, LN = CUES.lines;
const $ = id => document.getElementById(id);
function h(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// visibility windows: element displayed only inside [a, b)
function vis(el, ...wins) { S.vis.push([el, wins]); }
function applyVis(t) {
  for (const [el, wins] of S.vis) {
    let on = false; for (const [a, b] of wins) if (t >= a && t < b) { on = true; break; }
    const d = on ? "block" : "none";
    if (el.style.display !== d) el.style.display = d;
  }
}
function upd(fn) { S.upd.push(fn); }
const fmt = n => Math.round(n * 1000) / 1000;

// ---- display lines ---------------------------------------------------------------------------
// .line (GSAP: entry/exit) > .par (updater: parallax / push) > .row > .m (mask) > .w (word, masked rise)
const ZH = LANG === "zh";
function makeLine(id, text, opts = {}) {
  const el = h("div", "line" + (opts.ital && !ZH ? " ital" : "") + (opts.bone ? " bone" : "") + (ZH ? " zh" : ""), opts.parent || $("lines"));
  el.id = id;
  if (opts.maxWidth) el.style.width = opts.maxWidth + "px";
  if (opts.style) Object.assign(el.style, opts.style);
  const par = h("div", "par", el);
  const words = [];
  const rows = ZH ? [text.replace(/\n/g, "")] : text.split("\n");
  rows.forEach(r => {
    const row = h("div", "row", par);
    const ws = ZH ? [r] : r.split(" ");
    ws.forEach((w, i) => {
      const m = h("span", "m", row), wi = h("span", "w", m, w);
      words.push(wi);
      if (i < ws.length - 1) row.appendChild(document.createTextNode(" "));
    });
  });
  const L = { el, par, words, fs: parseFloat(getComputedStyle(el).fontSize) || 84 };
  S.lines[id] = L;
  return L;
}
// masked rise: words translateY(110 % of the mask) -> 0, 600 ms expo-out, 55 ms stagger
function rise(tl, L, tIn, opts = {}) {
  const dur = opts.dur || 0.6, st = opts.stagger != null ? opts.stagger : 0.055;
  const maskH = L.fs * 1.4;
  L.words.forEach((w, i) => tl.fromTo(w, { y: fmt(maskH * 1.1) }, { y: 0, duration: dur, ease: EASE.expoOut, immediateRender: false }, tIn + i * st));
  return tIn + (L.words.length - 1) * st + dur;
}
// exit: 60 % of entry duration, 6 px upward drift, expo-in. Starts at the copy deck "out" time.
function exitLine(tl, L, tOut, dur = 0.36) {
  tl.fromTo(L.el, { opacity: 1, y: 0 }, { opacity: 0, y: -6, duration: dur, ease: EASE.expoIn, immediateRender: false }, tOut);
  return tOut + dur;
}
// blur-in: blur(10px)->0, opacity 0->1, scale 1.03->1, quint-out
function blurIn(tl, el, tIn, dur = 0.55, origin = "0% 50%") {
  tl.fromTo(el, { opacity: 0, filter: "blur(10px)", scale: 1.03, transformOrigin: origin }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: dur, ease: EASE.quintOut, immediateRender: false }, tIn);
}

// ---- mounted plates --------------------------------------------------------------------------
// A plate = mat (div.plate) + plate canvas (object-fit: cover) + 1 px edge + optional dim overlay.
function makePlate(parent, srcCanvas, opts = {}) {
  const el = h("div", "plate", parent);
  const cv = h("canvas", "pc", el);
  cv.width = srcCanvas ? srcCanvas.width : 540; cv.height = srcCanvas ? srcCanvas.height : 720;
  if (srcCanvas) cv.getContext("2d", { willReadFrequently: true }).drawImage(srcCanvas, 0, 0);
  const dim = h("div", "dim", el);
  const edge = h("div", "edge", el);
  return { el, cv, dim, edge, last: {} };
}
// st: {x,y,w,h, m:[l,t,r,b], s, rot, op, blur, dim, shadow:'none'|string, edgeColor, bg, clip}
function renderPlate(P, st) {
  const e = P.el, L = P.last;
  const set = (k, v, fn) => { if (L[k] !== v) { L[k] = v; fn(v); } };
  set("w", fmt(st.w), v => e.style.width = v + "px");
  set("h", fmt(st.h), v => e.style.height = v + "px");
  const tr = `translate(${fmt(st.x)}px,${fmt(st.y)}px)` + (st.rot ? ` rotate(${fmt(st.rot)}deg)` : "") + (st.s != null && st.s !== 1 ? ` scale(${fmt(st.s)})` : "");
  set("tr", tr, v => e.style.transform = v);
  set("op", st.op == null ? 1 : fmt(st.op), v => e.style.opacity = v);
  set("blur", st.blur ? `blur(${fmt(st.blur)}px)` : "none", v => e.style.filter = v);
  const m = st.m || [0, 0, 0, 0];
  const pl = m[0], pt = m[1], pw = st.w - m[0] - m[2], ph = st.h - m[1] - m[3];
  const pk = `${fmt(pl)},${fmt(pt)},${fmt(pw)},${fmt(ph)}`;
  set("pk", pk, () => {
    for (const c of [P.cv, P.dim]) { c.style.left = fmt(pl) + "px"; c.style.top = fmt(pt) + "px"; c.style.width = fmt(pw) + "px"; c.style.height = fmt(ph) + "px"; }
  });
  set("dim", st.dim ? fmt(st.dim) : 0, v => P.dim.style.opacity = v);
  set("sh", st.shadow || "none", v => e.style.boxShadow = v);
  set("bg", st.bg || "var(--paper-deep)", v => e.style.background = v);
  set("ec", st.edgeColor || "var(--rule)", v => P.edge.style.borderColor = v);
  set("clip", st.clip || "none", v => e.style.clipPath = v);
}
// clip-path polygon (element-local) that hides the parts of an element at page rect (x,y,w,h)
// lying inside the phone column band but outside the visible screen window (rounded corners).
const SCR = { x: 975, y: 97, w: 410, h: 886, r: 52, head: 102 };
function screenClip(x, y, topInset, sc = 1) {
  const X0 = SCR.x, X1 = SCR.x + SCR.w, Y0 = SCR.y + topInset, Y1 = SCR.y + SCR.h, r = SCR.r, B = 4000;
  const pts = [];
  const P = (px, py) => pts.push(`${fmt((px - x) / sc)}px ${fmt((py - y) / sc)}px`);
  P(-B, -B); P(X0, -B);
  if (topInset > 0) { P(X0, Y0); P(X1, Y0); }
  else { // rounded top corners of the screen
    P(X0, Y0 + r); for (let i = 1; i < 8; i++) { const a = Math.PI + (Math.PI / 2) * i / 8; P(X0 + r + r * Math.cos(a), Y0 + r + r * Math.sin(a)); }
    P(X0 + r, Y0); P(X1 - r, Y0); for (let i = 1; i < 8; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * i / 8; P(X1 - r + r * Math.cos(a), Y0 + r + r * Math.sin(a)); }
    P(X1, Y0 + r);
  }
  P(X1, -B); P(B, -B); P(B, B); P(X1, B);
  P(X1, Y1 - r); for (let i = 1; i < 8; i++) { const a = (Math.PI / 2) * i / 8; P(X1 - r + r * Math.cos(a), Y1 - r + r * Math.sin(a)); }
  P(X1 - r, Y1); P(X0 + r, Y1); for (let i = 1; i < 8; i++) { const a = Math.PI / 2 + (Math.PI / 2) * i / 8; P(X0 + r + r * Math.cos(a), Y1 - r + r * Math.sin(a)); }
  P(X0, Y1 - r); P(X0, B); P(-B, B);
  return `polygon(${pts.join(",")})`;
}

// dots (chosen marks): positioned by centre + diameter
function renderDot(el, cx, cy, d, op = 1, last = el._last || (el._last = {})) {
  const tr = `translate(${fmt(cx)}px,${fmt(cy)}px) scale(${fmt(d / 18)})`;
  if (last.tr !== tr) { last.tr = tr; el.style.transform = tr; }
  const o = fmt(op); if (last.op !== o) { last.op = o; el.style.opacity = o; }
}
const plateShadow = a => a <= 0 ? "none" : `0 2px 4px rgba(20,19,17,${fmt(0.08 * a)}), 0 24px 48px rgba(20,19,17,${fmt(0.14 * a)})`;
function rectLerp(a, b, u) { return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) }; }
function scaleRect(r, s, cx, cy) { return { x: cx + (r.x - cx) * s, y: cy + (r.y - cy) * s, w: r.w * s, h: r.h * s }; }
