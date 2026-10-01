// Tipmi film, variant b — display lines L1–L9 (masked rise / blur-in) on the master GSAP timeline.
// GSAP tweens plain proxy objects (absolute fromTo, immediateRender:false); update(t) maps proxies to styles.
(function () {
  const TB = (window.TB = window.TB || {});
  const { E } = TB;

  // generic proxy tween on the master timeline
  TB.tw = function (tl, obj, prop, from, to, t0, dur, ease) {
    if (!(prop in obj)) obj[prop] = from;
    tl.fromTo(obj, { [prop]: from }, { [prop]: to, duration: dur, ease: ease || E.linear, immediateRender: false }, t0);
  };

  const DEFS = [
    // id, cue, colour, mode, exit duration
    ['L1', 'L1', 'bone', 'rise', 0.36],
    ['L2', 'L2', 'bone', 'rise', 0.36],
    ['L3', 'L3', '', 'rise', 0.36],
    ['L4', 'L4', '', 'blur', 0.36],
    ['L5', 'L5', '', 'rise', 0.36],
    ['L6', 'L6', '', 'rise', 0.36],
    ['L7', 'L7', '', 'rise', 0.36],
    ['L8', 'L8', '', 'rise', 0.36],
    ['L9', 'L9', 'italic', 'rise', 0.45],
  ];

  TB.sceneType = {
    build(S, tl) {
      const host = document.getElementById('type');
      S.lines = DEFS.map(([id, cue, cls, mode, exitDur]) => {
        const [tIn, tOut] = CUES.lines[cue];
        const el = document.createElement('div');
        el.className = 'line ' + cls;
        el.id = id;
        const words = [];
        T[id].forEach((txt) => {
          const mask = document.createElement('span');
          mask.className = 'mask';
          // split into words (keep trailing spaces inside the word span); CJK lines rise as one unit
          const parts = LANG === 'zh' ? [txt] : txt.split(/(?<= )/);
          parts.forEach((p) => {
            const w = document.createElement('span');
            w.className = 'w'; w.textContent = p;
            if (mode === 'blur') w.style.transform = 'none';
            mask.appendChild(w); words.push({ el: w });
          });
          el.appendChild(mask);
        });
        host.appendChild(el);
        const L = { el, words, tIn, tOut, mode, exitDur, p: { out: 0 } };
        if (mode === 'rise') {
          words.forEach((w, i) => { w.p = { v: 0 }; TB.tw(tl, w.p, 'v', 0, 1, tIn + i * 0.055, 0.6, E.expoOut); });
        } else {
          L.p.inn = 0;
          TB.tw(tl, L.p, 'inn', 0, 1, tIn, 0.55, E.quintOut);
        }
        TB.tw(tl, L.p, 'out', 0, 1, tOut - exitDur, exitDur, E.expoIn);
        return L;
      });
    },
    update(t, S) {
      for (const L of S.lines) {
        const on = t >= L.tIn - 1e-6 && t < L.tOut;
        L.el.style.display = on ? 'block' : 'none';
        if (!on) continue;
        const o = L.p.out;
        if (L.mode === 'rise') {
          for (const w of L.words) w.el.style.transform = `translateY(${((1 - w.p.v) * 1.3).toFixed(4)}em)`;
          L.el.style.opacity = (1 - o).toFixed(4);
          L.el.style.transform = `translateY(${(-6 * o).toFixed(2)}px)`;
          L.el.style.filter = '';
        } else {
          const v = L.p.inn;
          const blur = 10 * (1 - v);
          L.el.style.opacity = (v * (1 - o)).toFixed(4);
          L.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
          L.el.style.transformOrigin = '0 50%';
          L.el.style.transform = `translateY(${(-6 * o).toFixed(2)}px) scale(${(1.03 - 0.03 * v).toFixed(4)})`;
        }
      }
    },
  };
})();
