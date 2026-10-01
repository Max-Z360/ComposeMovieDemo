'use strict';
/**
 * Cue verification for audio/track.wav against src/cues.js.
 *   node audio/verify_cues.js [path/to.wav]
 * For every tick / ratchet detent / thump / logo cue it band-filters the WAV, builds an onset function
 * (frame energy with 1 ms hop vs. the energy just before it) and finds the onset within +-25 ms of the cue. PASS = onset within +-10 ms of the cue AND an energy jump above the band threshold.
 * Also checks: length == CUES.duration, 7.857-8.571 is digital silence (all-zero PCM), -inf from 42.3.
 * Prints a table; exits 1 on any failure.
 */
const path = require('path');
const E = require('./engine');
const H = require('./helpers');
const CUES = require('../src/cues.js');

const file = process.argv[2] || path.join(__dirname, 'track.wav');
const w = H.readWav(file);
const sr = w.sr;
const mono = new Float32Array(w.frames);
for (let i = 0; i < w.frames; i++) mono[i] = 0.5 * (w.L[i] + w.R[i]);

function band(x, hp, lp) {
  let y = x;
  if (hp) y = H.filterMono(y, sr, 'highpass', hp, 0.707, 2);
  if (lp) y = H.filterMono(y, sr, 'lowpass', lp, 0.707, 2);
  return y;
}
const BANDS = {
  tick: { x: band(mono, 2000, 4000), W: 0.002, base: [0.014, 0.004], minJump: 10, sustain: 1, label: '2-4 kHz' },
  low: { x: band(mono, 45, 180), W: 0.004, base: [0.060, 0.010], minJump: 3, sustain: 3, label: '45-180 Hz' },  // Hilbert envelope, see below
  chime: { x: band(mono, 750, 1500), W: 0.003, base: [0.030, 0.006], minJump: 6, sustain: 2, label: '0.75-1.5 kHz' },
};
// phase-independent envelope: e^2 = x^2 + hilbert(x)^2 (255-tap Hann-windowed FIR Hilbert transformer, delay-compensated)
function hilbertEnergy(x) {
  const M = 127, h = new Float64Array(2 * M + 1);
  for (let k = -M; k <= M; k++) h[k + M] = k % 2 === 0 ? 0 : (2 / (Math.PI * k)) * (0.5 + 0.5 * Math.cos(Math.PI * k / (M + 1)));
  const e = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    let acc = 0;
    for (let k = -M; k <= M; k += 1) { const j = i - k; if (j >= 0 && j < x.length && h[k + M] !== 0) acc += h[k + M] * x[j]; }
    e[i] = x[i] * x[i] + acc * acc;
  }
  return e;
}
// only the analysed neighbourhoods need the (slow) Hilbert envelope
function windowsAround(times, pad) { return times.map((t) => [Math.max(0, Math.round((t - pad) * sr)), Math.round((t + pad) * sr)]); }
// energy prefix sums per band
const LF_CUES = [CUES.hits.reveal, CUES.hits.wall, CUES.hits.studio, CUES.hits.logo];
for (const [name, b] of Object.entries(BANDS)) {
  let e;
  if (name === 'low') {             // LF: Hilbert envelope (no +-4 dB phase ripple from 45-65 Hz content)
    e = new Float64Array(b.x.length);
    for (const [i0, i1] of windowsAround(LF_CUES, 0.2)) { const seg = hilbertEnergy(b.x.subarray(i0, i1)); for (let i = 0; i < seg.length; i++) e[i0 + i] = seg[i]; }
  } else { e = new Float64Array(b.x.length); for (let i = 0; i < b.x.length; i++) e[i] = b.x[i] * b.x[i]; }
  const cs = new Float64Array(b.x.length + 1);
  for (let i = 0; i < b.x.length; i++) cs[i + 1] = cs[i] + e[i];
  b.cs = cs;
}
const meanE = (b, i0, i1) => { i0 = Math.max(0, i0); i1 = Math.min(b.x.length, i1); return i1 > i0 ? (b.cs[i1] - b.cs[i0]) / (i1 - i0) : 0; };

function onset(bandName, c) {
  // onset = FIRST 1 ms frame inside cue +-25 ms whose energy exceeds the energy just before it by >= minJump dB
  // and STAYS above it for `sustain` consecutive frames (3 for LF: bed ripple from beating low tones is shorter);
  // strength = the largest jump in the window. (argmax alone is biased late for LF sounds that build over a cycle)
  const b = BANDS[bandName], hop = Math.round(0.001 * sr), W = Math.round(b.W * sr);
  const B1 = Math.round(b.base[0] * sr), B2 = Math.round(b.base[1] * sr);
  const ks = [], js = [];
  for (let k = Math.round((c - 0.025) * sr); k <= Math.round((c + 0.025) * sr) + 2 * hop; k += hop) {
    const e = meanE(b, k, k + W), base = meanE(b, k - B1, k - B2);
    ks.push(k); js.push(10 * Math.log10((e + 1e-20) / (base + 1e-20)));
  }
  let first = null, maxJump = -Infinity;
  for (let i = 0; i + b.sustain <= js.length; i++) {
    if (js[i] > maxJump) maxJump = js[i];
    let held = true; for (let d = 0; d < b.sustain; d++) if (js[i + d] < b.minJump) held = false;
    if (first === null && held) first = (ks[i] + W / 2) / sr;   // frame centre
  }
  return { t: first === null ? NaN : first, jump: maxJump };
}

const checks = [];
const cue = (name, t, bandName) => checks.push({ name, t, bandName });
CUES.ticks.forEach((t, i) => cue(['tick dot', 'tick wall', 'tick tap', 'tick press'][i] || `tick ${i}`, t, 'tick'));
for (let k = 0; k < CUES.ratchet.n; k++) cue(`ratchet ${k + 1}/${CUES.ratchet.n}`, +(CUES.ratchet.start + k * CUES.ratchet.step).toFixed(3), 'tick');
cue('thump reveal', CUES.hits.reveal, 'low');
cue('thump wall', CUES.hits.wall, 'low');
cue('thump studio', CUES.hits.studio, 'low');
cue('logo thump', CUES.hits.logo, 'low');
cue('logo chime', CUES.hits.logo, 'chime');
cue('chime "Not anymore."', CUES.chime, 'chime');

let fail = 0;
const rows = [['cue', 'time s', 'band', 'onset s', 'offset ms', 'jump dB', 'result']];
for (const c of checks) {
  const o = onset(c.bandName, c.t), b = BANDS[c.bandName];
  const off = (o.t - c.t) * 1000;
  const ok = Number.isFinite(off) && Math.abs(off) <= 10 && o.jump >= b.minJump;
  if (!ok) fail++;
  rows.push([c.name, c.t.toFixed(3), b.label, Number.isFinite(o.t) ? o.t.toFixed(4) : 'none', Number.isFinite(off) ? (off >= 0 ? '+' : '') + off.toFixed(1) : '-', o.jump.toFixed(1), ok ? 'PASS' : 'FAIL']);
}

// structural checks
const sCheck = (name, ok, detail) => { if (!ok) fail++; rows.push([name, '', '', '', '', detail, ok ? 'PASS' : 'FAIL']); };
const expected = Math.round(CUES.duration * sr);
sCheck('length', w.frames === expected, `${w.frames}/${expected} fr`);
{
  const a = Math.round(CUES.mute[0] * sr), b = Math.round(CUES.mute[1] * sr);
  let nz = 0, mx = 0; for (let i = a; i < b; i++) { if (w.rawL[i] !== 0 || w.rawR[i] !== 0) nz++; mx = Math.max(mx, Math.abs(w.rawL[i]), Math.abs(w.rawR[i])); }
  sCheck(`mute ${CUES.mute[0]}-${CUES.mute[1]} digital 0`, nz === 0, `${nz} nonzero`);
  // gate ramp sanity: the 20 ms before the mute must fall smoothly (no step > 6 dB of the pre-gate level at the edge)
  const pre = H.rmsOf({ L: w.L, R: w.R }, a - Math.round(0.06 * sr), a - Math.round(0.02 * sr));
  const edge = H.rmsOf({ L: w.L, R: w.R }, a - Math.round(0.002 * sr), a);
  sCheck('mute gate ramp (<=20 ms)', edge < pre * 0.25, `${H.toDb(edge / pre).toFixed(1)} dB at edge`);
  const swell = H.rmsOf({ L: w.L, R: w.R }, a - Math.round(0.25 * sr), a - Math.round(0.02 * sr));
  sCheck('mute preceded by signal', swell > 1e-3, `${H.toDb(swell).toFixed(1)} dBFS`);
}
{
  const a = Math.round(CUES.silentBy * sr); let nz = 0;
  for (let i = a; i < w.frames; i++) if (w.rawL[i] !== 0 || w.rawR[i] !== 0) nz++;
  sCheck(`-inf from ${CUES.silentBy}`, nz === 0, `${nz} nonzero`);
}

const widths = rows[0].map((_, j) => Math.max(...rows.map((r) => String(r[j]).length)));
for (const [i, r] of rows.entries()) {
  console.log(r.map((v, j) => String(v)[j === 0 ? 'padEnd' : 'padStart'](widths[j])).join('  '));
  if (i === 0) console.log(widths.map((x) => '-'.repeat(x)).join('  '));
}
console.log(fail ? `\n${fail} check(s) FAILED` : `\nall ${rows.length - 1} checks passed`);
process.exit(fail ? 1 : 0);
