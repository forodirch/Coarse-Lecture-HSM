// ============================================================
//  Блок «Метрика»: шары трёх метрик, неравенство треугольника в графе,
//  триптих Z, Z^2, T3, шар-ромб в Z^2.
// ============================================================

// Частичная ломаная: первые frac её длины
function polyPartial(pts, frac) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let need = tot * U.clamp(frac, 0, 1); const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (need >= L[i - 1]) { out.push(pts[i]); need -= L[i - 1]; continue; }
    const t = L[i - 1] ? need / L[i - 1] : 0;
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
    break;
  }
  return out;
}

// ---------- единичный шар метрики (data-kind = 2 | 1 | inf); точка обходит контур ----------
Deck.figure("metricBall", (el) => {
  let svg; const kind = el.dataset.kind;
  return {
    steps: 0, live: true,
    init() { svg = svgHost(el, "-1.45 -1.45 2.9 2.9"); },
    draw(T, now = 0) {
      const th = (2 * Math.PI * (now % 9000)) / 9000 + 0.6, c = Math.cos(th), s = Math.sin(th);   // полный оборот за 9 с
      const k = kind === "2" ? 1 : kind === "1" ? Math.abs(c) + Math.abs(s) : Math.max(Math.abs(c), Math.abs(s));
      const px = c / k, py = -s / k, tint = U.rgba(PAL.A, 0.08);
      let o = Sv.L(-1.35, 0, 1.35, 0, "#c3c8d0", 0.02) + Sv.L(0, -1.35, 0, 1.35, "#c3c8d0", 0.02);
      if (kind === "2") o += Sv.C(0, 0, 1, tint, `stroke="${PAL.A}" stroke-width="0.04"`);
      if (kind === "1") o += Sv.P(Sv.poly([[1, 0], [0, -1], [-1, 0], [0, 1]]) + " Z", PAL.A, 0.04, tint);
      if (kind === "inf") o += Sv.P(Sv.poly([[1, -1], [-1, -1], [-1, 1], [1, 1]]) + " Z", PAL.A, 0.04, tint);
      if (kind === "2") o += Sv.L(0, 0, px, py, PAL.R, 0.05);
      if (kind === "1") o += Sv.L(0, 0, px, 0, PAL.B, 0.055) + Sv.L(px, 0, px, py, PAL.R, 0.055);
      if (kind === "inf") {
        const hz = Math.abs(px) >= Math.abs(py);
        o += Sv.L(0, 0, px, 0, hz ? PAL.R : "#b5bac2", hz ? 0.06 : 0.025) + Sv.L(px, 0, px, py, hz ? "#b5bac2" : PAL.R, hz ? 0.025 : 0.06);
      }
      o += Sv.C(0, 0, 0.05) + Sv.C(px, py, 0.08, PAL.R);
      svg.innerHTML = o;
    },
  };
});

// ---------- неравенство треугольника для метрики графа ----------
Deck.figure("graphTriangle", (el) => {
  let svg;
  const NX = 11, NY = 7;
  const wall = (x, y) => x === 4 && y <= 4;          // нет рёбер (4,y)–(5,y) при y ≤ 4
  const uv = [[1, 1], [1, 6]], vw = [[1, 6], [9, 6], [9, 1]], uw = [[1, 1], [1, 5], [9, 5], [9, 1]];
  const S = (p) => [p[0], -p[1]];
  return {
    steps: 3, durs: [1400, 2600, 2600], linear: [true, true, true], holds: [1200, 800, 800, 3000], back: 3,
    init() { svg = svgHost(el, "-0.8 -7.0 11.6 10.3"); },
    draw(T) {
      let out = "";
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
        if (x + 1 < NX && !wall(x, y)) out += Sv.L(x, -y, x + 1, -y, "#9aa0a8", 0.035);
        if (y + 1 < NY) out += Sv.L(x, -y, x, -y - 1, "#9aa0a8", 0.035);
      }
      out += `<rect x="4.38" y="-4.35" width="0.24" height="4.7" rx="0.08" fill="#5f6670"/>`;
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) out += Sv.C(x, -y, 0.07, "#9aa0a8");
      const path = (pts, frac, col, off) => {
        if (frac <= 0) return "";
        const q = polyPartial(pts.map(S), frac).map((p) => [p[0] + off, p[1] + off]);
        return Sv.P(Sv.poly(q), col, 0.13);
      };
      out += path(uv, U.seg(T, 0, 1), PAL.A, -0.08);
      out += path(vw, U.seg(T, 1, 2), PAL.B, -0.08);
      out += path(uw, U.seg(T, 2, 3), PAL.R, 0.08);
      for (const [p, lab, dx, dy] of [[[1, 1], "u", -0.45, 0.25], [[1, 6], "v", -0.45, -0.1], [[9, 1], "w", 0.45, 0.25]]) {
        out += Sv.C(p[0], -p[1], 0.17, PAL.ink) + Sv.T(p[0] + dx, -p[1] + dy, lab, 0.62, PAL.ink, 'font-style="italic"');
      }
      // подписи длин справа
      const lines = [
        [U.seg(T, 0, 1), PAL.A, "d(u,v) = 5"],
        [U.seg(T, 1, 2), PAL.B, "d(v,w) = 13"],
        [U.seg(T, 2, 3), PAL.R, "d(u,w) = 16 ≤ 5 + 13"],
      ];
      lines.forEach(([a, col, txt], i) => {
        if (a > 0.98) out += `<text x="0" y="${1.1 + i * 0.85}" font-size="0.62" fill="${col}" font-style="italic">${txt}</text>`;
      });
      svg.innerHTML = out;
    },
  };
});

// ---------- триптих Z, Z^2, T3 ----------
Deck.figure("triptych", (el) => {
  return {
    steps: 0,
    init() {
      const svg = svgHost(el, "-2.2 -2.2 14.4 4.7");
      let out = "";
      // Z
      out += Sv.L(-2, 0, 2, 0, PAL.ink, 0.04, 'stroke-dasharray="0.08 0.08"') + Sv.L(-1.6, 0, 1.6, 0, PAL.ink, 0.045);
      for (let i = -4; i <= 4; i++) out += Sv.C(i * 0.4, 0, 0.065);
      out += Sv.T(0, 2.25, "ℤ", 0.45);
      // Z^2
      const ox = 5;
      for (let i = -3; i <= 3; i++) {
        out += Sv.L(ox + i * 0.45, -1.6, ox + i * 0.45, 1.6, PAL.ink, 0.04) + Sv.L(ox - 1.6, i * 0.45, ox + 1.6, i * 0.45, PAL.ink, 0.04);
      }
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) out += Sv.C(ox + i * 0.45, j * 0.45, 0.06);
      out += Sv.T(ox, 2.25, "ℤ²", 0.45);
      // T3
      const tx = 10, t = regularTree(3, 5);
      const pos = radialLayout(t.children, 0, (d) => [0, 0.55, 1.0, 1.35, 1.62, 1.85][d], 0, 2 * Math.PI);
      for (let v = 1; v < t.n; v++) { const p = pos.get(v), q = pos.get(t.parent[v]); out += Sv.L(tx + p[0], -p[1], tx + q[0], -q[1], PAL.ink, 0.03); }
      for (let v = 0; v < t.n; v++) { const p = pos.get(v); out += Sv.C(tx + p[0], -p[1], t.dep[v] > 3 ? 0.035 : 0.055); }
      out += Sv.T(tx, 2.25, "T₃", 0.45);
      svg.innerHTML = out;
    },
    draw() {},
  };
});

// ---------- шары в Z^2 для трёх метрик: ромб (d1), круг (d2), квадрат (d∞) ----------
Deck.figure("ballsThree", (el) => {
  let svg; const R = 7, NMAX = 6;
  const cnt = (n, kind) => {
    let c = 0;
    for (let x = -n; x <= n; x++) for (let y = -n; y <= n; y++) {
      const d = kind === 1 ? Math.abs(x) + Math.abs(y) : kind === 2 ? Math.hypot(x, y) : Math.max(Math.abs(x), Math.abs(y));
      if (d <= n + 1e-9) c++;
    }
    return c;
  };
  return {
    steps: NMAX, durs: Array(NMAX).fill(700), holds: [1200, 500, 500, 500, 500, 500, 2800], back: 2.5,
    init() { svg = svgHost(el, `${-R - 0.6} ${-R - 0.6} ${2 * R + 11} ${2 * R + 1.2}`); },
    draw(T) {
      const rr = Math.max(0.0001, T);
      let o = "";
      for (let i = -R; i <= R; i++) o += Sv.L(i, -R, i, R, "#e1e4e8", 0.04) + Sv.L(-R, i, R, i, "#e1e4e8", 0.04);
      o += Sv.P(Sv.poly([[rr, rr], [-rr, rr], [-rr, -rr], [rr, -rr]]) + " Z", PAL.R, 0.07, U.rgba(PAL.R, 0.05));
      o += Sv.C(0, 0, rr, U.rgba(PAL.B, 0.07), `stroke="${PAL.B}" stroke-width="0.07"`);
      o += Sv.P(Sv.poly([[rr, 0], [0, -rr], [-rr, 0], [0, rr]]) + " Z", PAL.A, 0.07, U.rgba(PAL.A, 0.12));
      for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
        const d1 = Math.abs(x) + Math.abs(y), d2 = Math.hypot(x, y), di = Math.max(Math.abs(x), Math.abs(y));
        const col = d1 <= T + 1e-9 ? PAL.A : d2 <= T + 1e-9 ? PAL.B : di <= T + 1e-9 ? PAL.R : "#c9ced6";
        o += Sv.C(x, y, d1 <= T + 1e-9 || d2 <= T + 1e-9 || di <= T + 1e-9 ? 0.17 : 0.11, col);
      }
      const k = Math.round(T), tx = R + 1.0;
      o += `<text x="${tx}" y="-3.4" font-size="1.0" font-style="italic">n = ${k}</text>`;
      o += `<text x="${tx}" y="-1.6" font-size="0.85" fill="${PAL.A}">d₁:  ${cnt(k, 1)}</text>`;
      o += `<text x="${tx}" y="0" font-size="0.85" fill="${PAL.B}">d₂:  ${cnt(k, 2)}</text>`;
      o += `<text x="${tx}" y="1.6" font-size="0.85" fill="${PAL.R}">d∞:  ${cnt(k, 3)}</text>`;
      svg.innerHTML = o;
    },
  };
});
