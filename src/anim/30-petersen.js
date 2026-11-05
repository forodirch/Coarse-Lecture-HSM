// ============================================================
//  Граф Петерсена → подразбиение K_{3,3} с сохранением симметрии.
//  Вершины 0..4 — внешний пятиугольник, 5..9 — звезда; удаляем 0.
//  Отражение x → −x (сохраняет вершину 0) остаётся симметрией на всём пути.
//  Итог: правильный шестиугольник 3-9-6-2-7-8 с тремя длинными диагоналями;
//  точки подразбиения 5, 1, 4 — середины сторон 8-7, 2-6, 9-3 (симметрия D3).
//  Шаги: 1 — выделяем вершину 0 и ось; 2 — удаляем, раскрашиваем доли;
//        3 — плавный переход к шестиугольнику; 4 — поворот на 120°.
// ============================================================
Deck.figure("petersen", (el) => {
  const NS = "http://www.w3.org/2000/svg";
  const P = { 0: [0, 2] };
  for (let i = 0; i < 5; i++) {
    const a = ((90 + 72 * i) * Math.PI) / 180;
    P[i] = [2 * Math.cos(a), 2 * Math.sin(a)];
    P[i + 5] = [Math.cos(a), Math.sin(a)];
  }
  const R6 = 1.9, ang = { 3: 0, 9: 60, 6: 120, 2: 180, 7: 240, 8: 300 };
  const Q = {};
  for (const v in ang) { const a = (ang[v] * Math.PI) / 180; Q[v] = [R6 * Math.cos(a), R6 * Math.sin(a)]; }
  for (const [m, a, b] of [[5, 8, 7], [1, 2, 6], [4, 9, 3]]) Q[m] = [(Q[a][0] + Q[b][0]) / 2, (Q[a][1] + Q[b][1]) / 2];
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [1, 6], [2, 7], [3, 8], [4, 9],
    [5, 7], [7, 9], [9, 6], [6, 8], [8, 5]];
  const A = new Set([2, 8, 9]), B = new Set([3, 6, 7]), S = new Set([1, 4, 5]);

  let svg, lines = [], dots = {}, axis;
  const mix = (c1, c2, t) => c1.map((x, i) => Math.round(x + (c2[i] - x) * t));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const INK = [29, 29, 31], RED = [190, 30, 45], BLU = [31, 94, 168], ORA = [214, 110, 20], WHT = [255, 255, 255];

  return {
    steps: 4, durs: [800, 1400, 3600, 2600], holds: [1800, 1000, 1500, 2200, 2200], back: 1.3,
    init() {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "-2.75 -2.45 5.5 5.0");
      el.appendChild(svg);
      axis = document.createElementNS(NS, "line");
      axis.setAttribute("x1", 0); axis.setAttribute("x2", 0); axis.setAttribute("y1", -2.4); axis.setAttribute("y2", 2.4);
      axis.setAttribute("stroke", "#8a9099"); axis.setAttribute("stroke-width", 0.022); axis.setAttribute("stroke-dasharray", "0.09 0.07");
      svg.appendChild(axis);
      for (const [u, v] of EDGES) {
        const ln = document.createElementNS(NS, "line");
        ln.setAttribute("stroke-linecap", "round");
        svg.appendChild(ln); lines.push({ ln, u, v });
      }
      for (let v = 0; v < 10; v++) { const c = document.createElementNS(NS, "circle"); svg.appendChild(c); dots[v] = c; }
    },
    draw(T) {
      const red = U.seg(T, 0, 1), gone = U.seg(T, 1, 2), col = gone;
      const mo = U.seg(T, 2, 3), rot = U.seg(T, 3, 4);
      const phi = (rot * 2 * Math.PI) / 3;
      const pos = (v) => {
        let p = P[v];
        if (Q[v]) p = [p[0] + (Q[v][0] - p[0]) * mo, p[1] + (Q[v][1] - p[1]) * mo];
        const c = Math.cos(phi), s = Math.sin(phi);
        return [p[0] * c - p[1] * s, -(p[0] * s + p[1] * c)];   // y вверх → SVG y вниз
      };
      axis.setAttribute("opacity", red * 0.9);
      for (const { ln, u, v } of lines) {
        const p = pos(u), q = pos(v);
        ln.setAttribute("x1", p[0]); ln.setAttribute("y1", p[1]); ln.setAttribute("x2", q[0]); ln.setAttribute("y2", q[1]);
        const hot = u === 0 || v === 0;
        ln.setAttribute("stroke", rgb(hot ? mix(INK, RED, red) : INK));
        ln.setAttribute("stroke-width", hot ? 0.05 + 0.03 * red : 0.05);
        ln.setAttribute("opacity", hot ? 1 - gone : 1);
      }
      for (let v = 0; v < 10; v++) {
        const c = dots[v], p = pos(v);
        c.setAttribute("cx", p[0]); c.setAttribute("cy", p[1]);
        if (v === 0) {
          c.setAttribute("r", 0.085 + 0.04 * red); c.setAttribute("fill", rgb(mix(INK, RED, red)));
          c.setAttribute("opacity", 1 - gone); c.setAttribute("stroke", "none");
        } else if (S.has(v)) {
          c.setAttribute("r", 0.085 + 0.015 * col); c.setAttribute("fill", rgb(mix(INK, WHT, col)));
          c.setAttribute("stroke", rgb(INK)); c.setAttribute("stroke-width", 0.03 * col);
        } else {
          c.setAttribute("r", 0.085 + 0.045 * col);
          c.setAttribute("fill", rgb(mix(INK, A.has(v) ? BLU : ORA, col))); c.setAttribute("stroke", "none");
        }
      }
    },
  };
});
