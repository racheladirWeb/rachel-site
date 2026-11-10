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
- האתר באוויר ב-https://adirlaw.co.il (Netlify, פרויקט rachel-adir). כל push ל-main מתעדכן אוטומטית. הטופס עובד ושולח מייל ל-rachel@adir-s.co.il.
- הדומיין רשום ב-LiveDNS על שם רחל אדיר (עד 10/11/2031). שרתי ה-DNS הם של Netlify.

## קבצים שלא עולים
`secrets.txt`, `photos/` ו-`dist/` מוחרגים ב-`.gitignore`. לא לשנות את זה.
