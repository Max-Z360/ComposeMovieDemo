'use strict';
/**
 * Minimal deterministic offline audio engine (Node, no deps).
 * Renders Float32 stereo buffers and writes 16/24-bit WAV.
 *
 * Everything is sample-accurate and deterministic (seeded PRNG only).
 * Usage sketch (see track.js):
 *   const E = require('./engine');
 *   const mix = new E.Mix({ sr: 48000, seconds: 42 });
 *   mix.add(E.note({ t: 0, dur: 4, freq: 220, wave: 'saw', gain: 0.1, env: {a: 1.5, d: 0.5, s: 0.8, r: 2}, lp: 1200, detune: 7 }));
 *   mix.add(E.hit({ t: 10, ... }));
 *   E.writeWav('audio/track.wav', mix.render({ reverb: {...}, limiter: true }), 48000);
 */
const fs = require('fs');

const TAU = Math.PI * 2;

// ---------- PRNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- music helpers ----------
const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
/** 'A4' -> 440 ; 'F#3' -> 185 */
function noteFreq(name, a4 = 440) {
  const m = /^([A-G][#b]?)(-?\d+)$/.exec(name);
  if (!m) throw new Error('bad note ' + name);
  const midi = (parseInt(m[2], 10) + 1) * 12 + NOTE_INDEX[m[1]];
  return a4 * Math.pow(2, (midi - 69) / 12);
}
function midiFreq(midi, a4 = 440) { return a4 * Math.pow(2, (midi - 69) / 12); }

// ---------- oscillators (phase in [0,1)) ----------
function oscSample(wave, phase) {
  switch (wave) {
    case 'sine': return Math.sin(TAU * phase);
    case 'tri': return 4 * Math.abs(phase - 0.5) - 1;
    case 'saw': return 2 * phase - 1;
    case 'square': return phase < 0.5 ? 1 : -1;
    default: return Math.sin(TAU * phase);
  }
}

// ---------- envelopes ----------
/** ADSR in seconds; returns gain at time t (seconds since note start) for note of length dur (incl. release after dur) */
function adsr(t, dur, { a = 0.01, d = 0.1, s = 0.8, r = 0.3, curve = 1 } = {}) {
  if (t < 0) return 0;
  let g;
  if (t < a) g = t / a;
  else if (t < a + d) g = 1 - (1 - s) * ((t - a) / d);
  else g = s;
  if (t > dur) {
    const rt = t - dur;
    if (rt >= r) return 0;
    g *= 1 - rt / r;
  }
  return curve === 1 ? g : Math.pow(g, curve);
}

// ---------- filters ----------
/** Simple one-pole lowpass state machine */
class OnePole {
  constructor(sr) { this.sr = sr; this.z = 0; this.setCutoff(1000); }
  setCutoff(hz) { const x = Math.exp(-TAU * Math.max(5, Math.min(hz, this.sr * 0.45)) / this.sr); this.a = 1 - x; this.b = x; }
  process(x) { this.z = this.a * x + this.b * this.z; return this.z; }
}
/** RBJ biquad (lowpass/highpass/bandpass/peak) */
class Biquad {
  constructor(sr) { this.sr = sr; this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set('lowpass', 1000, 0.707); }
  set(type, f0, Q = 0.707, gainDb = 0) {
    const sr = this.sr; f0 = Math.max(10, Math.min(f0, sr * 0.45));
    const w0 = TAU * f0 / sr, cs = Math.cos(w0), sn = Math.sin(w0), alpha = sn / (2 * Q), A = Math.pow(10, gainDb / 40);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lowpass') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
    else if (type === 'highpass') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
    else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
    else if (type === 'peak') { b0 = 1 + alpha * A; b1 = -2 * cs; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cs; a2 = 1 - alpha / A; }
    else throw new Error('filter type ' + type);
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y;
  }
}

// ---------- mix bus ----------
class Mix {
  constructor({ sr = 48000, seconds = 10 }) {
    this.sr = sr; this.n = Math.ceil(seconds * sr);
    this.L = new Float32Array(this.n); this.R = new Float32Array(this.n);
  }
  /** add a stereo clip at time t (seconds). clip = {L,R} Float32Arrays or {mono} */
  add(clip, t = clip.t || 0, gain = 1) {
    const start = Math.round(t * this.sr);
    const L = clip.L || clip.mono, R = clip.R || clip.mono;
    for (let i = 0; i < L.length; i++) {
      const j = start + i; if (j < 0) continue; if (j >= this.n) break;
      this.L[j] += L[i] * gain; this.R[j] += R[i] * gain;
    }
    return this;
  }
  /** master processing: optional reverb send, soft limiter, fades. returns {L,R} */
  render({ reverb = null, limiter = true, fadeIn = 0.01, fadeOut = 0.5, gain = 1, hpf = 25 } = {}) {
    let L = this.L, R = this.R;
    if (hpf) { const fl = new Biquad(this.sr), fr = new Biquad(this.sr); fl.set('highpass', hpf, 0.707); fr.set('highpass', hpf, 0.707); for (let i = 0; i < this.n; i++) { L[i] = fl.process(L[i]); R[i] = fr.process(R[i]); } }
    if (reverb) { const wet = schroederReverb({ L, R }, this.sr, reverb); for (let i = 0; i < this.n; i++) { L[i] += wet.L[i]; R[i] += wet.R[i]; } }
    const fi = Math.round(fadeIn * this.sr), fo = Math.round(fadeOut * this.sr);
    for (let i = 0; i < this.n; i++) {
      let g = gain;
      if (i < fi) g *= i / fi;
      if (i > this.n - fo) g *= Math.max(0, (this.n - i) / fo);
      L[i] *= g; R[i] *= g;
    }
    if (limiter) softLimit(L, R, this.sr);
    return { L, R, sr: this.sr };
  }
}

/** Simple feed-forward brick-wall-ish limiter with lookahead + soft clip */
function softLimit(L, R, sr, { ceiling = 0.89, lookahead = 0.002, release = 0.08 } = {}) {
  const la = Math.round(lookahead * sr), n = L.length;
  const env = new Float32Array(n);
  // peak over lookahead window
  for (let i = 0; i < n; i++) { let m = 0; for (let k = 0; k <= la && i + k < n; k++) { const v = Math.max(Math.abs(L[i + k]), Math.abs(R[i + k])); if (v > m) m = v; } env[i] = m; }
  const rel = Math.exp(-1 / (release * sr));
  let g = 1;
  for (let i = 0; i < n; i++) {
    const target = env[i] > ceiling ? ceiling / env[i] : 1;
    g = target < g ? target : target + (g - target) * rel;
    L[i] *= g; R[i] *= g;
    // final soft clip safety
    L[i] = Math.tanh(L[i] * 1.0); R[i] = Math.tanh(R[i] * 1.0);
  }
}

/** Schroeder reverb: 4 combs + 2 allpasses per channel, stereo-decorrelated. mix = wet gain */
function schroederReverb({ L, R }, sr, { mix = 0.25, decay = 0.78, damp = 0.35, predelay = 0.02 } = {}) {
  const n = L.length;
  const combsL = [1116, 1188, 1277, 1356].map(x => Math.round(x * sr / 44100));
  const combsR = [1139, 1211, 1300, 1379].map(x => Math.round(x * sr / 44100));
  const aps = [556, 441].map(x => Math.round(x * sr / 44100));
  const pd = Math.round(predelay * sr);
  function chan(src, combs) {
    const out = new Float32Array(n);
    const bufs = combs.map(len => ({ len, buf: new Float32Array(len), i: 0, z: 0 }));
    const apb = aps.map(len => ({ len, buf: new Float32Array(len), i: 0 }));
    for (let i = 0; i < n; i++) {
      const x = i - pd >= 0 ? src[i - pd] : 0;
      let acc = 0;
      for (const c of bufs) {
        const y = c.buf[c.i];
        c.z = y * (1 - damp) + c.z * damp;
        c.buf[c.i] = x + c.z * decay;
        c.i = (c.i + 1) % c.len;
        acc += y;
      }
      acc *= 0.25;
      for (const a of apb) {
        const d = a.buf[a.i];
        const y = -acc + d;
        a.buf[a.i] = acc + d * 0.5;
        a.i = (a.i + 1) % a.len;
        acc = y;
      }
      out[i] = acc * mix;
    }
    return out;
  }
  return { L: chan(L, combsL), R: chan(R, combsR) };
}

// ---------- generators ----------
/**
 * Synth note: multi-voice detuned oscillator through a lowpass (with optional envelope on cutoff), stereo spread.
 * {t, dur, freq|note, wave, voices, detune (cents), gain, env{a,d,s,r}, lp (Hz), lpEnv (Hz added at peak), pan (-1..1), width (0..1), vibrato{rate,depth(cents)}, seed}
 */
function note(o, sr = 48000) {
  const freq = o.freq || noteFreq(o.note);
  const env = o.env || { a: 0.01, d: 0.1, s: 0.8, r: 0.3 };
  const total = o.dur + (env.r || 0) + 0.01;
  const n = Math.ceil(total * sr);
  const L = new Float32Array(n), R = new Float32Array(n);
  const voices = o.voices || 1, det = o.detune || 0, rnd = mulberry32((o.seed || 1) * 7919 + Math.round(freq));
  const phases = [], rates = [], pans = [];
  for (let v = 0; v < voices; v++) {
    const cents = voices === 1 ? 0 : (v / (voices - 1) - 0.5) * 2 * det;
    rates.push(freq * Math.pow(2, cents / 1200) / sr);
    phases.push(rnd());
    pans.push(voices === 1 ? 0 : (v / (voices - 1) - 0.5) * 2 * (o.width == null ? 0.6 : o.width));
  }
  const fl = new Biquad(sr), fr = new Biquad(sr);
  const pan = o.pan || 0;
  const vib = o.vibrato || null;
  const gain = o.gain == null ? 0.2 : o.gain;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = adsr(t, o.dur, env);
    if (e <= 0 && t > o.dur) break;
    let vm = 1;
    if (vib) vm = Math.pow(2, Math.sin(TAU * vib.rate * t) * (vib.depth || 5) / 1200);
    let sl = 0, sr_ = 0;
    for (let v = 0; v < voices; v++) {
      phases[v] += rates[v] * vm; if (phases[v] >= 1) phases[v] -= 1;
      const s = oscSample(o.wave || 'saw', phases[v]);
      const p = Math.max(-1, Math.min(1, pans[v] + pan));
      sl += s * Math.cos((p + 1) * Math.PI / 4); sr_ += s * Math.sin((p + 1) * Math.PI / 4);
    }
    sl /= Math.sqrt(voices); sr_ /= Math.sqrt(voices);
    if (o.lp) {
      const cut = o.lp + (o.lpEnv || 0) * e;
      if (i % 32 === 0) { fl.set('lowpass', cut, o.q || 0.8); fr.set('lowpass', cut, o.q || 0.8); }
      sl = fl.process(sl); sr_ = fr.process(sr_);
    }
    L[i] = sl * e * gain; R[i] = sr_ * e * gain;
  }
  return { L, R, t: o.t || 0 };
}

/** Additive bell/chime: partials with exponential decays. {t, freq|note, dur, gain, partials:[{ratio, amp, decay}], pan} */
function chime(o, sr = 48000) {
  const f = o.freq || noteFreq(o.note);
  const partials = o.partials || [{ ratio: 1, amp: 1, decay: 2.5 }, { ratio: 2.0, amp: 0.4, decay: 1.6 }, { ratio: 3.01, amp: 0.25, decay: 1.1 }, { ratio: 4.2, amp: 0.12, decay: 0.7 }, { ratio: 5.4, amp: 0.08, decay: 0.5 }];
  const n = Math.ceil((o.dur || 3) * sr), L = new Float32Array(n), R = new Float32Array(n);
  const gain = o.gain == null ? 0.15 : o.gain, pan = o.pan || 0;
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  const atk = Math.round((o.attack || 0.004) * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr; let s = 0;
    for (const p of partials) s += Math.sin(TAU * f * p.ratio * t) * p.amp * Math.exp(-t / p.decay);
    const a = i < atk ? i / atk : 1;
    s *= gain * a; L[i] = s * gl; R[i] = s * gr;
  }
  return { L, R, t: o.t || 0 };
}

/** Filtered noise burst (hat/shaker/air). {t, dur, gain, hp, lp, env{a,d,s,r}, seed, pan} */
function noise(o, sr = 48000) {
  const env = o.env || { a: 0.001, d: 0.03, s: 0, r: 0.02 };
  const n = Math.ceil((o.dur + (env.r || 0) + 0.01) * sr), L = new Float32Array(n), R = new Float32Array(n);
  const rnd = mulberry32(o.seed || 42);
  const hpl = new Biquad(sr), hpr = new Biquad(sr), lpl = new Biquad(sr), lpr = new Biquad(sr);
  hpl.set('highpass', o.hp || 6000, 0.7); hpr.set('highpass', o.hp || 6000, 0.7);
  lpl.set('lowpass', o.lp || 14000, 0.7); lpr.set('lowpass', o.lp || 14000, 0.7);
  const gain = o.gain == null ? 0.1 : o.gain, pan = o.pan || 0;
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  const stereo = o.stereo == null ? 0.3 : o.stereo;
  for (let i = 0; i < n; i++) {
    const t = i / sr, e = adsr(t, o.dur, env);
    const a = rnd() * 2 - 1, b = rnd() * 2 - 1;
    const xl = a, xr = a * (1 - stereo) + b * stereo;
    L[i] = lpl.process(hpl.process(xl)) * e * gain * gl; R[i] = lpr.process(hpr.process(xr)) * e * gain * gr;
  }
  return { L, R, t: o.t || 0 };
}

/** Riser: noise sweeping a bandpass upward + optional rising sine. {t, dur, gain, from, to, seed} */
function riser(o, sr = 48000) {
  const n = Math.ceil(o.dur * sr), L = new Float32Array(n), R = new Float32Array(n);
  const rnd = mulberry32(o.seed || 7), bl = new Biquad(sr), br = new Biquad(sr);
  const gain = o.gain == null ? 0.12 : o.gain;
  for (let i = 0; i < n; i++) {
    const u = i / n; const f = (o.from || 200) * Math.pow((o.to || 6000) / (o.from || 200), u);
    if (i % 32 === 0) { bl.set('bandpass', f, 1.2); br.set('bandpass', f * 1.01, 1.2); }
    const e = Math.pow(u, o.curve || 2) * (1 - Math.pow(Math.max(0, (u - 0.97) / 0.03), 2));
    const a = rnd() * 2 - 1, b = rnd() * 2 - 1;
    L[i] = bl.process(a) * e * gain * 3; R[i] = br.process(a * 0.6 + b * 0.4) * e * gain * 3;
  }
  return { L, R, t: o.t || 0 };
}

/** Kick / thump: sine with pitch drop. {t, gain, f0, f1, dur, click} */
function thump(o, sr = 48000) {
  const dur = o.dur || 0.6, n = Math.ceil(dur * sr), L = new Float32Array(n), R = new Float32Array(n);
  const f0 = o.f0 || 120, f1 = o.f1 || 42, gain = o.gain == null ? 0.5 : o.gain;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, u = t / dur;
    const f = f1 + (f0 - f1) * Math.exp(-t * (o.drop || 28));
    ph += f / sr;
    const e = Math.exp(-t * (o.decay || 7)) * (1 - Math.pow(u, 6));
    let s = Math.sin(TAU * ph) * e;
    if (o.click) s += (Math.exp(-t * 400)) * o.click * Math.sin(TAU * 1800 * t);
    L[i] = s * gain; R[i] = s * gain;
  }
  return { L, R, t: o.t || 0 };
}

/** Sub bass note (sine, soft). {t, dur, note|freq, gain} */
function sub(o, sr = 48000) { return note({ ...o, wave: 'sine', voices: 1, lp: 0, env: o.env || { a: 0.02, d: 0.1, s: 0.9, r: 0.15 }, gain: o.gain == null ? 0.3 : o.gain }, sr); }

// ---------- stereo delay (feedback) applied to a clip ----------
function delay(clip, sr, { time = 0.375, feedback = 0.35, mix = 0.3, pingpong = true, lp = 4000 } = {}) {
  const d = Math.round(time * sr), n = clip.L.length + Math.round(sr * 3);
  const L = new Float32Array(n), R = new Float32Array(n);
  const fl = new OnePole(sr), fr = new OnePole(sr); fl.setCutoff(lp); fr.setCutoff(lp);
  for (let i = 0; i < n; i++) {
    const inL = i < clip.L.length ? clip.L[i] : 0, inR = i < clip.R.length ? clip.R[i] : 0;
    const dl = i - d >= 0 ? L[i - d] : 0, dr = i - d >= 0 ? R[i - d] : 0;
    const fbL = fl.process(pingpong ? dr : dl) * feedback, fbR = fr.process(pingpong ? dl : dr) * feedback;
    L[i] = inL + fbL; R[i] = inR + fbR;
  }
  // return dry + wet*mix
  const outL = new Float32Array(n), outR = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const inL = i < clip.L.length ? clip.L[i] : 0, inR = i < clip.R.length ? clip.R[i] : 0;
    outL[i] = inL + (L[i] - inL) * mix; outR[i] = inR + (R[i] - inR) * mix;
  }
  return { L: outL, R: outR, t: clip.t || 0 };
}

// ---------- WAV writer ----------
function writeWav(path, { L, R, sr }, bits = 24) {
  const n = L.length, bytes = bits / 8, dataLen = n * 2 * bytes;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2 * bytes, 28); buf.writeUInt16LE(2 * bytes, 32); buf.writeUInt16LE(bits, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40);
  let o = 44;
  const max = bits === 16 ? 32767 : 8388607;
  for (let i = 0; i < n; i++) {
    for (const ch of [L, R]) {
      let v = Math.max(-1, Math.min(1, ch[i])) * max; v = Math.round(v);
      if (bits === 16) { buf.writeInt16LE(v, o); o += 2; } else { buf.writeIntLE(v, o, 3); o += 3; }
    }
  }
  fs.writeFileSync(path, buf);
  return path;
}

module.exports = { Mix, note, chime, noise, riser, thump, sub, delay, writeWav, noteFreq, midiFreq, adsr, Biquad, OnePole, mulberry32, schroederReverb, softLimit };
