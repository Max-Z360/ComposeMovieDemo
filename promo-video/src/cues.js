// Single source of truth for timing. Loaded by src/index.html (<script src="cues.js">) and by audio/track.js (require).
// Grid: 84 BPM, beat 0.7143 s, bar 2.8571 s. Picture 0–42.000 s, hard cut to black at 42.000, black until 42.5.
const CUES = {
  bpm: 84, fps: 30, duration: 42.5, pictureEnd: 42.0,
  bars: [0, 2.857, 5.714, 8.571, 11.429, 14.286, 17.143, 20.0, 22.857, 25.714, 28.571, 31.429, 34.286, 37.143, 40.0],
  mute: [7.857, 8.571], chime: 9.286,
  hits: { reveal: 11.429, wall: 17.143, column: 20.0, device: 22.857, studio: 25.714, publish: 28.571, ledger: 31.429, human: 34.286, logo: 38.571 },
  ticks: [13.357, 18.3, 24.286, 28.929], ratchet: { start: 26.429, n: 7, step: 0.06 },
  risers: { publish: [28.929, 30.143], lift: [30.143, 30.714], logo: [37.143, 38.571] },
  ducks: [22.857, 30.143, 31.929, 32.643, 33.357],
  ledgerRows: [31.929, 32.643, 33.357],
  lines: { L1: [0.5, 2.6], L2: [3.071, 5.4], L3: [9.286, 10.714], L4: [13.571, 16.6], L5: [17.714, 19.9], L6: [20.357, 22.6], L7: [26.0, 28.3], L8: [31.643, 34.0], L9: [34.571, 36.95], W: [38.0, 42.0], L10: [39.286, 42.0], L11: [39.857, 42.0] },
  shots: { hookA: [0, 2.857], hookB: [2.857, 5.714], tension: [5.714, 8.571], turn: [8.571, 11.429], reveal: [11.429, 17.143], wall: [17.143, 20.0], column: [20.0, 22.857], device: [22.857, 25.714], studio: [25.714, 28.571], publish: [28.571, 31.429], ledger: [31.429, 34.286], human: [34.286, 37.143], logo: [37.143, 42.0] },
  silentBy: 42.3,
};
if (typeof module !== "undefined") module.exports = CUES;
