# SPACESCANS Email Signup + Brand Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current portfolio-template aesthetic with a modern-academic look fit for an NIH-funded IU + Regenstrief research project, and add MailerLite-backed email signup in two locations (a homepage section and a sitewide footer form).

**Architecture:** Pure static HTML/CSS/JS, same stack as today. Design tokens (CSS custom properties) added to `css/index.css` form a single source of truth. Tailwind utilities continue to handle layout while semantic component classes (`.section-head`, `.signup-form`, etc.) handle typography + color. Google Fonts loaded with preconnect + `font-display: swap`. MailerLite "universal embed" JS deferred and wired to two custom-styled forms.

**Tech Stack:** HTML, Tailwind CSS (already built), vanilla CSS custom properties, vanilla JS, MailerLite Universal Embed JS, Google Fonts (Source Serif 4 + Inter).

**Spec:** `docs/superpowers/specs/2026-05-06-email-signup-and-brand-refresh-design.md`

**Verification model:** No automated tests (static site). "Verification" = grep checks + read-after-write inspection + manual browser smoke test by user at the end of each task batch. Each task ends with concrete grep/read commands so implementer subagents can confirm changes landed correctly without a browser.

---

## File Structure

| File | Role |
|---|---|
| `css/index.css` | **Source of truth for the design system.** Holds CSS custom properties (`--crimson`, `--font-serif`, etc.) and component classes (`.section-head`, `.lead`, `.muted`, `.signup-form`, `.visually-hidden`, `.site-header`, `.site-footer`, `.aim-card`, `.quickstart-card`, `.stay-updated`). Existing rules updated to use the new tokens. |
| `index.html` | Homepage. Header + footer rebuilt; hero, "Why It Matters", Specific Aims, Quick Start sections restyled; new "Stay Updated" section inserted before the footer. MailerLite universal-embed `<script>` and form wiring `<script>` added (deferred). |
| `pages/contact.html` | Header + footer rebuilt. Body content keeps copy but inherits new typography + crimson section heads. Footer-embedded signup form added. |
| `pages/docs.html` | Same pattern as contact. |
| `pages/platform.html` | Same pattern as contact. |
| `index.js` | Unchanged (hamburger toggle still works as today). |
| `assets/js/mailerlite-form.js` (NEW) | Vanilla JS that intercepts submissions on `.signup-form` elements, calls MailerLite's universal embed API, and updates the inline status div. Single file shared by both signup form instances. |
| `readme.md` | New "Email signup setup" section (MailerLite one-time setup steps) and "Brand & typography" section (the new design tokens). |

**Branch:** All work happens on a new branch `brand/spec-b` off `main`. Final merge produces a single merge commit on `main`.

**Notes about constraints:**
- The site uses a pre-built Tailwind CSS file (`css/tailwind-build.css`). New utility classes that aren't already in the pre-built CSS won't work without a rebuild. Therefore: prefer existing Tailwind classes for layout (flex/grid/spacing), add new visual styles via plain CSS in `css/index.css` using semantic class names. Do not add new arbitrary Tailwind utility classes that haven't already been built (check `css/tailwind-build.css` if unsure).
- `index.js` references the hamburger button via the `collapse-btn` ID. Header markup must keep that ID intact.

---

## Task 0: Pre-flight — feature branch + safety check

**Files:** None (environment setup only).

- [ ] **Step 1: Verify clean working tree on `main`**

```bash
git status
git branch --show-current
```

Expected: `nothing to commit, working tree clean` and current branch is `main`.

- [ ] **Step 2: Create the feature branch**

```bash
git checkout -b brand/spec-b
```

Expected: `Switched to a new branch 'brand/spec-b'`.

All subsequent commits land on this branch. Do NOT push to `main` until the branch is reviewed and merged at the end.

- [ ] **Step 3: Capture baseline page weight (sanity check)**

```bash
ls -la assets/images/ | awk '{sum+=$5} END {print "Image bytes:", sum}'
```

Expected: ~648,742 bytes (Spec A's optimized image set). Record this number; the perf budget audit at the end will confirm we didn't regress.

- [ ] **Step 4: No commit** — pre-flight is observation only.

---

## Task 1: Add design tokens + font loading to `css/index.css`

**Files:**
- Modify: `css/index.css`
- Modify: `index.html`, `pages/contact.html`, `pages/docs.html`, `pages/platform.html` (add `<link>` tags for Google Fonts preconnect)

**Why first:** Every subsequent task uses these tokens. Defining them up front means later tasks reference `var(--crimson)` etc. instead of hardcoding hex values.

- [ ] **Step 1: Read the current `css/index.css`**

Use Read on `/Users/xinghe/Downloads/spacescans-landing-page/css/index.css`. Note the existing rules and where they end.

- [ ] **Step 2: Prepend the design tokens at the top of `css/index.css`**

Insert at the very top of `css/index.css` (before any existing rules):

```css
/* --- Design tokens (Spec B) ---------------------------------- */
:root {
  /* Color */
  --crimson:      #990000;
  --crimson-deep: #6F0000;
  --navy:         #1E3A5F;
  --cream:        #F8F6F1;
  --ink:          #1A1A1A;
  --muted:        #595959;
  --rule:         #E5E1D8;

  /* Typography */
  --font-serif: "Source Serif 4", Georgia, serif;
  --font-sans:  "Inter", system-ui, -apple-system, sans-serif;

  /* Type scale (rem) */
  --fs-hero:  3.5rem;
  --fs-h1:    2.5rem;
  --fs-h2:    2rem;
  --fs-h3:    1.5rem;
  --fs-body:  1rem;
  --fs-lead:  1.125rem;
  --fs-small: 0.875rem;
}

/* Body baseline — overrides the existing tw-font-mono on <body> */
body {
  font-family: var(--font-sans);
  color: var(--ink);
  background: var(--cream);
  line-height: 1.6;
}

/* Heading defaults */
h1, h2, h3 {
  font-family: var(--font-serif);
  color: var(--crimson);
  line-height: 1.2;
}

/* Utility classes */
.lead         { font-size: var(--fs-lead); color: var(--ink); }
.muted        { color: var(--muted); }
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}

/* Section heading with crimson left-rule (replaces tw-bg-orange-200) */
.section-head {
  border-left: 4px solid var(--crimson);
  padding-left: 1rem;
  font-family: var(--font-serif);
  color: var(--crimson);
  font-size: var(--fs-h1);
  font-weight: 700;
  margin-bottom: 1.5rem;
}

/* --- end design tokens --------------------------------------- */
```

The existing rules below this block stay; later tasks will audit and update them to use the new tokens.

- [ ] **Step 3: Add the Google Fonts `<link>` tags to `index.html`**

In the `<head>` of `/Users/xinghe/Downloads/spacescans-landing-page/index.html`, AFTER the existing `<link rel="stylesheet" href="css/index.css" />` line (currently around line 22) and BEFORE `</head>`, insert:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:wght@400;600;700&display=swap"
    />
```

- [ ] **Step 4: Add the same `<link>` tags to each subpage**

Repeat Step 3 for `pages/contact.html`, `pages/docs.html`, `pages/platform.html`. The relative path to `css/index.css` is `../css/index.css` on subpages but the Google Fonts URLs are identical.

- [ ] **Step 5: Verify**

```bash
grep -c 'fonts.googleapis.com/css2?family=Inter' index.html pages/*.html
```

Expected: each file shows `1`.

```bash
grep -c '\-\-crimson' css/index.css
```

Expected: at least `1` (the `--crimson` definition appears once; later usages will appear in subsequent tasks).

```bash
grep -c '\-\-font-serif' css/index.css
```

Expected: at least `1`.

- [ ] **Step 6: Commit**

```bash
git add css/index.css index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "feat(brand): add design tokens, body baseline, and Google Fonts loading"
```

---

## Task 2: Rebuild the sitewide header

**Files:**
- Modify: `index.html` (header block at top of `<body>`)
- Modify: `pages/contact.html`, `pages/docs.html`, `pages/platform.html` (same header block)
- Modify: `css/index.css` (add `.site-header`, `.site-header__brand`, etc. component classes)

**Why now:** Header is sitewide chrome. Every page should look the same after this task.

**Important:** `index.js` references the button with id `collapse-btn` and div with id `collapsed-header-items`. These IDs MUST be preserved or the mobile menu toggle will break.

- [ ] **Step 1: Add header component CSS to `css/index.css`**

Append to `css/index.css` (after the design-tokens block):

```css
/* --- Site header --------------------------------------------- */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #fff;
  border-bottom: 2px solid var(--crimson);
  padding: 0.75rem 5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-sans);
}

.site-header__brand {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}
.site-header__brand-name {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--crimson);
  letter-spacing: -0.01em;
  line-height: 1;
}
.site-header__brand-meta {
  margin-top: 0.25rem;
  font-size: 0.6875rem;     /* 11px */
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  line-height: 1.2;
}

.site-header__nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.site-header__nav a {
  color: var(--ink);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9375rem;
  position: relative;
  padding: 0.25rem 0;
}
.site-header__nav a:hover {
  color: var(--crimson);
}
.site-header__nav a:hover::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -2px;
  height: 2px;
  background: var(--crimson);
}

/* Mobile (under 1024px) — collapsible nav */
@media (max-width: 1023px) {
  .site-header__brand-meta { display: none; }
  .site-header__nav {
    position: absolute;
    top: 100%;
    right: 0;
    flex-direction: column;
    align-items: flex-end;
    background: #fff;
    border: 1px solid var(--rule);
    border-top: 2px solid var(--crimson);
    padding: 1rem 1.5rem;
    width: 0;
    overflow: hidden;
    transition: width 0.2s ease;
  }
  .site-header__nav.is-open { width: 60vw; }
}

.site-header__menu-btn {
  display: none;
  background: transparent;
  border: 0;
  color: var(--ink);
  font-size: 1.75rem;
  padding: 0.25rem;
  cursor: pointer;
}
@media (max-width: 1023px) {
  .site-header__menu-btn { display: block; }
}
/* --- end site header ----------------------------------------- */
```

- [ ] **Step 2: Replace the header in `index.html`**

The current header is around lines 26–68 of `index.html`. Replace the entire `<header>...</header>` block with:

```html
    <header class="site-header">
      <a class="site-header__brand" href="./index.html">
        <span class="site-header__brand-name">SPACESCANS</span>
        <span class="site-header__brand-meta">
          Indiana University &amp; Regenstrief Institute · NIH R24ES036131
        </span>
      </a>
      <nav class="site-header__nav" id="collapsed-header-items">
        <a href="pages/platform.html">Data Catalog</a>
        <a href="pages/docs.html">Docs</a>
        <a href="pages/contact.html">Contact</a>
      </nav>
      <button
        class="site-header__menu-btn"
        onclick="toggleHeader()"
        aria-label="Toggle navigation"
        id="collapse-btn"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
        </svg>
      </button>
    </header>
```

The IDs `collapse-btn` and `collapsed-header-items` are preserved so `index.js` keeps working without changes.

- [ ] **Step 3: Update `index.js` toggle to use the new class**

The current `index.js` toggles `width` style and an `opacity-100` class. Now we use a class `is-open`. Read the current `index.js` and update the `toggleHeader` function. Replace this block:

```javascript
function toggleHeader() {
  if (isHeaderCollapsed) {
    // collapseHeaderItems.classList.remove("max-md:tw-opacity-0")
    collapseHeaderItems.classList.add("opacity-100");
    collapseHeaderItems.style.width = "60vw";
    collapseBtn.classList.remove("bi-list");
    collapseBtn.classList.add("bi-x", "max-lg:tw-fixed");
    isHeaderCollapsed = false;

    setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1);
  } else {
    collapseHeaderItems.classList.remove("opacity-100");
    collapseHeaderItems.style.width = "0vw";
    collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed");
    collapseBtn.classList.add("bi-list");
    isHeaderCollapsed = true;
    window.removeEventListener("click", onHeaderClickOutside);
  }
}
```

with:

```javascript
function toggleHeader() {
  if (isHeaderCollapsed) {
    collapseHeaderItems.classList.add("is-open");
    isHeaderCollapsed = false;
    setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1);
  } else {
    collapseHeaderItems.classList.remove("is-open");
    isHeaderCollapsed = true;
    window.removeEventListener("click", onHeaderClickOutside);
  }
}
```

The dead `bi-list`/`bi-x` class manipulation (already a no-op since Spec A removed Bootstrap Icons) is gone. The CSS `.is-open { width: 60vw }` rule from Step 1 handles the open-state visual.

- [ ] **Step 4: Replace the header in `pages/contact.html`**

Find the existing `<header>...</header>` (around lines 41–67) and replace with the same markup from Step 2, **adjusting the relative paths**:
- `href="./index.html"` becomes `href="../index.html"`
- `href="pages/platform.html"` becomes `href="../pages/platform.html"`
- `href="pages/docs.html"` becomes `href="../pages/docs.html"`
- `href="pages/contact.html"` becomes `../pages/contact.html`

- [ ] **Step 5: Replace the header in `pages/docs.html` and `pages/platform.html`**

Same pattern as Step 4. Use the same adjusted paths.

- [ ] **Step 6: Add top padding to `<body>` so content isn't hidden under the fixed header**

The existing layout uses `tw-min-h-[100vh]` on hero sections to fill the viewport. The fixed header overlays. The previous design had `max-md:tw-mt-[50px]` on sections — we'll replace with a global body padding for cleaner behavior.

In `css/index.css`, append:
```css
body {
  padding-top: 60px;  /* matches header height */
}
@media (max-width: 1023px) {
  body { padding-top: 56px; }
}
```

- [ ] **Step 7: Verify**

```bash
grep -c 'site-header__brand-name' index.html pages/*.html
```

Expected: each file shows `1`.

```bash
grep -c 'collapse-btn' index.html pages/*.html
```

Expected: each file shows `1` (the button id is preserved).

```bash
grep -c 'collapsed-header-items' index.html pages/*.html
```

Expected: each file shows `1`.

```bash
grep -n 'is-open' index.js
```

Expected: 2 matches (one add, one remove in `toggleHeader`).

- [ ] **Step 8: Commit**

```bash
git add css/index.css index.html index.js pages/contact.html pages/docs.html pages/platform.html
git commit -m "feat(brand): rebuild sitewide header with text lockup and crimson rule"
```

---

## Task 3: Rebuild the sitewide footer (skeleton, no MailerLite wiring yet)

**Files:**
- Modify: `index.html` (footer block at end of `<body>`)
- Modify: `pages/contact.html`, `pages/docs.html`, `pages/platform.html`
- Modify: `css/index.css` (add `.site-footer`, `.signup-form` styles)

**Note:** This task lays down the markup and CSS for the footer including the embedded signup form. The MailerLite JS that wires the form to actually submit comes in Task 8. For now the form is non-functional — submitting it does nothing visible.

- [ ] **Step 1: Append footer + signup form CSS to `css/index.css`**

```css
/* --- Site footer --------------------------------------------- */
.site-footer {
  margin-top: 4rem;
  padding: 3rem 5% 2rem;
  background: #fff;
  border-top: 1px solid var(--rule);
  font-family: var(--font-sans);
  color: var(--ink);
}
.site-footer__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .site-footer__grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
.site-footer__col h4 {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.75rem;
}
.site-footer__col ul { list-style: none; padding: 0; margin: 0; }
.site-footer__col li { margin-bottom: 0.5rem; }
.site-footer__col a {
  color: var(--ink);
  text-decoration: none;
  border-bottom: 1px solid transparent;
}
.site-footer__col a:hover {
  color: var(--crimson);
  border-bottom-color: var(--crimson);
}
.site-footer__brand {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--crimson);
  margin-bottom: 0.5rem;
}
.site-footer__copy {
  font-size: var(--fs-small);
  color: var(--muted);
  line-height: 1.5;
}

/* --- Signup form --------------------------------------------- */
.signup-form {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  font-family: var(--font-sans);
}
.signup-form input[type="email"] {
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--rule);
  border-radius: 4px;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--ink);
  background: #fff;
}
.signup-form input[type="email"]:focus {
  outline: 2px solid var(--navy);
  outline-offset: 1px;
  border-color: var(--navy);
}
.signup-form button {
  padding: 0.625rem 1.25rem;
  background: var(--crimson);
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  font-family: inherit;
}
.signup-form button:hover { background: var(--crimson-deep); }
.signup-form button:disabled { opacity: 0.6; cursor: progress; }

.signup-status {
  margin-top: 0.5rem;
  font-size: var(--fs-small);
  min-height: 1.2em;  /* reserve space so layout doesn't shift on status update */
}
.signup-status[data-state="success"] { color: var(--navy); }
.signup-status[data-state="error"]   { color: var(--crimson); }

.signup-note {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--muted);
}
/* --- end footer + signup form -------------------------------- */
```

- [ ] **Step 2: Replace the footer in `index.html`**

The current footer is around lines 309–331 of `index.html`. Replace `<hr ... />` and the entire `<footer>...</footer>` with:

```html
    <footer class="site-footer">
      <div class="site-footer__grid">
        <div class="site-footer__col">
          <div class="site-footer__brand">SPACESCANS</div>
          <p class="site-footer__copy">
            &copy; 2026 Indiana University &amp; Regenstrief Institute.<br />
            Supported by NIH/NIEHS R24ES036131.
          </p>
        </div>
        <div class="site-footer__col">
          <h4>Site</h4>
          <ul>
            <li><a href="pages/platform.html">Data Catalog</a></li>
            <li><a href="pages/docs.html">Docs</a></li>
            <li><a href="pages/contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="site-footer__col">
          <h4>Updates</h4>
          <form class="signup-form" data-mailerlite-form data-form-location="footer">
            <label for="footer-email" class="visually-hidden">Email address</label>
            <input id="footer-email" name="email" type="email" required placeholder="you@example.org" />
            <button type="submit">Subscribe</button>
          </form>
          <p class="signup-note">Double opt-in. Unsubscribe anytime.</p>
          <div class="signup-status" role="status" aria-live="polite"></div>
        </div>
      </div>
    </footer>
```

The `<hr>` element above the old footer is removed; `.site-footer` already has a `border-top`.

- [ ] **Step 3: Replace the footer in each subpage**

Same markup as Step 2 in `pages/contact.html`, `pages/docs.html`, `pages/platform.html`, **adjusting relative paths**:
- `href="pages/platform.html"` becomes `href="../pages/platform.html"`
- `href="pages/docs.html"` becomes `href="../pages/docs.html"`
- `href="pages/contact.html"` becomes `href="../pages/contact.html"`

Each subpage's `<form>` should use a different `id` for its email input to keep them unique on the page if multiple ever coexist:
- contact.html: `<input id="footer-email-contact" ...>` (and corresponding `<label for="footer-email-contact">`)
- docs.html: `<input id="footer-email-docs" ...>`
- platform.html: `<input id="footer-email-platform" ...>`

- [ ] **Step 4: Verify**

```bash
grep -c 'site-footer__brand' index.html pages/*.html
```

Expected: each file shows `1`.

```bash
grep -c 'data-mailerlite-form' index.html pages/*.html
```

Expected: each file shows `1` (one signup form per page in the footer).

```bash
grep -nE 'id="footer-email[^"]*"' index.html pages/*.html
```

Expected: 4 unique ids (footer-email, footer-email-contact, footer-email-docs, footer-email-platform).

- [ ] **Step 5: Commit**

```bash
git add css/index.css index.html pages/contact.html pages/docs.html pages/platform.html
git commit -m "feat(brand): rebuild sitewide footer with 3-column grid and signup form skeleton

The signup form markup is in place on every page footer; MailerLite
wiring lands in a later commit (form is currently non-functional)."
```

---

## Task 4: Refresh the homepage hero

**Files:**
- Modify: `index.html` (hero section)
- Modify: `css/index.css` (hero classes if needed)

- [ ] **Step 1: Read the current hero**

Read lines 70–114 of `index.html` to confirm the structure. The hero `<section>` opens at line 70, closes at line 114. Inside is a wrapper div, then a left-column text div and a right-column image div with a `<picture>` inside.

- [ ] **Step 2: Replace the entire hero `<section>` with new markup**

Replace the **entire** hero section (from `<section ... tw-min-h-[100vh]...>` through its closing `</section>`) — that's the section opening, the wrapper div, both columns (left text, right image), and the section close.

Find this complete block:
```html
    <section
      class="tw-relative tw-flex tw-min-h-[100vh] tw-w-full tw-max-w-[100vw] tw-flex-col tw-overflow-hidden max-lg:tw-p-4 max-md:tw-mt-[50px]"
    >
      <div
        class="tw-flex tw-h-full tw-min-h-[100vh] tw-w-full tw-place-content-center tw-gap-6 tw-p-[5%] max-xl:tw-place-items-center max-lg:tw-flex-col"
      >
        <div class="tw-flex tw-flex-col tw-place-content-center">
          <div
            class="tw-flex tw-flex-wrap tw-font-semibold tw-uppercase tw-leading-[85px] max-lg:tw-text-4xl max-md:tw-leading-snug"
          >
            <span
              class="reveal-hero-text tw-text-7xl tw-bg-orange-200 tw-p-1 tw-px-6"
            >
              SPACESCANS
            </span>
            <br />
            <span class="reveal-hero-text tw-text-4xl tw-pt-4">
              Spatial & Contextual Exposome Semantic Data Integration
              System</span
            >
          </div>
          <div
            class="reveal-hero-text tw-mt-2 tw-max-w-[450px] tw-p-2 tw-text-justify max-lg:tw-max-w-full"
          >
            Ontology-guided platform linking spatial & contextual exposome data
            with individual-level patient data to accelerate real-world data
            research and real-world evidence generation
          </div>
        </div>

        <div
          class="tw-flex tw-w-full tw-max-w-[50%] tw-place-content-center tw-place-items-center tw-overflow-hidden max-lg:tw-max-w-[unset]"
        >
          <div
            class="tw-relative tw-flex tw-max-h-[580px] tw-min-h-[450px] tw-min-w-[350px] tw-max-w-[650px] tw-overflow-hidden max-lg:tw-h-fit max-lg:tw-max-h-[320px] max-lg:tw-min-h-[180px] max-lg:tw-w-[320px] max-lg:tw-min-w-[320px]"
          >
            <picture>
              <source srcset="./assets/images/logo.webp" type="image/webp" />
              <img
                src="./assets/images/logo.png"
                alt="SPACESCANS logo"
                width="703"
                height="630"
                decoding="async"
                fetchpriority="high"
                class="reveal-hero-img tw-z-[1] tw-h-full tw-w-full tw-object-contain"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
```

Replace with:
```html
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__copy">
          <h1 class="reveal-hero-text hero__title">SPACESCANS</h1>
          <p class="reveal-hero-text hero__subtitle">
            Spatial &amp; Contextual Exposome Semantic Data Integration System
          </p>
          <p class="reveal-hero-text hero__lead">
            Ontology-guided platform linking spatial &amp; contextual exposome
            data with individual-level patient data to accelerate real-world
            data research and real-world evidence generation.
          </p>
        </div>
        <div class="hero__media">
          <picture>
            <source srcset="./assets/images/logo.webp" type="image/webp" />
            <img
              src="./assets/images/logo.png"
              alt="SPACESCANS logo"
              width="703"
              height="630"
              decoding="async"
              fetchpriority="high"
              class="reveal-hero-img hero__image"
            />
          </picture>
        </div>
      </div>
    </section>
```

The `<picture>` element from Spec A is preserved verbatim (same WebP source, same fallback, same dimensions). Only the wrapping divs change. The `reveal-hero-img` class stays so GSAP entrance animations still target the image.

- [ ] **Step 3: Add hero CSS to `css/index.css`**

```css
/* --- Hero ---------------------------------------------------- */
.hero {
  padding: 4rem 5% 3rem;
  max-width: 1280px;
  margin: 0 auto;
}
.hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 3rem;
  align-items: center;
  min-height: calc(100vh - 60px);
}
@media (max-width: 1023px) {
  .hero__inner {
    grid-template-columns: 1fr;
    min-height: auto;
  }
}
.hero__copy { display: flex; flex-direction: column; gap: 1.25rem; }
.hero__title {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: var(--fs-hero);
  color: var(--crimson);
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0;
}
.hero__subtitle {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: var(--fs-h2);
  color: var(--ink);
  line-height: 1.25;
  margin: 0;
}
.hero__lead {
  font-family: var(--font-sans);
  font-size: var(--fs-lead);
  color: var(--muted);
  line-height: 1.6;
  max-width: 50ch;
  margin: 0;
}
.hero__media {
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero__image {
  width: 100%;
  max-width: 520px;
  height: auto;
  object-fit: contain;
}
@media (max-width: 1023px) {
  .hero__image { max-width: 360px; }
}
/* --- end hero ------------------------------------------------ */
```

- [ ] **Step 4: Verify**

```bash
grep -c 'tw-bg-orange-200' index.html
```

Expected: `0` (the orange highlight is gone).

```bash
grep -c 'class="reveal-hero-text hero__title"' index.html
```

Expected: `1`.

```bash
grep -c 'hero__inner' index.html
```

Expected: `1`.

- [ ] **Step 5: Commit**

```bash
git add css/index.css index.html
git commit -m "feat(brand): refresh homepage hero with serif crimson title and academic typography"
```

---

## Task 5: Section heads + "Why It Matters" restyle

**Files:**
- Modify: `index.html` (Why It Matters section markup)
- Modify: `css/index.css` (section wrapper classes)

- [ ] **Step 1: Find the Why It Matters section**

Currently around lines 129–155 of `index.html`. Look for `<h2 class="tw-text-5xl tw-bg-orange-200 ...">Why It Matters</h2>`.

- [ ] **Step 2: Replace the section markup**

Find the entire section block beginning with `<section ... tw-min-h-[50vh] ...>` and ending with `</section>` for "Why It Matters". Replace with:

```html
    <section class="content-section">
      <div class="content-section__inner">
        <h2 class="reveal-up section-head">Why It Matters</h2>
        <p class="reveal-up lead">
          Research on how place-based, social, and built environments shape
          health is hamstrung by fragmented data and ad-hoc linkage methods.
          SPACESCANS closes these gaps by delivering a standards-driven,
          user-friendly data-integration pipeline.
        </p>
      </div>
    </section>
```

- [ ] **Step 3: Add `.content-section` CSS to `css/index.css`**

```css
/* --- Generic content section --------------------------------- */
.content-section {
  padding: 4rem 5%;
}
.content-section__inner {
  max-width: 880px;
  margin: 0 auto;
}
.content-section__inner > .lead {
  margin-top: 1rem;
  max-width: 65ch;
}
/* --- end content section ------------------------------------- */
```

- [ ] **Step 4: Verify**

```bash
grep -A1 'section-head' index.html | grep 'Why It Matters'
```

Expected: matches.

```bash
grep -c 'tw-bg-orange-200' index.html
```

Expected: `0` (still — confirming this round didn't reintroduce it).

- [ ] **Step 5: Commit**

```bash
git add css/index.css index.html
git commit -m "feat(brand): restyle Why It Matters section with crimson left-rule heading"
```

---

## Task 6: Specific Aims cards — typographic numerals replace SVG circles

**Files:**
- Modify: `index.html` (Specific Aims section)
- Modify: `css/index.css` (`.aim-card` classes)

- [ ] **Step 1: Find the Specific Aims section**

Currently around lines 176–235 of `index.html`. The section has `id="goals"` and contains three `.reveal-up` cards each with a numbered SVG icon + heading + body.

- [ ] **Step 2: Replace the entire section markup**

Find `<section ... id="goals"...>` through its closing `</section>`. Replace with:

```html
    <section class="content-section" id="goals">
      <div class="content-section__inner">
        <h2 class="reveal-up section-head">Specific Aims</h2>
        <div class="aim-grid">
          <article class="reveal-up aim-card">
            <div class="aim-card__numeral">1</div>
            <h3 class="aim-card__heading">SPACEO + SPACE-KG</h3>
            <p class="aim-card__body">
              Build an ontology and semantically annotated knowledge graph
              covering high-quality SCE data sources.
            </p>
          </article>
          <article class="reveal-up aim-card">
            <div class="aim-card__numeral">2</div>
            <h3 class="aim-card__heading">SPACESCANS Web App</h3>
            <p class="aim-card__body">
              Co-design and evaluate a cloud-ready linkage platform through two
              real-world use-cases (AD/ADRD, diabetes).
            </p>
          </article>
          <article class="reveal-up aim-card">
            <div class="aim-card__numeral">3</div>
            <h3 class="aim-card__heading">Toolbox &amp; Manual of Operations</h3>
            <p class="aim-card__body">
              Release open-source code, docs, and training materials for broad
              adoption.
            </p>
          </article>
        </div>
      </div>
    </section>
```

This removes the inline `bi-N-circle-fill` SVGs added in Spec A — typographic numerals replace them. The commit message should call this out.

- [ ] **Step 3: Add `.aim-card` CSS to `css/index.css`**

```css
/* --- Specific Aims grid -------------------------------------- */
.aim-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 1023px) { .aim-grid { grid-template-columns: 1fr; } }

.aim-card {
  background: #fff;
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.aim-card__numeral {
  font-family: var(--font-serif);
  font-weight: 700;
  font-size: 3.5rem;
  color: var(--crimson);
  line-height: 1;
  letter-spacing: -0.02em;
}
.aim-card__heading {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-h3);
  color: var(--navy);
  margin: 0;
  line-height: 1.25;
}
.aim-card__body {
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}
/* --- end aim grid -------------------------------------------- */
```

- [ ] **Step 4: Verify**

```bash
grep -c 'aim-card__numeral' index.html
```

Expected: `3`.

```bash
grep -c 'bi-1-circle-fill\|bi-2-circle-fill\|bi-3-circle-fill' index.html
```

Expected: `0` (the inline numbered SVGs are gone — comments don't reference these names since they were class names; double-check by also running grep for the SVG path data: `grep -c 'M9.283 4.002V12' index.html` should be `0`).

```bash
grep -c '<svg' index.html
```

Expected: `4` (1 hamburger in header + 3 arrow-rights in Quick Start cards). Down from 7 before this task.

- [ ] **Step 5: Commit**

```bash
git add css/index.css index.html
git commit -m "feat(brand): rebuild Specific Aims cards with typographic numerals

Removes the three inline bi-N-circle-fill SVGs introduced in Spec A
in favor of large crimson serif numerals — cleaner academic look,
fewer DOM nodes, no decorative-icon a11y considerations."
```

---

## Task 7: Quick Start cards restyle

**Files:**
- Modify: `index.html` (Quick Start section)
- Modify: `css/index.css` (`.quickstart-card`)

- [ ] **Step 1: Find the Quick Start section**

Currently around lines 237–339 (after Specific Aims, before footer). Three `<a>` cards each containing an image div + h3 with arrow SVG.

- [ ] **Step 2: Replace the entire section markup**

Find the `<section>` containing the `<h3 ...>Quick Start</h3>` heading. Replace with:

```html
    <section class="content-section">
      <div class="content-section__inner">
        <h2 class="reveal-up section-head">Quick Start</h2>
        <div class="quickstart-grid">
          <a href="pages/platform.html" class="reveal-up quickstart-card">
            <div class="quickstart-card__media">
              <img
                src="./assets/images/harddrive.jpg"
                alt="Hard drive illustration"
                width="640"
                height="427"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="quickstart-card__body">
              <h3 class="quickstart-card__title">Browse Data Catalog</h3>
              <span class="quickstart-card__cta" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                </svg>
              </span>
            </div>
          </a>
          <a href="pages/docs.html" class="reveal-up quickstart-card">
            <div class="quickstart-card__media">
              <img
                src="./assets/images/bookshelf.jpg"
                alt="Bookshelf illustration"
                width="640"
                height="427"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="quickstart-card__body">
              <h3 class="quickstart-card__title">Read the Manual</h3>
              <span class="quickstart-card__cta" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                </svg>
              </span>
            </div>
          </a>
          <a href="pages/contact.html" class="reveal-up quickstart-card">
            <div class="quickstart-card__media">
              <img
                src="./assets/images/letter.jpg"
                alt="Letter illustration"
                width="640"
                height="427"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="quickstart-card__body">
              <h3 class="quickstart-card__title">Cite or Contact Us</h3>
              <span class="quickstart-card__cta" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                </svg>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
```

The `width`/`height`/`loading`/`decoding` attributes are preserved from Spec A. The empty `srcset=""` attributes from Spec A are dropped. The arrow-right SVGs keep `aria-hidden="true"` from Spec A.

- [ ] **Step 3: Add `.quickstart-card` CSS to `css/index.css`**

```css
/* --- Quick Start grid ---------------------------------------- */
.quickstart-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 1023px) { .quickstart-grid { grid-template-columns: 1fr; } }

.quickstart-card {
  display: flex;
  flex-direction: column;
  background: var(--cream);
  border: 1px solid var(--rule);
  border-radius: 6px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.quickstart-card:hover {
  border-color: var(--crimson);
  transform: translateY(-2px);
}
.quickstart-card__media {
  aspect-ratio: 640 / 427;
  overflow: hidden;
  background: #ddd;
}
.quickstart-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.85);
  transition: filter 0.2s ease;
}
.quickstart-card:hover .quickstart-card__media img { filter: saturate(1); }
.quickstart-card__body {
  padding: 1.25rem 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.quickstart-card__title {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: var(--fs-h3);
  color: var(--ink);
  margin: 0;
  line-height: 1.25;
}
.quickstart-card__cta {
  color: var(--crimson);
  font-size: 1.25rem;
  display: inline-flex;
  flex: none;
}
/* --- end quickstart ------------------------------------------ */
```

- [ ] **Step 4: Verify**

```bash
grep -c 'quickstart-card__title' index.html
```

Expected: `3`.

```bash
grep -c 'srcset=""' index.html
```

Expected: `0` (the empty srcset attributes are gone).

- [ ] **Step 5: Commit**

```bash
git add css/index.css index.html
git commit -m "feat(brand): restyle Quick Start cards with cream background and hover crimson border"
```

---

## Task 8: Add the Stay Updated section + MailerLite wiring

**Files:**
- Modify: `index.html` (insert new section before footer; add MailerLite universal-embed `<script>` and `<script src="./assets/js/mailerlite-form.js" defer>`)
- Modify: `pages/contact.html`, `pages/docs.html`, `pages/platform.html` (add the same two scripts in the same place — defer means script load ordering doesn't matter)
- Create: `assets/js/mailerlite-form.js`
- Modify: `css/index.css` (`.stay-updated` styles)

**Important:** This task adds a placeholder for the MailerLite account ID. The user must replace `YOUR_ACCOUNT_ID` with their real ID after the implementation completes. The plan documents this clearly so the placeholder isn't shipped silently.

- [ ] **Step 1: Add Stay Updated CSS to `css/index.css`**

```css
/* --- Stay Updated section ------------------------------------ */
.stay-updated {
  padding: 4rem 5%;
  background: #fff;
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.stay-updated__inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}
.stay-updated h2 {
  margin-bottom: 0.75rem;
  display: inline-block;
}
.stay-updated .lead {
  margin: 0 auto 1.5rem;
  max-width: 50ch;
}
.stay-updated .signup-form {
  max-width: 480px;
  margin: 0 auto;
}
@media (max-width: 600px) {
  .stay-updated .signup-form {
    flex-direction: column;
  }
}
/* --- end stay updated ---------------------------------------- */
```

- [ ] **Step 2: Insert the Stay Updated section before the footer in `index.html`**

Locate the `<footer class="site-footer">` line. Insert immediately BEFORE it:

```html
    <section class="stay-updated" id="stay-updated">
      <div class="stay-updated__inner">
        <h2 class="reveal-up section-head" style="border-left: none; padding-left: 0;">
          Stay Updated
        </h2>
        <p class="reveal-up lead">
          Get research updates from the SPACESCANS team — typically once a
          month, no marketing.
        </p>
        <form class="signup-form" data-mailerlite-form data-form-location="stay-updated">
          <label for="stay-updated-email" class="visually-hidden">Email address</label>
          <input id="stay-updated-email" name="email" type="email" required placeholder="you@example.org" />
          <button type="submit">Subscribe</button>
        </form>
        <p class="signup-note">Double opt-in. Unsubscribe anytime.</p>
        <div class="signup-status" role="status" aria-live="polite"></div>
      </div>
    </section>
```

The inline `style="border-left: none; padding-left: 0;"` overrides the default `.section-head` left-rule treatment for this centered context. It's slightly inconsistent but localized and acceptable here.

- [ ] **Step 3: Create `assets/js/mailerlite-form.js`**

Make the directory if needed:
```bash
mkdir -p assets/js
```

Create `/Users/xinghe/Downloads/spacescans-landing-page/assets/js/mailerlite-form.js` with this content:

```javascript
// SPACESCANS — MailerLite signup form handler
//
// Wires every <form data-mailerlite-form> on the page to the MailerLite
// universal embed. Updates the inline .signup-status div on success/error.
//
// Setup: replace YOUR_ACCOUNT_ID and YOUR_FORM_ID below with the real IDs
// from your MailerLite dashboard. The same IDs are used for every form on
// the site (single subscriber group).

(function () {
  'use strict';

  var ACCOUNT_ID = 'YOUR_ACCOUNT_ID';
  var FORM_ID    = 'YOUR_FORM_ID';

  // Load MailerLite universal embed (idempotent — only loads once)
  function loadMailerLite() {
    if (window.ml) return;
    (function (w, d, e, u, f, l, n) {
      w[f] = w[f] || function () { (w[f].q = w[f].q || []).push(arguments); };
      l = d.createElement(e); l.async = 1; l.src = u;
      n = d.getElementsByTagName(e)[0]; n.parentNode.insertBefore(l, n);
    })(window, document, 'script', 'https://assets.mailerlite.com/js/universal.js', 'ml');
    window.ml('account', ACCOUNT_ID);
  }

  function findStatusDiv(form) {
    // Status div is a sibling of the form (next .signup-status)
    var parent = form.parentElement;
    if (!parent) return null;
    return parent.querySelector('.signup-status');
  }

  function setStatus(div, state, message) {
    if (!div) return;
    div.dataset.state = state;
    div.textContent = message;
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var input = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    var status = findStatusDiv(form);

    if (!input || !input.value) {
      setStatus(status, 'error', 'Please enter your email address.');
      return;
    }

    button.disabled = true;
    setStatus(status, '', 'Submitting…');

    fetch('https://assets.mailerlite.com/jsonp/' + ACCOUNT_ID + '/forms/' + FORM_ID + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'fields[email]=' + encodeURIComponent(input.value)
    })
      .then(function (response) {
        if (!response.ok) throw new Error('network');
        return response.json().catch(function () { return {}; });
      })
      .then(function () {
        setStatus(status, 'success', 'Check your email to confirm your subscription.');
        form.reset();
      })
      .catch(function () {
        setStatus(status, 'error', 'Something went wrong. Please try again.');
      })
      .finally(function () {
        button.disabled = false;
      });
  }

  function init() {
    var forms = document.querySelectorAll('form[data-mailerlite-form]');
    if (!forms.length) return;
    loadMailerLite();
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

This is intentionally vanilla JS — no build step, no framework. The fetch URL pattern (`assets.mailerlite.com/jsonp/...`) is MailerLite's documented endpoint for embedded form submissions. If the user finds the endpoint differs at implementation time, they update the URL in this single file.

- [ ] **Step 4: Add the script tag to all 4 HTML files**

Find the existing GSAP `<script defer>` tags (added in Spec A) at the bottom of each HTML file. AFTER the existing `<script defer src="./index.js"></script>` (or `../index.js` on subpages), add:

For `index.html`:
```html
  <script defer src="./assets/js/mailerlite-form.js"></script>
```

For each subpage (`pages/contact.html`, `pages/docs.html`, `pages/platform.html`):
```html
  <script defer src="../assets/js/mailerlite-form.js"></script>
```

- [ ] **Step 5: Verify**

```bash
ls -la assets/js/mailerlite-form.js
```

Expected: file exists, size > 0.

```bash
grep -c 'data-mailerlite-form' index.html
```

Expected: `2` (one for the Stay Updated form, one for the footer form).

```bash
grep -c 'mailerlite-form.js' index.html pages/*.html
```

Expected: each shows `1`.

```bash
grep -c 'YOUR_ACCOUNT_ID' assets/js/mailerlite-form.js
```

Expected: `2` (two placeholder occurrences — also `YOUR_FORM_ID` appears once).

- [ ] **Step 6: Commit**

```bash
git add css/index.css index.html pages/contact.html pages/docs.html pages/platform.html assets/js/mailerlite-form.js
git commit -m "feat(signup): add Stay Updated section + MailerLite signup wiring

Two signup forms on the homepage (Stay Updated section + footer) and
one footer form on each subpage. All forms post to the same MailerLite
list via assets/js/mailerlite-form.js. Account/form IDs are placeholders
(YOUR_ACCOUNT_ID / YOUR_FORM_ID) that the user replaces post-merge with
their real values from the MailerLite dashboard."
```

---

## Task 9: Subpage body restyle (contact, docs, platform inherit new design system)

**Files:**
- Modify: `pages/contact.html` (existing body content; section heads + cards inherit new typography)
- Modify: `pages/docs.html`
- Modify: `pages/platform.html`

The new body baseline (`var(--font-sans)`, `var(--cream)` background) and new heading defaults (`var(--font-serif)`, `var(--crimson)`) already apply automatically because of the global `body` and `h1, h2, h3` rules from Task 1. This task surgically updates a few specific elements that have inline Tailwind utilities clashing with the new design system.

- [ ] **Step 1: Audit each subpage for `tw-bg-orange-200` and `tw-font-mono`**

```bash
grep -n 'tw-bg-orange-200\|tw-font-mono' pages/*.html
```

For each match, decide whether to remove the class. The orange-200 highlights on `<h2>` headings should be replaced with a `section-head` left-rule treatment. The `tw-font-mono` on `<body>` is overridden by the body baseline rule from Task 1, so removing it is cleanup but not strictly required.

- [ ] **Step 2: For each subpage, replace orange-highlighted h2s**

Find each `<h2 class="tw-text-6xl tw-bg-orange-200 ...">...</h2>` (and similar tw-text-5xl variants). Replace with:

```html
<h2 class="reveal-up section-head">...</h2>
```

The `section-head` class brings the crimson left-rule, serif typography, and proper sizing. The Tailwind sizing classes are no longer needed since `.section-head` sets `font-size: var(--fs-h1)`.

- [ ] **Step 3: For each subpage, remove `tw-font-mono` from `<body>`**

Find `<body class="tw-flex tw-min-h-[100vh] tw-flex-col tw-bg-[#fff] tw-font-mono">`. Replace with:

```html
<body class="tw-flex tw-min-h-[100vh] tw-flex-col">
```

The body baseline CSS handles font-family and background.

- [ ] **Step 4: Verify**

```bash
grep -c 'tw-bg-orange-200' pages/*.html
```

Expected: each shows `0`.

```bash
grep -c 'tw-font-mono' pages/*.html
```

Expected: each shows `0`.

```bash
grep -c 'section-head' pages/*.html
```

Expected: each subpage shows ≥ 1 (at least the main page heading).

- [ ] **Step 5: Commit**

```bash
git add pages/contact.html pages/docs.html pages/platform.html
git commit -m "feat(brand): subpages inherit new design system, drop orange highlights"
```

---

## Task 10: Audit homepage `<body>` and remove leftover styles

**Files:**
- Modify: `index.html` (`<body>` class)
- Modify: `css/index.css` (audit for any orphaned rules; remove the dead `.material-icons.md-40` left over from Spec A)

- [ ] **Step 1: Update homepage `<body>`**

Find:
```html
<body class="tw-flex tw-min-h-[100vh] tw-flex-col tw-bg-[#fff] tw-font-mono">
```

Replace with:
```html
<body class="tw-flex tw-min-h-[100vh] tw-flex-col">
```

- [ ] **Step 2: Read `css/index.css` end-to-end**

Look for any rules that are now redundant or refer to removed elements. In particular:
- `.material-icons.md-40` — referenced in Spec A's code review as dead. Remove it now.
- Any rule referencing `bi-list`, `bi-x`, or other Bootstrap Icons classes — remove.
- Any rule referencing `.tw-bg-orange-200` — this is a Tailwind class, not a custom rule, so it shouldn't appear in `index.css` as a selector. If it does, remove it.

- [ ] **Step 3: Verify no orphan rules**

```bash
grep -nE 'material-icons|\.bi-' css/index.css
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add css/index.css index.html
git commit -m "chore(brand): drop tw-font-mono from homepage body and remove dead CSS rules"
```

---

## Task 11: Document MailerLite setup + brand tokens in `readme.md`

**Files:**
- Modify: `readme.md`

- [ ] **Step 1: Read the current `readme.md`**

It already has sections "About", "Heritage", "Usage", and "Optimizing Images" (added in Spec A).

- [ ] **Step 2: Append two new sections after "Optimizing Images"**

Append at the very end of `readme.md`:

````markdown

## Email Signup Setup (MailerLite)

The site includes a "Stay Updated" homepage section and a footer signup form on every page. Both post to the same MailerLite mailing list. To activate them after first deploy:

1. Sign up for a free MailerLite account at https://www.mailerlite.com.
2. In the MailerLite dashboard, create a subscriber group named **SPACESCANS Updates**. Make sure double opt-in is enabled (default).
3. Create an embedded form pointing at that group. The exact form styling doesn't matter — the site uses its own CSS and only needs the form's IDs.
4. Copy two values from the embed snippet MailerLite provides:
   - The **account ID** (sometimes called `data-account` or shown as a numeric ID).
   - The **form ID** (sometimes called `data-form`).
5. Open `assets/js/mailerlite-form.js` and replace the two placeholder strings near the top:
   ```javascript
   var ACCOUNT_ID = 'YOUR_ACCOUNT_ID';
   var FORM_ID    = 'YOUR_FORM_ID';
   ```
6. Commit + push. Both signup forms (Stay Updated section + footer) will start working.

To change the wording or layout of the forms, edit the markup in `index.html` (`<form data-mailerlite-form>` blocks) and the CSS in `css/index.css` (`.signup-form` and `.stay-updated` classes).

## Brand & Typography

The site uses a small set of CSS custom properties as its design system. They are defined at the top of `css/index.css`:

| Token | Value | Used for |
|---|---|---|
| `--crimson` | `#990000` | Headings, CTAs (IU primary) |
| `--crimson-deep` | `#6F0000` | Hover state for crimson elements |
| `--navy` | `#1E3A5F` | Links, secondary headings (Regenstrief accent) |
| `--cream` | `#F8F6F1` | Page background |
| `--ink` | `#1A1A1A` | Body text |
| `--muted` | `#595959` | Secondary text |
| `--rule` | `#E5E1D8` | Hairline borders |
| `--font-serif` | Source Serif 4, Georgia | Headings |
| `--font-sans` | Inter, system-ui | Body |

To add new components, prefer these tokens over raw hex values so the design stays consistent and a future palette change happens in one place.
````

- [ ] **Step 3: Verify**

```bash
grep -c '## Email Signup Setup' readme.md
```

Expected: `1`.

```bash
grep -c '## Brand & Typography' readme.md
```

Expected: `1`.

- [ ] **Step 4: Commit**

```bash
git add readme.md
git commit -m "docs: document MailerLite setup and design system tokens"
```

---

## Task 12: Final verification + perf budget check

**Files:** None (measurement and audit only).

- [ ] **Step 1: Page weight + asset audit**

```bash
ls -la assets/images/ | awk '{sum+=$5} END {print "Image bytes:", sum}'
ls -la assets/js/mailerlite-form.js
wc -c css/index.css
```

Expected:
- Image bytes: ~648 KB (unchanged from Spec A baseline)
- `mailerlite-form.js`: 2–4 KB
- `css/index.css`: meaningfully larger than before (new component CSS); should be under ~25 KB

- [ ] **Step 2: HTTP request audit**

Open `index.html` in a browser with DevTools Network tab open and cache disabled. Confirm:
- New requests: `fonts.googleapis.com/css2?family=...` (1) → `fonts.gstatic.com/.../Inter*.woff2` and `SourceSerif*.woff2` (2–4 font files, 30–60 KB each).
- New request: `assets.mailerlite.com/js/universal.js` (deferred, after first paint).
- No new render-blocking requests.
- Spec A's removed CDN requests (Material Icons, Bootstrap Icons font) still absent.

- [ ] **Step 3: Lighthouse measurement**

Run Chrome DevTools Lighthouse on the deployed site (mobile, Performance category).

Acceptance:
- Performance score ≥ **90 desktop**, ≥ **75 mobile**.
- LCP < 2.5s, CLS < 0.1.
- If Performance dropped below acceptance vs. Spec A's measurements, identify the cause: most likely the Google Fonts request blocking. Fix options:
  - Confirm `font-display: swap` is in the URL (it is in the plan).
  - Confirm `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com` are present.
  - As a last resort, remove the heaviest weight from the font URL (e.g., drop weight 700 if not visibly used).

- [ ] **Step 4: Visual smoke test (manual, by user)**

Open all 4 pages at desktop (1440px) and mobile (375px). Confirm:
- Header renders with crimson "SPACESCANS" wordmark + meta line.
- Mobile hamburger toggles a small panel with nav links + crimson top border.
- Homepage hero: no orange highlight, serif crimson title, sans subtitle.
- Why It Matters: crimson left-rule heading, readable body.
- Specific Aims: 3 cards with large crimson numerals (1, 2, 3) replacing the previous SVG circles.
- Quick Start: 3 cards with cream background, hover state shows crimson border + saturation pop.
- Stay Updated section: form renders, narrow, crimson Subscribe button.
- Footer: 3-column on desktop (brand + copy / link list / signup form), stacked on mobile.
- All subpages: same header + footer; body content readable in new typography.
- GSAP entrance + scroll reveal animations still play.
- DevTools Console: no errors.

- [ ] **Step 5: Email signup smoke test (manual, by user, AFTER replacing placeholder IDs)**

After the implementation is merged and the user has replaced `YOUR_ACCOUNT_ID` / `YOUR_FORM_ID` in `assets/js/mailerlite-form.js` with their real values:

1. Open the homepage in a browser.
2. Type a real email into the **Stay Updated** form, click Subscribe.
3. Expect the inline status to read "Check your email to confirm your subscription."
4. Open the inbox; click MailerLite's confirmation link.
5. Expect the email to appear in the **SPACESCANS Updates** subscriber group on MailerLite's dashboard.
6. Repeat with the **footer** form on the homepage.
7. Repeat with the **footer** form on `pages/contact.html` (any subpage works).

If any step fails, MailerLite's debugger panel + the browser DevTools Network tab will show the failed request — the response usually identifies the issue (wrong account ID, form not enabled, etc.).

- [ ] **Step 6: Final commit hygiene check**

```bash
git log --oneline main..HEAD
```

Expected: 11 commits (one per task above, T0 + T2-T11; T12 is verification only). Each commit message starts with `feat(brand)`, `feat(signup)`, `chore(brand)`, or `docs`.

Confirm no stale `WIP` commits or unrelated changes mixed in.

---

## Out-of-scope follow-ups (already noted in spec; not addressed here)

- Welcome email automation in MailerLite.
- Subscriber segmentation.
- Custom sender domain.
- Replacing GSAP with a smaller animation library.
- Self-hosting Inter / Source Serif 4 fonts.
- Data catalog table redesign on `platform.html`.
- Dark mode.
