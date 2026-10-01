// Shared layout + motion geometry (stage px). Positions are mat-outer top-left (brief convention).
const G = {};
G.HOOK = { x: 1040, y: 220, w: 480, h: 640 };                 // shot 1: plate, no mat
G.REVEAL = { x: 1120, y: 196, w: 528, h: 688, m: 24 };        // shot 5: 480×640 plate in a 24 px mat
G.STUDIO = { x: 1100, y: 176, w: 558, h: 728, m: 24 };        // shots 9–11: 510×680 plate in a 24 px mat
G.PRINT = { x: 1080, y: 160, w: 560, h: 760, m: [40, 40, 40, 80] }; // shot 12: 480×640 print, weighted foot

// shot 6 wall (outer rects; mats 12 px). Row-2 plates of the brief's masonry are re-fitted so every
// caption clears the plate below it and stays inside the 80 px text-safe area (see BUILD_NOTES).
G.WALL = {
  hero: { x: 1100, y: 140, w: 360, h: 480 },
  P1: { x: 173, y: 360, w: 292, h: 219, lib: 6 },
  P2: { x: 513, y: 360, w: 234, h: 312, lib: 16 },
  P3: { x: 793, y: 360, w: 200, h: 200, lib: 4 },
  P4: { x: 173, y: 645, w: 234, h: 312, lib: 11 },
  P5: { x: 455, y: 738, w: 292, h: 219, lib: 21 },
  P6: { x: 793, y: 626, w: 220, h: 293, lib: 7 },
  P7: { x: 1500, y: 140, w: 247, h: 329, lib: 18 },
};
G.WALL_KEYS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];     // reading order (entry + dots)
G.WALL_MAT = 12;
// shot 6 camera: 1 % push-in (plates), parallax drift: plates 1.6×, type 2.2× of d
G.wallCam = t => { const u = EASE.push(clamp((t - SH.wall[0]) / (SH.wall[1] - SH.wall[0]))); return { s: 1 + 0.01 * u, d: 8 * u }; };
G.wallRect = (r, t) => { const c = G.wallCam(t); const q = scaleRect(r, c.s, 960, 540); q.y -= 1.6 * c.d; return q; };

// shot 7–8 feed (screen-local px; screen = 410×886 at (975, 97))
G.SCR = { x: 975, y: 97 };
G.FEED_ORDER = ["P3", "hero", "P2", "P1", "P4", "P5", "P6", "P7"];
G.FEED_MAT = 8;
G.FLY = { hero: 20.0, P3: 20.04, P2: 20.08, P1: 20.12, P4: 20.16, P5: 20.2, P6: 20.24, P7: 20.28 };
G.FLY_DUR = 0.7;
G.SWAP_IN = 21.0;                 // page-level flying plates -> in-screen copies (all landed by 20.98)
G.SWAP_OUT = 25.143;              // in-screen hero -> flat carrier (phone at 0°)
G.buildFeed = function (lib) {
  let y = 139; G.SLOT = {};
  for (const k of G.FEED_ORDER) {
    const src = k === "hero" ? lib.hero : lib.plates[G.WALL[k].lib].canvas;
    const ph = 362 * src.height / src.width, oh = ph + 2 * G.FEED_MAT;
    G.SLOT[k] = { x: 16, y, w: 378, h: oh };
    y += oh + 10 + 25 + 24;
  }
};
// feed scroll: 0 -> 420 (20.7–22.857, smoothstep, 0.4 s hold mid-way), then the device-shot drift
// (≈ 40 px/s peak) that brings the hero to the top of the feed exactly at the tap (24.286)
G.scroll = K([[20.7, 0], [21.5785, 210, EASE.smooth], [21.9785, 210], [22.857, 420, EASE.smooth], [24.286, 458, EASE.smooth]]);
G.slotPage = (k, t) => { const s = G.SLOT[k]; return { x: G.SCR.x + s.x, y: G.SCR.y + s.y - G.scroll(t), w: s.w, h: s.h }; };

// caption/dot layout relative to a mat rect
// hang: caption under the mat, dot hanging 24 px left of the mat edge (reveal, studio, print)
// inline: dot inside the mat's x-range, caption indented after it (wall); feed: same, 21 px type
G.capLayout = function (r, mode) {
  if (mode === "hang") { const top = r.y + r.h + 16; return { cx: r.x, cy: top, dx: r.x - 24, dy: top + 15 }; }
  if (mode === "inline") { const top = r.y + r.h + 16; return { cx: r.x + 22, cy: top, dx: r.x + 7, dy: top + 15 }; }
  const top = r.y + r.h + 10; return { cx: r.x + 22, cy: top, dx: r.x + 7, dy: top + 14 };
};
G.lerpCap = (a, b, u) => ({ cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), dx: lerp(a.dx, b.dx, u), dy: lerp(a.dy, b.dy, u) });

// phone dolly (shot 8): rotateY 0→7°, rotateX 0→3°, push 3 % on the camera curve 22.857–24.571,
// interrupted by the tap at 24.286 and returned flat (expo-out) by 24.857
G.TAP = 24.286;
G.dolly = function (t) {
  const t0 = SH.device[0], t1 = 24.571, tf = 24.857;
  const at = tt => EASE.camera(clamp((tt - t0) / (t1 - t0)));
  if (t < G.TAP) { const u = at(t); return { ry: 7 * u, rx: 3 * u, s: 1 + 0.03 * u }; }
  const u0 = at(G.TAP), v = 1 - EASE.expoOut(clamp((t - G.TAP) / (tf - G.TAP)));
  return { ry: 7 * u0 * v, rx: 3 * u0 * v, s: 1 + 0.03 * u0 * v };
};
