// בונה את האתר: מרכיב כל עמוד מ-src/pages עם התבנית המשותפת (src/layout.html) ומעתיק נכסים ל-dist.
// הרצה: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const OUT = "dist";
// כשיהיה דומיין – לעדכן כאן (משמש ל-canonical, sitemap ו-Open Graph)
const SITE_URL = process.env.SITE_URL || "";
// תת-נתיב לאתר תצוגה (למשל GitHub Pages: /rachel-site). ריק באתר הסופי.
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
// אתר תצוגה – לא לאינדוקס בגוגל
const PREVIEW = process.env.PREVIEW === "1";

const layout = readFileSync(join(SRC, "layout.html"), "utf8");
const partials = Object.fromEntries(
  readdirSync(join(SRC, "partials")).map((f) => [f.replace(/\.html$/, ""), readFileSync(join(SRC, "partials", f), "utf8")])
);

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
for (const f of ["_redirects", "robots.txt"]) if (existsSync(join(SRC, f))) cpSync(join(SRC, f), join(OUT, f));

const urls = [];
for (const file of readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html"))) {
  let raw = readFileSync(join(SRC, "pages", file), "utf8");
  const m = raw.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\s*/);
  if (!m) throw new Error(`${file}: missing front-matter comment`);
  const meta = JSON.parse(m[1]);
  let body = raw.slice(m[0].length);
  // partials inside pages: {{> name}}
  body = body.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partials[n] ?? "");

  const path = file === "index.html" ? "/" : "/" + file.replace(/\.html$/, "");
  if (!meta.noindex) urls.push(path);

  let html = layout
    .replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partials[n] ?? "")
    .replaceAll("{{title}}", meta.title)
    .replaceAll("{{description}}", meta.description || "")
    .replaceAll("{{bodyClass}}", meta.bodyClass || "")
    .replaceAll("{{robots}}", meta.noindex || PREVIEW ? "noindex" : "index,follow")
    .replaceAll("{{canonical}}", SITE_URL ? `<link rel="canonical" href="${SITE_URL}${path}">` : "")
    .replaceAll("{{ogUrl}}", SITE_URL ? `<meta property="og:url" content="${SITE_URL}${path}">` : "")
    .replaceAll("{{ogImage}}", (SITE_URL || "") + "/assets/img/og-image.jpg")
    .replace("{{content}}", body);
  // סימון הקישור הפעיל בתפריט
  html = html.replace(/data-nav="([\w-]+)"/g, (s, k) => (k === meta.nav ? `${s} aria-current="page"` : s));
  // קישורים פנימיים מוחלטים ("/...") מקבלים את תת-הנתיב
  if (BASE_PATH) {
    html = html
      .replace(/(\s(?:href|src|srcset|action|content))="\/(?!\/)/g, `$1="${BASE_PATH}/`)
      .replace(/"image": "\//g, `"image": "${BASE_PATH}/`);
  }
  writeFileSync(join(OUT, file), html);
  console.log("built", file);
}

if (SITE_URL) {
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  writeFileSync(join(OUT, "sitemap.xml"), sm);
}
console.log("done →", OUT);
