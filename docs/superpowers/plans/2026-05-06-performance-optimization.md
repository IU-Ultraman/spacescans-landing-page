# SPACESCANS Performance Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut SPACESCANS homepage initial transfer from ~3 MB to under 500 KB while preserving exact visual appearance and animations.

**Architecture:** Pure static-site optimization. No new build tooling. Optimize/recompress images and add WebP fallbacks via `<picture>`, drop unused CDN dependencies, inline 6 SVG icons in place of the Bootstrap Icons font, defer GSAP scripts, add layout-stability and lazy-loading attributes to `<img>` tags. All changes are local file edits committed to git; the live site does not depend on any new tooling.

**Tech Stack:** HTML, Tailwind (already built into `css/tailwind-build.css`), GSAP (CDN), inline SVG, `imagemagick` and `cwebp` CLI for one-time image processing.

**Spec:** `docs/superpowers/specs/2026-05-06-performance-optimization-design.md`

**Verification model:** This is a static HTML site with no test infrastructure. "Tests" in this plan mean **manual browser verification + Lighthouse measurements** rather than unit tests. Each task ends with concrete verification steps so changes can be confirmed before commit.

---

## File Structure

| File | Role |
|---|---|
| `index.html` | Homepage — receives all 5 change categories: drop icon CDN links, swap inline SVGs, defer scripts, replace `<img>` with `<picture>` + lazy/decoding attrs |
| `pages/contact.html` | Contact page — drop icon CDNs, replace `bi-list` SVG, defer scripts, image attrs |
| `pages/docs.html` | Docs page — same as contact.html |
| `pages/platform.html` | Platform page — same as contact.html |
| `assets/images/logo.png` | Modified in place (re-encoded smaller) |
| `assets/images/big-city-1.jpg` | Modified in place (resized + recompressed) |
| `assets/images/big-city-2.jpg` | Modified in place (resized + recompressed) |
| `assets/images/logo.webp` (new) | WebP variant of `logo.png` |
| `assets/images/big-city-1.webp` (new) | WebP variant of `big-city-1.jpg` |
| `assets/images/big-city-2.webp` (new) | WebP variant of `big-city-2.jpg` |
| `assets/images/logo-large.png` | DELETED (verified unreferenced) |
| `readme.md` | Add an "Optimizing images" section documenting the recompression workflow |

---

## Task 0: Pre-flight — install tools, capture baseline, create safety branch

**Files:** None (environment setup + measurement)

- [ ] **Step 1: Verify required CLI tools are installed**

Run:
```bash
which magick && which cwebp
```

Expected: both print paths. If either is missing, install with:
```bash
brew install imagemagick webp
```
Then re-run the `which` check.

- [ ] **Step 2: Create a safety branch with the current state**

Run:
```bash
git status
```

Expected: clean working tree on `main` (no untracked or modified files).

Then:
```bash
git branch backup/pre-perf-images main
```

This preserves the current `assets/images/` originals on a branch we can recover from if recompression goes wrong.

Verify with:
```bash
git branch | grep backup
```

Expected output includes `backup/pre-perf-images`.

- [ ] **Step 3: Capture baseline page weight**

Run:
```bash
ls -la assets/images/ | awk '{sum+=$5} END {print "Total image bytes:", sum}'
```

Expected output: roughly `Total image bytes: 3300000` (about 3.3 MB).

Record the number — we'll compare at the end.

- [ ] **Step 4: (Optional) Capture baseline Lighthouse**

If the site is deployed to GitHub Pages, run Chrome → DevTools → Lighthouse → Performance → Mobile → Analyze on the live URL. Record the **Performance score**, **LCP**, **CLS**, and **TBT** values in a scratch note. This is for later comparison; if you can't run Lighthouse, the file-size measurement in Step 3 is sufficient evidence of progress.

- [ ] **Step 5: No commit yet** — pre-flight is observation only.

---

## Task 1: Drop the unused Material Icons stylesheet from all 4 pages

**Files:**
- Modify: `index.html` (around line 24–27)
- Modify: `pages/contact.html` (around line 28–31)
- Modify: `pages/docs.html`
- Modify: `pages/platform.html`

**Why first:** Smallest, lowest-risk change. Material Icons is referenced in all 4 pages but no `material-icons` class appears anywhere in the markup (verified via `grep -rn "material-icons" *.html pages/`). Removing it eliminates a render-blocking stylesheet request.

- [ ] **Step 1: Remove the `<link>` tag from `index.html`**

Find this block in `index.html`:
```html
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
    />
```

Delete the entire 4-line block (the `<link>` element including its closing `/>`).

- [ ] **Step 2: Remove the same block from each of the three subpages**

Repeat the same deletion in:
- `pages/contact.html`
- `pages/docs.html`
- `pages/platform.html`

In each file, the block has identical content (the URL is the same).

- [ ] **Step 3: Verify nothing in the codebase depends on Material Icons**

Run:
```bash
grep -rn "material-icons\|Material Icons" *.html pages/ css/ index.js
```

Expected: no output (the only references were the `<link>` tags we just removed).

- [ ] **Step 4: Manual smoke test — visual unchanged**

Open `index.html`, `pages/contact.html`, `pages/docs.html`, `pages/platform.html` in a browser. At desktop and mobile widths, confirm:
- All pages render normally.
- The mobile hamburger menu icon (top-right) still displays — it uses Bootstrap Icons, not Material Icons, so it should be unaffected.
- DevTools Console shows no errors.
- DevTools Network tab no longer shows a request to `fonts.googleapis.com/icon?family=Material+Icons`.

- [ ] **Step 5: Commit**

```bash
git add index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "perf: remove unused Material Icons stylesheet from all pages"
```

---

## Task 2: Replace Bootstrap Icons font with inline SVGs

**Files:**
- Modify: `index.html` (drops `<link>` to bootstrap-icons CDN; replaces 6 icon usages with SVGs)
- Modify: `pages/contact.html` (drops same `<link>`; replaces 1 icon — `bi-list`)
- Modify: `pages/docs.html` (same as contact)
- Modify: `pages/platform.html` (same as contact)

**Why:** Bootstrap Icons font is ~120 KB plus a stylesheet, but only 6 icon glyphs are used across the site. Inlining 6 SVGs costs ~2 KB total HTML.

The 6 needed icons (verified via `grep -ohE 'bi-[a-z0-9-]+' *.html pages/*.html | sort -u`):
- `1-circle-fill`, `2-circle-fill`, `3-circle-fill` — used in homepage "Specific Aims" section
- `arrow-right` — used in "Quick Start" cards
- `arrow-up-right` — used in commented-out CTA button (still useful to migrate for when it's reactivated; if it's still commented out, skip)
- `list` — used in mobile hamburger menu on every page

**Bootstrap Icons SVG source:** The canonical SVG files are at https://github.com/twbs/icons/tree/main/icons (MIT-licensed). The SVG strings provided below are taken from version 1.11.3 (the version currently CDN-loaded). If you want to verify, the source for each icon is at `https://icons.getbootstrap.com/icons/<name>/`.

- [ ] **Step 1: Remove Bootstrap Icons `<link>` from `index.html`**

Find this block (lines 28–34 currently):
```html
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css"
      integrity="sha512-dPXYcDub/aeb08c63jRq/k6GaKccl256JQy/AnOq7CAnEZ9FzSL9wSbcZkMp4R26vBsMLFYH4kQ67/bbV8XaCQ=="
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
```

Delete the entire block.

- [ ] **Step 2: Replace `bi-list` icon in `index.html` (mobile hamburger button)**

Current markup (around line 69–74):
```html
      <button
        class="bi bi-list tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-black lg:tw-hidden"
        onclick="toggleHeader()"
        aria-label="menu"
        id="collapse-btn"
      ></button>
```

Replace with:
```html
      <button
        class="tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-black lg:tw-hidden"
        onclick="toggleHeader()"
        aria-label="menu"
        id="collapse-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
        </svg>
      </button>
```

**Note about `index.js`:** The toggle code in `index.js` adds/removes classes `bi-list` and `bi-x` on this button (lines 21–22, 28–30). After migrating to inline SVG, those class manipulations no longer change anything visible — but they don't break anything either. We could refactor `index.js` to swap the inline SVG content instead, but that's out of scope for this perf pass. **Action: leave `index.js` alone for now**, accepting that the hamburger icon won't morph into an X when open. (User can revisit in Spec B's design refresh.) Note this in the commit message.

- [ ] **Step 3: Replace the three `bi-N-circle-fill` icons in `index.html` (Specific Aims section)**

Find each of these three occurrences (around lines 196, 210, 224):

```html
              <i class="bi bi-1-circle-fill tw-text-2xl"></i>
```
```html
              <i class="bi bi-2-circle-fill tw-text-2xl"></i>
```
```html
              <i class="bi bi-3-circle-fill tw-text-2xl"></i>
```

Replace **`bi-1-circle-fill`** with:
```html
              <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" class="tw-text-2xl">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M9.283 4.002V12H7.971V5.338h-.065L6.072 6.656V5.385l1.899-1.383z"/>
              </svg>
```

Replace **`bi-2-circle-fill`** with:
```html
              <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" class="tw-text-2xl">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.646 6.24c0-.691.493-1.306 1.336-1.306.756 0 1.313.492 1.313 1.236 0 .697-.469 1.23-.902 1.705l-2.971 3.293V12h5.344v-1.107H8.62v-.077l1.74-1.851c.523-.567 1.396-1.385 1.396-2.42 0-1.224-.988-2.317-2.426-2.317-1.501 0-2.512 1.114-2.512 2.49v.043h1.231v-.042z"/>
              </svg>
```

Replace **`bi-3-circle-fill`** with:
```html
              <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" class="tw-text-2xl">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M7.918 8.414h-.879V7.342h.838c.78 0 1.348-.522 1.342-1.237 0-.709-.563-1.195-1.348-1.195-.79 0-1.312.498-1.348 1.055H5.275c.036-1.137.95-2.115 2.625-2.121 1.594-.012 2.608.885 2.637 2.062.023 1.137-.885 1.776-1.482 1.875v.07c.703.07 1.71.64 1.734 1.917.024 1.459-1.277 2.396-2.93 2.396-1.705 0-2.707-.973-2.748-2.157h1.336c.029.61.633 1.085 1.418 1.097.885.012 1.482-.522 1.471-1.289-.012-.785-.644-1.213-1.518-1.213z"/>
              </svg>
```

- [ ] **Step 4: Replace `bi-arrow-right` icons in `index.html` (Quick Start cards)**

There are three identical occurrences in the Quick Start section. Each looks like:
```html
            <span>
              <i class="bi bi-arrow-right"></i>
            </span>
```

Replace **each** with:
```html
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
              </svg>
            </span>
```

Use `replace_all`-style logic: each of the three Quick Start cards has the same icon, replace all three.

- [ ] **Step 5: Handle `bi-arrow-up-right` and the commented-out social icons in `index.html`**

The `bi-arrow-up-right` icon and `bi-github`/`bi-twitter`/`bi-stack-overflow` icons appear inside HTML comments (`<!-- ... -->`) at lines 52–67 and 317–329. They are not rendered. **Leave them as-is** — they're inactive markup. Spec B can decide whether to reactivate or remove them.

- [ ] **Step 6: Verify `index.html` no longer references Bootstrap Icons**

Run:
```bash
grep -nE 'class="[^"]*\bbi[- ]' index.html
```

Expected: no output (all rendered `<i class="bi …">` usages replaced; only comments may match).

To check including comments:
```bash
grep -n 'bi-' index.html
```

Expected: any remaining hits are inside `<!-- ... -->` blocks (the commented-out CTA + social icons).

- [ ] **Step 7: Apply the same Bootstrap Icons removal to `pages/contact.html`**

(a) Delete the same Bootstrap Icons `<link>` block (around lines 32–38) — the URL/integrity hash are identical to the one in index.html.

(b) Replace the single `bi-list` button (around lines 61–66):
```html
      <button
        class="bi bi-list tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-black lg:tw-hidden"
        onclick="toggleHeader()"
        aria-label="menu"
        id="collapse-btn"
      ></button>
```

with the same SVG version used in Step 2:
```html
      <button
        class="tw-absolute tw-right-3 tw-top-3 tw-z-50 tw-text-3xl tw-text-black lg:tw-hidden"
        onclick="toggleHeader()"
        aria-label="menu"
        id="collapse-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
        </svg>
      </button>
```

- [ ] **Step 8: Apply the same removal to `pages/docs.html`**

Same two changes as Step 7. The `bi-list` button has identical markup; only line numbers differ.

- [ ] **Step 9: Apply the same removal to `pages/platform.html`**

Same two changes as Step 7.

- [ ] **Step 10: Manual smoke test — icons render correctly**

Open each page in a browser at both desktop and mobile widths. Confirm:
- Homepage Specific Aims section shows three numbered circle icons (1, 2, 3) inline next to each heading.
- Homepage Quick Start cards show right-arrow icons next to each card title.
- Mobile hamburger menu icon (top-right at narrow viewport) renders as three horizontal lines on every page.
- DevTools Network tab shows **no request** to `cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/...`.
- DevTools Console: no errors.

- [ ] **Step 11: Commit**

```bash
git add index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "perf: replace Bootstrap Icons font with 6 inline SVGs

Drops ~120 KB icon font + render-blocking stylesheet on every page.
Hamburger menu no longer animates from list to X when toggled (the
class-swap in index.js no longer has a target); will be addressed in
the design refresh."
```

---

## Task 3: Add `defer` to GSAP and `index.js` scripts on all 4 pages

**Files:**
- Modify: `index.html` (lines 334–347)
- Modify: `pages/contact.html` (lines 246–259)
- Modify: `pages/docs.html` (lines 164–177)
- Modify: `pages/platform.html` (lines 227–240)

**Why:** GSAP and `index.js` are not needed for first paint. Adding `defer` lets the browser parse them in parallel with HTML rather than blocking. `defer` preserves document order on execution, so the existing `gsap.registerPlugin(ScrollTrigger)` line in `index.js` will still find both globals defined.

- [ ] **Step 1: Add `defer` to all three scripts in `index.html`**

Find the three `<script>` tags at the bottom (lines 334–347):

```html
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/gsap.min.js"
    integrity="sha512-B1lby8cGcAUU3GR+Fd809/ZxgHbfwJMp0jLTVfHiArTuUt++VqSlJpaJvhNtRf3NERaxDNmmxkdx2o+aHd4bvw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  ></script>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/ScrollTrigger.min.js"
    integrity="sha512-AY2+JxnBETJ0wcXnLPCcZJIJx0eimyhz3OJ55k2Jx4RtYC+XdIi2VtJQ+tP3BaTst4otlGG1TtPJ9fKrAUnRdQ=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  ></script>

  <script src="./index.js"></script>
```

Add `defer` to each. After the change:

```html
  <script
    defer
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/gsap.min.js"
    integrity="sha512-B1lby8cGcAUU3GR+Fd809/ZxgHbfwJMp0jLTVfHiArTuUt++VqSlJpaJvhNtRf3NERaxDNmmxkdx2o+aHd4bvw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  ></script>
  <script
    defer
    src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.0/ScrollTrigger.min.js"
    integrity="sha512-AY2+JxnBETJ0wcXnLPCcZJIJx0eimyhz3OJ55k2Jx4RtYC+XdIi2VtJQ+tP3BaTst4otlGG1TtPJ9fKrAUnRdQ=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  ></script>

  <script defer src="./index.js"></script>
```

- [ ] **Step 2: Repeat for `pages/contact.html`**

Same change to all three `<script>` tags. The src for `index.js` here is `../index.js` (subpage path), but otherwise identical.

- [ ] **Step 3: Repeat for `pages/docs.html`**

Same change.

- [ ] **Step 4: Repeat for `pages/platform.html`**

Same change.

- [ ] **Step 5: Manual smoke test — animations still work**

Reload `index.html` in the browser. Confirm:
- The hero text and image fade/slide in on initial load (the `reveal-hero-text` and `reveal-hero-img` GSAP animations).
- Scrolling the page triggers the section reveal animations (`reveal-up` class, ScrollTrigger).
- Mobile menu toggle still opens/closes when the hamburger button is clicked (this uses `index.js` non-GSAP code).
- DevTools Console: no errors.

If any animation fails, revert the change to that script tag and investigate. (Most likely cause: the `gsap.registerPlugin(ScrollTrigger)` in `index.js` ran before ScrollTrigger was loaded — but `defer` should preserve order. If it does break, an alternative is to remove `defer` from `index.js` and instead wrap its body in a `DOMContentLoaded` listener.)

- [ ] **Step 6: Commit**

```bash
git add index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "perf: defer GSAP and index.js script loading"
```

---

## Task 4: Recompress images and generate WebP variants

**Files:**
- Modify in place: `assets/images/logo.png`, `assets/images/big-city-1.jpg`, `assets/images/big-city-2.jpg`
- Create: `assets/images/logo.webp`, `assets/images/big-city-1.webp`, `assets/images/big-city-2.webp`
- Delete: `assets/images/logo-large.png`

**Why:** This is the single largest impact in the entire plan. Going from a 1.3 MB panorama to ~200 KB and a 722 KB logo to ~80 KB is the difference between 3 MB and 500 KB of image weight.

- [ ] **Step 1: Confirm safety branch exists**

```bash
git branch | grep backup/pre-perf-images
```

Expected: a line containing `backup/pre-perf-images`. If missing, create it now (`git branch backup/pre-perf-images main`) before proceeding — image recompression is destructive at the file level (though git history still preserves originals).

- [ ] **Step 2: Resize and recompress the panoramas**

```bash
magick assets/images/big-city-1.jpg -resize '1920x>' -quality 82 -strip assets/images/big-city-1.jpg
magick assets/images/big-city-2.jpg -resize '1920x>' -quality 82 -strip assets/images/big-city-2.jpg
```

Verify file sizes shrunk:
```bash
ls -la assets/images/big-city-1.jpg assets/images/big-city-2.jpg
```

Expected: `big-city-1.jpg` is now under ~150 KB, `big-city-2.jpg` is now under ~250 KB. If sizes are still large, lower the `-quality` to 78 and re-run, then re-check.

- [ ] **Step 3: Recompress the logo PNG**

```bash
magick assets/images/logo.png -strip -define png:compression-level=9 assets/images/logo.png
```

Verify:
```bash
ls -la assets/images/logo.png
```

Expected: under ~150 KB. If still large (PNG of a complex image won't compress dramatically), accept the result — the WebP variant in Step 4 will give us the real savings.

- [ ] **Step 4: Generate WebP variants**

```bash
cwebp -q 82 assets/images/big-city-1.jpg -o assets/images/big-city-1.webp
cwebp -q 82 assets/images/big-city-2.jpg -o assets/images/big-city-2.webp
cwebp -lossless assets/images/logo.png -o assets/images/logo.webp
```

Verify the new files exist and are smaller than their originals:
```bash
ls -la assets/images/*.webp assets/images/big-city-*.jpg assets/images/logo.png
```

Expected: each `.webp` is smaller than its source. `logo.webp` should be 30–80 KB, panoramas should be 80–180 KB each.

- [ ] **Step 5: Delete the unreferenced `logo-large.png`**

Confirm it's truly unreferenced:
```bash
grep -rn "logo-large" *.html pages/ index.js css/
```

Expected: no output.

If clean, delete:
```bash
rm assets/images/logo-large.png
```

- [ ] **Step 6: Visual smoke test — images still look right**

Open `index.html` in a browser. Confirm:
- The hero logo image (top of homepage) renders without visible artifacts.
- The two panorama images (between sections) render without visible artifacts.

If you see compression artifacts (banding, blockiness, blurring of text in the logo), bump quality and re-run that file's command. For example, for the logo: `cwebp -lossless` is already lossless so should be fine; for the JPGs, try `-quality 88` instead of 82.

- [ ] **Step 7: Capture new total**

```bash
ls -la assets/images/ | awk '{sum+=$5} END {print "Total image bytes:", sum}'
```

Compare against the baseline from Task 0 Step 3.

Expected: roughly **1 MB or less** (down from ~3.3 MB). The `<picture>` markup in Task 5 will mean only the WebP files actually load on modern browsers, so the effective transfer is even smaller.

- [ ] **Step 8: Commit**

```bash
git add assets/images/
git commit -m "perf: recompress images and add WebP variants

- big-city-1.jpg: 238 KB -> ~120 KB (resized to 1920px wide)
- big-city-2.jpg: 1.3 MB -> ~200 KB (resized to 1920px wide)
- logo.png: 722 KB -> recompressed
- Added WebP siblings for all three
- Deleted unreferenced logo-large.png (739 KB)"
```

---

## Task 5: Replace `<img>` with `<picture>` and add layout-stability + lazy attributes

**Files:**
- Modify: `index.html` (6 `<img>` tags to update)
- Modify: `pages/contact.html` (any `<img>` tags — verify what's there)
- Modify: `pages/docs.html` (verify)
- Modify: `pages/platform.html` (verify)

**Why:** Without `width`/`height` attributes, images cause layout shift as they load. Without `loading="lazy"`, off-screen images delay first paint. The `<picture>` element serves WebP to modern browsers with fallback to original formats automatically.

**Important:** `width`/`height` HTML attributes are intrinsic-pixel hints, not CSS sizing. The CSS classes (e.g. `tw-w-full tw-h-full`) still control rendered size. The browser uses the `width`/`height` ratio to reserve correct vertical space before the image loads.

**Find the actual pixel dimensions of each image:**
```bash
magick identify assets/images/logo.png assets/images/big-city-1.jpg assets/images/big-city-2.jpg \
  assets/images/harddrive.jpg assets/images/bookshelf.jpg assets/images/letter.jpg
```

Record the `WIDTH x HEIGHT` for each — those are the values you'll plug into the `width=` and `height=` attributes below. The values shown in the snippets below are placeholders **(replace with the actual dimensions from `magick identify`)**.

- [ ] **Step 1: Update the homepage hero image (`index.html` lines ~110–120)**

Current:
```html
            <img
              src="./assets/images/logo.png"
              alt="app"
              class="reveal-hero-img tw-z-[1] tw-h-full tw-w-full tw-object-contain"
            />
```

Replace with `<picture>` and add `width`, `height`, `decoding="async"`, `fetchpriority="high"` (no `loading="lazy"` — this is the LCP element, we want it eager):
```html
            <picture>
              <source srcset="./assets/images/logo.webp" type="image/webp" />
              <img
                src="./assets/images/logo.png"
                alt="SPACESCANS logo"
                width="REPLACE_WITH_ACTUAL_WIDTH"
                height="REPLACE_WITH_ACTUAL_HEIGHT"
                decoding="async"
                fetchpriority="high"
                class="reveal-hero-img tw-z-[1] tw-h-full tw-w-full tw-object-contain"
              />
            </picture>
```

Replace `REPLACE_WITH_ACTUAL_WIDTH` and `REPLACE_WITH_ACTUAL_HEIGHT` with the dimensions output by `magick identify` for `logo.png`. Also tighten the alt text from "app" to "SPACESCANS logo" — the original was a template placeholder.

- [ ] **Step 2: Update the first panorama (`index.html` lines ~127–133)**

Current:
```html
        <img
          src="./assets/images/big-city-1.jpg"
          alt="A panorama of a big city. It transitions from sunset to nighttime from left to right. There are lots of skyscrapers across a waterfront."
          class="reveal-hero-img tw-z-[1] tw-h-full tw-w-full tw-object-contain"
        />
```

Replace:
```html
        <picture>
          <source srcset="./assets/images/big-city-1.webp" type="image/webp" />
          <img
            src="./assets/images/big-city-1.jpg"
            alt="A panorama of a big city. It transitions from sunset to nighttime from left to right. There are lots of skyscrapers across a waterfront."
            width="REPLACE_WITH_ACTUAL_WIDTH"
            height="REPLACE_WITH_ACTUAL_HEIGHT"
            loading="lazy"
            decoding="async"
            class="reveal-hero-img tw-z-[1] tw-h-full tw-w-full tw-object-contain"
          />
        </picture>
```

- [ ] **Step 3: Update the second panorama (`index.html` lines ~169–173)**

Same pattern as Step 2, but with `big-city-2.jpg` / `big-city-2.webp` and the appropriate alt text already in the file ("A panorama of a big city at night with lots of skyscrapers across a waterfront").

- [ ] **Step 4: Update the three Quick Start card images (`index.html` lines ~255, ~273, ~291)**

These are smaller images (~25 KB each, no WebP variant generated since they're already small). Just add `width`, `height`, `loading="lazy"`, `decoding="async"`. **Do not wrap in `<picture>` — no WebP version exists for these.**

For `harddrive.jpg`:
```html
            <img
              src="./assets/images/harddrive.jpg"
              alt="article image"
              width="REPLACE_WITH_ACTUAL_WIDTH"
              height="REPLACE_WITH_ACTUAL_HEIGHT"
              loading="lazy"
              decoding="async"
              class="tw-h-full tw-w-full tw-object-cover"
              srcset=""
            />
```

Repeat for `bookshelf.jpg` and `letter.jpg` with their respective dimensions and alt-stays-as-`"article image"` (or improve the alt as you go: "Hard drive illustration", "Bookshelf illustration", "Letter illustration" — stronger semantic alt).

- [ ] **Step 5: Inventory and update `<img>` tags in subpages**

Run:
```bash
grep -n "<img" pages/contact.html pages/docs.html pages/platform.html
```

For each `<img>` found, repeat the pattern from Step 4 (just add `width`, `height`, `loading="lazy"`, `decoding="async"` — no `<picture>` wrapping unless you also generated a WebP variant for that asset, which we did not for any subpage-only images).

If a subpage has no `<img>` tags, skip it.

- [ ] **Step 6: Manual smoke test — no layout shift, lazy loading works**

Open `index.html` with DevTools open:

(a) **Network tab** — set throttling to "Slow 4G". Hard-reload the page. Confirm the panorama images request **after** the hero, not concurrent (they should be lazy-loaded as you scroll toward them).

(b) **Performance / Layout Shift** — in the Performance panel, record a page load. CLS (Cumulative Layout Shift) should be near 0. Before this change it would have spiked when each image loaded; now the reserved width/height prevents shift.

(c) **Verify WebP serves to modern browsers** — in the Network tab on a modern Chrome, confirm `big-city-1.webp` and `big-city-2.webp` are requested (not the `.jpg` versions). The `Type` column should show `webp`.

(d) **Visual smoke test** — confirm pages still look identical to before.

- [ ] **Step 7: Commit**

```bash
git add index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "perf: use <picture> with WebP, add width/height/lazy/decoding to images"
```

---

## Task 6: Document the image optimization workflow in readme.md

**Files:**
- Modify: `readme.md`

**Why:** Anyone adding new images later needs to follow the same compression pipeline. Without docs, the next person will commit a fresh 2 MB JPG and undo the work.

- [ ] **Step 1: Append a new section to `readme.md`**

Open `readme.md`. After the existing "Usage" section, append the block below. **Note:** in the plan below the outer fence is four backticks so the inner triple-backtick code blocks render properly. When pasting into `readme.md`, copy only the content between (and including) `## Optimizing Images` and the final triple-backtick line — drop the four-backtick outer fence.

````markdown
## Optimizing Images

Before committing any new image asset, recompress it and generate a WebP variant. The site uses `<picture>` elements that prefer WebP and fall back to the original format.

Required CLI tools (one-time install):

```bash
brew install imagemagick webp
```

For a JPEG (photos, screenshots, panoramas):

```bash
# Resize to a sensible max width and recompress in place
magick assets/images/your-image.jpg -resize '1920x>' -quality 82 -strip assets/images/your-image.jpg

# Generate WebP variant
cwebp -q 82 assets/images/your-image.jpg -o assets/images/your-image.webp
```

For a PNG (logos, illustrations with transparency):

```bash
magick assets/images/your-image.png -strip -define png:compression-level=9 assets/images/your-image.png
cwebp -lossless assets/images/your-image.png -o assets/images/your-image.webp
```

Then reference both formats with `<picture>` in the HTML:

```html
<picture>
  <source srcset="./assets/images/your-image.webp" type="image/webp" />
  <img
    src="./assets/images/your-image.jpg"
    alt="Descriptive alt text"
    width="1920"
    height="1080"
    loading="lazy"
    decoding="async"
    class="..."
  />
</picture>
```

For above-the-fold (hero) images, omit `loading="lazy"` and add `fetchpriority="high"` instead.
````

- [ ] **Step 2: Verify readme renders correctly**

Open `readme.md` in a markdown previewer (or on GitHub after pushing) — confirm the code blocks render and the section appears below "Usage".

- [ ] **Step 3: Commit**

```bash
git add readme.md
git commit -m "docs: add image optimization workflow to README"
```

---

## Task 7: Final verification and acceptance check

**Files:** None (measurement only)

- [ ] **Step 1: Total image weight**

```bash
ls -la assets/images/ | awk '{sum+=$5} END {print "Total image bytes:", sum}'
```

Acceptance: under **1.5 MB** total across all images (originals + WebP variants combined). Modern browsers will only fetch the WebP versions, so effective network transfer is smaller still.

- [ ] **Step 2: HTTP requests audit**

Open `index.html` in a fresh browser (or hard-reload with cache disabled). In DevTools Network tab, confirm:
- **No** request to `fonts.googleapis.com/icon?family=Material+Icons`
- **No** request to `cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/...`
- The two GSAP requests still happen but no longer block render (look at the "blocking" or "render" annotations in the Performance panel — they should not be in the critical path).
- The page renders before GSAP finishes loading (test with Slow 4G throttling).

- [ ] **Step 3: Lighthouse measurement**

Run Chrome DevTools Lighthouse on the deployed site (mobile profile, Performance category). Compare to the baseline you captured in Task 0 Step 4.

Acceptance:
- Performance score ≥ **90** desktop, ≥ **75** mobile
- LCP under **2.5 s** on simulated mobile
- CLS under **0.1**

If LCP is still high, inspect what the LCP element is in the Lighthouse report. Most likely candidates remaining:
  - The hero image (`logo.webp`) — if so, ensure `fetchpriority="high"` is in place
  - A late-rendering text element waiting on a font — but we use only system fonts (mono), so this shouldn't be the case
- If CLS is still high, the `width`/`height` attributes were not added correctly to one of the images. Inspect each image element and confirm the attributes are present.

If the Lighthouse score does not meet acceptance, list the top three Lighthouse opportunities and decide whether they are in scope for Spec A or should be deferred to a follow-up. Don't keep iterating without checking back in.

- [ ] **Step 4: Visual regression sweep**

For each of the four pages (`index.html`, `pages/contact.html`, `pages/docs.html`, `pages/platform.html`) at desktop (1440px) and mobile (375px) widths:
- Visual appearance unchanged from before
- All images render
- Hamburger menu icon renders
- Numbered circle icons render (homepage only)
- Arrow icons render (homepage only)
- GSAP entrance animations play on load
- ScrollTrigger reveal animations play on scroll
- DevTools Console clean (no errors)

- [ ] **Step 5: Push and verify on live site**

```bash
git log --oneline -10
```

Confirm 6 new commits on top of the previous `main` HEAD (one per task, plus this final task is no-commit).

```bash
git push origin main
```

Wait for GitHub Pages to redeploy (~1 minute), then re-run Lighthouse on the live URL and confirm acceptance.

- [ ] **Step 6: No commit for this task** — it's verification only.

If everything passes acceptance, the work is done. Spec B (email signup + IU/Regenstrief brand refresh) can begin.

---

## Out-of-scope follow-ups (already noted in spec, not addressed by this plan)

- Service worker / offline support
- HTTP/2 push, `<link rel="preload">`
- Replacing GSAP with smaller alternative
- Tighter Tailwind purge build
- Refactoring `index.js` so the hamburger button morphs to an X when expanded (deferred to Spec B's design refresh)
