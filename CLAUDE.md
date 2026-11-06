# אתר עו״ד רחל אדיר

## GitHub – חשבון ייעודי (חשוב)
- החשבון של הפרויקט: **racheladirWeb**, המאגר: `racheladirWeb/rachel-site`.
- **אסור להשתמש בחשבון `adir-shlomi`**. הוא שייך לאתר אחר (שלומי אדיר).
- ה-remote מוגדר כ-`https://racheladirWeb@github.com/racheladirWeb/rachel-site.git`, ולכן `git push` תמיד משתמש בחשבון הנכון.
- זהות ה-Git של המאגר מוגדרת מקומית: `racheladirWeb <353468321+racheladirWeb@users.noreply.github.com>`.
- פקודות `gh` (יצירת מאגר, הגדרות, Pages) מריצים בטרמינל של המשתמש, שבו racheladirWeb הוא החשבון הפעיל. לפני כל פעולה כזאת: `gh auth status`.

## בנייה והרצה
- `node serve.mjs` בונה את האתר ומגיש אותו ב-http://localhost:4321
- `node build.mjs` בונה ל-`dist/`. משתני סביבה: `BASE_PATH` (תת-נתיב), `PREVIEW=1` (noindex), `SITE_URL` (כשיהיה דומיין).
- תצוגה מקדימה: GitHub Pages ב-https://racheladirweb.github.io/rachel-site/. נבנית אוטומטית בכל push ל-main.
- האתר הסופי מתוכנן ל-Netlify (`netlify.toml`). טופס יצירת הקשר עובד רק שם.

## קבצים שלא עולים
`secrets.txt`, `photos/` ו-`dist/` מוחרגים ב-`.gitignore`. לא לשנות את זה.
