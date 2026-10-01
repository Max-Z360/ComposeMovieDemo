# Concept — "Issue One" (Editorial Luxury)

| | |
|---|---|
| **Concept title** | **Issue One** — the launch film treated as the first issue of a magazine that only prints what it chooses |
| **Brand name** | **Tipmi** (final). Wordmark casing: `Tipmi` (title case, never all-caps). Single constant `BRAND_NAME = "Tipmi"` in the build; one wordmark asset. |
| **Tagline** | **Chosen, not ranked.** |
| **Opening / closing promise line** | Only the work worth seeing. |
| **CTA** | Now open for creators. |
| **Duration** | **42 s** of picture + 1 s silent black tail (43 s file). Cut-down friendly: 30 s = drop shots 2, 10 and shorten 12. |
| **Aspect / master** | 16:9, 1920×1080 @ 30 fps, libx264 crf 16. Vertical 9:16 re-frame later (copy lives in a left column; plates are portrait — both survive). |
| **Tempo grid** | 84 BPM · beat 0.714 s · bar 2.857 s. Every cut sits on a bar or beat line. |

---

## 1. The idea (one paragraph)

Open a magazine that has no filler pages. The film treats Tipmi the way a gallery treats a wall or a fashion quarterly treats a spread: paper-white, ink-black, one piece of work at a time, a hairline rule, a caption, a lot of air. The viewer starts in the noise they already live in — a black wall of thousands of flickering thumbnails, each seen for half a second — and then the page turns to paper and the film simply refuses to hurry again. Every image we show is **mounted** (a mat, a hairline frame, a creator's name, a series number) and every mounted piece carries a tiny oxblood mark: *someone chose this*. That mark is the whole argument. It appears when work is selected, it sits beside the creator's name in the studio, it becomes the dot inside the Tipmi logo. The single promise: **on Tipmi, your work is chosen by a person, shown like it matters, and paid for like it matters.** The viewer should feel their shoulders drop — relief, then desire, then a quiet "I want to be in there" — and the film should itself be proof that the brand has taste, because nothing in it is loud.

---

## 2. Visual language

### 2.1 Palette (hex)

One world: paper. One interlude: ink (the hook, 0–8.57 s). Never alternates after the turn.

| Role | Hex | Use |
|---|---|---|
| Paper (field) | `#F4F1EB` | Every frame after 8.57 s. `body` background. |
| Paper, deep | `#EAE6DE` | Plate mats, second plane, vignette edge tint (never black vignette on paper). |
| Paper, warm highlight | `#FAF7F1` | The moving "window light" band (2 % luminance lift). |
| Rule | `#C9C4BA` | 1 px hairlines: frames, sliders, ledger rules. |
| Ink, soft | `#3A3835` | Captions, UI labels. |
| Ink | `#141311` | Display type, wordmark, phone bezel core. |
| Ink, hook field | `#0C0B0A` | The black wall in the hook only. |
| **Accent — editor's oxblood** | `#7A2E35` | The *chosen* mark, the studio cursor, one ledger hairline, the dot in the logo. ≤ 5 % of frames, never as a fill larger than 14 px, never on type. |

Content grade (what lives *inside* the plates): one shared `grade()` function — black point lifted to `#1C1A18`, highlights rolled to `#F0E8DC`, hue family 20–50° (stone, clay, bone, ochre-grey) with one cool outlier (slate `#5A6B6E`) in ~1 of 5 cards; saturation ≤ 45 %. Nothing inside a plate may out-saturate the oxblood.

Film grade: single pass — grain `soft-light` 4 %, a static paper-tooth tile `multiply` 1.5 % (static, so it reads as paper, not film), vignette 8 % toward `#EAE6DE` (20 % black vignette in the hook only).

### 2.2 Typography (Google Fonts, OFL — all already in `fonts/` + `src/fonts.css`)

Exactly two families + one mono label.

| Role | Face | Setting | Size @1080p |
|---|---|---|---|
| Display (emotion lines) | **Fraunces** variable | `opsz 144, wght 300, SOFT 50`, tracking −2 %, leading 1.0, left-aligned on an 8 px baseline grid, left margin 9 % (173 px) | **88 px** (8.1 % frame) — one display size for the whole film |
| Display italic (human beat only) | Fraunces Italic | same axes | 88 px |
| Captions / UI / CTA | **Inter** variable | `wght 450–500`, tracking +3 % (caps labels +5 %, caps only for ≤ 3-word labels) | **22 px** (2 %) — one caption size |
| Masthead (small wordmark) | Fraunces | `opsz 72, wght 400`, tracking −1.5 % | 28 px, top-left at 9 % / 7 % |
| Folio (one label) | Geist Mono | `wght 400`, tracking +6 % | 16 px, "No. 01 — 2026", top-right, grey rule |
| Wordmark (end card) | Fraunces outlines → SVG | `opsz 144, wght 400, SOFT 50`, tracking −2.5 %, with the mark to its left | 160 px cap height (logo asset, not type scale) |
| End-card tagline | Fraunces | `opsz 144, wght 300→500` on "Chosen" | 44 px — the one justified third size, end card only |
| CJK swap | Noto Serif SC (display) / Noto Sans SC (captions) | wght 300–400 / 400–500 | same boxes; lines ≤ 8 characters |

Type motion: serif lines **masked rise** (translateY 110 % → 0, 600 ms, expo-out `cubic-bezier(0.16,1,0.3,1)`, words staggered 55 ms). The reveal line and the wordmark **blur-in** (blur 10 px → 0, opacity 0 → 1, scale 1.03 → 1, 550 ms, quint-out). Exits at 60 % of entry duration, 6 px drift upward, expo-in. One variable-weight moment only: "Chosen" in the end-card tagline, wght 300 → 500 over 700 ms (left-aligned fixed-width block). No typewriter, bounce, shadow, stroke, glow, gradient.

### 2.3 Motion language (5 rules)

1. **One direction of travel.** Everything moves gently up and toward the camera: 1–3 % push-in on every plate, parallax at 1 : 1.6 : 2.2 (paper / plates / type). The only reversal is the turn (hard cut), which is why it lands.
2. **The plate is the carrier.** One mounted card survives every transform: hero → grid cell → scrolling feed → phone screen → studio canvas → published piece → logo mark. The viewer never loses the object; the film reads as one continuous shot with three deliberate cuts (hook → tension, tension → paper, human beat → logo).
3. **Expo-out for things, slow symmetrical curves for the camera.** UI/type 400–800 ms expo/quint-out; camera drifts `cubic-bezier(0.65,0,0.35,1)` across the whole shot; exits expo-in. Nothing linear except texture drift. No element ever starts at 0 % scale (enter from 94–96 % or from a mask).
4. **Nothing starts or stops with anything else.** Secondary elements offset 60–120 ms, tertiary 120–220 ms; grid stagger 40 ms capped at 8 items; each shot rests 20 % with nothing new entering.
5. **Paper stays paper; light is the only thing that "happens" to it.** After the turn there are no field colour changes, no glows, no bloom. A single soft window-light band (≈ 400 px wide, 2 % lift) drifts 1 px/frame across plates and type — the premium version of "a camera is present".

### 2.4 Textures — grain, glass, light

- **Grain:** 8 pre-baked seeded 512² tiles, `createPattern`, tile = `floor(t·24) % 8` (24 fps cadence inside a 30 fps master — looks filmic), `mix-blend-mode: soft-light`, 4 % (5 % in the hook). Rendered as JPEG q95 frames per the feasibility finding.
- **Paper tooth:** one static 512² low-frequency noise tile at 1.5 % `multiply`. Static on purpose.
- **Glass:** none. On paper the "material" is **the mat** — paper-on-paper: plate inset 24 px inside a `#EAE6DE` mat, 1 px `#C9C4BA` hairline, 0.5 px inner shadow at 6 %. Used everywhere; it *is* the brand surface.
- **Light:** the window-light band (above) + on the phone a moving glare gradient (`115deg`, 14 % white → transparent 40 %) tweened with the rotation. No light leaks. No bloom. Shadows: one soft contact shadow under plates (`0 18px 40px rgba(20,19,17,.10)`), one large soft shadow under the phone (`0 60px 120px rgba(20,19,17,.28)`).
- **Vignette:** 8 % toward deep paper; 20 % black in the hook.

### 2.5 Device mockup treatment

Shown **once**, for 2.86 s (shot 8), large: phone height 82 % of frame, bezel `#1A1917` with a 1 px warm edge highlight `rgba(250,247,241,.14)`, radii 56 / 46 px, `perspective: 1800px`, starts at `rotateY(14deg) rotateX(6deg)` and settles to 4° / 2° over the shot (a dolly, not a spin), push-in 3 %. Screen is paper-white running the real feed (the same DOM layout condensed to one column — the carrier). Moving glare. Soft contact shadow on the paper floor; **no mirrored reflection** (that is a dark-field trick and reads wrong on paper). It enters by *being drawn*: a hairline ink rounded rectangle tightens around the single column and thickens into the bezel (700 ms, expo-out). It exits by dissolving: the bezel fades as the screen expands to full-bleed, so the UI is then shown flat, Linear/Apple style, for the studio.

### 2.6 How "content" is depicted without photos

Every piece of work is a **plate**: a seeded generative canvas (420×560 or 560×420, a few 1:1), mounted with mat + hairline + caption. Library of 24 built once at `READY` from a seeded PRNG, identical on every worker:

| Style | Share | Recipe | Reads as |
|---|---|---|---|
| Light studies | 40 % | 3–5 radial gradients, analogous warm pair, `lighter`, drawn at 1/6 res and upscaled, slight vignette | studio photography of fabric, skin tones, ceramics, dusk |
| Ink flow-fields | 25 % | 2 500 short polylines along a sine/value-noise angle field, 1–1.5 px, 25 % alpha, ink on paper or bone on slate | fine-art prints, etchings |
| Typographic posters | 20 % | one large Fraunces word or numeral ("NORTH", "07", "stillness"), rotated 90°, cropped by the card, one mono caption line | real editorial/graphic work |
| Geometric | 15 % | 3–6 rectangles/arcs on a strict grid, paper + ink + one clay tone, 1 px rules | Swiss posters, architecture |

Captions come from a seeded list of plausible creators and series — "Mara Lindqvist — Still life, 03", "Teo Adeyemi — North light", "Ines Ferrer — Letterforms, II", "Jun Park — Clay, studies" — never lorem ipsum. The hook reuses the same library, desaturated, 64×54 px, as the drowned wall: *the same work, unseen.* One halftone/dot-matrix variant is allowed once (shot 6) for texture.

---

## 3. Storyboard

Shot boundaries sit on the 84 BPM bar grid (bar n starts at (n−1)·2.857 s). Dwell = time the line is fully legible; all lines ≥ 1.2 s and within the craft table. **11 on-screen lines**, all ≤ 6 words / ≤ 32 chars.

| # | In → Out | Dur | What we see | On-screen copy (exact) | Motion | Sound cue |
|---|---|---|---|---|---|---|
| 1 | 0.00 → 2.86 | 2.86 s | **HOOK.** Ink-black field. A wall of ~600 tiny desaturated plate thumbnails (30×20 grid, 64×54 px, 2 px gutters) fills the frame; each cell swaps its image on a per-cell hashed cadence (~2 swaps/s), like a thousand autoplays. Vignette 20 %. Line in paper-white serif, left column, wall dimmed 30 % behind it. | **Everything, all the time.** (0.50–2.60) | 1.5 % push-in. Line masked-rise 600 ms, word stagger 55 ms. | Near-silence: room-tone noise −40 dB + A1 sub drone −20 dB from 0.6 s. No pad. |
| 2 | 2.86 → 5.71 | 2.86 s | **TENSION A.** Same wall; swap rate doubles; cells begin to drift toward camera and overlap (scale 1.00 → 1.06, three depth groups). Line replaces line 1. | **Half a second each.** (3.10–5.40) | Parallax groups at 1 : 1.6 : 2.2; vignette holds. Line masked-rise. | Hats enter as 8ths (−22 dB); LP-noise swell begins; pad enters very dark (fc 300 Hz). |
| 3 | 5.71 → 8.57 | 2.86 s | **TENSION B → FREEZE.** Flicker at ~12 fps; the grid breaks into three layers rushing upward past camera; no copy. At **7.86** everything freezes mid-swap and holds, dead still, for one beat. | — | Layers translateY −120/−190/−260 px over 2.1 s (expo-in); full stop at 7.86. | Hats to 16ths, filter opening, swell peaks at 7.8 → **hard mute at 7.86** (0.71 s true silence). |
| 4 | 8.57 → 11.43 | 2.86 s | **TURN.** Hard cut to empty paper `#F4F1EB`. Nothing but paper tooth and the faint window-light band. Then one word, ink, left column. Exits upward; paper rests for 0.8 s. | **Enough.** (9.00–10.40) | 1.5 % push-in on the paper; light band drifts 1 px/frame. Masked rise; exit 360 ms expo-in with 6 px lift. | Silence continues to 9.00; **one soft chime (A5)** on the word; from 9.7 a very low LP-noise breath rising into the downbeat. |
| 5 | 11.43 → 17.14 | 5.71 s | **REVEAL.** One plate blur-ins at centre-right (light study, warm stone, 3:4, 670 px tall) mounted in its mat with hairline; caption rises beneath at 12.2 ("Mara Lindqvist — Still life, 03"); at 12.6 the **oxblood chosen mark** (10 px ring with 4 px dot) sets beside the name. Display line in the left column. At **14.29** the masthead `Tipmi` (28 px) and folio "No. 01 — 2026" fade in at the top corners — the product is now a page. | **Only the work worth seeing.** (12.90–16.20) | Plate blur-in 650 ms quint-out from 96 %; 2 % push-in across the shot; light band crosses the plate 13.5–16.0; caption masked-rise; mark scales 94 → 100 % with 120 ms offset. Line blur-in 550 ms. | **11.43 downbeat:** pad opens (fc → 1.2 kHz), sub lands on A1, soft thump. 12.6: one paper tick on the mark (−16 dB). Chords: Am9. |
| 6 | 17.14 → 20.00 | 2.86 s | **PROOF A — the wall, done right.** The hero plate shrinks (800 ms, expo-out) into its place in an asymmetric editorial layout: 7 plates of different sizes and ratios on paper with wide gutters, one hairline rule, captions. The others enter staggered 40 ms from 94 % + 6 px blur. From 18.3 the chosen mark appears on each plate in reading order (90 ms stagger). One plate is the halftone variant. | **Chosen by hand.** (17.70–19.90) | Carrier: the hero plate. Layout parallax 1.6×, type 2.2×; 1 % push-in. | **17.14 hit** (cut on the bar). One soft tick for the whole stagger (not per mark). Chord → Fmaj9. |
| 7 | 20.00 → 22.86 | 2.86 s | **PROOF B — the feed.** The layout scrolls upward slowly (420 px over the shot, smoothstep with a 0.4 s hold mid-way) — one piece passes at reading pace; no counts, no badges, captions only. Line in the left column over whitespace. | **No filler. No noise.** (20.35–22.70) | Scroll as a `translateY` tween of a pre-built 3×-height layout; plates 1.6×, type 2.2×. | 20.00 hit. Hats back as 8ths (−22 dB). Chord → Cmaj7. |
| 8 | 22.86 → 25.71 | 2.86 s | **THE DEVICE, once.** The columns condense into a single column; a hairline rounded rectangle tightens around it and thickens into the near-black bezel; the phone now stands large on the paper floor at 14° / 6° with a soft shadow and moving glare, feed scrolling slowly inside. No copy — the object is the sentence. Masthead stays. | — | Bezel draw 700 ms expo-out; rotation 14°→4° Y, 6°→2° X across the shot (symmetrical bezier); push-in 3 %; glare gradient position tweened with the rotation. **Rest shot.** | 22.86 hit; sub dips −6 dB for 150 ms. Chord holds. |
| 9 | 25.71 → 28.57 | 2.86 s | **STUDIO — make.** Bezel dissolves as the screen expands to full-bleed: the plate sits left; a right-hand column of calm controls in Inter 22 px — Exposure, Tone, Grain, Crop — hairline sliders with ink thumbs. The oxblood cursor drags **Tone** from 0 to +12 (26.4–27.2) and the plate's grade warms (crossfade between two pre-rendered grades of the same card). | **Make it here.** (26.00–28.30) | Screen expand 600 ms expo-out; controls stagger 60 ms; slider motion quint-out; cursor eases. | 25.71 hit — **tempo peak**: hats 16ths, triangle layer enters, filter fully open (2 kHz). **UI tick 1** at 26.4 (−15 dB). Chord → G6/9. |
| 10 | 28.57 → 30.71 | 2.14 s | **STUDIO — present.** Panel swaps to *Present*: two tiny layout thumbnails (wide mat / tight mat); the ink underline slides to the second and the plate's mat, caption and series number reflow with expo-out. No copy. | — | Panel crossfade 400 ms; reflow 650 ms expo-out; underline 450 ms quint-out. | **UI tick 2** at 29.0. |
| 11 | 30.71 → 34.29 | 3.57 s | **PUBLISH — the ledger.** Studio chrome recedes (500 ms); the published plate stands alone with its caption. Beneath it, a colophon sets itself in Inter 22 px, one hairline between entries, the oxblood rule on the first: "Supporter joined — Jun Park" (31.4) · "Tip received" (32.1) · "Print sold · 1 of 25" (32.8). No currency symbols, no counters, nothing ticks up. | **Your work. Your terms.** (31.20–33.90) | Ledger lines masked-rise with 110 ms stagger (UI layer, not copy layer); plate 1.5 % push-in; light band crosses 32–34. | 31.43 hit. **UI ticks 3 & 4** at 31.4 and 32.8 (paper ticks, −15 dB). Chord → Fmaj9. |
| 12 | 34.29 → 37.86 | 3.57 s | **HUMAN BEAT.** Everything strips back: paper, the published plate large and slightly right, resting on a stack of three prints (3 px offsets, soft shadows) — a printed object, something made. The window light passes across it once, slowly. Italic line, left column. | **For people who make things.** *(Fraunces Italic)* (34.70–37.50) | 2 % push-in; light band 34.5–37.5; line masked-rise, exit 37.5 → 37.8 upward. | 34.29: hats and triangle drop out; pad LP back to 900 Hz; sub only. Chord → Am9 (add11). |
| 13 | 37.86 → 42.00 | 4.14 s | **LOGO.** Hard cut… except the plate: it shrinks (840 ms, expo-in-out) into a 36 px mark — hairline frame with the oxblood dot inside — and the wordmark **Tipmi** blur-ins beside it, centred on the paper; a light sweep (SVG clipPath) crosses the wordmark once. Tagline beneath, "Chosen" firming 300 → 500. CTA in Inter under a short hairline. Hold. 42.00 cut to black. | **Tipmi** *(wordmark, 38.40–)* · **Chosen, not ranked.** (39.45–42.00) · **Now open for creators.** (40.00–42.00) | Mark shrink carrier; wordmark blur-in 550 ms (reaches 90 % at **38.90**); clipPath sweep 39.0–39.8; tagline masked rise; wght settle 39.6–40.3; CTA fade 500 ms. End card = mark + wordmark + one line + one CTA, nothing else. | Riser 36.4 → 38.9 (noise LP 200 → 8 kHz, u²); **logo sound at 38.90**: 60–90 Hz thump + additive chime (E6/A5) + reversed-air tail; delay tails; pad release; **silence from 42.0 to 43.0** (black). |

Copy totals: 11 lines + wordmark. Hook (0–3 s): image + line in place by 1.1 s, no logo. Last 5 s (37–42): logo, tagline, quiet CTA. Product (a page of Tipmi) visible at 12.6 s; brand name small at 14.29 s, big at 38.4 s. Negative shots: 3 (never more). Ratio ≈ 60 % transforms / 40 % cuts (cuts at 2.86, 5.71, 8.57, 37.86 only).

### Copy as data (swap-ready)

```js
const BRAND_NAME = "Tipmi";
const COPY = {
  en: ["Everything, all the time.", "Half a second each.", "Enough.",
       "Only the work worth seeing.", "Chosen by hand.", "No filler. No noise.",
       "Make it here.", "Your work. Your terms.", "For people who make things.",
       "Chosen, not ranked.", "Now open for creators."],
  zh: ["一切，无时无刻。", "每张，半秒。", "够了。",
       "只看值得看的作品。", "亲手挑选。", "无填充，无噪音。",
       "在这里创作。", "你的作品，你定规则。", "献给创作的人。",
       "被选中，不被排序。", "创作者招募中。"]   // drafts — native copywriter to finalise
};
```
`?lang=zh` swaps the array and the display face (Fraunces → Noto Serif SC); the timeline does not change.

---

## 4. Music and sound (all synthesised in Node → WAV)

**Tempo 84 BPM · key A minor (relative C) · 48 kHz · target −14 LUFS integrated, ≤ −1 dBTP, LRA 6–10 LU.** Beat 0.714 s, bar 2.857 s; `cues.json` is the single source of truth for both the GSAP timeline and the synth:

```json
{ "bpm": 84, "hits": [8.571, 11.429, 17.143, 20.0, 22.857, 25.714, 28.571, 31.429, 34.286],
  "ticks": [12.6, 18.3, 26.4, 29.0, 31.4, 32.8], "mute": [7.857, 8.571],
  "chime": 9.0, "riser": [36.4, 38.9], "logo": 38.9, "end": 42.0, "tail": 43.0 }
```

**Instruments (feasibility §4 building blocks):** pad = 3 detuned saws (±8 ¢) per note, 4-note voicings, one-pole LP ×2, L/R fc ratio 1 : 1.03, slow LFO 0.7 Hz ±200 Hz; triangle layer one octave up at −12 dB (feature run only); sub = sine A1 55 Hz, mono, dry, 120 Hz LP, −6 dB side-dip for 150 ms on each hit; hats = seeded white noise → HP 8 kHz → `exp(−60t)`, alternating L/R, Haas 10 ms; paper ticks = 30 ms noise burst band-passed 2–4 kHz; riser = noise → LP sweep 200 → 8 000 Hz exponential, amplitude u²; chime = additive sines f·[1, 2.01, 3.0, 4.2, 5.4], decays `exp(−t(2+2j))`; thump = sine with pitch envelope 120 → 60 Hz over 80 ms, decay 300 ms; feedback delay 357 ms (dotted 8th at 84 BPM), feedback 0.35, LP 3 kHz in loop; Schroeder reverb (4 combs + 2 allpasses), 20 ms pre-delay, wet LP 5 kHz, mix 0.3, sub bypasses it. Bus: `tanh` soft clip, then two-pass `loudnorm linear=true`.

**Structure aligned to the storyboard**

| Time | Picture | Music |
|---|---|---|
| 0.00–2.86 | Hook | Room tone (LP noise −40 dB) + A1 sub drone from 0.6 s. ≥ 1.5 s of near-silence honoured. |
| 2.86–7.86 | Tension A/B | Hats 8ths → 16ths at 5.71; filtered-noise swell `u²`; pad enters at fc 300 Hz, Am (no 9th yet), −18 dB. |
| 7.86–9.00 | Freeze + turn | **Hard mute 0.71 s**, then one soft chime (A5) at 9.00 on "Enough." |
| 9.70–11.43 | Breath into reveal | Low LP-noise breath rising; nothing else. |
| 11.43 | Reveal downbeat | Pad opens (fc → 1.2 kHz, Am9), sub lands A1, soft thump. |
| 11.43–25.71 | Reveal → proof → device | Chord every 2 bars: Am9 · Fmaj9 (17.14) · Cmaj7 (20.0) · hold (22.86); hits every bar line up with the cuts; hats 8ths return at 20.0, −22 dB. |
| 25.71–34.29 | Feature run (**tempo peak**) | G6/9 (25.71) → Fmaj9 (31.43); triangle layer in; hats 16ths; filter fully open 2 kHz; four paper ticks on the UI interactions, −15 dB. |
| 34.29–37.86 | Human beat | Strip to pad + sub; LP down to 900 Hz; Am9(add11); hats out. |
| 36.40–38.90 | Into the logo | Riser (noise sweep + sine rising one octave) ending exactly at 38.90. |
| 38.90 | Logo | Thump + chime (E6 over A5) + 400 ms reversed-air tail; pad release 3 s; delay tails darken. |
| 40.00–42.00 | Hold | Tails only. |
| 42.00–43.00 | Black | Silence (reverb −∞ by 42.3). |

**Sound-design hits (5)**
1. **The freeze** (7.86) — the hit is the absence: full-band mute for one beat, the loudest moment in the film.
2. **"Enough." chime** (9.00) — one soft A5 additive chime, dry, −14 dB.
3. **Reveal downbeat** (11.43) — pad bloom + sub landing + thump, the first full chord of the film.
4. **Chosen mark tick** (12.6, and once for the stagger at 18.3) — a single paper tick, like a pencil on card.
5. **Logo** (38.90) — the one logo sound: riser resolving into thump + chime + reversed air, onset at the frame the wordmark hits 90 %. Nothing else in the film gets a whoosh.

---

## 5. Why this beats a generic "social app" ad — and the risks

**Why it wins**
- **It never shows a person smiling at a phone.** The product is treated as a printed object and a gallery wall; the one phone shot is wordless, slow and lit like furniture. Every competitor spot is UI-plus-faces; this is paper-plus-work.
- **The enemy is dramatised in 8 seconds and never named.** No crossed-out logos, no "no algorithm" banner — just a wall of thumbnails at half a second each, then a page that refuses to hurry. The contrast *is* the argument.
- **Curation gets a visible gesture.** The oxblood chosen mark turns an abstract promise ("hand-curated") into a thing you can watch happen, and it becomes the dot in the logo — the brand idea and the brand mark are the same object.
- **Money with dignity.** The ledger beat is typeset like a colophon: a name, a tip, a print sold. No dollar rain, no counters. It quietly earns the Tipmi name without explaining it.
- **The film decelerates.** Tempo peaks at the studio (70–80 % runtime) then everything is stripped away into silence — the opposite of a sizzle reel. The restraint is itself the proof that Tipmi has taste.
- **It is cheap to make excellent.** Everything is CSS transforms, one low-res canvas, masked type and seeded cards — the premium moves that benchmark fastest in the sandbox — and the single costly element (the phone) is on screen once.

**Risks and mitigations**

| Risk | Mitigation |
|---|---|
| **Paper world reads as a stationery / Notion template.** | Ink-black hook as a bookend; grain + paper tooth; hairline discipline (1 px, one grey); asymmetric layouts, nothing centred until the end card; Fraunces at opsz 144 / wght 300 with −2 % tracking (editorial, not dainty); a light that *moves*. Checklist §7 of the craft guide run on the contact sheet before the master. |
| **Generative "content" reads as abstract wallpaper, not curated work.** | Mount everything (mat, hairline, name, series number); one `grade()` for the whole library; 20 % typographic posters with real words so the feed contains legible "work"; vary aspect ratios; cap saturation below the accent; review the 24-card library as a sheet and cull the weakest 6 before building the timeline. |
| **The studio / ledger beats look like a UI kit or feel crass.** | One interaction per shot, Inter 22 px only, hairline sliders, no icons, no glass; ledger has no currency symbols and nothing animates numerically; the phone is shown once at ≤ 14°, no reflection; the accent is capped at ≤ 5 % of frames and never used as a fill. |
| **Determinism of the hook flicker.** | Every cell's swap derives from `hash(cellIndex, floor(t·fps_cell))`, no PRNG in `seek`; freeze = clamp t at 7.86; verified by the two-worker `cmp` test on frames 60–120. |
