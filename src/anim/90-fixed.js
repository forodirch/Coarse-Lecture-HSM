// ============================================================
//  Блок «Деревья и неподвижные точки»: паутинка для cos, обрывание листьев,
//  симметрия дерева и цикла, движения T3, орбиты на Z, центр орбиты.
// ============================================================

// ---------- итерации x ↦ cos x ----------
Deck.figure("cobweb", (el) => {
  let svg; const S = 4.2, X0 = 0.15, K = 14;
  const xs = [X0]; for (let i = 0; i < K; i++) xs.push(Math.cos(xs[i]));
  const pts = [[X0, 0]]; for (let i = 0; i < K; i++) { pts.push([xs[i], xs[i + 1]]); pts.push([xs[i + 1], xs[i + 1]]); }
  const P = (p) => [p[0] * S, -p[1] * S];
  return {
    steps: 1, durs: [7000], linear: [true], holds: [1000, 3000], back: 3,
    init() { svg = svgHost(el, `-0.6 ${-1.65 * S} ${1.75 * S + 0.6} ${1.65 * S + 0.8}`); },
    draw(T) {
      let o = "";
      o += Sv.L(0, 0, 1.6 * S, 0, PAL.ink, 0.03) + Sv.L(0, 0, 0, -1.6 * S, PAL.ink, 0.03);
      for (const t of [0.5, 1, 1.5]) o += Sv.T(t * S, 0.35, String(t).replace(".", ","), 0.28) + Sv.T(-0.3, -t * S, String(t).replace(".", ","), 0.28);
      const cosPts = []; for (let i = 0; i <= 80; i++) { const x = (1.6 * i) / 80; cosPts.push(P([x, Math.cos(x)])); }
      o += Sv.P(Sv.poly(cosPts), PAL.A, 0.05) + Sv.L(0, 0, 1.6 * S, -1.6 * S, "#9aa0a8", 0.04);
      o += Sv.T(1.6 * S + 0.1, -Math.cos(1.6) * S - 0.35, "y = cos x", 0.3, PAL.A, 'text-anchor="end" font-style="italic"');
      o += Sv.T(1.45 * S, -1.6 * S + 0.1, "y = x", 0.3, "#6b6f76", 'font-style="italic"');
      const part = polyPartial(pts.map(P), T);
      o += Sv.P(Sv.poly(part), PAL.R, 0.04);
      const xf = 0.739085;
      o += Sv.C(xf * S, -xf * S, 0.09, PAL.ink, `opacity="${f4(U.seg(T, 0.85, 1))}"`);
      o += Sv.L(xf * S, 0, xf * S, -xf * S, PAL.ink, 0.02, `stroke-dasharray="0.08 0.08" opacity="${f4(U.seg(T, 0.85, 1))}"`);
      o += Sv.T(xf * S, 0.35, "0,739", 0.28, PAL.R, `opacity="${f4(U.seg(T, 0.85, 1))}"`);
      svg.innerHTML = o;
    },
  };
});

// ---------- обрывание листьев: центр — вершина или ребро ----------
function peelLayers(n, edges) {
  const adj = Array.from({ length: n }, () => new Set());
  for (const [a, b] of edges) { adj[a].add(b); adj[b].add(a); }
  const layer = new Array(n).fill(Infinity); let alive = new Set([...Array(n).keys()]), round = 0;
  while (alive.size > 2) {
    const leaves = [...alive].filter((v) => [...adj[v]].filter((u) => alive.has(u)).length <= 1);
    for (const v of leaves) { layer[v] = round; alive.delete(v); }
    round++;
  }
  return { layer, rounds: round, center: [...alive] };
}
Deck.figure("leafPeel", (el) => {
  let svg;
  // дерево: из корня три ветви глубины 6, 5, 4 с боковыми отростками разной длины
  const ch = []; let N = 1;
  const seq = [2, 1, 1, 2, 1, 1, 1, 2, 1, 1];
  const grow = (v, d, D) => {
    ch[v] = []; if (d >= D) return;
    const k = d === 0 ? 3 : seq[(v * 7 + d * 3) % seq.length];
    for (let i = 0; i < k; i++) {
      const c = N++; ch[v].push(c);
      grow(c, d + 1, d === 0 ? [6, 5, 4][i] : i === 0 ? D : Math.min(D, d + 1 + ((c * 5) % 3)));
    }
  };
  grow(0, 0, 6);
  const E = []; ch.forEach((cs, v) => cs.forEach((c) => E.push([v, c])));
  const pos = radialLayout(ch, 0, (d) => d * 0.78, Math.PI * 0.62, Math.PI * 0.62 + 2 * Math.PI);
  const T1 = peelLayers(N, E);
  // эксцентриситеты в исходном дереве; после k обрывов у оставшихся вершин они на k меньше
  const adj = Array.from({ length: N }, () => []); for (const [a, b] of E) { adj[a].push(b); adj[b].push(a); }
  const ecc = [...Array(N).keys()].map((v) => {
    const d = new Array(N).fill(-1); d[v] = 0; const q = [v];
    for (let h = 0; h < q.length; h++) for (const u of adj[q[h]]) if (d[u] < 0) { d[u] = d[q[h]] + 1; q.push(u); }
    return Math.max(...d);
  });
  const p5 = peelLayers(5, [[0, 1], [1, 2], [2, 3], [3, 4]]), p4 = peelLayers(4, [[0, 1], [1, 2], [2, 3]]);
  const R = T1.rounds;
  return {
    steps: R, durs: Array(R).fill(1100), holds: [2200, ...Array(R - 1).fill(1300), 3200], back: 2.5,
    init() { svg = svgHost(el, "-5.0 -5.0 10.0 11.9"); },
    draw(T) {
      const n = Math.floor(T + 1e-9), fr = T - n, done = T >= R - 1e-6;
      const op = (L) => (L < n ? 0 : L === n ? 1 - fr : 1);
      const drawGraph = (P, edges, info, rad, lab) => {
        let o = "";
        for (const [a, b] of edges) {
          const oo = Math.min(op(info.layer[a]), op(info.layer[b]));
          const cen = done && info.center.includes(a) && info.center.includes(b);
          if (oo > 0) o += Sv.L(...P(a), ...P(b), cen ? PAL.R : PAL.ink, cen ? 0.09 : 0.045, `opacity="${f4(oo)}"`);
        }
        for (let v = 0; v < info.layer.length; v++) {
          const oo = op(info.layer[v]), cen = done && info.center.includes(v);
          if (oo <= 0) continue;
          const leaf = info.layer[v] === n && !done;          // листья, которые сейчас оборвутся
          o += Sv.C(...P(v), rad, cen ? PAL.R : "#fff", `stroke="${cen ? PAL.R : leaf ? PAL.B : PAL.ink}" stroke-width="${leaf ? 0.06 : 0.035}" opacity="${f4(oo)}"`);
          if (lab) o += Sv.T(...P(v), String(lab(v)), rad * 1.15, cen ? "#fff" : PAL.ink, `opacity="${f4(oo)}"`);
        }
        return o;
      };
      let o = drawGraph((v) => { const p = pos.get(v); return [p[0], -p[1]]; }, E, T1, 0.27, (v) => ecc[v] - n);
      o += drawGraph((v) => [-4.7 + v * 0.75, 6.05], [[0, 1], [1, 2], [2, 3], [3, 4]], p5, 0.1);
      o += drawGraph((v) => [1.9 + v * 0.75, 6.05], [[0, 1], [1, 2], [2, 3]], p4, 0.1);
      o += Sv.T(-3.2, 6.65, "центр — вершина", 0.34) + Sv.T(3.0, 6.65, "центр — ребро", 0.34);
      svg.innerHTML = o;
    },
  };
});

// ---------- симметрия дерева (поворот, центр на месте) и цикла C5 ----------
Deck.figure("symTree", (el) => {
  let svg; const t = regularTree(3, 3);
  const pos = radialLayout(t.children, 0, (d) => d * 0.7, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
  return {
    steps: 1, durs: [2600], holds: [1500, 1800], back: 1,
    init() { svg = svgHost(el, "-2.6 -2.5 11.6 5.0"); },
    draw(T) {
      const a = (T * 2 * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
      const P = (v) => { const p = pos.get(v); return [p[0] * c - p[1] * s, -(p[0] * s + p[1] * c)]; };
      let o = "";
      for (let v = 1; v < t.n; v++) o += Sv.L(...P(v), ...P(t.parent[v]), PAL.ink, 0.045);
      for (let v = 1; v < t.n; v++) o += Sv.C(...P(v), 0.08, v === 7 ? PAL.B : PAL.ink);
      o += Sv.C(0, 0, 0.14, PAL.R);
      // C5
      const b = (T * 2 * Math.PI) / 5, ox = 6.6, Q = [];
      for (let k = 0; k < 5; k++) { const th = Math.PI / 2 + (2 * Math.PI * k) / 5 + b; Q.push([ox + 1.7 * Math.cos(th), -1.7 * Math.sin(th)]); }
      for (let k = 0; k < 5; k++) o += Sv.L(...Q[k], ...Q[(k + 1) % 5], PAL.ink, 0.045);
      for (let k = 0; k < 5; k++) o += Sv.C(...Q[k], 0.12, k === 0 ? PAL.B : PAL.ink);
      o += Sv.C(ox, 0, 0.06, "#9aa0a8");
      svg.innerHTML = o;
    },
  };
});

// ---------- движения T3: поворот вокруг вершины и сдвиг вдоль оси ----------
Deck.figure("t3motions", (el) => {
  let svg; const t = regularTree(3, 4);
  const pos = radialLayout(t.children, 0, (d) => d * 0.55, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
  const mark = t.children[t.children[t.children[0][0]][0]][1];
  // поддерево над вершиной оси: стебель и двоичное дерево глубины 2
  const sub = []; const grow = (x, y, d, w) => { if (d > 2) return; for (const sg of [-1, 1]) { const x2 = x + sg * w, y2 = y - 0.55; sub.push([x, y, x2, y2]); grow(x2, y2, d + 1, w / 2); } };
  sub.push([0, 0, 0, -0.55]); grow(0, -0.55, 1, 0.22);
  return {
    steps: 3, durs: [1500, 1500, 1500], holds: [1300, 700, 700, 2400], back: 2,
    init() { svg = svgHost(el, "-2.6 -2.45 15.6 5.3"); },
    draw(T) {
      let o = "";
      // поворот
      const a = (T * 2 * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
      const P = (v, ang = a) => { const p = pos.get(v); return [p[0] * Math.cos(ang) - p[1] * Math.sin(ang), -(p[0] * Math.sin(ang) + p[1] * Math.cos(ang))]; };
      for (let v = 1; v < t.n; v++) o += Sv.L(...P(v), ...P(t.parent[v]), PAL.ink, 0.035);
      for (let k = 0; k <= Math.floor(T + 1e-9); k++) o += Sv.C(...P(mark, (k * 2 * Math.PI) / 3), 0.13, "none", `stroke="${PAL.B}" stroke-width="0.04"`);
      o += Sv.C(...P(mark), 0.1, PAL.B) + Sv.C(0, 0, 0.12, PAL.R);
      o += Sv.T(0, 2.55, "поворот: орбиты ограничены", 0.36);
      // сдвиг вдоль оси
      const ox = 8.4, sh = T;
      o += `<clipPath id="axclip"><rect x="${ox - 4.4}" y="-2.4" width="10.8" height="3.6"/></clipPath><g clip-path="url(#axclip)">`;
      o += Sv.L(ox - 6, 0.6, ox + 8, 0.6, PAL.A, 0.06);
      for (let k = -6; k <= 9; k++) {
        const x = ox + k - 2 + sh;
        for (const [x1, y1, x2, y2] of sub) o += Sv.L(x + x1, 0.6 + y1, x + x2, 0.6 + y2, PAL.ink, 0.03);
        o += Sv.C(x, 0.6, 0.07, PAL.A);
      }
      for (let k = 0; k <= Math.floor(T + 1e-9); k++) o += Sv.C(ox - 2 + k, 0.6, 0.15, "none", `stroke="${PAL.B}" stroke-width="0.04"`);
      o += Sv.C(ox - 2 + sh, 0.6, 0.11, PAL.B) + "</g>";
      o += Sv.T(ox + 1, 2.55, "сдвиг: орбиты уходят на бесконечность", 0.36);
      svg.innerHTML = o;
    },
  };
});

// ---------- орбиты на Z: отражение x ↦ 1−x и сдвиг x ↦ x+1 ----------
Deck.figure("orbitsZ", (el) => {
  let svg;
  return {
    steps: 4, durs: Array(4).fill(800), holds: [1000, 500, 500, 500, 2200], back: 3,
    init() { svg = svgHost(el, "-6.8 -2.6 14.2 4.4"); },
    draw(T) {
      let o = "";
      const n = Math.floor(T + 1e-9), fr = T - n;
      for (const [y, lab] of [[-1.1, "x ↦ 1 − x"], [1.1, "x ↦ x + 1"]]) {
        o += Sv.L(-4.5, y, 6.5, y, PAL.ink, 0.05);
        for (let i = -4; i <= 6; i++) o += Sv.C(i, y, 0.09) + Sv.T(i, y + 0.45, String(i).replace("-", "−"), 0.32);
        o += Sv.T(-5.6, y, lab, 0.36, PAL.ink, 'font-style="italic"');
      }
      // отражение: точка прыгает между 0 и 1
      const pr = (k) => (k % 2 === 0 ? 0 : 1);
      const xr = pr(n) + (pr(n + 1) - pr(n)) * (fr > 0 ? fr : 0);
      const yr = -1.1 - 0.9 * Math.sin(Math.PI * (fr > 0 ? fr : 0));
      o += Sv.C(0, -1.1, 0.18, "none", `stroke="${PAL.A}" stroke-width="0.05"`) + Sv.C(1, -1.1, 0.18, "none", `stroke="${PAL.A}" stroke-width="0.05"`);
      o += Sv.C(xr, yr, 0.14, PAL.A);
      // сдвиг: точка уходит вправо, оставляя след
      for (let k = 0; k <= n; k++) o += Sv.C(k, 1.1, 0.18, "none", `stroke="${PAL.R}" stroke-width="0.05"`);
      const xs = n + (fr > 0 ? fr : 0), ys = 1.1 - 0.7 * Math.sin(Math.PI * (fr > 0 ? fr : 0));
      o += Sv.C(xs, ys, 0.14, PAL.R);
      svg.innerHTML = o;
    },
  };
});

// ---------- ограниченная орбита и её центр: дерево и плоскость ----------
Deck.figure("orbitCenter", (el) => {
  let svg; const t = regularTree(3, 4);
  const pos = radialLayout(t.children, 0, (d) => d * 0.55, Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
  // орбита поворота на 120°: по одной вершине глубины 3 в каждой ветви
  const orb = t.children[0].map((c) => t.children[t.children[c][0]][1]);
  const pathUp = (v) => { const p = []; while (v >= 0) { p.push(v); v = t.parent[v]; } return p; };
  const P = (v) => { const p = pos.get(v); return [p[0], -p[1]]; };
  return {
    steps: 3, durs: [1200, 1600, 900], holds: [1200, 900, 900, 3000], back: 2.5,
    init() { svg = svgHost(el, "-2.7 -2.5 12.4 5.7"); },
    draw(T) {
      const a1 = U.seg(T, 0, 1), a2 = U.seg(T, 1, 2), a3 = U.seg(T, 2, 3);
      let o = "";
      for (let v = 1; v < t.n; v++) o += Sv.L(...P(v), ...P(t.parent[v]), "#b9bec6", 0.03);
      if (a2 > 0) for (const v of orb) { const p = pathUp(v); for (let i = 0; i + 1 < p.length; i++) o += Sv.L(...P(p[i]), ...P(p[i + 1]), PAL.B, 0.07, `opacity="${f4(a2)}"`); }
      orb.forEach((v, i) => { const op = U.clamp(a1 * 3 - i, 0, 1); if (op > 0) o += Sv.C(...P(v), 0.14, PAL.B, `opacity="${f4(op)}"`); });
      if (a3 > 0) o += Sv.C(0, 0, 0.17, PAL.R, `opacity="${f4(a3)}"`);
      o += Sv.T(0, 2.45, "дерево:", 0.34) + Sv.T(0, 2.9, "центр орбиты — вершина", 0.34);
      // плоскость: орбита поворота на 72° и наименьший охватывающий круг
      const ox = 7.0, oy = 0, r = 1.8;
      for (let k = 0; k < 5; k++) {
        const th = 0.4 + (2 * Math.PI * k) / 5, op = U.clamp(a1 * 5 - k, 0, 1);
        if (op > 0) o += Sv.C(ox + r * Math.cos(th), oy - r * Math.sin(th), 0.12, PAL.B, `opacity="${f4(op)}"`);
      }
      if (a2 > 0) o += Sv.C(ox, oy, r * a2, "none", `stroke="${PAL.B}" stroke-width="0.05" stroke-dasharray="0.12 0.09"`);
      if (a3 > 0) o += Sv.C(ox, oy, 0.13, PAL.R, `opacity="${f4(a3)}"`);
      o += Sv.T(ox, oy + 2.3, "плоскость:", 0.34) + Sv.T(ox, oy + 2.75, "центр наименьшего круга", 0.34);
      svg.innerHTML = o;
    },
  };
});
