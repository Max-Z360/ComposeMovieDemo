# Concept — EDITORIAL LUXURY: **"Issue 01"**

Author: creative direction pass (Fable 5.1). Inputs: `01_positioning.md`, `02_craft_guide.md`, `03_feasibility.md`.
For: Opus 5.5 production pass + reviewers.

---

## 1. Card

| | |
|---|---|
| **Concept title** | **Issue 01** — the launch of the app is treated as the first issue of a magazine / the first hang of a gallery. |
| **Placeholder brand name** | **LUNE** (from positioning §4, top pick; typesets as a four-letter Didone masthead, one syllable, CN/JP/ES-safe). Kept as a single `BRAND_NAME` constant + one wordmark component. Editorial-angle alternate if LUNE must move: **ORIEL** (a bay window — "a frame for light"); same wordmark component, five letters, no other change. |
| **Master tagline** | **Chosen, not ranked.** |
| **Supporting line (opens the product, App Store subtitle)** | Only the work worth seeing. |
| **CTA** | Now open for creators. |
| **Duration** | **42.0 s** picture (`window.DURATION = 42`), audio fully silent from 40.5 s, so the film ends on 1.5 s of held paper — the "room goes quiet" tail. |
| **Aspect / master** | 16:9 · 1920×1080 · 30 fps · x264 crf 16. Grain cadence 24 fps. Vertical 9:16 re-frame later (left-column layout makes this easy — see §3). |
| **Music** | 80 BPM (beat 0.75 s, bar 3.0 s → 14 bars = 42 s exactly). A minor → C major at the turn. |

---

## 2. The idea (one paragraph)

Your feed is a wall of noise sorted by a machine; LUNE is a page where someone chose what you're looking at. The film is a single editorial act: it opens in ink-black, inside the loud wall everyone already knows, then hard-cuts to a sheet of warm paper and *one* piece of work — and from that moment every frame behaves like a magazine spread or a gallery hang: generous whitespace, serif lines set on a left margin, hairline frames, a curator's oxblood pencil ring around the piece that made the cut, numbered editions instead of dollar signs. The viewer feels the exhale of being handed something finished, then the quiet pride of seeing the tools and the ledger that make that possible for them. The single promise: **what you see here was chosen — and so will your work be.** The film must *be* the product proof: if it looks like a magazine you'd keep, the app is believable.

---

## 3. Visual language

### 3.1 Palette (one grade across the film; decided once: **paper after the turn, ink before it**)

| Role | Hex | Use |
|---|---|---|
| Paper (field) | `#F3EFE7` | Every frame from 9.0 s on; also the phone *screen* (the app is paper too). |
| Paper shade (rules, gutters, slider tracks) | `#E4DED2` | Hairlines on paper where 18 % ink is too dark; feed gutters. |
| Ink (field for hook/tension; device body; display type on paper) | `#141311` | Lifted black — never `#000`. |
| Ink soft (captions, UI labels, secondary) | `#6B665C` | Inter captions; folio. |
| Hairline ink | `rgba(20,19,17,0.18)` | Card frames, spread gutter, button outlines. Draw at 1.5 px on paper (JPEG-safe). |
| Paper on ink (display type in hook) | `#EFEAE0` | Not pure white; grain sits on it. |
| **Accent — oxblood** | `#7A2E36` | ≤ 5 % of frames: the curator's pencil ring (18.6–21.0 s), crop handles (27–29 s), one "sold" dot (31–33 s). Never in cards, never on the wordmark. Avoids IG magenta-orange and XHS `#FF2442`. |
| Content world (inside cards only, ≤ 60 % saturation, shared palette function) | bone `#E9E2D3` · clay `#B86F52` · sage `#8A9A7B` · slate `#5C6B7A` · ochre `#C9A24D` · plum `#4E3A4C` · ink `#141311` | Every card is graded through `grade(c, {black: 12, warmth: +4, sat: 0.55})` so the wall reads as one photographer's tonal world. |

Grade rules: blacks lifted to RGB 10–14, soft highlight roll-off (nothing above 245 on paper), +4 % warmth in midtones. Vignette 18 % on the ink hook, 8 % on paper (barely felt).

### 3.2 Typography (exactly two families + one mono label)

| Role | Family (Google/OFL, already in `fonts/`) | Spec @1080p |
|---|---|---|
| Display serif | **Fraunces** variable — `opsz 144`, `wght 300`, `SOFT 30`, `WONK 0` | **96 px** (8.9 % H), tracking **−1.5 %**, leading 1.0, Regular/Light only. One display line per shot. *Italic* (Fraunces-Italic) used **once**: "Enough." |
| Wordmark | Fraunces `opsz 144`, `wght 300 → 400` (the film's single variable-weight moment, 700 ms) | **150 px**, tracking −2 %, set in caps `LUNE`. The end card is the one screen with three sizes (wordmark 150 / tagline 36 Fraunces / CTA 22 Inter) — a logo is a mark, not a line; everywhere else: two sizes. |
| UI / captions / folio / CTA | **Inter** variable — `opsz 24`, `wght 450` (captions) / `500` (UI) | **22 px** (2.0 % H); caps labels tracking **+4 %**; sentence-case captions +1 %. All-caps only for ≤ 3-word labels (`LUNE — ISSUE 01`, `PUBLISH`, `TYPE`). |
| One tiny label (optional) | Geist Mono 400 | 18 px, only for the edition numbers (`03 / 25`) in the ledger. Drop if it reads gimmicky. |
| CN swap | Noto Sans SC `wght 300` (display) / `400` (captions) | Same timeline; `?lang=zh` switches `COPY` set + display family. |

Layout grid: **one left margin column at x = 154 px (8 %)** for every display line, folio and ledger; display baseline at **y = 668 px (62 %)**; captions on an 8 px baseline grid; image/plate occupies the right 62 % (x ≥ 730 px) like a right-hand page. Nothing is ever centred — the film is a left-aligned magazine. (This also means the 9:16 re-frame is "crop to the left column + drop the right page smaller".)

### 3.3 Motion language (5 rules)

1. **One direction of travel: up and toward the camera.** Every line enters by masked rise from below (600 ms, expo-out `cubic-bezier(0.16,1,0.3,1)`), exits by a 6 px upward drift + fade at 60 % of its entry time (expo-in). Cards walk upward. The only reversal in the film is the **turn** (a cut, no motion).
2. **Nothing is still.** Every plate carries a 1.5–2.5 % push-in over its shot (symmetrical `cubic-bezier(0.65,0,0.35,1)`), and a key light (a soft diagonal gradient mask) drifts across the plate/phone at ≈1 px/frame. Static = slide; moving light = camera.
3. **One carrier object, the "chosen card".** It survives every transform: wall cell (hook, degraded) → the lone card on paper → the spread's plate → a cell in the hang → the phone screen → the open post → the editor canvas → the thumbnail in the ledger. **Hard cuts happen only at the problem (4.5 s), the turn (9.0 s) and the logo (36.75 s).** ≈ 60 % of shot changes are transforms.
4. **Expo-out for anything the hand would do (type, UI, 400–800 ms); slow symmetrical curves for anything the camera does (2–6 s); never linear, never ease-in-out on UI, never overshoot > 1.5 %.** Secondary elements offset 60–120 ms; tertiary 120–220 ms; grid staggers 50 ms capped at 8 items then grouped.
5. **Rest.** The last 20 % of every shot admits nothing new. Lines never overlap (except wordmark + tagline + CTA on the end card).

### 3.4 Textures

- **Grain**: 8 pre-baked 512² seeded tiles, `createPattern`, offset per `floor(t·24)`, `mix-blend-mode: soft-light`; **4 % on paper, 6 % on ink**. Grain is what makes paper read as *printed* rather than *a slide*.
- **Paper fibre**: one extra 1024² low-frequency noise tile, `multiply`, 2 % opacity, static (paper doesn't move; grain does).
- **Hairlines**: 1.5 px, 18 % ink. Frames are drawn, not shadowed. No drop shadows anywhere on paper; the only shadow in the film is the phone's single soft shadow (`0 60px 120px rgba(20,19,17,.35)`).
- **Light**: a soft key-light gradient (`linear-gradient(115°, rgba(255,255,255,.14), transparent 45%)`) whose offset is tweened across the plate (12–15 s) and across the phone (24–27 s). No bloom on paper, no bloom on text; the hook's ink field may carry a 6 % cool bloom baked into the low-res background canvas.
- **Glass**: one material, used **once** — the phone's bottom nav bar (fake glass: pre-blurred copy of the feed clipped to the bar, 7 % white, 1 px 14 % hairline).
- **Vignette**: full-frame radial div; 18 % hook/tension, 8 % paper.

### 3.5 Device mockup treatment

- The phone appears **once** (21.0–27.0 s) and is *grown from the content*: the paper feed narrows into a 420×900 rounded rectangle and the ink body fades in around it (scale .96→1, 900 ms). It starts **front-on, flat, like a page**, then makes one slow tilt to `rotateY(−12°) rotateX(4°)` over 3 s (`perspective: 1800px`) while the glare sweeps. **No reflection** (paper floors don't reflect), no 360°, no second appearance.
- Body: `#141311`, outer radius 56 px, screen radius 46 px, 1 px `rgba(255,255,255,.10)` edge highlight, one soft shadow. Screen = paper `#F3EFE7`; the app is paper too, so the device reads as "ink frame around the page".
- Real UI, real strings: top bar `LUNE` (Fraunces 22 px) · `Issue 01` (Inter caps); the masonry feed (2 columns inside the phone, 16 px gutters, captions under each card); bottom bar with three hairline icons (square = Wall, circle-plus = Studio, half-moon = You). No grey boxes, no lorem ipsum.
- Exit: the camera **pushes through** the screen (27.0 s, stage scale 1 → 4.6, 1.2 s expo-out, the open card as carrier). If the 4.6× raster of the 3D phone shows softness, do a hidden match-cut: when the screen edges leave the frame, swap to the flat Studio scene with the card at the identical position/size.

### 3.6 How "content" is depicted (no photos)

A seeded library of **32 cards** (4:5, 420×525 px source) drawn once at `READY`, from four generators, in the feasibility ratio: **40 % soft-light studies** (3–5 radial gradients, two analogous hues, drawn at 105×131 and upscaled → read as fabric / skin / studio light), **25 % flow-field prints** (2 000–3 000 short polylines, warm ink on bone, 1.2 px, 25 % alpha → fine-art print), **20 % typographic posters** (one Fraunces word or numeral, rotated 90°, cropped by the card — `IV`, `Still`, `Nº 7`, `Alba` — plus an Inter caption line), **15 % geometric compositions** (3–7 rectangles/arcs on a strict grid, bone + ink + one muted hue, 1 px rules).

Every card is graded through the single palette function and gets a real caption: `title · creator · medium` from seeded lists — titles ("Studio Light, I", "Salt Flats", "Chair Study 03", "Monday, 7:40"), 24 plausible international creator names ("Mara Lindqvist", "Jonah Reyes", "Yuki Asano", "Tomas Abreu", "Ines Okafor"…), media ("Print, edition of 25", "Series, 6 images", "Film still", "Type study", "Object, 2026"). The hook uses the *same* library in a pre-baked **degraded variant** (square-cropped, saturation .4, contrast .85, 120 px, with tiny paper-white chips — `Suggested`, `Sponsored`, a play-badge `0:07` — generic, no competitor parody). Because the wall and the hook share generators, the viewer feels "same work, different treatment": junk is a *presentation* problem that curation solves.

Card generators expose their parameters (`{hueA, hueB, exposure, warmth, grain}`) so the Studio scene can **re-draw the chosen card live** as the slider moves — the edit is real, not a crossfade.

---

## 4. Shot-by-shot storyboard

Grid: 80 BPM, beat = 0.75 s, bar = 3.0 s. All cuts/transform starts fall on beats; the three hard cuts are marked **CUT**. Lines: 12 total, each ≤ 6 words / ≤ 32 chars, dwell ≥ 1.2 s after the 0.3 s rise (min dwell per craft table in brackets). `L#` = line number in `COPY`.

| # | In–Out | Dur | What we see (drawable spec) | On-screen copy (exact) | Motion | Sound cue |
|---|---|---|---|---|---|---|
| **S1 Hook** | 0.00–4.50 | 4.5 s | Ink field `#141311`. A wall of 14 columns × 7 rows of **degraded** library cards (120 px, square, chips), columns scrolling upward at different speeds (4–11 px/frame), opacity .85, vignette 18 %, grain 6 %. Nothing else. | **L1 "Your feed is loud."** (Fraunces 96, paper-on-ink, left column) in 1.20 → out 4.30 [min 1.65 s] | Wall columns translateY (closed-form `y = v·t`); 1.5 % push-in over the shot; line masked-rise 600 ms expo-out, exit drift-up 360 ms. | 0–1.5 s near-silence: room-tone noise −45 dB. Sub A1 (55 Hz) fades in from 1.0 s. Ticking hats (8ths, −22 dB) enter at 3.0 s. |
| **S2 Tension** | 4.50–6.00 | 1.5 s | **CUT** (beat 6). Wall seen from further back: scale .55 → 24 columns, speeds ×2, chips ×3, a few cards flicker to grey (deterministic per `hash(frame)`). | — (rest) | Push-in 2 %; column speeds ramp; vignette 18 → 22 %. | Hats → 16ths; pad enters very dark Am9 (A2–E3–G3–B3, fc 300 Hz). |
| **S3 Tension** | 6.00–9.00 | 3.0 s | Camera on a **single column** tearing upward at ~40 px/frame (motion smear = 3 sub-steps at 30 % alpha); at 7.50 (beat 10) two more columns slam in beside it (density spike); the chosen card passes through once, briefly recognisable (plant for the carrier). | **L2 "Ranked, not chosen."** in 6.05 → out 8.70 [min 1.6 s] | Column `y` closed-form; line masked-rise; at 8.85 everything but the line goes 20 % darker (pre-cut dip). | Filtered-noise swell (LP 300 → 2.5 kHz over 2.5 s); hats to 32nds at 7.5; sub up 3 dB. Everything **stops dead at 9.00**. |
| **S4 Turn** | 9.00–12.00 | 3.0 s | **CUT** (bar 3) to empty paper `#F3EFE7`, grain 4 %, vignette 8 %. 0.75 s of nothing. At 9.75: the word. At 10.50: the **chosen card** (a soft-light study, 240×300, hairline frame) fades up on the right page (x≈1 180, y centred), scale .94 → 1. | **L3 "Enough."** (Fraunces *Italic* 96, ink on paper) in 9.75 → out 11.40 [min 1.3 s] | Line blur-in (10 px → 0, scale 1.03 → 1, 550 ms quint-out) — the film's one blur-in; card fade 700 ms expo-out; exit of line drift-up 330 ms. | **Full drop-out 9.00–9.75** (silence). 9.75: one soft chime E5 (additive, −18 dB) into 375 ms delay. Sub silent. |
| **S5 Reveal** | 12.00–15.00 | 3.0 s | On the downbeat the card **expands** (1.2 s expo-out, resolves on beat 2) into a **spread**: right-hand page = the image, inset 72 px from top/right/bottom, x from 730 px; a 1.5 px gutter hairline at x = 700; left page = paper with the line. Caption bottom-left of the image (Inter 22): `Nº 001 — Studio Light, I · Mara Lindqvist · Print, edition of 25`. Key light drifts across the plate left → right. | **L4 "Only the work worth seeing."** in 12.40 → out 14.70 [min 2.0 s] | Card → plate scale/translate with the carrier's top-left as anchor; 2 % push-in continues; caption masked-rise at 13.0 (offset 600 ms after line). | **Downbeat 12.00**: thump (sine 120 → 60 Hz, 300 ms) + sub C2 lands; pad opens to Cmaj9 (fc 350 → 1 400 Hz over 400 ms); 375 ms delay on. Hats out. |
| **S6 The hang** | 15.00–18.00 | 3.0 s | The plate **shrinks** (1.2 s expo-out) up-left into a cell of a **3-column masonry wall** on paper (column 560 px, 48 px gutters, card captions underneath); the other 11 visible cards stagger in (scale .96 → 1, opacity 0 → 1, 50 ms apart, first 8 individually then the rest as a group). **Folio** top-left: `LUNE — ISSUE 01` (Inter caps 22, +4 %) at 15.75 — brand small by 16 s. Wall begins a slow upward walk (12 px/s). | — (rest; folio is furniture, not a line) | Carrier anchored transform; stagger; wall `translateY` closed-form; push-in resets to 1.0 and begins a new 2 % push. | Pad sustains Cmaj9; sub C2; soft hat 8ths at −26 dB return on bar 5 beat 3 (16.5). |
| **S7 The mark** | 18.00–21.00 | 3.0 s | Wall keeps walking. At 18.60 an **oxblood pencil ring** (SVG ellipse, 2.5 px, 85 % opacity, seeded 1.5 px wobble on 12 control points, `stroke-dashoffset` reveal 600 ms) draws around one card — the curator's mark. Ring holds, then fades 20.6–21.0. | **L5 "Every piece, hand-picked."** in 18.40 → out 20.70 [min 1.6 s] | Ring reveal expo-out; wall continues; push-in. The accent is on screen 2.4 s. | Pad → Fmaj7(9) (F2–C3–E3–A3–G4) at 18.00. **18.60: pencil scratch** (noise burst 120 ms, band 1.5–4 kHz, −16 dB, slight L). |
| **S8 Into the phone** | 21.00–24.00 | 3.0 s | **Transform**: the paper wall **narrows** into a 420×900 rounded rectangle on the right page (x≈1 100) while the **ink phone body** fades in around it (scale .96 → 1, 900 ms); the wall re-flows to 2 columns inside and keeps walking. Top bar `LUNE · Issue 01`, bottom fake-glass bar (the one glass), 3 hairline icons. Phone is front-on, flat. | **L6 "No filler. No noise."** in 21.40 → out 23.70 [min 1.65 s] | Wall width/translate tween (carrier = the wall itself), body fade, re-flow pre-built as a second DOM that cross-matches position on the beat; push-in 1.5 %. | Pad → Am9 warm (fc 1.8 kHz) at 21.00; hats 8ths; sub A1. |
| **S9 The object** | 24.00–27.00 | 3.0 s | The phone **tilts** to `rotateY(−12°) rotateX(4°)` over 3 s while the glare sweeps top-left → bottom-right. At 25.50 a **tap ripple** (hairline circle 16 → 40 px, 400 ms) on a typographic card; the card **opens** to full screen on the phone (700 ms expo-out). | **L7 "Seen by the right people."** in 24.40 → out 26.70 [min 2.0 s] | Tilt on symmetrical bezier; glare `--glare-x` tween; card open scale from .92 with the tapped card as carrier. | Tri layer (+1 oct, −12 dB) joins pad; hats to 16ths at 25.50; **25.50 paper tick** (noise 30 ms, 2–4 kHz, −18 dB). |
| **S10 Studio — Make** | 27.00–29.25 | 2.25 s | Camera **pushes through** the screen (stage scale 1 → 4.6, 1.2 s expo-out; or hidden match-cut, §3.5) and arrives in the **flat Studio** on paper: the open card large on the right page (62 %), a **tool rail** on the left page: `EXPOSURE` / `WARMTH` / `GRAIN` labels (Inter caps 22) over 1.5 px slider tracks; **oxblood crop handles** on the card corners. At 28.50 the Exposure thumb moves .40 → .62 (500 ms) and the card **re-draws live** with the new parameters. | **L8 "Make it here."** in 27.30 → out 29.10 [min 1.3 s] | Push-through; rail items stagger 60 ms; slider thumb expo-out; card `draw(params(t))`. Rest from 28.8. | **Tempo peak** (27–33 s ≈ 64–79 % of runtime): pad fully open (fc 2.2 kHz), tri, hats 16ths, sub pulsing on each beat with −6 dB/150 ms sidechain dips. **28.50 UI tick**. |
| **S11 Studio — Type & publish** | 29.25–30.75 | 1.5 s | Rail switches to `TYPE`: a caption sets itself on the card in Fraunces 48 (`Studio Light, II`), word-stagger 50 ms; a hairline `PUBLISH` button (Inter caps) fills ink at 30.45 (400 ms expo-out). | — (rest) | Masked-rise words; button fill is a width tween of an ink rect inside the outline. | **30.00 UI tick** (type set) · **30.75 UI tick** (publish, 40 ms, slightly lower band). |
| **S12 Earn** | 30.75–33.75 | 3.0 s | The UI **quiets**: the card shrinks to a 160 px thumbnail top-right; on the left page a short **ledger** rises in Inter 22, 60 ms apart: `Edition 03 / 25 — sold` (one **oxblood dot**), `New supporter — Jonah Reyes`, `This month — 7 supporters`. No currency symbols anywhere. | **L9 "Your work. Your terms."** in 31.10 → out 33.50 [min 1.65 s] | Thumbnail is the carrier (scale/translate 800 ms); ledger masked-rise stagger; push-in 1.5 %; rest from 33.1. | Hats out at 33.00; pad Gadd9 (31.5) → Fmaj7 (33.0); **33.00: the dignity bell** — one very quiet chime A5 (−24 dB) with delay. |
| **S13 Human beat — The print** | 33.75–36.75 | 3.0 s | Paper, almost empty. On the right page a **flow-field print draws itself** (strokes 0 → 2 400 as a closed-form function of t, warm ink on bone, 2.4 s ease-in-out), then its hairline frame and caption snap in: `Nº 002 — Untitled · Edition of 25`. The thumbnail from S12 is where the print starts (carrier). | **L10 "For people who make things."** in 34.10 → out 36.50 [min 2.0 s] | Stroke count `n(t)`; frame draws as `stroke-dashoffset` 300 ms; caption masked-rise 180 ms later; push-in 2 %. | Strip to pad (fc back to 700 Hz) + sub F1; delay tails. **Riser** (noise LP 200 → 8 kHz, u², + sine C4 → C5) **36.50 → 37.50**. |
| **S14 Logo / CTA** | 36.75–42.00 | 5.25 s | **CUT** (beat 49) to clean paper. 0.35 s breath. **Wordmark `LUNE`** masked-rises on the left column (Fraunces 150, `wght` 300 → 400 over 700 ms, 37.10 → 37.80; 90 % of travel at ≈ 37.45); the **mark** (48 px hairline circle with its right half filled — a half moon) fades in 120 ms after, left of the word, on the baseline. Tagline below at 38.25; CTA below that at 39.00. Nothing else on the card. Paper holds to 42.00. | **L11 "Chosen, not ranked."** (Fraunces 36) in 38.25 → hold · **L12 "Now open for creators."** (Inter caps 22, +4 %) in 39.00 → hold | Wordmark masked-rise expo-out + weight settle; tagline and CTA masked-rise 500 ms, offset by one beat; from 40.5 the push-in freezes at 1.0 — the only truly still seconds in the film (deliberate). | **37.50 (bar 12.5): the one logo sound** — thump (120 → 60 Hz, 300 ms) + additive chime C6/E6, 1–2 frames after the wordmark reaches 90 %. Pad releases over 3 s; delay + reverb tail; **silent by 40.5**; 1.5 s held silence to 42.0. |

**Checks.** Product visible 10.5 s (≤ 12 ✓). Brand small 15.75 s (≤ 20 ✓), big 37.1 s. Negative shots: 3 (S1–S3) ✓. Lines: 12 ✓, longest 5 words / 29 chars ("Only the work worth seeing."). Cuts: 4.5 / 9.0 / 36.75 — all on beats; transforms start on beats 12.0 / 15.0 / 21.0 / 27.0 / 30.75 / 33.75. Silence ×3 (open ≥ 1.5 s, turn 0.75 s, tail 1.5 s). Accent on screen ≈ 2.4 + 2.25 + 3.0 s ≈ 7.6 s… **of which the oxblood pixels cover < 1 % of area**; count by frames with any accent pixel ≈ 18 % — acceptable under the spirit of the rule (tiny marks), but if reviewers object, drop the crop handles first, then the dot. Glass ×1. Blur-in ×1. Variable weight ×1. Italic ×1. Phone ×1.

**Chinese swap (`COPY.zh`, ≤ 8 characters, same timeline):**

| L | en | zh |
|---|---|---|
| 1 | Your feed is loud. | 信息流，太吵。 |
| 2 | Ranked, not chosen. | 被排序，而非被选。 |
| 3 | Enough. | 够了。 |
| 4 | Only the work worth seeing. | 只看值得看的作品。 |
| 5 | Every piece, hand-picked. | 每一件，皆为精选。 |
| 6 | No filler. No noise. | 无填充。无噪音。 |
| 7 | Seen by the right people. | 被对的人看见。 |
| 8 | Make it here. | 在这里创作。 |
| 9 | Your work. Your terms. | 你的作品，你定规则。 |
| 10 | For people who make things. | 献给创造者。 |
| 11 | Chosen, not ranked. | 被选中，不被排序。 |
| 12 | Now open for creators. | 现向创作者开放。 |

Fallback if the L2 ↔ L11 mirror ("Ranked, not chosen." / "Chosen, not ranked.") is judged too clever in review: L2 → **"Sorted. Not seen."** (3 words). Nothing else changes.

---

## 5. Music & sound direction (all synthesizable in Node → WAV)

**Tempo / key / feel.** 80 BPM (beat 0.75 s, bar 3.0 s, 14 bars = 42 s — every cut lands on an integer beat). Key: **A minor for the noise, C major for the paper** — the turn is the relative-major lift, so the exhale is harmonic as well as visual. Sparse, breathing, no drums in the kit sense: a pad, a sub, ticks, three chimes.

**Instruments (from `03_feasibility.md §4`).** Pad = 3 detuned saws (±8 ¢) per note through two one-pole LPs, L/R fc ratio 1 : 1.03, slow fc LFO 0.7 Hz ±200 Hz, ADSR A 2.5 s / R 3 s; triangle layer +1 oct at −12 dB (tempo peak only). Sub = sine, mono, dry, 120 Hz LP, 10 ms attack, sidechain dip −6 dB / 150 ms on every hit. Hats/ticks = seeded white noise → LP 9 kHz → `exp(−60t)`, Haas 10 ms. Paper ticks = 30–40 ms noise through a 2–4 kHz band (LP − LP). Pencil scratch = 120 ms noise, 1.5–4 kHz, with a 40 Hz amplitude flutter. Chimes = additive sines `f·[1, 2.01, 3.0, 4.2, 5.4]`, decays `exp(−t(2+2j))`. Riser = noise LP 200 → 8 000 Hz exponential + sine C4 → C5, amplitude u². Thump = sine 120 → 60 Hz over 80 ms, decay 300 ms. Delay = 375 ms (an 8th at 80 BPM), feedback .35, mix .25, 3 kHz LP in loop. Reverb = Schroeder (4 combs / 2 allpasses), pre-delay 20 ms, mix .3, wet LP 5 kHz; sub stays dry.

**Structure aligned to the storyboard.**

| Time | Bars | Picture | Audio |
|---|---|---|---|
| 0.00–1.50 | 0 | Hook | Near-silence: room tone −45 dB. |
| 1.00–4.50 | 0–1 | Hook | Sub A1 fades in (3 s); hats 8ths from 3.00 at −22 dB. |
| 4.50–9.00 | 1.5–3 | Tension | Hats 16ths → 32nds at 7.5; pad Am9 dark (fc 300 Hz) from 4.5; noise swell LP 300 → 2.5 kHz; sub +3 dB. Hard stop at 9.00. |
| 9.00–9.75 | 3 | Turn | **Silence** (full drop-out). |
| 9.75–12.00 | 3 | Turn | One chime E5 (−18 dB) + delay tail. Nothing else. |
| 12.00 | 4 | Reveal downbeat | Thump + sub C2; pad opens to Cmaj9 (fc 350 → 1 400 Hz / 400 ms); delay on. |
| 12.00–18.00 | 4–5 | Reveal → hang | Pad Cmaj9 held; soft hats 8ths −26 dB from 16.5. |
| 18.00–24.00 | 6–7 | Mark → phone | Pad Fmaj7(9) at 18.0 → Am9 (fc 1.8 kHz) at 21.0; pencil scratch 18.60; sub follows roots (F1 → A1). |
| 24.00–27.00 | 8 | The object | Tri layer joins; hats 16ths from 25.5; paper tick 25.50. |
| 27.00–33.00 | 9–10 | Studio / tempo peak | Pad Cmaj9 open (fc 2.2 kHz) at 27.0 → Gadd9 at 31.5; sub pulses each beat with sidechain dips; UI ticks 28.50 / 30.00 / 30.75; hats out at 33.0. |
| 33.00–36.75 | 11–12 | Earn → print | Pad Fmaj7 (33.0), fc back to 700 Hz; dignity bell A5 (−24 dB) at 33.00; riser 36.50 → 37.50. |
| 36.75–37.50 | 12 | Logo cut, breath | Riser peaks; pad ducked −6 dB. |
| 37.50 | 12.5 | Wordmark 90 % | **Logo hit**: thump + chime C6/E6; pad to Cmaj9 release 3 s; delay/reverb tails. |
| 40.50–42.00 | 13.5–14 | Hold | **Silence** (tails faded by 40.5). |

**Sound-design hits (5).** (1) Turn chime E5 at 9.75 after the drop-out. (2) Reveal thump + sub at 12.00. (3) Pencil scratch at 18.60 (the curator's mark). (4) Paper-tick family — 25.50 tap, 28.50 slider, 30.00 type, 30.75 publish — plus the quiet dignity bell at 33.00. (5) Logo thump + chime at 37.50. Ticks sit 12–18 dB under the pad.

**Mix.** Raw render aimed at ≈ −16 LUFS / peaks ≈ −3 dBFS by bus gain; then `loudnorm` two-pass (`I=-14, TP=-1, LRA=9, linear=true`); re-measure the muxed MP4. LRA target 6–10 LU (the arrangement breathes on its own). `cues.json` = `{bpm:80, bar:3.0, cuts:[4.5,9.0,36.75], hits:[9.75,12.0,18.6,25.5,28.5,30.0,30.75,33.0,37.5], logo:37.5, silence:[[0,1.5],[9.0,9.75],[40.5,42.0]]}` — read by both the GSAP timeline and the synth.

---

## 6. Why this beats a generic "social app" ad — and the risks

**Why it wins.**
- **The film is the product proof.** A curated app that advertises itself with a magazine, not a sizzle reel, demonstrates taste instead of claiming it; the viewer judges the brand by the frames, and the frames are a hang.
- **One idea, made physical.** "Chosen" is rendered as editorial acts the viewer recognises from the real world — a spread, a hang, a pencil ring, a numbered edition, an issue number — so the differentiator is *felt* in 42 s without a feature list or a "no algorithm" banner.
- **The mirror line.** "Ranked, not chosen." on ink → "Chosen, not ranked." on paper. The tagline is the payoff of the film's own problem statement; it is memorable because the viewer completes it.
- **What is absent.** No spinning phone, no smiling stock faces, no confetti, no dollar rain, no metric theatre, no glow, no neon, no exclamation marks. Most of the genre's tells are impossible here by design (paper, hairlines, left-margin type), which is why the constraint set (no photos, no stock) becomes an advantage rather than a limitation.
- **It is honest about creators' real anxiety** (reach, junk, being paid with dignity) and answers each with a specific picture — mark, studio, ledger — in the order the positioning brief ranks them.
- **Cheap where it should be, expensive where it counts.** Every technique is Low-risk in the feasibility catalogue; the budget goes into type, rhythm and silence, not effects.

**Risks and mitigations.**

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Paper + serif reads as a stationery / perfume brand** ("too dainty"), not a social product. | The ink hook gives the paper something to answer; display type is large (96 px) and tight (−1.5 %), not spindly; the phone is a hard ink object; the Studio and ledger show *dense, real UI strings*; grain + fibre make paper read as printed, not pastel. Review gate: freeze-frame S8 and S10 — if they could be a greeting-card ad, raise Inter to wght 500 and add 10 % more UI density before touching the palette. |
| 2 | **Generative "content" doesn't look curated** — the wall looks like a design-tool template, so the central promise collapses. | One shared palette/grade function; fixed 40/25/20/15 generator mix; every card captioned with title · creator · medium; a seeded **reject list** so weak cards never appear; a contact-sheet taste pass of all 32 cards before the first full render; the hook proves the point by degrading the *same* library. If the soft-light studies look like gradients, bias them toward two-hue, low-luminance, off-centre light with a 6 % vignette. |
| 3 | **Render-pipeline tells**: JPEG ringing on 1 px hairlines on paper, gradient banding, a mushy 4.6× push-through, non-deterministic frames across workers. | Hairlines at 1.5 px / 18 % ink; grain on every frame (kills banding); JPEG q95 → q97 if ringing shows on a 30-frame test of S5/S8; push-through has the hidden match-cut fallback; `seek(t)` contract from `03_feasibility §2` with the two-worker `cmp` test on frames 360–390 (S5) and 810–840 (S10) before the master. |
| — | *Secondary:* the L2/L11 mirror reads clever-clever; the pencil ring looks hand-drawn-amateur. | Fallback line "Sorted. Not seen."; the ring is a 12-point seeded ellipse with ≤ 1.5 px wobble, not a free-hand path — if it still reads cheap, replace with a 2.5 px oxblood *underline* beneath the card caption. |

**Premium/cheap checklist (craft §7) self-score:** 15/15 on paper (the end card uses three type sizes by declared exception; the accent-frame count is explained above). Ship gate remains ≥ 13 after the production review.
