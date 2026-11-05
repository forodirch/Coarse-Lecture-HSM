// ============================================================
//  Движок презентации: слайды, пошаговые появления, анимации.
//  Слайд: <section class="slide">; весь текст виден сразу, шагов нет.
//  Рисунок: <div class="fig" data-fig="имя">; пока слайд открыт, его анимация
//  идёт по кругу: этапы 0 → N с паузами, затем обратно, и так бесконечно.
// ============================================================
const Deck = (() => {
  const W = 1600, H = 900;
  const registry = {};          // имя рисунка -> фабрика
  let slides = [], cur = 0, scale = 1;

  const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function figure(name, factory) { registry[name] = factory; }

  // --- холст в логических координатах слайда (CSS-пиксели до масштабирования) ---
  function canvasFor(el) {
    const cv = document.createElement("canvas");
    el.appendChild(cv);
    const ctx = cv.getContext("2d");
    const api = { cv, ctx, w: 0, h: 0 };
    api.fit = () => {
      const r = el.getBoundingClientRect();
      api.w = r.width / scale; api.h = r.height / scale;
      const k = scale * (window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(api.w * k)); cv.height = Math.max(1, Math.round(api.h * k));
      ctx.setTransform(k, 0, 0, k, 0, 0);
    };
    api.clear = () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); };
    return api;
  }

  // --- экземпляр рисунка на слайде: бесконечная анимация «туда и обратно» ---
  // Рисунок задаёт steps (число этапов N), durs[k] — длительность перехода k → k+1,
  // holds[k] — пауза в состоянии k (k = 0..N), linear[k] — переход без сглаживания,
  // back — во сколько раз быстрее проигрывать обратный путь.
  class Fig {
    constructor(el) {
      this.el = el;
      const f = registry[el.dataset.fig];
      if (!f) throw new Error("нет рисунка " + el.dataset.fig);
      this.impl = f(el, { canvasFor, ease, clamp });
      this.N = this.impl.steps || 0;
      this.T = 0; this.raf = 0; this.ready = false;
      this.timeline = this.buildTimeline();
    }
    buildTimeline() {
      const I = this.impl, N = this.N, segs = [];
      const hold = (k) => (I.holds && I.holds[k] !== undefined ? I.holds[k] : (k === 0 || k === N ? 1800 : 1100));
      const back = I.back || 1;
      for (let k = 0; k < N; k++) {
        segs.push({ hold: true, T: k, dur: hold(k) });
        segs.push({ from: k, to: k + 1, dur: (I.durs && I.durs[k]) || 1200, lin: I.linear && I.linear[k] });
      }
      segs.push({ hold: true, T: N, dur: hold(N) });
      for (let k = N - 1; k >= 0; k--) {
        segs.push({ from: k + 1, to: k, dur: ((I.durs && I.durs[k]) || 1200) / back, lin: I.linear && I.linear[k] });
        if (k > 0) segs.push({ hold: true, T: k, dur: hold(k) });
      }
      const period = segs.reduce((a, g) => a + g.dur, 0);
      return { segs, period };
    }
    ensure() { if (!this.ready) { this.impl.init && this.impl.init(); this.ready = true; } }
    resize() { if (this.ready) { this.impl.resize && this.impl.resize(); this.impl.draw(this.T); } }
    T_at(t) {
      const { segs, period } = this.timeline;
      if (period <= 0) return 0;
      t = t % period;
      for (const g of segs) {
        if (t < g.dur) {
          if (g.hold) return g.T;
          const u = t / g.dur;
          return g.from + (g.to - g.from) * (g.lin ? u : ease(u));
        }
        t -= g.dur;
      }
      return 0;
    }
    play() {
      this.ensure(); this.stop();
      this.impl.resize && this.impl.resize();
      if (this.N === 0 && !this.impl.live) { this.T = 0; this.impl.draw(0); return; }
      const t0 = performance.now();
      let last = -1;
      const tick = (now) => {
        const T = this.T_at(now - t0);
        if (T !== last || this.impl.live) { this.T = T; this.impl.draw(T, now); last = T; }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; }
  }

  function show(i) {
    const prev = slides[cur];
    if (prev && i !== cur) { prev.classList.remove("active"); prev._figs.forEach((f) => f.stop()); }
    cur = i;
    const sl = slides[cur];
    sl.classList.add("active");
    sl._figs.forEach((f) => f.play());
    history.replaceState(null, "", "#" + (cur + 1));
  }
  const next = () => { if (cur < slides.length - 1) show(cur + 1); };
  const prev = () => { if (cur > 0) show(cur - 1); };

  function fit() {
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    document.getElementById("deck").style.transform = `scale(${scale})`;
    if (slides[cur]) slides[cur]._figs.forEach((f) => f.resize());
  }

  function start() {
    slides = [...document.querySelectorAll(".slide")];
    slides.forEach((sl, i) => {
      sl._figs = [...sl.querySelectorAll(".fig[data-fig]")].map((el) => new Fig(el));
      const num = document.createElement("div");
      num.className = "num"; num.textContent = i + 1;
      if (i > 0) sl.appendChild(num);
    });
    fit();
    window.addEventListener("resize", fit);
    document.addEventListener("keydown", (e) => {
      const k = e.key;
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter", "n"].includes(k)) { e.preventDefault(); next(); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace", "p"].includes(k)) { e.preventDefault(); prev(); }
      else if (k === "Home") show(0);
      else if (k === "End") show(slides.length - 1);
      else if (k === "f" || k === "F" || k === "а" || k === "А") {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
      } else if (k === "h" || k === "H" || k === "р" || k === "Р") {
        const h = document.getElementById("help"); h.hidden = !h.hidden;
      }
    });
    document.getElementById("stage").addEventListener("click", (e) => { if (!e.target.closest("a")) next(); });
    document.getElementById("stage").addEventListener("contextmenu", (e) => { e.preventDefault(); prev(); });
    const n = parseInt(location.hash.slice(1), 10);
    // слайды показываем после загрузки шрифтов, чтобы рисунки знали свои размеры
    const go = () => { fit(); show(n >= 1 && n <= slides.length ? n - 1 : 0); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }

  return { figure, start, ease, clamp };
})();
