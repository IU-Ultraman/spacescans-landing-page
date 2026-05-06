# Spec A — SPACESCANS Performance Optimization

**Date:** 2026-05-06
**Status:** Draft, awaiting user review
**Scope:** Static-site performance fixes for the SPACESCANS landing page on GitHub Pages. No visual or content changes.

## Problem

The site is slow to load. Concrete measurements of the current state:

| Asset | Size | Notes |
|---|---|---|
| `assets/images/logo.png` | **722 KB** | Used as homepage hero image |
| `assets/images/big-city-2.jpg` | **1.3 MB** | Full-bleed panorama section |
| `assets/images/logo-large.png` | 739 KB | Currently unreferenced |
| `assets/images/big-city-1.jpg` | 238 KB | Full-bleed panorama section |
| `bookshelf.jpg` / `harddrive.jpg` / `letter.jpg` | 24–28 KB each | Quick-start cards (already small) |

Total image weight on the homepage: **~2.3 MB** before any CSS or JS. On a typical broadband connection that's 2–4 seconds of network alone; on slower connections it's much worse and Largest Contentful Paint suffers badly.

Additional issues:

1. **Four external CDN dependencies** loaded synchronously in `<head>` on every page:
   - Google Fonts Material Icons stylesheet — **not actually used anywhere in the markup** (verified via grep)
   - Bootstrap Icons font (~120 KB) — only 6 icons actually used: `bi-1-circle-fill`, `bi-2-circle-fill`, `bi-3-circle-fill`, `bi-arrow-right`, `bi-arrow-up-right`, `bi-list`
   - GSAP core (`gsap.min.js`) — loaded synchronously, not needed for first paint
   - GSAP ScrollTrigger plugin — same
2. Images have **no `width`/`height` attributes**, causing cumulative layout shift as they load.
3. Images have **no `loading="lazy"`** for off-screen content.
4. Images are served as PNG/JPG with no modern format alternatives (WebP/AVIF).
5. The hero image animates via GSAP, which means JS must load before users see it move — but the IMG itself is rendered immediately, so the bottleneck is image weight, not JS.

## Goals

- Reduce homepage initial transfer from ~2.3 MB images to **under 400 KB total images** above the fold.
- Eliminate render-blocking external requests where possible.
- Eliminate layout shift on image load.
- Preserve existing visual appearance and animation behavior exactly.
- No new build steps users have to remember (everything must work with the existing `npm run build:tailwind` workflow on a clean clone).

## Non-Goals

- Visual redesign (deferred to Spec B).
- Branding/typography changes (Spec B).
- Adding email signup (Spec B).
- Switching frameworks or build tools.
- Server-side rendering or moving off GitHub Pages.

## Approach

Five independent, low-risk changes. Each can ship separately. Order is by impact-per-effort.

### 1. Optimize and re-encode images

**Action:** Recompress all in-use images to modern, web-appropriate sizes. Provide a WebP variant alongside the original for each via `<picture>` (with the original JPG/PNG as fallback for older browsers — though all modern browsers support WebP, the fallback is essentially unused but free).

Target sizes (lossless or visually-lossless quality):

| File | Current | Target (original format) | Target (WebP) |
|---|---|---|---|
| `logo.png` | 722 KB | ≤ 80 KB | ≤ 40 KB |
| `big-city-1.jpg` | 238 KB | ≤ 150 KB at 1920w | ≤ 90 KB |
| `big-city-2.jpg` | 1,300 KB | ≤ 200 KB at 1920w | ≤ 120 KB |
| `logo-large.png` | 739 KB | DELETE (unreferenced) | — |

**Tooling:** Use `sips` (built into macOS) or `cwebp`/`magick` if available. The dev does this once locally and commits the new files. No build pipeline required.

**Concrete commands** (run from project root, requires `cwebp` from `brew install webp` and `imagemagick` from `brew install imagemagick`):

```bash
# Resize the panoramas to a sane max width (1920px) and recompress
magick assets/images/big-city-1.jpg -resize '1920x>' -quality 82 -strip assets/images/big-city-1.jpg
magick assets/images/big-city-2.jpg -resize '1920x>' -quality 82 -strip assets/images/big-city-2.jpg

# Recompress the logo PNG (it's small dimensions, just over-encoded)
magick assets/images/logo.png -strip -define png:compression-level=9 assets/images/logo.png

# Generate WebP variants
cwebp -q 82 assets/images/big-city-1.jpg -o assets/images/big-city-1.webp
cwebp -q 82 assets/images/big-city-2.jpg -o assets/images/big-city-2.webp
cwebp -lossless assets/images/logo.png -o assets/images/logo.webp

# Delete unreferenced asset
rm assets/images/logo-large.png
```

Markup updated to `<picture>` with both sources:

```html
<picture>
  <source srcset="./assets/images/big-city-1.webp" type="image/webp" />
  <img src="./assets/images/big-city-1.jpg" alt="..." width="1920" height="600" loading="lazy" decoding="async" class="..." />
</picture>
```

**Expected impact:** Homepage image weight drops from ~2.3 MB to ~200–300 KB. Single biggest win.

### 2. Remove the unused Material Icons stylesheet

The Google Fonts Material Icons stylesheet is referenced in all four HTML files but no `material-icons` class appears anywhere in the markup. Confirmed via grep on `*.html` and `pages/*.html`.

**Action:** Delete the `<link>` tag from `index.html`, `pages/contact.html`, `pages/docs.html`, `pages/platform.html`.

**Expected impact:** Removes 1 render-blocking stylesheet request and the Google Fonts font file fetch (~30 KB+). Saves ~100–200 ms on cold load.

### 3. Replace Bootstrap Icons font with inline SVGs

Only 6 icons are actually used. Loading a full icon font (~120 KB plus the CSS) for 6 icons is wasteful. Inline SVGs are: cacheable as part of HTML (so first paint includes them); zero extra requests; smaller per-icon than a font file; styleable via `currentColor`.

**Action:** Replace each `<i class="bi bi-..."></i>` with the corresponding inline SVG (sourced from the Bootstrap Icons SVG library, which is MIT-licensed). Drop the `<link>` tag for the Bootstrap Icons CDN from all four HTML files.

The 6 SVGs needed: `1-circle-fill`, `2-circle-fill`, `3-circle-fill`, `arrow-right`, `arrow-up-right`, `list`. The commented-out icons (`github`, `twitter`, `stack-overflow`) are not currently rendered, so they don't need migration; if those sections get reactivated later, add their SVGs at that time.

**Expected impact:** Removes 1 render-blocking stylesheet request, ~120 KB font file, ~5 KB CSS. Saves ~150–300 ms.

### 4. Defer GSAP scripts

GSAP and ScrollTrigger are only used for entrance animations and scroll-triggered reveals. They are not needed for first paint or for the page to be functional/accessible.

**Action:** Add `defer` attribute to all three `<script>` tags (gsap, ScrollTrigger, index.js) on all four HTML files. Leave them in their current position at the end of the document — `defer` is sufficient to make them non-blocking, no need to move them.

```html
<script defer src="https://cdnjs.cloudflare.com/.../gsap.min.js" ...></script>
<script defer src="https://cdnjs.cloudflare.com/.../ScrollTrigger.min.js" ...></script>
<script defer src="./index.js"></script>
```

**Note on script execution order:** `index.js` uses a top-level `gsap.registerPlugin(ScrollTrigger)` call followed by immediate `gsap.to(...)` calls, so it depends on the prior scripts being defined. `defer` preserves document order during execution, so GSAP and ScrollTrigger will be defined by the time `index.js` runs. No breakage.

**Expected impact:** First paint and First Contentful Paint no longer wait on GSAP. Saves ~200–500 ms on slow networks.

### 5. Add explicit width/height and lazy-loading to images

**Action:** On every `<img>` tag, add:
- `width="..."` and `height="..."` attributes matching the image's intrinsic pixel dimensions (this prevents layout shift; CSS still scales the rendered size).
- `loading="lazy"` on all images **except** the homepage hero (`logo.png`).
- `decoding="async"` on all images.
- The hero image gets `fetchpriority="high"` instead, to hint the browser to fetch it early.

**Expected impact:** Eliminates Cumulative Layout Shift (CLS), which improves perceived performance and Lighthouse score. Defers off-screen image fetches, saving bandwidth and main-thread time.

## File-by-file changes

| File | Changes |
|---|---|
| `index.html` | Drop Material Icons + Bootstrap Icons `<link>` tags. Replace 6 `<i>` icon usages with inline SVGs. Wrap `logo.png`, `big-city-1.jpg`, `big-city-2.jpg`, `harddrive.jpg`, `bookshelf.jpg`, `letter.jpg` in `<picture>` with WebP source. Add `width`/`height`/`loading`/`decoding`/`fetchpriority` attributes. Move scripts to head with `defer`. |
| `pages/contact.html` | Drop both icon CDN `<link>` tags (Material Icons + Bootstrap Icons). Replace the single `bi-list` icon (the mobile hamburger menu, line ~62) with the inline `list` SVG. Add `defer` to all three `<script>` tags. Add `width`/`height`/`loading="lazy"`/`decoding="async"` to any `<img>` tags. |
| `pages/docs.html` | Same as contact.html (uses only `bi-list`). |
| `pages/platform.html` | Same as contact.html (uses only `bi-list`). |
| `assets/images/*` | Recompress in place. Add `.webp` siblings. Delete `logo-large.png`. |
| `readme.md` | Add a short "Optimizing images" subsection documenting the `magick`/`cwebp` commands, so future asset additions follow the same pipeline. |

## Verification

For each change, the developer manually:

1. **Visual smoke test** — open every page (`index.html`, `contact.html`, `docs.html`, `platform.html`) at desktop (1440px) and mobile (375px) widths in a browser. Confirm visual appearance is unchanged. Confirm GSAP entrance animations still play. Confirm the mobile hamburger menu icon renders.
2. **Lighthouse score** — run Chrome DevTools Lighthouse on the deployed GitHub Pages site **before** and **after** the changes. Record Performance score and LCP/CLS/TBT metrics. Acceptance: Performance score ≥ 90 on desktop, ≥ 75 on mobile, with LCP under 2.5 s on a Fast 3G simulated connection.
3. **Network panel check** — confirm in DevTools Network tab that Material Icons and Bootstrap Icons CDN URLs are no longer requested.
4. **No console errors** — DevTools Console should be clean on every page.

No automated tests are introduced (the project has no test infrastructure and adding one is out of scope for a static site of this size).

## Risk and rollback

- Image recompression is destructive. **Mitigation:** commit current images to a separate branch (`backup/pre-perf-images`) before recompressing, so they can be recovered if needed. The git history alone is sufficient since the originals will be in the previous commit.
- WebP fallback handling: `<picture>` element provides automatic fallback to the original JPG/PNG for browsers that don't support WebP. All evergreen browsers support WebP; only IE11 and very old Safari do not. Acceptable.
- Inlining SVGs makes the HTML slightly larger (~2 KB total). Net positive given the saved 120 KB font.
- `defer` attribute requires reasoning about script execution order. Verified above that order is preserved.

## Out of scope (deferred)

- Service worker / offline support.
- HTTP/2 server push or `<link rel="preload">` (GitHub Pages doesn't support HTTP/2 push, and `preload` is risky to apply without measurement).
- Replacing GSAP with smaller alternatives (anime.js, motion, CSS-only). Possible follow-up if GSAP is still measurable bottleneck after defer.
- A proper Tailwind purge build. Current `tailwind-build.css` is already 12 KB — small. Skip until/unless it becomes a problem.
- Self-hosting any remaining CDN assets after this round (none should remain).

## Manual setup

Developer needs `imagemagick` and `cwebp` installed locally:

```bash
brew install imagemagick webp
```

These are only needed to (re)generate optimized assets; the live site does not depend on them.
