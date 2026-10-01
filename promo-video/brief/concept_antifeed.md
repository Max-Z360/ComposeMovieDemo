# Concept — NOISE FLOOR (angle: the anti-feed)

| | |
|---|---|
| **Concept title** | **Noise Floor** — the quiet beneath the noise; also "a feed with a floor" |
| **Brand name** | **Tipmi** — wordmark set lowercase `tipmi` (single constant `BRAND_NAME = "Tipmi"`; wordmark string `BRAND_NAME.toLowerCase()`) |
| **Master tagline** | **Chosen, not ranked.** |
| **Opening / closing promise** | Only the work worth seeing. |
| **Duration** | **42 s picture + 1 s black tail = 43 s file** (fits a 30 s cut-down: drop S1–S3 to 4 s and S11) |
| **Aspect / master** | 16:9, 1920×1080 @ 30 fps (render grid), grain cadence 24 fps; vertical re-frame later |
| **Field** | Deep near-black for 0–34.3 s, then one paper interlude that the film *ends* in (human beat + logo). Decided once, never alternated. |

---

## 1. The idea (one paragraph)

The film opens on the one thing worth seeing — a single, warm, hand-made image, small, alone in the dark — and then buries it. In eight seconds the frame fills with everything else: a feed that multiplies, speeds up, pixelates, shouts in pills and badges, until the type itself is overrun. Hard cut. Black. Silence. One word: *Enough.* Then the same image we lost at the start rises back, full-bleed, and we are inside Tipmi: a feed that was *chosen*, a studio that makes the work better, a quiet beat where a stranger with taste becomes a supporter, and a last breath on paper. The viewer feels the exact relief of closing a loud app — except here the relief *is* the product. The single promise: **on Tipmi, only the work worth seeing gets seen — and the people who make it get paid for it.** The problem and the product are built from the *same* generative art: the junk feed and the curated feed are literally one library drawn two ways (nearest-neighbour, clashing, over-labelled vs. soft, graded, captioned). Tipmi is not a different world; it is the same work, finally shown properly.

---

## 2. Visual language

### 2.1 Palette

| Role | Hex | Use |
|---|---|---|
| Field (dark) | `#0B0B0D` | 0–34.3 s background; lifted to `#121214` by the grade (blacks never hit 0) |
| Dark surfaces | `#17171A` / `#232327` | app chrome, phone bezel face, editor rails |
| Text on dark | `#E8E4DC` | all display copy and UI strings on the dark field |
| Caption grey | `#8A8A90` | captions, meta lines, status bar |
| Hairline | `rgba(255,255,255,.10)` | card borders, 1 px rules, glass edge |
| Paper (light) | `#F2EEE7` | 34.3–42 s field; paper shadow `#E3DDD2` |
| Ink on paper | `#1C1B19` | "Look. Slowly.", wordmark, tagline, CTA |
| **Accent — ochre** | **`#C9963F`** | ≤ 5 % of frames: the two i-dots of the wordmark, the "Chosen" hairline frame, the supporter-toast dot, one slider knob. Never on text, never as a glow. |
| Curated-card palette (seeded, analogous, one black point) | terracotta `#B8674A`, sand `#D8C3A5`, dusk `#6B6F8E`, moss `#6F7A5A`, oxblood `#5A2E2B`, bone `#EFE6D8` | all 24 library cards pass through one `grade()` (black point `#121214`, soft highlight roll-off, +4 % warmth in mids) |
| Junk-card palette (chaos only) | hot pink `#FF2D55`, cyan `#00E5FF`, acid `#CCFF00`, orange `#FF7A00`, violet `#7B2BFF`, pure white pills | deliberately clashing complementaries; luminance clamped ≤ 85 % so it is loud, not blown-out |

One grade across the whole film (`contrast 1.04, blacks +10, warmth +3 %` applied in the card renderer and the background canvas, not as a CSS filter).

### 2.2 Typography (exactly two families + one mono label)

| Role | Font (Google, OFL, already in `fonts/`) | Spec @1080p |
|---|---|---|
| Display / emotion lines | **Fraunces** variable — `opsz 144`, `wght 300`, `SOFT 0` | 96 px (8.9 % frame height), tracking −1.5 %, leading 1.0, left-aligned in the margin column (x = 160 px), display baseline y = 744 px, 8 px baseline grid. One display line per shot (exception: the stacked hook words — the crowding is the point). The word **"Chosen"** firms `wght 300 → 500` once (700 ms, expo-out), left-aligned fixed-width block. |
| Wordmark | Fraunces `opsz 144`, `wght 400`, lowercase `tipmi` | 176 px, tracking −2 %; the two **i-dots are drawn as separate ochre circles** (the only brand mark) so they can arrive last and be re-coloured; wordmark is one `<span data-brand>` fed from `BRAND_NAME` |
| UI / captions / CTA | **Inter** variable — `opsz 24`, `wght 500` | 22 px (2 %), tracking +4 %; in-phone UI 20–24 px; all-caps only for ≤ 3-word labels ("CHOSEN", "EDITION") |
| Chaos labels (problem world only) | Inter `wght 700`, all-caps | 14–18 px pills — the one place the film is allowed to look cheap, on purpose, for 6 s |
| Mono (one label) | **Geist Mono** 400 | 18 px, "v1.0 — 2026" in the end card status line (optional) |
| Chinese swap | **Noto Sans SC** `wght 300` display / `400` captions | same timeline, `?lang=zh`; every line ≤ 8 characters |

### 2.3 Motion language (5 rules)

1. **Chaos pushes in; calm pulls back.** 0–8.6 s the camera only jump-cuts *inward* (tighter, denser). After the turn the camera only *recedes* — revealing the frame, the phone, the sheet of paper. The single reversal is the turn itself.
2. **One direction of travel: up and toward the lens.** The chaos feed scrolls up fast; the hero card rises from below; the curated wall drifts up at 14 px/s; the print exits upward; the wordmark rises from a mask. Exits drift 6 px in the direction the next shot moves.
3. **One carrier object, never dropped.** Card #0 (the "hero", a terracotta/sand soft-blob study titled *Studio light, no. 3*) is the first thing on screen, is buried, returns full-bleed, shrinks into a grid cell, lives in the phone, then the same card library feeds the editor, the publish sheet, the paper print. Every transform is this object changing state; no wipes, no slides.
4. **Easing is the voice.** Type and UI: expo-out `cubic-bezier(0.16,1,0.3,1)` 500–700 ms (masked rise default; blur-in 10 px + 1.03 scale only for the reveal line and the wordmark). Camera: `cubic-bezier(0.65,0,0.35,1)` 2–5 s. Exits: expo-in, 60–70 % of entry time. Chaos uses *no easing at all* — hard appears, hard cuts on the beat (0.71 s), because cheapness has no easing.
5. **Nothing is still; nothing starts together.** Every calm plate has 1–3 % push-in, 3-layer parallax (bg 1 : cards 1.6 : type 2.2) and a key-light gradient drifting 1 px/frame. Secondary elements offset 60–120 ms, tertiary 120–220 ms. Each calm shot rests 15–25 % with nothing entering; chaos shots rest 0 %.

### 2.4 Textures

- **Grain**: 8 pre-baked 512² seeded tiles via `createPattern`, offset per `floor(t·24)`, `mix-blend-mode: soft-light`. 6 % in the chaos, 4 % on the dark field, 3 % on paper (stronger in shadows by the blend).
- **Vignette**: one radial-gradient div, 20 % in S1–S3, 10 % after the turn, 6 % on paper.
- **Glass**: exactly one material — `rgba(255,255,255,.07)` + 1 px `rgba(255,255,255,.14)` hairline + pre-blurred copy of the bg canvas clipped to the panel (fake glass, no `backdrop-filter`). Used twice: the publish sheet (S10) and the supporter toast (S11).
- **Light**: a soft key-light (linear-gradient mask, 1 px/frame) crosses the hero card during the reveal and the paper print during the human beat; the phone glare is the same gradient tweened with the rotation. Bloom only as a baked radial in the low-res bg canvas behind the ochre dot, < 8 %. Never on text.
- **Low quality as texture**: junk cards are the library cards drawn at 24×32 and upscaled with `imageSmoothingEnabled = false` (6 px blocks), plus a 3-frame "buffering" ring and a progress bar — low-res video without a single video.

### 2.5 Device mockup treatment

One phone, once, large (S7–S8, ~5 s). CSS 3D: `perspective: 1800px`, `rotateY(-16deg) rotateX(6deg)` → `0 / 0`, bezel `border-radius 56/46 px`, 1 px edge highlight, one soft shadow `0 60px 120px rgba(0,0,0,.6)`, masked mirrored reflection (opacity .22, blur 4 px) on the dark floor, glare gradient tweened with the rotation. It is *discovered*, not presented: the full-bleed curated wall pulls back until its corners round off and a bezel resolves — the wall was the app the whole time. It leaves the same way: it rotates flat and the screen scales to full-bleed, match-cutting into the editor. No spin, no float loop, no hand.

### 2.6 How "content" is depicted (no photos)

A seeded library of 24 cards (3:4, 420×560 offscreen canvases, built once in `buildAssets()`): **40 % soft-blob "studio light" studies** (3–5 radial gradients, `lighter`, low-res → bilinear upscale, slight vignette — reads as fabric / skin-tone / abstract photography), **25 % flow-field prints** (2 500 short polylines on a value-noise angle field, warm ink on bone or bone on oxblood — reads as fine-art print), **20 % typographic posters** (one large Fraunces italic word or numeral, rotated 90°, cropped; mono caption line), **15 % geometric compositions** (3–5 rectangles/arcs on a strict grid, one accent). Every card has a real caption from a seeded fictional list — title + maker (`Studio light, no. 3 — Ines Marlow`, `Tidal, no. 7 — Jonah Keel`, `Mass & void — Aya Toda`) — and a 1 px hairline, 20 px radius. The *same* library drawn through `renderJunk()` (nearest-neighbour, clashing palette, pills, badges, bars, duplicated and mirrored) becomes the chaos. The hero card is index 0.

---

## 3. Storyboard

Beat grid: 84 BPM, beat = 0.714 s, bar = 2.857 s. Bars start at 0, 2.86, 5.71, 8.57, 11.43, 14.29, 17.14, 20.00, 22.86, 25.71, 28.57, 31.43, 34.29, 37.14, 40.00. Copy column shows exact on-screen words; every line ≤ 6 words / ≤ 32 chars, readable ≥ 1.2 s after its entry animation. Left margin column x = 160 px unless stated.

| # | In – Out | Dur | What we see (drawable in HTML/CSS/canvas) | On-screen copy (exact) | Motion | Sound cue |
|---|---|---|---|---|---|---|
| S1 | 0:00.00 – 0:02.86 | 2.86 s | Near-black field, vignette 20 %, grain 6 %. Centre: **card #0** (hero, soft terracotta/sand study) shown small (180 px tall), faint, alone. At 1.43 a second card hard-appears beside it; then 4, 8, 16 — a grid growing outward from the hero, each new card drawn with `renderJunk()` (blocky, clashing), each with a white pill ("Suggested for you", "Sponsored", "Watch next"). Hero is the only smooth, warm card. | — | Hero: 2 % push-in. New cards: hard appear at 100 %, no easing, interval shrinking 0.36 → 0.18 s. Camera begins a slow jump-in. | Room tone (−40 dB LP noise) + 55 Hz sub drone from 0.0. Six 6-bit-crushed ticks on the appears (1.43, 1.79, 2.14, 2.32, 2.50, 2.68). No pad. |
| S2 | 0:02.86 – 0:05.71 | 2.86 s | Grid is now 6 columns, edge-to-edge, scrolling upward and accelerating (closed-form `y(t)`); cards duplicate and mirror; pills multiply ("Live", "Ad", "Trending", "99+"), 3-frame buffering rings, autoplay progress bars. The hero card is glimpsed for 8 frames at 4.0 and is scrolled off. | **More.** (2.86) then **Faster.** stacks beneath (4.29) | Serif words masked-rise (600 ms expo-out) in the margin column, stacking downward — the only shot where lines accumulate. Scroll speed 400 → 1 400 px/s. Jump-cut inward at 4.29 (scale 1 → 1.3). | Hats enter on 8ths at 2.86, 16ths at 4.29; band-passed noise swell starts (300 Hz → 4 kHz). Detuned saw cluster (A/B♭/B) fades in, 6-bit crushed. |
| S3 | 0:05.71 – 0:08.57 | 2.86 s | Four jump cuts, each tighter and denser (12 columns, cards overlapping, pills stacking on pills, grid at ~1.6× then 2.4× scale, slightly off-axis so it feels like falling in). At 7.86 the cards draw *over* the type: the words are buried. Vignette 20 %. | **Louder.** stacks beneath (5.71); all three words overrun by cards from 7.86 | Hard cuts on beats: 5.71, 6.43, 7.14, 7.86 (0.71 s each — the tension floor, nothing under 12 frames). Zero easing. Type does not exit; it is covered. | Hats to 32nds; noise swell peaks; cluster at full; sub rising to 65 Hz. Everything is building to a wall. |
| S4 | 0:08.57 – 0:11.43 | 2.86 s | **Hard cut to black.** Nothing for 0.86 s. Then one serif word in the margin column; grain 4 %, vignette 10 %. Exit by fade + 6 px drift *up* (the direction the hero will rise). | **Enough.** (9.43 – 11.10) | Masked rise 600 ms expo-out at 9.43; holds; fade-out 400 ms expo-in at 11.10. Dwell 1.4 s. | **Full-band silence 8.57 – 9.43** (all voices stop in 30 ms, no tail). At 9.43: one dry additive chime (A5), tiny reverb. Nothing else. |
| S5 | 0:11.43 – 0:17.14 | 5.71 s | **Reveal.** Card #0 — the image from frame one — rises from below the frame and settles **full-bleed** (rendered at 240×135 → smooth upscale, so it is soft, not blocky). A key light drifts left → right across it over the whole shot. Lower-left caption in Inter: `Studio light, no. 3 — Ines Marlow`. At 15.71 a small `tipmi` wordmark (22 px, caption grey) fades in at the top-left margin — brand seen small by 16 s. Deliberately the longest hold in the film. | **Only the work worth seeing.** (12.86 – 15.57) | Card: `y 108 % → 0`, `scale .94 → 1`, 1.2 s expo-out from 11.43; then 2 % push-in to 17.14. Line: blur-in 10 px + scale 1.03 → 1, 650 ms quint-out; exits 450 ms. Light mask 1 px/frame. Shrink toward a grid cell begins at 16.43 (continuous into S6). | **Downbeat 11.43**: thump (120 → 60 Hz, 80 ms), sub lands on A1, pad Am9 opens (LP 400 → 1 200 Hz over one bar). 14.29: Fmaj7. Delay (dotted-8th, 536 ms) on the pad. |
| S6 | 0:17.14 – 0:20.00 | 2.86 s | Hero becomes one cell (560×746) of a flat, full-bleed **3-column curated wall** — same geometry as the chaos grid, but smooth, graded, generous gutters, one caption per card, no pills. Cards stagger in outward from the hero (echo of S1, but slow). Top bar: `tipmi` · `Today — 31 works`. Wall drifts up 14 px/s. | **No filler. No noise.** (17.71 – 19.86) | Shrink 800 ms expo-out; card stagger 40 ms each, capped at 8 then grouped; line masked rise 600 ms; line exits 400 ms. Rest 20 % at the end of shot. | 17.14: Cmaj7, soft hats on 8ths enter at −20 dB. One hit on the bar; cut-free. |
| S7 | 0:20.00 – 0:22.86 | 2.86 s | On the wall, one card (a typographic poster, *Tidal, no. 7*) receives a **1 px ochre hairline frame** and a small label `CHOSEN · Editors, Oct 1`. From 21.43 the camera pulls back: the wall's corners round off, a bezel, status bar and a dark floor resolve — **it was a phone**. | **Chosen, not ranked.** (20.14 – 22.57) | "Chosen" firms `wght 300 → 500` over 700 ms as it rises (fixed-width block). Hairline draws clockwise 500 ms. Pull-back `scale 1 → .2`, `cubic-bezier(.65,0,.35,1)` 1.43 s, rotation begins at the end (`rotateY 0 → −16°`, `rotateX 0 → 6°`). | 20.00: Em7; triangle air layer (+1 oct, −12 dB) enters. No hit on the frame draw — silence is the accent. |
| S8 | 0:22.86 – 0:25.71 | 2.86 s | **The phone**, large, right of centre (cx ≈ 1 180 px), tilted, glare drifting, reflection on the floor, feed scrolling slowly inside. No copy — a rest. At 24.29 the top card lifts (tap) and expands inside the screen into the **editor**; 25.00 – 25.71 the phone rotates flat and its screen scales up to fill the frame, match-cutting the editor rectangle into S9. | — | Phone 1.5 % push-in; `rotateY −16 → 0`, `rotateX 6 → 0` over 0.71 s expo-out; screen `scale → full-bleed` on the same curve; glare gradient tweened with the rotation. Feed `translateY` 40 px/s. | 22.86: Am9, hats to 16ths, LP opening toward 2.4 kHz (build). **Paper tick #1** at 24.29 (tap), 15 dB under music. |
| S9 | 0:25.71 – 0:28.57 | 2.86 s | **Editor, full-bleed, flat UI**: the creator's flow-field piece (*Tidal, no. 7*, Jonah Keel) fills the left 60 %; right rail: `Exposure` `Warmth` `Grain` `Type` `Layout` sliders in Inter, hairlines, no icons. The **Warmth** knob (ochre) drags 0 → +12 and the artwork visibly warms (the card re-renders through `grade()` with warmth as a function of t). A type tool places the title in Fraunces italic over the piece. | **Make it here.** (25.86 – 27.86) | Line masked rise 600 ms; knob drag 900 ms expo-out from 26.29; title placement 600 ms at 27.14; parallax rail at 1.6×. Rest 15 % at end. | 25.71: Fmaj7, filter fully open, tempo feel at its peak. **Tick #2** 26.29 (knob), **Tick #3** 27.14 (type). |
| S10 | 0:28.57 – 0:31.43 | 2.86 s | A **publish sheet** (the one glass material) slides up over the editor: `Publish` · `Who can see — Supporters` · `Edition — 25` · `Licence — Editorial` · a `Publish` button drawn as an ochre hairline (not filled). No currency symbols anywhere. Button is pressed at 30.71 (scale .98, 120 ms). | **Your work. Your terms.** (28.71 – 31.00) | Sheet rises 700 ms expo-out from 28.57, rows stagger 60 ms; line masked rise; button press; sheet collapses 400 ms expo-in at 31.0. | 28.57: Cmaj7. **Tick #4** 30.71 (publish) — slightly longer (40 ms) paper tick, the only one with a hint of delay. |
| S11 | 0:31.43 – 0:34.29 | 2.86 s | The published card lands at the top of the curated wall (flat, full-bleed, calm). Bottom-left, a quiet **toast** (glass #2): ochre dot · `Mara T. · new supporter` at 32.00; a second toast slides under it at 33.14: `Jonah K. · sent a tip`. Two, never three. No counters. | **Seen by the right people.** (31.57 – 34.00) | Card lands 800 ms expo-out; toasts rise 500 ms, 1 140 ms apart; wall continues 14 px/s up; line exits 400 ms drifting up into the cut. From 33.50 everything slows (push-in eases out). | 31.43: Em7. **Sub dips −6 dB for 150 ms** on each toast (the mix breathes — the only "payment" sound). From 33.50 LP closes toward 600 Hz, hats fade out. |
| S12 | 0:34.29 – 0:37.14 | 2.86 s | **Hard cut to paper** (`#F2EEE7`). The flow-field piece as a **physical print**: a sheet rotated −1.5°, soft shadow, 1 px edge, sitting centre-right; a key light drifts across the paper; grain 3 %, vignette 6 %. Ink-black serif in the margin column. The exhale that answers the hook. | **Look. Slowly.** (34.57 – 36.57) | Print 1.5 % push-in; light mask 1 px/frame; line masked rise 700 ms (slower than every other line), exits 400 ms drifting up. Rest 25 %. | 34.29: Fmaj7, **pad + sub only**, LP 600 Hz, no hats, no delay. Quietest music in the film. |
| S13 | 0:37.14 – 0:42.00 | 4.86 s | **Logo on paper.** The print drifts up and out of frame; the wordmark `tipmi` rises from a mask in the margin column (176 px, Fraunces 400, ink); the **two i-dots arrive last, in ochre** (the brand mark). Beneath: tagline in display serif, then the CTA in Inter caption. Status line (mono, optional): `v1.0 — 2026`. Nothing else on the card. | **tipmi** (wordmark, 37.29) / **Chosen, not ranked.** (38.86 – 42.00) / **Now open for creators.** (39.86 – 42.00) | Wordmark masked rise 600 ms expo-out, 90 % position at **38.14**; i-dots fade in 38.00 / 38.06. Tagline masked rise 600 ms; CTA fade 400 ms. Paper 1 % push-in to the end. Fade to black 42.00 – 42.50 expo-in. | **Riser 37.14 → 38.14** (noise LP 200 → 8 kHz, u²). **Logo hit at 38.14**: thump (60–90 Hz) + additive chime dyad (A5 + E6), delay tails. Pad Am(add9) release 3 s. **Silent (−∞) by 41.20.** |
| S14 | 0:42.00 – 0:43.00 | 1.00 s | Black tail. | — | — | Silence. |

**Copy ledger (11 lines + wordmark, all ≤ 6 words, ≤ 32 chars):** More. · Faster. · Louder. · Enough. · Only the work worth seeing. · No filler. No noise. · Chosen, not ranked. · Make it here. · Your work. Your terms. · Seen by the right people. · Look. Slowly. · [tipmi] · Chosen, not ranked. (end) · Now open for creators. — counting the stacked hook as one three-word line and the end tagline as a repeat, the film has **11 distinct lines**; counting every appearance, 13, of which 3 are single words. UI strings (pills, captions, toast text, sheet rows) are set-dressing, not copy.

Suggested zh swap (≤ 8 chars each, `COPY.zh`): 更多。/ 更快。/ 更吵。/ 够了。/ 只看值得看的。/ 不凑数。不喧哗。/ 被选中，不被排序。/ 在这里创作。/ 你的作品，你定规则。/ 被对的人看见。/ 慢慢看。/ 现已向创作者开放。

**Structure check against the craft guide:** hook 0–4 ✓ (hero + first words), tension 4–8.6 ✓ (3 negative shots max ✓), turn 8.6–11.4 ✓ with 0.86 s silence, product visible at 11.43 ✓ (≤ 12 s), brand small at 15.71 ✓ (≤ 20 s), feature run 25.7–34.3 at ~61–82 % of runtime ✓, peak tempo there, deceleration from 33.5, logo at 38.14, silent tail ✓. Cuts: 4 jump cuts + 2 world cuts (8.57, 34.29) ≈ 40 %; everything else is a carried transform ≈ 60 % ✓.

---

## 4. Music and sound (all synthesizable in Node → WAV, 48 kHz)

**Tempo / key:** 84 BPM (beat 0.714 s, bar 2.857 s), **A minor**. Chord cycle on the bars: Am9 → Fmaj7 → Cmaj7 → Em7, pad = 3 detuned saws (±8 ¢) per note, 4-note voicings (A2 E3 G3 B3 / F2 C3 E3 A3 / C3 E3 G3 B3 / E2 G3 B3 D4), one-pole LP ×2 with L/R fc 1 : 1.03, 0.7 Hz ±300 Hz LFO on fc. Sub = sine on the root, 120 Hz LP, mono, dry. Hats = seeded white noise → HP 8 kHz → `exp(−60t)`, Haas 10 ms. Delay = 536 ms (dotted 8th), feedback .35, LP 3 kHz in loop. Reverb = Schroeder (4 combs + 2 allpasses), 20 ms pre-delay, wet LP 5 kHz, 25 % mix; sub and ticks stay dry. Bus: `tanh` soft clip, aim raw render ≈ −16 LUFS / −3 dBFS, then `loudnorm` two-pass `I=-14 TP=-1 LRA=9 linear=true`; re-measure the muxed MP4.

| Time | Picture | Music |
|---|---|---|
| 0.00 – 2.86 | S1 hook | Room tone (LP noise −40 dB) + sub A1 55 Hz drone. Six **6-bit-crushed ticks** (20 ms noise bursts, 2–4 kHz band, sample-quantized to 6 bits so they sound "low quality") on the card appears. |
| 2.86 – 8.57 | S2–S3 tension | Hats 8ths (2.86) → 16ths (4.29) → 32nds (5.71). Band-passed noise swell 300 Hz → 4 kHz, amplitude `u²`. Detuned saw **cluster A / B♭ / B** (minor seconds), bit-crushed, rising to −10 dB. Sub rises 55 → 65 Hz. Hard cuts land on beats; the cluster gets a 10 ms re-trigger on every jump cut. |
| 8.57 – 9.43 | S4 turn | **Full stop** — every voice gated in 30 ms, no reverb tail. 0.86 s of true digital silence. |
| 9.43 | "Enough." | One additive chime A5 (partials 1, 2.01, 3, 4.2, 5.4; decays `exp(−t(2+2j))`), dry + 15 % reverb. |
| 11.43 | S5 reveal downbeat | **Thump** (sine 120 → 60 Hz over 80 ms, decay 300 ms) + sub lands A1 + pad Am9 opens LP 400 → 1 200 Hz over one bar. Delay on. |
| 14.29 – 22.86 | S5–S7 proof | Chords on bars (Fmaj7, Cmaj7, Em7, Am9). Soft hats 8ths from 17.14 at −20 dB. Triangle air layer (+1 oct, −12 dB) from 20.00. No hits — the cut-free stretch. |
| 22.86 – 31.43 | S8–S10 feature run | Hats 16ths, LP fully open to 2.4 kHz, pad at full. **Four paper ticks** (noise burst 20–40 ms, 2–4 kHz band) at 24.29, 26.29, 27.14, 30.71, 15 dB under music; #4 gets one delay repeat. Tempo feel peaks here (~65–75 % of runtime). |
| 31.43 – 34.29 | S11 dignity beat | Em7; **sub ducks −6 dB / 150 ms** on each toast (32.00, 33.14). From 33.50: LP closes to 600 Hz, hats fade over one beat, delay off. |
| 34.29 – 37.14 | S12 human beat | Fmaj7, pad + sub only, LP 600 Hz. The quietest bar. |
| 37.14 – 38.14 | riser | Noise → LP sweeping 200 → 8 000 Hz exponentially, amplitude `u²`, plus a sine rising one octave (A4 → A5); resolves exactly at 38.14. |
| 38.14 | logo hit | **Thump + chime dyad A5 + E6** (the single logo sound), onset on the frame the wordmark reaches 90 % of its position; delay tails. Pad Am(add9) release 3 s. |
| 41.20 – 43.00 | tail | −∞. The room goes quiet before the picture ends. |

**Sound-design hits (5):** (1) the accelerating 6-bit ticks of the hook; (2) the hard stop at 8.57 — silence used as a hit; (3) the dry chime on *Enough.*; (4) the reveal thump/downbeat at 11.43; (5) the riser → thump + chime on the wordmark at 38.14. Plus 4 paper ticks and 2 sub-ducks as texture, never per element. Silence is used three times (open, turn, tail). All hit times live in one `cues.json` (`{bpm:84, bars:[...], hits:[8.571, 9.429, 11.429, 38.143], ticks:[24.286, 26.286, 27.143, 30.714], ducks:[32.0, 33.143], logo:38.143}`) read by both the GSAP timeline and the synth.

---

## 5. Why this beats a generic "social app" ad

- **It names a feeling before it names a feature.** Every incumbent launch opens on smiling people or a product spin. This opens on something the viewer has *done today* — scrolled a feed that got louder — and gives them the relief they already wanted. The relief is the positioning (*No filler. No noise.* → *Chosen, not ranked.*) shown, not claimed.
- **Problem and product are made of the same material.** The junk feed and the curated feed are one generative library rendered two ways. That is both a production trick (no stock, no photos, one asset pipeline) and the argument: the good work was always there; Tipmi is what happens when someone chooses it. No competitor logos, no crossed-out icons, no "no algorithm" banner — the contrast does the work.
- **One carrier object from frame 1 to the logo.** The hero card survives the whole film; the viewer is never shown a slide, only one thing changing state. That is what separates a film from a template.
- **A typographic voice.** Serif single words set left on black (*More. Faster. Louder. / Enough.*), one weight change on *Chosen*, a lowercase wordmark whose only mark is two ochre dots. It reads like a magazine, which is the gallery-not-platform promise in itself.
- **It ends in daylight.** Thirty-four seconds of dark, then paper. The film physically exhales into the brand; the logo lands in the only warm, bright field of the film, on the only full silence after the turn.
- **Everything is on the beat grid and renders deterministically** — the shot list is already the `cues.json`; every cut is a bar line, every line sits in the readability table.

## 6. Risks and mitigations

| # | Risk | Mitigation |
|---|---|---|
| 1 | **The chaos reads as cheap, or as a competitor parody, and sours the brand.** | Cap the negative at 8.6 s and three shots; no logos, no recognisable UI chrome, only generic pills; the hero card is planted in frame 1 so the open is hope, not contempt; even the junk palette is clamped (luminance ≤ 85 %, saturation controlled) and graded through the same vignette/grain so the *film* never looks cheap, only the feed inside it. Fallback cut-down: start at S2 with the hero already buried. |
| 2 | **Generative "content" fails to read as curated work; the feed looks like a UI kit or a gradient demo.** | Library mix 40/25/20/15 with one shared `grade()` and black point; real-font typographic posters and flow-field prints carry the "made by a person" signal; every card has a title + maker caption; review the 24-card contact sheet before any animation and cull/re-seed the weakest third; if blobs dominate, bias toward typographic + flow-field. Never add illustration. |
| 3 | **Determinism / render cost of the chaos grid and the 3D phone.** | Draw the chaos as one canvas (`drawImage` of pre-baked junk cards, positions closed-form in `t`, jump cuts as pure functions of frame), not hundreds of DOM nodes — keeps DOM ≤ 400 and PNG entropy in check; JPEG q95 frames; scenes toggled `display:none`; phone shot has no `filter` on the 3D ancestor (editor blur-in happens after the match-cut); `fromTo` tweens only, `tl.seek(t,false)`; verify by rendering 100–130 twice with different `--workers` and `cmp`. |
| 4 | **Paper interlude feels like a different film after 34 s of dark.** | Same grain, same margin column, same serif, same light-drift behaviour; the carrier (the flow-field print) crosses the cut; the music strips rather than changes; only one cut into paper and none out of it. |
