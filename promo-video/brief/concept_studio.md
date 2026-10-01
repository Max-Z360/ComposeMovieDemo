# Concept C — "Instrument" (Creator Studio angle)

| | |
|---|---|
| **Concept title** | **Instrument** — the app treated as a pro instrument on a dark bench, seen from the creator's point of view |
| **Brand name** | **Tipmi** (final). Wordmark set lowercase: **tipmi** (see §3.2) |
| **Tagline (end line)** | **Built for the work.** — the master line *Chosen, not ranked.* is used inside the film at the curation beat (shot 11) and can be swapped into the end-card slot without re-timing (both are 3–4 words) |
| **CTA** | Now open for creators. |
| **Duration** | **42.0 s** total (41.0 s picture + 1.0 s black/silent tail); 1920×1080, 16:9, 30 fps, master `DURATION = 42` |
| **Tempo grid** | 84 BPM · beat 0.714 s · bar 2.857 s · bar boundaries at 0 / 2.86 / 5.71 / 8.57 / **11.43** / 14.29 / 17.14 / 20.00 / 22.86 / 25.71 / **28.57** / 31.43 / 34.29 / **37.14** / 40.00 |
| **On-screen lines** | 12 (incl. tagline + CTA), max 4 words, max 22 chars; UI strings are part of the mockup and live in the same `COPY` object |

---

## 1. The idea

A creator spends hours on one piece and watches it disappear in seconds. In this film the piece never disappears again: it is the single carrier object of a 41-second continuous take, and the viewer *is* the creator — first person, hands never shown, every move is theirs. Out of the dark, Tipmi powers on around the work like a well-made instrument (part camera, part synth, part DAW): a dial with detents, a live scope, a type ruler, a long-press send. Each tool beat is one physical gesture that feels good — a ratchet, a snap, a switch — and the last gesture is being paid, shown as quietly as a tile on a bench. The viewer should feel **competence and calm**: *this is a place built for people who make things, and it treats the making — and the maker — seriously.* The single promise: **Tipmi is built for the work** — to make it, to be chosen for it, to be paid for it — and then it gets out of the way so you can go back to work.

What it is *not*: a demo. The UI never explains itself, there are only three tool verbs, no cursor arrows, no spinning phone, no metrics ticking up, nothing bright except one amber lamp.

---

## 2. Visual language

### 2.1 Palette (dark decided once; no paper interludes — the "breath" comes from stripping the UI, not changing the world)

| Role | Hex | Use |
|---|---|---|
| Bench black | `#0B0B0D` (grades to ≈ `#101012` after lifted blacks) | Field for every shot |
| Surface | `#141417` | Bench top under the key light |
| Panel | `#1B1B20` | Studio panels, phone bezel interior |
| Hairline | `rgba(255,255,255,.10)` | 1 px panel edges, dial ticks (inactive) |
| Ink | `#ECE8E1` (warm bone) | All display type, wordmark |
| Ink 2 | `#8F8C87` | UI labels, captions, CTA |
| Ink 3 | `#55534F` | Inactive readouts, dimmed UI |
| **Accent — "lamp"** | **`#D8A04A`** (desaturated amber, like a status LED / darkroom safelight) | ONLY: the status LED, the dial's active tick, the Edition toggle flash, the SEND ring, the "Selected" dot, the two i‑dots of the wordmark. Budget: < 0.3 % of pixel area in UI frames; a larger "moment" (SEND ring, logo dots) in ≤ 5 % of frames |
| Content world | clay `#B8674A` · bone `#E6DCCB` · slate `#3A4A5C` · moss `#5B6B55` · indigo `#2A2F4F` | Every generated card is graded through one palette function: hues anchored at 20° (clay) and 220° (slate) ± 30°, shared black point `#101012`, soft highlight roll-off. The feed must look like one curator chose it |

Grade (one pass over the whole film, done in-page): blacks lifted to RGB 10–12, midtones +2 % warmth, no saturation above 60 % anywhere except inside a card. Instagram magenta/orange and XHS red are absent by construction.

### 2.2 Typography (Google Fonts, already in `fonts/`)

| Role | Face | Size @1080p | Settings |
|---|---|---|---|
| Voice lines (all 12 lines + tagline) | **Fraunces** variable, `opsz 144`, `wght 300`, `SOFT 30` | **96 px** (8.9 % of frame height), leading 1.0 | tracking −1.5 %, left-aligned at x = 173 px (9 % margin), baseline on the 8 px grid at **y = 236** for every shot (upper-left negative space, above the bench UI); only the end card moves the baseline |
| UI labels / captions / CTA | **Geist** `wght 500` | **22 px** (2 %) | caps, tracking +5 %; ≤ 3 words per label (GRADE · FRAME · PRICE · SEND, Selected, New supporter) |
| UI body (names, titles in feed, readouts) | **Geist** `wght 450` | 26 px | sentence case; readouts use `font-variant-numeric: tabular-nums` (no third family for numbers) |
| One mono label | **Geist Mono** `wght 400` | 20 px | the single tiny label "tipmi studio · 1.0" top-left of the studio UI; nowhere else |
| Wordmark | **Geist** `wght 500`, lowercase | 176 px (x‑height ≈ 92 px) | tracking −2 %; built as an SVG from `BRAND_NAME` at build time (§2.6) |
| zh swap | **Noto Sans SC** `wght 300` (lines) / `450` (UI) | same sizes | `?lang=zh` swaps the `COPY` set and the display family only; timeline untouched |

Exactly two families on screen at any time (Fraunces + Geist); Geist Mono appears once, at label size.

### 2.3 Motion language (5 rules)

1. **One direction of travel.** Everything in the film advances *up and toward the camera* (push-ins of 1–3 % on every plate, panels rise from below, the card lifts up and out, the wordmark rises). The only reversal is the hook's "vanish" (shot 2), where the card falls *away* — that is the problem, and the film never moves backwards again.
2. **Instrument physics.** Controls move in **detents**: the dial, the stepper, the crop and the toggle tween in quantized steps with expo-out (`cubic-bezier(0.16,1,0.3,1)`) between steps, 120–220 ms. Nothing in the UI floats or eases-in-out "like PowerPoint". Every detent has a sound; every sound has a detent.
3. **One carrier, never cut away.** The hero piece (one generated card) is on screen from frame 0 to 37.1 s. It develops → vanishes → returns → is graded → framed → priced → sent → chosen → supported → replaced by the next blank tray. Every transition is a transform of that object (match-cut on shape and position); hard cuts exist only in the tension beat, at the turn, and into the logo.
4. **Light is the camera.** A single key light (a low-res canvas gradient mask) drifts across the bench at ~1 px/frame all film long; panel top hairlines and the phone's glare follow it. No static gradients anywhere. Rack-focus (2–4 px blur on a flattened snapshot, never on a 3D ancestor) is used once, at the human beat.
5. **Enter from masks or 94 %, never from zero.** Type: masked rise 600 ms expo-out, word stagger 50 ms; exits at 60 % of entry duration, expo-in, drifting 6 px *upward* (the next shot's direction). Secondary elements offset 60–120 ms, tertiary 120–220 ms; no two elements share a start or stop frame; every shot rests ≥ 20 % with nothing new entering.

### 2.4 Textures

- **Grain**: 8 pre-baked 512² seeded tiles via `createPattern`, swapped at a 24 fps cadence (`floor(t*24) % 8`) even though the master is 30 fps, `mix-blend-mode: soft-light`, **4 %** (6 % in shots 2–4), stronger in shadows by construction of the blend.
- **Vignette**: 12 % normally, 20 % in hook/tension, one full-frame radial div.
- **Glass**: exactly one material — `rgba(255,255,255,.07)` fill, 1 px `rgba(255,255,255,.14)` hairline, top inner highlight, pre-blurred copy of our own background canvas clipped inside ("fake glass", no `backdrop-filter`). Used three times: the touch ring (shot 7), the supporter tile (shot 12), and nothing else — the phone's bottom bar is plain panel.
- **Bloom**: only from the amber lamp and the SEND ring, baked into the low-res background canvas as `lighter` radial gradients, intensity < 8 %, never on text.
- **Bench sheen**: a faint anisotropic highlight band in the low-res canvas that travels with the key light — reads as a matte surface under a lamp, not a gradient.
- **Imperfection**: the card sits slightly off the panel grid (−6 px); the human beat holds 0.8 s longer than needed; the tray in shot 13 is a hair brighter than the bench, like a real work surface.

### 2.5 Device treatment

The studio UI is shown **flat and full-bleed** (Linear/Apple style) — the camera is on the bench, the instrument fills the frame. A device appears **once**: shot 11, a CSS‑3D phone standing on the bench (`perspective 1800px`, `rotateY(-16deg) rotateX(5deg)`, 86 % frame height, 56/46 px radii, one big soft shadow, 22 % masked reflection on the bench, glare gradient tweened with the key light, 2 % push-in). It never rotates to camera, never spins; it fades out through the rack-focus in shot 13.

### 2.6 How "content" is depicted (no photos)

- **The hero piece**: one "studio light" card (420×560 source, soft radial blobs in clay/bone/slate, `lighter` blend, low-res + upscale, subtle vignette) — reads as an abstract still-life / fabric study. Its title in the app is "Still, no. 4".
- **The developing effect (shot 1)**: 24 pre-baked keyframes of a seeded dissolve (per-pixel threshold of a hashed noise tile against a rising value, darks resolve first — the way a print comes up in a developer tray), picked by `t`; no per-frame ImageData work.
- **The noisy wall (shots 2–4)**: ~300 cells from the seeded library drawn dim (35 % luminance), then degrading to flat grey rectangles — the generic feed as texture, no competitor UI.
- **The Tipmi feed (shots 11–12)**: ~10 visible cards from the seeded library in the feasibility mix (40 % soft blobs, 25 % flow fields, 25 % typographic posters in Fraunces/Geist, 10 % geometric), all through the one palette function; 20 px radius, 1 px `rgba(255,255,255,.06)` border; captions from a curated name/title list ("Noor A. — Lido, 7 am", "Tomas R. — Clay study II", "Hana I. — Quiet hours"). No like counts, no follower counts, no avatars with faces (monogram discs in Ink 3).
- **Instrument graphics**: histogram/scope = canvas recomputed from the hero card's actual pixel data at `READY` for each of the 7 grade steps; dial = SVG with 36 ticks; crop/ruler = SVG hairlines; all in Hairline/Ink 2, one amber active element.
- **Swappable constants** (one `constants.js`): `BRAND_NAME = "Tipmi"` (wordmark builder lowercases it and, if the name contains `i`/`j`, replaces each tittle with a separate amber circle — so the "status light" motif is a *feature of the builder*, not a dependency on the name); `TAGLINE`, `CTA`, `SPLIT = "90%"`, `EDITION = 25`, `PRICE = 40`, `SUPPORTER_NAME = "Mara K."`, `COPY = {en, zh}`, `cues.json`.

---

## 3. Storyboard

Grid: 84 BPM. All times in seconds from frame 0; shots start on beats, transforms resolve on the next bar. Voice lines sit at x = 173 / baseline y = 236 unless noted. Dwell = visible time including the 600 ms rise.

| # | In–Out | Dur | Beat | What we see (drawable with HTML/CSS/canvas/SVG) | On-screen copy (exact) | Motion | Sound cue |
|---|---|---|---|---|---|---|---|
| 1 | 0.00–3.57 | 3.57 | **Hook A** | Black bench, vignette 20 %. Centre-right: one card-sized rectangle (52 % frame height) *developing* — the hero piece resolves out of seeded grain, darks first (24 pre-baked dissolve frames). Bottom-left of frame: a single 6 px amber LED, steady. Nothing else. | **Hours to make.** (0.60–3.20; dwell 2.6 s) | Card push-in 2 % over the shot. Line: masked rise 600 ms expo-out, word stagger 50 ms; exits 3.20 (360 ms, expo-in, 6 px up). | Near-silence: room tone (LP noise −40 dB) + 55 Hz sub drone −18 dB. No pad, no pulse. |
| 2 | 3.57–5.71 | 2.14 | **Tension 1** | The finished card snaps smaller and falls *away* from camera into a wall of ~300 dim cards (4 columns, scrolling up). It is carried down the wall and dims to 30 %. | **Seconds to vanish.** (3.75–5.60; dwell 1.85 s) | The film's only reversal: card scale 1 → 0.42, expo-in 500 ms; wall scroll `y(t)` smoothstep, accelerating. Grain 6 %. | Hats enter on 8ths (−20 dB). Sub starts pulsing per bar. |
| 3 | 5.71–7.14 | 1.43 | **Tension 2** | Hard cut: tighter on the wall; scroll 2×; cards drawn with 3 sub-step trails (motion smear); the hero is a dim warm speck sliding down out of frame. | — | 3-layer parallax (bg 1 : cards 1.6 : vignette 2.2). No type. | Hats to 16ths. Noise riser begins (200 Hz LP → 8 kHz exp over 5.71–8.57). Pad enters very dark (fc 300 Hz, −14 dB). |
| 4 | 7.14–8.57 | 1.43 | **Tension 3** | Hard cut: the wall has lost its images — flat grey rectangles only, max scroll, vignette 20 %, overall brightness falls to 20 % by 8.50. | — | Near-linear scroll with tiny ease-out; brightness ramp expo-in. | Riser peaks at 8.57; sub pitch falls 55 → 41 Hz (8.20–8.57). Everything stops dead at 8.57. |
| 5 | 8.57–11.43 | 2.86 | **Turn** | Black. 0.72 s of nothing. At 9.29 the LED blinks once; the hero card fades up alone, centred, larger (62 % frame height), lit by a key light from the upper left. First hard cut of the film ends the negative run (3 shots). | **Not here.** (9.60–11.20; dwell 1.6 s) | Card scale 0.96 → 1.00 over 1.4 s quint-out; key light drifts 1 px/frame; vignette back to 12 %. | **Full drop-out 8.57–9.29.** Single soft chime (E5 additive, reverb 0.3) at 9.29. Sub re-enters at 10.71 (beat 3). |
| 6 | 11.43–17.14 | 5.71 | **Reveal — the instrument powers on** | **Downbeat.** The key light sweeps the bench left → right. Studio panels rise from below with stagger (80–200 ms): left, a live histogram/scope (canvas); right, a rotary dial (36 hairline ticks, one amber active tick); bottom, a transport strip with four caps labels **GRADE · FRAME · PRICE · SEND**; top-left, mono "tipmi studio · 1.0" (brand name small at 11.6 s). The card moves to the left third. UI is flat, full-bleed, no device. | **Make it here.** (12.00–14.60; dwell 2.6 s) | Panels: masked rise + 94 % → 100 % scale, 700 ms expo-out, no two on the same frame; card dolly 1.5 % toward camera across the shot; rest 15.0–17.14 (nothing new). | **Hit 1 — power-on**: thump (120 → 60 Hz, 300 ms) + pad opens (fc 300 → 1.2 kHz over 600 ms) + sub lands on A1; low hum swell 11.43–12.30. Chord Am9. |
| 7 | 17.14–20.00 | 2.86 | **Grade it** | A glass touch ring lands on the dial; the dial turns 7 detents clockwise; the card's grade warms in 7 matching steps; the histogram reshapes live; readout "WARMTH +7" in tabular numerals under the dial. | **Grade it.** (17.30–18.70; dwell 1.4 s) | Dial rotation quantized to detents, 120 ms expo-out each (17.50–17.92); card colour matrix stepped in sync; touch ring 300 ms in / 300 ms out. | **Hit 2 — ratchet**: 7 paper ticks in 420 ms (one gesture). Tri layer added one octave up −12 dB. Chord Fmaj9. |
| 8 | 20.00–22.86 | 2.86 | **Frame it** | Transform: the card slides right into a 3:4 frame; a crop rectangle tightens and *snaps*; beneath it a title is set — "Still, no. 4" in Fraunces, the film's one variable-weight moment (wght 300 → 500, opsz 72 → 144 over 700 ms, left-aligned on a fixed-width block). Readout "3 : 4 · 1200 × 1600". | **Frame it.** (20.20–21.60; dwell 1.4 s) | Crop snap 400 ms quint-out, 1 % overshoot max; title weight tween 20.90–21.60; ruler hairlines draw via stroke-dashoffset. | Crop-snap tick (30 ms, 3 kHz band) at 20.90. Hats 16ths continue. Chord holds. |
| 9 | 22.86–25.71 | 2.86 | **Price it** | The right panel becomes the drop sheet: toggle **Edition** flips (knob slides, one-frame amber flash); stepper rolls to "25"; price field "40" (no currency glyph); a small line "You keep 90 %". Rest of the UI dims 20 % so the line sits in negative space. | **Price it.** (23.00–24.40; dwell 1.4 s) | Switch 220 ms expo-out at 23.60; stepper digits by masked rise 40 ms stagger; dim ramp 300 ms. | Switch tick at 23.60. Filter fully open. Chord Cmaj9. |
| 10 | 25.71–28.57 | 2.86 | **Send** (no line — peak tempo) | SEND in the transport strip becomes a long-press: an amber ring fills around it (26.40–27.86). At 27.86 the card lifts off the bench toward the camera and up; the panels drop away below; the bench darkens to black. | — | Ring: SVG stroke-dashoffset, linear with soft ends; card scale 1 → 1.18, y −12 %, 700 ms (100 ms expo-in lead, then quint-out); panels exit 350 ms expo-in with 60 ms stagger. | **Hit 3 — send**: riser (noise LP 400 Hz → 6 kHz, 26.40–27.86) → reversed-air lift 27.86–28.57; sub sidechain dip −6 dB. |
| 11 | 28.57–31.43 | 2.86 | **Chosen** | **Downbeat, match cut**: the card settles into the top cell of a feed on a phone standing on the bench (rotateY −16°, rotateX 5°, 86 % frame height, bench reflection 22 %); other curated works below; an editorial tag **Selected** with an amber dot slides in under the hero. No like counts, no numbers. The only device shot in the film. | **Chosen, not ranked.** (28.90–30.90; dwell 2.0 s) | Phone push-in 2 %; glare gradient tweened across the glass as the key light passes; tag masked rise 500 ms at 29.40. | **Hit 4 — landing** thump at 28.57 (on the cut). Hats back to 8ths. Chord Am9. Delay tails open (375 ms, fb 0.35). |
| 12 | 31.43–34.29 | 2.86 | **Supported** | The feed scrolls up one card (another creator's piece appears); a glass tile drops from the top of the screen: "New supporter" / "Mara K." Nothing else moves. | **Your work. Your terms.** (31.70–34.10; dwell 2.4 s) | Feed `translateY` smoothstep 900 ms; tile masked drop 600 ms expo-out at 32.30 (fake glass). | Paper tick at 32.30 (−16 dB under music). Pad stereo width up. Chord Fmaj9 at 34.29. |
| 13 | 34.29–37.14 | 2.86 | **Back to work** (human beat) | Rack-focus: the phone blurs to 4 px and fades; the bench returns, stripped to its surface, the LED, and a new *blank* tray — a card-shaped rectangle a hair brighter than the bench. The next piece. The creator is implied, never shown. | **Back to work.** (34.50–36.40; dwell 1.9 s) | Blur 0 → 4 px on a flattened phone snapshot (not the 3D node); tray fades up 94 % → 100 %; the longest rest in the film (36.4–37.14). | Strip to pad + sub; LP down to 600 Hz; hats out. Delay repeats darken. |
| 14 | 37.14–41.00 | 3.86 | **Logo** | The amber LED travels up the frame and becomes the tittle of the first **i** as the wordmark **tipmi** rises from a mask (x = 173, baseline y = 520). At 37.60 (wordmark at 90 % of final position) both i-dots light. Tagline beneath in Fraunces (baseline y = 640); CTA in 22 px caps (y = 700). Nothing else on the card. | **Built for the work.** (38.30–40.70; dwell 2.4 s) · caption: **Now open for creators.** (38.70–41.00; dwell 2.3 s) — the one permitted two-line card | Wordmark masked rise 650 ms expo-out; dots scale 0.94 → 1 + brightness; tagline blur-in 550 ms quint-out (blur 10 px, scale 1.03 → 1); CTA fade 400 ms; 1 % push on the whole card. | Air riser 36.60–37.60 → **Hit 5 — logo** at 37.60: thump (120 → 60 Hz) + chime (E6/A5 additive). Pad release 3 s. |
| 15 | 41.00–42.00 | 1.00 | **Tail** | Fade to black over 600 ms, hold black. | — | — | Silence; reverb tail gone by 41.2. |

**Checks.** 12 lines, longest 4 words / 22 chars; every dwell ≥ 1.4 s and above the craft-guide table; no two voice lines overlap (end card exception); product visible at 11.43 s; brand name small at 11.6 s, big at 37.1 s; three consecutive negative shots max (2–4); peak tempo at 25.7–28.6 s (61–68 % of runtime, then decelerating); cuts only at 5.71, 7.14, 8.57, 37.14 — everything else is a transform with the card as carrier (≈ 70 % transforms); silence used three times (open, turn, tail).

**Proposed zh swap (draft, ≤ 8 chars each, for the `COPY.zh` set):** 做了几个小时。/ 几秒就被淹没。/ 不在这里。/ 在这里创作。/ 调色。/ 构图。/ 定价。/ 被选中，不被排序。/ 你的作品，你定。/ 回去创作。/ 为作品而造。/ 现向创作者开放。

---

## 4. Music and sound (all synthesized in Node → WAV, 48 kHz)

**Tempo / key**: 84 BPM, A minor (Am9 home), one cue, 42 s. Voicing from the feasibility proof: 3 detuned saws per note (±8 ¢) → one-pole LP ×2, L/R fc ratio 1 : 1.03, slow LFO 0.7 Hz ± 300 Hz on fc; triangle layer one octave up at −12 dB from 17.14; sub = sine at the root, 120 Hz LP, mono, dry; hats = seeded white noise → LP 9 kHz → `exp(−60t)`, L/R alternating; delay 375 ms (dotted 8th ≈ bar/8 at 84 BPM is 357 ms — tie it to BPM: use 357 ms) feedback 0.35 with 3 kHz LP in the loop; Schroeder reverb mix 0.3 on pad and chimes only.

**Structure (aligned to shots)**

| Time | Shots | Arrangement |
|---|---|---|
| 0.00–3.57 | 1 | Room tone (LP noise −40 dB) + sub drone A1 −18 dB. Nothing rhythmic. ≥ 1.5 s of near-silence satisfied. |
| 3.57–8.57 | 2–4 | Hats 8ths (3.57) → 16ths (5.71); sub pulses on bar; pad enters dark (fc 300 Hz) at 5.71; noise riser 200 Hz → 8 kHz, amplitude u², 5.71–8.57; sub pitch drop 55 → 41 Hz 8.20–8.57; hard stop. |
| 8.57–11.43 | 5 | **Drop-out 0.72 s.** One chime E5 at 9.29 (additive, reverb). Sub re-enters 10.71 at −12 dB. |
| 11.43–17.14 | 6 | **Downbeat**: thump + pad opens (fc → 1.2 kHz, 600 ms) + sub on A1; chord **Am9**. Hats rest for 2 beats, return on 8ths. |
| 17.14–28.57 | 7–10 | Feature run: tri layer in; hats 16ths; filter to fully open by 25.71. Chords every 2 bars: **Fmaj9** (17.14) → **Cmaj9** (22.86); build with a second saw voice at 25.71; riser 26.40–27.86 into the lift. |
| 28.57–34.29 | 11–12 | **Am9** landing (thump on the cut); hats back to 8ths; pad width up; delay tails audible; **Fmaj9** at 34.29. |
| 34.29–37.14 | 13 | Strip to pad + sub; LP down to 600 Hz; hats out; room gets quiet. |
| 37.14–41.00 | 14 | Air riser 36.60–37.60 (noise HP sweep, reversed envelope) → **logo hit 37.60**; pad release 3 s; delay repeats darken. |
| 41.00–42.00 | 15 | Silence (−∞ by 41.2). |

**Five sound-design hits** (all also written to `cues.json`, which the GSAP timeline reads so picture and sound share one grid):

1. **Power-on** 11.43 — sine thump 120 → 60 Hz / 300 ms + low hum swell (sub + tri) 11.43–12.30.
2. **Ratchet** 17.50–17.92 — 7 paper ticks (noise burst 25 ms through a 2–4 kHz band), one gesture.
3. **Send** 26.40–28.57 — LP noise riser 400 Hz → 6 kHz (1.46 s) → reversed-air "lift" (noise through rising HP, reverse envelope, 0.7 s) with a −6 dB sidechain dip on the sub.
4. **Landing** 28.57 — thump + short low tom-like sine (90 Hz, 180 ms), on the cut frame.
5. **Logo** 37.60 — the single logo sound: thump (120 → 60 Hz, 80 ms pitch env, 300 ms decay) + additive chime at E6/A5 (partials 1, 2.01, 3.0, 4.2, 5.4; decays `exp(−t(2+2j))`); onset on the frame the wordmark reaches 90 % and the i-dots light.

Small UI ticks (3 more, 12–18 dB under music): crop snap 20.90, switch 23.60, tile 32.30. The chime at 9.29 is the turn's accent. Total UI SFX in the feature run: 3 ticks + 2 gestures — within the 3–5 guideline.

**Mix**: aim the raw bus at ≈ −16 LUFS, peaks ≈ −3 dBFS; `loudnorm` two-pass (`linear=true`) to **−14 LUFS integrated, ≤ −1 dBTP**, LRA 7–9 LU; music peaks −6 dBTP; re-measure the muxed MP4. Every hard cut (5.71, 7.14, 8.57, 28.57, 37.14) lands on a beat; transforms start on beats and resolve on the next bar.

---

## 5. Why this beats a generic "social app" ad — and three risks

**Why it wins**

- **It is a point-of-view film, not a product tour.** No hands, no faces, no "diverse friends laughing at a phone" — the viewer is the creator and performs every gesture. That is the only honest way to do "creator-first" without stock.
- **One object, one take.** The piece is on screen for 37 seconds straight; the UI assembles around it and dissolves away again. A single carrier object is the difference between a film and a template reel, and it dramatizes the brand truth (the work stays; the noise goes).
- **Tactility you can hear.** Detents, snaps, a long-press ring — every interaction is quantized to a sound. Pro-instrument satisfaction (camera/synth/DAW) is a feeling no incumbent's ad has, and it makes "creator tools" a sensation rather than a claim.
- **Money shown with dignity.** Price as an edition, payment as a tile with a name; no dollar signs, no counters, no "unlock". The OnlyFans adjacency reads as patronage.
- **The refrain.** *Make it here / Grade it / Frame it / Price it / Back to work* — a voice, 2–3 words per line, Chinese-swappable, memorable; and *Built for the work* lands on the last gesture of returning to the bench.
- **Dark done right.** One desaturated amber lamp at < 0.3 % of pixels, lifted blacks, warm bone ink, Fraunces at weight 300 — the Linear/Loewe register, not crypto.

**Risks and mitigations**

| Risk | Mitigation |
|---|---|
| **Dark field + amber glow drifts into "crypto / gaming"** (saturated accent, heavy bloom, bold type). | Accent fixed at `#D8A04A` (sat ≈ 60 %), bloom baked low (< 8 %) and only from the lamp and ring; no glow on text ever; display weight 300; content world stays clay/bone/slate; review each frame against checklist item 9/10; if the amber reads "gold", fall back to muted coral `#C97A66`. |
| **It becomes a feature demo** (the studio panels invite over-explaining; four labels in the transport strip). | Hard cap of three tool verbs, one gesture each, ≤ 1.4 s of copy per beat; the UI never animates for its own sake — if a panel does not take part in the gesture it stays dim at Ink 3; the strip labels exist only so SEND can be the long-press. Cut Frame it first if the run runs long. |
| **No person on screen → cold; "Not here." could read as ambiguous** (not here = where?). | First-person refrain, the touch ring, and the *Back to work* beat put the human in by implication; test *Not here.* against the alt *Not anymore.* in the first review render; keep both in `COPY`. |
| (Secondary) **UI strings make product claims** ("You keep 90 %", edition/price values) we have not confirmed. | All are constants (`SPLIT`, `EDITION`, `PRICE`, `SUPPORTER_NAME`) rendered from one file; `SPLIT` can be blanked to hide the line without re-timing the shot. |

---

## 6. Build notes (for the production pass)

- `DURATION = 42`, 30 fps, `seek(t)` pure in `t`; grain tile index `floor(t*24) % 8`; all scene toggles via `display:none` sets on the master timeline; `fromTo` only; PRNG consumed in `buildAssets()` only (card library of 24, dissolve keyframes, scope data per grade step, name list).
- Carrier card is one DOM element whose parent changes by *re-targeting transforms*, not by re-parenting (keeps the match cuts pixel-exact): position/size keyframes at 0, 3.57, 5.71, 9.29, 11.43, 20.00, 25.71, 27.86, 28.57 are authored as absolute `fromTo` tweens.
- Phone (shot 11–13) is the one `preserve-3d` subtree; the rack-focus in shot 13 blurs a 2D snapshot of it drawn to canvas at `READY`, not the live 3D node.
- `constants.js`: `BRAND_NAME`, `TAGLINE`, `CTA`, `SPLIT`, `EDITION`, `PRICE`, `SUPPORTER_NAME`, `ACCENT`; `copy.js`: `COPY = {en, zh}` incl. UI strings; `cues.json`: `{bpm:84, beats:[...], hits:{poweron:11.43, ratchet:17.50, send:26.40, lift:27.86, landing:28.57, logo:37.60}, chime:9.29, dropout:[8.57,9.29], ticks:[20.90,23.60,32.30]}`.
- Frames as JPEG q95; x264 `-crf 16 -preset slow -tune film -pix_fmt yuv420p`; determinism check on frames 300–330 with 1 vs 4 workers.
