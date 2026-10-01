# CREATIVE BRIEF — Tipmi launch film (FINAL)

Executive creative director's lock. Built from the winning concept **Issue One (Editorial)** with the best of **Instrument** and **Noise Floor** grafted in where the judges asked, and every listed weakness fixed (appendix A maps each judge note to its fix). This document is the spec; `01_positioning.md`, `02_craft_guide.md` and `03_feasibility.md` remain the reference for *why*. Where this brief and a concept file disagree, this brief wins.

---

## 1. Brand, tagline, format

| | |
|---|---|
| **Brand name** | **Tipmi** (final, from the client). Single constant `BRAND_NAME = "Tipmi"` in `src/constants.js`; the wordmark, the top bar and the end card all render from it. No moon / "lune" leftovers anywhere. |
| **Wordmark casing** | **`Tipmi`** — title case, never all-caps. Set in Fraunces (opsz 144, wght 500, tracking −2.5 %) with **both i's dotless (U+0131 ı)** and the two tittles drawn as separate **oxblood circles**. The first tittle *is* the "chosen" dot that has followed the work through the film; the second arrives 90 ms later. Rationale: title case reads as a proper noun / editorial masthead (not the lowercase-startup shape Judge 2 flagged), and the dotted-i trick gives the serif wordmark an ownable mark that survives at 36 px and as an app icon (one oxblood dot on paper). The "tip + mi" reading is left for the viewer to find — it is never explained on screen. |
| **Tagline** | **Chosen, not ranked.** — used **once**, on the end card (not mid-film). |
| **Mid-film promise line** | Only the work worth seeing. (reveal) |
| **CTA** | Now open for creators. (`CTA` constant; alt "Request an invite.") |
| **Duration** | **43.000 s file = 1 290 frames**: picture 0.000–42.000 s (1 260 frames), hard cut to black at 42.000, black 42.000–43.000. `window.DURATION = 43`. Audio is −∞ by 42.3 s. 30 s cut-down later = drop shots 2–3 to one bar and shots 8 and 11. |
| **Frame** | 1920 × 1080, **30 fps**, 16:9, JPEG q95 frames → libx264 crf 16–17, yuv420p, AAC 256 k. Vertical 9:16 re-frame later (copy lives in a left column, plates are portrait — both survive). |
| **Tempo grid** | 84 BPM · beat 0.7143 s · bar 2.8571 s. Bars start at 0 / 2.857 / 5.714 / 8.571 / 11.429 / 14.286 / 17.143 / 20.000 / 22.857 / 25.714 / 28.571 / 31.429 / 34.286 / 37.143 / 40.000. Every cut and every chord sits on this grid; every line enters on a beat. |

---

## 2. The promise and the tone

**The promise.** On Tipmi your work is chosen by a person, shown like it matters, and paid for like it matters. The film is told from the creator's side of the glass: one finished piece, made over hours, vanishes into the half-second feed everyone already knows — and then it comes back, mounted on paper, with a small oxblood mark beside its maker's name that says *someone chose this*. That mark is the whole argument. It appears when the work is selected, it sits beside every piece on the wall, it stays with the work through the studio and the ledger, and at the end it becomes the dot of the i in **Tipmi**. The brand idea and the brand mark are one object. Tone: editorial, gallery-quiet, tactile, confident, never boastful — paper, ink, hairlines, generous air, a light that moves, a soundtrack that breathes. The viewer should feel their shoulders drop (relief), then want to look longer (desire), then think *I want my work in there* (invitation). Nothing in the film is loud; the restraint is itself the proof that Tipmi has taste.

**Do**
1. Keep the **one carrier**: the hero plate is on screen from frame 0 to 37.1 s and its dot carries to the logo. Every transition re-targets that object; no wipes.
2. **Mount everything** that is "work": plate inset in a `#EAE6DE` mat, 1 px `#C9C4BA` hairline, maker — series caption in Inter 22, and (once chosen) the 18 px oxblood dot. Unmounted generative art is wallpaper; mounted it is a print.
3. Make the **accent a gesture, not a colour**: oxblood appears only when someone chooses, publishes or signs (the chosen frame draw, the dots, the Warmth active tick, the Publish ring, the tittles). ≤ 5 % of frames, never on type, never as a fill larger than 24 px except the Publish ring stroke.
4. Let **light be the camera**: a 420 px window-light band (+6 %) drifts across paper, plates and type at 1.5 px/frame; every plate has a 1.5–3 % push-in; 3 % paper tooth; real contact shadows. Nothing is ever perfectly still.
5. Put **every tool interaction in detents with a sound**: 7 Warmth clicks = 7 paper ticks in 420 ms; one tap = one tick; the long-press Publish ring = one riser into one lift. Every sound has a detent; every detent has a sound.

**Don't**
6. No magazine conceit: no "Issue", no folio, no "No. 01 — 2026", no colophon label, no mono font. The page is an **app page** (top bar `Tipmi · Today — 31 chosen`), and a phone is on screen by 22 s.
7. No competitor parody: no pills ("Sponsored", "99+"), no crossed-out logos, no hot pink/cyan/acid. The hook wall is our own library, dimmed and hurried — the same work, unseen.
8. No money theatre: no currency glyphs, no counters, no "you keep 90 %", no price. The ledger says *Supporter joined — Noor Haddad · Tip received · Print sold — 1 of 25* and nothing animates numerically.
9. No stock moves: no 360° phone, no reflection on paper, no glass panels, no bloom, no glow on text, no bounce/typewriter/slide-across, no element entering from 0 % scale, no two elements starting on the same frame.
10. No over-writing: 11 lines + wordmark, ≤ 6 words each, one display size, one caption size, `Chosen, not ranked.` spoken once, at the end.

---

## 3. Design tokens

### 3.1 Palette

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0C0B0A` | Ink field — **hook only** (0–8.571 s). Vignette 20 % black here. |
| `--paper` | `#F4F1EB` | Field for every frame after 8.571 s; `body` background; phone screen background (the app *is* paper). |
| `--paper-deep` | `#EAE6DE` | Mats, second plane, paper vignette tint, ambient-occlusion ellipse under the phone. |
| `--paper-light` | `#FBF8F2` | The moving window-light band (+6 % luminance over paper; +4 % over plates via `soft-light`). |
| `--rule` | `#C9C4BA` | All 1 px hairlines: mats, slider tracks, ledger rules, dial inactive ticks, top-bar rule. |
| `--ink` | `#141311` | Display type, wordmark, phone bezel core, dial active needle. |
| `--ink-soft` | `#3A3835` | Captions, UI labels, slider thumbs, CTA. |
| `--muted` | `#8A867E` | Secondary captions, ledger meta, status bar, readouts at rest, "Today — 31 chosen". |
| `--accent` | `#7A2E35` | **Editor's oxblood.** The chosen frame draw, every chosen dot, the Warmth active tick, the Publish ring, the wordmark tittles. Nothing else. (Checked against the library: no card hue in 330–20° exceeds 35 % saturation, so the accent never fights the work; it sits far from XHS `#FF2442` in both luminance (≈ 25 %) and saturation.) |
| `--accent-2` | `#B8674A` | Clay — the warm pole of the **content world only** (inside plates, never in UI). |
| `--bezel` | `#1A1917` + 1 px edge `rgba(250,247,241,.14)` | The phone. |
| `--shadow-plate` | `0 2px 4px rgba(20,19,17,.08), 0 24px 48px rgba(20,19,17,.14)` | Contact + ambient shadow under every page plate (Judge 3: real shadows so paper never reads flat). |
| `--shadow-phone` | `0 4px 10px rgba(20,19,17,.14), 0 48px 96px rgba(20,19,17,.24)` | Under the phone, plus a `#EAE6DE` AO ellipse 1.3× phone width at 40 % opacity. No reflection. |

**Content grade (`grade()` in `src/gen/cards.js`, applied to every plate once at build):** black point lifted to `#1C1A18`, highlights rolled to `#F0E8DC`, warm hue family 18–48° (clay / bone / stone / ochre-grey) with a cool outlier at 200–215° (slate) in ~1 of 5 cards, saturation ≤ 45 %, contrast 1.04, +3 % warmth in mids. Cards are the *darkest* objects on the page (rich dusk studies, ink on bone, bone on slate) so they read as photographs with depth, not pastel blobs; pale light-studies are capped at 3 of 24.

**Film grade (one pass, in-page):** grain `soft-light` 4 % on paper / 5 % on ink; static paper tooth `multiply` 3 %; vignette 8 % toward `#EAE6DE` on paper, 20 % black on ink. No CSS `filter` on the stage.

### 3.2 Typography (Google Fonts, OFL; local copies already in `fonts/`, declared in `src/fonts.css`)

| Role | Family / file | Raw source (download only if missing) | Setting @1080p |
|---|---|---|---|
| Display (all 11 lines) | **Fraunces** variable `fonts/Fraunces-Variable.ttf` | `https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf` | **84 px** (7.8 % frame), `opsz 144, wght 400, SOFT 50, WONK 0`, tracking −0.02 em, leading 1.0, **left-aligned at x = 173** (9 %), text box top y = 212 (baseline ≈ 282 on the 8 px grid), max width 900 px, ≤ 2 lines (two lines only on the reveal and human-beat lines). wght 400, not 300 — the dainty register is what reads "Notion" on paper. |
| Display italic (human beat only) | **Fraunces Italic** `fonts/Fraunces-Italic-Variable.ttf` | `https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces-Italic%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf` | same axes, 84 px |
| Top-bar brand (small) | Fraunces | — | 28 px, `opsz 72, wght 500`, tracking −0.015 em, x = 173, y = 64 |
| End wordmark | Fraunces, built by `src/gen/wordmark.js` from `BRAND_NAME` | — | **176 px**, `opsz 144, wght 500, SOFT 50`, tracking −0.025 em, x = 173, baseline y = 520; i/j tittles removed (U+0131 / U+0237) and redrawn as 24 px circles in `--accent` at each stem's measured x (canvas `measureText` on prefixes), centre y = baseline − 0.74 em. Fallback if the glyph is missing: clip the tittle with a 1-line `overflow:hidden` wrapper of x-height. |
| End tagline | Fraunces | — | **44 px**, `opsz 144, wght 400`, tracking −0.015 em, x = 173, baseline y = 660; the word **Chosen** firms `wght 400 → 600` over 700 ms (fixed-width left-aligned block). The one justified third display size, end card only. |
| Captions / UI / ledger / CTA | **Inter** variable `fonts/Inter-Variable.ttf` | `https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf` | **22 px** (2 %), `wght 500`, tracking +0.03 em, colour `--ink-soft`; caps labels (≤ 3 words: WARMTH, EXPOSURE, GRAIN, CROP, PUBLISH) tracking +0.05 em, `--muted`; readouts `font-variant-numeric: tabular-nums`. Inside the phone: 21 px (20 px logical × 1.05); status bar 16 px. |
| CJK swap (`?lang=zh`) | **Noto Sans SC** `fonts/NotoSansSC-Variable.ttf` | `https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf` | display `wght 400` 84 px, captions `wght 500` 22 px; same boxes, same timeline; every zh line ≤ 8 characters. |

Exactly **two families** on screen (Fraunces + Inter). No mono. Pre-touch every family/weight with `document.fonts.load()` before `READY` resolves.

**Type motion:** display lines **masked rise** (wrapper `overflow:hidden`, `translateY(110%) → 0`, 600 ms, expo-out `cubic-bezier(0.16,1,0.3,1)`, words staggered 55 ms); the reveal line and the wordmark **blur-in** (`blur(10px) → 0`, opacity 0 → 1, `scale 1.03 → 1`, 550 ms, quint-out `cubic-bezier(0.22,1,0.36,1)`); exits at 60 % of entry duration, 6 px upward drift, expo-in `cubic-bezier(0.7,0,0.84,0)`. No typewriter, bounce, shadow, stroke, glow, gradient. Lines never overlap: a new line enters only when the previous is ≥ 90 % out.

### 3.3 Grain, light, vignette, glass

| | Setting |
|---|---|
| Grain | 8 pre-baked seeded 512² monochrome tiles (xorshift32, seed `SEED+2`), drawn via `createPattern` with a seeded per-tile offset, tile = `floor(t·24) % 8` (24 fps cadence inside the 30 fps master), `mix-blend-mode: soft-light`, opacity **0.04** on paper, **0.05** on ink. Stronger in shadows by construction of the blend. |
| Paper tooth | One static 512² low-frequency noise tile (value noise, 6 px cells, blurred once at build), `multiply` **0.03**. Static on purpose (paper, not film). |
| Window light | One div 420 px wide, full height, `linear-gradient(90deg, transparent, var(--paper-light) 50%, transparent)`, `mix-blend-mode: soft-light`, opacity 0.6 (≈ +6 % on paper), rotated −8°, moving **1.5 px/frame** left → right across each held plate; restarts per shot from x = −420. On ink (hook) the band is `rgba(255,255,255,.04)`. |
| Vignette | One full-frame div, `radial-gradient(ellipse at 50% 50%, transparent 58%, var(--paper-deep) 100%)` at opacity 0.5 (≈ 8 %) on paper; `rgba(0,0,0,.55)` edge (≈ 20 %) on ink. Never a black vignette on paper. |
| Glass | **None.** The brand material is the mat (paper on paper). `backdrop-filter` is banned. |
| Bloom / glow | **None.** |
| Contact shadows | See `--shadow-plate` / `--shadow-phone`. The human-beat print adds `0 1px 0 #fff` top edge and a 1.5° rotation. |

### 3.4 Device mockup

| | Spec |
|---|---|
| Logical screen | **390 × 844** at scale **1.05** → **410 × 886 px** on the stage (82 % of frame height). |
| Bezel | 12 px uniform, `--bezel`, outer **434 × 910 px**, outer radius **64 px**, screen radius **52 px**, 1 px warm edge highlight inset. No camera cut-out, no buttons. |
| Position | Phone centre x = **1180**, y = 540 (right of the copy column). |
| 3D | `#stage{perspective:1800px}`; phone `transform-style:preserve-3d`. Enters flat (0°). Dolly `rotateY 0 → 7°`, `rotateX 0 → 3°` over 1.7 s (`cubic-bezier(.65,0,.35,1)`), push-in 3 %. Returns to 0° before any 2D re-target. Max angle ever: 7°. No reflection; AO ellipse + `--shadow-phone` instead. |
| Glare | Overlay `linear-gradient(115deg, rgba(255,255,255,.12), transparent 40%)`, background-position tweened with the rotation (`--glare-x`). |
| Screen content | Native-resolution DOM authored **at the final screen size from the first frame it exists** (never scaled up): status bar 46 px (time `10:08` left, three hairline glyphs right, `--muted`); app header 56 px: `Tipmi` Fraunces 25 px left, `Today — 31 chosen` Inter 21 px right, 1 px rule beneath; feed = single column, plates 362 px wide with 8 px mats, 24 px gutters, caption 21 px under each, chosen dot 14 px beside the caption; no like counts, no avatars, no badges. Scroll = `translateY` tween of a pre-built 3×-height column. |

### 3.5 Spacing scale

8 px baseline grid. Steps: **4 · 8 · 16 · 24 · 40 · 64 · 104 · 173**. Left margin 173 (9 %); top-bar y = 64; display box top y = 212; captions sit 16 px under a mat; mats 24 px on page plates, 12 px on wall plates, 8 px inside the phone; column gutters 24 px; safe area ≥ 80 px from every edge for anything that is text (title-safe 90 %).

---

## 4. Copy deck (11 lines + wordmark; all ≤ 6 words, ≤ 32 chars; swap-ready)

Dwell = fully legible time after the entry animation; all meet the craft-guide table (1–2 words ≥ 1.0 s, 3–4 ≥ 1.5 s, 5–6 ≥ 2.1 s, +0.3 s for animated entries). Lines enter on beats. No two lines overlap (end card excepted, where tagline and CTA are the one permitted two-line card).

| # | In | Out | Line (EN, exact) | Words | Style | Dwell | zh draft (≤ 8 chars; native copywriter to finalise) |
|---|---|---|---|---|---|---|---|
| L1 | 0.500 | 2.600 | **Hours to make.** | 3 | Fraunces 84, bone `#ECE8E1` on ink | 1.6 s + hold | 做了几小时。 |
| L2 | 3.071 | 5.400 | **Seconds to vanish.** | 3 | Fraunces 84, bone on ink | 1.8 s | 几秒就淹没。 |
| L3 | 9.286 | 10.714 | **Not anymore.** | 2 | Fraunces 84, ink on paper | 1.1 s | 到此为止。 |
| L4 | 13.571 | 16.600 | **Only the work worth seeing.** | 5 | Fraunces 84, blur-in, 2 lines (`Only the work / worth seeing.`) | 2.5 s | 只看值得看的。 |
| L5 | 17.714 | 19.900 | **Chosen by hand.** | 3 | Fraunces 84 | 1.6 s | 亲手挑选。 |
| L6 | 20.357 | 22.600 | **No filler. No noise.** | 4 | Fraunces 84 | 1.7 s | 不凑数，不喧哗。 |
| L7 | 26.000 | 28.300 | **Make it here.** | 3 | Fraunces 84 | 1.7 s | 在这里创作。 |
| L8 | 31.643 | 34.000 | **Your work. Your terms.** | 4 | Fraunces 84 | 1.8 s | 你的作品，你定。 |
| L9 | 34.571 | 36.950 | **For people who make things.** | 5 | Fraunces *Italic* 84, 2 lines (`For people / who make things.`) | 1.8 s + slow exit | 献给创作的人。 |
| W | 38.000 | 42.000 | **Tipmi** (wordmark, dotless i's + 2 oxblood tittles) | — | Fraunces 176 wght 500 | 90 % at **38.571** | Tipmi (unchanged) |
| L10 | 39.286 | 42.000 | **Chosen, not ranked.** | 3 | Fraunces 44, "Chosen" wght 400 → 600 | 2.1 s | 被选中，不被排序。 |
| L11 (CTA) | 39.857 | 42.000 | **Now open for creators.** | 4 | Inter 22, `--ink-soft`, under a 40 px hairline | 1.7 s (holds to cut) | 现向创作者开放。 |

**Final CTA line:** `Now open for creators.` (constant `CTA`; alt `Request an invite.`).

UI strings are set-dressing, live in the same `COPY` object, and are not counted as lines: `Tipmi` · `Today — 31 chosen` · `10:08` · `Mara Lindqvist — Still life, 03` (hero caption) · `WARMTH` `EXPOSURE` `GRAIN` `CROP` · `+7` · `PUBLISH` · `Supporter joined — Noor Haddad` · `Tip received` · `Print sold — 1 of 25` · `Published today`.

```js
// src/constants.js (every claim is a blankable constant; blanking never re-times a shot)
const BRAND_NAME = "Tipmi";
const TAGLINE    = "Chosen, not ranked.";
const CTA        = "Now open for creators.";
const HERO_MAKER = "Mara Lindqvist", HERO_TITLE = "Still life, 03";
const SUPPORTER  = "Noor Haddad";      // "" hides the ledger line
const EDITION    = "1 of 25";          // "" hides "Print sold"
const CHOSEN_COUNT = "31";             // top bar "Today — 31 chosen"
const COPY = { en: [/* L1..L11 above, in order */], zh: [/* drafts above */] };
```
`?lang=zh` swaps `COPY` and the display family (Fraunces → Noto Sans SC); the timeline does not change.

---

## 5. Storyboard

### 5.1 The content library (built once at `READY`, seeded, identical on every worker)

24 plates on offscreen canvases (portrait 420×560; 6 landscape 560×420; 3 square 480×480), each with a seeded caption. All pass through the one `grade()`. **Plate 0 is the hero**: a dusk light-study — deep clay `#6E3A2C` rising to bone `#E8DCC8` with a slate `#3E4A4F` shadow lower-left, 4 radial gradients, `lighter` blend, drawn at 70×93 and upscaled smooth, 12 % vignette — reads as a studio photograph of fabric in late light. Caption `Mara Lindqvist — Still life, 03`.

| Share | Style | Exact recipe | Reads as |
|---|---|---|---|
| 10 / 24 | **Light studies** | 3–5 radial gradients, centres on a seeded ring, analogous warm pair (hue 18–42°) or, in 2 of 10, cool (200–215°); `lighter`; drawn at 1/6 res, upscaled with smoothing; vignette 10–14 %; luminance mid 35–55 % (only 3 of 10 may be pale). | studio photography: fabric, ceramics, skin tones, dusk |
| 6 / 24 | **Ink flow-fields** | 2 500 polylines × 40 steps of 3 px following `angle = 2π·valueNoise(x/180, y/180) + 0.6·sin(seed)`; 1.2 px, alpha 0.25; ink `#2A2724` on bone `#ECE5D8` (4) or bone on slate `#3E4A4F` (2). | fine-art prints, etchings |
| 5 / 24 | **Typographic posters** | One Fraunces Italic word or numeral at 320 px (`NORTH`, `07`, `stillness`, `Tide`, `II`), rotated −90°, cropped by the card; one Inter 14 px caption line bottom-left; ink on bone, or bone on oxblood-black `#3A2224` (1 of 5). | real editorial / graphic work |
| 3 / 24 | **Geometric** | 3–5 rectangles/arcs on a 12-column grid, bone + ink + one clay `#B8674A` shape, 1 px rules. | Swiss posters, architecture |

Captions (seeded list, never lorem ipsum): `Mara Lindqvist — Still life, 03` · `Teo Adeyemi — North light` · `Ines Ferrer — Letterforms, II` · `Jun Park — Clay, studies` · `Noor Haddad — Lido, 7 am` · `Tomas Reyes — Tide, no. 7` · `Hana Ito — Quiet hours` · `Aya Toda — Mass & void` · `Jonah Keel — Tidal, no. 4` · `Elin Sato — Dusk, 02` · `Oren Baptiste — Field notes` · `Lia Moreau — Paper, folded` · … (24). Review the library as a contact sheet **before** building the timeline; cull/re-seed the weakest 6.

**The hook wall** uses the same library drawn at 30×40 and upscaled *smooth* (soft, not blocky), luminance 35 %, saturation −60 %, into 3:4 cells of 116×155 with 8 px gutters (15 × 7 = 105 cells, bleeding off frame). Per-cell swap: `card = hash(cell, floor(t·rate)) % 24`. No pills, no chrome, no competitor UI — the same work, unseen.

### 5.2 Shots

Positions in stage px (1920×1080). "Copy" = the display line at x = 173, top y = 212. All plates "mounted" = mat + hairline + caption + `--shadow-plate`. Easing: expo-out `cubic-bezier(.16,1,.3,1)`, quint-out `cubic-bezier(.22,1,.36,1)`, expo-in `cubic-bezier(.7,0,.84,0)`, camera `cubic-bezier(.65,0,.35,1)`.

| # | In | Out | Scene | What is on screen (every element, position, size, motion) | Transition into next | Sound cue |
|---|---|---|---|---|---|---|
| 1 | 0.000 | 2.857 | **Hook A — the work** | Ink field `--bg`, vignette 20 %, grain 5 %. Centre-right: the **hero plate** 480×640 (no mat yet; a 1 px `rgba(236,232,225,.10)` edge) at x 1040–1520, y 220–860, **developing**: 16 pre-baked dissolve keyframes (per-pixel threshold of a hashed noise tile against a rising value, darks resolve first) crossfaded in pairs over 0.20–1.60 s, then held; push-in 2 % across the shot; window-light band (4 % white) crosses it 1.4–2.8 s. **L1 `Hours to make.`** masked-rise at 0.500 (bone `#ECE8E1`), exits 2.600 (360 ms, 6 px up). Nothing else. | On the bar: the plate **falls away** — scale 1 → 0.242 (to cell size 116×155), x/y to cell (7,3) at (1000, 496), 500 ms expo-in; the film's only backward move. | Room tone (LP noise 800 Hz, −42 dB) from 0; sub A1 55 Hz −18 dB from 0.6 s. No pad, nothing rhythmic. |
| 2 | 2.857 | 5.714 | **Hook B — the wall** | The hero lands in the **wall**: 105 dimmed cells appear around it hash-staggered over 2.857–3.30 (hard appears, no easing — cheapness has no easing), swapping at 2/s; the hero is the only warm, sharp cell. Whole wall scrolls up 0 → 180 px (smoothstep) and the hero cell dims to 35 % by 5.0 and is carried off. Three depth groups at 1 : 1.6 : 2.2 begin to separate. **L2 `Seconds to vanish.`** masked-rise 3.071, exit 5.400. | Continuous (same wall, faster). | Hats enter on 8ths (−24 dB, noise HP 8 kHz, `exp(−60t)`, L/R alternating). Band-passed noise swell starts 3.5 s (300 Hz → 4 kHz, amplitude u²). Sub pulses per bar. |
| 3 | 5.714 | 8.571 | **Tension → freeze** | Swap rate 4/s; cell flicker at 12 fps (`floor(t·12)`); the three groups rush upward past camera (translateY −120 / −190 / −260 px over 5.714–7.857, expo-in); scale 1.00 → 1.06. No copy. At **7.857** everything **freezes mid-swap** and holds dead still for 0.714 s (t clamped). | **Hard cut** at 8.571 on the bar: ink → paper. | Hats to 16ths, pad enters very dark (Am, fc 300 Hz, −20 dB) 5.0–7.857, swell peaks 7.8 → **hard mute at 7.857** (every voice gated in 20 ms; true digital silence 7.857–8.571). |
| 4 | 8.571 | 11.429 | **Turn — paper** | Empty `--paper`: tooth 3 %, vignette 8 %, the light band drifting from x = −420. Nothing else for 0.714 s. **L3 `Not anymore.`** masked-rise at **9.286** (ink), exits 10.714 (360 ms, 6 px up). Paper rests 10.7–11.43. 1.5 % push-in. | Continuous; the plate blur-ins on the downbeat. | Paper-room tone returns −44 dB at 8.571 (the room comes back, the music doesn't). **One dry chime A5** on the word at 9.286 (−14 dB, reverb 15 %). From 10.0 a low LP-noise breath rises into the downbeat. |
| 5 | 11.429 | 17.143 | **Reveal — chosen** | The **hero plate, mounted**: plate 480×640 in a 24 px mat → 528×688 at x 1120–1648, y 196–884, blur-in 650 ms quint-out from 96 % (blur 10 → 0); push-in 2 % across the shot; light band crosses it 13.0–16.5. Caption `Mara Lindqvist — Still life, 03` (Inter 22) masked-rise at 12.143 at (1120, 904). **The chosen gesture**: a 2 px `--accent` hairline **draws clockwise** around the mat (SVG rect, stroke-dashoffset) 12.857–13.357; at 13.357 the **18 px oxblood dot** sets at (1096, 915) beside the caption, scale 0.94 → 1 (120 ms). **L4 `Only the work worth seeing.`** blur-in at 13.571 (2 lines), exits 16.600. At **14.286** the **page top bar** fades in (400 ms): `Tipmi` Fraunces 28 at (173, 64), `Today — 31 chosen` Inter 22 `--muted` right-aligned to x = 1747, 1 px rule at y = 104 from 173 to 1747 — the page is now an app page. Rest 16.6–17.14. | Carrier: the plate shrinks (800 ms expo-out) into its wall cell. | **11.429 downbeat**: thump (120 → 60 Hz, 300 ms, −10 dB) + pad opens (fc → 1.2 kHz, Am9) + sub lands A1. **Paper tick** at 13.357 on the dot (−16 dB, 30 ms, 2–4 kHz). Delay (357 ms dotted-8th) on the pad from here. |
| 6 | 17.143 | 20.000 | **Proof A — the wall, done right** | Top bar stays. Hero re-targets to **(1100, 140) 360×480** (+12 px mat). Seven more mounted plates enter from 94 % + 6 px blur, 40 ms stagger: P1 300×225 (173, 360) · P2 240×320 (513, 360) · P3 200×200 (793, 360) · P4 240×320 (173, 625) · P5 300×225 (453, 720) · P6 220×293 (793, 600) · P7 247×329 (1500, 140); captions under each; wide gutters, one hairline rule at y = 330 from 173 to 1000. From **18.300** the **chosen dot** appears beside each caption in reading order, 90 ms stagger (14 px on wall plates). Parallax: plates 1.6×, type 2.2×; 1 % push-in. **L5 `Chosen by hand.`** masked-rise 17.714, exit 19.900. | Continuous: on the bar all plates **re-target into a single column** (700 ms expo-out, 40 ms stagger). | **17.143 hit**: chord → Fmaj9, soft thump −14 dB. **One** paper tick at 18.300 for the whole stagger. |
| 7 | 20.000 | 22.857 | **Proof B — the column (the phone, drawn)** | Top bar fades 300 ms; the eight plates fly to a **single column** of width 410 at x 975–1385 (plates 362 wide, 8 px mats, 24 px gutters; hero second from top), clipped to a 410×886 rounded rect (r 52) centred (1180, 540) — invisible clip, paper on paper. Inside the clip a header fades in at 20.3: status bar `10:08`, `Tipmi`, `Today — 31 chosen`. The column **scrolls** 0 → 420 px over 20.7–22.857 (smoothstep, 0.4 s hold mid-way) so the hero reaches the top. **L6 `No filler. No noise.`** masked-rise 20.357 (max width 780), exit 22.600. At **21.429** a 1 px ink rounded rect (434×910, r 64) **draws clockwise** around the column (500 ms, same gesture as the chosen frame) and **thickens** into the 12 px bezel 21.929–22.600 (stroke-width tween, expo-out); AO ellipse + `--shadow-phone` fade in 22.3–22.857. It was a phone the whole time. | Continuous: the stroke is swapped for the bezel div on the bar (same geometry, pixel-exact). | **20.000 hit**: chord → Cmaj7. Hats return as 8ths (−24 dB). No sound on the draw — silence is the accent. |
| 8 | 22.857 | 25.714 | **The device, once (rest)** | The phone stands on the paper floor: dolly `rotateY 0 → 7°`, `rotateX 0 → 3°` 22.857–24.571 (camera curve), push-in 3 %, glare position tweened with the rotation, feed scrolling 40 px/s inside. No copy — the object is the sentence. At **24.286** the hero plate is **tapped** (scale 0.98 for 120 ms). 24.286–24.857 the phone **returns flat** (7° → 0°, expo-out). 25.0–25.714: bezel, header and the other plates **dissolve** (400 ms) while the hero plate **re-targets** (2D `fromTo`, 570 ms expo-out) from its screen cell to the studio slot (1100, 200) 510×680 — the screen does not scale; the plate grows and the chrome goes. | Match on the bar: the plate is in its studio slot at 25.714. | **22.857 hit**: chord holds; sub dips −6 dB / 150 ms. **Tap tick** at 24.286 (−16 dB). LP opening toward 2 kHz. |
| 9 | 25.714 | 28.571 | **Studio — make** | Paper, flat, full-bleed. Right: the hero plate mounted (24 px mat) at x 1100–1658, y 176–904, caption below, chosen dot beside it. Left, under the copy, the **instrument panel** rises from below with 80/160/240 ms stagger (masked rise + 94 → 100 %): label `Tipmi · Studio` Inter 22 `--muted` at (173, 400); **WARMTH dial** — SVG 160 px at (173, 440): 24 hairline ticks `--rule`, one **oxblood active tick**, ink needle, readout `+0` tabular at its right; three hairline sliders 420 px wide at y 640 / 700 / 760: `EXPOSURE` `GRAIN` `CROP` with 10 px ink thumbs; `PUBLISH` hairline button 200×48 at (173, 840). **Ratchet** 26.429–26.849: the needle turns **7 detents** (60 ms each, expo-out between), readout `+1 … +7`, and the plate's grade warms in 7 matching steps (7 pre-rendered grades of the hero, discrete opacity swaps — no filters). **L7 `Make it here.`** masked-rise 26.000, exit 28.300. Rest 27.2–28.57. | Continuous into the publish gesture. | **25.714 — tempo peak**: chord → G6/9, soft thump −14 dB, hats 16ths, triangle air layer +1 oct −12 dB, filter fully open. **Ratchet: 7 paper ticks in 420 ms** (one gesture, −15 dB). |
| 10 | 28.571 | 31.429 | **Publish — the long press** | Same layout. At **28.929** the Publish button is pressed (scale 0.98, 120 ms) and an **oxblood ring** (SVG circle r 32, 2.5 px stroke, centred on the button) **fills** 28.929–30.143 via stroke-dashoffset, linear with soft ends. At **30.143** the plate **lifts**: scale 1 → 1.05, y −24 px, 500 ms (100 ms expo-in lead, then quint-out); the dial, sliders and button **drop away** below (350 ms expo-in, 60 ms stagger); the ring fades. The plate settles at (1100, 176) by 30.9; caption + dot stay; under the caption `Published today` Inter 22 `--muted` fades in at 31.0. No copy — the gesture is the sentence. | Continuous: the ledger sets itself on the bar. | Press tick at 28.929 (40 ms, slightly longer). **Riser** 28.929–30.143 (noise LP 400 Hz → 6 kHz, u²) → **reversed-air lift** 30.143–30.714 with a −6 dB sub dip. **28.571 hit**: chord → Am9. |
| 11 | 31.429 | 34.286 | **Ledger — paid** | Plate stays right (1.5 % push-in; light band crosses 32–34). Left, under the copy, the **colophon** sets itself in Inter 22: a 1 px `--accent` rule at y = 440 (173 → 760), then three rows 56 px apart, each masked-rise with 110 ms stagger on its cue, 1 px `--rule` between rows: `Supporter joined — Noor Haddad` (31.929) · `Tip received` (32.643) · `Print sold — 1 of 25` (33.357). No currency, no counters, nothing ticks. **L8 `Your work. Your terms.`** masked-rise 31.643, exit 34.000. | **Transform**: the mat thickens and the plate becomes a print (see 12). | **31.429 hit**: chord → Fmaj9. **Sub ducks −6 dB / 150 ms** on each ledger row (31.929, 32.643, 33.357) — the only "payment" sound. Hats fade out 33.5–34.286. |
| 12 | 34.286 | 37.143 | **Human beat — the print** | Ledger and `Published today` fade 400 ms. The plate becomes a **physical print**: mat → 40 px, sheet rotated −1.5°, `0 1px 0 #fff` top edge, shadow deepens to `0 32px 64px rgba(20,19,17,.18)`, resting centre-right (1080, 160) 560×760; caption and **chosen dot** remain at its foot. The light band crosses it once, slowly, 34.5–36.8. 2 % push-in. **L9 `For people who make things.`** (Italic, 2 lines) masked-rise 34.571, exits 36.950 slowly (450 ms). The longest rest in the film: 36.3–37.14. | **Hard cut except the dot**: print, caption and copy fade 300 ms at 37.143; the dot stays. | **34.286**: chord → Am9(add11); strip to pad + sub, LP down to 900 Hz, triangle out, delay repeats darken. |
| 13 | 37.143 | 42.000 | **Logo** | Paper. The **oxblood dot travels** from (1096, 935) to the first-i tittle position (≈ (262, 390)) 37.3–38.1 (800 ms, `cubic-bezier(.65,0,.35,1)`), growing 18 → 24 px. The **wordmark `Tipmi`** (176 px, dotless i's) blur-ins at x 173, baseline 520, 38.000–38.571 (reaches **90 % at 38.571**); the dot *is* the first tittle; the second tittle fades in at 38.661. **L10 `Chosen, not ranked.`** masked-rise at 39.286 (44 px, baseline 660), "Chosen" firms wght 400 → 600 39.5–40.2. 40 px `--rule` hairline at y 700 fades 39.7; **L11 `Now open for creators.`** fades 39.857–40.257 (Inter 22, baseline 740). 1 % push-in on the whole card; light band crosses 39–42. End card = dot-wordmark + tagline + CTA, nothing else. **Hold to 42.000**, hard cut to black; black 42.000–43.000. | — | **Riser** 37.143–38.571 (noise LP 200 → 8 kHz, u², + sine A4 → A5) resolving on **38.571: the logo sound** — thump (120 → 60 Hz) + chime dyad A5 + E6 + 400 ms reversed-air pre-swell. Pad release 3 s; delay tails darken; **silence (−∞) by 42.3**. |

**Structure checks.** Hook: hero + line by 1.1 s, no logo. Product (a Tipmi page) visible at 13.4 s; brand small at 14.286 s, big at 38.571 s. Negative shots: 3 (never more). Hard cuts at 8.571 and 37.143 only (and the designed "fall" at 2.857); everything else is a carried transform ≈ 75 %. 13 states in 9 layouts. Peak tempo at 25.7–30.1 s (61–72 % of runtime), then deceleration. Silence used three times (open, turn, tail). End card holds 3.43 s.

### 5.3 App UI mockup screens (element lists)

**Feed (phone, shots 7–8)** — screen 410×886, `--paper`: status bar 46 px (`10:08` Inter 16 `--muted` left; three 8 px hairline glyphs right) · header 56 px (`Tipmi` Fraunces 25 wght 500 left; `Today — 31 chosen` Inter 21 `--muted` right; 1 px `--rule`) · single-column feed: plates 362 wide in 8 px mats, 24 px gutters, caption Inter 21 `--ink-soft` under each, **14 px chosen dot** left of each caption; no likes, no avatars, no badges, no tab bar (the bottom edge shows the next plate's mat — the feed continues). Scroll = `translateY`.

**Studio (shot 9–10, full-bleed paper)** — `Tipmi · Studio` label · WARMTH dial (SVG 160 px: 24 ticks, 1 oxblood active tick, ink needle, `+7` tabular readout) · EXPOSURE / GRAIN / CROP hairline sliders 420 px with 10 px ink thumbs · PUBLISH hairline button 200×48 with the long-press ring · the work mounted on the right with caption + dot. No icons, no glass, one interaction per shot.

**Ledger / insights (shot 11)** — the published work (caption, chosen dot, `Published today`) · a colophon of three rows under one oxblood rule: `Supporter joined — Noor Haddad` · `Tip received` · `Print sold — 1 of 25`. Static, typeset, dignified: it is the "insights" screen — what happened to the work, in words.

---

## 6. Music & sound (all synthesised in Node with `audio/engine.js` → `audio/track.wav`, 48 kHz, 24-bit, length exactly 43.000 s)

**Tempo 84 BPM · key A minor · beat 0.7143 s · bar 2.8571 s.** One cue. Raw bus aimed at ≈ −16 LUFS / −3 dBFS peak; two-pass `loudnorm I=-14 TP=-1 LRA=9 linear=true` as the final small correction. **Targets: −14 LUFS integrated, true peak ≤ −1 dBTP, LRA 6–10 LU.** Sub stays mono and dry; pad and chimes get the Schroeder reverb (mix 0.28, decay 0.78, damp 0.35, pre-delay 20 ms, wet LP 5 kHz); pad gets the feedback delay (**357 ms** = dotted 8th at 84 BPM, feedback 0.35, 3 kHz LP in the loop, ping-pong).

### 6.1 Chord progression (timecodes = bar lines)

| Time | Chord | Voicing (pad, 3 detuned saws ±8 ¢ per note) | Picture |
|---|---|---|---|
| 5.000–7.857 | Am (no 9th) | A2 E3 A3 — fc 300 Hz, −20 dB | tension, very dark |
| **11.429** | **Am9** | A2 E3 G3 B3 | reveal downbeat |
| 17.143 | Fmaj9 | F2 C3 E3 G3 A3 | wall |
| 20.000 | Cmaj7 | C3 E3 G3 B3 | column / phone drawn |
| 22.857 | Cmaj7 (hold) | — | device rest |
| **25.714** | **G6/9** | G2 D3 E3 A3 B3 | studio, tempo peak |
| 28.571 | Am9 | A2 E3 G3 B3 | publish |
| 31.429 | Fmaj9 | F2 C3 E3 G3 A3 | ledger |
| 34.286 | Am9(add11) | A2 E3 B3 D4 | human beat |
| **38.571** | Am(add9), release 3 s | A2 E3 B3 C4 | logo |

### 6.2 Instrument layers and entries

| Layer | Engine call | Enters / leaves |
|---|---|---|
| Room tone | `noise` LP 800 Hz, −42 dB, continuous | 0.0 → 7.857 (gated); paper-room −44 dB 8.571 → 42.0 |
| Sub | `sub` A1 55 Hz, 120 Hz LP, mono | drone −18 dB 0.6 → 7.857; lands 11.429; dips −6 dB / 150 ms at 22.857, 30.143, 31.929, 32.643, 33.357; out with pad release |
| Hats | `noise` HP 8 kHz, `exp(−60t)`, L/R alternate, Haas 10 ms | 8ths 2.857 (−24 dB) → 16ths 5.714 (−22 → −18 dB swell) → mute 7.857; 8ths 20.000 (−24 dB); 16ths 25.714–31.429; 8ths 31.429, fade out 33.5–34.286 |
| Swell | `riser` bandpass 300 Hz → 4 kHz, amplitude u² | 3.5 → 7.857 |
| Pad | `note` wave saw, voices 3, detune 8, `lp` + `lpEnv`, L/R fc 1 : 1.03, LFO 0.7 Hz ±200 Hz | dark 5.0–7.857; opens 11.429 (fc 1.2 kHz, 600 ms); fc → 2 kHz by 25.714; back to 900 Hz at 34.286; release 3 s from 38.571 |
| Triangle air | `note` wave tri, +1 octave, −12 dB | 25.714 → 34.286 |
| Chimes | `chime` partials [1, 2.01, 3.0, 4.2, 5.4], decays `exp(−t(2+2j))` | A5 at 9.286 (dry, −14 dB); dyad A5 + E6 at 38.571 |
| Thumps | `thump` f0 120 → f1 60, 300 ms | 11.429 (−10 dB), 17.143 (−14), 25.714 (−14), 38.571 (−8, the logo) |
| Paper ticks | `noise` 30 ms, band 2–4 kHz (HP 2 k + LP 4 k), −15/−16 dB, dry | 13.357 · 18.300 · 24.286 · **ratchet 26.429 + k·0.060 for k = 0…6** · 28.929 (40 ms) |
| Risers / air | `riser` | publish 28.929–30.143 (400 Hz → 6 kHz); reversed-air lift 30.143–30.714 (HP sweep, reverse envelope); logo riser 37.143–38.571 (200 Hz → 8 kHz + sine A4 → A5); pre-logo air swell 38.171–38.571 |

### 6.3 Hits aligned to cuts (single source of truth: `src/cues.js`)

```js
const CUES = { bpm: 84, fps: 30, duration: 43.0, pictureEnd: 42.0,
  bars: [0,2.857,5.714,8.571,11.429,14.286,17.143,20.0,22.857,25.714,28.571,31.429,34.286,37.143,40.0],
  mute: [7.857, 8.571], chime: 9.286,
  hits: { reveal: 11.429, wall: 17.143, column: 20.0, device: 22.857, studio: 25.714, publish: 28.571, ledger: 31.429, human: 34.286, logo: 38.571 },
  ticks: [13.357, 18.3, 24.286, 28.929], ratchet: { start: 26.429, n: 7, step: 0.06 },
  risers: { publish: [28.929, 30.143], lift: [30.143, 30.714], logo: [37.143, 38.571] },
  ducks: [22.857, 30.143, 31.929, 32.643, 33.357],
  lines: { L1:[0.5,2.6], L2:[3.071,5.4], L3:[9.286,10.714], L4:[13.571,16.6], L5:[17.714,19.9], L6:[20.357,22.6], L7:[26.0,28.3], L8:[31.643,34.0], L9:[34.571,36.95], W:[38.0,42.0], L10:[39.286,42.0], L11:[39.857,42.0] },
  silentBy: 42.3 };
if (typeof module !== "undefined") module.exports = CUES;
```
Every hard cut and chord change sits on a bar; picture never leads sound — a cut lands on the hit or 1–2 frames after.

### 6.4 The five sound-design moments
1. **The freeze (7.857)** — the hit is the absence: full-band mute for one beat; the loudest moment in the film.
2. **"Not anymore." (9.286)** — one dry A5 chime; the only sound on paper before the downbeat.
3. **Reveal downbeat (11.429)** — thump + pad bloom + sub landing: the first full chord.
4. **The ratchet (26.429–26.849)** — 7 paper ticks in 420 ms, one gesture, matched frame-for-frame to the dial detents; then the long-press riser into the lift (30.143) with the sub breathing.
5. **The logo (38.571)** — riser → thump + chime dyad + reversed air, onset on the frame the wordmark reaches 90 %. Nothing else in the film gets a whoosh.

### 6.5 The end
Pad release 3.0 s from 38.571 (ends ≈ 41.6), delay tails darken (3 kHz LP in loop) and are gone by 42.0, reverb tail by 42.2; room tone fades 41.5–42.3 (`fadeOut` in the mix render covers the last 0.7 s). **−∞ from 42.3 to 43.0**; no abrupt cut, no clipped sample, no gap > 1.5 s except the designed 0.714 s mute. Verify with `tools/audio-check.sh audio/track.wav` and re-measure the muxed MP4 (`-map 0:a`) because AAC can overshoot ~0.3 dB.

---

## 7. Build plan

### 7.1 File layout

```
promo-video/
  src/index.html        stage (1920×1080), loads fonts.css, styles.css, constants.js, cues.js, gen/*, scenes/*, builds the master timeline, exposes the render contract
  src/styles.css        design tokens (§3) as CSS custom properties; components: .plate .mat .caption .dot .topbar .phone .screen .dial .slider .ledger .wordmark; global *{transition:none!important;animation:none!important}
  src/constants.js      BRAND_NAME, TAGLINE, CTA, HERO_MAKER, HERO_TITLE, SUPPORTER, EDITION, CHOSEN_COUNT, ACCENT, COPY{en,zh}, SEED
  src/cues.js           CUES (§6.3) — plain script + module.exports guard; read by index.html and audio/track.js
  src/gen/prng.js       mulberry32 + xorshift32 + hash(a,b) (integer hash for per-cell/per-frame choices)
  src/gen/cards.js      buildLibrary(seed) → 24 offscreen canvases + captions; grade(); 7 pre-rendered warmth grades of the hero; dissolve keyframes ×16 for the hook
  src/gen/grain.js      8 noise tiles, static tooth tile, drawGrain(frameIdx) via createPattern
  src/gen/light.js      low-res (240×135) background canvas: paper field, light-band position(t), AO ellipse under the phone, hook vignette
  src/gen/wall.js       hook wall canvas: cell layout, hash-driven swaps, group parallax, freeze clamp — one canvas, no DOM cells
  src/gen/wordmark.js   buildWordmark(BRAND_NAME) → span with dotless i/j + absolutely positioned tittle circles (measureText on prefixes)
  src/scenes/hook.js    shots 1–3   (ink)        src/scenes/turn.js    shot 4
  src/scenes/reveal.js  shot 5                   src/scenes/wall.js    shot 6
  src/scenes/column.js  shots 7–8  (column → phone → flatten → re-target)
  src/scenes/studio.js  shots 9–10 (dial, sliders, publish ring, lift)
  src/scenes/ledger.js  shot 11                  src/scenes/human.js   shot 12
  src/scenes/logo.js    shot 13
  audio/engine.js       (exists)   audio/track.js  composition from CUES → audio/track.wav
  tools/render.js, encode.sh, sheet.sh, audio-check.sh (exist)
```
Each scene module exports `build(tl, S)` and adds **absolute-position `fromTo` tweens** to the master timeline plus `tl.set(el, {display:'none'|'block'}, time)` visibility toggles; `S` is the shared asset bag (library, hero grades, DOM refs). The carrier plate is **one element** (`#hero`) whose rect is re-targeted by absolute `fromTo` at 0 / 2.857 / 11.429 / 17.143 / 20.0 / 25.143 / 30.143 / 34.286 / 37.143; the single swap (in-screen copy ↔ flat carrier) happens at 25.143 when the phone is at 0°, same rect, so it is pixel-exact.

### 7.2 The render contract (`window.seek(t)`)

```js
window.DURATION = CUES.duration;                 // 43
window.READY = (async () => {
  await Promise.all(FONT_SPECS.map(f => document.fonts.load(f)));   // every family/weight/axis used
  S = await buildAssets(SEED);                   // library, grades, dissolve frames, noise tiles, wall cells, wordmark
  tl = buildTimeline(S);                         // gsap.timeline({paused:true}); all scenes added at absolute times
  window.seek(0);
})();
window.seek = function (t) {                     // synchronous · idempotent · pure in t
  tl.seek(t, false);                             // never fires callbacks; no onUpdate state
  drawBackground(t);                             // light band, AO, field — redrawn fully from t
  if (t < CUES.mute[1]) drawWall(Math.min(t, CUES.mute[0]));   // freeze = clamp
  drawGrain(Math.floor(t * 24));                 // tile idx % 8, seeded offset
};
```
Rules: `gsap.ticker.lagSmoothing(0)`; `gsap.globalTimeline.pause()`; `fromTo` only (explicit initial states); no `onStart/onUpdate/onComplete` that mutate state; no CSS transitions/animations; no `requestAnimationFrame`, `setTimeout`, `Date.now()`, `performance.now()`, `Math.random()` anywhere in draw code; canvases clear and redraw fully every call; scrolling by `translateY` tween, never `scrollTop`; off-shot scenes `display:none` (opacity 0 still rasterizes); no `filter` on any 3D ancestor; text blur-in on ≤ 2 elements at once. `seek(a); seek(b); seek(a)` must be pixel-identical to `seek(a)`.

### 7.3 The seeded PRNG rule
One root `SEED` (constants.js). Derived streams: `rng(SEED+1)` card library, `rng(SEED+2)` noise tiles, `rng(SEED+3)` captions/order, `rng(SEED+4)` dissolve threshold tile, `rng(SEED+5)` wall cell jitter. **PRNG is consumed only inside `buildAssets()`**, never inside `seek()`. Anything that must vary per frame derives from `t` or the frame index through a pure integer hash: wall swaps `hash(cell, floor(t·rate)) % 24`, flicker `floor(t·12)`, grain tile `floor(t·24) % 8`. The audio uses the engine's own `mulberry32` with fixed seeds per voice. Determinism test: render frames 60–130 and 700–760 with `--workers 1` and `--workers 4`, `cmp` every pair.

### 7.4 Frame budget (< 150 ms/frame per worker at 1920×1080)
Measured floors from `03_feasibility.md`: baseline 26 ms (JPEG), 3D phone ≈ 40 ms, masked rise 41 ms, blur-in text ≈ 60 ms, grain pattern 0.1 ms, low-res blobs 0.6 ms. Per-scene budgets: hook (one canvas wall + one plate) ≤ 70 ms; reveal/wall/ledger/human ≤ 60 ms; column→phone (preserve-3d subtree, 8 plates) ≤ 90 ms; studio (SVG dial + ring) ≤ 70 ms; logo (one blur-in) ≤ 70 ms. Rules: JPEG q95 frames for the master; ≤ 400 DOM nodes visible; the wall is **one canvas**, not 105 divs; no full-frame `filter`, no `backdrop-filter`, no SVG filters; hero warmth = 7 pre-rendered canvases swapped by opacity. Check with `node tools/render.js --end 3 --jpeg` and spot-windows `--start 20 --end 26`, `--start 37 --end 40`; any window over 150 ms/frame is fixed before the master. Preview loop: `--scale 0.5 --jpeg --fps 15`.

### 7.5 Order of work (≈ 1 agent-day)
1. `constants.js`, `cues.js`, `styles.css` tokens → 2. `gen/cards.js` library + **contact sheet of the 24 plates (review, cull 6)** → 3. `gen/grain.js`, `gen/light.js`, `gen/wall.js` → 4. scenes in film order with a 0.5× preview after each → 5. `gen/wordmark.js` + logo → 6. `audio/track.js` from CUES, `audio-check` → 7. determinism test, frame-budget windows → 8. master render, encode, contact sheet, run §8.

---

## 8. Acceptance criteria (20 checks a reviewer runs on rendered frames and the muxed MP4)

Run `tools/sheet.sh frames out/review 30 1 6` and read `out/review/key_<t>s.png`; frame numbers below are `f = round(t·30)`.

| # | Check | How / threshold |
|---|---|---|
| 1 | **Frame count & timing** | `ffprobe -count_frames` = 1 290 frames at 30 fps, duration 43.000 s; picture ends at f1260 (first black frame = f1260). |
| 2 | **Safe margins** | Every glyph of every line, caption, ledger row, CTA and the wordmark lies ≥ 80 px from all four edges (sample f15, f100, f420, f540, f660, f800, f960, f1050, f1200). Display left edge exactly x = 173. |
| 3 | **No text overflow / clipping** | L4 and L9 break into exactly two lines inside the 900 px box; no line wider than 900 px; no caption truncated under any plate; `PUBLISH`, readouts and ledger rows fully visible. |
| 4 | **No clipped elements** | Plates, mats, dot, phone (incl. shadow) and ring are fully inside the frame in every shot except the hook wall (designed to bleed) and the scrolling feed (clipped only by the screen rect). |
| 5 | **Line timing** | Each line is visible exactly within its in/out in §4 (±1 frame), fully legible for ≥ its dwell; no two lines on screen together except L10 + L11 (+ wordmark) on the end card. |
| 6 | **Legibility & contrast** | Ink on paper ≥ 12:1; `--ink-soft` captions ≥ 9:1; `--muted` on paper ≥ 4.5:1; bone on ink (hook) ≥ 12:1; the 18 px dot is identifiable at 50 % scale (960×540 preview) in f400, f560, f1000, f1150. |
| 7 | **The chosen gesture reads** | At f370–f400 the 2 px oxblood frame visibly draws around the mat and the dot sets at f401; at f549–f575 dots appear on all 8 wall plates in reading order. |
| 8 | **Accent budget** | Oxblood pixels ≤ 0.5 % of any frame and present in ≤ 5 % of frames, measured by a hue/sat mask script over `frames/`; never on type; never a fill > 24 px except the ring stroke. |
| 9 | **One carrier** | The hero plate (same canvas content) is identifiable in f0, f85, f120 (cell), f345, f520, f640, f720, f790, f920, f1060; its dot is the first tittle at f1157+. |
| 10 | **Phone correctness** | Screen content is never upscaled (text inside the phone is crisp at f690); tilt never exceeds 7°; no reflection; AO ellipse + shadow present; phone is at 0° before the re-target starts (f754 onward is flat). |
| 11 | **Nothing dead-still** | Compare f+0 and f+15 inside every shot: the paper field, the plate (push-in) or the light band differs; no two consecutive seconds are pixel-identical except the designed freeze f236–f257 and black f1260+. |
| 12 | **No empty frames** | Between f0 and f1259 there is no frame that is only field + grain, except the designed rest f257–f278 (paper before "Not anymore.") and f321–f342 (paper rest). |
| 13 | **Grain not banding** | On f300 (empty paper) and f20 (ink) no visible 8-bit banding steps across the vignette/light band at 100 % zoom; grain visible but ≤ 5 % amplitude (std-dev of a 100×100 paper patch ≤ 6 levels). |
| 14 | **Detents match ticks** | Dial needle positions change at exactly f793, f795, f797, f798, f800, f802, f804 (±0) and the seven ticks in the WAV sit at 26.429 + k·0.060 (±5 ms). |
| 15 | **Logo end card holds ≥ 2.5 s** | Wordmark at 90 % by f1157 (38.571); wordmark + tagline + CTA unchanged from f1208 to f1259 (≥ 1.7 s fully static apart from push-in) and the wordmark present 3.43 s total. Only dot-wordmark, tagline, hairline, CTA on the card. |
| 16 | **Cuts on hits** | Hard cuts at f257 (8.571) and f1114 (37.143) coincide with CUES bars; the mute starts at 7.857 ± 1 frame of the freeze; the logo sound onset is 38.571 ± 1 frame of the 90 % wordmark frame. |
| 17 | **Audio loudness** | `audio-check.sh` on the muxed MP4 audio: integrated −14 ± 1 LUFS, true peak ≤ −1.0 dBTP, LRA 6–10 LU. |
| 18 | **No clipping / no DC** | `astats`: Flat factor 0, Peak count ≤ 2, DC offset < 0.001; no sample at ±1.0. |
| 19 | **Silence shape** | `silencedetect n=-50dB d=1.5` reports none; the only sub-1.5 s gap is 7.857–8.571; −∞ from 42.3 to 43.0; no click at 7.857 (gate ≤ 20 ms) or at 42.0. |
| 20 | **Determinism & budget** | Frames 60–130 and 700–760 rendered with 1 and 4 workers `cmp` identical; `render.js` reports ≤ 150 ms/frame on every spot window; `pageerror`/console errors = 0; no network request attempted (run with the sandbox network policy on). |

Also score the craft guide §7 checklist (15 tells) on the contact sheet; ship at ≥ 13.

---

## Appendix A — Judge notes → what changed

| Judge note (weakness) | Fix in this brief |
|---|---|
| Magazine conceit (Issue One, folio, masthead, colophon label, Geist Mono) reads as a publication | Removed entirely: no folio, no "No. 01", no mono family; the page gets an **app top bar** (`Tipmi · Today — 31 chosen`) at 14.286 and a **phone by 21.4 s**; the ledger is a typeset list without a "colophon" label. |
| Paper + Fraunces 300 = Notion / stationery; light 2 % and tooth 1.5 % below the x264 floor | Display **wght 400**; light band **+6 %**, tooth **3 %**, real contact + ambient shadows under every plate and the phone; cards graded dark-rich so they carry depth on paper; ink hook as bookend. |
| 13 shots / 11 lines too dense; shots 10 (Present) and 12 (print stack) low-yield | **Cut Present and the print stack**; 13 states in 9 layouts; one rest shot (device) and one wordless gesture shot (publish). |
| 10 px ring / 4 px dot invisible after x264 | Mark is an **18 px solid dot** (14 px on wall plates, 24 px as tittle) plus a **2 px drawn frame** at the reveal; check 6–7 verify it at 50 % scale. |
| "Half a second each." / "Everything, all the time." cryptic | Replaced with Instrument's **"Hours to make. / Seconds to vanish."** (creator pain) and the turn word **"Not anymore."** (answers the couplet; avoids the PSA "Enough."). |
| Tone slider = generic photo-editor moment | Replaced with Instrument's **Warmth dial in 7 detents + 7 ticks** (one gesture) and the **long-press Publish ring → lift**. |
| Shot 8 column-condense → bezel is the hardest transform; 5× screen raster risk (Noise Floor) | Column authored at **native screen size** from 20.0; the bezel **draws** around it (Issue One) so it is *discovered* (Noise Floor's idea, no scaling); exit = plate re-target at 0°, chrome dissolves — the screen never scales. |
| Oxblood adjacent to XHS red; accent never checked against the library | Kept `#7A2E35` (≈ 25 % luminance, far from `#FF2442`); library rule: no card hue 330–20° above 35 % sat; check 8 enforces the budget. |
| Logo mark (hairline square + dot) weak at 36 px; title-case Fraunces generic | The mark is the **dot itself**, becoming the **tittle of the i** (dotless-i builder, name-agnostic); app icon = one dot on paper. |
| Hook wall of 600 cells reads as grey static | **105 cells of 116×155**, drawn smooth, with the **hero planted in frame 1** (Noise Floor) and falling into the wall (Instrument's "vanish"). |
| 'Chosen, not ranked.' spent mid-film (Noise Floor) / demoted (Instrument) | Spoken **once, on the end card**; mid-film curation line is "Chosen by hand." |
| Unverified claims on screen (90 %, price) | None on screen; `SUPPORTER` / `EDITION` / `CHOSEN_COUNT` are blankable constants. |
| Two worlds feel like two films (Noise Floor) / no warmth, never exhales (Instrument) | One decision: ink for 8.57 s, paper for the rest; same grain, margin, serif and light behaviour across the cut; the film ends in daylight with the dot as the last thing that moves. |
| Chaos reads as parody; first 2 s cheap | Frame 0 is one beautiful developing plate on black; the wall is our own library dimmed, no pills, no chrome; negatives capped at 3 shots / 5.7 s. |
| Ten bespoke widgets / rack-focus spec error (Instrument) | Grafted only the cheap ones: SVG dial (24 ticks), stroke-dashoffset ring, 7 opacity-swapped grades; no rack-focus, no scope, no 3D match-cut from a tilted screen. |
