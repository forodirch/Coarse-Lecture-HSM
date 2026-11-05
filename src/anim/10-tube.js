// ============================================================
//  Вступление: граф Γ1 («трубка»): вершины — целые числа, n ~ n±1, n±(w−1), n±w, n±(w+1)
//  и королевский граф Γ2.  Вершина n графа Γ1 рисуется в точке
//  (X, Y) = (n / w, n mod w): рёбра n→n+1, n+w−1, n+w, n+w+1 — это
//  ходы короля (0,1), (1,−1), (1,0), (1,1) в слегка скошенной решётке.
// ============================================================
const TUBE_W = 9;                       // «ширина» трубки = длина окружности
const TUBE_SH = 1 / TUBE_W;             // скос решётки
const TUBE_R = TUBE_W / (2 * Math.PI);  // радиус трубки
const KING_STEPS = [[0, 1], [1, -1], [1, 0], [1, 1]];

// Точка развёртки (X,u) → пространство при степени сворачивания b ∈ [0,1].
// u — координата поперёк полосы, отсчитанная от её середины.
function bend3(X, u, b) {
  const k = (b * 2 * Math.PI) / TUBE_W;
  if (k < 1e-5) return [X, u, 0];
  return [X, Math.sin(k * u) / k, (1 - Math.cos(k * u)) / k - TUBE_R * b];
}
// Камера: наклон alpha вокруг оси X, поворот beta вокруг вертикали; ортогональная проекция.
function camera(p, alpha, beta) {
  const [X, y, z] = p;
  const y1 = y * Math.cos(alpha) - z * Math.sin(alpha);
  const d1 = y * Math.sin(alpha) + z * Math.cos(alpha);   // глубина: больше — ближе к зрителю
  const X2 = X * Math.cos(beta) + d1 * Math.sin(beta);
  return [X2, y1, d1];
}

// Рёбра и вершины Γ1 для n из [n0, n1] в развёртке
function tubeModel(n0, n1) {
  const w = TUBE_W, c = (w - 1) / 2;
  const verts = [], edges = [];
  for (let n = n0; n <= n1; n++) {
    const x = Math.floor(n / w), y = n - w * x;
    verts.push({ n, X: x + y / w, u: y - c });
    for (const [dx, dy] of KING_STEPS) {
      if (n + dx * w + dy > n1) continue;
      const wrap = y + dy < 0 || y + dy > w - 1;   // ребро пересекает линию склейки
      edges.push({ X1: x + y / w, u1: y - c, X2: x + dx + (y + dy) / w, u2: y + dy - c, wrap });
    }
  }
  return { verts, edges };
}

// Рисует трубку (или полосу) в окне r. o: {s, b, alpha, beta, cx, helix, n0, n1, glue}
function drawTube(ctx, r, o) {
  const { s, b } = o;
  const al = o.alpha ?? 0, be = o.beta ?? 0;
  const ox = r.x + r.w / 2, oy = r.y + r.h / 2;
  const P = (X, u) => {
    const q = camera(bend3(X - (o.cx || 0), u, b), al, be);
    return [ox + q[0] * s, oy - q[1] * s, q[2]];
  };
  const halfX = r.w / 2 / s + 3;
  const n0 = o.n0 ?? Math.floor(((o.cx || 0) - halfX) * TUBE_W), n1 = o.n1 ?? Math.ceil(((o.cx || 0) + halfX) * TUBE_W);
  const M = tubeModel(n0, n1);
  const shade = (d) => {                       // прозрачность задней стороны
    if (b < 0.02) return 1;
    const dn = U.clamp((d / TUBE_R + 1) / 2, 0, 1);
    return 1 - 0.86 * b * (1 - dn);
  };
  const lw = o.lw ?? U.clamp(0.05 * s, 0.4, 2.4);
  // рёбра по корзинам прозрачности (сзади — вперёд)
  const BINS = 6, bins = Array.from({ length: BINS }, () => []);
  // рёбра через линию склейки в плоском состоянии доходят только до края полосы
  const f = 0.5 + 0.5 * U.clamp(b * 1.6, 0, 1);
  for (const e of M.edges) {
    const p = P(e.X1, e.u1);
    const q = e.wrap ? P(e.X1 + (e.X2 - e.X1) * f, e.u1 + (e.u2 - e.u1) * f) : P(e.X2, e.u2);
    const a = shade((p[2] + q[2]) / 2);
    bins[Math.min(BINS - 1, Math.floor(a * BINS * 0.999))].push(p, q);
  }
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = PAL.ink; ctx.lineWidth = lw;
  bins.forEach((arr, i) => {
    if (!arr.length) return;
    ctx.globalAlpha = (i + 0.5) / BINS;
    ctx.beginPath();
    for (let j = 0; j < arr.length; j += 2) { ctx.moveTo(arr[j][0], arr[j][1]); ctx.lineTo(arr[j + 1][0], arr[j + 1][1]); }
    ctx.stroke();
  });
  // вершины
  const dotA = U.clamp((s - 6) / 6, 0, 1);
  if (dotA > 0) {
    const rad = Math.max(1.4, 0.1 * s);
    const vs = M.verts.map((v) => ({ v, p: P(v.X, v.u) })).sort((a, c) => a.p[2] - c.p[2]);
    ctx.fillStyle = PAL.ink;
    for (const { p } of vs) {
      ctx.globalAlpha = dotA * shade(p[2]);
      ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 2 * Math.PI); ctx.fill();
    }
  }
  // винтовая линия: от 0 в обе стороны, …, −1, 0, 1, 2, …
  if (o.helix > 0) {
    const L = o.helix * o.helixLen, c = (TUBE_W - 1) / 2;
    const Q = (n) => { const x = Math.floor(n / TUBE_W), y = n - TUBE_W * x; return P(x + y / TUBE_W, y - c); };
    // ребро n → n+1 в развёртке (у верхнего края уходит на следующий виток)
    const Q1 = (n) => { const x = Math.floor(n / TUBE_W), y = n - TUBE_W * x; return P(x + (y + 1) / TUBE_W, y + 1 - c); };
    ctx.strokeStyle = PAL.B; ctx.lineWidth = Math.max(2.5, 0.09 * s);
    const segs = [];
    for (let k = 0; k < Math.ceil(L); k++) segs.push([k, Math.min(1, L - k)], [-k - 1, Math.min(1, L - k)]);
    for (const [n, t] of segs) {
      const p = Q(n), q0 = Q1(n);
      const fwd = n >= 0;      // положительные растут от n к n+1, отрицательные — от n+1 к n
      const a = fwd ? p : q0, b = fwd ? q0 : p;
      ctx.globalAlpha = shade((p[2] + q0[2]) / 2);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); ctx.stroke();
    }
    ctx.font = `700 ${Math.round(0.42 * s)}px "PT Sans"`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const [n, lab] of [[0, "0"], [1, "1"], [-1, "−1"], [TUBE_W, String(TUBE_W)]]) {
      if (Math.abs(n) > L + 0.8) continue;
      const p = Q(n);
      ctx.globalAlpha = shade(p[2]); ctx.fillStyle = PAL.R;
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(3, 0.14 * s), 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(lab, p[0] - 0.32 * s, p[1] - 0.3 * s);
    }
  }
  // края полосы и стрелки склейки (только в плоском состоянии)
  if (o.glue > 0) {
    const ga = o.glue * (1 - U.clamp(b * 3, 0, 1));
    if (ga > 0) {
      ctx.globalAlpha = ga;
      ctx.strokeStyle = PAL.A; ctx.fillStyle = PAL.A; ctx.lineWidth = 3;
      ctx.setLineDash([12, 9]);
      const c = (TUBE_W - 1) / 2;
      for (const uu of [-c - 0.5, c + 0.5]) {
        const p = P(-halfX, uu), q = P(halfX, uu);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const uu of [-c - 0.5, c + 0.5]) for (let k = -3; k <= 3; k++) {
        const p = P((o.cx || 0) + k * 2.6 + 0.6, uu);
        arrowHead(ctx, p[0], p[1], 0, 16);
      }
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------
//  Слайд «Два графа вблизи»: два окна, отдаление.
// ------------------------------------------------------------
Deck.figure("twoWindows", (el, { canvasFor }) => {
  let C;
  const self = {
    steps: 1, durs: [3800], holds: [2200, 2600], back: 1.4,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const gap = 60, top = 8;
      const L = { x: 0, y: top, w: (w - gap) / 2, h: h - top }, R = { x: (w + gap) / 2, y: top, w: (w - gap) / 2, h: h - top };
      const s = U.logl(62, 15, T);
      const cY = (TUBE_W - 1) / 2, cX = TUBE_SH * cY;
      const base = { s, cX, cY, sh: TUBE_SH, fam: "HVDE" };
      // правое окно: королевский граф
      ctx.save(); clipRect(ctx, R); drawLattice(ctx, R, base); ctx.restore();
      // левое окно: развёртка Γ1 — та же решётка, но вне полосы бледнеет
      const aOut = 1 - 0.86 * T;
      ctx.save(); clipRect(ctx, L);
      drawLattice(ctx, L, { ...base, alpha: aOut });
      const toY = (Y) => L.y + L.h / 2 - (Y - cY) * s;
      ctx.beginPath(); ctx.rect(L.x, toY(TUBE_W - 0.5), L.w, toY(-0.5) - toY(TUBE_W - 0.5)); ctx.clip();
      drawLattice(ctx, L, base);
      ctx.restore();
      // края полосы и стрелки склейки
      if (T > 0) {
        ctx.save(); clipRect(ctx, L);
        ctx.globalAlpha = U.seg(T, 0.35, 1);
        ctx.strokeStyle = PAL.A; ctx.fillStyle = PAL.A; ctx.lineWidth = 3; ctx.setLineDash([12, 9]);
        for (const Y of [-0.5, TUBE_W - 0.5]) { ctx.beginPath(); ctx.moveTo(L.x, toY(Y)); ctx.lineTo(L.x + L.w, toY(Y)); ctx.stroke(); }
        ctx.setLineDash([]);
        for (const Y of [-0.5, TUBE_W - 0.5]) for (let k = 1; k <= 4; k++) arrowHead(ctx, L.x + (k * L.w) / 5 + 9, toY(Y), 0, 18);
        ctx.restore();
      }
      frameRect(ctx, L); frameRect(ctx, R);
    },
  };
  return self;
});

// ------------------------------------------------------------
//  Слайд «Трубка»: полоса сворачивается, затем винтовая линия 0,1,2,…
// ------------------------------------------------------------
Deck.figure("tubeRoll", (el, { canvasFor }) => {
  let C;
  return {
    steps: 2, durs: [4200, 5200], linear: [false, true], holds: [1800, 1000, 2600], back: 1.6,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const b = U.sm(U.seg(T, 0, 1));
      const r = { x: 0, y: 0, w, h };
      ctx.save(); clipRect(ctx, r);
      drawTube(ctx, r, {
        s: U.lerp(Math.min(70, (h - 40) / (TUBE_W + 0.4)), 66, b), b, alpha: -0.5 * b, beta: 0.32 * b, cx: 0,
        n0: -6 * TUBE_W, n1: 6 * TUBE_W, glue: 1,
        helix: U.seg(T, 1, 2), helixLen: 5 * TUBE_W,
      });
      ctx.restore();
    },
  };
});

// ------------------------------------------------------------
//  Слайд «Издалека»: трубка превращается в прямую, королевский граф — в плоскость.
// ------------------------------------------------------------
Deck.figure("tubeFar", (el, { canvasFor }) => {
  let C;
  return {
    steps: 1, durs: [5200], holds: [1800, 2600], back: 1.5,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const gap = 60;
      const L = { x: 0, y: 0, w: (w - gap) / 2, h }, R = { x: (w + gap) / 2, y: 0, w: (w - gap) / 2, h };
      const s = U.logl(40, 2.4, T);
      ctx.save(); clipRect(ctx, L);
      drawTube(ctx, L, { s, b: 1, alpha: -0.55, beta: 0, cx: 0, lw: U.clamp(0.05 * s, 0.5, 2.2) });
      ctx.restore();
      ctx.save(); clipRect(ctx, R);
      drawLattice(ctx, R, { s, cX: 0, cY: 0, sh: TUBE_SH, fam: "HVDE", alpha: U.clamp(0.25 + s / 30, 0.3, 1) });
      ctx.restore();
      frameRect(ctx, L); frameRect(ctx, R);
    },
  };
});

// ------------------------------------------------------------
//  Слайд «Похожие и непохожие графы»: слева полоса и цилиндр (сворачивается),
//  справа королевский граф и гексагональная решётка. Полоса и решётки отдаляются.
// ------------------------------------------------------------
Deck.figure("similarFour", (el, { canvasFor }) => {
  let C; const WS = 7;            // ширина полосы (число рядов)
  return {
    steps: 4, durs: [3400, 3400, 3400, 3400], holds: [1800, 700, 700, 700, 2400], back: 1.8,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const gx = 60, gy = 64, top = 40;
      const pw = (w - gx) / 2, ph = (h - top - gy - 40) / 2;
      const r = [
        { x: 0, y: top, w: pw, h: ph }, { x: 0, y: top + ph + gy, w: pw, h: ph },
        { x: pw + gx, y: top, w: pw, h: ph }, { x: pw + gx, y: top + ph + gy, w: pw, h: ph },
      ];
      const zoom = (k) => U.logl(46, 4, U.seg(T, k, k + 1));     // этапы идут по очереди
      const s = zoom(0), s2 = zoom(2), s3 = zoom(3);
      // полоса: королевские ходы в Z × {0,…,WS−1}
      ctx.save(); clipRect(ctx, r[0]);
      drawLattice(ctx, r[0], { s, cX: 0, cY: (WS - 1) / 2, fam: "HVDE", yMin: 0, yMax: WS - 1 });
      ctx.restore();
      // цилиндр: та же полоса (со сдвигом на шаг), край склеивается
      ctx.save(); clipRect(ctx, r[1]);
      const b = U.sm(U.seg(T, 1, 2));
      drawTube(ctx, r[1], { s: U.lerp(ph / (TUBE_W + 1.2), (ph * 0.62) / (2 * TUBE_R), b), b, alpha: -0.5 * b, beta: 0.3 * b, cx: 0,
        n0: -9 * TUBE_W, n1: 9 * TUBE_W, glue: 1 });
      ctx.restore();
      // королевский граф и гексагональная решётка
      ctx.save(); clipRect(ctx, r[2]); drawLattice(ctx, r[2], { s: s2, cX: 0.5, cY: 0.5, fam: "HVDE", alpha: U.clamp(0.25 + s2 / 25, 0.3, 1) }); ctx.restore();
      ctx.save(); clipRect(ctx, r[3]); drawHex(ctx, r[3], { s: s3, alpha: U.clamp(0.25 + s3 / 25, 0.3, 1) }); ctx.restore();
      r.forEach((q) => frameRect(ctx, q));
      ctx.fillStyle = PAL.ink; ctx.font = '30px "PT Sans"'; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ["полоса", "цилиндр γ₁", "королевский граф γ₂", "гексагональная решётка"].forEach((t, i) => ctx.fillText(t, r[i].x + r[i].w / 2, r[i].y - 8));
    },
  };
});
