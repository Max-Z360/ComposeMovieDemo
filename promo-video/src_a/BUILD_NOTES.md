# Tipmi launch film — variant a (fidelity and precision)

A 42.5 s film (1275 frames at 30 fps; picture 0–42.000 s, hard cut to black, black until 42.5) built to `brief/CREATIVE_BRIEF.md` with the planner overrides. All timing comes from `../src/cues.js`. Everything is generated from code: no network, no stock media, no photos, no AI images.

## How to run (from `promo-video/`)

```bash
node tools/render.js --page src_a/index.html --frames frames_a --jpeg --quality 95 --workers 2   # master frames
tools/encode.sh frames_a out/a/full.mp4 none 30 17                                             # picture only
tools/sheet.sh frames_a out/a/review 30 1 6                                                     # 1 s sheet + key_*.jpg
# preview:        add --scale 0.5
# zh copy swap:   open src_a/index.html?lang=zh
# library sheet:  node src_a/tools/shot.js src_a/library.html out/a/library.png 1920 1500
```

Review helpers I wrote, all in `src_a/tools/`. None of them edit the shared `tools/`.

- `stills.js` renders a set of timestamps into a labelled montage.
- `determinism.js` re-renders in three seek orders and compares.
- `profile.js` splits the cost of a frame into seek time and capture time.
- `shot.js` is a single-page screenshot.
- `domdiff.js`, `cvdiff.js` and `pngdiff.py` were used to debug determinism.

## What was built

| File | Contents |
|---|---|
| `index.html` | The stage. It also holds the render contract: `DURATION = CUES.duration` (42.5), `READY`, `seek(t)`, plus the freeze clamp (7.857–8.571) and the per-shot film-grain box. |
| `styles.css` | Every token from §3. Components: `.line`, `.cap`, `.dot`, `.plate`, top bar, phone, studio, wordmark. Global `transition/animation: none`. |
| `constants.js` | `BRAND_NAME`, `TAGLINE`, `CTA`, the hero maker/title, `SUPPORTER`, `EDITION`, `CHOSEN_COUNT`, `ACCENT`, `SEED`, and `COPY.en`/`COPY.zh` holding all 11 lines plus the UI strings. Also the 24-name caption list. |
| `core.js` | Line builder (masked rise, 55 ms word stagger, expo-out; exit at 60 %, 6 px up, expo-in; blur-in), visibility windows, the mounted-plate renderer and the screen-window clip. |
| `gen/prng.js` | mulberry32, xorshift32, an integer hash, CSS cubic-bezier eases, and a keyframe track `K()`. |
| `gen/cards.js` | The 24-plate library, `grade()`, the hero, 7 warmth grades, 16 dissolve keyframes and the wall thumbnails. |
| `gen/grain.js` | 8 seeded 512² tiles, the paper tooth, baked field grain, and the boxed soft-light film grain. |
| `gen/light.js` | Paper and ink fields, the vignettes, the window-light band (`bandCenter(t)`) and the AO ellipse. |
| `gen/wall.js` | The hook wall as one canvas: tiled lattice, hash swaps, three depth groups, the rush, the freeze. |
| `gen/wordmark.js` | Builds the name with dotless ı/ȷ and tittles placed at the measured stem x, centre y = baseline − 0.74 em. It works for any `BRAND_NAME`. |
| `scenes/geom.js` | Shared layout: the wall, the feed slots, scroll(t), dolly(t), caption/dot layouts. |
| `scenes/*.js` | hook, turn, reveal, wall, column (shots 7–8), studio (shots 9–10), ledger, human, logo, and carrier (`#hero` with its caption and dot, 0 → 42 s). |

**The library** (`out/a/library.png`) has 10 light studies: the hero, vessels, dusk/harbour, a dune, a linen fold and two interiors, two of them cool and two pale. It also has 6 ink flow-field etchings (two bone-on-slate), 5 Fraunces Italic posters (NORTH, 07, stillness, Tide, II; Tide is bone on oxblood-black) and 3 Swiss geometric plates. Everything passes through one `grade()`.

On the first contact sheet the light studies read as bokeh and pastel blobs. I rebuilt them as low-res, procedurally shaded photographs (fabric folds, a vessel on a table, dusk, a dune, window light) mapped through graded tonal ramps. I then culled and fixed the six weakest plates:
- stair-stepped horizons on two dusk plates
- a hard neck edge on the vessel
- a dune that read as an abstract wave
- interior light that looked too graphic
- a plate duplicating the hero's motif, now a warm interior

The hero is a dusk study of draped fabric: deep clay rising to bone, with a slate shadow lower-left.

## Deviations from the brief, and why

1. **Duration.** 42.5 s / 1275 frames, per the planner override (the brief says 43 s / 1290). The wordmark is no longer seen after 42.0 s.
2. **Line timing.** The copy-deck "Out" time is when the exit *starts*: 360 ms, or 330 ms for blur-in lines and 450 ms for L9. This is the only reading under which the deck's dwell figures add up, and no two lines overlap.
3. **Wordmark blur-in duration.** 1.55 s quint-out, solved numerically so the wordmark is exactly 90 % revealed at 38.571 (checks 15 and 16). A 550 ms blur-in starting at 38.0 would reach 90 % at about 38.2 and miss the logo hit.
4. **Wall layout (shot 6).** Read literally, the brief's masonry stacks row-2 plates where row-1 captions sit (P4 at y 625 against P1's caption at 601–627, and so on), and a 22 px "maker — series" caption is wider than the 200–240 px plates.
   - Given positions are mat-outer top-left, which matches P7 ending exactly at x 1747.
   - Hero, P1–P3 and P7 keep their x/y. P1, P2, P4 and P5 are 2.5 % smaller, and P4/P5/P6 move down so each caption clears the plate below and stays above y 1000.
   - Wall captions are maker-only. The hero keeps its full caption.
   - The dot sits inline (inside the mat's x-range) rather than hanging, because the 24 px gutters can't hold a hanging dot.
   - The wall's 1 % push-in is anchored on the copy column (x 173), so the plate column stays aligned with the type.
5. **Hero mat sizes.** The wall hero is 360×480 outer with a 12 px mat; the plate is cover-cropped by 1.7 %. The print is 560×760 with a 40 px mat and an 80 px weighted foot, so the 3:4 plate isn't distorted.
6. **Captions.**
   - Caption line boxes sit 16 px under a mat, which puts the visible text at (1120, 904) as the brief states.
   - In reveal, studio and print the dot hangs 24 px left of the mat edge, at the x-height centre, giving (1096, 915) in the reveal.
   - The dot travels to the first tittle from wherever it actually is at 37.3, which is the print caption (≈ 1056, 960), not the literal (1096, 935).
7. **Chosen frame.** It draws 12.857–13.357 and holds through the reveal, then fades 16.6–16.95 so the shrink into the wall carries only the dot.
8. **Feed and device geometry.**
   - The feed starts 37 px under the sticky app header. The 20.7–22.857 scroll is 0→420 exactly as specified; the device-shot drift adds 38 px (peak ≈ 40 px/s) so the hero arrives at the top of the feed exactly at the tap.
   - The dolly that runs 22.857→24.571 is interrupted at the 24.286 tap and returns flat by 24.857, push-in included. The phone is at 0° and scale 1 before the 25.143 swap.
   - The bezel is one SVG rect: it draws 1 px clockwise, then its stroke width and path inset grow together into exactly the 12 px ring (434×910 r 64 outside, 410×886 r 52 inside). There is no separate div swap.
   - The hidden screen window during the flight is a single clip on the page layer, starting at f601. At f600 the hero still sits in the header band.
9. **Ledger.** Each row rises as one masked unit on its cue (the sub-duck time), and its separator rule follows 110 ms later. A 110 ms word stagger would leave "Print sold — 1 of 25" unfinished when the ledger fades.
10. **Publish ring.** The r 32 ring is centred on the 200×48 button as specified. It is larger than the button, so the PUBLISH label fades as the press begins: oxblood never crosses type.
11. **Warmth detents.** The picture changes on exactly f793, 795, 797, 798, 800, 802 and 804, as check 14 requires (round(793 + 1.8k)). Each detent's expo-out motion completes within its own frame.
12. **Window-light band.**
    - Shots with a crossing window (1, 5, 11, 12, 13) move the band's centre from the plate's left edge to its right over that window.
    - Every other shot uses the literal "restart at x = −420, 1.5 px/frame", which keeps the band at the left edge.
    - On paper the band is drawn as a screen-blend white at 0.42 alpha into the field. Over plates and type it is a soft-light layer at 0.18 opacity, which gives roughly +4 % on plate mid-tones. A soft-light layer at 0.6 would give about +35 % on mids, and on paper it does almost nothing.
13. **Grain.**
    - The brief's "soft-light 4 %" is mathematically invisible on paper. So the field grain uses the same 8 seeded tiles, pre-baked into 8 field variants (overlay at 0.65 on paper, 0.3 on ink), with tile = floor(t·24) % 8. Measured paper std is 3.0 levels (check 13: ≤ 6, visible).
    - A soft-light film-grain layer (opacity 0.10–0.12) covers the region where the work is in each shot.
    - Grain clumps are 2 px. That is more filmic at 1080p and roughly halves the JPEG encode cost.
14. **Wall swaps.** Wall swaps use `hash(cell, floor(t·rate + φcell))`: the per-cell phase avoids the whole wall flashing on the same frame. The hero thumbnail is excluded from the wall, so the hero stays the only warm cell. The wall lattice tiles past the 15×7 grid so it bleeds on every side while it scrolls.
15. **Visibility.** Off-shot `display:none` is applied from pure time windows in `seek()` (`applyVis`) rather than timeline `set()` calls. The behaviour is identical and the result doesn't depend on seek order.
16. **Fresh compositing per frame.** `seek()` re-attaches `#stage` every frame. Chromium then rebuilds and freshly rasterizes all composited layers, so a frame never depends on what rendered before it. Without this, the 3D phone and the wordmark's settling blur differed by 1–4 levels at worker chunk boundaries. It costs roughly nothing.

## Known issues / brief contradictions (left as specified)

- **`--muted` #8A867E on paper is 3.2:1**, against check 6's ≥ 4.5:1. The token and the check contradict each other; I kept the locked token. ink 16.5:1, ink-soft 10.4:1 (9.4:1 on the mat) and bone on ink 16.1:1 all pass.
- **The accent appears in about 68 % of frames.** The storyboard keeps the chosen dot beside the work from 13.357 to the end, which can't meet check 8's "≤ 5 % of frames". Area is far inside budget: at most 0.06 % of a frame (measured), never on type.
- **The top bar sits at y = 64**, as specified. That is under check 2's 80 px margin for text.
- **The phone's 0 48px 96px shadow** runs gently past the bottom edge of the frame (phone bottom at 995 + 48 + blur). That is the spec value.
- **Tittles sit about 20 px higher than Fraunces' own i-dots**, because the spec says centre at baseline − 0.74 em. Their x matches the real stems within about 2 px (verified with an overlay).
- **Arbitrary random-order seeks** (`tools/determinism.js` jumping across the film) can still differ by 1–8 levels on moving antialiased edges, for example a blurred plate entering. The render pipeline's own path is byte-identical (see below).
- **No audio** at this stage (`none` passed to encode). The cues in `src/cues.js` are respected by the picture.

## Measurements

- **Frame count:** `out/a/full.mp4` has 1275 frames at 30 fps, 42.500 s, 1920×1080. The first black frame is f1260.
- **Determinism:**
  - `--workers 1` vs `--workers 4` with `cmp`: 0 differing frames over f600–f779 and f1110–f1199 (270 frames), and 0 over the brief's f60–f130 and f700–f760 (134 frames).
  - The 1-worker frames also match the 2-worker master byte-for-byte.
  - No pageerror or console errors.

**ms/frame, as reported by `render.js`.** Variant b was rendering on the same 4 CPUs throughout (load average around 3–4), so these numbers are inflated.

| Run | Window | ms/frame |
|---|---|---|
| Full film, 2 workers | 0–42.5 s | **81** (aggregate; 104 s for 1275 frames) |
| 1 worker | 20–26 s | **136** |
| 1 worker | 37–40 s | **95** |
| 1 worker | 0–3 s | **130** |
| 4 workers | 20–26 s | 85 |
| 4 workers | 37–40 s | 72 |
| 4 workers | 0–3 s | 123 |
| 1 worker, short window | f60–130 | 153 |
| 1 worker, short window | f700–760 | 176 |

The two short windows include about 1.4 s of page start-up plus warm-up spread over only 62–72 frames.

From `profile.js` (seek plus capture, one worker), seek is 4–11 ms. Capture by shot:

| Shot | Capture |
|---|---|
| Paper | 80–110 ms |
| Phone dolly | 125–150 ms |
| Flight (20.0–21.0, one clip) | about 180 ms |

The most expensive costs were the canvas `overlay` grain pass (~45 ms, now pre-baked), the full-frame soft-light grain layer (~40 ms, now boxed) and per-element clip polygons (~350 ms, now one clip).
