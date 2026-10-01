# Tipmi launch film — changelog

## 2026-10-01 — final pass: variant b promoted to `src/`

Planner decision: variant b is the film (judges a = 72, b = 90). This pass promotes it and applies the MUST FIX list.

### Promotion
- Copied `src_b/` into `src/` (index.html, styles.css, constants.js, gen/, scenes/, debug/, tools/, BUILD_NOTES.md).
  `src/cues.js` and `src/fonts.css` kept unchanged (cues.js md5 60d2e684… verified before and after).
- `index.html` loads `cues.js` and `fonts.css` from its own directory (`<script src="cues.js">`, `href="fonts.css"`);
  title no longer says "variant b".
- `src/tools/*.js` and `BUILD_NOTES.md` repointed from `src_b/`, `frames_b/` and `out/b/` to `src/`, `frames/` and `out/`.

### Hook wall (4–8 s) — "the same work, unseen", legible at 50 %
- `gen/cards.js` `dimThumb()`: replaced the highlight-compression curve (it lifted mids and capped highlights, so every
  cell went the same grey) with luminance `0.38·y^0.82` (slight mid-tone lift), saturation −60 %, linear highlights.
  Bottles, drapery, posters ("Tide", "07", "II", "stillness"), etchings and the Swiss arcs now read at 960×540 while the
  wall stays clearly dimmed. The hero cell is still the only warm one.
- `gen/wall.js`: per-depth-group alpha 0.82/0.92/1.0 → 0.90/0.96/1.0.
- `gen/wall.js`: the copy burn was a 760 px radial over the left two-thirds of the wall. It is now an ellipse hugging
  the display box (centre 560,268; 640×269 px), and it releases over 5.4–5.9 s once L2 has left, so the shot-3 rush
  fills the frame. Bone-on-wall contrast around L2 is 13.9–15.5:1 (≥ 12:1 required).
- Compared with variant a's hook (`src_a/gen/cards.js` `thumb()`, linear ×0.35): a's per-cell contrast was the better
  idea and was adopted. b's library, layout, depth groups and freeze were kept. No code was copied from src_a.

### Hero plate resolution (BUILD_NOTES known issue)
- `gen/cards.js` hero spec `ss: 1.5 → 1`: the hero still life is ray-traced at its native 540×720 instead of 360×480
  ×1.5. Bottle-neck, jar-rim and cup silhouettes are crisp at the studio (510×680) and print sizes. READY +0.5 s per page;
  no per-frame cost.

### Audio
- Previews mux `audio/track.wav` (`tools/encode.sh frames out/preview.mp4 audio/track.wav 30 20`). Muxed AAC: −14.0 LUFS,
  −1.6 dBFS peak, LRA 8.2, flat 0, peak count 2, no silence > 1.5 s; streams both start at 0.000, 42.500 s, 1 275 frames.
- `node audio/verify_cues.js`: 22/22 pass. Ticks 13.357 / 18.300 / 24.286 / 28.929, ratchet 26.429 + k·0.06, thumps and the
  logo chime all land within 4 ms. Picture events read the same CUES: dot sets f401, wall dots from f549, tap f729,
  press f868, detents f793/795/797/798/800/802/804 (picture−sound offsets −9…+18 ms), wordmark ≥ 90 % by f1157.

### Verification tools (new, `src/tools/`)
- `accept.js`: a per-frame DOM probe (all 1 275 frames). It lists visible display lines, the extents of every visible
  text glyph (clipped by masks and the screen clip-path) and mount/phone rects. Results: each line is visible only
  inside its CUES window (L1 f15–77 … L9 f1038–1108); 0 frames show two display lines; text stays ≥ 82 px from every
  edge in every resting frame. The one exception is a caption in flight at f605 (15 px, during the 700 ms column fly).
- `dwell.js`: legible dwell per line. Perceptual criterion (opacity ≥ 0.9, ≤ 5 % of the rise left):
  L1 1.63, L2 1.83, L3 1.00, L4 2.67, L5 1.70, L6 1.70, L7 1.83, L8 1.83, L9 1.77 s; all meet the brief except L9 at
  1.77 vs 1.8, which is one frame short.
  The strict criterion (97 %/3 %) gives L3 0.90 and L9 1.63. The brief's dwell column assumes exits after the out cue,
  but §8 #5 requires exits to finish on it, so the windows in cues.js cap the dwell.

### Checked on full-res frames (§8)
- #1 1 275 frames / 42.5 s; f1259 is the end card, f1260 and f1274 are black (mean 0).
- #4 plates, mats and the phone are inside the frame; the phone shadow falls to 0 by y ≈ 1068 (row profile under the phone).
  Out-of-frame mounts are only the feed plates inside the screen clip (f605–760) and the hook wall.
- #6 at 50 % the dots are identifiable on f400, f560 and f1000.
- #7 the oxblood frame draws clockwise f386–f400 and the dot sets at f401; wall dots start in reading order f549–f568 (90 ms stagger) and are all set by f572.
- #14 detents verified on frames (see above). #15 the wordmark resolves by f1154 (≥ 90 % at f1157) and the second
  tittle arrives around f1160. The card is dot-wordmark + tagline + hairline + CTA, static f1208–1259 (text extents move ≤ 1 px, the 1 % push-in),
  light and grain.
- #20 `idem.js` all 11 pairs identical. `sweep.js 3 60 262` 0/68 history-dependent. Hook frames f60–131: 1 worker vs
  2 workers byte-identical (0/72 differ). ms/frame (1 worker, full res): hook 0–8.6 s 105 (incl. ~4.8 s READY),
  20–26 s 126, 37–40 s 123. Full film at 2 workers: 59 ms/frame throughput.

### Left as is (justified in BUILD_NOTES "Known issues")
- The end card is left-weighted (brief-fixed x = 173 column; nothing else allowed on the card).
- The window light is a normal-blend 7.5 % layer rather than soft-light: soft-light on near-white paper is invisible
  after x264, and the rotated soft-light layer cost 36 ms/frame.
- Bezel ring at JPEG q90: not applicable, frames are q95.
- `render.js --scale 0.5` still writes 1920×1080 JPEGs (CDP capture ignores deviceScaleFactor), so preview.mp4 is
  full size. tools/ were not edited.

## 2026-10-01 — review round 2: the column fly, the device rest, the chrome dissolve

### Majors
- **Wall captions in two greys (17.3–20.1 s).** Root cause: not the scale transform. The paper vignette was a
  normal-blend paper-tone layer *above* plates and type, so it lifted the ink near the frame corners; the two corner
  captions (Jun Park bottom-left, Tomas Reyes bottom-right) measured darkest-20 mean 73.6 / 67.5 vs 54 for the rest.
  `#vignette` now sits under `#world`/`#type` (a tint of the field only). Captions and dots were also taken out of the
  scaled `.group`s into an untransformed `#capLayer` (positions follow the group scale, glyphs never do), as the review
  asked. `accept.js caps`: all eight within 0.3 levels on f530–f600 with the window-light overlay off (it lifts ink by
  design); as rendered 53–61 while the band crosses.
- **Column fly (20.0–21.0 s), both reviews.** The hero is now the only plate in flight. On the bar it flies into the
  screen (700 ms expo-out) and lands fully inside it (mat top 446, caption bottom 980, 100 px from the frame edge). The
  seven other wall plates dissolve where they hang (140 ms, 20 ms stagger, nearest to the hero's path first); every
  caption and dot fades in the first 100 ms. The plate above the hero (Elin Sato, now landscape, so hero and slot
  both fit) fades into its feed slot at 20.72, after the header is opaque. The other five re-mount below the fold
  when the screen clip is tight at 21.0, and the scroll brings them up. The hero and Elin captions masked-rise back at
  20.72 / 20.86. No path crosses another, no text overlaps text, the header never fades in over a plate. (A first
  attempt flew Elin too; the header fading in over its top read as a ghost box, so it was dropped.)
- **Device rest (22.9–25.0 s).** Captions fade at a scroll edge (18 px ramp above the header rule) instead of being
  sliced by it. The drift is 36 px/s (was 40), and the hero mat sits 8 px under the rule on the tap. Together these
  land the plate above the hero exactly under the header when the rest begins: no sliver, no half caption.
- **Chrome dissolve (25.0–25.4 s).** From 25.0 the feed (`#col`) is clipped to the area under the header (plain rect,
  phone flat), so nothing that scrolled under the header shows through it as it fades: no grey block, no ghost
  caption. The other feed plates and their captions go in 143 ms (gone when the hero moves at 25.143), the header and
  status strip in 200 ms, the bezel, shadow and glare in 400 ms. The hero's feed cell is the carrier's own rect.
  f754–f762 show paper, the fading bezel and one plate.

### Minors
- Warmth dial: ticks 10 px on the half-pixel grid (crisp 1 px `--rule`), oxblood active tick 2 × 12 px, needle 1.5 px,
  4 px hub.
- Wordmark tittles 2 px higher; a measured clearance nudge against the preceding glyph moves the first tittle 1.25 px
  right (≈ 4 px clear of the T serif on the rendered frame).
- Wordmark blur-in reaches 90 % on the 38.571 hit (it was ≈ 38.2), so the dotless "Tipmı" is only legible for about
  3 frames before the second tittle lands on its chime at 38.661 (was about 17 frames).
- L3 exit 300 ms (dwell 1.00 → 1.03 s). L9 keeps the brief's slow 450 ms exit.
- f257/f258, accent budget, ms/frame and the `--scale` caveat are documented in BUILD_NOTES ("Review round 2 notes").

### Determinism
- The dissolving plates fade without shrinking. The gallery shadow fades by alpha only (fixed offsets and blur), because
  a blur radius that changes every frame rasterised history-dependently at f602/f605.
- `sweep.js`: 0 history-dependent frames over f515–800 (step 2), f598–640 (step 1), f770–880, f1110–1200 and the
  hook f60–262. `idem.js`: all 11 pairs identical. Master (2 workers) vs 1-worker spot renders: byte-identical on
  f510–778 and f1110–1274.

### Verification
- `accept.js` (all 1 275 frames): 0 frames with two display lines, **0 frames with overlapping text** (new check),
  text ≥ 82 px from every edge, **0 plates outside 0..1040 in f600–630 / f750–770** (new check).
- 1-worker full-res ms/frame: 17–26 s 116, 37–42.5 s 100 (both include ≈ 5 s start-up). Full film at 0.5 scale,
  2 workers: 79 s / 1 275 frames. `out/preview.mp4`: 1 275 frames, 42.5 s, with `audio/track.wav`. Sheets rebuilt:
  `out/review`, `out/review_hook`.

## 2026-10-01 — review round 3: last polish before the master

### Major
- **Chrome dissolve z-order (f755–f761).** The fading bezel (`#device`), the phone shadow and the AO were painted over the
  carried hero plate once it grew past the phone rect (the grey ring crossed the plate, the mat and the caption). From
  the swap at 25.143 to the logo the carrier now has `z-index: 1`, and `#world` is a stacking context (`z-index: 0`) so
  the plate never rises above `#type`, the light band or the grain. The bezel ring itself fades in 300 ms (header 200 ms,
  shadow/glare 400 ms), so where the caption's transparent box crosses the ring's right side (from 25.233) the ring is
  ≤ 12 % and going. New check `node src/tools/accept.js bezel [f0] [f1]`: renders each frame with and without the phone
  chrome; f755–f762: 0 differing pixels in the mount and dot, max 24 levels behind the caption text on f757, ≤ 7 after.

### Minors
- **Elin Sato plate (20.72).** Mat + hairline + plate arrive together in 120 ms expo-out with a 6 px upward settle
  (was a 300 ms opacity ramp that read as a grey placeholder): ≈ 60 % with its mat edge on the first frame (f622),
  settled on f623.
- **Wall plates leaving (20.00–20.14).** Each of the seven dissolving plates drifts 10 px toward the phone (1180, 540),
  front-loaded over its 140 ms fade (no scale, no caption). Their exits point at the column; no path crosses.
- **Hero dot through the fly (20.0–20.72).** The hero's chosen dot stays on the work: it rides the mat through the fly
  (its offset blends continuously from the wall slot to the feed slot) and never fades; only the caption goes and
  masked-rises back at 20.72.
- **Second tittle.** Its 90 ms fade (cubic-out) starts on the 38.571 hit and is complete on the E6 chime at 38.661
  (≈ 70 % on f1158). The sharp word reads "Tipmı" only on f1156–f1157.
- **The fall (2.357–2.857)** lands on the bar by design; documented in BUILD_NOTES ("Review round 3 notes").
- **L3 / L9 dwell, f257/f258, accent budget, ms/frame:** no change; numbers in BUILD_NOTES.

### Determinism
- The first full-film sweep (`sweep.js 2 0 1274`) found a pre-existing history dependence on f1055–f1092 (≤ 2 levels in
  two 8×8 JPEG blocks): the window-light overlay `#bandOv` moved by a fractional `translateX`. It is now positioned by
  `left` in whole px. After the fix: **0 / 638** history-dependent frames over the whole film (step 2), 0 on f596–640,
  f740–790, f1110–1170 (step 1); `idem.js` all 11 pairs identical.

### Verification
- `accept.js` (all 1 275 frames): 0 frames with two display lines, 0 overlapping text, text ≥ 82 px from every edge,
  0 plates outside 0..1040 in f600–630 / f750–770. `dwell.js` unchanged (L3 0.90 s, L9 1.63 s strict).
- 1-worker full-res ms/frame as reported (incl. start-up): 0–3.2 s 127 (≈ 75 steady), 19.8–26 s 131, 37–42.5 s 111.
  Full film at 0.5 scale, 2 workers: 81 s / 1 275 frames (64 ms/frame throughput). No page or console errors.
- `out/preview.mp4`: 1 275 frames, 42.5 s, 1920×1080, with `audio/track.wav`. Sheets rebuilt: `out/review`,
  `out/review_hook`.
