// ============================================================
//  Блок «Рост»: шар в Z^3 из кубиков, гонка Z^2 и T3, луч с листьями,
//  плоскость Лобачевского, лучи в доказательстве, «кактус».
// ============================================================

// ---------- шар в Z^3: кубики |x|+|y|+|z| ≤ n, медленное вращение ----------
Deck.figure("octa", (el, { canvasFor }) => {
  let C, t0 = null;
  const faces = [
    { n: [1, 0, 0], q: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]] },
    { n: [-1, 0, 0], q: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    { n: [0, 1, 0], q: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]] },
    { n: [0, -1, 0], q: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
    { n: [0, 0, 1], q: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], q: [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]] },
  ];
  const sizes = [1, 7, 25, 63];
  return {
    steps: 3, durs: [900, 900, 900], holds: [1300, 1300, 1300, 3000], back: 3, live: true,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T, now) {
      if (t0 === null) t0 = now || 0;
      const { ctx, w, h } = C; C.clear();
      const yaw = ((now || 0) - t0) * 0.00035 + 0.6, pitch = 0.5;
      const rot = ([x, y, z]) => {
        const x1 = x * Math.cos(yaw) - z * Math.sin(yaw), z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
        const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch), z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
        return [x1, y2, z2];
      };
      const n = Math.floor(T + 1e-9), fr = T - n;
      const s = Math.min(w, h) / 9.5, cx = w * 0.5, cy = h * 0.45;
      const light = [0.3, 0.8, 0.5];
      const polys = [];
      for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) for (let z = -4; z <= 4; z++) {
        const d = Math.abs(x) + Math.abs(y) + Math.abs(z);
        let sc;
        if (d <= n) sc = 0.86; else if (d === n + 1 && fr > 0) sc = 0.86 * fr; else continue;
        const base = d === n + (fr > 0 ? 1 : 0) || (fr === 0 && d === n) ? [214, 110, 20] : [31, 94, 168];
        for (const f of faces) {
          const nn = rot(f.n);
          if (nn[2] <= 0.01) continue;
          const pts = f.q.map(([a, b, c]) => rot([x + (a * sc) / 2, y + (b * sc) / 2, z + (c * sc) / 2]));
          const depth = pts.reduce((acc, p) => acc + p[2], 0) / 4;
          const lum = 0.55 + 0.45 * Math.max(0, nn[0] * light[0] + nn[1] * light[1] + nn[2] * light[2]);
          polys.push({ pts, depth, col: `rgb(${base.map((c) => Math.round(c * lum + 255 * (1 - lum) * 0.15)).join(",")})` });
        }
      }
      polys.sort((a, b) => a.depth - b.depth);
      for (const p of polys) {
        ctx.beginPath();
        p.pts.forEach((q, i) => { const X = cx + q[0] * s, Y = cy - q[1] * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.closePath(); ctx.fillStyle = p.col; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1; ctx.stroke();
      }
      const k = Math.round(T);
      ctx.fillStyle = PAL.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = '34px "PT Sans"';
      ctx.fillText(`n = ${k}:  ${sizes[k]} ${plural(sizes[k], "вершина", "вершины", "вершин")}`, w * 0.5, h - 24);
    },
  };
});

// ---------- гонка: шар в Z^2 и шар в T3 ----------
Deck.figure("race", (el, { canvasFor }) => {
  let C, t, pos;
  const NMAX = 7;
  return {
    steps: NMAX, durs: Array(NMAX).fill(700), holds: [1200, 450, 450, 450, 450, 450, 450, 3200], back: 3,
    init() {
      C = canvasFor(el);
      t = regularTree(3, NMAX);
      pos = radialLayout(t.children, 0, (d) => 1 - Math.pow(0.8, d), Math.PI / 2, Math.PI / 2 + 2 * Math.PI);
    },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const n = Math.floor(T + 1e-9), fr = T - n, k = Math.round(T);
      const side = Math.min(w / 2 - 40, h - 70);
      const L = { x: w / 4 - side / 2, y: 0, w: side, h: side }, R = { x: (3 * w) / 4 - side / 2, y: 0, w: side, h: side };
      const style = (d) => (d < n ? [PAL.A, 1] : d === n ? [PAL.B, 1] : d === n + 1 && fr > 0 ? [PAL.B, fr] : ["#c9ced6", 1]);
      // Z^2
      const s = side / 17, X = (i) => L.x + side / 2 + i * s, Y = (j) => L.y + side / 2 - j * s;
      ctx.lineWidth = 1; ctx.strokeStyle = "#e1e4e8";
      for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(X(i), Y(-8)); ctx.lineTo(X(i), Y(8)); ctx.moveTo(X(-8), Y(i)); ctx.lineTo(X(8), Y(i)); ctx.stroke(); }
      for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) {
        const [c, a] = style(Math.abs(i) + Math.abs(j));
        ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(X(i), Y(j), s * 0.2, 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
      }
      // T3
      const rr = side / 2, TX = (p) => R.x + side / 2 + p[0] * rr, TY = (p) => R.y + side / 2 - p[1] * rr;
      for (let v = 1; v < t.n; v++) {
        const p = pos.get(v), q = pos.get(t.parent[v]), d = t.dep[v];
        ctx.strokeStyle = d <= n ? PAL.A : d === n + 1 && fr > 0 ? U.rgba(PAL.B, fr) : "#dfe2e6";
        ctx.lineWidth = d <= n ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(TX(p), TY(p)); ctx.lineTo(TX(q), TY(q)); ctx.stroke();
      }
      for (let v = 0; v < t.n; v++) {
        const [c, a] = style(t.dep[v]), p = pos.get(v);
        if (t.dep[v] > n + 1 || (t.dep[v] === n + 1 && fr === 0)) continue;
        ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(TX(p), TY(p), Math.max(1.6, 6 * Math.pow(0.8, t.dep[v])), 0, 2 * Math.PI); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = PAL.ink; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = '34px "PT Sans"';
      const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
      ctx.fillText(`ℤ²:  2·${k}² + 2·${k} + 1`, L.x + side / 2, side + 18);
      ctx.fillText(`T₃:  3·2${sup[k]} − 2`, R.x + side / 2, side + 18);
      ctx.font = 'italic 34px "PT Sans"'; ctx.fillText(`n = ${k}`, w / 2, side / 2 - 17);
    },
  };
});

// ---------- луч с пучками листьев (статично) ----------
Deck.figure("leaves", (el) => ({
  steps: 0,
  init() {
    const svg = svgHost(el, "-0.5 -1.25 8.6 2.0");
    let o = Sv.L(0, 0, 7.7, 0, PAL.ink, 0.04, 'stroke-dasharray="0 0"');
    for (let n = 0; n <= 6; n++) {
      for (let k = 1; k <= n; k++) {
        const a = ((90 + (k - (n + 1) / 2) * Math.min(22, 110 / n)) * Math.PI) / 180;
        const p = [n + 0.6 * Math.cos(a), -0.6 * Math.sin(a)];
        o += Sv.L(n, 0, p[0], p[1], PAL.B, 0.03) + Sv.C(p[0], p[1], 0.045, PAL.B);
      }
      o += Sv.C(n, 0, 0.07) + Sv.T(n, 0.35, String(n), 0.26);
    }
    svg.innerHTML = o;
  },
  draw() {},
}));

// ---------- плоскость Лобачевского: разбиение {7,3} в круге Пуанкаре ----------
Deck.figure("lobachevsky", (el) => {
  let svg, tiles = [], paths = [], layerCount = [];
  const LMAX = 6, RD = 4, DARK = "#1f3f7a";
  const hx = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return `rgb(${A.map((x, i) => Math.round(x + (B[i] - x) * t)).join(",")})`; };
  const cx = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const n2 = (a) => a[0] * a[0] + a[1] * a[1];
  // окружность через три точки
  const circ = (a, b, c) => {
    const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    const ux = (n2(a) * (b[1] - c[1]) + n2(b) * (c[1] - a[1]) + n2(c) * (a[1] - b[1])) / d;
    const uy = (n2(a) * (c[0] - b[0]) + n2(b) * (a[0] - c[0]) + n2(c) * (b[0] - a[0])) / d;
    return [[ux, uy], Math.sqrt(n2(sub(a, [ux, uy])))];
  };
  // геодезическая через a, b: окружность, ортогональная краю, или диаметр (тогда c = null, r — направление)
  const geo = (a, b) => {
    if (Math.abs(a[0] * b[1] - a[1] * b[0]) < 1e-10) { const l = Math.sqrt(n2(a)) || Math.sqrt(n2(b)); const u = n2(a) > 1e-12 ? a : b; return [null, [u[0] / Math.sqrt(n2(u)), u[1] / Math.sqrt(n2(u))]]; }
    return circ(a, b, [a[0] / n2(a), a[1] / n2(a)]);
  };
  const refl = (z, c, r) => {
    if (c === null) { const k = 2 * (z[0] * r[0] + z[1] * r[1]); return [k * r[0] - z[0], k * r[1] - z[1]]; }
    const d = sub(z, c), k = (r * r) / n2(d); return cx(c, [d[0] * k, d[1] * k]);
  };
  return {
    steps: LMAX, durs: Array(LMAX).fill(900), holds: [1200, 700, 700, 700, 700, 700, 3200], back: 3,
    init() {
      svg = svgHost(el, `${-RD - 0.2} ${-RD - 0.2} ${2 * RD + 0.4} ${2 * RD + 1.5}`);
      const ch = Math.cosh, r = Math.acosh((1 / Math.tan(Math.PI / 7)) * (1 / Math.tan(Math.PI / 3)));
      const rho = Math.tanh(r / 2);
      const t0 = []; for (let k = 0; k < 7; k++) { const a = Math.PI / 2 + (2 * Math.PI * k) / 7; t0.push([rho * Math.cos(a), rho * Math.sin(a)]); }
      const key = (t) => { const c = t.reduce((s, p) => [s[0] + p[0] / 7, s[1] + p[1] / 7], [0, 0]); return Math.round(c[0] * 1e5) + "," + Math.round(c[1] * 1e5); };
      const seen = new Map([[key(t0), 0]]);
      tiles = [{ v: t0, layer: 0 }];
      let frontier = [0];
      for (let L = 1; L <= LMAX; L++) {
        const nf = [];
        for (const i of frontier) {
          const v = tiles[i].v;
          for (let k = 0; k < 7; k++) {
            const a = v[k], b = v[(k + 1) % 7];
            const [c, rr] = geo(a, b);
            const nv = v.map((z) => refl(z, c, rr));
            const kk = key(nv);
            if (seen.has(kk)) continue;
            seen.set(kk, tiles.length); nf.push(tiles.length); tiles.push({ v: nv, layer: L });
          }
        }
        frontier = nf;
      }
      for (let L = 0; L <= LMAX; L++) layerCount[L] = tiles.filter((t) => t.layer === L).length;
      let o = `<circle cx="0" cy="0" r="${RD}" fill="#f6f7f9" stroke="${PAL.ink}" stroke-width="0.03"/>`;
      svg.innerHTML = o;
      for (const t of tiles) {
        const P = t.v.map((p) => [p[0] * RD, -p[1] * RD]);
        if (Math.max(...t.v.map((p) => Math.sqrt(n2(p)))) > 0.9995) continue;
        let d = `M${f4(P[0][0])} ${f4(P[0][1])}`;
        for (let k = 0; k < 7; k++) {
          const a = t.v[k], b = t.v[(k + 1) % 7], [c, rr] = geo(a, b);
          const A = P[k], B = P[(k + 1) % 7];
          if (c === null) { d += ` L${f4(B[0])} ${f4(B[1])}`; continue; }
          const Cc = [c[0] * RD, -c[1] * RD];
          const cr = (A[0] - Cc[0]) * (B[1] - Cc[1]) - (A[1] - Cc[1]) * (B[0] - Cc[0]);
          d += ` A${f4(rr * RD)} ${f4(rr * RD)} 0 0 ${cr > 0 ? 1 : 0} ${f4(B[0])} ${f4(B[1])}`;
        }
        const el2 = document.createElementNS(SVGNS, "path");
        el2.setAttribute("d", d + " Z"); el2.setAttribute("stroke", PAL.ink); el2.setAttribute("stroke-width", "0.018"); el2.setAttribute("fill", "#f6f7f9");
        svg.appendChild(el2); paths.push({ el: el2, layer: t.layer });
      }
      this.lab = document.createElementNS(SVGNS, "g"); svg.appendChild(this.lab);
    },
    draw(T) {
      const n = Math.floor(T + 1e-9), fr = T - n, k = Math.round(T);
      for (const p of paths) {
        let fill = "#f6f7f9";
        // внутренность шара — светло-синяя, последний добавленный слой — тёмно-синий
        if (p.layer < n) fill = "#9db8dc";
        else if (p.layer === n) fill = fr > 0 ? mix(DARK, "#9db8dc", fr) : DARK;
        else if (p.layer === n + 1 && fr > 0) fill = mix("#f6f7f9", DARK, fr);
        p.el.setAttribute("fill", fill);
      }
      let tot = 0; for (let j = 0; j <= k; j++) tot += layerCount[j];
      this.lab.innerHTML = `<text x="0" y="${RD + 0.85}" font-size="0.5" text-anchor="middle">n = ${k}:  ${tot} ${plural(tot, "плитка", "плитки", "плиток")}</text>`;
    },
    counts() { return layerCount; },
  };
});

// ---------- доказательство: шар доходит до 2C+1 лучей и ползёт по ним ----------
Deck.figure("raysProof", (el) => {
  let svg; const XS = [-4, -2, 0, 2, 4], TOP = 11, RMAX = 13, Cc = 2;
  // граф: v=(0,0); путь y=1 от x=−4 до 4; v–(0,1); лучи x∈XS от y=2 вверх (и ребро (x,1)–(x,2))
  const V = [], key = (x, y) => x + "," + y, adj = new Map();
  const add = (a, b) => { for (const [p, q] of [[a, b], [b, a]]) { if (!adj.has(key(...p))) adj.set(key(...p), []); adj.get(key(...p)).push(q); } };
  add([0, 0], [0, 1]);
  for (let x = -4; x < 4; x++) add([x, 1], [x + 1, 1]);
  for (const x of XS) for (let y = 1; y < 40; y++) add([x, y], [x, y + 1]);
  const dist = new Map([[key(0, 0), 0]]); const q = [[0, 0]];
  while (q.length) { const p = q.shift(); for (const r of adj.get(key(...p))) if (!dist.has(key(...r))) { dist.set(key(...r), dist.get(key(...p)) + 1); q.push(r); } }
  const f = (R) => [...dist.values()].filter((d) => d <= R).length;
  return {
    steps: RMAX, durs: Array(RMAX).fill(380), linear: Array(RMAX).fill(true), holds: [1000, ...Array(RMAX - 1).fill(120), 3000], back: 4,
    init() { svg = svgHost(el, "-5.6 -12.4 12.2 25.0"); },
    draw(T) {
      const R = T;
      let o = "";
      const col = (d) => (d <= R ? PAL.A : "#c9ced6");
      const seen = new Set();
      for (const [k, list] of adj) {
        const [x, y] = k.split(",").map(Number);
        if (y > TOP) continue;
        for (const [x2, y2] of list) {
          if (y2 > TOP || seen.has(key(x2, y2) + "|" + k)) continue; seen.add(k + "|" + key(x2, y2));
          const d = Math.max(dist.get(k), dist.get(key(x2, y2)));
          o += Sv.L(x, -y, x2, -y2, col(d), 0.08);
        }
      }
      for (const [k, d] of dist) { const [x, y] = k.split(",").map(Number); if (y <= TOP) o += Sv.C(x, -y, 0.13, col(d)); }
      o += Sv.C(0, 0, 0.2, PAL.R) + Sv.T(0.65, 0.2, "v", 0.85, PAL.R, 'font-style="italic"');
      for (const x of XS) o += Sv.L(x, -TOP - 0.1, x, -TOP - 0.7, "#9aa0a8", 0.06, 'stroke-dasharray="0.12 0.1"');
      // график f(n) и прямая 2n — под картинкой
      const gx = -4.4, gy = 11.6, sx = 0.72, sy = 0.13;
      o += Sv.L(gx, gy, gx + RMAX * sx + 0.3, gy, PAL.ink, 0.04) + Sv.L(gx, gy, gx, gy - 70 * sy, PAL.ink, 0.04);
      o += Sv.L(gx, gy, gx + RMAX * sx, gy - Cc * RMAX * sy, PAL.R, 0.06);
      o += `<text x="${gx + RMAX * sx + 0.15}" y="${gy - Cc * RMAX * sy}" font-size="0.8" fill="${PAL.R}" font-style="italic">2n</text>`;
      for (let r = 0; r <= Math.floor(R); r++) o += Sv.C(gx + r * sx, gy - f(r) * sy, 0.14, PAL.A);
      o += `<text x="${gx + 0.3}" y="${gy - 66 * sy}" font-size="0.8" font-style="italic">f(n)</text>`;
      o += `<text x="${gx + RMAX * sx}" y="${gy + 0.9}" font-size="0.8" font-style="italic" text-anchor="end">n</text>`;
      const k = Math.floor(R);
      o += `<text x="${gx + 2.2}" y="${gy - 62 * sy}" font-size="0.9" fill="${PAL.A}">f(${k}) = ${f(k)}</text>`;
      svg.innerHTML = o;
    },
  };
});

// ---------- «кактус»: луч v0 v1 …, у v_n — стебель и двоичное дерево глубины n−1 ----------
Deck.figure("cactus", (el) => {
  let svg; const NDRAW = 6, RMAX = 10, gap = 0.34, lev = 0.62;
  // настоящий граф для подсчёта шара (до n = 14)
  const adj = []; const addV = () => (adj.push([]), adj.length - 1); const addE = (a, b) => { adj[a].push(b); adj[b].push(a); };
  const spine = [addV()]; const draw = [];   // draw: {x,y,id,parent}
  const xs = [0]; let xcur = 0;
  for (let n = 1; n <= 14; n++) {
    const W = 2 ** (n - 1) * gap, Wp = n > 1 ? 2 ** (n - 2) * gap : 0;
    xcur += Math.max(1, (W + Wp) / 2 + 0.5); xs.push(xcur);
    const v = addV(); addE(spine[n - 1], v); spine.push(v);
    const root = addV(); addE(v, root);
    if (n <= NDRAW) draw.push({ x: xcur, y: lev, id: root, p: v, px: xcur, py: 0 });
    let level = [{ id: root, x: xcur }];
    for (let d = 1; d <= n - 1; d++) {
      const nl = [], span = 2 ** (n - 1 - d) * gap / 2;
      for (const u of level) for (const sgn of [-1, 1]) {
        const c = addV(); addE(u.id, c);
        const cx2 = u.x + sgn * span;
        if (n <= NDRAW) draw.push({ x: cx2, y: lev * (d + 1), id: c, p: u.id, px: u.x, py: lev * d });
        nl.push({ id: c, x: cx2 });
      }
      level = nl;
    }
  }
  const dist = new Array(adj.length).fill(Infinity); dist[spine[0]] = 0; const q = [spine[0]];
  while (q.length) { const u = q.shift(); for (const w of adj[u]) if (dist[w] === Infinity) { dist[w] = dist[u] + 1; q.push(w); } }
  const f = (R) => dist.filter((d) => d <= R).length;
  return {
    steps: RMAX, durs: Array(RMAX).fill(600), holds: [1200, ...Array(RMAX - 1).fill(350), 3200], back: 3,
    init() { svg = svgHost(el, `-0.8 ${-lev * (NDRAW + 1) - 0.5} ${xs[NDRAW] + 2 ** (NDRAW - 1) * gap / 2 + 3} ${lev * (NDRAW + 1) + 1.6}`); },
    draw(T) {
      const R = T, col = (d) => (d <= R ? PAL.A : "#c9ced6");
      let o = "";
      const xEnd = xs[NDRAW] + 2 ** (NDRAW - 1) * gap / 2 + 1.5;
      o += Sv.L(xs[NDRAW], 0, xEnd, 0, "#9aa0a8", 0.05, 'stroke-dasharray="0.15 0.12"');
      for (let n = 0; n < NDRAW; n++) o += Sv.L(xs[n], 0, xs[n + 1], 0, col(dist[spine[n + 1]]), 0.07);
      for (const d of draw) o += Sv.L(d.px, -d.py, d.x, -d.y, col(dist[d.id]), 0.045);
      for (const d of draw) o += Sv.C(d.x, -d.y, 0.075, col(dist[d.id]));
      for (let n = 0; n <= NDRAW; n++) {
        o += Sv.C(xs[n], 0, 0.11, col(dist[spine[n]]));
        o += `<text x="${xs[n]}" y="0.75" font-size="0.6" text-anchor="middle" font-style="italic">v${["₀", "₁", "₂", "₃", "₄", "₅", "₆"][n]}</text>`;
      }
      const k = Math.floor(R);
      o += `<text x="0" y="${-lev * (NDRAW + 0.2)}" font-size="0.75" fill="${PAL.A}">R = ${k}:  #<tspan font-weight="bold">B</tspan>(v₀, R) = ${f(k)}</text>`;
      svg.innerHTML = o;
    },
  };
});
