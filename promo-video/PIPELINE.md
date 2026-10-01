# Promo video pipeline — contract for everyone who touches `src/` or `audio/`

Everything is generated from code; the final MP4 is `out/final.mp4` (1920x1080, 30 fps, H.264 + AAC).

## Layout

```
promo-video/
  brief/            research + CREATIVE_BRIEF.md (the spec; read it first)
  fonts/            local Google Fonts (OFL), declared in src/fonts.css — use these families only
  src/index.html    THE film. Builds a paused GSAP master timeline; exposes the render contract below
  src/styles.css    design tokens + components (optional split; index.html may inline)
  src/scenes/*.js   one module per scene (optional split)
  src/gen/*.js      generative art (canvas) helpers (optional split)
  audio/engine.js   deterministic offline synth (oscillators, ADSR, biquad, reverb, delay, limiter, WAV writer)
  audio/track.js    the soundtrack composition  ->  node audio/track.js  ->  audio/track.wav
  tools/render.js   frames renderer (Playwright/CDP)
  tools/encode.sh   frames (+wav) -> mp4
  tools/sheet.sh    contact sheet + keyframes for review
  tools/audio-check.sh  loudness / clipping / silence report
  frames/           scratch frames (gitignored)
  out/              mp4s, review sheets
```

## Render contract (hard rule: every frame is a pure function of `t`)

`src/index.html` must define, on `window`:

| name | meaning |
|---|---|
| `DURATION` | total seconds (number) |
| `READY` | Promise resolved after `document.fonts.ready` and after the timeline is built |
| `seek(t)` | synchronously puts the page in the exact state for time `t`: `tl.seek(t, false)` on the paused GSAP master timeline **and** redraws every canvas from `t` |

Rules:
- `gsap.ticker.lagSmoothing(0)`; master timeline `gsap.timeline({ paused: true })`; never `tl.play()`.
- No CSS `transition`/`animation`, no `requestAnimationFrame`, no `setTimeout`-driven state, no `Date.now()`/`performance.now()`/`Math.random()` in rendering. Use the seeded PRNG (`mulberry32`) with fixed seeds for any randomness, generated once at build time.
- Canvases: draw as `draw(ctx, t)`; keep them inside `seek(t)`. Canvas is 2D software rendered — big per-frame radial gradients and `filter` on canvas are expensive; precompute static textures (grain tiles, gradients) once into offscreen canvases and composite them.
- Performance budget: `< 150 ms/frame` at 1920x1080 (check with `node tools/render.js --end 3`); avoid `backdrop-filter`, big `filter: blur()` on large layers every frame, and SVG filters over large areas. Blur-in text is fine (small elements, short windows).
- Safe margins: keep text ≥ 80 px from the frame edge. Stage is fixed 1920x1080, `overflow: hidden`.
- Fonts: only families from `src/fonts.css` (local, OFL). No web requests at all (the sandbox blocks them). Pre-load every family/weight you use with `document.fonts.load('300 120px Fraunces')` before resolving READY.
- Global CSS: `*,*::before,*::after{transition:none!important;animation:none!important}`; hide off-shot scenes with `display:none` via timeline `set()` calls (opacity:0 still rasterizes).
- Timing source of truth: `src/cues.json` (bpm, hit times, scene in/out). Both index.html and audio/track.js read it.
- See `brief/03_feasibility.md` for measured costs and recipes (grain tiles, low-res aurora canvas, fake glass, phone mockup, card library).

## Commands

```bash
# quick preview (960x540 jpeg frames, ~35 ms/frame) + mp4 + contact sheet
node tools/render.js --scale 0.5 --jpeg --frames frames_prev && tools/encode.sh frames_prev out/preview.mp4 audio/track.wav 30 20 && tools/sheet.sh frames_prev out/review_prev 30 1 6
# render a time window only
node tools/render.js --start 12 --end 18 --frames frames_win
# full quality master: JPEG q95 frames (PNG of grainy frames costs 10x more to encode and gains nothing after x264 4:2:0)
node tools/render.js --jpeg --quality 95 && tools/encode.sh frames out/final.mp4 audio/track.wav 30 17 && tools/sheet.sh frames out/review 30 1 6
# audio
node audio/track.js && tools/audio-check.sh audio/track.wav
```

`tools/sheet.sh FRAMES OUT FPS EVERY COLS` writes `OUT/sheet.png` (one tile per EVERY seconds, time-stamped) and `OUT/key_<t>s.png` full-res frames — reviewers Read those images.

## Audio contract

- `audio/track.js` uses `audio/engine.js` and writes `audio/track.wav` (48 kHz, 24-bit stereo) with length == `DURATION` exactly (the encoder uses `-shortest`).
- Targets: integrated loudness −16 … −14 LUFS, true peak ≤ −1 dBTP, no flat/clipped samples, no gaps > 1.5 s of silence except an intentional one, clean 0.5–1 s fade at the end.
- Hits must land on the storyboard timecodes (logo reveal, cuts); the brief lists them.
