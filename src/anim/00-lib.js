// ============================================================
//  Общие утилиты рисунков: палитра, интерполяция, решётки на холсте.
// ============================================================
const PAL = {
  A: "rgb(31,94,168)", B: "rgb(214,110,20)", R: "rgb(190,30,45)",
  ink: "#1d1d1f", frame: "#c9ced6", gray: "#9aa0a8",
};
const U = {
  lerp: (a, b, t) => a + (b - a) * t,
  clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
  // доля пройденного отрезка [a,b] параметра T
  seg: (T, a, b) => Math.max(0, Math.min(1, (T - a) / (b - a))),
  sm: (u) => u * u * (3 - 2 * u),
  // логарифмическая интерполяция масштаба (равномерное «отдаление»)
  logl: (a, b, t) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t),
  rgba: (rgb, a) => rgb.replace("rgb(", "rgba(").replace(")", "," + a + ")"),
};

// Рамка окна с лёгким скруглением
function frameRect(ctx, r) {
  ctx.save();
  ctx.strokeStyle = PAL.frame; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.stroke();
  ctx.restore();
}
function clipRect(ctx, r) { ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 10); ctx.clip(); }

// ------------------------------------------------------------
//  Решётка на плоскости в окне r.
//  Вершины (x,y) ∈ Z^2 рисуются в точке (X,Y) = (x + sh*y, y), sh — сдвиг (0 — без сдвига).
//  Масштаб s пикселей на единицу, (cX,cY) — центр окна в координатах (X,Y).
//  fam: какие семейства рёбер рисовать: "H" (1,0), "V" (0,1), "D" (1,1), "E" (1,-1).
//  Рёбра рисуются как длинные прямые — быстро даже при очень мелком масштабе.
// ------------------------------------------------------------
function drawLattice(ctx, r, o) {
  const { s, cX, cY, sh = 0, fam = "HV", color = PAL.ink, alpha = 1, yMin = -Infinity, yMax = Infinity } = o;
  const toS = (X, Y) => [r.x + r.w / 2 + (X - cX) * s, r.y + r.h / 2 - (Y - cY) * s];
  const halfW = r.w / 2 / s + 2, halfH = r.h / 2 / s + 2;
  const Y0 = Math.max(Math.floor(cY - halfH), yMin), Y1 = Math.min(Math.ceil(cY + halfH), yMax);
  if (Y1 < Y0) return;
  const lw = o.lw ?? U.clamp(0.055 * s, 0.35, 2.4);
  ctx.save();
  ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = lw;
  ctx.beginPath();
  const seg = (X1, Ya, X2, Yb) => { const p = toS(X1, Ya), q = toS(X2, Yb); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
  // горизонтали: Y = y
  if (fam.includes("H")) for (let y = Y0; y <= Y1; y++) seg(cX - halfW, y, cX + halfW, y);
  // семейства с наклоном: X = k + m*Y, Y от Y0 до Y1
  const slanted = (m) => {
    const kmin = Math.floor(cX - halfW - Math.abs(m) * Math.max(Math.abs(Y0), Math.abs(Y1)) - 2);
    const kmax = Math.ceil(cX + halfW + Math.abs(m) * Math.max(Math.abs(Y0), Math.abs(Y1)) + 2);
    for (let k = kmin; k <= kmax; k++) {
      const Xa = k + m * Y0, Xb = k + m * Y1;
      if (Math.max(Xa, Xb) < cX - halfW || Math.min(Xa, Xb) > cX + halfW) continue;
      seg(Xa, Y0, Xb, Y1);
    }
  };
  if (Y1 > Y0) {
    if (fam.includes("V")) slanted(sh);            // (x,y)→(x,y+1)
    if (fam.includes("D")) slanted(1 + sh);        // (x,y)→(x+1,y+1): X = (x−y) + (1+sh)Y
    if (fam.includes("E")) slanted(-(1 - sh));     // (x,y)→(x+1,y−1): X = (x+y) − (1−sh)Y
  }
  ctx.stroke();
  // вершины — только когда они различимы
  const dotA = U.clamp((s - 5) / 5, 0, 1);
  if (dotA > 0 && o.dots !== false) {
    ctx.fillStyle = o.dotColor || color; ctx.globalAlpha = alpha * dotA;
    const rad = o.rad ?? Math.max(1.2, 0.1 * s);
    ctx.beginPath();
    for (let y = Y0; y <= Y1; y++) {
      const x0 = Math.floor(cX - halfW - sh * y), x1 = Math.ceil(cX + halfW - sh * y);
      for (let x = x0; x <= x1; x++) { const p = toS(x + sh * y, y); ctx.moveTo(p[0] + rad, p[1]); ctx.arc(p[0], p[1], rad, 0, 2 * Math.PI); }
    }
    ctx.fill();
  }
  ctx.restore();
}

// Небольшая наконечник-стрелка в точке (x,y) по направлению angle
function arrowHead(ctx, x, y, ang, size) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(ang - 0.45), y - size * Math.sin(ang - 0.45));
  ctx.lineTo(x - size * Math.cos(ang + 0.45), y - size * Math.sin(ang + 0.45));
  ctx.closePath(); ctx.fill();
}

// ------------------------------------------------------------
//  SVG: рисунок перестраивается строкой на каждом кадре (элементов немного).
// ------------------------------------------------------------
const SVGNS = "http://www.w3.org/2000/svg";
function svgHost(el, vb) {
  const s = document.createElementNS(SVGNS, "svg");
  s.setAttribute("viewBox", vb);
  s.setAttribute("preserveAspectRatio", "xMidYMid meet");
  s.setAttribute("font-family", '"PT Sans", sans-serif');
  el.appendChild(s);
  return s;
}
const f4 = (x) => (Math.round(x * 1e4) / 1e4).toString();
const Sv = {
  L: (x1, y1, x2, y2, c = PAL.ink, w = 0.05, ex = "") =>
    `<line x1="${f4(x1)}" y1="${f4(y1)}" x2="${f4(x2)}" y2="${f4(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${ex}/>`,
  C: (x, y, r, fill = PAL.ink, ex = "") => `<circle cx="${f4(x)}" cy="${f4(y)}" r="${f4(r)}" fill="${fill}" ${ex}/>`,
  P: (d, c = PAL.ink, w = 0.05, fill = "none", ex = "") =>
    `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round" ${ex}/>`,
  T: (x, y, s, size, fill = PAL.ink, ex = "") =>
    `<text x="${f4(x)}" y="${f4(y)}" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="middle" ${ex}>${s}</text>`,
  poly: (pts) => "M" + pts.map((p) => f4(p[0]) + " " + f4(p[1])).join(" L") ,
};

// ------------------------------------------------------------
//  Деревья: корневое дерево степени deg (у корня deg детей, у остальных deg−1)
//  и радиальная укладка по секторам, пропорциональным числу листьев.
// ------------------------------------------------------------
function regularTree(deg, depth) {
  const parent = [-1], dep = [0], children = [[]];
  let frontier = [0];
  for (let d = 1; d <= depth; d++) {
    const nf = [];
    for (const v of frontier) {
      const k = v === 0 ? deg : deg - 1;
      for (let i = 0; i < k; i++) {
        const u = parent.length; parent.push(v); dep.push(d); children.push([]); children[v].push(u); nf.push(u);
      }
    }
    frontier = nf;
  }
  return { parent, dep, children, n: parent.length };
}
function radialLayout(children, root, radius, a0 = 0, a1 = 2 * Math.PI, rootPos = [0, 0]) {
  const leaves = new Map();
  const cnt = (v) => { let s = 0; for (const c of children[v]) s += cnt(c); s = Math.max(1, s); leaves.set(v, s); return s; };
  cnt(root);
  const pos = new Map([[root, rootPos]]);
  const place = (v, d, lo, hi) => {
    let a = lo; const tot = leaves.get(v);
    for (const c of children[v]) {
      const span = ((hi - lo) * leaves.get(c)) / tot, am = a + span / 2;
      pos.set(c, [radius(d + 1) * Math.cos(am), radius(d + 1) * Math.sin(am)]);
      place(c, d + 1, a, a + span); a += span;
    }
  };
  place(root, 0, a0, a1);
  return pos;
}

// Русское согласование: plural(5, "вершина", "вершины", "вершин") → "вершин"
function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}

// ------------------------------------------------------------
//  Гексагональная решётка в окне r: вершины (i,y) ∈ Z^2,
//  X = (i ± 1/6)·a, Y = y·a/√3 (знак + при нечётном i+y); ребро длины 2a/3.
//  Рёбра: (i,y)–(i,y+1) всегда, (i,y)–(i+1,y) при нечётном i+y.
// ------------------------------------------------------------
function drawHex(ctx, r, o) {
  const { s, cX = 0, cY = 0, a = 1.3, color = PAL.ink, alpha = 1 } = o;
  const hy = a / Math.sqrt(3), odd = (k) => ((k % 2) + 2) % 2 === 1;
  const P = (i, y) => [r.x + r.w / 2 + ((i + (odd(i + y) ? 1 : -1) / 6) * a - cX) * s, r.y + r.h / 2 - (y * hy - cY) * s];
  const i0 = Math.floor((cX - r.w / 2 / s) / a) - 2, i1 = Math.ceil((cX + r.w / 2 / s) / a) + 2;
  const y0 = Math.floor((cY - r.h / 2 / s) / hy) - 2, y1 = Math.ceil((cY + r.h / 2 / s) / hy) + 2;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = o.lw ?? U.clamp(0.055 * s, 0.35, 2.4);
  ctx.beginPath();
  for (let i = i0; i <= i1; i++) for (let y = y0; y <= y1; y++) {
    const p = P(i, y), q = P(i, y + 1);
    ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
    if (odd(i + y)) { const t = P(i + 1, y); ctx.moveTo(p[0], p[1]); ctx.lineTo(t[0], t[1]); }
  }
  ctx.stroke();
  const dotA = U.clamp((s - 5) / 5, 0, 1);
  if (dotA > 0) {
    ctx.fillStyle = color; ctx.globalAlpha = alpha * dotA; const rad = Math.max(1.2, 0.1 * s);
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) for (let y = y0; y <= y1; y++) { const p = P(i, y); ctx.moveTo(p[0] + rad, p[1]); ctx.arc(p[0], p[1], rad, 0, 2 * Math.PI); }
    ctx.fill();
  }
  ctx.restore();
}
