// ============================================================
//  «Наоборот»: Z, лестница L, Z^2, королевский граф при отдалении.
//  Шаг 1 — непрерывное отдаление, шаг 2 — переход к предельной картинке
//  (прямая, прямая, плоскость, плоскость).
// ============================================================
Deck.figure("zoomFour", (el, { canvasFor }) => {
  let C;
  const kinds = [
    { lab: "Z", o: { fam: "H", yMin: 0, yMax: 0, cY: 0 }, limit: "line" },
    { lab: "L", o: { fam: "HV", yMin: 0, yMax: 1, cY: 0.5 }, limit: "line" },
    { lab: "Z2", o: { fam: "HV", cY: 0.5 }, limit: "plane" },
    { lab: "K", o: { fam: "HVDE", cY: 0.5 }, limit: "plane" },
  ];
  return {
    steps: 2, durs: [5200, 1400], holds: [1800, 600, 2400], back: 1.5,
    init() { C = canvasFor(el); },
    resize() { C.fit(); },
    draw(T) {
      const { ctx, w, h } = C; C.clear();
      const gap = 36, side = Math.min((w - 3 * gap) / 4, h);
      const y0 = 0;
      const s = U.logl(46, 1.8, U.seg(T, 0, 1));
      const lim = U.seg(T, 1, 2);
      kinds.forEach((k, i) => {
        const r = { x: i * (side + gap) + (w - 4 * side - 3 * gap) / 2, y: y0, w: side, h: side };
        ctx.save(); clipRect(ctx, r);
        const a = 1 - lim;
        if (a > 0) drawLattice(ctx, r, { s, cX: 0.5, sh: 0, ...k.o, alpha: a * (k.limit === "plane" ? U.clamp(0.22 + s / 25, 0.25, 1) : 1) });
        if (lim > 0) {
          ctx.globalAlpha = lim;
          if (k.limit === "line") {
            ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3.2;
            ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); ctx.stroke();
          } else { ctx.fillStyle = "#b9bec6"; ctx.fillRect(r.x, r.y, r.w, r.h); }
        }
        ctx.restore();
        frameRect(ctx, r);
      });
    },
  };
});
