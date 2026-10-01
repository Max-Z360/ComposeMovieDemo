'use strict';
/**
 * Tipmi launch film — score + sound design (brief §6). 84 BPM, A minor, one cue.
 *   node audio/track.js            -> audio/track.wav (48 kHz, 24-bit, exactly CUES.duration s)
 *   node audio/track.js --stems    -> also prints a per-stem / per-section level table
 * Timing comes only from src/cues.js (+ the few brief-only layer times documented inline).
 * Deterministic: every noise source has a fixed mulberry32 seed; no Date/Math.random.
 */
const path = require('path');
const E = require('./engine');
const H = require('./helpers');
const CUES = require('../src/cues.js');

const SR = 48000;
const N = Math.round(CUES.duration * SR);          // 2 040 000 samples
const BEAT = 60 / CUES.bpm, BAR = 4 * BEAT;          // 0.714286 / 2.857143
const BARS = CUES.bars, HIT = CUES.hits;
const [MUTE0, MUTE1] = CUES.mute;
const SILENT = CUES.silentBy;                        // 42.3
const db = H.db;
const STEMS = process.argv.includes('--stems');
// hook levels (dB, pre-normalisation). Brief: drone -18, dark pad -20; lifted a little so the film's LRA lands in 6-10 LU
const DRONE_DB = -12.5, DARK_PAD_DB = -17, SWELL_DB = -13;

const stem = () => H.stereo(N);
const S = {
  room: stem(), sub: stem(), hats: stem(), swell: stem(), pad: stem(), air: stem(),
  chime: stem(), thump: stem(), ticks: stem(), fx: stem(),
};
const SEND = stem(); // reverb send (pad, air, chimes)

// ------------------------------------------------------------------ 1. room tone
// 0 -> 7.857 (gated) at -42 dB RMS; paper room -44 dB RMS from 8.571, fades 41.5 -> 42.3.
{
  const a = E.noise({ t: 0, dur: MUTE0 + 0.05, hp: 40, lp: 800, gain: 1, seed: 1001, stereo: 0.7, env: { a: 0.25, d: 0, s: 1, r: 0 } }, SR);
  H.normRms(a, db(-42), Math.round(0.5 * SR), Math.round(7 * SR));
  H.addInto(S.room, a, 0, SR);
  const b = E.noise({ t: 0, dur: SILENT - MUTE1, hp: 40, lp: 800, gain: 1, seed: 1002, stereo: 0.7, env: { a: 0.006, d: 0, s: 1, r: 0 } }, SR);
  H.normRms(b, db(-44), Math.round(1 * SR), Math.round(20 * SR));
  H.addInto(S.room, b, MUTE1, SR);
  // slow breathing of the room (pure function of t), then its own tail fade
  H.applyGain(S.room, SR, (t) => 1 + 0.12 * Math.sin(TAUf(0.11) * t + 0.7));
  H.fadeToSilence(S.room, SR, 41.5, SILENT);
}
function TAUf(f) { return 2 * Math.PI * f; }

// ------------------------------------------------------------------ 2. sub (mono, dry, 120 Hz LP)
// Hook drone A1 -18 dB from 0.6 with a pulse on each bar; lands A1 at the reveal; follows the chord root.
{
  const drone = E.sub({ t: 0.6, dur: MUTE0 - 0.6 + 0.05, note: 'A1', gain: db(DRONE_DB), env: { a: 1.4, d: 0.1, s: 1, r: 0.02 } }, SR);
  const pulse = (t) => { let g = 1; for (const b of [BARS[1], BARS[2]]) { const d = t + 0.6 - b; if (d >= 0) g += 0.8 * Math.min(1, d / 0.04) * Math.exp(-d / 0.6); } return g; };
  for (let i = 0; i < drone.L.length; i++) { const g = pulse(i / SR); drone.L[i] *= g; drone.R[i] *= g; }
  H.addInto(S.sub, drone, 0.6, SR);
  // body sub: ONE phase-continuous sine (no beating nulls at root changes), 25 ms glide between roots
  const roots = [
    [HIT.reveal, 'A1'], [HIT.wall, 'F1'], [HIT.column, 'C2'], [HIT.studio, 'G1'],
    [HIT.publish, 'A1'], [HIT.ledger, 'F1'], [HIT.human, 'A1'],
  ].map(([t, nn]) => [t, E.noteFreq(nn)]);
  const bodyEnd = BARS[13] - 0.25, bodyRel = 0.4;     // breathes out before the logo bar
  {
    const i0 = Math.round(HIT.reveal * SR), i1 = Math.round((bodyEnd + bodyRel) * SR);
    let ph = 0, f = roots[0][1];
    const amp = db(-18.5), glide = Math.exp(-1 / (0.008 * SR));
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      let target = roots[0][1]; for (const [rt, rf] of roots) if (t >= rt) target = rf;
      f = target + (f - target) * glide;                      // ~25 ms to settle
      ph += f / SR; if (ph >= 1) ph -= 1;
      let e = Math.min(1, (t - HIT.reveal) / 0.02);
      if (t > bodyEnd) e *= Math.max(0, 1 - (t - bodyEnd) / bodyRel);
      const v = Math.sin(2 * Math.PI * ph) * e * amp;
      S.sub.L[i] += v; S.sub.R[i] += v;
    }
  }
  // logo: A1 lands with the thump, releases with the pad (3 s)
  H.addInto(S.sub, E.sub({ t: HIT.logo, dur: 0.25, note: 'A1', gain: db(-16), env: { a: 0.012, d: 0.1, s: 1, r: 3.0, curve: 1.6 } }, SR), HIT.logo, SR);
  H.sweepFilter(S.sub, SR, { type: 'lowpass', fcFn: () => 120, q: 0.707, stages: 1 });
  H.applyGain(S.sub, SR, H.duckFn(CUES.ducks, -6, 0.15));
  for (let i = 0; i < N; i++) S.sub.R[i] = S.sub.L[i];   // strictly mono
}

// ------------------------------------------------------------------ 3. hats (HP 8 kHz, exp(-60t), L/R alternate, Haas 10 ms)
{
  const rnd = E.mulberry32(3003);
  let k = 0;
  const lay = (t0, t1, div, levelFn) => {
    const step = BEAT / div;
    for (let j = 0; ; j++) {
      const t = t0 + j * step; if (t >= t1 - 1e-6) break;
      const pos = j % div;                                  // position inside the beat
      const acc = pos === 0 ? 0 : (div === 4 && pos === 2 ? -2.5 : (div === 2 ? -2.5 : -5));
      const hum = (rnd() - 0.5) * 1.2;                     // +-0.6 dB seeded humanisation
      const lvl = levelFn(t); if (lvl === null) continue;
      const x = H.hat({ seed: 5000 + k, hp: 8000, rate: 60, dur: 0.09 });
      const left = k % 2 === 0;
      H.placeMono(S.hats, x, t, SR, db(lvl + acc + hum), left ? -0.35 : 0.35, left ? 0.010 : -0.010, -3);
      k++;
    }
  };
  // hook: 8ths from 2.857 (-24) -> 16ths at 5.714 swelling -22 -> -18 -> gated at 7.857
  lay(BARS[1], BARS[2], 2, () => -24);
  lay(BARS[2], MUTE0, 4, (t) => -22 + 4 * Math.pow((t - BARS[2]) / (MUTE0 - BARS[2]), 1.5));
  // column/device: 8ths -24
  lay(HIT.column, HIT.studio, 2, () => -24);
  // studio + publish: 16ths (tempo peak)
  lay(HIT.studio, HIT.ledger, 4, () => -23);
  // ledger: 8ths, fade out 33.5 -> 34.286
  lay(HIT.ledger, HIT.human, 2, (t) => (t < 33.5 ? -24 : -24 - 30 * Math.pow((t - 33.5) / (HIT.human - 33.5), 1.3)));
}

// ------------------------------------------------------------------ 4. hook swell (bandpass 300 Hz -> 4 kHz, u^2), 3.5 -> 7.857 (gated)
{
  const t0 = 3.5, dur = (MUTE0 - t0) / 0.97 + 0.02;      // built-in end taper sits after the mute
  const r = E.riser({ t: t0, dur, from: 300, to: 4000, gain: 1, curve: 2, seed: 4004 }, SR);
  H.normPeak(r, db(SWELL_DB));
  H.addInto(S.swell, r, t0, SR);
}

// ------------------------------------------------------------------ 5. pad (3 detuned saws +-8 c, time-varying LP, L/R 1:1.03, LFO 0.7 Hz)
const CHORDS = [
  { t: HIT.reveal, end: HIT.wall, name: 'Am9', notes: ['A2', 'E3', 'G3', 'B3'] },
  { t: HIT.wall, end: HIT.column, name: 'Fmaj9', notes: ['F2', 'C3', 'E3', 'G3', 'A3'] },
  { t: HIT.column, end: HIT.studio, name: 'Cmaj7', notes: ['C3', 'E3', 'G3', 'B3'] },          // holds through 22.857
  { t: HIT.studio, end: HIT.publish, name: 'G6/9', notes: ['G2', 'D3', 'E3', 'A3', 'B3'] },
  { t: HIT.publish, end: HIT.ledger, name: 'Am9', notes: ['A2', 'E3', 'G3', 'B3'] },
  { t: HIT.ledger, end: HIT.human, name: 'Fmaj9', notes: ['F2', 'C3', 'E3', 'G3', 'A3'] },
  { t: HIT.human, end: HIT.logo, name: 'Am9(add11)', notes: ['A2', 'E3', 'B3', 'D4'] },
  { t: HIT.logo, end: HIT.logo + 0.06, name: 'Am(add9)', notes: ['A2', 'E3', 'B3', 'C4'] },   // released over 3 s
];
const PAD_NOTE_GAIN = 0.05;   // raw per-note gain; the pad bus is normalised below
const PAD_REVEAL_DB = -16.5, PAD_PEAK_DB = 1.2;
// voicing balance: the sub carries the root, so the pad's bass voices sit lower (leaves room for sub + thumps)
function voiceGain(nn) { const f = E.noteFreq(nn); return f < 128 ? db(-7) : f < 170 ? db(-2.5) : 1; }
let PAD_VOICES = [];
/** musical sanity: every voice is a chord tone of every chord it sounds over (attack..end of sustain), never above C6 */
function assertChordTones(label, voices, chords) {
  const C6 = E.noteFreq('C6');
  for (const v of voices) {
    if (E.noteFreq(v.nn) > C6) throw new Error(`${label}: ${v.nn} above C6`);
    for (const c of chords) if (c.t < v.t1 - 1e-6 && c.end > v.t0 + 1e-6 && !c.notes.includes(v.nn)) throw new Error(`${label}: ${v.nn} is not a tone of ${c.name || c.t}`);
  }
}
function padVoice(nn, t0, t1, { a, r, gain = PAD_NOTE_GAIN, seed, curve = 1 }) {
  return E.note({ t: t0, dur: t1 - t0, note: nn, wave: 'saw', voices: 3, detune: 8, width: 0.6, gain: gain * voiceGain(nn), seed, env: { a, d: 1.6, s: 0.86, r, curve } }, SR);
}
{
  // dark Am 5.0 -> 7.857 (no 9th), fc 300 Hz, DARK_PAD_DB RMS; gated by the mute
  const dark = stem();
  ['A2', 'E3', 'A3'].forEach((nn, j) => H.addInto(dark, padVoice(nn, 5.0, MUTE0 + 0.05, { a: 2.2, r: 0.05, seed: 600 + j }), 5.0, SR));
  H.sweepFilter(dark, SR, { type: 'lowpass', q: 0.707, stages: 2, rRatio: 1.03, fcFn: (t) => 300 + 60 * ((t - 5) / 2.857) + 70 * Math.sin(TAUf(0.7) * t) });
  H.normRms(dark, db(DARK_PAD_DB), Math.round(6.8 * SR), Math.round(7.8 * SR));
  H.addInto(S.pad, dark, 0, SR);

  // main pad from the reveal: common tones are held across chord changes (voice-leading), new tones attack on the bar
  const main = stem();
  const held = new Map(); // note -> start
  const voices = [];
  CHORDS.forEach((c, ci) => {
    const next = CHORDS[ci + 1];
    for (const nn of c.notes) if (!held.has(nn)) held.set(nn, { start: c.t, first: ci });
    for (const [nn, v] of [...held]) {
      const continues = next && next.notes.includes(nn);
      if (!continues && c.notes.includes(nn)) { voices.push({ nn, t0: v.start, t1: c.end, first: v.first }); held.delete(nn); }
    }
  });
  assertChordTones('pad', voices, CHORDS);
  PAD_VOICES = voices;
  voices.forEach((v, j) => {
    const fin = v.t1 > HIT.logo + 0.01;                              // voices that sound in the final logo chord
    const a = v.first === 0 ? 0.32 : 0.14;                           // bloom at the reveal, quicker on later bars
    const clip = padVoice(v.nn, v.t0, v.t1, fin ? { a, r: 3.0, seed: 700 + j, curve: 1.7 } : { a, r: 0.3, seed: 700 + j });
    H.addInto(main, clip, v.t0, SR);
  });
  // cutoff: 1.2 kHz bloom (600 ms) at the reveal, -> 2 kHz by the studio (= fully open) through publish/ledger,
  // back to 900 Hz on the human beat, final chord darkens as it releases. LFO 0.7 Hz +-200 Hz (scaled when dark).
  const fc = H.autom([
    [HIT.reveal, 300], [HIT.reveal + 0.6, 1200], [HIT.wall, 1250], [HIT.column, 1450], [HIT.device, 1650],
    [HIT.studio, 2000], [HIT.ledger, 2000], [HIT.human - 0.2, 1900], [HIT.human + 0.8, 900],
    [HIT.logo, 900], [HIT.logo + 0.05, 1150], [HIT.logo + 3.0, 450],
  ]);
  H.sweepFilter(main, SR, { type: 'lowpass', q: 0.707, stages: 3, rRatio: 1.03, fcFn: (t) => { const f = fc(t); return f + Math.min(200, 0.22 * f) * Math.sin(TAUf(0.7) * t); } });
  // level: PAD_REVEAL_DB RMS on the reveal, then the arc (dB): build to the studio/publish peak, step down for the
  // ledger, strip on the human beat, pull back under the logo riser so the riser owns 37.1-38.57
  H.normRms(main, db(PAD_REVEAL_DB), Math.round((HIT.reveal + 1.2) * SR), Math.round((HIT.wall - 0.6) * SR));
  const lvl = H.autom([[HIT.reveal, 0], [HIT.wall - 0.05, 0], [HIT.wall + 0.1, 0.5], [HIT.device, 1.0], [HIT.studio - 0.05, 1.0], [HIT.studio + 0.1, PAD_PEAK_DB], [HIT.ledger - 0.05, PAD_PEAK_DB], [HIT.ledger + 0.4, 1.0], [HIT.human - 0.05, 1.0], [HIT.human + 0.8, -2.0], [BARS[13], -2.5], [HIT.logo - 0.3, -6], [HIT.logo, 0]]);
  H.applyGain(main, SR, (t) => db(lvl(t)));
  // clean-up only below the voicing (a steep HPF on filtered saws raises the crest factor)
  H.sweepFilter(main, SR, { type: 'highpass', fcFn: () => 70, q: 0.707, stages: 1 });
  // feedback delay on the pad only: 357 ms dotted-8th, fb 0.35, ping-pong; loop LP 3 kHz, darker after 34.286 and 38.571
  const segs = H.splitSegments(main, SR, [HIT.human, HIT.logo], 0.03);
  const lps = [3000, 1800, 1200];
  segs.forEach((s, k) => H.addInto(S.pad, E.delay(s, SR, { time: 0.357, feedback: 0.35, mix: 0.3, pingpong: true, lp: lps[k] }), 0, SR));
}

// ------------------------------------------------------------------ 6. triangle air (+1 oct, -12 dB re pad), 25.714 -> 34.286
{
  const airChords = [
    { t: HIT.studio, end: HIT.publish, notes: ['E4', 'A4', 'B4'] },   // G6/9 upper tones +8va
    { t: HIT.publish, end: HIT.ledger, notes: ['E4', 'G4', 'B4'] },   // Am9
    { t: HIT.ledger, end: HIT.human, notes: ['E4', 'G4', 'A4'] },     // Fmaj9
  ];
  const held = new Map(); const vs = [];
  airChords.forEach((c, ci) => {
    const next = airChords[ci + 1];
    for (const nn of c.notes) if (!held.has(nn)) held.set(nn, c.t);
    for (const [nn, t0] of [...held]) if (c.notes.includes(nn) && !(next && next.notes.includes(nn))) { vs.push([nn, t0, c.end]); held.delete(nn); }
  });
  assertChordTones('air', vs.map(([nn, t0, t1]) => ({ nn, t0, t1 })), airChords.map((c, i) => ({ ...c, notes: c.notes.concat(CHORDS.find((k) => k.t === c.t).notes) })));
  vs.forEach(([nn, t0, t1], j) => {
    H.addInto(S.air, E.note({ t: t0, dur: t1 - t0, note: nn, wave: 'tri', voices: 2, detune: 5, width: 0.9, gain: PAD_NOTE_GAIN * db(-12) * 1.6, lp: 5000, q: 0.707, seed: 900 + j, env: { a: 0.9 + 0.25 * (j % 3), d: 1, s: 0.9, r: 0.7 } }, SR), t0, SR);
  });
  // -12 dB under the pad at its peak level
  H.normRms(S.air, db(PAD_REVEAL_DB + PAD_PEAK_DB - 12), Math.round((HIT.studio + 1.5) * SR), Math.round((HIT.human - 0.5) * SR));
}

// ------------------------------------------------------------------ 7. chimes: partials [1,2.01,3.0,4.2,5.4], decay exp(-t(2+2j)), amp 1/(j+1)
const PARTIALS = [1, 2.01, 3.0, 4.2, 5.4].map((ratio, j) => ({ ratio, amp: 1 / (j + 1), decay: 1 / (2 + 2 * j) }));
function chime(nn, peakDb, pan) {
  const c = E.chime({ note: nn, dur: 3.2, gain: 1, partials: PARTIALS, pan, attack: 0.003 }, SR);
  return H.normPeak(c, db(peakDb));
}
{
  // "Not anymore." — one dry A5, -14 dB, reverb 15 % (send scaled 0.15 / 0.28)
  const a = chime('A5', -14, -0.05);
  H.addInto(S.chime, a, CUES.chime, SR);
  H.addInto(SEND, a, CUES.chime, SR, 0.15 / 0.28);
  // logo dyad: A5 on 38.571 (the frame the wordmark hits 90 %), E6 on the second tittle (+90 ms)
  const l1 = chime('A5', -12, -0.12), l2 = chime('E6', -16, 0.15);
  H.addInto(S.chime, l1, HIT.logo, SR); H.addInto(SEND, l1, HIT.logo, SR);
  H.addInto(S.chime, l2, HIT.logo + 0.09, SR); H.addInto(SEND, l2, HIT.logo + 0.09, SR);
}

// ------------------------------------------------------------------ 8. thumps (120 -> 60 Hz, ~300 ms), mono, dry
{
  const th = (t, dB) => H.addInto(S.thump, H.normPeak(E.thump({ f0: 120, f1: 60, dur: 0.34, decay: 9, drop: 28, click: 0.02, gain: 1 }, SR), db(dB)), t, SR);
  th(HIT.reveal, -10); th(HIT.wall, -14); th(HIT.studio, -14); th(HIT.logo, -8);
}

// ------------------------------------------------------------------ 9. paper ticks (noise 30 ms, HP 2k + LP 4k), dry
{
  const tk = (t, dB, o = {}) => H.placeMono(S.ticks, H.tick({ seed: o.seed, dur: o.dur || 0.03, hp: o.hp || 2000, lp: o.lp || 4000, tau: o.tau || 0.007 }), t, SR, db(dB), o.pan || 0);
  const [dot, wall, tap, press] = CUES.ticks;
  tk(dot, -16, { seed: 8101, pan: 0.1 });              // the chosen dot sets
  tk(wall, -16, { seed: 8102, pan: -0.05 });           // one tick for the whole stagger
  tk(tap, -16, { seed: 8103, pan: 0.12 });             // tap on the hero in the phone
  // ratchet: 7 detents in 420 ms, one gesture; the band tightens a little each detent
  for (let k = 0; k < CUES.ratchet.n; k++) {
    tk(CUES.ratchet.start + k * CUES.ratchet.step, -15 + (k === CUES.ratchet.n - 1 ? 0.8 : -0.25 * (k % 2)), { seed: 8200 + k, hp: 2000 + 70 * k, lp: 4000 + 60 * k, tau: 0.006, pan: -0.25 + 0.03 * k });
  }
  tk(press, -15, { seed: 8301, dur: 0.04, hp: 2000, tau: 0.009, pan: -0.2 });   // long-press start (slightly longer)
}

// ------------------------------------------------------------------ 10. risers / air
{
  // turn breath: low LP-noise from 10.0 rising into the reveal downbeat
  const br = H.sweepNoise({ dur: HIT.reveal - 10.0, type: 'lowpass', from: 140, to: 900, envFn: (u) => Math.pow(u, 2.2), peak: db(-24), seed: 9001, taper: 0.03 });
  H.addInto(S.fx, br, 10.0, SR);
  // publish: noise LP 400 Hz -> 6 kHz, u^2, 28.929 -> 30.143
  const [p0, p1] = CUES.risers.publish;
  H.addInto(S.fx, H.sweepNoise({ dur: p1 - p0, type: 'lowpass', from: 400, to: 6000, envFn: (u) => u * u, peak: db(-19), seed: 9002, taper: 0.02 }), p0, SR);
  // lift: reversed-air (HP sweep upward, the riser's envelope mirrored: quick onset, (1-u)^2 away), 30.143 -> 30.714
  const [l0, l1] = CUES.risers.lift;
  H.addInto(S.fx, H.sweepNoise({ dur: l1 - l0, type: 'highpass', from: 1200, to: 9000, envFn: (u) => Math.min(1, u / 0.03) * Math.pow(1 - u, 2), peak: db(-23), seed: 9003, taper: 0.02 }), l0, SR);
  // logo riser: noise LP 200 -> 8 kHz (u^2) + sine A4 -> A5, 37.143 -> 38.571, resolving on the hit
  const [g0, g1] = CUES.risers.logo;
  H.addInto(S.fx, H.sweepNoise({ dur: g1 - g0, type: 'lowpass', from: 200, to: 8000, envFn: (u) => u * u, peak: db(-17), seed: 9004, taper: 0.018 }), g0, SR);
  {
    const n = Math.round((g1 - g0) * SR), sn = { L: new Float32Array(n), R: new Float32Array(n) };
    let ph = 0; const fA4 = E.noteFreq('A4');
    for (let i = 0; i < n; i++) {
      const u = i / n; ph += fA4 * Math.pow(2, u) / SR;
      let e = u * u; const tp = Math.round(0.018 * SR); if (i > n - tp) e *= 0.5 - 0.5 * Math.cos(Math.PI * (n - i) / tp);
      const v = Math.sin(2 * Math.PI * ph) * e * db(-29); sn.L[i] = v; sn.R[i] = v;
    }
    H.addInto(S.fx, sn, g0, SR);
  }
  // pre-logo reversed-air swell 38.171 -> 38.571: reversed HP air + reversed reverb of the dyad, cut on the hit
  const pre = 0.4;
  const air = H.reverse(H.sweepNoise({ dur: pre, type: 'highpass', from: 7000, to: 1800, envFn: (u) => Math.exp(-6 * u), peak: db(-22), seed: 9005, taper: 0.002 }));
  H.addInto(S.fx, air, HIT.logo - pre, SR);
  {
    const src = H.stereo(Math.round(1.2 * SR));
    H.addInto(src, chime('A5', -12, -0.12), 0, SR); H.addInto(src, chime('E6', -16, 0.15), 0, SR);
    const wet = E.schroederReverb(src, SR, { mix: 1, decay: 0.78, damp: 0.35, predelay: 0.0 });
    const seg = { L: wet.L.slice(0, Math.round(pre * SR)), R: wet.R.slice(0, Math.round(pre * SR)) };
    const rev = H.reverse(seg);
    for (let i = 0, n = rev.L.length, tp = Math.round(0.003 * SR); i < tp; i++) { const g = i / tp; rev.L[n - 1 - i] *= g; rev.R[n - 1 - i] *= g; }
    H.normPeak(rev, db(-24));
    H.addInto(S.fx, rev, HIT.logo - pre, SR);
  }
}

// ------------------------------------------------------------------ gate every voice through the freeze (true digital silence 7.857 -> 8.571)
for (const k of Object.keys(S)) H.gate(S[k], SR, MUTE0, MUTE1);
H.gate(SEND, SR, MUTE0, MUTE1);

// ------------------------------------------------------------------ reverb (pad + air + chimes), via Mix.render; wet LP 5 kHz
{
  for (let i = 0; i < N; i++) { SEND.L[i] += S.pad.L[i] + S.air.L[i]; SEND.R[i] += S.pad.R[i] + S.air.R[i]; }
}
const WET = (() => {
  const bus = new E.Mix({ sr: SR, seconds: CUES.duration });
  bus.L.set(SEND.L); bus.R.set(SEND.R);
  const out = bus.render({ reverb: { mix: 0.28, decay: 0.78, damp: 0.35, predelay: 0.02 }, limiter: false, hpf: 0, fadeIn: 0, fadeOut: 0, gain: 1 });
  const wet = H.stereo(N);
  for (let i = 0; i < N; i++) { wet.L[i] = out.L[i] - SEND.L[i]; wet.R[i] = out.R[i] - SEND.R[i]; }   // isolate the wet return
  H.sweepFilter(wet, SR, { type: 'lowpass', fcFn: () => 5000, q: 0.707, stages: 1 });
  return wet;
})();

// ------------------------------------------------------------------ master
function sumBus() {
  const m = H.stereo(N);
  for (const k of Object.keys(S)) { const s = S[k]; for (let i = 0; i < N; i++) { m.L[i] += s.L[i]; m.R[i] += s.R[i]; } }
  for (let i = 0; i < N; i++) { m.L[i] += WET.L[i]; m.R[i] += WET.R[i]; }
  // master HPF 25 Hz (DC / rumble), 2 stages
  H.sweepFilter(m, SR, { type: 'highpass', fcFn: () => 25, q: 0.707, stages: 1 });
  return m;
}
function finish(m) {
  H.gate(m, SR, MUTE0, MUTE1);               // the freeze: digital zeros on every channel
  H.fadeToSilence(m, SR, 41.55, SILENT);     // tails gone, -inf from 42.3
  return m;
}
const RAW = sumBus();
const TARGET = -14.0, TP_MAX = -1.0;
let gain = 1, master = null, lim = null, meas = null, tp = 0, ceil = 0.84;
const rawMeas = H.loudness(finish(cloneBuf(RAW)));
gain = db(TARGET - rawMeas.I);
for (let it = 0; it < 6; it++) {
  master = H.scale(cloneBuf(RAW), gain);
  lim = H.limiter(master, SR, { knee: ceil * 0.82, ceil, lookahead: 0.004, release: 0.12 });
  finish(master);
  meas = H.loudness(master);
  tp = H.toDb(H.truePeak(master));
  const dI = TARGET - meas.I;
  if (tp > TP_MAX - 0.25) ceil *= db(TP_MAX - 0.3 - tp);
  if (Math.abs(dI) < 0.02 && tp <= TP_MAX - 0.2) break;
  gain *= db(dI);
}
function cloneBuf(b) { return { L: Float32Array.from(b.L), R: Float32Array.from(b.R) }; }

if (process.env.STEMS_DIR) {   // debug: write every stem (post master gain, pre limiter) for inspection
  for (const [k, b] of Object.entries({ ...S, wet: WET })) E.writeWav(path.join(process.env.STEMS_DIR, k + '.wav'), { L: H.scale(cloneBuf(b), gain).L, R: H.scale(cloneBuf(b), gain).R, sr: SR }, 24);
}
const out = path.join(__dirname, 'track.wav');
E.writeWav(out, { L: master.L, R: master.R, sr: SR }, 24);
console.log(`wrote ${out}: ${N} frames (${(N / SR).toFixed(3)} s), raw ${rawMeas.I.toFixed(2)} LUFS -> gain ${H.toDb(gain).toFixed(2)} dB`);
console.log(`JS meter: I ${meas.I.toFixed(2)} LUFS, LRA ${meas.LRA.toFixed(2)} LU, true peak ~${tp.toFixed(2)} dBTP, limiter max GR ${lim.maxReductionDb.toFixed(2)} dB at ${lim.maxAt.toFixed(3)} s (${lim.samplesOverKnee} samples over knee, ceil ${H.toDb(ceil).toFixed(2)} dBFS)`);

if (STEMS) {
  const sections = [['hookA', 0, BARS[1]], ['hookB', BARS[1], BARS[2]], ['tension', BARS[2], MUTE0], ['turn', MUTE1, HIT.reveal], ['reveal', HIT.reveal, HIT.wall], ['wall', HIT.wall, HIT.column], ['column', HIT.column, HIT.device], ['device', HIT.device, HIT.studio], ['studio', HIT.studio, HIT.publish], ['publish', HIT.publish, HIT.ledger], ['ledger', HIT.ledger, HIT.human], ['human', HIT.human, BARS[13]], ['logo', BARS[13], 42.0]];
  const all = { ...S, wet: WET };
  const rows = [];
  const hdr = 'section   ' + Object.keys(all).map((k) => k.padStart(7)).join('') + '   master(LUFS-ish)';
  console.log('\nper-stem RMS dBFS after master gain (blank = < -70)\n' + hdr);
  for (const [nm, a, b] of sections) {
    const i0 = Math.round(a * SR), i1 = Math.round(b * SR);
    const cells = Object.keys(all).map((k) => { const r = H.toDb(H.rmsOf(all[k], i0, i1) * gain); return (r < -70 ? '' : r.toFixed(1)).padStart(7); });
    const sl = meas.st.filter((s) => s.t >= a + 1.5 && s.t <= b + 1.5).map((s) => s.l);
    rows.push(nm.padEnd(10) + cells.join('') + '   ' + (sl.length ? Math.max(...sl).toFixed(1) : '').padStart(6));
  }
  console.log(rows.join('\n'));
  console.log('\npad voices (held through common-tone chord changes):\n' + PAD_VOICES.map((v) => `  ${v.nn.padEnd(3)} ${v.t0.toFixed(3)} -> ${v.t1.toFixed(3)}`).join('\n'));
}
