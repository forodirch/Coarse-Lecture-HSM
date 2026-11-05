// Сборка презентации в один автономный HTML-файл.
// Формулы ($...$, $$...$$) рендерятся KaTeX на этапе сборки; шрифты, стили и скрипты
// встраиваются в файл. Запуск: node build.mjs  ->  dist/lecture.html
import fs from "node:fs";
import path from "node:path";
import katex from "katex";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString("base64");

// --- макросы, общие для всех формул ---
const macros = {
  "\\Z": "\\mathbb{Z}",
  "\\N": "\\mathbb{N}",
  "\\R": "\\mathbb{R}",
  "\\Lad": "L",
  "\\Ball": "\\mathbf{B}",
};

function renderMath(src) {
  // $$...$$ — выключные, $...$ — строчные; \$ — литерал
  src = src.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) =>
    katex.renderToString(tex, { displayMode: true, macros, throwOnError: true }));
  src = src.replace(/(?<!\\)\$([^$]+?)(?<!\\)\$/g, (_, tex) =>
    katex.renderToString(tex, { displayMode: false, macros, throwOnError: true }));
  return src.replace(/\\\$/g, "$");
}

// --- KaTeX CSS со встроенными woff2-шрифтами ---
const KDIR = "node_modules/katex/dist";
let katexCss = rd(`${KDIR}/katex.min.css`);
katexCss = katexCss.replace(/src:url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*/g,
  (_, name) => `src:url(data:font/woff2;base64,${b64(`${KDIR}/fonts/${name}.woff2`)}) format("woff2")`);

// --- PT Sans: кириллица и латиница ---
const FDIR = "node_modules/@fontsource/pt-sans/files";
let fontCss = "";
for (const sub of ["cyrillic", "latin"]) {
  for (const [w, st] of [[400, "normal"], [700, "normal"], [400, "italic"], [700, "italic"]]) {
    fontCss += `@font-face{font-family:"PT Sans";font-style:${st};font-weight:${w};font-display:block;` +
      `src:url(data:font/woff2;base64,${b64(`${FDIR}/pt-sans-${sub}-${w}-${st}.woff2`)}) format("woff2");}\n`;
  }
}

// --- слайды и скрипты ---
const slides = renderMath(rd("src/slides.html"));
const anims = fs.readdirSync(path.join(ROOT, "src/anim")).filter((f) => f.endsWith(".js")).sort()
  .map((f) => `// ==== ${f} ====\n` + rd(`src/anim/${f}`)).join("\n");

let html = rd("src/template.html")
  .replace("/*FONTS*/", () => fontCss)
  .replace("/*KATEX*/", () => katexCss)
  .replace("/*STYLE*/", () => rd("src/style.css"))
  .replace("<!--SLIDES-->", () => slides)
  .replace("/*ENGINE*/", () => rd("src/engine.js"))
  .replace("/*ANIMS*/", () => anims);

fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "dist/lecture.html"), html);
console.log("dist/lecture.html", (html.length / 1024).toFixed(0), "KiB");
