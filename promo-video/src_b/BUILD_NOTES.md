# Tipmi launch film — variant b — build notes

The film is the brief's structure, copy, timecodes, cues, palette and type families, executed by an art director.
Picture runs 0–42.000 s, then a hard cut to black until 42.500 s: 1 275 frames at 30 fps (planner override).
Timing comes only from `../src/cues.js`, which is unedited and loaded by `<script>`.

## How to run (from `promo-video/`)

```bash
# master (what is in out/b/): JPEG q95 frames -> frames_b/, mp4 without audio, review sheets
node tools/render.js --page src_b/index.html --frames frames_b --jpeg --quality 95 --workers 2
tools/encode.sh frames_b out/b/full.mp4 none 30 17
tools/sheet.sh frames_b out/b/review 30 1 6
src_b/tools/sheet_win.sh frames_b out/b/review_hook 30 0.25 6 0 8.75     # hook only (see "tool notes")
# quick preview
node tools/render.js --page src_b/index.html --frames frames_b --jpeg --scale 0.5 --workers 2
# zh copy (same timeline): --page "src_b/index.html?lang=zh"
# library contact sheet (all 24 plates full size + wall thumbs + dissolve keyframes + warmth grades)
node src_b/tools/snap.js src_b/debug/library.html out/b/library.png 1920 1080
# determinism checks
node src_b/tools/idem.js          # seek(a); seek(b); seek(a) == seek(a), 11 pairs across scene boundaries
node src_b/tools/sweep.js 2       # every 2nd frame: sequential render vs render right after a far jump
```

Outputs: `out/b/full.mp4` (1920×1080, 30 fps, 1 275 frames, 42.5 s, no audio), `out/b/review/sheet.png` + `key_*.jpg`
(every second), `out/b/review_hook/sheet.png` (0–8.75 s every 0.25 s), `out/b/library.png`, `out/b/preview.mp4`.
`frames_b/` is left in place.

## What was built

| File | Role |
|---|---|
| `index.html` | stage, render contract (`DURATION = CUES.duration = 42.5`, `READY`, `seek(t)`), film-grade overlays |
| `styles.css` | tokens from brief §3 plus components; global `transition/animation: none` |
| `constants.js` | `BRAND_NAME`, `TAGLINE`, `CTA`, hero/supporter/edition/count constants, `COPY.en/zh`, `CAPTIONS`, `SEED` |
| `gen/util.js` | mulberry32, xorshift32, integer hash, CSS-exact cubic-bezier easings, pure keyframe `track()` |
| `gen/stilllife.js` | **new:** a small analytic ray tracer that renders the still-life plates (see deviations) |
| `gen/cards.js` | the 24-plate library, `grade()`, 7 warmth grades, 16 dissolve keyframes, dim wall thumbs |
| `gen/grain.js` | 8 seeded 512² grain tiles (24 fps cadence) and the static paper tooth |
| `gen/light.js` | ink/paper field, window-light band path per shot |
| `gen/wall.js` | the whole hook (developing plate, fall, 216-cell wall, rush, freeze) on one canvas |
| `gen/wordmark.js` | wordmark builder: any `BRAND_NAME`, dotless i/j, tittles measured from the font |
| `scenes/type.js` | L1–L9 (masked rise / blur-in) |
| `scenes/carrier.js` | the hero plate as one mounted object: reveal → wall → (phone) → studio → lift → print |
| `scenes/feed.js` | top bar, wall of 8, fly into the column, phone drawn + thickened, dolly, chrome dissolve |
| `scenes/studio.js` | instrument panel, 7-detent Warmth ratchet, long-press Publish, panel drop |
| `scenes/ledger.js` | oxblood rule + three typeset rows |
| `scenes/logo.js` | the dot's flight into the tittle, wordmark, tagline (Chosen 400 → 600), hairline, CTA |

Architecture: one paused GSAP master timeline (`gsap.timeline({paused:true})`, `lagSmoothing(0)`, global timeline
paused). All discrete moves are absolute `fromTo` tweens on plain proxy objects (`immediateRender:false`), and the
timeline is primed once to the end and back. Continuous moves (carrier rects, push-ins, light, scroll, wall, grain)
are pure keyframe functions of `t`. `seek(t)` = `tl.seek(t,false)`, then every scene's `update(t)` writes styles,
then the canvases redraw from `t`. Randomness comes only from seeded PRNGs inside `READY`; per-frame variation
uses `hash(cell, floor(t·rate))`.

## Deviations from the brief (and why)

**Art direction (licence given for variant b)**

1. **The plates are rendered photographs, not radial-gradient blobs.** 4 of the 10 light studies are still lifes from
   a small analytic ray tracer (`gen/stilllife.js`): Morandi-style ceramic vessels on a table against a plaster wall,
   lit by late sun through a two-pane window (soft penumbra and window mask), cool room ambient with ambient
   occlusion, warm table bounce, glaze highlight, filmic tone curve, then `grade()` and baked film grain.
   The rest of the photographic family is 2 drapery height-fields (velvet, silk with self-shadowing), 1 folded-paper
   photograph and 3 Sugimoto-style seascapes with the horizon at centre. The hero, "Mara Lindqvist — Still life, 03",
   is a still life that keeps the brief's palette: deep clay wall in shadow rising to bone in the window light,
   slate cup and shadow lower-left, oxblood-safe saturation. Reason: blobs read as wallpaper; a still life reads as a
   photograph someone spent hours on, which is the film's first line. The other families follow the brief:
   6 flow-field etchings (3 ink on bone/stone, 3 bone on slate), 5 Fraunces Italic posters (NORTH, II, Tide,
   stillness, 07; one on oxblood-black), 3 Swiss geometric. Pale plates: 2 of 24.
2. **Library cull.** After the first contact sheet I re-made the weakest plates: the folded paper (a blank beige card
   → an accordion-fold photograph), the slate silk (rubbery blobs → drapery), the NORTH, stillness and 07 posters
   (word collided with the small caption), Mass & void (caption on the clay square), and the dissolve (blotchy and
   digital → soft chemical development).
3. **The hook develops highlights first.** On an ink field a darks-first threshold stays invisible for half the
   development and frame 0 was black. Light now arrives first, and frame 0 already shows the bottle glowing out of
   the dark (16 keyframes, resolved by 1.4 s).
4. **Burned corner behind the hook copy.** A soft radial darkening sits behind "Seconds to vanish." over the wall.
   Reason: keep bone-on-wall at or above 12:1, as a printer would dodge and burn.
5. **Wall thumbnails are highlight-compressed** (plus the brief's luminance ×0.36 and saturation −60 %), so the bone
   posters sit back with the photographs instead of reading as typographic noise.
6. **Wall composition re-laid out** on a 4-column grid: copy and a hairline rule over two left columns, the hero
   largest in column 3, a tall etching in column 4, eight works in total, every caption fully legible, every glyph
   at least 80 px from the bottom. The brief's coordinates put captions at about 1 010 px (inside the safe margin)
   and left the lower right empty.
7. **Light behaviour.** The brief's 1.5 px/frame band cannot cross a plate within a 2.86 s shot and contradicts its
   own crossing windows. The band now has a per-shot path (constant speed, faded ends, crossing the subject in the
   brief's windows) and a soft two-pane profile with a faint mullion gap. A soft-light layer is almost invisible on
   #F4F1EB paper, so the band is painted *into* the paper field (+2–3 %), and a 7.5 % normal-blend layer carries it
   over plates and type. The rotated soft-light version cost 36 ms/frame.
8. **Grain** uses "bipolar alpha" tiles composited normally (additive noise strongest in the mids), at half
   resolution and upscaled (a softer, 2 px filmic grain at 15 ms instead of 28 ms). Soft-light grain is invisible on
   both near-white paper and near-black ink. The brief's 4 % and 5 % are kept as layer opacities; measured std-dev is
   2.4 levels on paper and 2.5 on ink.
9. **Publish long-press: the oxblood stroke draws around the PUBLISH button** (2.5 px, clockwise) instead of an
   r32 circle centred on a 200×48 button, which would cross the label. It is the same gesture as the chosen frame
   and the bezel draw.
10. **Chosen frame recedes.** The 2 px oxblood frame draws (12.857–13.357), holds, then fades out (14.15–14.65); the
    dot carries the meaning afterwards. Reason: an accent as a gesture, not a selected state.
11. **Phone.** The column flies in under a clip that closes 20.15–21.0 (camera ease), so the plates are seen
    converging rather than cut. The 1 px line draws along the outer 434×910 r64 edge and thickens inward to the
    12 px bezel (inner radius 52 = the screen). The bezel is drawn as a canvas bitmap (see determinism). The dolly
    reaches 7°/3° by 24.143, the tap is at 24.286, and the phone is flat again by 24.857 (the brief overlaps the
    tilt-up and the return). Phone shadow is `0 30px 64px` instead of `0 48px 96px` so that it stays mostly in frame.
    The AO ellipse is slightly darker than #EAE6DE (that tone is invisible on paper).
12. **Feed scroll target:** the hero's mount is 223 px from the screen top at the tap (the brief's 420 px left it
    mid-screen). The scroll is 20.7–21.6, hold 0.4 s, then 22.0–22.857, then 40 px/s until the tap stops it.
13. **Print** mat is 40 px on three sides and 80 px at the foot (a real print margin), 560×760 as specified, −1.5°.
    The lift is ×1.05 / −24 px at 30.143, settling by 30.9, with the shadow deepening while lifted.
14. **Studio panel rises (24 px, fade) without the 94 → 100 % scale** and the dots "set" 94 → 100 % through their
    size rather than a transform scale; the blur-ins scale 1.03 → 1 through font-size on a clone. See determinism.
15. **Detent frames** are taken verbatim from acceptance check #14 (793, 795, 797, 798, 800, 802, 804). The needle
    reaches about 97 % of each 15° step on the detent frame. Note that 26.429 + 2·0.060 rounds to f796, not f797;
    the check's list was followed.

**Brief inconsistencies resolved**

16. **`--muted` #8A867E → #6E6A63.** The brief's own grey measures 3.2:1 on paper and fails its 4.5:1 check (#6);
    the new value measures 4.8:1.
17. **Top bar at baseline ≈112 px, rule at 136** (brief: y = 64), so that its glyphs respect the 80 px text margin.
18. **Duration 42.5 s / 1 275 frames** (planner override of 43 s / 1 290).
19. **Accent budget (#8):** "≤ 5 % of frames" cannot coexist with "the dot stays with the work through studio and
    ledger". The dot is present from 13.357 s to the end (about 70 % of frames) at ≤ 0.03 % of pixels. Transient
    oxblood (frame draw, dial tick, publish stroke, ledger rule, tittles) stays under 0.5 % of any frame.
20. **Zh copy:** L4/L9 split as 只看 / 值得看的。 and 献给 / 创作的人。; maker names stay Latin.

## Determinism (hard rule) — what it took

`seek(a); seek(b); seek(a)` is pixel-identical (`tools/idem.js`, 11 pairs). The harder test is a frame rendered
sequentially vs the same frame rendered right after a jump (`tools/sweep.js`); it found history dependence inside
Chromium's raster and compositor, not in my state. Fixes, each verified:

- **Hero warmth index** is a pure function `TB.detents(t)`; it was read from a value another scene wrote later in the
  same seek, which made it one seek stale after a jump.
- **Text that moves** (word rises, line exits, caption/ledger/tagline rises) moves through layout offsets (`top`),
  not transforms. A transformed text box keeps a history-dependent raster translation.
- **Blur-ins (L4, wordmark)** run on a clone shown only during the 550 ms entry. The resting element is never
  filtered or transformed: a once-scaled element keeps a stale-scale raster, softer text, and is history-dependent.
- **Rounded shapes under the 3D dolly:** the bezel and the dial are canvas bitmaps. The screen clip becomes
  rectangular once the 12 px bezel covers the corner wedges, and the header paper gets its own rounded top.
  Skia path AA and rounded masks re-rastered under partial invalidation differed by up to 12 levels at the corners.
- **Device layer:** a full repaint every frame (frame-parity toggle of an invisible background) removes
  partial-raster reuse. The phone's drop shadow moves by layout.
- **Caption font sizes** step 22 ↔ 21 px at the midpoint of a move instead of interpolating (fractional glyph rasters
  are cache-dependent).

Results: sweep every 2nd frame of the film — **0 / 638** history-dependent frames. `render.js` 1 worker vs 4 workers
on 2–4.4 s (f60–131), 20–26 s and 37–40 s at full resolution — **342 / 342 frames byte-identical**. Zero
`pageerror` or console errors; no network requests (the snapshot tool logs any non-file request: none).

## Measured cost (1920×1080, JPEG q95)

| Measure | ms/frame |
|---|---|
| `render.js` 1 worker, 2–4.4 s (hook wall) | 139 (includes ~4 s page build over 72 frames) |
| `render.js` 1 worker, 20–26 s (column → phone → dolly) | 122 |
| `render.js` 1 worker, 37–40 s (logo) | 118 |
| `render.js` 4 workers, same windows | 129 / 86 / 117 |
| Steady-state per frame (`tools/prof.js`): reveal 15 s / phone 23.5 s | ≈ 86 / ≈ 105 |
| Full master, 2 workers (throughput) | 61 |

READY builds the library in ~3.8 s per page; the hero still life is 0.9 s of it. Plates seen only as 30×40 wall
thumbnails are rendered at ⅓ size.

## Acceptance criteria checked on frames (§8)

- **#1:** 1 275 frames, 42.5 s; f1259 is the card, f1260 is black (mean 0.0).
- **#2/#3:** display at x = 173, every text glyph ≥ 80 px from the edges (lowest caption ≈ 992 px), L4/L9 on exactly
  two lines inside 900 px.
- **#5:** lines visible only in their windows; exits end on the out time; no overlaps except the end card.
- **#6:** contrast as computed (ink 16.5:1, ink-soft 10.4:1, muted 4.8:1, bone on ink 16:1 with the burned corner on
  the wall).
- **#7:** frame draws f386–401, dot sets f401; wall dots in reading order f549–f569.
- **#9:** the carrier is identifiable in every listed frame.
- **#10:** phone text crisp, max 7°, flat from f746.
- **#11/#12:** grain at 24 fps, freeze f236–257 dead still including grain; rests as designed.
- **#13:** grain std 2.4 (paper), 2.5 (ink).
- **#14:** detents verified on frames.
- **#15:** wordmark complete by 38.55 s; card static except push-in and light from f1208.
- **#16:** hard cuts at f257 and f1114 on bars.
- **#20:** see above.
- **Not in this stage:** audio (#17–19); there is no `audio/track.js` for variant b yet. #8 is noted above.

Craft checklist (§7) self-score: 14 / 15. Silence and the logo sound are designed on the cue grid but not yet
synthesised.

## Known issues

- No soundtrack yet (`encode.sh … none`).
- The end card is left-weighted by design (x = 173 column); the right two-thirds is paper and moving light.
- The window-light overlay is a normal-blend 7.5 % layer, so ink type brightens about 3 % inside the band. This is
  intended (light falls on the page) but it is not the brief's soft-light.
- The hero still life is rendered at 360×480 and upscaled ×1.5 (plus baked grain), so it reads as a soft film print
  at its largest (studio, 510×680), which suits the material.
- At JPEG q90 (check frames only) a faint light ring appears next to the black bezel; at q95 it is negligible.

## Tool notes (copied/added in `src_b/tools`, originals untouched)

- `tools/sheet.sh` always starts at `f00000` and therefore cannot sheet a window of a partial render. `sheet_win.sh`
  is a windowed copy, which also avoids a SIGPIPE (exit 141) under `pipefail` from `ls | grep | head`.
- `tools/render.js` reports ms/frame as elapsed / frames including page start-up, so short windows over-report; it
  also forwards console messages only from the scout page.
- `render.js --scale 0.5` still produced 1920-wide JPEGs in this sandbox (the CDP capture ignores the context's
  deviceScaleFactor), so the "preview" frames are full size.
- Added: `snap.js` (debug page screenshot), `frames.js` (render chosen times), `montage.sh`, `prof.js` (per-layer
  cost), `idem.js`, `hist.js`, `sweep.js` (determinism), `st_probe.js`.
