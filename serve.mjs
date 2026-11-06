// שרת תצוגה מקומי: בונה את האתר ומגיש את dist (כולל כתובות ללא .html, כמו ב-Netlify)
// הרצה: node serve.mjs   ואז לפתוח http://localhost:4321
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL(".", import.meta.url)));

execSync("node build.mjs", { stdio: "inherit" });
const ROOT = "dist";
const PORT = Number(process.env.PORT) || 4321;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };

const exists = async (p) => { try { return (await stat(p)).isFile(); } catch { return false; } };

createServer(async (req, res) => {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (req.method === "POST") { res.writeHead(303, { Location: "/thanks" }); return res.end(); } // סימולציה של טופס Netlify
  let p = normalize(join(ROOT, url));
  if (!p.startsWith(normalize(ROOT))) { res.writeHead(403); return res.end(); }
  if (url.endsWith("/")) p = join(p, "index.html");
  else if (!extname(p) && (await exists(p + ".html"))) p += ".html";
  let status = 200;
  if (!(await exists(p))) { p = join(ROOT, "404.html"); status = 404; }
  res.writeHead(status, { "Content-Type": TYPES[extname(p)] || "application/octet-stream" });
  res.end(await readFile(p));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
