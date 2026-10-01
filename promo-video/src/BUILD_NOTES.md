# Tipmi launch film — build notes (variant b, promoted to `src/` on 2026-10-01; see CHANGELOG.md)

The film is the brief's structure, copy, timecodes, cues, palette and type families, executed by an art director.
Picture runs 0–42.000 s, then a hard cut to black until 42.500 s: 1 275 frames at 30 fps (planner override).
Timing comes only from `cues.js` (this directory), which is unedited and loaded by `<script>`.

## How to run (from `promo-video/`)

```bash
# master: JPEG q95 frames -> frames/, mp4 with audio/track.wav, review sheets
node tools/render.js --page src/index.html --frames frames --jpeg --quality 95 --workers 2
tools/encode.sh frames out/final.mp4 audio/track.wav 30 17
tools/sheet.sh frames out/review 30 1 6
src/tools/sheet_win.sh frames out/review_hook 30 0.25 6 0 8.75     # hook only (see "tool notes")
# quick preview
node tools/render.js --page src/index.html --frames frames --jpeg --scale 0.5 --workers 2
# zh copy (same timeline): --page "src/index.html?lang=zh"
# library contact sheet (all 24 plates full size + wall thumbs + dissolve keyframes + warmth grades)
node src/tools/snap.js src/debug/library.html out/library.png 1920 1080
# determinism checks
node src/tools/idem.js          # seek(a); seek(b); seek(a) == seek(a), 11 pairs across scene boundaries
node src/tools/sweep.js 2       # every 2nd frame: sequential render vs render right after a far jump
node src/tools/accept.js bezel  # chrome dissolve: no phone pixel over the carrier mount/dot (f754–f762)
```

Outputs: `out/final.mp4` / `out/preview.mp4` (1920×1080, 30 fps, 1 275 frames, 42.5 s, AAC from `audio/track.wav`), `out/review/sheet.png` + `key_*.jpg`
(every second), `out/review_hook/sheet.png` (0–8.75 s every 0.25 s), `out/library.png`, `out/preview.mp4`.
`frames/` is left in place.

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
4. **Burn behind the hook copy** (final pass: an ellipse hugging the display box, released 5.4–5.9 s after L2 exits).
   Reason: keep bone-on-wall at or above 12:1 (measured 13.9–15.5:1 around L2), as a printer would dodge and burn,
   without darkening the rest of the wall.
5. **Wall thumbnails** (final pass): luminance 0.38·y^0.82 (a slight mid-tone lift over the brief's ×0.35), saturation
   −60 %, linear highlights. The earlier highlight compression flattened every cell into the same grey at 50 % scale.
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
- **#16:** hard cuts on the bars: first paper frame f258 (see "Review round 2 notes"), print -> logo at f1114.
- **#20:** see above.
- **Not in this stage:** audio (#17–19); there is no `audio/track.js` for variant b yet. #8 is noted above.

Craft checklist (§7) self-score: 14 / 15. Silence and the logo sound are designed on the cue grid but not yet
synthesised.

## Known issues (status after the final pass, 2026-10-01)

- ~~No soundtrack yet.~~ **Resolved:** previews and the master mux `audio/track.wav` (−14.0 LUFS, −1.6 dBTP, LRA 8.2;
  `node audio/verify_cues.js` 22/22, every tick/thump/chime within 4 ms of CUES; picture events use the same CUES).
- End card left-weighted — **kept by design.** Brief §5.2 shot 13 fixes the card to x = 173 and allows nothing but
  dot-wordmark, tagline, hairline and CTA; the right two-thirds is paper and the moving light band (the same left
  column the whole film uses, and the column the 9:16 re-frame keeps).
- Window light is a normal-blend 7.5 % layer, not soft-light — **kept.** Soft-light of #FBF8F2 over #F4F1EB paper is
  < 1 level (invisible after x264) and the rotated soft-light layer cost 36 ms/frame; the band is painted into the
  paper field instead and the 7.5 % layer carries it over plates and type (ink type brightens ≈ 3 % in the band, read
  as light falling on the page).
- ~~Hero rendered at 360×480 and upscaled ×1.5.~~ **Resolved:** the hero still life now ray-traces at its native
  540×720 (`ss: 1`); silhouettes are crisp at the studio/print sizes. READY +0.5 s per page (≈ 4.8 s), no per-frame cost.
- Faint ring beside the black bezel at JPEG q90 — **not applicable:** frames are rendered at q95 (render.js default),
  where it is below the x264 floor.
- ~~One in-flight frame (f605) puts a caption 15 px from the bottom edge during the column fly.~~ **Resolved (review
  round 2):** only the hero flies; captions are never in flight; the lowest text in f600–630 is 94 px from the edge.

## Review round 2 notes (2026-10-01)

- **Ink -> paper cut at f258, not f257.** f257 is 8.567 s, 4 ms *before* the 8.571 bar; the cut is `t >= 8.571`, so the
  first paper frame is f258 (8.600 s, 29 ms after the bar). Kept: the brief says picture never leads sound and a cut lands
  "on the hit or 1–2 frames after"; check #16's "f257" is round(8.571 x 30) and would put paper on screen before the bar.
- **Accent budget (§8 #8).** Hue/sat mask over every 5th frame of the master (`r` dominant, sat > 0.45, `g < 0.6r`,
  `b < 0.7r`): oxblood present in 180/252 sampled frames (71 %), max 0.28 % of the frame (f1030; this looser mask also
  catches the warmed clay pot in the print; the QA reviewer's tighter mask measured max 0.118 %). The 0.5 %-per-frame
  cap passes; the 5 %-of-frames cap cannot pass by design — the brief's own chosen dot is carried on screen from 13.357 s
  to the end card. Documented, not "fixed".
- **Wordmark timing.** The blur-in now reaches 90 % exactly on the 38.571 hit (quart in-out over 0.858 s), as §4 and
  §8 #15–16 state; the 550 ms quint-out of §3.2 reached 90 % at about 38.2 s and left the word reading "Tipmı" for about
  17 frames. Round 3: the second tittle's 90 ms fade (cubic-out) now *starts* on the 38.571 hit and is complete on
  the E6 chime at 38.661 (≈ 70 % on f1158); the sharp word reads dotless only on f1156–f1157.
- **Tittle height.** Tittles sit 2 px above the font's own i-dot centre (now baseline − 0.596 em). The brief's
  "baseline − 0.74 em" (and the review's "− 0.75 em") would put the dot above the cap height of Fraunces at this
  setting; the measured dot is used instead, plus a clearance nudge against the preceding glyph (≥ 4.5 px on the canvas
  measure; ≈ 4 px measured on a rendered frame between the first tittle and the T's arm serif, was 0–1 px).
- **Dwell.** L3 exit 360 → 300 ms: perceptual dwell 1.03 s (brief 1.1 s; the cue window caps it). L9 keeps the brief's
  slow 450 ms exit: 1.77 s (brief 1.8 s, one frame short).
- **ms/frame.** `render.js` reports elapsed / frames *including* ≈ 5 s page start-up. 1 worker, full res: 17–26 s
  116 ms/frame reported (≈ 98 steady state); 37–42.5 s 100 reported (≈ 70 steady). Full film, 2 workers: 62 ms/frame
  throughput.
- **`--scale` is not neutral.** The renderer's `--scale 0.5` (deviceScaleFactor) still captures 1920×1080, but it is not
  byte-identical to `--scale 1` on every frame: f779 differs on 38 px by 1 level. Same scale = identical bytes.

## Review round 3 notes (2026-10-01, last polish before the master)

- **The fall resolves on the bar — deliberate.** `gen/wall.js` runs the 500 ms expo-in fall over 2.357–2.857 so the
  hero *lands* in cell (7,3) on the 2.857 bar, on the hats' entry; the brief starts the fall on the bar. Expo-in puts
  nearly all the visible travel in the last ~4 frames, which overlap L1's exit (2.6–2.96). Kept: landing on the hit is
  the sync the hook is built on (the wall cells then appear around the landing 2.857–3.30).
- **Chrome dissolve z-order.** From the swap (25.143) to the logo the carrier has `z-index: 1` inside `#world` (now a
  stacking context, `z-index: 0`, so the plate never rises over the type, light band or grain). The phone's bezel,
  shadow and AO are under the growing plate. The bezel ring alone fades in 300 ms (header 200, shadow/glare 400) because
  the caption, whose box is transparent between glyphs, crosses the ring's right side from 25.233; the ring is at
  ≤ 12 % by then. `accept.js bezel`: f755–f762, 0 phone pixels over the mount and the dot, ≤ 24 levels behind the
  caption text on f757, ≤ 7 after.
- **Light band by layout.** `#bandOv` is positioned by `left` in whole px instead of a fractional `translateX`: the
  transform kept a history-dependent raster offset (≤ 2 levels in two 8×8 JPEG blocks on f1055–f1092 after a jump;
  found by the first full-film sweep, pre-existing). Motion is 1–2 px steps of a 7.5 % soft gradient, not visible.
- **Accent budget (QA's tight mask r 0.33–0.62, g < 0.30, b < 0.33, r > 1.9 g, every 20th frame + key frames):**
  oxblood in 48/71 sampled frames (68 %), max 0.045 % of a frame (f580/f600, the eight wall dots), first at f401 (the
  dot sets on cue), never on type. 0.5 %/frame passes with a 10× margin; the 5 %-of-frames cap cannot pass by design.
- **Dwell (strict 97 %/3 %):** L3 0.90 s (brief 1.1), L9 1.63 s (brief 1.8); perceptual 1.03 / 1.77 s. Both capped by
  the cue windows in `cues.js` (not editable). L9 keeps the brief's slow 450 ms exit (§5.2 shot 12).
- **f257/f258:** unchanged, see round 2.

## Tool notes (copied/added in `src/tools`, originals untouched)

- `tools/sheet.sh` always starts at `f00000` and therefore cannot sheet a window of a partial render. `sheet_win.sh`
  is a windowed copy, which also avoids a SIGPIPE (exit 141) under `pipefail` from `ls | grep | head`.
- `tools/render.js` reports ms/frame as elapsed / frames including page start-up, so short windows over-report; it
  also forwards console messages only from the scout page.
- `render.js --scale 0.5` still produced 1920-wide JPEGs in this sandbox (the CDP capture ignores the context's
  deviceScaleFactor), so the "preview" frames are full size.
- Added: `snap.js` (debug page screenshot), `frames.js` (render chosen times), `montage.sh`, `prof.js` (per-layer
  cost), `idem.js`, `hist.js`, `sweep.js` (determinism), `st_probe.js`.
