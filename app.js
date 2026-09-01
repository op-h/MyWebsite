/* ============================================================================
 * Hussein Dheyaa (oph) — portfolio runtime
 *
 * Zero dependencies. Previously this page pulled Three.js, GSAP, ScrollTrigger,
 * TextPlugin and Locomotive Scroll from two CDNs — 177 KB gzipped of
 * render-blocking JavaScript for a decorative background and some reveals.
 * Everything below replaces that with ~7 KB of plain JS.
 *
 * Performance rules this file obeys:
 *   - One rAF loop, and it stops whenever the canvas is offscreen or the tab
 *     is hidden. An idle tab costs nothing.
 *   - Link strokes are quantised into a few alpha buckets so the whole network
 *     draws in a handful of canvas calls instead of one per edge.
 *   - Reveal animations are CSS transitions toggled by IntersectionObserver.
 *     Nothing is driven from the scroll event, so scrolling stays on the
 *     compositor.
 *   - Every animation is skipped outright under prefers-reduced-motion.
 * ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * 1. Background: node network on a 2D canvas
   * ------------------------------------------------------------------ */
  function background() {
    var canvas = document.getElementById("bg-canvas");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var small  = window.innerWidth < 768;
    var lowEnd = (navigator.hardwareConcurrency || 4) <= 4;

    var COUNT     = small || lowEnd ? 26 : 46;
    var LINK_DIST = small ? 130 : 165;
    var DPR_CAP   = small ? 1.5 : 2;
    // Alpha buckets for links. More buckets = smoother falloff, more draw
    // calls. Four is indistinguishable from per-edge alpha at these opacities.
    var BUCKETS   = 4;

    var w = 0, h = 0, dpr = 1;
    var nodes = [];
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    var running = false, rafId = 0;

    function seed() {
      nodes.length = 0;
      for (var i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.4 + 0.9,
          // Each node breathes on its own phase so the field never pulses in
          // lockstep.
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!nodes.length) seed();
    }

    function step(now) {
      rafId = requestAnimationFrame(step);

      var t = now * 0.001;
      ctx.clearRect(0, 0, w, h);

      if (pointer.active) {
        pointer.x += (pointer.tx - pointer.x) * 0.045;
        pointer.y += (pointer.ty - pointer.y) * 0.045;
      }

      var i, j, n;
      for (i = 0; i < COUNT; i++) {
        n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        // Wrap rather than bounce: bouncing makes the drift read as a loop.
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }

      // --- links, batched into BUCKETS paths -------------------------------
      var paths = [];
      for (i = 0; i < BUCKETS; i++) paths.push(null);

      var maxSq = LINK_DIST * LINK_DIST;
      for (i = 0; i < COUNT; i++) {
        var a = nodes[i];
        for (j = i + 1; j < COUNT; j++) {
          var b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var dSq = dx * dx + dy * dy;
          if (dSq >= maxSq) continue;
          var closeness = 1 - Math.sqrt(dSq) / LINK_DIST;
          var bucket = Math.min(BUCKETS - 1, (closeness * BUCKETS) | 0);
          var p = paths[bucket] || (paths[bucket] = new Path2D());
          p.moveTo(a.x, a.y);
          p.lineTo(b.x, b.y);
        }
      }

      ctx.lineWidth = 1;
      for (i = 0; i < BUCKETS; i++) {
        if (!paths[i]) continue;
        ctx.strokeStyle = "rgba(0, 255, 204, " + (0.03 + i * 0.035).toFixed(3) + ")";
        ctx.stroke(paths[i]);
      }

      // --- nodes, one fill for the whole field -----------------------------
      var dots = new Path2D();
      for (i = 0; i < COUNT; i++) {
        n = nodes[i];
        var r = n.r * (1 + Math.sin(t * 1.1 + n.phase) * 0.28);
        dots.moveTo(n.x + r, n.y);
        dots.arc(n.x, n.y, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = "rgba(0, 255, 204, 0.55)";
      ctx.fill(dots);

      // --- pointer halo (fine pointers only) -------------------------------
      if (pointer.active) {
        var g = ctx.createRadialGradient(
          pointer.x, pointer.y, 0, pointer.x, pointer.y, 190
        );
        g.addColorStop(0, "rgba(0, 255, 204, 0.055)");
        g.addColorStop(1, "rgba(0, 255, 204, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(pointer.x - 190, pointer.y - 190, 380, 380);
      }
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    resize();

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        seed();
      }, 180);
    }, { passive: true });

    if (!coarse) {
      pointer.active = true;
      pointer.x = pointer.tx = window.innerWidth / 2;
      pointer.y = pointer.ty = window.innerHeight / 2;
      window.addEventListener("pointermove", function (e) {
        pointer.tx = e.clientX;
        pointer.ty = e.clientY;
      }, { passive: true });
    }

    // Only animate while the canvas is actually on screen and the tab is
    // focused. This is what keeps the page from cooking a laptop battery.
    var onScreen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        sync();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", sync);

    function sync() {
      if (onScreen && !document.hidden) start(); else stop();
    }

    sync();
  }

  /* ------------------------------------------------------------------ *
   * 2. Terminal typing effect
   * ------------------------------------------------------------------ */
  function typeLine() {
    var el = document.getElementById("hero-typing");
    if (!el) return;

    // The element ships with its text already in it, so the line is readable
    // with JavaScript disabled. Clear it only once we know we can animate.
    var text = el.getAttribute("data-text") || el.textContent || "";
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent = "";

    var i = 0, last = 0;
    // rAF rather than setInterval so the effect pauses with the tab and never
    // queues up a backlog of ticks.
    function tick(now) {
      if (now - last >= 55) {
        last = now;
        el.textContent = text.slice(0, ++i);
      }
      if (i < text.length) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ *
   * 3. Scroll reveals — CSS transitions toggled by IntersectionObserver
   * ------------------------------------------------------------------ */
  function reveals() {
    // Tell the head-script failsafe that we are alive, so it does not strip the
    // `js` class out from under us.
    document.documentElement.setAttribute("data-reveals-ready", "");

    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add("is-visible");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target); // one-shot: no work after the first pass
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * 4. Section nav + scrollspy
   * ------------------------------------------------------------------ */
  function scrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    // Both the desktop rail and the mobile tab bar link to the same sections,
    // so each id maps to a list of links.
    var byId = {};
    links.forEach(function (a) {
      var id = (a.getAttribute("href") || "").slice(1);
      if (!id) return;
      (byId[id] || (byId[id] = [])).push(a);
    });

    function activate(id) {
      links.forEach(function (l) {
        l.classList.remove("is-active");
        l.removeAttribute("aria-current");
      });
      (byId[id] || []).forEach(function (l) {
        l.classList.add("is-active");
        l.setAttribute("aria-current", "true");
      });
    }

    // Track every section's ratio and pick the most-visible one, so short
    // sections at the top and bottom of the page still win when they should.
    var ratios = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { ratios[e.target.id] = e.intersectionRatio; });

      var best = null, bestRatio = 0;
      Object.keys(ratios).forEach(function (id) {
        if (ratios[id] > bestRatio) { bestRatio = ratios[id]; best = id; }
      });
      if (best) activate(best);
    }, { threshold: [0, 0.15, 0.35, 0.6, 0.85, 1] });

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) io.observe(section);
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. Boot
   * ------------------------------------------------------------------ */
  function init() {
    // The page is fully readable before any of this runs; each piece is
    // isolated so one failure cannot take the others down.
    [background, typeLine, reveals, scrollspy].forEach(function (fn) {
      try { fn(); } catch (err) { console.error("[oph]", fn.name, err); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
