// ============================================================
//  Блок «Изометрии»: три домика и три колодца, K5 и K33, 2-связность.
// ============================================================

// ---------- три домика — три колодца ----------
// Шестиугольник Д1 К1 Д2 К2 Д3 К3 (вершины через 60°), диагональ Д1–К2 внутри,
// диагональ К1–Д3 снаружи; девятое ребро Д2–К3 пересекает одно из них при любой попытке.
Deck.figure("utilities", (el) => {
  let svg;
  const R = 1.6, ang = { H1: 90, W1: 150, H2: 210, W2: 270, H3: 330, W3: 30 };
  const P = {}; for (const k in ang) { const a = (ang[k] * Math.PI) / 180; P[k] = [R * Math.cos(a), -R * Math.sin(a)]; }
  // кривая вне шестиугольника от угла a до угла b (в градусах, по возрастанию)
  const around = (a, b, bump = 0.75) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, th = ((a + (b - a) * t) * Math.PI) / 180, r = R + bump * Math.sin(Math.PI * t);
      pts.push([r * Math.cos(th), -r * Math.sin(th)]);
    }
    return pts;
  };
  const E8 = [
    [P.H1, P.W1], [P.W1, P.H2], [P.H2, P.W2], [P.W2, P.H3], [P.H3, P.W3], [P.W3, P.H1],
    [P.H1, P.W2],                    // внутри
    around(150, 330),                // К1–Д3 снаружи, через низ
  ];
  const tryIn = [P.H2, P.W3];                  // пересекает Д1–К2 в центре
  const tryOut = around(30, 210);              // снаружи, через верх: пересекает К1–Д3
  const house = (p, col) => {
    const [x, y] = p, s = 0.2;
    return `<path d="M${f4(x - s)} ${f4(y + s * 0.9)} L${f4(x - s)} ${f4(y - s * 0.2)} L${f4(x)} ${f4(y - s * 1.1)} L${f4(x + s)} ${f4(y - s * 0.2)} L${f4(x + s)} ${f4(y + s * 0.9)} Z" fill="${col}"/>`;
  };
  const well = (p) => Sv.C(p[0], p[1], 0.19, PAL.B) + Sv.C(p[0], p[1], 0.09, "#fff");
  return {
    steps: 3, durs: [5200, 1600, 2000], linear: [true, false, false], holds: [1000, 1300, 1500, 2600], back: 2.2,
    init() { svg = svgHost(el, "-2.6 -2.55 5.2 5.1"); },
    draw(T) {
      let out = "";
      const a = U.seg(T, 0, 1) * E8.length;
      E8.forEach((pts, i) => {
        const f = U.clamp(a - i, 0, 1);
        if (f > 0) out += Sv.P(Sv.poly(polyPartial(pts, f)), PAL.ink, 0.045);
      });
      const fin = U.seg(T, 1, 2), fout = U.seg(T, 2, 3);
      const red = (pts, f) => (f > 0 ? Sv.P(Sv.poly(polyPartial(pts, f)), PAL.R, 0.05, "none", 'stroke-dasharray="0.11 0.08"') : "");
      // внутренняя попытка доходит до центра и упирается
      out += red([tryIn[0], [0, 0]], fin);
      if (fin > 0.98) out += Sv.C(0, 0, 0.13, "none", `stroke="${PAL.R}" stroke-width="0.05"`);
      // внешняя попытка доходит до пересечения (около 180°)
      out += red(tryOut.slice(0, 51), fout);
      if (fout > 0.98) { const q = tryOut[50]; out += Sv.C(q[0], q[1], 0.13, "none", `stroke="${PAL.R}" stroke-width="0.05"`); }
      for (const k of ["H1", "H2", "H3"]) out += house(P[k], PAL.A);
      for (const k of ["W1", "W2", "W3"]) out += well(P[k]);
      svg.innerHTML = out;
    },
  };
});

// ---------- K5, K33 и подразбиение K33 (статично) ----------
Deck.figure("kuratowski", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-1.5 -1.45 10.2 3.3");
    let out = "";
    const K5 = []; for (let i = 0; i < 5; i++) { const a = ((90 + 72 * i) * Math.PI) / 180; K5.push([Math.cos(a), -Math.sin(a)]); }
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) out += Sv.L(...K5[i], ...K5[j], PAL.ink, 0.04);
    for (const p of K5) out += Sv.C(p[0], p[1], 0.08);
    out += Sv.T(0, 1.55, "K₅", 0.36);
    const k33 = (ox, sub) => {
      const A = [-1, 0, 1].map((x) => [ox + x, -0.75]), B = [-1, 0, 1].map((x) => [ox + x, 0.75]);
      let s = "";
      for (const a of A) for (const b of B) s += Sv.L(...a, ...b, PAL.ink, 0.04);
      if (sub) for (const [i, j, t] of [[0, 0, 0.5], [1, 2, 0.16], [1, 2, 0.76], [2, 2, 0.5], [2, 0, 0.84]]) {
        const p = [A[i][0] + (B[j][0] - A[i][0]) * t, A[i][1] + (B[j][1] - A[i][1]) * t];
        s += Sv.C(p[0], p[1], 0.075, "#fff", `stroke="${PAL.ink}" stroke-width="0.03"`);
      }
      for (const a of A) s += Sv.C(a[0], a[1], 0.1, PAL.A);
      for (const b of B) s += Sv.C(b[0], b[1], 0.1, PAL.B);
      return s;
    };
    out += k33(3.6, false) + Sv.T(3.6, 1.55, "K₃,₃", 0.36);
    out += k33(7.2, true) + Sv.T(7.2, 1.55, "подразбиение K₃,₃", 0.3);
    svg.innerHTML = out;
  },
  draw() {},
}));

// ---------- 2-связность: удаляем вершину из Z и из лестницы ----------
Deck.figure("twoConnected", (el) => {
  let svg;
  return {
    steps: 1, durs: [1300], holds: [1500, 2600], back: 1.5,
    init() { svg = svgHost(el, "-6.0 -3.0 12.0 6.4"); },
    draw(T) {
      const g = U.seg(T, 0, 1);
      let out = "";
      // Z (верхняя строка)
      const s = 0.95;
      out += `<g transform="translate(0,-1.6)">`;
      for (let i = -5; i < 5; i++) {
        const touch = i === -1 || i === 0;
        const c = i < 0 ? PAL.A : PAL.B;
        out += Sv.L(i * s, 0, (i + 1) * s, 0, touch ? PAL.ink : (g > 0 ? c : PAL.ink), 0.06, touch ? `opacity="${f4(1 - 0.85 * g)}"` : `opacity="1"`);
      }
      for (let i = -5; i <= 5; i++) {
        if (i === 0) { out += Sv.C(0, 0, 0.16, PAL.R, `opacity="${f4(1 - g)}"`); continue; }
        out += Sv.C(i * s, 0, 0.13, g > 0.5 ? (i < 0 ? PAL.A : PAL.B) : PAL.ink);
      }
      out += Sv.T(0, 0.85, g > 0.5 ? "ℤ: две компоненты" : "ℤ", 0.5) + "</g>";
      // лестница (нижняя строка)
      out += `<g transform="translate(0,1.3)">`;
      const ox = 0, h = 0.5;
      for (let i = -5; i < 5; i++) {
        out += Sv.L(ox + i * s, -h, ox + (i + 1) * s, -h, g > 0.5 ? PAL.A : PAL.ink, 0.06);
        const touch = i === -1 || i === 0;
        out += Sv.L(ox + i * s, h, ox + (i + 1) * s, h, g > 0.5 ? PAL.A : PAL.ink, 0.06, touch ? `opacity="${f4(1 - 0.85 * g)}"` : "");
      }
      for (let i = -5; i <= 5; i++) out += Sv.L(ox + i * s, -h, ox + i * s, h, g > 0.5 ? PAL.A : PAL.ink, 0.06, i === 0 ? `opacity="${f4(1 - 0.85 * g)}"` : "");
      for (let i = -5; i <= 5; i++) {
        out += Sv.C(ox + i * s, -h, 0.13, g > 0.5 ? PAL.A : PAL.ink);
        if (i === 0) out += Sv.C(ox, h, 0.16, PAL.R, `opacity="${f4(1 - g)}"`);
        else out += Sv.C(ox + i * s, h, 0.13, g > 0.5 ? PAL.A : PAL.ink);
      }
      out += Sv.T(ox, 1.25, g > 0.5 ? '<tspan font-style="italic">L</tspan>: одна компонента' : '<tspan font-style="italic">L</tspan>', 0.5) + "</g>";
      svg.innerHTML = out;
    },
  };
});
