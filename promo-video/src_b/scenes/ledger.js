// Tipmi film, variant b — shot 11: the ledger sets itself (one oxblood rule, three typeset rows; nothing counts).
(function () {
  const TB = (window.TB = window.TB || {});
  const { E } = TB;
  TB.sceneLedger = {
    build(S, tl) {
      const world = document.getElementById('world');
      const host = document.createElement('div'); host.id = 'ledger'; host.className = 'layer';
      const rule = document.createElement('div');
      rule.style.cssText = 'position:absolute;left:173px;top:440px;width:587px;height:1px;background:var(--accent);transform-origin:0 0';
      host.appendChild(rule);
      const P = { rule: 0 };
      TB.tw(tl, P, 'rule', 0, 1, CUES.lines.L8[0] + 0.12, 0.5, E.expoOut);
      TB.tw(tl, P, 'out', 0, 1, CUES.shots.human[0], 0.4, E.sineInOut);
      const rows = [];
      T.ui.ledger.forEach((txt, k) => {
        if (!txt) return;
        const y = 466 + 56 * k;
        const mask = document.createElement('div');
        mask.style.cssText = `position:absolute;left:173px;top:${y - 2}px;overflow:hidden;padding:2px 0 6px`;
        const words = txt.split(/(?<= )/).map((w) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.style.cssText = 'display:inline-block;white-space:pre;position:relative'; return s; });
        const cap = document.createElement('div'); cap.className = 'cap'; cap.style.position = 'relative';
        words.forEach((w) => cap.appendChild(w));
        mask.appendChild(cap); host.appendChild(mask);
        let sep = null;
        if (k > 0) {
          sep = document.createElement('div');
          sep.style.cssText = `position:absolute;left:173px;top:${y - 15}px;width:587px;height:1px;background:var(--rule);transform-origin:0 0`;
          host.appendChild(sep);
        }
        const r = { mask, words: words.map((el) => ({ el, p: {} })), sep, p: {} };
        const tc = CUES.ledgerRows[k];
        r.words.forEach((w, i) => TB.tw(tl, w.p, 'v', 0, 1, tc + 0.11 * Math.min(i, 3) * 0.5, 0.6, E.expoOut));
        if (sep) TB.tw(tl, r.p, 'sep', 0, 1, tc - 0.05, 0.5, E.expoOut);
        rows.push(r);
      });
      world.appendChild(host);
      S.ledger = { host, rule, rows, P };
    },
    update(t, S) {
      const Lg = S.ledger, P = Lg.P;
      const on = t >= CUES.shots.ledger[0] && t < CUES.shots.human[0] + 0.4;
      Lg.host.style.display = on ? 'block' : 'none';
      if (!on) return;
      Lg.host.style.opacity = (1 - (P.out || 0)).toFixed(4);
      Lg.rule.style.transform = `scaleX(${(P.rule || 0).toFixed(4)})`;
      for (const r of Lg.rows) {
        for (const w of r.words) w.el.style.top = `${((1 - (w.p.v || 0)) * 33).toFixed(3)}px`;
        if (r.sep) r.sep.style.transform = `scaleX(${(r.p.sep || 0).toFixed(4)})`;
      }
    },
  };
})();
