# Audio notes — Tipmi launch film score

One cue, 84 BPM, A minor, built from `src/cues.js` (never edited) with `audio/engine.js` (never edited) plus
post-processing helpers in `audio/helpers.js`.

```bash
node audio/track.js                 # -> audio/track.wav  (48 kHz, 24-bit stereo, 2 040 000 frames = 42.500 s), ~5 s
node audio/track.js --stems         # + per-stem / per-section level table and the pad voice list
STEMS_DIR=/some/dir node audio/track.js   # + every stem as a WAV (debug)
tools/audio-check.sh audio/track.wav
node audio/verify_cues.js           # cue/silence table, exit 1 on any failure
```

Two renders are byte-identical (md5 checked). All noise comes from mulberry32 with fixed seeds. There is no `Math.random`/`Date`, no child processes and no network.

## Files

| file | role |
|---|---|
| `audio/track.js` | the composition: stems → reverb send → master → `track.wav` |
| `audio/helpers.js` | time-varying cascaded biquads (`sweepFilter`), hard `gate`, `duckFn`, `sweepNoise` (LP/HP/BP risers), `hat`, `tick`, Haas `placeMono`, `splitSegments`, soft-knee lookahead `limiter`, BS.1770-4 `loudness` (I + LRA), 4× `truePeak`, `readWav` |
| `audio/verify_cues.js` | onset and silence verification against `CUES` |

## Structure (what plays when)

| time (s) | picture | sound |
|---|---|---|
| 0 – 2.857 | hook A, the work | room tone (LP 800 Hz noise); sub A1 drone fades in from 0.6 |
| 2.857 – 5.714 | hook B, the wall | hats in 8ths (L/R alternate, Haas 10 ms); sub pulses on each bar; band-pass swell 300 Hz → 4 kHz from 3.5 |
| 5.0 / 5.714 – 7.857 | tension | dark pad Am (A2 E3 A3, LP 300 Hz) from 5.0; hats in 16ths swelling −22 → −18 dB; swell peaks |
| **7.857 – 8.571** | freeze | **every stem and the master gated** (15 ms raised-cosine ramp ending exactly at 7.857); PCM is all zeros for 0.714 s |
| 8.571 – 11.429 | turn, paper | paper-room tone returns on the cut; one A5 chime at 9.286 (15 % reverb send); low LP-noise breath 10.0 → 11.429 |
| 11.429 | reveal downbeat | thump; pad Am9 blooms (LP 300 → 1200 Hz over 600 ms); sub lands A1; the 357 ms ping-pong delay starts on the pad |
| 13.357 | chosen dot | paper tick |
| 17.143 | wall | Fmaj9, soft thump, sub → F1; one tick at 18.300 for the dot stagger |
| 20.0 / 22.857 | column / device | Cmaj7 (held); hats in 8ths; sub dip at 22.857; LP opens toward 2 kHz; tap tick at 24.286 |
| 25.714 | studio, tempo peak | G6/9, soft thump, hats in 16ths, triangle air +8va, filter fully open (2 kHz); **ratchet: 7 ticks 26.429 + k·0.060** with the band tightening each detent |
| 28.571 – 31.429 | publish | Am9; press tick 28.929 (40 ms); LP-noise riser 400 Hz → 6 kHz until 30.143; reversed-air lift (HP sweep up) 30.143 → 30.714 with a sub dip |
| 31.429 | ledger | Fmaj9; sub ducks −6 dB / 150 ms on each ledger row (31.929, 32.643, 33.357); hats fade out 33.5 → 34.286 |
| 34.286 | human beat | Am9(add11); stripped to pad + sub; LP down to 900 Hz; triangle out; delay loop LP darker (1.8 kHz) |
| 37.143 → 38.571 | logo build | sub breathes out; pad pulls back 6 dB; LP-noise riser 200 Hz → 8 kHz plus a sine glide A4 → A5; 400 ms reversed-air pre-swell (reversed HP noise plus reversed reverb of the dyad) |
| **38.571** | wordmark at 90 % | **thump (−8 dB) + A5 chime**, with E6 entering 90 ms later on the second tittle (38.661); sub A1 and the pad's Am(add9) release over 3 s; delay loop LP 1.2 kHz |
| 41.55 → 42.3 | end card / cut | master raised-cosine fade (the room tone has its own 41.5 → 42.3 fade); **−∞ (all-zero PCM) from 42.3** |

### Harmony (brief table 6.1)
The pad is three detuned saws per note (±8 ¢). Common tones are **held across chord changes** (voice-leading), and only new tones attack on the bar. E3 is a pedal from 11.429 to the end. `assertChordTones()` throws if any pad or air voice sounds over a chord it doesn't belong to, or sits above C6. The only tones above C6 are chime partials and the E6 chime. The voice list printed by `--stems`:

```
A2 11.429-17.143  B3 11.429-17.143  F2 17.143-20.000  A3 17.143-20.000  G3 11.429-25.714  C3 17.143-25.714
G2 25.714-28.571  D3 25.714-28.571  A3 25.714-28.571  B3 20.000-31.429  A2 28.571-31.429  G3 28.571-34.286
F2 31.429-34.286  C3 31.429-34.286  A3 31.429-34.286  D4 34.286-38.571  E3/A2/B3 34.286-38.631 (3 s release)  C4 38.571 (3 s release)
```

## Levels

Pre-normalisation element levels (dB re full scale): room −42 / −44 RMS · sub drone −12.5 peak (pulses +4.5 dB) · body sub −18.5 peak · hats −24 peak (16th swell −22 → −18, studio −23) · swell −13 peak · dark pad −17 RMS · open pad −16.5 RMS on the reveal, +1 dB device, +1.2 dB studio/publish, −2 dB human, −6 dB under the logo riser · air −12 dB under the pad · chime −14 (9.286), dyad −12 / −16 · thumps −10 / −14 / −14 / −8 · ticks −16 (dot, wall, tap), −15 (ratchet, press) · risers −19 (publish), −23 (lift), −17 (logo) + sine −29, pre-swell −22 / −24.

After the master gain (−1.1 dB), short-term loudness gives the arc: hook A ≈ −20 LUFS → hook B −17 → tension −15.5 → turn −17.4 → reveal −13.7 → wall/column −12.6 → device −12.2 → studio/publish/ledger ≈ −12 → human −13.3 → logo −17. Run `--stems` for the per-stem table.

## Master chain

1. **Stems** (room, sub, hats, swell, pad, air, chime, thump, ticks, fx), each gated through the freeze.
2. **Reverb send** = pad (post-delay) + air + chimes (the 9.286 chime at 0.15/0.28 of full send, so 15 % wet). It is rendered with `Mix.render({reverb:{mix:.28,decay:.78,damp:.35,predelay:.02}, limiter:false, hpf:0, fadeIn:0, fadeOut:0})`. The wet signal is isolated as (render − input) and low-passed at 5 kHz. Sub, thumps, ticks, hats and risers stay dry. The sub is strictly mono (R = L).
3. **Delay**: on the pad only, via `engine.delay` (357 ms, feedback 0.35, mix 0.3, ping-pong). The pad is split with 30 ms complementary crossfades at 34.286 and 38.571 so the loop LP steps 3 kHz → 1.8 kHz → 1.2 kHz (the repeats darken).
4. Sum, then HPF 25 Hz, then linear master gain, then a **soft-knee lookahead limiter** (knee −3.2 dBFS, ceiling −1.5 dBFS, 4 ms lookahead, min-filtered plus box-smoothed gain). Its curve is strictly increasing, so separate peaks never flatten to the same value. On this mix it acts ≤ 1 dB on a few hundred samples of pad peaks.
5. Gate the freeze again on the master, apply the end fade and zeros from 42.3, then write 24-bit.
6. **Loudness**: the master gain is solved in JS with a BS.1770-4 meter (K-weighting, 400 ms / 75 % gating, short-term LRA per EBU Tech 3342). It is iterated with the limiter in the loop until I = −14.00 LUFS and true peak ≤ −1.2 dBTP. This is the same thing `loudnorm … linear=true` does (one linear gain). Doing it in-process keeps the freeze and tail as exact digital zeros: ffmpeg `loudnorm` resamples to 192 kHz, and the resampling ripple would break the all-zero mute. So no ffmpeg pass is used.

## Verification (final render)

`tools/audio-check.sh audio/track.wav`:

| check | target | result |
|---|---|---|
| integrated | −14 ± 1 LUFS | **−14.0 LUFS** |
| true peak | ≤ −1.0 dBTP | **−1.6 dBTP** |
| LRA | 6–10 LU | **8.2 LU** |
| flat factor | 0 | **0** |
| peak count | ≤ 2 | **2** (the same mono peak in L and R) |
| DC offset | < 0.001 | 0.000006 |
| silences > 1.5 s @ −50 dB | none | **none** |
| length | 42.500 s | 2 040 000 frames |

AAC 256 k round trip (`-c:a aac -b:a 256k`, re-measured): −14.0 LUFS, −1.6 dBTP, LRA 8.3, peak count 2, no long silences. `silencedetect n=-60dB:d=0.3` finds only the designed freeze (7.855–8.575, including the gate ramp) and the tail (from 42.06).

`node audio/verify_cues.js` passes all 22 checks:

* **Onsets** for 4 ticks, 7 ratchet detents, 3 thumps, the logo thump, the logo chime and the 9.286 chime. Every one lands within **−1 … +4 ms** of its CUES time; required ±10 ms.
  * Ticks are measured in a 2–4 kHz band and jump 11–30 dB over the energy just before them.
  * Thumps are measured on a 45–180 Hz Hilbert envelope, which removes the phase ripple from 45–65 Hz content, and must stay above threshold for 3 ms. They jump 5–32 dB.
  * Chimes are measured in a 0.75–1.5 kHz band and jump 9–29 dB.
* **Freeze**: `[round(7.857·sr), round(8.571·sr))` is all-zero PCM, the gate ramp is −48 dB at the edge, and signal precedes it.
* **Tail**: all-zero PCM from 42.3. Length equals `CUES.duration`.
* **The verifier really detects timing**: a copy delayed by 15 ms fails 20 of 22 checks.

## Choices and deviations (all deliberate)

* **Duration** is 42.5 s from `CUES` (planner override), not the 43.0 in brief §6.
* **The sub follows the chord root** (A1, F1, C2, G1), not a static A1 pedal, so the bar changes land in the low end. It is one phase-continuous sine with a ~25 ms glide, which avoids the beating nulls that overlapping notes caused at root changes. It still "lands A1" on the reveal and on the logo.
* **Hook levels are lifted a little** against the brief's numbers (drone −12.5 vs −18, dark pad −17 vs −20, swell −13) relative to the body. Without that the film's LRA was 11–16 LU, because the hook sat 15 LU under the body.
* **Pad voicing balance**: notes below ~128 Hz are −7 dB and notes from 128 to 170 Hz are −2.5 dB, because the sub carries the root. This leaves room for the sub and the −14 dB thumps. A steep HPF was tried and rejected because it raised the filtered-saw crest factor to ~15 dB. The open pad's LP has 3 stages (Q 0.707 each). "Fully open" is taken as 2 kHz, so the ticks stay ≥ 10 dB clear of the pad in their band. All filters are Q ≤ 1.2 (`sweepFilter` throws otherwise); the engine riser's band-pass is Q 1.2.
* **Logo dyad**: A5 on 38.571, and E6 90 ms later to match the second tittle in the picture. It still reads as one sound.
* **Lift (30.143–30.714)** is read as the mirror of the publish riser: a quick onset, a (1−u)² decay and an upward HP sweep, with the sub dip from `CUES.ducks`.
* **Engine caveats** (engine.js not edited):
  * `softLimit` runs `tanh` on every sample and holds a fixed ceiling, which would add saturation and repeat the max sample (Peak count > 2), so it isn't used.
  * `Mix.render`'s `fadeOut` counts back from the file end (42.5), not from 42.3, so the end fade is done in `helpers.fadeToSilence`.
* **ffmpeg `loudnorm` analysis** reports I −14.13 / LRA 11.3 for this file, while the `ebur128` filter that `audio-check.sh` uses (and the in-repo BS.1770 meter, which agrees to 0.05 LU) reports −14.0 / 8.2. That gap is a known difference in loudnorm's internal short-term analysis. The acceptance check is `audio-check.sh`, and no loudnorm processing is applied.
