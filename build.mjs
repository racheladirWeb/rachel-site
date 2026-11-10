// בונה את האתר: מרכיב כל עמוד מ-src/pages עם התבנית המשותפת (src/layout.html) ומעתיק נכסים ל-dist.
// מאמרים ב-src/articles נבנים לעמודים ב-/knowledge/<שם-הקובץ>, ורשימתם נכנסת לעמוד knowledge.html.
// הרצה: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

const SRC = "src";
const OUT = "dist";
// כשיהיה דומיין – לעדכן כאן (משמש ל-canonical, sitemap ו-Open Graph)
const SITE_URL = process.env.SITE_URL || "";
// תת-נתיב לאתר תצוגה (למשל GitHub Pages: /rachel-site). ריק באתר הסופי.
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
// אתר תצוגה – לא לאינדוקס בגוגל
const PREVIEW = process.env.PREVIEW === "1";

// גרסה לפי תוכן הקבצים – כל שינוי ב-CSS/JS מכריח את הדפדפן לטעון מחדש (במקום עותק ישן מהמטמון)
const version = (f) => createHash("sha1").update(readFileSync(join(SRC, f))).digest("hex").slice(0, 8);
const ASSET_VERSIONS = {
  "/assets/css/style.css": version("assets/css/style.css"),
  "/assets/css/motion.css": version("assets/css/motion.css"),
  "/assets/js/main.js": version("assets/js/main.js"),
};

const layout = readFileSync(join(SRC, "layout.html"), "utf8");
const partials = Object.fromEntries(
  readdirSync(join(SRC, "partials")).map((f) => [f.replace(/\.html$/, ""), readFileSync(join(SRC, "partials", f), "utf8")])
);
const PARTIAL = /\{\{>\s*([\w-]+)\s*\}\}/g;
const FRONT_MATTER = /^<!--\s*(\{[\s\S]*?\})\s*-->\s*/;
const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const heDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });
for (const f of ["_redirects", "robots.txt"]) if (existsSync(join(SRC, f))) cpSync(join(SRC, f), join(OUT, f));

// טופס יצירת הקשר עובד רק ב-Netlify. באתר התצוגה (GitHub Pages) הטופס מושבת ומוצגת הפניה לטלפון ולוואטסאפ,
// כדי שאף פנייה לא תלך לאיבוד. אפשר לכפות הפעלה עם FORMS=1.
const FORMS_LIVE = process.env.NETLIFY === "true" || process.env.FORMS === "1" || !PREVIEW;
if (!FORMS_LIVE) {
  partials["contact-form"] = partials["contact-form"]
    .replace('<div class="form-actions">', `<p class="form-offline" role="note"><strong>הטופס אינו פעיל עדיין.</strong> בינתיים אפשר לפנות בטלפון <a href="tel:+972546868040">054-6868040</a>, <a href="https://wa.me/972546868040" target="_blank" rel="noopener">בוואטסאפ</a> או במייל <a href="mailto:rachel@adir-s.co.il">rachel@adir-s.co.il</a>.</p>
  <div class="form-actions">`)
    .replace('<button type="submit" class="btn btn-gold">', '<button type="submit" class="btn btn-gold" disabled>');
}

const urls = [];

function parse(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(FRONT_MATTER);
  if (!m) throw new Error(`${file}: missing front-matter comment`);
  return { meta: JSON.parse(m[1]), body: raw.slice(m[0].length) };
}

// מרכיב עמוד מלא מתוך התבנית וכותב אותו ל-dist
function render(meta, body, path, outFile) {
  body = body.replace(PARTIAL, (_, n) => partials[n] ?? "");
  if (!meta.noindex) urls.push(path);
  let html = layout
    .replace(PARTIAL, (_, n) => partials[n] ?? "")
    .replaceAll("{{title}}", meta.title)
    .replaceAll("{{description}}", meta.description || "")
    .replaceAll("{{bodyClass}}", meta.bodyClass || "")
    .replaceAll("{{robots}}", meta.noindex || PREVIEW ? "noindex" : "index,follow")
    .replaceAll("{{canonical}}", SITE_URL ? `<link rel="canonical" href="${SITE_URL}${path}">` : "")
    .replaceAll("{{ogUrl}}", SITE_URL ? `<meta property="og:url" content="${SITE_URL}${path}">` : "")
    .replaceAll("{{ogImage}}", (SITE_URL || "") + "/assets/img/og-image.jpg")
    .replaceAll("{{siteUrl}}", SITE_URL)
    .replace("{{content}}", () => body);
  // סימון הקישור הפעיל בתפריט
  html = html.replace(/data-nav="([\w-]+)"/g, (s, k) => (k === meta.nav ? `${s} aria-current="page"` : s));
  for (const [p, v] of Object.entries(ASSET_VERSIONS)) html = html.replaceAll(`"${p}"`, `"${p}?v=${v}"`);
  // קישורים פנימיים מוחלטים ("/...") מקבלים את תת-הנתיב
  if (BASE_PATH) {
    html = html
      .replace(/(\s(?:href|src|srcset|action|content))="\/(?!\/)/g, `$1="${BASE_PATH}/`)
      .replace(/"image": "\//g, `"image": "${BASE_PATH}/`);
  }
  mkdirSync(dirname(join(OUT, outFile)), { recursive: true });
  writeFileSync(join(OUT, outFile), html);
  console.log("built", outFile);
}

// ---- ידע מקצועי: כל קובץ ב-src/articles הוא מאמר (קבצים שמתחילים ב-_ הם דוגמה ולא נבנים) ----
const CATEGORIES = ["מאמרים", "פסיקה", "עדכוני חקיקה", "הנחיות"];
const ART_DIR = join(SRC, "articles");
const articles = (existsSync(ART_DIR) ? readdirSync(ART_DIR) : [])
  .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
  .map((f) => {
    const { meta, body } = parse(join(ART_DIR, f));
    if (!CATEGORIES.includes(meta.category)) throw new Error(`articles/${f}: category must be one of ${CATEGORIES.join(", ")}`);
    return { slug: f.replace(/\.html$/, ""), ...meta, body };
  })
  .sort((x, y) => String(y.date).localeCompare(String(x.date)));

const metaLine = (a) => `<p class="kn-meta"><span class="kn-cat">${esc(a.category)}</span><time datetime="${esc(a.date)}">${heDate(a.date)}</time></p>`;

const articleList = articles.length
  ? `<div class="kn-filters" role="group" aria-label="סינון לפי סוג תוכן">
  <button type="button" class="kn-chip" data-kn-filter="" aria-pressed="true">הכול</button>
${CATEGORIES.filter((c) => articles.some((a) => a.category === c))
  .map((c) => `  <button type="button" class="kn-chip" data-kn-filter="${esc(c)}" aria-pressed="false">${esc(c)}</button>`)
  .join("\n")}
</div>
<ul class="kn-list">
${articles
  .map(
    (a) => `  <li class="kn-card" data-kn-cat="${esc(a.category)}">
    ${metaLine(a)}
    <h2><a href="/knowledge/${a.slug}">${esc(a.title)}</a></h2>
    <p>${esc(a.summary)}</p>
    <span class="link-arrow" aria-hidden="true">לקריאה<svg><use href="#i-arrow"/></svg></span>
  </li>`
  )
  .join("\n")}
</ul>`
  : `<div class="kn-empty">
  <h2>התכנים הראשונים יעלו בקרוב</h2>
  <p>כאן יתפרסמו מאמרים מקצועיים, פסקי דין משמעותיים, עדכוני חקיקה והנחיות בתחומי הביטוח הלאומי ודיני העבודה.</p>
</div>`;

for (const a of articles) {
  const body = `<section class="page-hero">
  <div class="container">
    <nav class="breadcrumbs" aria-label="פירורי לחם"><a href="/">ראשי</a> / <a href="/knowledge">ידע מקצועי</a> / <span aria-current="page">${esc(a.title)}</span></nav>
    <h1>${esc(a.title)}</h1>
    ${metaLine(a)}
  </div>
</section>
<section class="section">
  <article class="container narrow prose kn-article">
${a.body}
    <p class="note">המידע במאמר זה הוא כללי בלבד, נכון למועד פרסומו, ואינו מהווה ייעוץ משפטי, חוות דעת משפטית או תחליף לבחינה פרטנית של נסיבות המקרה.</p>
    <a href="/knowledge" class="link-arrow">לכל התכנים<svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
  </article>
</section>`;
  render({ title: `${a.title} | עו״ד רחל אדיר`, description: a.summary || "", nav: "knowledge" }, body, `/knowledge/${a.slug}`, `knowledge/${a.slug}.html`);
}

// עד שיש מאמרים – העמוד לא מופיע בתפריט ובפוטר, ולא נכנס לגוגל
if (!articles.length) {
  for (const n of ["header", "footer"]) partials[n] = partials[n].replace(/\s*<li><a href="\/knowledge"[^\n]*<\/li>/, "");
}

// ---- העמודים הרגילים ----
for (const file of readdirSync(join(SRC, "pages")).filter((f) => f.endsWith(".html"))) {
  const { meta, body } = parse(join(SRC, "pages", file));
  const path = file === "index.html" ? "/" : "/" + file.replace(/\.html$/, "");
  if (file === "knowledge.html" && !articles.length) meta.noindex = true;
  render(meta, body.replace("{{articles}}", () => articleList), path, file);
}

if (SITE_URL) {
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
  writeFileSync(join(OUT, "sitemap.xml"), sm);
}
// robots.txt: אתר התצוגה חסום לסורקים; באתר הסופי – הפניה ל-sitemap
writeFileSync(
  join(OUT, "robots.txt"),
  PREVIEW ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n${SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml\n` : ""}`
);
console.log("done →", OUT);
