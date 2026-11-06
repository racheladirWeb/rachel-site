(function () {
  // תפריט מובייל
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); toggle.focus();
      }
    });
  }

  // צל לכותרת בגלילה
  var header = document.querySelector(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("scrolled", window.scrollY > 10); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // שנה נוכחית בפוטר
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // תפריט נגישות
  (function () {
    var root = document.documentElement;
    var wrap = document.querySelector(".a11y");
    if (!wrap) return;
    var toggle = wrap.querySelector(".a11y-toggle");
    var panel = wrap.querySelector(".a11y-panel");
    var state = { font: 0, on: [] };
    try { var saved = JSON.parse(localStorage.getItem("a11y") || "{}"); state.font = saved.font || 0; state.on = saved.on || []; } catch (e) {}

    function save() { try { localStorage.setItem("a11y", JSON.stringify(state)); } catch (e) {} }
    function apply() {
      if (state.font) root.setAttribute("data-a11y-font", state.font); else root.removeAttribute("data-a11y-font");
      wrap.querySelectorAll("[data-a11y]").forEach(function (b) {
        var k = b.getAttribute("data-a11y"), on = state.on.indexOf(k) > -1;
        root.classList.toggle("a11y-" + k, on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (state.on.indexOf("nomotion") > -1) document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }
    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("button").focus();
    }

    toggle.addEventListener("click", function () { setOpen(panel.hidden); });
    wrap.querySelector(".a11y-close").addEventListener("click", function () { setOpen(false); toggle.focus(); });
    wrap.querySelectorAll("[data-a11y-font]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.font = Math.max(0, Math.min(4, state.font + Number(b.getAttribute("data-a11y-font"))));
        apply(); save();
      });
    });
    wrap.querySelectorAll("[data-a11y]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-a11y"), i = state.on.indexOf(k);
        if (i > -1) state.on.splice(i, 1); else state.on.push(k);
        apply(); save();
      });
    });
    wrap.querySelector(".a11y-reset").addEventListener("click", function () { state = { font: 0, on: [] }; apply(); save(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) { if (!panel.hidden && !wrap.contains(e.target)) setOpen(false); });
    apply();
  })();

  // אנימציית הופעה
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("a11y-nomotion");

  // השהיה מדורגת לפריטים בתוך קבוצה (כרטיסים, שלבים, רשימות)
  document.querySelectorAll(".stagger").forEach(function (group) {
    group.querySelectorAll(":scope > .reveal, :scope > li > .reveal, :scope > .reveal-child").forEach(function (el, i) {
      el.style.transitionDelay = (i * 0.12) + "s";
    });
  });

  // ספירה עולה למספרים (למשל +20)
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = Number(el.getAttribute("data-count")), prefix = el.getAttribute("data-prefix") || "";
    if (reduced) return;
    var start = null, dur = 1400, delay = 900;
    el.textContent = prefix + "0";
    function step(t) {
      if (start === null) start = t + delay;
      var p = Math.min(1, Math.max(0, (t - start) / dur));
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // פס התקדמות גלילה
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
      ticking = false;
    });
  }, { passive: true });

  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        io.unobserve(el);
        // אחרי ההופעה – מבטלים את ההשהיה כדי שאפקטי ריחוף יגיבו מיד
        if (el.style.transitionDelay) setTimeout(function () { el.style.transitionDelay = ""; }, 1600);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();
