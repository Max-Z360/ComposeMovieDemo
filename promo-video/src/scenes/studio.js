// Tipmi film, variant b — shots 9–10: the studio instrument panel, the 7-detent Warmth ratchet, the long-press
// Publish (the oxblood stroke draws around the button — the same gesture as the chosen frame), the lift.
(function () {
  const TB = (window.TB = window.TB || {});
  const { E, prog } = TB;
  // detent frames from the brief's acceptance check #14 (26.429 + k·0.060 s, ±0 frames)
  const DETENT_F = [793, 795, 797, 798, 800, 802, 804];
  // pure: number of detents passed at time t (also the hero's warmth grade index)
  TB.detents = function (t) {
    const f = t * 30;
    let k = 0, last = -1;
    for (let i = 0; i < DETENT_F.length; i++) if (f >= DETENT_F[i] - 1e-6) { k = i + 1; last = DETENT_F[i]; }
    return { k, last };
  };

  // Dial: 24 hairline ticks 10 px long, drawn on the half-pixel so the axis-aligned ones are a true 1 px line (they
  // were straddling two pixel rows at 50 %: fuzz after x264); oxblood active tick 2 x 12 px; 1.5 px needle, 4 px hub.
  function drawDial(c, ang, k) {
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, 180, 180); ctx.translate(90.5, 90.5);
    ctx.lineCap = 'butt';
    const ai = (((Math.round((-90 + 15 * k) / 15) % 24) + 24) % 24);
    ctx.strokeStyle = '#C9C4BA'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      if (i === ai) continue;
      const a = (i * 15 * Math.PI) / 180;
      ctx.moveTo(Math.cos(a) * 69, Math.sin(a) * 69); ctx.lineTo(Math.cos(a) * 79, Math.sin(a) * 79);
    }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2); ctx.stroke();
    const aa = (ai * 15 * Math.PI) / 180;
    // the 2 px tick is centred on the pixel grid (undo the half-pixel offset along its normal for axis-aligned ticks)
    ctx.save(); ctx.translate(-0.5 * Math.abs(Math.sin(aa)) * (Math.abs(Math.cos(aa)) < 1e-6 ? 1 : 0), -0.5 * (Math.abs(Math.sin(aa)) < 1e-6 ? 1 : 0));
    ctx.beginPath(); ctx.moveTo(Math.cos(aa) * 67, Math.sin(aa) * 67); ctx.lineTo(Math.cos(aa) * 79, Math.sin(aa) * 79);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    const a = (ang * Math.PI) / 180;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 50, Math.sin(a) * 50);
    ctx.strokeStyle = '#141311'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fillStyle = '#141311'; ctx.fill();
    c.lastKey = ang.toFixed(3) + '|' + k;
  }

  TB.sceneStudio = {
    build(S, tl) {
      const world = document.getElementById('world');
      const host = document.createElement('div'); host.id = 'studio'; host.className = 'layer';
      const svgNS = 'http://www.w3.org/2000/svg';
      const blk = (x, y) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:0;top:0'; host.appendChild(d); return d; };
      // label
      const bLabel = blk(173, 400);
      bLabel.innerHTML = `<div class="cap muted" style="left:173px;top:388px"></div>`;
      bLabel.firstChild.textContent = T.ui.studio;
      // dial
      const bDial = blk(253, 520);
      // the dial is a bitmap redrawn from the needle angle (SVG line AA under partial raster is history-dependent)
      const dial = TB.makeCanvas(180, 180);
      dial.style.cssText = 'position:absolute;left:163px;top:430px;width:180px;height:180px';
      dial.lastKey = null;
      bDial.appendChild(dial);
      const wl = document.createElement('div'); wl.className = 'caps'; wl.style.cssText = 'position:absolute;left:365px;top:478px'; wl.textContent = T.ui.warmth;
      const ro = document.createElement('div'); ro.className = 'cap tnum'; ro.style.cssText = 'position:absolute;left:365px;top:514px;color:var(--ink)'; ro.textContent = '+0';
      bDial.appendChild(wl); bDial.appendChild(ro);
      // sliders
      const bSl = blk(380, 700);
      [[T.ui.exposure, 640, 0.56], [T.ui.grain, 700, 0.32], [T.ui.crop, 760, 0.78]].forEach(([lab, y, v]) => {
        const l = document.createElement('div'); l.className = 'caps'; l.style.cssText = `position:absolute;left:173px;top:${y - 13}px`; l.textContent = lab;
        const tr = document.createElement('div'); tr.style.cssText = `position:absolute;left:365px;top:${y}px;width:420px;height:1px;background:var(--rule)`;
        const th = document.createElement('div'); th.style.cssText = `position:absolute;left:${365 + 420 * v - 5}px;top:${y - 4.5}px;width:10px;height:10px;border-radius:50%;background:var(--ink-soft)`;
        bSl.appendChild(l); bSl.appendChild(tr); bSl.appendChild(th);
      });
      // publish button + long-press stroke
      const bPub = blk(273, 864);
      const btn = document.createElement('div'); btn.id = 'publish'; btn.style.left = '173px'; btn.style.top = '840px';
      btn.innerHTML = '<span class="caps"></span>'; btn.firstChild.textContent = T.ui.publish;
      btn.firstChild.style.color = 'var(--ink-soft)';
      const rs = document.createElementNS(svgNS, 'svg');
      rs.setAttribute('width', 1920); rs.setAttribute('height', 1080); rs.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
      const ring = document.createElementNS(svgNS, 'rect');
      Object.entries({ x: 171, y: 838, width: 204, height: 52, fill: 'none', stroke: ACCENT, 'stroke-width': 2.5 }).forEach(([k, v]) => ring.setAttribute(k, v));
      rs.appendChild(ring);
      bPub.appendChild(btn); bPub.appendChild(rs);
      world.appendChild(host);
      const P = {};
      const t0 = CUES.shots.studio[0];
      [bLabel, bDial, bSl, bPub].forEach((b, i) => {
        b.p = {};
        TB.tw(tl, b.p, 'in', 0, 1, t0 + 0.08 * (i === 3 ? 3 : i + 1), 0.6, E.expoOut);
        TB.tw(tl, b.p, 'out', 0, 1, CUES.risers.lift[0] + 0.06 * i, 0.35, E.expoIn);
      });
      const press = CUES.ticks[3];
      TB.tw(tl, P, 'pressDn', 0, 1, press, 0.06, E.quintOut);
      TB.tw(tl, P, 'pressUp', 0, 1, CUES.risers.publish[1], 0.12, E.quintOut);
      TB.tw(tl, P, 'ring', 0, 1, press, CUES.risers.publish[1] - press, E.softLinear);
      TB.tw(tl, P, 'ringOut', 0, 1, CUES.risers.lift[0], 0.3, E.sineInOut);
      S.studio = { host, blocks: [bLabel, bDial, bSl, bPub], dial, ro, btn, ring, per: 2 * (204 + 52), P };
    },
    update(t, S) {
      const St = S.studio, P = St.P;
      const on = t >= CUES.shots.studio[0] && t < CUES.risers.lift[0] + 0.7;
      St.host.style.display = on ? 'block' : 'none';
      // warmth detents (also drive the hero grade even when the panel is gone)
      const { k, last } = TB.detents(t);
      if (!on) return;
      St.blocks.forEach((b) => {
        const i = b.p.in || 0, o = b.p.out || 0;
        b.style.opacity = (Math.min(1, i * 1.25) * (1 - o)).toFixed(4);
        b.style.top = `${(24 * (1 - i) + 70 * o).toFixed(3)}px`;   // layout offset: no stale transformed raster
      });
      // needle: 15° per detent, expo-out over 60 ms, the step lands on its detent frame
      const e = k > 0 ? TB.E.expoOut(Math.min(1, (t - last / 30 + 1 / 30) / 0.06)) : 0;
      const ang = -90 + 15 * (Math.max(0, k - 1) + (k > 0 ? e : 0));
      const key = ang.toFixed(3) + '|' + k;
      if (key !== St.dial.lastKey) drawDial(St.dial, ang, k);
      St.ro.textContent = '+' + k;
      // publish press + long-press stroke
      const pr = (P.pressDn || 0) * (1 - (P.pressUp || 0));
      St.btn.style.transform = `scale(${(1 - 0.02 * pr).toFixed(4)})`;
      const rv = P.ring || 0, ro = 1 - (P.ringOut || 0);
      St.ring.style.display = rv > 0 && ro > 0 ? 'block' : 'none';
      St.ring.setAttribute('stroke-dasharray', `${St.per} ${St.per}`);
      St.ring.setAttribute('stroke-dashoffset', (St.per * (1 - rv)).toFixed(2));
      St.ring.style.opacity = ro.toFixed(4);
    },
  };
})();
