// ============================================================
//  Блок «Квазиизометрия»: три условия, Z ~ L, конечный граф ~ точка,
//  решётки на плоскости, T3 ~ T4.
// ============================================================

// ---------- три условия на примере f: Z → L, f(n) = (n,1) ----------
Deck.figure("qiIdea", (el) => {
  let svg;
  return {
    steps: 2, durs: [1400, 1200], holds: [900, 600, 3200], back: 2,
    init() { svg = svgHost(el, "-0.6 -3.7 25.8 7.3"); },
    draw(T) {
      const ar = U.seg(T, 0, 1), hl = U.seg(T, 1, 2);
      let out = "";
      const titles = ["далёкие не слипаются", "соседние не разлетаются", "образ почти всё накрывает"];
      for (let k = 0; k < 3; k++) {
        const ox = k * 8.4 + 0.6, X = (n) => ox + (n + 3) * 1.1;
        const yZ = -1.6, y1 = 1.1, y2 = 2.2;
        // Z
        out += Sv.L(X(-3) - 0.4, yZ, X(3) + 0.4, yZ, PAL.ink, 0.05);
        // L
        out += Sv.L(X(-3) - 0.4, y1, X(3) + 0.4, y1, PAL.ink, 0.05) + Sv.L(X(-3) - 0.4, y2, X(3) + 0.4, y2, PAL.ink, 0.05);
        for (let n = -3; n <= 3; n++) out += Sv.L(X(n), y1, X(n), y2, PAL.ink, 0.05);
        // стрелки f
        for (let n = -3; n <= 3; n++) {
          const f = U.clamp(ar * 1.6 - (n + 3) * 0.1, 0, 1);
          if (f > 0) out += Sv.L(X(n), yZ + 0.2, X(n), yZ + 0.2 + (y1 - 0.25 - yZ - 0.2) * f, "#9aa0a8", 0.035, 'stroke-dasharray="0.12 0.1"');
        }
        for (let n = -3; n <= 3; n++) out += Sv.C(X(n), yZ, 0.12) + Sv.C(X(n), y1, 0.12, k === 2 && hl > 0 ? PAL.B : PAL.ink) + Sv.C(X(n), y2, 0.12);
        if (hl > 0) {
          const op = `opacity="${f4(hl)}"`;
          if (k === 0) {
            for (const n of [-3, 3]) out += Sv.C(X(n), yZ, 0.2, PAL.R, op) + Sv.C(X(n), y1, 0.2, PAL.R, op);
            out += Sv.L(X(-3), yZ - 0.55, X(3), yZ - 0.55, PAL.R, 0.05, op) + Sv.T(X(0), yZ - 0.95, "6", 0.6, PAL.R, op);
            out += Sv.L(X(-3), y2 + 0.55, X(3), y2 + 0.55, PAL.R, 0.05, op) + Sv.T(X(0), y2 + 0.95, "6", 0.6, PAL.R, op);
          }
          if (k === 1) {
            for (const n of [0, 1]) out += Sv.C(X(n), yZ, 0.2, PAL.R, op) + Sv.C(X(n), y1, 0.2, PAL.R, op);
            out += Sv.T(X(0.5), yZ - 0.55, "1", 0.6, PAL.R, op) + Sv.T(X(0.5), y1 + 0.55, "1", 0.6, PAL.R, op);
          }
          if (k === 2) {
            out += Sv.L(X(-3) - 0.4, y1, X(3) + 0.4, y1, PAL.B, 0.12, op);
            for (let n = -3; n <= 3; n++) out += Sv.C(X(n), y1, 0.16, PAL.B, op);
          }
        }
        out += Sv.T(X(0), -3.25, titles[k], 0.62, PAL.A);
        out += `<text x="${f4(X(-3) - 0.6)}" y="${yZ}" font-size="0.6" text-anchor="end" dominant-baseline="middle" font-style="italic">ℤ</text>`;
        out += `<text x="${f4(X(-3) - 0.6)}" y="${(y1 + y2) / 2}" font-size="0.6" text-anchor="end" dominant-baseline="middle" font-style="italic">L</text>`;
      }
      svg.innerHTML = out;
    },
  };
});

// ---------- Z ~ L: (n,1) ↦ 2n, (n,2) ↦ 2n+1 ----------
// Этапы: 1 — лестница раздвигается вдвое (синие встают на чётные числа);
//        2 — оранжевый ряд опускается на нечётные; 3, 4 — пары, где оценки достигаются.
Deck.figure("ladder", (el) => {
  let svg;
  return {
    steps: 4, durs: [2200, 2400, 900, 900], holds: [1600, 900, 1500, 1700, 1900], back: 2,
    init() { svg = svgHost(el, "-7.4 -3.05 15.8 4.25"); },
    draw(T) {
      const st = U.seg(T, 0, 1), dr = U.seg(T, 1, 2), h1 = U.seg(T, 2, 3) * (1 - U.seg(T, 3, 4)), h2 = U.seg(T, 3, 4);
      const k = 1 + st;                       // растяжение: n ↦ k·n
      const H = 1.6 * (1 - dr), dx = dr;      // верхний ряд: высота и сдвиг вправо
      const B = (n) => [k * n, 0], O = (n) => [k * n + dx, -H];
      let o = "";
      const N0 = -3, N1 = 3;
      for (let n = N0; n < N1; n++) o += Sv.L(...B(n), ...B(n + 1), PAL.A, 0.07);
      if (dr > 0) o += Sv.L(...B(N1), B(N1)[0] + dr, 0, PAL.A, 0.07, `opacity="${f4(dr)}"`);   // ребро 2N1 — 2N1+1
      for (let n = N0; n < N1; n++) o += Sv.L(...O(n), ...O(n + 1), PAL.B, 0.07, `opacity="${f4(1 - dr)}"`);
      for (let n = N0; n <= N1; n++) o += Sv.L(...B(n), ...O(n), PAL.ink, 0.05, `opacity="${f4(1 - dr)}"`);
      for (let n = N0; n <= N1; n++) o += Sv.C(...B(n), 0.2, PAL.A) + Sv.C(...O(n), 0.2, PAL.B);
      // номера φ(n,1)=2n, φ(n,2)=2n+1 едут вместе с вершинами; оранжевые съезжают сверху вниз
      const lab = (m) => String(m).replace("-", "−"), oy = -0.62 + 1.27 * dr;
      for (let n = N0; n <= N1; n++) {
        const [bx, by] = B(n), [qx, qy] = O(n);
        o += Sv.T(bx, by + 0.65, lab(2 * n), 0.5, PAL.A) + Sv.T(qx, qy + oy, lab(2 * n + 1), 0.5, PAL.B);
      }
      const arc = (a, b, op) => `<path d="M${a} -0.3 Q${(a + b) / 2} ${-1.7} ${b} -0.3" stroke="${PAL.R}" stroke-width="0.1" fill="none" opacity="${f4(op)}"/>`;
      if (h1 > 0) o += arc(0, 2, h1) + Sv.C(0, 0, 0.27, PAL.R, `opacity="${f4(h1)}"`) + Sv.C(2, 0, 0.27, PAL.R, `opacity="${f4(h1)}"`)
        + Sv.T(1, -2.5, "(0,1) и (1,1): в <tspan font-style=\"italic\">L</tspan> расстояние 1, в ℤ — 2", 0.62, PAL.R, `opacity="${f4(h1)}"`);
      if (h2 > 0) o += arc(1, 2, h2) + Sv.C(1, 0, 0.27, PAL.R, `opacity="${f4(h2)}"`) + Sv.C(2, 0, 0.27, PAL.R, `opacity="${f4(h2)}"`)
        + Sv.T(1, -2.5, "(0,2) и (1,1): в <tspan font-style=\"italic\">L</tspan> расстояние 2, в ℤ — 1", 0.62, PAL.R, `opacity="${f4(h2)}"`);
      svg.innerHTML = o;
    },
  };
});

// ---------- конечный граф стягивается в точку ----------
Deck.figure("finiteShrink", (el) => {
  let svg;
  const V = []; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; V.push([Math.cos(a), Math.sin(a)]); }
  V.push([0, 0]);
  const E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4], [6, 2], [6, 5]];
  return {
    steps: 1, durs: [3200], holds: [1500, 2200], back: 1.6,
    init() { svg = svgHost(el, "-2.2 -1.6 4.4 3.2"); },
    draw(T) {
      const s = U.logl(1.25, 0.02, T);
      let out = "";
      for (const [a, b] of E) out += Sv.L(V[a][0] * s, -V[a][1] * s, V[b][0] * s, -V[b][1] * s, PAL.ink, 0.04 * Math.max(0.6, s));
      for (const p of V) out += Sv.C(p[0] * s, -p[1] * s, Math.max(0.03, 0.08 * s + 0.02));
      if (T > 0.85) out += Sv.C(0, 0, 0.07, PAL.ink, `opacity="${f4(U.seg(T, 0.85, 1))}"`);
      svg.innerHTML = out;
    },
  };
});

// ---------- четыре решётки (статично) ----------
Deck.figure("lattices", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "0 -0.3 26 7.2");
    const W = 5.6, a = 0.62;
    let out = `<defs>${[0, 1, 2, 3].map((k) => `<clipPath id="lw${k}"><rect x="${k * 6.6 + 0.3}" y="0" width="${W}" height="${W}" rx="0.2"/></clipPath>`).join("")}</defs>`;
    const names = ["квадратная", "королевская", "треугольная", "гексагональная"], subs = ["кв", "кор", "тр", "гекс"];
    for (let k = 0; k < 4; k++) {
      const ox = k * 6.6 + 0.3, cx = ox + W / 2, cy = W / 2;
      let g = "";
      const L = (x1, y1, x2, y2) => (g += Sv.L(cx + x1, cy - y1, cx + x2, cy - y2, PAL.ink, 0.035));
      const D = (x, y) => (g += Sv.C(cx + x, cy - y, 0.05));
      if (k < 2) {
        for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
          const x = i * a, y = j * a;
          L(x, y, x + a, y); L(x, y, x, y + a);
          if (k === 1) { L(x, y, x + a, y + a); L(x, y, x + a, y - a); }
          D(x, y);
        }
      } else if (k === 2) {
        const h = (a * Math.sqrt(3)) / 2, Q = (i, j) => [(i + j / 2) * a, j * h];
        for (let i = -12; i <= 12; i++) for (let j = -6; j <= 6; j++) {
          const p = Q(i, j);
          for (const [di, dj] of [[1, 0], [0, 1], [-1, 1]]) { const q = Q(i + di, j + dj); L(p[0], p[1], q[0], q[1]); }
          D(p[0], p[1]);
        }
      } else {
        const b = 0.9 * a, hy = (b * Math.sqrt(3)) / 3;
        const odd = (i, y) => (((i + y) % 2) + 2) % 2 === 1;
        for (let i = -6; i <= 6; i++) for (let y = -9; y <= 9; y++) {
          const p = [(i + (odd(i, y) ? 1 : -1) / 6) * b, y * hy];
          const q = [(i + (odd(i, y + 1) ? 1 : -1) / 6) * b, (y + 1) * hy];
          L(p[0], p[1], q[0], q[1]);
          if (odd(i, y)) { const r = [(i + 1 + (odd(i + 1, y) ? 1 : -1) / 6) * b, y * hy]; L(p[0], p[1], r[0], r[1]); }
          // доли: соседи всегда разного цвета; синие образуют треугольную решётку
          g += Sv.C(cx + p[0], cy - p[1], 0.075, odd(i, y) ? PAL.B : PAL.A);
        }
      }
      out += `<g clip-path="url(#lw${k})">${g}</g><rect x="${ox}" y="0" width="${W}" height="${W}" rx="0.2" fill="none" stroke="${PAL.frame}" stroke-width="0.04"/>`;
      out += Sv.T(cx, W + 0.75, `${names[k]}, <tspan font-style="italic">d</tspan><tspan dy="0.16" font-size="0.42">${subs[k]}</tspan>`, 0.6);
    }
    svg.innerHTML = out;
  },
  draw() {},
}));

// ---------- T3 → T4: пары соседних вершин склеиваются ----------
Deck.figure("treeGlue", (el) => {
  let svg, t, mate, pairOf, pos3, pos4;
  const r3 = (d) => [0, 0.62, 1.15, 1.58, 1.95, 2.25][d];
  const r4 = (d) => [0, 0.85, 1.55, 2.05, 2.4, 2.65, 2.85][d];
  return {
    steps: 1, durs: [3400], holds: [2000, 2600], back: 1.4,
    init() {
      svg = svgHost(el, "-2.55 -2.55 5.1 5.1");
      t = regularTree(3, 5);
      mate = new Array(t.n).fill(-1);
      const rec = (v) => {
        if (mate[v] < 0 && t.children[v].length) { const c = t.children[v][0]; mate[v] = c; mate[c] = v; }
        t.children[v].forEach(rec);
      };
      rec(0);
      pairOf = (v) => (mate[v] >= 0 ? Math.min(v, mate[v]) : v);
      const ch4 = Array.from({ length: t.n }, () => []);
      for (let v = 1; v < t.n; v++) { const p = t.parent[v]; if (mate[v] !== p) ch4[pairOf(p)].push(pairOf(v)); }
      pos3 = radialLayout(t.children, 0, r3, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
      pos4 = radialLayout(ch4, pairOf(0), r4, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
    },
    draw(T) {
      const m = T;
      const P = (v) => { const a = pos3.get(v), b = pos4.get(pairOf(v)); return [a[0] + (b[0] - a[0]) * m, -(a[1] + (b[1] - a[1]) * m)]; };
      let out = "";
      for (let v = 1; v < t.n; v++) {
        const p = t.parent[v], A = P(v), B = P(p), red = mate[v] === p;
        out += Sv.L(A[0], A[1], B[0], B[1], red ? PAL.R : PAL.ink, red ? 0.06 : 0.03, red ? `opacity="${f4(1 - m * 0.9)}"` : "");
      }
      for (let v = 0; v < t.n; v++) { const A = P(v); out += Sv.C(A[0], A[1], t.dep[v] >= 4 ? 0.035 : 0.055); }
      svg.innerHTML = out;
    },
  };
});
