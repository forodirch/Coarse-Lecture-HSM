// ============================================================
//  Блок «Концы»: удаление шара, галерея, букет и гребёнка,
//  толстые концы, кирпичная кладка → соты, решётка Халина.
// ============================================================
const COMP = [PAL.A, PAL.B, PAL.R, "rgb(46,139,87)", "rgb(128,70,170)", "rgb(0,128,128)"];

// ---------- удаляем шар радиуса R = 0,1,2,3 в Z, L, Z^2, T3 ----------
Deck.figure("ends", (el, { canvasFor }) => {
  let C, t3, pos3, anc;
  return {
    steps: 4, durs: [900, 900, 900, 900], holds: [1400, 1300, 1300, 1300, 2600], back: 3,
    init() {
      C = canvasFor(el);
      t3 = regularTree(3, 6);
      pos3 = radialLayout(t3.children, 0, (d) => d * 0.62 - 0.06 * d * (d - 1) / 2, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
      // anc[v][k] — предок вершины v на глубине k (для раскраски компонент)
      anc = [];
      for (let v = 0; v < t3.n; v++) { const a = []; let u = v; while (u >= 0) { a[t3.dep[u]] = u; u = t3.parent[u]; } anc.push(a); }
    },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const R = Math.floor(T + 1e-9) - 1, fr = T - Math.floor(T + 1e-9);   // R = −1: ничего не удалено
      const gap = 30, side = Math.min((w - 3 * gap) / 4, h - 48);
      const x0 = (w - 4 * side - 3 * gap) / 2;
      const rects = [0, 1, 2, 3].map((i) => ({ x: x0 + i * (side + gap), y: 0, w: side, h: side }));
      const gone = (d) => d <= R || (d === R + 1 && fr > 0.5);
      const dot = (x, y, r, col, hollow) => {
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        if (hollow) { ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = "#b9bec6"; ctx.lineWidth = 1.2; ctx.stroke(); }
        else { ctx.fillStyle = col; ctx.fill(); }
      };
      const edge = (x1, y1, x2, y2, col, faded) => {
        ctx.strokeStyle = faded ? "#dde1e6" : col; ctx.lineWidth = faded ? 1.2 : 2.2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      };
      const counts = [];
      // --- Z ---
      {
        const r = rects[0], s = side / 14, cy = r.y + side / 2, X = (i) => r.x + side / 2 + i * s;
        ctx.save(); clipRect(ctx, r);
        const col = (i) => (R < 0 ? PAL.ink : i < 0 ? PAL.A : PAL.B);
        for (let i = -8; i < 8; i++) edge(X(i), cy, X(i + 1), cy, col(i + 0.5), gone(Math.abs(i)) || gone(Math.abs(i + 1)));
        for (let i = -8; i <= 8; i++) dot(X(i), cy, s * 0.17, col(i), gone(Math.abs(i)));
        ctx.restore(); counts.push(R < 0 ? 1 : 2);
      }
      // --- L ---
      {
        const r = rects[1], s = side / 14, cy = r.y + side / 2, X = (i) => r.x + side / 2 + i * s, Y = (k) => cy + (k - 0.5) * s;
        ctx.save(); clipRect(ctx, r);
        const d = (i, k) => Math.abs(i) + k;
        const col = (i) => (R < 0 ? PAL.ink : R === 0 ? PAL.A : i < 0 ? PAL.A : PAL.B);
        for (let i = -8; i <= 8; i++) for (const k of [0, 1]) {
          if (i < 8) edge(X(i), Y(k), X(i + 1), Y(k), col(i + 0.5), gone(d(i, k)) || gone(d(i + 1, k)));
          if (k === 0) edge(X(i), Y(0), X(i), Y(1), col(i), gone(d(i, 0)) || gone(d(i, 1)));
        }
        for (let i = -8; i <= 8; i++) for (const k of [0, 1]) dot(X(i), Y(k), s * 0.17, col(i), gone(d(i, k)));
        ctx.restore(); counts.push(R < 0 ? 1 : R === 0 ? 1 : 2);
      }
      // --- Z^2 ---
      {
        const r = rects[2], s = side / 12, X = (i) => r.x + side / 2 + i * s, Y = (j) => r.y + side / 2 - j * s;
        ctx.save(); clipRect(ctx, r);
        const col = R < 0 ? PAL.ink : PAL.A, d = (i, j) => Math.abs(i) + Math.abs(j);
        for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
          edge(X(i), Y(j), X(i + 1), Y(j), col, gone(d(i, j)) || gone(d(i + 1, j)));
          edge(X(i), Y(j), X(i), Y(j + 1), col, gone(d(i, j)) || gone(d(i, j + 1)));
        }
        for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) dot(X(i), Y(j), s * 0.15, col, gone(d(i, j)));
        ctx.restore(); counts.push(1);
      }
      // --- T3 ---
      {
        const r = rects[3], k = side / 2 / 2.6, X = (p) => r.x + side / 2 + p[0] * k, Y = (p) => r.y + side / 2 - p[1] * k;
        ctx.save(); clipRect(ctx, r);
        const first = []; for (let v = t3.n - 1; v >= 0; v--) first[t3.dep[v]] = v;
        const col = (v) => {
          if (R < 0 || t3.dep[v] <= R) return PAL.ink;
          const a = anc[v][R + 1];
          return COMP[(a - first[R + 1]) % COMP.length];
        };
        for (let v = 1; v < t3.n; v++) {
          const p = pos3.get(v), q = pos3.get(t3.parent[v]);
          edge(X(p), Y(p), X(q), Y(q), col(v), gone(t3.dep[t3.parent[v]]));
        }
        for (let v = 0; v < t3.n; v++) { const p = pos3.get(v); dot(X(p), Y(p), t3.dep[v] > 4 ? 2.2 : 3.6, col(v), gone(t3.dep[v])); }
        ctx.restore(); counts.push(R < 0 ? 1 : 3 * 2 ** R);
      }
      rects.forEach((r, i) => {
        frameRect(ctx, r);
        ctx.fillStyle = PAL.ink; ctx.font = 'italic 28px "PT Sans"'; ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(R < 0 ? "ничего не удалено" : `R = ${R}:  c = ${counts[i]}`, r.x + r.w / 2, r.y + r.h + 10);
      });
    },
  };
});

// ---------- галерея: луч, прямая, крест, Z^2, T3 ----------
Deck.figure("endsGallery", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-1.6 -1.7 22 5.0");
    let o = "";
    const ray = (x0, y0, dx, dy, n = 4) => {
      let s = Sv.L(x0, y0, x0 + dx * (n + 0.6), y0 + dy * (n + 0.6), PAL.ink, 0.035, 'stroke-dasharray="0.06 0.06"') + Sv.L(x0, y0, x0 + dx * n, y0 + dy * n, PAL.ink, 0.04);
      for (let i = 0; i <= n; i++) s += Sv.C(x0 + dx * i, y0 + dy * i, 0.06);
      return s;
    };
    const st = 0.32;
    const lab = (x, a, b) => Sv.T(x, 2.15, a, 0.5) + Sv.T(x, 2.85, b, 0.5, PAL.B);
    o += ray(-1.3, 0, st, 0, 7) + lab(0, "луч", "1 конец");
    o += ray(4.4, 0, st, 0, 4) + ray(4.4, 0, -st, 0, 4) + lab(4.4, "прямая", "2 конца");
    o += ray(8.8, 0, st, 0, 4) + ray(8.8, 0, -st, 0, 4) + ray(8.8, 0, 0, st, 4) + ray(8.8, 0, 0, -st, 4) + lab(8.8, "крест", "4 конца");
    for (let i = -4; i <= 4; i++) o += Sv.L(13.2 + i * st, -1.35, 13.2 + i * st, 1.35, PAL.ink, 0.03) + Sv.L(13.2 - 1.35, i * st, 13.2 + 1.35, i * st, PAL.ink, 0.03);
    o += lab(13.2, "ℤ²", "1 конец");
    const t = regularTree(3, 5), pos = radialLayout(t.children, 0, (d) => [0, 0.45, 0.82, 1.1, 1.32, 1.5][d], Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
    for (let v = 1; v < t.n; v++) { const p = pos.get(v), q = pos.get(t.parent[v]); o += Sv.L(18.4 + p[0], -p[1], 18.4 + q[0], -q[1], PAL.ink, 0.025); }
    o += Sv.T(18.4, 2.15, "T₃", 0.5) + Sv.T(18.4, 2.88, "∞", 0.8, PAL.B);
    svg.innerHTML = o;
  },
  draw() {},
}));

// ---------- букет из трёх лучей и гребёнка ----------
Deck.figure("bouquet", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-2.2 -2.3 11.6 4.9");
    let o = "";
    for (const a of [90, 210, 330]) {
      const c = Math.cos((a * Math.PI) / 180), s = -Math.sin((a * Math.PI) / 180);
      o += Sv.L(0, 0, 1.8 * c, 1.8 * s, PAL.ink, 0.04, 'marker-end="url(#ar)"');
      for (let i = 0; i <= 4; i++) o += Sv.C(0.38 * i * c, 0.38 * i * s, 0.06);
    }
    o += Sv.T(0, 2.0, "букет: 3 конца", 0.34);
    for (let i = 0; i < 7; i++) {
      const x = 3.6 + i * 0.75;
      o += Sv.L(x, 1.2, x, -1.9, PAL.ink, 0.04, 'marker-end="url(#ar)"');
      for (let j = 0; j <= 4; j++) o += Sv.C(x, 1.2 - j * 0.6, 0.06);
    }
    o += Sv.L(3.6, 1.2, 9.2, 1.2, PAL.ink, 0.04, 'marker-end="url(#ar)"');
    o += Sv.T(6.0, 2.0, "гребёнка: бесконечно много концов", 0.34);
    svg.innerHTML = `<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${PAL.ink}"/></marker></defs>` + o;
  },
  draw() {},
}));

// ---------- тонкий и толстый конец ----------
Deck.figure("thickRays", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-0.5 -4.6 21 5.8");
    let o = "";
    // лестница: в каждом конце не больше двух непересекающихся лучей
    const y0 = -1.65, y1 = -2.65;            // лестница по центру высоты ℤ²
    for (let i = 0; i <= 8; i++) o += Sv.L(i, y1, i, y0, PAL.ink, 0.04);
    o += Sv.L(0, y0, 8.6, y0, PAL.A, 0.1) + Sv.L(0, y1, 8.6, y1, PAL.B, 0.1);
    for (let i = 0; i <= 8; i++) o += Sv.C(i, y0, 0.09, PAL.A) + Sv.C(i, y1, 0.09, PAL.B);
    o += Sv.T(4.3, 0.75, 'лестница <tspan font-style="italic">L</tspan>: конец тонкий', 0.45);
    // Z^2: сколько угодно непересекающихся горизонтальных лучей
    const ox = 11;
    for (let i = 0; i <= 8; i++) o += Sv.L(ox + i, 0, ox + i, -4.3, "#b9bec6", 0.035);
    for (let j = 0; j <= 4; j++) o += Sv.L(ox, -j, ox + 8.6, -j, COMP[j % COMP.length], 0.1);
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 4; j++) o += Sv.C(ox + i, -j, 0.08, COMP[j % COMP.length]);
    o += Sv.T(ox + 4.3, 0.75, "ℤ²: конец толстый", 0.45);
    svg.innerHTML = o;
  },
  draw() {},
}));

// ---------- кирпичная кладка в Z^2 и её превращение в соты ----------
// Перегородка между вертикалями i и i+1 на высоте y есть, если i + y нечётно.
// Деформация: x = i ± t/6 (знак зависит от чётности i + y), y ↦ y·(1 − t + t·√3/3).
Deck.figure("brick", (el) => {
  let svg;
  const I0 = -6, I1 = 6, Y0 = -4, Y1 = 4;
  const odd = (k) => ((k % 2) + 2) % 2 === 1;
  return {
    steps: 2, durs: [1600, 3800], holds: [1600, 1500, 2800], back: 1.4,
    init() { svg = svgHost(el, "-6.3 -4.6 12.6 9.2"); },
    draw(T) {
      const r = U.seg(T, 0, 1), m = U.seg(T, 1, 2);
      const ky = 1 - m + (m * Math.sqrt(3)) / 3;
      const P = (i, y) => [i + (odd(i + y) ? 1 : -1) * (m / 6), -y * ky];
      let o = "";
      // один «кирпич»-шестиугольник: вершины (0,1),(1,1),(1,2),(1,3),(0,3),(0,2)
      if (r > 0) {
        const hex = [[0, 1], [1, 1], [1, 2], [1, 3], [0, 3], [0, 2]].map(([i, y]) => P(i, y));
        o += Sv.P(Sv.poly(hex) + " Z", "none", 0, U.rgba(PAL.B, 0.18 * r));
      }
      const vcol = r > 0 ? PAL.A : PAL.ink;
      for (let i = I0; i <= I1; i++) for (let y = Y0; y < Y1; y++) {
        const a = P(i, y), b = P(i, y + 1);
        o += Sv.L(a[0], a[1], b[0], b[1], r > 0.5 ? PAL.A : PAL.ink, 0.06);
      }
      for (let i = I0; i < I1; i++) for (let y = Y0; y <= Y1; y++) {
        const a = P(i, y), b = P(i + 1, y);
        if (odd(i + y)) o += Sv.L(a[0], a[1], b[0], b[1], r > 0.5 ? PAL.B : PAL.ink, 0.06);
        else if (r < 1) o += Sv.L(a[0], a[1], b[0], b[1], PAL.ink, 0.06, `opacity="${f4(1 - r)}"`);
      }
      for (let i = I0; i <= I1; i++) for (let y = Y0; y <= Y1; y++) { const a = P(i, y); o += Sv.C(a[0], a[1], 0.085); }
      svg.innerHTML = o;
    },
  };
});

// ---------- решётка из статьи: лучи U0, U1, … с перегородками ----------
Deck.figure("hexHalin", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-1.4 -8.2 8.4 9.0");
    const ymax = 7;
    let o = `<defs><marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${PAL.A}"/></marker></defs>`;
    for (let y = 1; y <= ymax; y++) for (let i = 0; i <= 4; i++) {
      if (i + 1 > y) continue;
      if ((i + y) % 2 === 1) o += Sv.L(i, -y, i + 1, -y, PAL.B, 0.06);
      else o += Sv.L(i, -y, i + 1, -y, "#c3c8d0", 0.03, 'stroke-dasharray="0.12 0.1"');
    }
    o += Sv.L(0, -1, 0, -ymax - 0.7, PAL.A, 0.06, 'marker-end="url(#ar2)"');
    for (let i = 1; i <= 5; i++) o += Sv.L(i, -i, i, -ymax - 0.7, PAL.A, 0.06, 'marker-end="url(#ar2)"');
    for (let y = 1; y <= ymax; y++) o += Sv.C(0, -y, 0.09);
    for (let i = 1; i <= 5; i++) for (let y = i; y <= ymax; y++) o += Sv.C(i, -y, 0.09);
    for (let i = 0; i <= 2; i++) o += `<text x="${i - 0.15}" y="${-ymax - 0.9}" font-size="0.42" text-anchor="end" font-style="italic">U${["₀", "₁", "₂"][i]}</text>`;
    o += Sv.T(6.0, -ymax + 0.2, "…", 0.6);
    svg.innerHTML = o;
  },
  draw() {},
}));

// ---------- эквивалентные и неэквивалентные лучи ----------
// Полоса из 4 рядов: два луча идут вправо, иногда встречаясь в общих вершинах.
// Z^2: лучи вправо и вверх — тоже эквивалентны (у Z^2 один конец). T3: лучи в разные ветви — нет.
Deck.figure("rayEquiv", (el) => {
  let svg; const t = regularTree(3, 5);
  const posT = radialLayout(t.children, 0, (d) => d * 0.62, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
  const r1 = [0, 0, 1, 1, 2, 2, 2, 1, 0, 0, 1, 2, 3, 3, 2, 1, 1, 1, 2, 2];
  const r2 = [3, 2, 2, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1];
  const ray = (r) => { const p = [[0, r[0]]]; for (let x = 0; x + 1 < r.length; x++) { p.push([x + 1, r[x]]); p.push([x + 1, r[x + 1]]); } return p; };
  const branch = (c) => { const p = [0]; let v = c; while (v !== undefined) { p.push(v); v = t.children[v][0]; } return p; };
  return {
    steps: 1, durs: [5200], linear: [true], holds: [800, 2600], back: 3,
    init() { svg = svgHost(el, "-0.8 -5.4 31.6 7.8"); },
    draw(T) {
      let o = "";
      // полоса
      const sx = 0.5, X = (x) => x * sx, Y = (y) => -0.8 - y * 0.9;
      for (let y = 0; y < 4; y++) o += Sv.L(X(0), Y(y), X(19), Y(y), "#d5d9df", 0.04);
      for (let x = 0; x <= 19; x++) o += Sv.L(X(x), Y(0), X(x), Y(3), "#d5d9df", 0.04);
      const draw = (r, col, off) => Sv.P(Sv.poly(polyPartial(ray(r).map(([x, y]) => [X(x), Y(y) + off]), T)), col, 0.12);
      o += draw(r1, PAL.A, 0.06) + draw(r2, PAL.B, -0.06);
      for (let x = 0; x < r1.length; x++) if (r1[x] === r2[x] && x / (r1.length - 1) <= T + 0.02) o += Sv.C(X(x), Y(r1[x]), 0.16, "none", `stroke="${PAL.R}" stroke-width="0.05"`);
      o += Sv.T(X(9.5), 1.45, "лучи эквивалентны", 0.62);
      // Z^2
      const ox = 12.6, s2 = 0.55, Z = (x, y) => [ox + x * s2, 0.4 - y * s2];
      for (let i = -1; i <= 9; i++) o += Sv.L(...Z(i, -1), ...Z(i, 9), "#d5d9df", 0.04) + Sv.L(...Z(-1, i), ...Z(9, i), "#d5d9df", 0.04);
      const lenA = 9 * T;
      o += Sv.L(...Z(0, 0), ...Z(lenA, 0), PAL.A, 0.12) + Sv.L(...Z(0, 0), ...Z(0, lenA), PAL.B, 0.12) + Sv.C(...Z(0, 0), 0.14, PAL.ink);
      o += Sv.T(ox + 2.5, 1.45, "тоже эквивалентны", 0.62);
      // T3
      const tx = 26.2, P = (v) => { const p = posT.get(v); return [tx + p[0] * 1.3, -2.0 - p[1] * 1.3]; };
      for (let v = 1; v < t.n; v++) o += Sv.L(...P(v), ...P(t.parent[v]), "#c9ced6", 0.03);
      const drawB = (path, col) => {
        const pts = path.map(P), m = (pts.length - 1) * T;
        let s = ""; for (let i = 0; i < Math.floor(m); i++) s += Sv.L(...pts[i], ...pts[i + 1], col, 0.12);
        const f = m - Math.floor(m); if (f > 0 && Math.floor(m) + 1 < pts.length) { const a = pts[Math.floor(m)], b = pts[Math.floor(m) + 1]; s += Sv.L(...a, a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, col, 0.12); }
        return s;
      };
      o += drawB(branch(t.children[0][0]), PAL.A) + drawB(branch(t.children[0][1]), PAL.B) + Sv.C(...P(0), 0.14, PAL.ink);
      o += Sv.T(tx, 1.45, "не эквивалентны", 0.62);
      svg.innerHTML = o;
    },
  };
});
