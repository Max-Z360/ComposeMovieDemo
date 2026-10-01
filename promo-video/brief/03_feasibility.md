# 03 — Feasibility: Premium Visual Techniques Under a Deterministic HTML→Frames Pipeline

Author: Fable 5.1 (planning / research pass). For: Opus 5.5 (production), reviewers.
Scope: what can look genuinely premium when every frame is `seek(t)` → headless-Chromium screenshot → ffmpeg, with no stock media, no image URLs, no AI generation, code-synthesized audio only.

Environment verified 2026-10-01 in the sandbox:
- Node v22.22, Playwright 1.56.1 (`/opt/node22/lib/node_modules/playwright`, Chromium headless), 4 CPUs, 15 GB RAM, **no GPU** (WebGL = SwiftShader software).
- ffmpeg 6.1.1 with `libx264`, `aac`, `libopus`, `ebur128`, `loudnorm`, `astats`, `noise`, `vignette`, `deband`.
- Existing harness: `tools/render.js` (contract: `window.DURATION`, `window.READY`, `window.seek(t)`; `--jpeg`, `--scale`, `--workers`), `tools/encode.sh`, `src/fonts.css` (23 local OFL fonts incl. Noto Sans SC).
- Micro-benchmarks below were run on this machine with a 1920×1080 viewport (`scratchpad/bench/`). Numbers are per-frame wall time of *one* Playwright worker; four workers run in parallel.

---

## 1. Technique catalogue (with risk ratings)

Risk legend — **Determinism**: can every frame be a pure function of `t`? **Perf**: cost per 1080p frame. **Taste**: how easily it slides into "template/crypto/UI-kit" territory. Scale: Low / Med / High.

### 1.1 Gradient mesh / aurora backgrounds
| Approach | Notes | Determinism | Perf | Taste |
|---|---|---|---|---|
| **Canvas 2D radial blobs, `lighter` blend, drawn at low res (240×135) and `drawImage`-upscaled** | 6–10 radial gradients whose centres orbit on sines of `t`. Upscale with `imageSmoothingEnabled=true` gives free softness; no CSS blur needed. Measured 0.6 ms draw. Best quality/cost. | Low (pure `t`) | Low (≈ 50–70 ms screenshot) | Low — keep saturation ≤ 60 %, luminance low on dark field |
| Full-res canvas blobs + `filter: blur(60px)` on the canvas element | Looks the same as above but blur raster is paid every frame. | Low | Med | Low |
| Layered CSS `radial-gradient()` backgrounds with GSAP-tweened custom properties (`--x1`, `--y1`) | Pure CSS; GSAP can tween CSS vars and seeks fine. Banding is visible on dark fields → always add grain (§1.2). | Low | Low | Med (reads "Stripe landing page" if colours are candy) |
| **WebGL fragment-shader aurora (fbm noise)** | Works in headless via SwiftShader (ANGLE/Vulkan). Measured ≈ 260 ms PNG / 40 ms JPEG for a trivial shader; a 6-octave fbm at 1080p on CPU will be slower. Render at 480×270 and upscale, or avoid. | Low (uniform `t`) | **Med–High** (software GL) | Low |

**Recommendation:** low-res Canvas 2D blobs upscaled. Deterministic, 1 ms, no banding when grain is applied on top. Reserve WebGL for one hero shot at most, rendered at quarter resolution.

### 1.2 Film grain
Measured cost (single worker, 1080p):

| Method | Draw cost | Screenshot PNG | Screenshot JPEG q92 | Notes |
|---|---|---|---|---|
| SVG `feTurbulence` full-frame (2 or 4 octaves) | — | **1 100 ms** | 37 ms | Deterministic (`seed` attr); animate by changing `seed` per frame, forces full re-filter each frame. PNG encode of noise is the killer, not the filter. |
| Canvas `ImageData` noise, full frame, per frame | 13 ms (xorshift on `Uint32Array`) / 25 ms (mulberry32 per byte) | 720 ms | 73 ms | Deterministic with seeded PRNG re-seeded from frame index. |
| **Canvas 512² noise tile × 8 pre-baked, `createPattern` + per-frame offset** | **0.1 ms** | 725 ms | 75 ms | Pick tile `f % 8`, offset by a seeded jitter. Visually identical to full-frame noise. Pre-bake at `READY`. |
| **ffmpeg `noise=alls=7:allf=t+u:all_seed=…` at encode time** | 0 | — (frames stay clean & small, PNG ≈ 50–150 KB) | — | Deterministic given the seed. Grain is gaussian/uniform "video" noise, slightly less filmic than canvas but fine at 5–8 % on a dark field. Pair with `-tune film`. |

**Key finding:** grain itself is cheap; **PNG-encoding a grainy 1080p frame costs 0.7–1.1 s**. Either (a) screenshot as JPEG q95 (ffmpeg → x264 is yuv420p anyway, so 4:2:0 JPEG loses nothing the master would keep), (b) use CDP `Page.captureScreenshot {format:'png', optimizeForSpeed:true}` (noise frame 195 ms vs 764 ms, ~20 % bigger file), or (c) keep frames clean and add grain in ffmpeg. Recommended: **in-page tiled canvas grain at 24 fps cadence (update tile every `floor(t*24)`) + JPEG q95 frames** — it keeps grain visible in the review contact sheet and lets grain interact with `mix-blend-mode: overlay`/`soft-light` so shadows get more grain than highlights (craft guide §5). Intensity 3–6 %. Grain is also the cure for gradient banding on 8-bit dark fields.

### 1.3 Glassmorphism
| Approach | Measured | Notes |
|---|---|---|
| One `backdrop-filter: blur(30px)` panel 700×600 | 302 ms PNG / 62 ms JPEG | Fine. |
| Three such panels | 414 / **137 ms** | Each backdrop panel re-rasterizes everything behind it. Budget: ≤ 2 on screen. |
| Full-frame `backdrop-filter: blur(40px)` | 411 / **170 ms** | Over budget; never full-frame. |
| **Fake glass**: panel with `background: rgba(255,255,255,.07)`, 1 px `rgba(255,255,255,.14)` hairline, inner top highlight gradient, and a *pre-blurred copy of the background layer* (a second low-res canvas) clipped to the panel | ≈ baseline | Looks identical in motion, deterministic, 3× cheaper. Use when the background is our own canvas (it always is). |

Determinism: Low risk. Taste: **Med–High** — stacked frosted panels is the #1 "UI-kit" tell. One glass material, used once or twice (the phone's bottom bar, one tooltip).

### 1.4 Phone / device mockup in CSS 3D
Measured: a full CSS 3D phone (`perspective:1600px`, `rotateY(-22deg) rotateX(8deg)`, rounded bezel, 8 feed cards, glare gradient) = **81 ms PNG / 40 ms JPEG**; with a mirrored, masked, 4 px-blurred reflection = 80 / 42 ms. Essentially free.

Recipe:
- `#stage{perspective:1600–2200px}`; device `transform-style:preserve-3d`; rotate ≤ 25° Y, ≤ 10° X. Larger angles reveal that the bezel is flat.
- Bezel: `border-radius: 56px` outer / 46px screen, 1 px `rgba(255,255,255,.12)` edge highlight, `box-shadow: 0 60px 120px rgba(0,0,0,.6)` (one big soft shadow, not three).
- Screen glare: an absolutely positioned overlay with `linear-gradient(115deg, rgba(255,255,255,.18), transparent 40%)` whose angle/position is tweened by GSAP (`--glare-x`) so light *moves* as the phone rotates — reads as "camera", not "template".
- Reflection: clone the device, `scaleY(-1)`, `opacity:.2–.3`, `mask-image: linear-gradient(to top, black, transparent 60%)`, `filter: blur(3–6px)`. Only on a dark, floor-like field.
- Screen content is a normal HTML feed (§1.5) — it can scroll (`translateY` tween) *inside* the 3D transform. Put `will-change: transform` on the scroller only; do not put `filter` on the 3D ancestor (that flattens 3D in Chromium).
- Risk — Determinism: Low. Perf: Low. Taste: **Med** — a floating phone is the most generic shot in the genre. Make it earn its place: show it *once*, large, lit, slow push-in; otherwise show the UI flat and full-bleed (Linear/Apple style).

### 1.5 Generative "content" cards (the feed)
All drawn on small offscreen canvases (card size, e.g. 420×560 or 360×480) at `READY` into a seeded library of ~24 cards, then `drawImage`d or used as `<img src=canvas.toDataURL()>` (data URIs are local, allowed). Per-card parameter sets come from the seeded PRNG so the library is identical on every worker.

| Style | Recipe | Perf | Taste |
|---|---|---|---|
| **Soft blobs / "studio light"** | 3–5 radial gradients in a 2-colour analogous palette, `lighter`, low-res + upscale, slight vignette. Reads as abstract photography / fabric / skin-tone studies. | ~1 ms | Low — the most "curated" looking |
| **Flow fields** | 2 000–3 000 short polylines following `sin/cos` or value-noise angle field, 1–1.5 px, 20–30 % alpha, warm ink on paper or cream on black. Measured 17 ms for 3 000×40 segments at full frame; card-sized ≈ 3 ms. | Low | Low — reads as fine-art print |
| **Geometric compositions** | 3–7 rectangles/arcs on a strict grid, Swiss/Bauhaus palette (black, cream, one accent), optional 1 px rules. | <1 ms | Med — too many → "design-tool template" |
| **Typographic posters** | One large serif word or numeral (Fraunces/Instrument Serif), rotated 90°, cropped by the card; mono caption line. Uses real fonts → looks like real editorial work. | <1 ms | Low |
| **Halftone / dot-matrix portraits of the blobs** | Sample the blob canvas on a 6–8 px grid, draw circles with radius ∝ luminance. | ~5 ms per card | Med (Nothing-phone look, use once) |
| Line-drawn illustration (SVG paths: a chair, a vase, a hand) | Hand-written SVG; stroke-dashoffset reveal is seekable via GSAP. | Low | **High** — amateur illustration is the fastest way to look cheap. Only if the drawing is excellent; prefer abstraction. |

Mix ratio for a convincing feed: 40 % soft blobs, 25 % flow fields, 20 % typographic, 15 % geometric. Grade all cards through one shared palette function (same hue family ± 30°, same black point) so the feed looks *curated*, which is the brand promise. Add 1 px `rgba(255,255,255,.06)` card border and 16–24 px radius; captions in the grotesk at 20–24 px with a seeded "name" list (no lorem ipsum).

### 1.6 SVG masking for text reveals
- **Masked rise** (text clipped by `overflow:hidden` on its wrapper, `translateY(110%) → 0`): pure CSS transform, 41 ms measured — the cheapest premium move there is. Default for serif display lines.
- SVG `<clipPath>`/`<mask>` with an animated rect: also deterministic (tween the rect's `x`/`width` with GSAP). Use for the wordmark reveal (a light sweep through the mask).
- `background-clip:text` gradient sweep: avoid (the craft guide bans gradient text).
- Risk: Determinism Low; Perf Low; Taste Low.

### 1.7 Variable-font weight animation
- Tween `font-variation-settings: "wght" 300 → 500` or `font-weight` via GSAP; Chromium re-shapes text each frame; measured 55 ms for 5 display lines. Deterministic.
- Use for one moment only (e.g. the word "Chosen" firming up from 300 to 500 over 700 ms, or `opsz` shifting on Fraunces). Weight animation on every line reads gimmicky. Taste Med.
- Caveat: as weight changes, line width changes → use `text-align:left` on a fixed-width block, never centre-align a weight-animated line.

### 1.8 Blur-in text
- `filter: blur(12px) → 0` + `opacity` + `scale(1.03 → 1)`; GSAP tweens the filter string. Measured 107 ms for 6 simultaneous 120 px lines with blur; one line ≈ 60 ms. Deterministic.
- Do not combine `filter` on a text element with a 3D-transformed ancestor. Do not blur more than ~2 elements at once. Taste Low (it is the Apple/Linear default).

### 1.9 Parallax layers
- 3 layers (bg canvas / cards / type) translated at 1 : 1.6 : 2.2 ratios as functions of a single tweened "camera" value. Pure transforms, ~free. Add `scale(1.01–1.03)` push-in on every held plate. Determinism Low, Perf Low, Taste Low.

### 1.10 Light leaks / bloom
- Bloom: a *small* element (≤ 500×400) with `filter: blur(60–80px)` + `mix-blend-mode: screen` — measured 377 ms PNG / 41 ms JPEG (PNG inflated by soft gradient entropy; JPEG fine). **Full-frame blurred layers** cost 590–660 ms PNG / 35–46 ms JPEG: raster cost is fine, PNG encode is not → another argument for JPEG frames.
- Cheaper and better-looking alternative: draw the glow into the low-res background canvas (radial gradient, `lighter`) — zero filter cost and it can be keyed to the accent colour. Bloom only from light sources inside the image, never on text. Taste **Med–High** when saturated (the "crypto" failure mode).
- Light leaks (orange/magenta streaks sweeping): avoid; they are a stock-transition tell. A single slow key-light drift (a 1 px/frame moving gradient mask over the phone/cards) is the premium version.

### 1.11 Vignette and letterboxing
- Vignette: one full-frame `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.35) 100%)` div — free. Or ffmpeg `vignette=PI/5` at encode. 8–15 % normally, ~20 % in hook/tension.
- Letterbox: film is 1920×1080 master; a 2.39:1 letterbox (1920×803 image, 138 px bars) is a strong "cinema" cue and reduces content area to fill. Do it in-page (two black bars) so type can sit *on* the bar line deliberately; or deliver true 16:9 and let the UI breathe. Recommendation: **16:9 for product shots, 2.39:1 bars only for hook + logo** is a cheap "chapter" device — but the bars must animate in/out once, not flicker per shot. Taste Low.

### 1.12 Kinetic type
- Word-by-word stagger (40–70 ms) of masked rises — GSAP `stagger` seeks fine. Split text into `<span>`s at build time (no SplitText plugin needed; write 20 lines of code).
- Large numerals/counters (e.g. "1 of 1 200 chosen"): compute the displayed value from `t` inside `seek` (`Math.floor(lerp)`), never from a tween's `onUpdate` that mutates state.
- Avoid letter-by-letter typewriter, slide-across, bounce. Taste Med.

### 1.13 Scrolling feed ("video-like" motion)
- Build the feed once (DOM, 2–3 screens tall), then `y = -f(t)` with an easing on a GSAP tween or a hand-written curve (`smoothstep` segments with holds). Deterministic, cheap.
- To fake "infinite", pre-build 3× the visible height from the seeded library; the film never scrolls more than that.
- Card content is static canvases → scrolling is a pure compositor transform.

### 1.14 Things that are **not** feasible / not worth it
- `requestAnimationFrame`-driven particle systems with state (non-seekable). Rewrite as closed-form positions `p(t)`.
- CSS `@keyframes` / `transition` on anything — not seekable by GSAP (`animations:'allow'` in the screenshot call does not seek them). Set `*{transition:none!important;animation:none!important}`.
- Full-frame `backdrop-filter`, full-frame SVG filters (`feGaussianBlur`, `feDisplacementMap` on 1080p) — 150–400 ms raster plus PNG penalty.
- WebGL at 1080p with heavy fragment shaders (software GL).
- `<video>` elements (none exist; and they would not seek frame-accurately).
- Any `Math.random()`, `Date.now()`, `performance.now()` inside draw code.

---

## 2. Deterministic-render contract (recommended)

This matches and tightens the existing `tools/render.js` contract.

```js
// src/index.html — contract
window.DURATION = 42;                       // seconds, authoritative
window.READY    = (async () => {
  await document.fonts.ready;               // all @font-face from src/fonts.css
  await buildAssets();                      // seeded card library, noise tiles, low-res bg canvas
  buildTimeline();                          // GSAP master timeline, paused
  window.seek(0);
})();
window.seek = function (t) {               // synchronous, idempotent, pure in t
  tl.seek(t, false);                        // false = do not fire callbacks
  drawBackground(t);                        // canvases redrawn from t, never from "previous frame"
  drawGrain(Math.floor(t * 24));            // grain cadence 24 fps, tile = idx % 8
  // nothing else: no counters, no accumulators, no RAF
};
```

Rules:
1. **GSAP**: `gsap.ticker.lagSmoothing(0)`; `gsap.globalTimeline.pause()`; master `gsap.timeline({paused:true})`. Build all tweens with absolute positions (`tl.fromTo(el, from, to, startTime)`), never relative labels that depend on build order side effects. Use `tl.seek(t, false)` so `onStart/onComplete` callbacks don't mutate state. Do not use `onUpdate` to write state used by other frames.
2. **Idempotency**: `seek(a); seek(b); seek(a)` must produce a pixel-identical frame to `seek(a)`. Test it (render frames 0..30 twice in different worker orders, `cmp` the PNGs). `fromTo` (not `to`) tweens everywhere so initial states are explicit; immediate-render pitfalls vanish.
3. **Seeded PRNG**: mulberry32 (already in `index.html`) or xorshift32 for bulk noise. One root seed → derived seeds per subsystem (`rng(SEED+1)` cards, `rng(SEED+2)` noise, ...). Never consume PRNG inside `seek`; consume only in `buildAssets()`. Anything that must vary per frame derives from `t` or `frameIndex` via a hash (`hash(frame)` → seed), not from a shared stream.
4. **Fonts**: `document.fonts.ready` resolves only for fonts *used* at load time; pre-touch every family/weight by rendering a hidden span per `@font-face`, or call `await Promise.all([...].map(f => document.fonts.load(f)))` explicitly (`document.fonts.load('300 120px Fraunces')`). `font-display: block`. Launch Chromium with `--font-render-hinting=none --disable-lcd-text` (already in render.js) so glyph raster is identical across workers.
5. **CSS**: global `*,*::before,*::after{transition:none!important;animation:none!important}`. No `:hover`. No `scroll-behavior:smooth`. No `<video>`, no `<img>` with remote URLs. Hide caret (`caret:'hide'` in screenshot already set).
6. **Canvases**: every canvas has a `draw(t)` that clears and redraws fully (`fillRect` the background, don't rely on previous frame). Trails/motion blur are simulated by drawing N sub-steps at `t - k·dt`, never by not clearing.
7. **Scrolling feed**: tween `translateY` of a `.feed` container on the master timeline (or compute `y(t)` in `seek`). Never use real `scrollTop` (sub-pixel scroll positions get snapped and screenshots can race).
8. **Time semantics**: frame `f` renders at `t = f / fps` exactly (render.js already does this). Audio hits are authored on the same grid (`hitTime = beatIndex * 60 / BPM`) and exported to a JSON `cues.json` that both `index.html` and the audio synth read → picture and sound share one source of truth.
9. **Workers**: each worker loads the page fresh and seeks its range; the warm-up double-seek in render.js stays (layout/fonts settle). Because all randomness is seeded at build, frame `f` is identical regardless of worker.
10. **Preview loop**: `--scale 0.5 --jpeg --fps 15` for iteration (≈ 4× faster), full `--fps 30` PNG/JPEG for master. `tools/sheet.sh` contact sheet for review.
11. **Swap-ready copy**: all on-screen strings live in one `COPY = { en:{...}, zh:{...} }` object; `?lang=zh` query selects the set and switches the display font to `Noto Sans SC` for CJK lines (same timeline).

---

## 3. Performance notes (headless Chromium, 1920×1080, 1 worker)

Measured baseline: 53 ms PNG / 26 ms JPEG for a gradient + one text line. Budget: **≤ 150 ms per frame per worker** → 1 260 frames (42 s) on 4 workers ≈ 50–60 s render. Everything in §1 marked Low/Med fits; the findings that matter:

| Cost driver | Measured | Mitigation |
|---|---|---|
| **PNG encode of high-entropy frames** (grain, big soft gradients, blurred layers) | 600–1 100 ms | JPEG q95 frames (`--jpeg`), or CDP `optimizeForSpeed:true` PNG (−75 %), or grain at ffmpeg stage. **Decision: JPEG q95 for the master** (x264 output is 4:2:0 anyway; verify no visible ringing on 1 px hairlines at q95 — bump to q97 if needed). |
| `backdrop-filter` | 62 ms per panel, +40 ms per extra, 170 ms full-frame | ≤ 2 panels; fake glass via pre-blurred bg copy. |
| Full-frame `filter: blur(≥60px)` | raster ≈ 35–45 ms (fine) but PNG +500 ms | Bake soft shapes into the low-res bg canvas instead. |
| SVG filters on large areas (`feTurbulence`, `feGaussianBlur`, `feDisplacementMap`) | 37 ms raster, 1 100 ms PNG | Avoid; canvas noise tiles. |
| WebGL (SwiftShader) | 40–250 ms+ depending on shader | Quarter-res canvas, or skip. |
| Canvas full-frame `ImageData` writes | 13–25 ms | Tiles/patterns (0.1 ms). |
| Canvas `filter='blur(40px)'` on 1080p | 28 ms | Low-res draw + upscale (0.6 ms). |
| Many large `box-shadow`s / `border-radius` + `overflow:hidden` + 3D | 12 big cards = 198 ms PNG / 31 ms JPEG | Shadow raster is cheap; PNG entropy again. |
| Text with `filter:blur` | ~10 ms per line | ≤ 2 lines blurred at once. |
| DOM size | — | Keep ≤ ~400 nodes on screen; `display:none` for off-shot scenes (not `opacity:0`, which still rasterizes). Toggle scene visibility from the timeline with `set()` calls. |

Other practical points:
- Screenshot `scale:'device'`, `deviceScaleFactor:1`; never let Chromium render at 2× then downscale.
- `--disable-gpu-vsync --disable-frame-rate-limit` already set; add `--enable-features=Vulkan`? No — SwiftShader is already Vulkan-backed; no GPU exists.
- Chromium default JPEG is 4:2:0 at q<100; coloured 1 px hairlines may soften. If a shot has fine coloured UI lines, render that range with PNG (`--start/--end` + PNG) and mix in the frame sequence (ffmpeg `image2` accepts mixed via concat list, or convert to PNG once).
- Memory: 4 contexts × 1080p is ~1.5 GB; fine on 15 GB.
- x264 encode settings for grain-bearing footage: `-crf 16 -preset slow -tune film -pix_fmt yuv420p -profile:v high -g 60 -movflags +faststart`; for a social delivery `-crf 20`. Do not use `-tune animation` (it smooths grain). Keep `-x264-params aq-mode=3:deblock=-1,-1` if grain looks mushy.
- Verify frame determinism: render frames 100–130 twice with different `--workers` and `cmp`; verify no dropped/duplicated frames with `ffprobe -count_frames`.

---

## 4. Audio synthesis notes (Node → WAV, no samples)

A proof-of-concept (`scratchpad/bench/synth.js`, 6 s, pad + sub + hats + riser + chime + feedback delay + Schroeder reverb) renders in **0.5 s** of CPU and measured −12.7 LUFS / −3.3 dBFS peak before normalization; the full 42 s cue will render in ~4 s. Everything below is plain float math at 48 kHz, written as 16-bit (or 24-bit) PCM WAV.

### 4.1 Building blocks
- **Oscillators**: phase accumulators (`ph += f/SR; ph -= (ph>1)`), `saw = 2*ph-1`, `tri = 4*|ph-0.5|-1`, `sin`. Band-limit cheaply by running the pad through the lowpass (aliasing is inaudible once fc < 3 kHz).
- **One-pole lowpass**: `a = 1 - exp(-2π fc / SR); y += a*(x - y)`. Stack two for 12 dB/oct. Sweep `fc` with an envelope for the "opening" feel.
- **Envelopes**: linear attack, exponential decay `exp(-t*k)`; ADSR for pad (A 2.5 s, R 3 s). Soft clip with `tanh` on the bus.
- **Pad**: 3 saws per note detuned ±8 cents (±0.4 semitone/8 ≈ 8 ¢), 4-note voicing (e.g. A2–E3–G3–B3: A minor 9 / or Cmaj7 + add9 for "warm premium"), LP from 400 Hz opening to ~2 kHz over the film, slow LFO on fc (0.7 Hz ±300 Hz), L/R using slightly different fc (1 : 1.03) for width. Triangle layer one octave up at −12 dB for air.
- **Sub bass**: sine at the root (A1 55 Hz / E1 41 Hz), 120 Hz LP, 10 ms attack, sidechain-style dip (−6 dB for 150 ms) on each hit so the mix breathes.
- **Soft hats / ticks**: white noise (seeded PRNG) → LP 8–10 kHz (or HP) → `exp(-t*60)` envelope, every 8th at 84 BPM, −20 dB, slight L/R alternation. "Paper ticks" for UI SFX: noise burst 20–40 ms through a 2–4 kHz band (LP minus LP).
- **Riser**: noise → LP whose `fc` sweeps `200 → 8 000 Hz` exponentially over 3 s, amplitude `u²`; optionally add a sine whose pitch rises an octave. Ends exactly on the reveal downbeat.
- **Chime / logo hit**: additive sines at `f·[1, 2.01, 3.0, 4.2, 5.4]` with decays `exp(-t·(2+2j))`, amplitude `1/(j+1)`, at E6/A5; layered with a 60–90 Hz "thump" (sine with pitch envelope 120 → 60 Hz over 80 ms, decay 300 ms).
- **Feedback delay**: ring buffer, 375 ms (dotted-8th at 80 BPM = 375 ms — tie delay to BPM), feedback 0.35, mix 0.25, with LP in the loop (one-pole 3 kHz) so repeats darken.
- **Schroeder reverb**: 4 parallel combs (1557/1617/1491/1422 samples scaled to SR, g = 0.84) → 2 series allpasses (225, 556; g = 0.7); pre-delay 20 ms; mix 0.25–0.35; LP the wet at 5 kHz. Good enough for pads/chimes; keep sub bass **dry**.
- **Stereo**: offset detune and filter between L/R; Haas 8–12 ms on hats; keep sub mono.

### 4.2 Structure for a 42 s cue (84 BPM, 1 beat = 0.714 s, 1 bar = 2.857 s)
| Time | Picture beat | Audio |
|---|---|---|
| 0–4 s | Hook | Sub drone + room-tone noise (−40 dB LP noise). No pad. |
| 4–9 s | Tension | Ticking hats accelerate (8th → 16th), filtered noise swells, pad enters very dark (fc 300 Hz). |
| 9–11 s | Turn | Full drop-out 0.7 s, then one soft chime. |
| 11.4 s | Reveal downbeat | Pad opens (fc jump to 1.2 kHz), sub lands on root, thump. |
| 11–26 s | Proof points | Pad chord changes every 2 bars; hits every 4 beats line up with cuts. |
| 26–35 s | Feature run | Add tri layer + hats 16ths, filter fully open; UI ticks on the 3–5 interactions. |
| 35–38 s | Human beat | Strip to pad + sub, LP back down. |
| 38–40 s | Logo | Riser into thump + chime at the frame the wordmark hits 90 %; delay tails. |
| 40–42 s | Tail | Silence except reverb tail; −∞ by 41.2 s. |

Export `cues.json` (`{bpm:84, hits:[11.4, 14.26, ...], logo:38.6}`) from one script so the GSAP timeline and the synth agree.

### 4.3 Loudness targets and verification
Targets: **−14 LUFS integrated**, **true peak ≤ −1 dBTP**, LRA 6–10 LU (a film should breathe; if LRA < 3 the arrangement is too static).

```bash
# measure
ffmpeg -hide_banner -nostats -i audio/cue.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|LRA:|Peak:"
ffmpeg -hide_banner -nostats -i audio/cue.wav -af astats=measure_overall=Peak_level+RMS_level:measure_perchannel=none -f null -
# two-pass loudnorm (pass 1 prints measured_* JSON; feed into pass 2)
ffmpeg -i audio/cue.wav -af loudnorm=I=-14:TP=-1:LRA=9:print_format=json -f null -
ffmpeg -i audio/cue.wav -af loudnorm=I=-14:TP=-1:LRA=9:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:offset=..:linear=true -ar 48000 audio/cue_norm.wav
```
Prefer getting the synth's own bus gain right (aim the raw render at about −16 LUFS with peaks around −3 dBFS) and let `loudnorm linear=true` make the final small correction, so the dynamics are ours rather than the normalizer's. Mux: `-c:a aac -b:a 256k` (or `-c:a libopus` for a web variant). Re-measure the muxed MP4 (`-map 0:a`) — AAC can add ~0.3 dB overshoot, hence the −1 dBTP ceiling.

---

## 5. Font candidates (Google Fonts, OFL, variable preferred)

Raw URL pattern (verified with HTTP 206 range probes on 2026-10-01; bracketed variable names must be URL-encoded `[`→`%5B`, `,`→`%2C`, `]`→`%5D`):
`https://raw.githubusercontent.com/google/fonts/main/ofl/<family-lowercase-nospaces>/<File>.ttf`

All of these are already downloaded into `/home/user/ComposeMovieDemo/promo-video/fonts/` and declared in `src/fonts.css`.

| Role | Family | File (under `ofl/<family>/`) | Why |
|---|---|---|---|
| Display serif ★ | **Fraunces** | `fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf` + `Fraunces-Italic%5B...%5D.ttf` | opsz + wght + SOFT axes; at opsz 144 / wght 300 it reads like an editorial Didone; variable weight animation possible. |
| Display serif (alt, lighter) | **Instrument Serif** | `instrumentserif/InstrumentSerif-Regular.ttf`, `-Italic.ttf` | Static, but the italic is the most "fashion-film" face on Google Fonts. |
| Display serif (alt, classic) | **Cormorant Garamond** | `cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf` | Luxury-house feel at large sizes; too thin below 40 px. |
| Text/UI grotesk ★ | **Inter** | `inter/Inter%5Bopsz%2Cwght%5D.ttf` | The default UI face; opsz axis makes 20 px captions crisp. |
| Grotesk (alt, warmer) | **Geist** | `geist/Geist%5Bwght%5D.ttf` | Linear/Vercel look; pairs with Fraunces well. |
| Grotesk (alt, rounder) | **Manrope** | `manrope/Manrope%5Bwght%5D.ttf` | Friendlier, XHS-adjacent warmth. |
| Mono (tiny labels) | **Geist Mono** | `geistmono/GeistMono%5Bwght%5D.ttf` | "v1.0 · 2026" labels; or `jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf`. |
| CJK (zh swap) | **Noto Sans SC** | `notosanssc/NotoSansSC%5Bwght%5D.ttf` | Variable weight; use wght 300–400 for display, 400–500 for captions. (For a serif zh display, `notoserifsc/NotoSerifSC%5Bwght%5D.ttf` is the only OFL option; ~10 MB.) |

Rule from the craft guide: exactly two families on screen (serif display + grotesk), mono optional for one label. Recommended pairing: **Fraunces (opsz 144, wght 300–400, tracking −1.5 %) + Inter (wght 450–500, tracking +3 % on caps labels)**; swap Inter → Geist if the film ends up "studio-dark".
