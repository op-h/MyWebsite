# Performance — budgets and measurements

Measured on this machine with Chromium headless, software GL (swiftshader), 1440×900,
6 s of `requestAnimationFrame` sampling with real wall-clock time (not virtual time —
virtual time starves rAF and produces meaningless numbers).

## Before / after

Both runs used the identical harness. "Before" is `git HEAD` (Three.js r128 + GSAP +
ScrollTrigger + TextPlugin + Locomotive Scroll).

| Metric | Before | After |
|---|---:|---:|
| Average frame | 21.29 ms | **16.67 ms** |
| p95 frame | 33.40 ms | **16.80 ms** |
| p99 frame | 33.40 ms | **16.80 ms** |
| Worst frame | 50.00 ms | **16.80 ms** |
| Effective FPS | 47.0 | **60.0** |
| Requests | 10 | **3** |
| Transferred | 200.3 KB | **17.2 KB** |

A p95 of 33.4 ms means the old page was missing every second vsync — the visible
"lag and stick". The new page never exceeds one frame interval.

## What caused the old cost

| Cause | Measured |
|---|---|
| `nodeCount` spheres each given a **cloned material**, plus one `THREE.Line` object per edge | **173 draw calls** for the background alone |
| `matrix(500) + data(300) + hexFloor(800)` positions rewritten and re-uploaded every frame | **1600 vertex writes + 18.8 KB GPU upload per frame** |
| Render loop never checked `document.hidden` or visibility | ran at 60 fps in background tabs forever |
| `backdrop-filter: blur(16px)` on 7 cards over a live canvas | full-viewport re-blur every animated frame |
| Locomotive Scroll with `lerp: 0.04` | scroll position ~50 frames behind the input |
| 5 render-blocking CDN scripts | 177 KB gzipped before first paint |
| ASCII portrait: 150×70 chars with `text-shadow` | 10 500 glowing glyphs to raster |

## Current budget

| Budget | Limit | Actual |
|---|---:|---:|
| JS (gzipped) | 10 KB | **1.9 KB** |
| CSS (gzipped) | 8 KB | **3.6 KB** |
| HTML (gzipped) | 8 KB | **5.2 KB** |
| Total first-party (gzipped) | 25 KB | **10.7 KB** |
| Third-party JS | 0 | **0** |
| Requests | 5 | **3** + Google Fonts |
| Worst frame | 16.8 ms | **16.8 ms** |

## Techniques relied on

- Link strokes quantised into 4 alpha buckets → the whole node network is ~5 canvas
  calls instead of one per edge; nodes are a single batched `Path2D` fill.
- The rAF loop is stopped by `IntersectionObserver` (canvas offscreen) and
  `visibilitychange` (tab hidden).
- Device-pixel-ratio capped at 1.5 on small screens, 2 elsewhere.
- `content-visibility: auto` + `contain-intrinsic-size: auto 640px` on non-hero
  sections. Verified: far-offscreen sections report the 640 px intrinsic height and
  skip layout; in-viewport sections lay out normally.
- Only `opacity` and `transform` are transitioned, so no animation triggers layout.
- The scroll-progress bar uses `animation-timeline: scroll()` — no scroll listener at all.

## Caveat

These numbers come from software rendering in a container. Real GPU hardware will be
faster for both builds; the *ratio* and the frame-time distribution are the meaningful
result, along with the request/byte counts, which are hardware-independent.
