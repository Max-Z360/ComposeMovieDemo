# Concept — CREATOR STUDIO angle

**Concept title:** *The Instrument*
**Placeholder brand:** **LUNE** (from 01_positioning; kept as a single `BRAND_NAME` constant; wordmark is live type, not an asset, so the swap is one edit — see §3.6 for the ORIEL/SABLE fallbacks)
**Master tagline:** **Chosen, not ranked.**
**Film spine line (studio angle):** *Make it here.*
**Duration:** 42.0 s picture + 1.0 s black tail (file = 43 s). Master 1920×1080 @ 30 fps, 16:9, no letterbox bars.
**Tempo grid:** 84 BPM · beat 0.714 s · bar 2.857 s (bars at 0 / 2.857 / 5.714 / 8.571 / 11.429 / 14.286 / 17.143 / 20.000 / 22.857 / 25.714 / 28.571 / 31.429 / 34.286 / 37.143 / 40.000).

---

## 1. The idea (one paragraph)

A creator's single piece of work sits alone in the dark, lit like an object on a bench — then it is buried under an avalanche of grey, flickering, low-grade thumbnails until it is gone. Black. One hardware click. A tungsten hairline draws across the frame and the work comes back, full-bleed and bright, on the screen of a device that behaves like a pro instrument — a camera body, a synth, a colour console — not a feed. We stay inside that instrument: a ridged dial grades the image, a crop frame snaps to a detent, a title is set in a serif, a price slider lands on a number, "Publish" fills with light, a supporter quietly joins. Then the same piece appears printed on paper, chosen for an issue, before the light leaves the page and the last sliver becomes the LUNE mark. **The single promise:** *here, your work is treated like work — made with real tools, chosen by people, and paid for.* The viewer (a reach-fatigued creator) should feel the specific, physical satisfaction of a well-made tool — the detent, the click, the number landing — and read it as respect.

Arc (from positioning §5): recognition of fatigue (0–8.6 s) → exhale (8.6–11.4) → desire (11.4–17.9) → capability (17.9–28.6) → dignity (28.6–35.7) → invitation (35.7–42).

---

## 2. Why "instrument", not "app"

Every incumbent's launch film shows *people holding phones* and *a feed scrolling*. We show **controls** — the thing creators already love about a camera, a mixing desk, Lightroom's panel. The product is a surface you *operate*, and every operation is shot like a macro of hardware: hairlines, ridges, detents, readouts. The feed exists (it's the proof of curation, §4 shot 6) but it is a gallery you walk through on the way to the bench, not the hero. This is the one framing none of Instagram / RedNote / OnlyFans can borrow: they are places you *post to*; LUNE is a thing you *make with*, that then shows the result to the right people and pays you.

---

## 3. Visual language

### 3.1 Palette (hex)

| Role | Name | Hex | Notes |
|---|---|---|---|
| Base field | Ink | `#0A0A0C` | Film base; blacks lifted in grade to ≈ `#0E0E10` |
| Surface | Anodized | `#121215` | Console/phone body; 2 % vertical brushed gradient (`repeating-linear-gradient`, 1 px pitch, ±1.5 % L) |
| Panel | Slate | `#1A1A1F` | Tool tray, feed cards' chrome |
| Hairline | — | `rgba(255,255,255,.12)` | All rules, ticks, bezels; `.06` for card borders |
| Display text | Bone | `#ECE6DA` | Serif lines on dark |
| Caption text | Ash | `#9A9AA3` | UI labels, credits, readouts |
| **Accent (≤ 5 % of frames)** | **Tungsten** | **`#D2A45A`** | Dial indicator, slider knob, mode-strip active tab, "Publish" fill, supporter dot, the logo sliver. Never on text, never as a glow. |
| Paper interlude | Paper | `#F1EDE6` | Shot 13 only; ink text `#161616`, captions `#6E6A63` |
| Content world (inside cards) | Umber / Clay / Rose-dust / Slate-blue / Moss / Bone | `#6B4A3A` `#B8755A` `#C9A196` `#4A5C6E` `#5A6B52` `#E8DFD0` | All cards graded through one `palette(h,s,l)` function: hue family ± 30°, shared black point `#0E0E10`, soft highlight roll-off, +4 % warmth in mids |
| Junk world (tension only) | — | clipped white `#FFFFFF`, acid magenta `#FF2BB0`, cyan `#19D7FF`, grey `#3A3A3A` | Deliberately outside the grade; the only saturated colour in the film, and it is the enemy |

One grade across the film (lifted blacks RGB 10–12, roll-off, warm mids) applied as a final full-frame `mix-blend-mode` layer in page plus `-tune film` at encode.

### 3.2 Typography (Google Fonts, all already in `fonts/`)

Exactly two families on screen + mono for readouts (the "tiny label" exception; it is what makes the instrument read as an instrument).

| Role | Face | Setting | Size @1080p |
|---|---|---|---|
| Display (emotion lines, wordmark) | **Fraunces** variable | `opsz 144`, `wght 300`, `SOFT 0`, tracking −1.5 %, leading 1.0, left-aligned | **96 px** (8.9 %); wordmark 120 px (11 %) |
| In-card title (shot 10 only) | Fraunces Italic | `wght 300→400` over 700 ms (the single variable-weight moment) | 44 px inside the 420×560 card |
| UI / captions / CTA / tagline (end) | **Geist** | `wght 500`, tracking +4 % on caps labels, +1 % otherwise; `tabular-nums` | **22 px** (2.0 %) |
| Readouts (console numbers) | **Geist Mono** | `wght 400`, tabular | 20 px, Ash |
| zh swap | Noto Sans SC | `wght 300` display / `500` captions | same sizes |

Layout: **everything left-aligned to one margin column at x = 172 px (9 %)**, baseline grid 8 px. Display lines sit at y = 744 (lower third) in dark scenes, y = 696 on paper; captions at y = 792. Instrument UI occupies the right 62 % of the frame. The end card is left-aligned too (masthead feel) — we never mix centred and margin layouts.

Type motion: masked rise 600 ms expo-out (`cubic-bezier(.16,1,.3,1)`) with 50 ms word stagger for every serif line; exits 380 ms expo-in with 6 px drift *up* (the film's direction of travel); the wordmark uses blur-in (10 px → 0, scale 1.03 → 1, 650 ms quint-out) plus one SVG `clipPath` light sweep. No typewriter, no bounce, no shadow/stroke/glow/gradient text.

### 3.3 Motion language (5 rules)

1. **Light leads, objects follow.** Every transition starts with a light event (a hairline drawing, a key-light sweep, a glare crossing the bezel, a page darkening) and the object moves 80–120 ms *after* the light. Static gradients are forbidden; the key light is a gradient mask moving ≈ 1 px/frame.
2. **Controls move like hardware.** Dials: 500–700 ms expo-out, overshoot ≤ 1.5 °. Sliders and segmented controls snap to **detents** (stepped, not continuous) with a 25 ms tick. Toggles: 400 ms. Nothing bounces, nothing pops from 0 %; every element enters from 94 % scale or from a mask.
3. **One direction of travel: up and in.** The camera always pushes toward the screen (1–3 % per shot). The single reversal is the tension beat, where the world pulls *away* from the creator's work; the turn resets to black.
4. **One carrier for the whole film.** The hero card (a warm "still-life" abstract, 4:5) is the only object that survives every transform: lit card → buried → phone screen → full-bleed → feed cell → editor canvas → graded/cropped/titled → published post → printed page → (its last light) → logo sliver. Match-cut on position and shape at every hand-off.
5. **Rest.** Each shot holds its last 20 % with nothing new entering; no two elements start or stop on the same frame (offsets 60–220 ms).

### 3.4 Textures, glass, light

- **Grain:** 8 pre-baked 512² seeded tiles, `createPattern`, offset from `hash(floor(t·24))`, `mix-blend-mode: soft-light`, 4 % (6 % in shots 1–3, 5 % on paper, slightly stronger in shadows via a second `overlay` pass masked to luminance < 30 %).
- **Vignette:** 12 % ellipse; 20 % in shots 1–3; 6 % on paper.
- **Glass (one material, used twice):** the editor's floating tool tray (shots 8–11, one continuous element) and the supporter notification (shot 12). Fake glass per feasibility §1.3: `rgba(255,255,255,.07)`, 1 px `.14` hairline, inner top highlight, pre-blurred low-res copy of the background canvas clipped to the panel. No `backdrop-filter` anywhere.
- **Light:** one tungsten key light (`#D2A45A` at 14 % over a 900 px soft radial, baked into the low-res background canvas) that drifts left→right across the console at ~1 px/frame; bloom only from the hero card's own edge-light, baked into its canvas (< 8 %). Never on text.
- **Surfaces:** anodized brushed gradient on body/console; 1 px hairline tick rings (SVG) on dials; ridged dial edge via `repeating-conic-gradient` (72 ridges, ±6 % L).
- **Letterbox:** none. 16:9 throughout; the instrument needs the area.

### 3.5 Device treatment

The phone appears **once**, large and lit (shot 5): CSS 3D, `perspective 1800px`, `rotateY(-18°) rotateX(6°)`, height ≈ 78 % of frame, right of the margin column; bezel radius 56/46 px, 1 px edge highlight, one 60/120 px soft shadow, glare gradient whose angle tracks the key light, mirrored reflection masked to 60 % and blurred 4 px on the dark floor. It rises from 94 % scale / +40 px and settles over 1.1 s while the camera pushes in 3 %. In shot 6 the push-in continues until the bezel leaves frame and the rotation eases to 0 — **the UI goes full-bleed and flat and stays flat for the rest of the film** (Linear/Apple treatment). No spin, no second phone, no hands.

### 3.6 "Content" without photographs

A seeded library of 24 cards (420×560, built once at `READY`, identical on every worker), all graded through the one palette function so the feed reads as *curated*:

- **Soft-blob still lifes (40 %)** — 3–5 radial gradients in an analogous pair (clay/rose-dust, slate-blue/bone, moss/umber), `lighter` blend, drawn at 105×140 and upscaled, with a single bright edge-light and a 10 % vignette. Reads as studio photography of fabric, ceramics, skin tones, light on a wall.
- **Flow-field prints (25 %)** — 2 500 short polylines on a `sin/cos` angle field, 1 px, 25 % alpha, umber ink on bone or bone on ink.
- **Typographic posters (20 %)** — one Fraunces word or numeral ("No. 4", "Ouvert", "Winter, I", "§") rotated 90°, cropped by the card; a Geist caption line. Real type = real editorial work.
- **Geometric (15 %)** — 3–6 rectangles/arcs on a strict grid, ink/bone/one umber.

Every card carries a credit line in Geist 20 px (seeded name list: *Mara Lindqvist, Tomas Reyes, Ines Marlow, Kenji Sato, Aurelie Bastien, Noor Haddad…*) and a tiny curation tag ("Selected · Issue 12"). **The hero card** is a soft-blob still life in clay / rose-dust / umber with a warm edge-light at upper-right; its parameters are exposed (`warmth`, `exposure`, `crop`, `title`) so shots 8–10 re-render it per frame as pure functions of `t` at 105×140 → upscale (cost ≈ 1 ms).

**Junk cards** (tension only): 18 cards generated at 64×48 with hard RGB noise, clipped whites, acid magenta/cyan bars, a blurry blob, upscaled with `imageSmoothingEnabled=false` (blocky), sitting 4:3 inside a 9:16 black tile with a small play-triangle and a "0:07"-style duration chip — generic low-grade video, recognisable as a *category*, never as a specific platform's chrome.

Brand swap: `BRAND_NAME = "LUNE"`; the mark is a separate `<svg id="mark">` (a 1 px hairline circle with a tungsten crescent sliver). If the name becomes ORIEL, swap the mark for a thin rectangular frame; SABLE keeps the circle without the sliver.

---

## 4. Storyboard

Copy rules: 9 counted lines (8 display + 1 notification), each ≤ 6 words / ≤ 32 chars, each readable ≥ 1.2 s (dwell computed per craft §2 incl. +0.3 s for animated entry). The console's **mode strip** (`GRADE · FRAME · TYPE · PRICE`, one persistent segmented control, active tab in Tungsten) and wordmark-in-top-bar are UI chrome, not lines; ≤ 3 UI strings visible per shot.

| # | In → Out | Dur | What we see (drawable: HTML/CSS/canvas/SVG) | On-screen copy (exact) | Motion | Sound cue |
|---|---|---|---|---|---|---|
| 1 | 0.000 → 3.571 | 3.57 | **HOOK.** Ink field, 6 % grain, 20 % vignette. At 0.4 s the hero card (soft-blob still life, 4:5, ≈ 30 % frame height) fades up from 94 % at right-centre, lit by a soft key light from upper-right; a thin shadow under it as if on a bench. From 2.4 s, dim junk tiles begin arriving from all four edges toward it (parallax back layer), 60 ms stagger, 8–12 visible by the cut. | **Made more. Seen less.** (Fraunces 96, in 0.9 s, out 3.3 s; 4 w / 21 ch; dwell 2.4 s) | Card push-in 2 % over the shot; key light drifts 1 px/f; tiles slide in expo-out 700 ms, scale 0.96→1. | Room tone (−40 dB LP noise) + 55 Hz sub drone fading in from −∞; near-silence ≥ 1.5 s. Hats enter as 8ths at 2.857 at −24 dB. |
| 2 | 3.571 → 6.429 | 2.86 | **TENSION A.** Hard cut on beat 5. The field is now a 12-column wall of junk tiles (≈ 90 visible, DOM, static canvases). Each frame `hash(frame)` picks 3–4 tiles to flash brighter (flicker). The hero card is still visible, now ¼ size, slightly off-centre, dimming to 60 %. | — | **Camera pulls back 4 %** (the film's single reversal); wall drifts down-left 1.2× parallax; flicker at 24 fps cadence. | Hats go to 16ths at 4.286; filtered noise bed swells (LP fc 300→1 200 Hz); pad enters very dark (fc 300 Hz, −18 dB) at 5.714. |
| 3 | 6.429 → 8.571 | 2.14 | **TENSION B.** Cut to a tighter crop of the wall (tiles ≈ 2× larger, blocky noise clearly visible, duration chips, play-triangles). The hero card is pushed down out of frame by tiles layering over it; the last we see is its warm edge-light at the bottom edge. Flicker peaks. | — | Wall continues down-left; tiles slide over the card with 40 ms stagger; vignette 20 %. | Noise swell to fc 6 kHz, hats 16ths at −18 dB, sub rises; everything **hard-stops at 8.571**. |
| 4 | 8.571 → 11.429 | 2.86 | **TURN.** Hard cut to Ink. Nothing for 0.7 s (full drop-out). At 9.286 a small hardware toggle (SVG, 44 px, anodized, hairline bezel) at the margin column flips ON; 80 ms later a 1 px Tungsten hairline draws left→right across the full width at y = 540 (SVG `stroke-dashoffset`, 900 ms expo-out) — the instrument waking. The hairline is the carrier into shot 5 (it becomes the phone's top edge). | — (no line; the click speaks) | Toggle 400 ms expo-out; hairline 900 ms; field stays black. | **Silence 8.571–9.286.** Hit A at 9.286: hardware click (25 ms band-passed noise 2–4 kHz + 80 Hz sine blip, 60 ms, dry). Nothing else until the downbeat. |
| 5 | 11.429 → 15.000 | 3.57 | **REVEAL.** On the downbeat the hairline stretches into the top bezel edge of a CSS 3D phone (−18° Y / 6° X, 78 % frame height, right of margin) that rises from 94 % / +40 px and settles. Screen: the **hero card full-bleed in LUNE's post view** — bright, graded, with credit "Mara Lindqvist" and tag "Selected · Issue 12" beneath; top bar shows the wordmark `LUNE` at 22 px (brand small by 11.6 s). Key light sweeps across the glass; reflection on the floor. | **Only the work worth seeing.** (in 11.9, out 14.6; 5 w / 27 ch; dwell 2.7 s) | Phone settle 1.1 s expo-out; push-in 3 % across the shot; glare angle tracks the key light; line masked rise. | **Downbeat 11.429:** pad opens (fc jump to 1.2 kHz, A-minor-9), sub lands on A1, soft thump (120→60 Hz). Delay 375 ms on pad. |
| 6 | 15.000 → 17.857 | 2.86 | **PROOF — THE FEED.** Continuous transform: the push-in continues until the bezel leaves frame and rotation eases to 0 → UI is full-bleed and flat. The post view scrolls down (`translateY`) into the curated feed: 2-column masonry of library cards with credits and "Selected" tags, generous gutters, no counters, no autoplay. The hero card is the first cell, now a grid member. | **Chosen, not ranked.** (in 15.3, out 17.5; 3 w / 19 ch; dwell 2.2 s). "Chosen" firms `wght 300→500` over 700 ms. | Bezel exit + flatten 1.4 s (slow symmetrical bezier); feed scroll 1.6 s expo-out, resolves on bar 6 (17.143); 3-layer parallax 1 : 1.6 : 2.2. | Hit on 15.000 (beat 21, soft thump); chord change Am9 → Fmaj7 at 17.143; hats 8ths at −22 dB; one tri layer enters at −14 dB. |
| 7 | 17.857 → 19.286 | 1.43 | **HINGE — INTO THE STUDIO.** The hero card lifts out of the grid toward camera (scale 1→1.45, z-up), the feed falls back 24 px and dims to 35 % (rack-focus blur 4 px on the back layer only). The card lands as the editor canvas at right; beneath it the **console strip** slides up from a mask: anodized surface, the mode strip `GRADE · FRAME · TYPE · PRICE` (GRADE active, Tungsten), one ridged dial, a histogram (canvas), two mono readouts. The glass tool tray (material use #1) fades in at 92 %. | **Make it here.** (in 18.0, out 19.85 — persists 0.55 s into shot 8 before the GRADE readouts change; 3 w / 13 ch; dwell 1.85 s) | Card lift 800 ms expo-out; feed recede 900 ms; console strip masked rise 700 ms (starts 120 ms after the card lands). | Transform starts on beat 25 (17.857); UI tick 1 (paper tick, 30 ms, −16 dB) when the console lands at 18.7. |
| 8 | 19.286 → 21.429 | 2.14 | **GRADE.** Macro of the dial (ridged edge, 24 tick marks, Tungsten indicator) with the hero card above it. Readouts `EXPOSURE +0.30` and `WARMTH 5600 K` in Geist Mono. The dial rotates 38° and the card visibly re-grades (warmer, brighter; re-rendered per frame from `warmth(t)`, `exposure(t)`); the histogram slides right. | mode strip: **GRADE** (chrome) | Dial 600 ms expo-out from 19.55, 1.2° overshoot; readouts interpolate from `t` (never from tween state); push-in 2 %. | UI tick 2 on dial engage 19.55 (−16 dB); detent tick at 20.15; pad fully open, hats 16ths at −20 dB. |
| 9 | 21.429 → 23.571 | 2.14 | **FRAME.** Mode strip active tab moves to FRAME (Tungsten slides 300 ms). A hairline crop rectangle with corner marks and rule-of-thirds lines (8 % white) sits on the card; a segmented ratio control `4:5 · 1:1 · 3:4` snaps 4:5 → 1:1. The card re-composes (crop parameter `crop(t)`), the gutters tighten, the card's edge-light now sits exactly on a thirds line. | mode strip: **FRAME** (chrome) | Crop frame tightens 550 ms expo-out; segmented detent snap 180 ms; push-in 2 %. | Detent tick 3 at 21.75; chord → Cmaj7add9 at 22.857. |
| 10 | 23.571 → 25.714 | 2.14 | **TYPE.** Active tab → TYPE. A title rises onto the card's lower-left from a mask in Fraunces Italic: *Still life, no. 4*; beneath it Geist credit *Mara Lindqvist · 2026*. A weight slider nudges 300 → 400 (the variable-font moment; block is left-aligned, fixed width). Tracking settles +4 % → 0. | in-card title *Still life, no. 4* (in-card content, 4 w / 17 ch; held 1.9 s) | Title masked rise 600 ms; weight tween 700 ms quint-out; slider knob to detent 220 ms; push-in 1.5 %. | Detent tick 4 at 24.05; tri layer up −12 dB; hats −18 dB (tempo peak zone). |
| 11 | 25.714 → 28.571 | 2.86 | **PRICE.** Active tab → PRICE. The console strip becomes one long horizontal slider `MONTHLY` with detents `2 · 4 · 6 · 8 · 12`, a Tungsten knob, and a mono readout `4.00 USD` that interpolates (computed from `t`) as the knob travels from 2 to 4; one small toggle `Tips · on`. The card above is finished (graded, cropped, titled). No dollar signs anywhere. | **Your work. Your terms.** (in 26.0, out 28.4; 4 w / 22 ch; dwell 2.4 s) | Knob travel 650 ms expo-out from 25.95 landing on the detent; readout tabular roll; push-in 2 %. | Detent tick 5 at 26.6 (the last UI tick); chord → G6/B at 28.571 feels like a lift. |
| 12 | 28.571 → 31.429 | 2.86 | **PUBLISH — DIGNITY.** A wide hairline button `Publish` at the console's right end **fills with Tungsten left→right** (500 ms, the one moment the accent exceeds a dot). The card lifts (carrier) into the live post view with its credit and price chip. At 29.6 the glass notification (material use #2) slides down from the top edge with a small Tungsten dot. Then everything strips back — the tool tray fades, the feed behind is quiet. | **Ines M. · Supporter** (notification, in 29.6, out 31.4; 3 w / 19 ch; dwell 1.8 s) | Fill 500 ms linear-with-ease (a light event, so linear is allowed); card lift 700 ms expo-out; notification 500 ms expo-out, 8 px drift; push-in 1.5 %. | Hit B at 28.75: soft reversed-air swell 300 ms into a muted tick (the Publish sound). Sub side-chain dip −6 dB / 150 ms; pad LP starts closing to 700 Hz; hats drop out at 29.286. |
| 13 | 31.429 → 35.714 | 4.29 | **THE PAGE (paper interlude).** Hard cut on bar 11 to Paper `#F1EDE6`, grain 5 %. The finished hero card sits as a printed plate (≈ 62 % frame height, right of margin, 1 px ink hairline, soft paper shadow); a thin caption column reads *Mara Lindqvist — Still life, no. 4* / *Selected · Issue 12*. A soft daylight gradient drifts across the paper. From 34.9 the page darkens from left to right like a moon phase — the light leaving — until only a thin lit sliver remains at the plate's right edge at 35.714 (carrier into the logo mark). | **Seen by the right people.** (ink, in 31.9, out 34.6; 5 w / 25 ch; dwell 2.7 s) | Push-in 2 % over 4.3 s (the one deliberately long hold; the light move keeps it alive); darkening wipe 800 ms slow symmetrical bezier. | Music strips to pad + sub, LP down to 500 Hz, delay tails; chord → Fmaj7 at 31.429; riser (noise LP 200 → 8 000 Hz, u²) begins 35.0 and ends exactly on 37.143. |
| 14 | 35.714 → 42.000 | 6.29 | **LOGO / CTA.** The sliver becomes the Tungsten crescent inside a 1 px hairline circle (the mark, 56 px) at the margin column, y = 492. The wordmark **LUNE** (Fraunces 300, 120 px) blur-rises beside/below it, reaching 90 % of position at **37.143**; a `clipPath` light sweep crosses it 37.2–38.0. Tagline and CTA appear beneath in Geist 22 px (Bone, then Ash). Picture holds, then fades to black 41.0–41.8; black to 42.0; +1.0 s black tail. Nothing else on the card: mark + wordmark + two lines. | **Chosen, not ranked.** (Geist 22, in 37.7, holds to 41.0; 3 w) · **Now open for creators.** (Ash, in 38.9, holds to 41.0; 4 w / 22 ch) | Mark morph 600 ms; wordmark blur-in 650 ms quint-out; sweep 800 ms; lines masked rise; whole card push-in 1 % over 4 s; fade-out 800 ms expo-in. | **Hit C at 37.143 (onset = wordmark at 90 %):** sub thump 120→60 Hz + additive chime (A5/E6, partials ×[1, 2.01, 3.0, 4.2, 5.4]) + the riser's reversed-air tail. Reverb tail only after 38.5; **−∞ by 40.9; silence 40.9–43.0.** |

Checks against the craft guide: product visible at 11.4 s (≤ 12) ✓ · brand small at 11.6 s, big at 37.1 s ✓ · 3 consecutive negative shots max (1–3) ✓ · peak tempo 23.6–28.6 s (56–68 % — slightly early; fine, the paper beat needs the room) · shortest shot 1.43 s (hinge), longest hold 4.29 s with light moving ✓ · ≈ 60 % transforms (5→6→7→8→9→10→11→12, 13→14) / 40 % cuts (1|2|3|4|5, 12|13) ✓ · silence ×3 (open, turn, tail) ✓ · one glass material ×2 ✓ · accent ≈ 4 % of frames ✓.

---

## 5. Music and sound (all synthesized in Node → WAV)

**Tempo / key:** 84 BPM, A minor (Am9 home), 48 kHz, one cue of 43 s. Shared `cues.json` drives both the GSAP timeline and the synth:

```json
{ "bpm": 84, "fps": 30, "duration": 43.0,
  "bars": [0,2.857,5.714,8.571,11.429,14.286,17.143,20.0,22.857,25.714,28.571,31.429,34.286,37.143,40.0],
  "cuts": [3.571,6.429,8.571,11.429,15.0,17.857,19.286,21.429,23.571,25.714,28.571,31.429,35.714],
  "hits": { "click":9.286, "downbeat":11.429, "feed":15.0, "publish":28.75, "logo":37.143 },
  "ticks": [18.7,19.55,20.15,21.75,24.05,26.6],
  "silence": [[0,1.6],[8.571,9.286],[40.9,43.0]],
  "chords": [[11.429,"Am9"],[17.143,"Fmaj7"],[22.857,"Cmaj7add9"],[28.571,"G6/B"],[31.429,"Fmaj7"],[37.143,"Am9"]] }
```

**Structure (aligned to the storyboard):**

| Time | Picture | Audio |
|---|---|---|
| 0.000–2.857 | Hook | Room tone (seeded noise, LP 400 Hz, −40 dB) + 55 Hz sine sub fading in over 2.5 s to −18 dB. ≥ 1.5 s near-silence satisfied. |
| 2.857–5.714 | Hook tail / Tension A | Hats: seeded noise bursts, HP 7 kHz, `exp(−t·60)`, 8ths at −24 dB, L/R alternating (Haas 10 ms). Noise bed LP sweeps 300 → 1 200 Hz. |
| 5.714–8.571 | Tension B | Hats to 16ths, −18 dB; pad enters dark (3 detuned saws ×4 notes A2–E3–G3–B3, LP fc 300 Hz, −18 dB); noise swell LP → 6 kHz, amplitude u²; sub rises to −12 dB. **Hard stop at 8.571** (all voices gated, no release). |
| 8.571–9.286 | Turn (silence) | Nothing. |
| 9.286 | Click | 25 ms band-passed noise (LP 4 kHz − LP 2 kHz) + 80 Hz sine blip 60 ms, dry, −10 dB. |
| 9.286–11.429 | Hairline | Silence except a −30 dB sub swell from 10.7. |
| 11.429 | **Downbeat** | Thump (sine 120 → 60 Hz over 80 ms, decay 300 ms); pad LP jumps to 1.2 kHz with 0.7 Hz ±300 Hz LFO, L/R fc 1 : 1.03; sub A1 at −12 dB; 375 ms feedback delay (fb 0.35, mix 0.25, 3 kHz LP in loop) on pad; Schroeder reverb mix 0.3 on pad/chime only (sub dry). |
| 11.429–17.857 | Reveal / Feed | Am9 → Fmaj7 at 17.143; soft thump on 15.000; hats 8ths −22 dB; triangle layer +1 oct −14 dB from 15.0. |
| 17.857–28.571 | Studio / feature run | Hats 16ths rising −20 → −18 dB; LP fully open (2 kHz); chords Cmaj7add9 (22.857), G6/B (28.571); **UI ticks** (paper ticks: 30 ms noise through 2–4 kHz band, −16 dB, 14 dB under music) at 18.7, 19.55, 20.15, 21.75, 24.05, 26.6 — six, of which five are detents and one is the console landing. |
| 28.571–31.429 | Publish / Dignity | Hit B at 28.75: reversed air (noise LP 6 kHz, amplitude rising u³ over 300 ms) into a muted tick; sub side-chain dip −6 dB / 150 ms; hats out at 29.286; pad LP closes to 700 Hz. |
| 31.429–35.714 | Paper | Pad + sub only, Fmaj7, LP 500 Hz, delay tails audible; riser 35.0 → 37.143 (noise LP 200 → 8 000 Hz exponential, amplitude u², plus a sine rising one octave A4→A5). |
| 37.143 | **Logo hit** | Sub thump (120 → 60 Hz, 300 ms) + additive chime at A5/E6 (partials ×[1, 2.01, 3.0, 4.2, 5.4], amp 1/(j+1), decay `exp(−t·(2+2j))`) + the riser's last 400 ms acting as the reversed-air lead-in. Am9 pad hit with 3 s release. |
| 37.143–40.9 | Hold | Pad release + reverb/delay tails only; −∞ by 40.9. |
| 40.9–43.0 | Tail | Digital silence. |

**Five sound-design hits:** (1) the hardware click at 9.286 — the only dry, close sound in the film; (2) the downbeat thump at 11.429; (3) five detent ticks in the feature run (18.7–26.6) — the instrument's tactility; (4) the Publish swell-into-tick at 28.75; (5) the logo thump + chime at 37.143. One logo sound only; no per-element swooshes.

**Mix:** raw render aimed at ≈ −16 LUFS / peaks −3 dBFS; `loudnorm` two-pass `linear=true` to −14 LUFS / −1 dBTP (LRA target 7–9 — the drop-outs give it); re-measure the muxed MP4 with `ebur128=peak=true`. Cuts land on or 1–2 frames after accents, never before.

---

## 6. Why this beats generic "social app" ads — and 3 risks

**Why it wins**
- **It shows a thing you operate, not a feed you watch.** Dials, detents, readouts and a Publish button that fills with light give the viewer a *physical* satisfaction that no "people laughing at phones" montage can; creators recognise their own tools and read it as respect.
- **Every claim is evidence, not slogan.** "Chosen, not ranked" is shown as a feed with credits and curation tags and no counters; "Your terms" is a slider landing on a number; "Seen by the right people" is a printed page. No "no algorithm" banner, no crossed-out logos, no metric theatre.
- **One carrier, one direction, one light.** The same piece of work travels from buried to printed; the film reads as one continuous shot with three cuts, which is what separates it from template motion-graphics.
- **The constraints are the style.** Generative still-lifes, flow-field prints and typographic posters *are* what a curated art/design feed looks like; the junk wall is pure code noise. Nothing here pretends to be a photograph, so nothing looks like a stock placeholder.
- **Monetization is shown with dignity** (a price detent, a supporter joining, no dollar rain) — the OnlyFans adjacency reads as patronage, the RedNote adjacency as editorial.

**Risks and mitigations**
1. **"Dark + accent + UI" slides into crypto/gaming.** → Accent is a desaturated tungsten, never a glow, never on text, ≤ 5 % of frames; bloom only baked into the hero card's own edge-light (< 8 %); blacks lifted; serif at light weight; the paper interlude breaks the dark field once. Checklist §7 of the craft guide is scored at review: ship only at ≥ 13.
2. **The feature run becomes a product demo** (too many strings, too fast, too clever). → Exactly three tool beats + one price beat, one interaction each, ≤ 3 UI strings per shot, no feature names beyond the mode strip, every control holds its last 20 %; if the review contact sheet shows a frame that reads as a UI kit, that control is deleted, not polished.
3. **Generative cards read as gradient wallpaper / the junk wall reads as a parody.** → All library cards pass through one palette function with a shared black point and an edge-light; 45 % of the feed is typographic/flow-field work with real titles and credits so it reads as a design-school annual, not a Dribbble shot; the junk tiles use no platform chrome (no icons, no logos, no familiar layouts) — only blockiness, clipped colour and duration chips, i.e. a *category* of bad video.

**Production notes for the Opus pass (determinism):** the hero card's per-frame regrade (shots 8–10) and the readouts must be pure functions of `t` (`warmth(t)`, `exposure(t)`, `crop(t)`, `price(t)` via `smoothstep` segments), rendered at 105×140 and upscaled; the junk-wall flicker uses `hash(floor(t·24))`; scenes toggle via `display:none` `set()` calls; JPEG q95 frames; verify a 30-frame range twice with different `--workers` and `cmp`. All strings in `COPY = {en, zh}`, `BRAND_NAME` as one constant, mark as one SVG component.
