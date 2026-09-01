# QA — release checklist

## Definition of Done

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Content works with JavaScript disabled | PASS | Probed computed opacity of all 6 section cards with every script stripped: `1,1,1,1,1,1`. Also probed with `app.js` returning 404: `1,1,1,1,1,1` — the head-script failsafe removes the `js` flag after 1.5 s if `app.js` never signals readiness. |
| 2 | Keyboard operable, focus ring visible on every theme | PASS | Global `:where(a,button):focus-visible` — 2 px solid `--primary`, 3 px offset. Skip link to `#main` (which carries `tabindex="-1"`). |
| 3 | WCAG 2.2 AA contrast | PASS | Computed against the composited card background `#090c18`: text 17.2:1, muted 9.0:1, primary 15.0:1, secondary 6.1:1, accent 5.0:1. **Fixed:** old `--secondary` `#0055ff` was 3.47:1 and failed body text; replaced with `#4d8dff`. |
| 3b | Target size 24×24 (SC 2.5.8) | PASS | `.rail-link` `min-height: 28px`; `.tab` `min-height: 52px`; `.btn` ~44 px. |
| 3c | Focus not obscured (SC 2.4.11) | PASS | Rail measured against the card at 1240/1280/1366/1440/1600/1920/2560 with every label force-expanded: no overlap at any width. The shell reserves `100% - 26rem` once the rail appears. |
| 4 | No horizontal scroll, 320 → 2560 px | PASS | `scrollWidth == clientWidth` and zero out-of-bounds elements at 625/753/1009/1265/1425/2545. Below ~500 px this Chromium build clamps the window, so 320/360/390 were verified from rendered screenshots instead. |
| 5 | `prefers-reduced-motion` and colour scheme respected | PASS | Reduced motion short-circuits the canvas, the typing effect and all reveals in JS, and disables animation/transition plus the progress bar in CSS. |
| 6 | LCP / INP / CLS | PARTIAL | Frame time and payload measured (see `perf.md`). Field Core Web Vitals need a real device on 4G — not measurable here. |
| 7 | Zero console errors, explicit media dimensions | PASS | Console clean over a full real-time load. No `<img>`/`<iframe>` on the page at all. |
| 8 | No secret or key in client code | PASS | Only public profile URLs, a public email and a public phone number — all already published in the CV. |

## Verified separately

- **Build output** — `npm run build` emits `index.html`, `app.js`, hashed CSS, `CNAME`,
  `robots.txt`, `sitemap.xml`. Works over http *and* `file://` (screenshot-verified).
- **`file://` support** — `app.js` is deliberately a classic script; ES modules are
  CORS-blocked on `file://`. `build-post.mjs` minifies/copies it and strips the
  `crossorigin` attribute Vite adds, which otherwise makes `file://` silently drop the
  stylesheet.
- **Links** — all 6 certificate URLs plus the 3 project URLs return 200 (the two
  `tryhackme.com` ones return 429 = rate limiting, not a broken link). Every
  `target="_blank"` carries `rel="noopener noreferrer"`. No `http://` links.
- **Dead code** — no orphaned CSS selectors and no unstyled classes remain, except
  `.nav-link`, which is an intentional JS hook with no styling.
- **Scrollspy** — one `IntersectionObserver` drives both the desktop rail and the mobile
  tab bar; verified 2 links activate simultaneously with `aria-current="true"`.
- **Sitemap** — namespace validated by parsing (`http://www.sitemaps.org/schemas/sitemap/0.9`;
  it was initially misspelled `sitemap.org` and was fixed).

## Known gaps

- Core Web Vitals are not field-measured; needs a throttled mid-tier Android on 4G.
- Google Fonts remains the one third-party origin. Self-hosting the two families would
  remove a DNS + TLS handshake from the critical path.
- No CSP. GitHub Pages cannot send headers; a `<meta http-equiv="Content-Security-Policy">`
  is possible but must allow `fonts.googleapis.com` / `fonts.gstatic.com` and
  `'unsafe-inline'` for the head failsafe script.
