'use strict';
/**
 * Post-processing helpers for track.js (engine.js stays untouched).
 * Everything operates on Float32Array buffers, is deterministic (mulberry32 seeds only),
 * and every filter here keeps Q <= 1.2.
 */
const fs = require('fs');
const E = require('./engine');

const TAU = Math.PI * 2;
const db = (d) => Math.pow(10, d / 20);
const toDb = (g) => (g > 0 ? 20 * Math.log10(g) : -Infinity);

function stereo(n) { return { L: new Float32Array(n), R: new Float32Array(n) }; }

/** add clip ({L,R} or {mono}) into dst at time t (s) with gain; sample-accurate (round(t*sr)) */
function addInto(dst, clip, t, sr, gain = 1) {
  const start = Math.round(t * sr);
  const L = clip.L || clip.mono, R = clip.R || clip.mono;
  const n = dst.L.length;
  for (let i = 0; i < L.length; i++) {
    const j = start + i; if (j < 0) continue; if (j >= n) break;
    dst.L[j] += L[i] * gain; dst.R[j] += R[i] * gain;
  }
  return dst;
}

/** piecewise automation: points [[t, v], ...] sorted; cosine (smooth) interpolation; holds outside */
function autom(points, shape = 'cos') {
  const P = points.slice().sort((a, b) => a[0] - b[0]);
  return function (t) {
    if (t <= P[0][0]) return P[0][1];
    if (t >= P[P.length - 1][0]) return P[P.length - 1][1];
    let k = 0; while (t > P[k + 1][0]) k++;
    const [t0, v0] = P[k], [t1, v1] = P[k + 1];
    let u = t1 > t0 ? (t - t0) / (t1 - t0) : 1;
    if (shape === 'cos') u = 0.5 - 0.5 * Math.cos(Math.PI * u);
    else if (shape === 'expo') u = 1 - Math.pow(2, -10 * u);
    return v0 + (v1 - v0) * u;
  };
}

/** multiply buffers by fn(t) (gain) */
function applyGain(buf, sr, fn) {
  const { L, R } = buf;
  for (let i = 0; i < L.length; i++) { const g = fn(i / sr); L[i] *= g; R[i] *= g; }
  return buf;
}
function scale(buf, g) { for (let i = 0; i < buf.L.length; i++) { buf.L[i] *= g; buf.R[i] *= g; } return buf; }

/**
 * Time-varying filter on a stereo buffer. fcFn(t) -> Hz (L channel); R uses fc * rRatio.
 * stages = cascaded biquads (Q each <= 1.2). Coefficients updated every `every` samples.
 */
function sweepFilter(buf, sr, { type = 'lowpass', fcFn, q = 0.707, stages = 2, rRatio = 1, every = 16, from = 0, to = null } = {}) {
  if (q > 1.2) throw new Error('Q > 1.2 not allowed');
  const { L, R } = buf;
  const i0 = Math.max(0, Math.round(from * sr)), i1 = to == null ? L.length : Math.min(L.length, Math.round(to * sr));
  const fl = [], fr = [];
  for (let s = 0; s < stages; s++) { fl.push(new E.Biquad(sr)); fr.push(new E.Biquad(sr)); }
  for (let i = i0; i < i1; i++) {
    if ((i - i0) % every === 0) {
      const fc = fcFn(i / sr);
      for (let s = 0; s < stages; s++) { fl[s].set(type, fc, q); fr[s].set(type, fc * rRatio, q); }
    }
    let l = L[i], r = R[i];
    for (let s = 0; s < stages; s++) { l = fl[s].process(l); r = fr[s].process(r); }
    L[i] = l; R[i] = r;
  }
  return buf;
}

/** static filter on a mono Float32Array, cascaded */
function filterMono(x, sr, type, fc, q = 0.707, stages = 1) {
  if (q > 1.2) throw new Error('Q > 1.2 not allowed');
  const fs_ = []; for (let s = 0; s < stages; s++) { const b = new E.Biquad(sr); b.set(type, fc, q); fs_.push(b); }
  const y = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { let v = x[i]; for (const b of fs_) v = b.process(v); y[i] = v; }
  return y;
}

/**
 * Hard gate: closes with a raised-cosine ramp that ENDS exactly at `close` (sample round(close*sr)),
 * digital zeros on [round(close*sr), round(open*sr)), reopens with a ramp starting at `open`.
 */
function gate(buf, sr, close, open, { rampClose = 0.015, rampOpen = 0.008 } = {}) {
  const { L, R } = buf;
  const c = Math.round(close * sr), o = Math.round(open * sr);
  const rc = Math.round(rampClose * sr), ro = Math.round(rampOpen * sr);
  for (let i = Math.max(0, c - rc); i < c; i++) { const u = (c - i) / rc; const g = 0.5 - 0.5 * Math.cos(Math.PI * u); L[i] *= g; R[i] *= g; }
  for (let i = c; i < Math.min(o, L.length); i++) { L[i] = 0; R[i] = 0; }
  for (let i = o; i < Math.min(o + ro, L.length); i++) { const u = (i - o) / ro; const g = 0.5 - 0.5 * Math.cos(Math.PI * u); L[i] *= g; R[i] *= g; }
  return buf;
}

/** fade to digital silence: raised-cosine from t0 to t1, zeros after t1 */
function fadeToSilence(buf, sr, t0, t1) {
  const { L, R } = buf; const a = Math.round(t0 * sr), b = Math.round(t1 * sr);
  for (let i = a; i < L.length; i++) {
    const g = i >= b ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (i - a) / (b - a));
    L[i] *= g; R[i] *= g;
  }
  return buf;
}

/** sidechain-style duck: returns fn(t)->gain. -depth dB with 8 ms attack, held, recovered by `len` s */
function duckFn(times, depthDb = -6, len = 0.15, atk = 0.008) {
  const floor = db(depthDb);
  return function (t) {
    let g = 1;
    for (const c of times) {
      const d = t - c; if (d < 0 || d > len) continue;
      let w;
      if (d < atk) w = 0.5 - 0.5 * Math.cos(Math.PI * d / atk);           // into the dip
      else { const u = (d - atk) / (len - atk); w = u < 0.3 ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * (u - 0.3) / 0.7); } // hold then recover
      g = Math.min(g, 1 - (1 - floor) * w);
    }
    return g;
  };
}

/**
 * Filtered noise sweep (riser / air). type lowpass|highpass|bandpass, fc from->to exponential over dur,
 * envFn(u) amplitude 0..1, normalised so the clip's peak = `peak`. taper (s) at the very end.
 */
function sweepNoise({ dur, type = 'lowpass', from = 200, to = 8000, q = 0.707, stages = 2, envFn = (u) => u * u, peak = 0.1, seed = 7, stereo: st = 0.45, taper = 0.012, sr = 48000 }) {
  const n = Math.round(dur * sr);
  const rnd = E.mulberry32(seed);
  const L = new Float32Array(n), R = new Float32Array(n);
  const fl = [], fr = [];
  for (let s = 0; s < stages; s++) { fl.push(new E.Biquad(sr)); fr.push(new E.Biquad(sr)); }
  const tp = Math.round(taper * sr);
  for (let i = 0; i < n; i++) {
    const u = i / n;
    if (i % 16 === 0) { const f = from * Math.pow(to / from, u); for (let s = 0; s < stages; s++) { fl[s].set(type, f, q); fr[s].set(type, f * 1.02, q); } }
    const a = rnd() * 2 - 1, b = rnd() * 2 - 1;
    let l = a, r = a * (1 - st) + b * st;
    for (let s = 0; s < stages; s++) { l = fl[s].process(l); r = fr[s].process(r); }
    let e = envFn(u);
    if (i > n - tp) e *= 0.5 - 0.5 * Math.cos(Math.PI * (n - i) / tp);
    L[i] = l * e; R[i] = r * e;
  }
  return normPeak({ L, R }, peak);
}

function peakOf(buf) { let m = 0; const L = buf.L || buf.mono, R = buf.R || buf.mono; for (let i = 0; i < L.length; i++) { const v = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (v > m) m = v; } return m; }
function rmsOf(buf, i0 = 0, i1 = null) { const L = buf.L, R = buf.R; i1 = i1 == null ? L.length : i1; let s = 0, c = 0; for (let i = i0; i < i1; i++) { s += L[i] * L[i] + R[i] * R[i]; c += 2; } return Math.sqrt(s / Math.max(1, c)); }
function normPeak(buf, peak) { const p = peakOf(buf); return p > 0 ? scale(buf, peak / p) : buf; }
function normRms(buf, rms, i0, i1) { const r = rmsOf(buf, i0, i1); return r > 0 ? scale(buf, rms / r) : buf; }

function reverse(buf) { return { L: Float32Array.from(buf.L).reverse(), R: Float32Array.from(buf.R).reverse() }; }

/** Hat: seeded white noise -> HP (2 stages) -> exp(-rate*t). mono, peak-normalised to 1 */
function hat({ seed, hp = 8000, rate = 60, dur = 0.09, sr = 48000 }) {
  const n = Math.round(dur * sr), rnd = E.mulberry32(seed), x = new Float32Array(n);
  const b1 = new E.Biquad(sr), b2 = new E.Biquad(sr); b1.set('highpass', hp, 0.707); b2.set('highpass', hp, 0.707);
  const atk = Math.round(0.0006 * sr), fo = Math.round(0.01 * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let e = Math.exp(-rate * t) * (i < atk ? i / atk : 1);
    if (i > n - fo) e *= (n - i) / fo;
    x[i] = b2.process(b1.process(rnd() * 2 - 1)) * e;
  }
  let p = 0; for (const v of x) p = Math.max(p, Math.abs(v));
  for (let i = 0; i < n; i++) x[i] /= p;
  return x;
}

/** Paper tick: seeded noise burst through HP+LP band (2 stages each), sharp attack, short exp decay. mono, peak 1 */
function tick({ seed, dur = 0.03, hp = 2000, lp = 4000, tau = 0.007, sr = 48000 }) {
  const n = Math.round(dur * sr), rnd = E.mulberry32(seed), x = new Float32Array(n);
  const f = ['highpass', 'highpass', 'lowpass', 'lowpass'].map((ty, k) => { const b = new E.Biquad(sr); b.set(ty, k < 2 ? hp : lp, 0.707); return b; });
  const atk = Math.round(0.0004 * sr), fo = Math.round(0.004 * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let e = (i < atk ? i / atk : 1) * (0.75 * Math.exp(-t / tau) + 0.25 * Math.exp(-t / (tau * 3)));
    if (i > n - fo) e *= (n - i) / fo;
    let v = rnd() * 2 - 1; for (const b of f) v = b.process(v);
    x[i] = v * e;
  }
  let p = 0; for (const v of x) p = Math.max(p, Math.abs(v));
  for (let i = 0; i < n; i++) x[i] /= p;
  return x;
}

/** place a mono clip with constant-power pan and an optional Haas delay on the far channel */
function placeMono(dst, x, t, sr, gain, pan = 0, haas = 0, haasGainDb = -2) {
  const gl = Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, gr = Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  const start = Math.round(t * sr), hd = Math.round(Math.abs(haas) * sr), hg = db(haasGainDb);
  const n = dst.L.length;
  for (let i = 0; i < x.length; i++) {
    const j = start + i; if (j < 0) continue; if (j >= n) break;
    const v = x[i] * gain;
    if (haas > 0) { dst.L[j] += v * gl; if (j + hd < n) dst.R[j + hd] += v * gr * hg; }       // L leads
    else if (haas < 0) { dst.R[j] += v * gr; if (j + hd < n) dst.L[j + hd] += v * gl * hg; } // R leads
    else { dst.L[j] += v * gl; dst.R[j] += v * gr; }
  }
}

/** split a buffer into weighted segments with linear crossfades at the boundaries (sum == original) */
function splitSegments(buf, sr, bounds, xf = 0.03) {
  // bounds: [b1, b2, ...] -> segments [0,b1), [b1,b2), ..., [bk, end)
  const n = buf.L.length, edges = [0, ...bounds.map((b) => b * sr), n];
  const segs = [];
  for (let s = 0; s < edges.length - 1; s++) {
    const out = stereo(n);
    const a = edges[s], b = edges[s + 1], h = xf * sr / 2;
    for (let i = 0; i < n; i++) {
      let w;
      const wIn = s === 0 ? 1 : Math.min(1, Math.max(0, (i - (a - h)) / (2 * h)));
      const wOut = s === edges.length - 2 ? 1 : Math.min(1, Math.max(0, ((b + h) - i) / (2 * h)));
      w = Math.min(wIn, wOut);
      if (w > 0) { out.L[i] = buf.L[i] * w; out.R[i] = buf.R[i] * w; }
    }
    segs.push(out);
  }
  return segs;
}

/**
 * Soft-knee lookahead limiter (no hard clipping, no tanh). Output envelope follows
 * f(e) = knee + (ceil-knee)*tanh((e-knee)/(ceil-knee)) above the knee, which is strictly increasing,
 * so distinct input peaks stay distinct (keeps astats Peak count low). Gain is min-filtered over the
 * lookahead and box-smoothed, so it is <= the target at every sample.
 */
function limiter(buf, sr, { knee = 0.7, ceil = 0.84, lookahead = 0.004, release = 0.12 } = {}) {
  const { L, R } = buf, n = L.length, la = Math.max(1, Math.round(lookahead * sr));
  const gt = new Float32Array(n);
  let reduced = 0;
  for (let i = 0; i < n; i++) {
    const e = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (e > knee) { const f = knee + (ceil - knee) * Math.tanh((e - knee) / (ceil - knee)); gt[i] = f / e; reduced++; } else gt[i] = 1;
  }
  // sliding min over [i, i+la] (monotonic deque)
  const gmin = new Float32Array(n), dq = new Int32Array(n + la + 1); let h = 0, tl = 0;
  for (let j = 0; j < n + la; j++) {
    if (j < n) { while (tl > h && gt[dq[tl - 1]] >= gt[j]) tl--; dq[tl++] = j; }
    const i = j - la; if (i < 0) continue;
    while (dq[h] < i) h++;
    gmin[i] = gt[dq[h]];
  }
  // box smoothing over [i-la+1, i]
  const gs = new Float32Array(n); let acc = 0;
  for (let i = 0; i < n; i++) { acc += gmin[i]; if (i - la >= 0) acc -= gmin[i - la]; gs[i] = i < la ? Math.min(gmin[i], acc / (i + 1)) : acc / la; }
  const rel = Math.exp(-1 / (release * sr));
  let g = 1, minG = 1, minAt = 0;
  for (let i = 0; i < n; i++) {
    g = gs[i] <= g ? gs[i] : g + (gs[i] - g) * (1 - rel);
    if (g < minG) { minG = g; minAt = i / sr; }
    L[i] *= g; R[i] *= g;
  }
  return { buf, maxReductionDb: toDb(minG), maxAt: minAt, samplesOverKnee: reduced };
}

// ---------- BS.1770-4 / EBU R128 meter (48 kHz K-weighting coefficients) ----------
function kWeighted(x) {
  const y = new Float64Array(x.length);
  // stage 1: high shelf
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const b0 = 1.53512485958697, b1 = -2.69169618940638, b2 = 1.19839281085285, a1 = -1.69065929318241, a2 = 0.73248077421585;
  // stage 2: RLB high-pass
  let p1 = 0, p2 = 0, q1 = 0, q2 = 0;
  const c1 = -1.99004745483398, c2 = 0.99007225036621;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    const s = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = s;
    const o = s - 2 * p1 + p2 - c1 * q1 - c2 * q2; p2 = p1; p1 = s; q2 = q1; q1 = o;
    y[i] = o;
  }
  return y;
}
/** returns {I, LRA, st: [{t, l}], mom} — integrated loudness (LUFS), loudness range (LU), short-term series */
function loudness(buf, sr = 48000) {
  const kl = kWeighted(buf.L), kr = kWeighted(buf.R), n = kl.length;
  const hop = Math.round(0.1 * sr);
  // prefix sums of energy
  const cs = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) cs[i + 1] = cs[i] + kl[i] * kl[i] + kr[i] * kr[i];
  const block = (i0, len) => (cs[i0 + len] - cs[i0]) / len;
  const lk = (z) => -0.691 + 10 * Math.log10(z);
  // integrated (400 ms, 75 % overlap)
  const B = Math.round(0.4 * sr), zs = [];
  for (let i = 0; i + B <= n; i += hop) zs.push(block(i, B));
  const abs = zs.filter((z) => lk(z) > -70);
  const rel = lk(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const g = abs.filter((z) => lk(z) > rel);
  const I = lk(g.reduce((a, b) => a + b, 0) / g.length);
  // short-term (3 s) + LRA (EBU Tech 3342)
  const S = Math.round(3 * sr), st = [];
  for (let i = 0; i + S <= n; i += hop) st.push({ t: (i + S) / sr, z: block(i, S) });
  const sabs = st.filter((s) => lk(s.z) > -70);
  const srel = lk(sabs.reduce((a, s) => a + s.z, 0) / sabs.length) - 20;
  const sl = sabs.filter((s) => lk(s.z) > srel).map((s) => lk(s.z)).sort((a, b) => a - b);
  const pct = (p) => sl[Math.min(sl.length - 1, Math.max(0, Math.round(p * (sl.length - 1))))];
  const LRA = pct(0.95) - pct(0.10);
  return { I, LRA, st: st.map((s) => ({ t: s.t, l: lk(s.z) })) };
}

/** true-peak estimate: 4x oversampling, 24-tap Hann-windowed sinc per phase (BS.1770 style) */
function truePeak(buf) {
  const os = 4, taps = 12, ph = [];
  for (let p = 0; p < os; p++) {
    const frac = p / os, h = new Float64Array(2 * taps);
    for (let k = -taps + 1, j = 0; k <= taps; k++, j++) {
      const d = k - frac; const s = d === 0 ? 1 : Math.sin(Math.PI * d) / (Math.PI * d);
      h[j] = s * (0.5 + 0.5 * Math.cos(Math.PI * d / taps));
    }
    ph.push(h);
  }
  // value at (i + frac) = sum_k x[i + k] * sinc(k - frac)
  let m = 0;
  for (const x of [buf.L, buf.R]) {
    for (let i = taps; i < x.length - taps; i++) {
      if (Math.abs(x[i]) < 0.2 && Math.abs(x[i + 1]) < 0.2) continue; // only loud regions can set the true peak
      for (let p = 0; p < os; p++) {
        const h = ph[p]; let acc = 0;
        for (let k = -taps + 1, j = 0; k <= taps; k++, j++) acc += x[i + k] * h[j];
        const v = Math.abs(acc); if (v > m) m = v;
      }
    }
  }
  return m;
}

// ---------- WAV reader (PCM 16/24/32-bit int, or 32-bit float) ----------
function readWav(path) {
  const b = fs.readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4), len = b.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(o + 8), ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    else if (id === 'data') data = { off: o + 8, len };
    o += 8 + len + (len & 1);
  }
  const bytes = fmt.bits / 8, frames = Math.floor(data.len / (bytes * fmt.ch));
  const ch = []; for (let c = 0; c < fmt.ch; c++) ch.push(new Float32Array(frames));
  const raw = []; for (let c = 0; c < fmt.ch; c++) raw.push(new Int32Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < fmt.ch; c++) {
      const p = data.off + (i * fmt.ch + c) * bytes;
      let v, r;
      if (fmt.format === 3) { v = b.readFloatLE(p); r = v === 0 ? 0 : 1; }
      else if (fmt.bits === 16) { r = b.readInt16LE(p); v = r / 32768; }
      else if (fmt.bits === 24) { r = b.readIntLE(p, 3); v = r / 8388608; }
      else { r = b.readInt32LE(p); v = r / 2147483648; }
      ch[c][i] = v; raw[c][i] = r;
    }
  }
  return { sr: fmt.sr, bits: fmt.bits, channels: fmt.ch, frames, L: ch[0], R: ch[1] || ch[0], rawL: raw[0], rawR: raw[1] || raw[0] };
}

module.exports = { db, toDb, stereo, addInto, autom, applyGain, scale, sweepFilter, filterMono, gate, fadeToSilence, duckFn, sweepNoise, peakOf, rmsOf, normPeak, normRms, reverse, hat, tick, placeMono, splitSegments, limiter, kWeighted, loudness, truePeak, readWav };
