# Spec B — Email Signup + IU/Regenstrief Brand Refresh

**Date:** 2026-05-06
**Status:** Draft, awaiting user review
**Scope:** Add MailerLite-backed email signup (footer sitewide + a homepage section) and replace the current "creative-portfolio template" aesthetic with a modern-academic look befitting an NIH-funded IU + Regenstrief research project.

## Problem

Two related needs that share the same files and design system:

1. **No way to collect email addresses.** The team wants to share research updates with users by email, but the site has no signup form. They want a hosted-elsewhere solution so the site stays static on GitHub Pages.

2. **Visual identity doesn't match the project.** SPACESCANS is a research consortium funded by NIH (R24ES036131), led by IU and Regenstrief. The current site uses a free portfolio template (mono font everywhere, orange highlights, casual layout) that reads as "personal portfolio" rather than "research consortium." Funders, peer researchers, and clinicians who land here form a first impression in seconds; the current aesthetic undersells the work.

## Goals

- Add an email signup form that lands subscribers in a MailerLite list. Two placements: a dedicated "Stay Updated" section on the homepage, and a compact form in the sitewide footer.
- Refresh the visual identity across all 4 pages: typography, color palette, header, hero, section styling, footer.
- Preserve the perf gains from Spec A. Total homepage transfer must remain under ~600 KB and Lighthouse Performance must stay ≥ 90 desktop / ≥ 75 mobile.
- No new build pipeline, no JS framework, no SSR. Pure static HTML/CSS/JS as today.

## Non-Goals

- Redesigning the data catalog content on `platform.html`. Visual styling will inherit the new design system; the actual table/content structure stays.
- Adding new content sections beyond Stay Updated.
- Welcome email automation, segmentation, or multiple lists in MailerLite (one list, double opt-in, default sender — sufficient for occasional updates).
- A custom sender domain (use MailerLite's default for now).
- Dark mode.
- Animations beyond what GSAP already provides for entrance + scroll-reveal.

## Architecture

Pure static. All changes land in:

- `index.html`, `pages/contact.html`, `pages/docs.html`, `pages/platform.html` — markup updates
- `css/index.css` — new design tokens (CSS custom properties) and component styles. Source of truth for the design system. Tailwind utilities continue to handle layout.
- Google Fonts CDN (with preconnect) for **Source Serif 4** (headings) and **Inter** (body). Self-hosting fonts is out of scope; the preconnect + `font-display: swap` pattern keeps perf acceptable.
- MailerLite "universal embed" JavaScript loaded from MailerLite's CDN. Custom-styled form posts to it via standard event handlers.
- `readme.md` — document MailerLite account setup steps (one-time user action).

## Design tokens

Concrete values (added to `css/index.css` as `:root` custom properties so they can be reused across components):

```css
:root {
  /* Color */
  --crimson:      #990000;   /* IU primary; headings, CTAs */
  --crimson-deep: #6F0000;   /* hover/active for crimson elements */
  --navy:         #1E3A5F;   /* Regenstrief accent; links, secondary headers */
  --cream:        #F8F6F1;   /* page background */
  --ink:          #1A1A1A;   /* body text */
  --muted:        #595959;   /* secondary text */
  --rule:         #E5E1D8;   /* hairline borders, card outlines */

  /* Typography */
  --font-serif: "Source Serif 4", Georgia, serif;
  --font-sans:  "Inter", system-ui, -apple-system, sans-serif;

  /* Type scale (rem) */
  --fs-hero:    3.5rem;   /* 56px — was tw-text-7xl (72px) */
  --fs-h1:      2.5rem;   /* 40px */
  --fs-h2:      2rem;     /* 32px */
  --fs-h3:      1.5rem;   /* 24px */
  --fs-body:    1rem;     /* 16px */
  --fs-lead:    1.125rem; /* 18px */
  --fs-small:   0.875rem; /* 14px */
}
```

## Typography rules

- `<body>`: drop `tw-font-mono`, set `font-family: var(--font-sans)`, `color: var(--ink)`, `background: var(--cream)`, `line-height: 1.6`.
- All `<h1>`–`<h3>`: `font-family: var(--font-serif)`, `color: var(--crimson)`, `line-height: 1.2`.
- Links: `color: var(--navy)`, underline on hover, `crimson` on hover for emphasis links.

Loaded via:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Source+Serif+4:wght@400;600;700&display=swap" />
```

Net font weight ~70 KB transferred; cached aggressively on subsequent visits.

## Components

### Header (sitewide)

Text-only, white background, fixed top, hairline crimson rule (`border-bottom: 2px solid var(--crimson)`) beneath.

Left side, two stacked lines:
- Line 1: **SPACESCANS** in `var(--font-serif)`, weight 700, color `var(--crimson)`.
- Line 2: "Indiana University & Regenstrief Institute · NIH R24ES036131" in `var(--font-sans)`, `var(--fs-small)`, `var(--muted)`, letter-spacing 0.04em, uppercase.

Right side: nav links (`Data Catalog`, `Docs`, `Contact`) in `var(--font-sans)` weight 500, `var(--ink)`, hover crimson underline.

Mobile (< lg): collapse to hamburger as today; the new SVG hamburger from Spec A stays. Open menu has white panel with hairline crimson border.

### Hero (homepage only)

Two-column on desktop, stacked on mobile. Left column:
- "SPACESCANS" — serif, weight 700, `var(--fs-hero)`, `var(--crimson)`. **Drop** the `tw-bg-orange-200` highlight.
- Full project name "Spatial & Contextual Exposome Semantic Data Integration System" — sans, weight 400, `var(--fs-h2)`, `var(--ink)`, line-height 1.3.
- Description paragraph — sans, weight 400, `var(--fs-lead)`, `var(--muted)`, max-width 50ch.

Right column: existing optimized hero logo image (from Spec A; no change to the asset, just keep `<picture>` wrapper).

### Section headers ("Why It Matters", "Specific Aims", etc.)

- Section heading uses serif `var(--fs-h1)` with a 4px crimson left rule:
  ```css
  .section-head {
    border-left: 4px solid var(--crimson);
    padding-left: 1rem;
    font-family: var(--font-serif);
    color: var(--crimson);
  }
  ```
- The current `tw-bg-orange-200` highlights on `<h2>` elements are removed.

### Specific Aims cards (homepage)

3-column grid (stacks on mobile). Each card:
- `var(--cream)` background, `1px solid var(--rule)`, `border-radius: 4px`, padding 2rem.
- Crimson numeral (1, 2, 3) in serif weight 700, `var(--fs-hero)`, displayed above heading. Replaces the inline `bi-N-circle-fill` SVGs.
- Card heading: serif weight 600, `var(--fs-h3)`, `var(--navy)`.
- Card body: sans 400, `var(--fs-body)`, `var(--muted)`.

Note: this means the inline SVG numbered circles from Spec A are removed in favor of typographic numerals. The SVG removal is a net simplification (less HTML, no decorative icon).

### Quick Start cards (homepage)

3 cards in a row. Each:
- `var(--cream)` background (currently `tw-bg-[#edecec79]`), `1px solid var(--rule)`, no shadow (current `tw-shadow-xl` is too heavy for the academic feel).
- Existing photographic image on top, with a subtle desaturation/overlay applied via CSS `filter: saturate(0.85)` so the photos read calmer.
- Title in serif weight 600, `var(--fs-h3)`, `var(--ink)` (not crimson — these aren't section headings).
- Arrow icon stays as the inline SVG from Spec A. Color inherits from heading.
- Hover state: subtle crimson left-rule appears, shadow softens up.

### "Stay Updated" section (NEW, homepage only)

Inserted between the existing "Quick Start" section and the footer. Centered, max-width 640px, generous vertical padding.

Markup outline:
```html
<section id="stay-updated" class="stay-updated-section">
  <h2 class="section-head">Stay Updated</h2>
  <p class="lead">Get research updates from the SPACESCANS team — typically once a month, no marketing.</p>
  <form class="signup-form" data-mailerlite-form>
    <label for="signup-email" class="visually-hidden">Email address</label>
    <input id="signup-email" name="email" type="email" required placeholder="you@example.org" />
    <button type="submit">Subscribe</button>
  </form>
  <p class="signup-note muted">Double opt-in. Unsubscribe anytime.</p>
  <div class="signup-status" role="status" aria-live="polite"></div>
</section>
```

CSS gives the input/button a row layout (column on mobile), crimson submit button (`background: var(--crimson)`, hover `var(--crimson-deep)`), navy ring on input focus, hairline border around the whole row.

### Sitewide footer

Three columns on desktop (`grid-template-columns: 1fr 1fr 1fr`), stacked on mobile.

- **Left:** "SPACESCANS" wordmark (small), then "© 2026 Indiana University & Regenstrief Institute. NIH R24ES036131."
- **Middle:** Link column — `Data Catalog`, `Docs`, `Contact`, and a `GitHub` link if/when one exists (placeholder for now: comment out the `<a>` until a repo URL is provided).
- **Right:** Compact email signup form. Heading "Updates" (small caps), one-line email + submit button.

Both signup forms (Stay Updated section + footer) target the same MailerLite list. They share the same JS handler; the markup is duplicated but small.

## Email signup integration

### Account setup (manual, by user, one-time)

1. Create MailerLite account at mailerlite.com.
2. Create a subscriber group named **"SPACESCANS Updates"**.
3. Enable double opt-in (default behavior).
4. Create an embedded form (any styling — we'll override with our own CSS). Copy the `data-account` and `data-form` IDs from the embed snippet MailerLite provides.
5. Paste those IDs into the placeholders in the HTML.

These steps are documented in a new "Email signup setup" section of `readme.md`.

### Embed approach

Use MailerLite's "universal embed" JavaScript:
```html
<script>
  (function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[]).push(arguments);}
  ,l=d.createElement(e),l.async=1,l.src=u,n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
  (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
  ml('account', 'YOUR_ACCOUNT_ID');
</script>
```

This loads the MailerLite client. Our custom form HTML uses `data-form` attributes (or a small JS shim) to wire submissions to MailerLite's API. The exact wiring follows MailerLite's documented "embedded form" recipe at the time of implementation — the implementation plan will paste in the current canonical snippet from their docs.

### Form behavior

- **Submit:** form posts to MailerLite via their JS. Inline status div (`aria-live="polite"`) shows messages.
- **Success:** "Check your email to confirm your subscription."
- **Already subscribed:** "You're already on our list — thanks!"
- **Invalid email:** native HTML5 validation kicks in first; if it gets past that, MailerLite returns an error and we show "Please enter a valid email address."
- **Network error:** "Something went wrong. Please try again."
- **Loading:** button shows a small inline spinner while the request is in flight; button is disabled.

### Privacy

- The signup form does not require, store, or display any data outside what the user types.
- No analytics or tracking pixels are added by this spec.
- MailerLite handles GDPR/CAN-SPAM compliance per their terms.

## File-by-file changes

| File | Changes |
|---|---|
| `index.html` | New header structure (text lockup + nav). Hero loses orange highlight, gets new typography. "Why It Matters" gets crimson left-rule. Specific Aims cards rebuild (crimson numerals replace numbered SVGs). Quick Start cards restyled. NEW Stay Updated section inserted before footer. Footer rebuilt as 3-column with embedded signup. MailerLite universal embed `<script>` added (deferred). |
| `pages/contact.html` | Same new header + footer. Body content (How To Cite, License, Team, Contact) keeps copy but inherits new typography + crimson section heads. |
| `pages/docs.html` | Same new header + footer. Body inherits new typography. |
| `pages/platform.html` | Same new header + footer. Body inherits new typography; tables/data-catalog content keeps current structure. |
| `css/index.css` | New `:root` design tokens. New utility classes: `.section-head`, `.lead`, `.muted`, `.signup-form`, `.signup-form button`, `.visually-hidden`, etc. Existing rules audited and updated to use the new tokens. The dead `.material-icons.md-40` rule (left over from Spec A) is removed. |
| `readme.md` | New "Email signup setup" section documenting the MailerLite one-time setup steps. New "Brand & typography" subsection noting the design system tokens for future contributors. |
| `assets/images/` | No asset changes. (Images already optimized in Spec A.) |

## Verification

This is a static site with no test infrastructure. Verification is manual:

1. **Visual smoke test** — open all 4 pages at 1440px and 375px in a browser. Confirm:
   - Header: SPACESCANS wordmark crimson, sub-line muted, nav right-aligned, crimson rule beneath.
   - Hero (homepage): no orange highlight, new typography, image still renders.
   - Why It Matters: crimson left-rule on heading.
   - Specific Aims: 3 cards with crimson numerals (1/2/3) replacing the old SVG circles.
   - Quick Start: cards restyled with cream bg + hairline border + softer photo treatment.
   - Stay Updated: section appears, form renders, looks good.
   - Footer: 3-column, signup form on right, copyright/funding text correct.
   - Animations from Spec A still play.
2. **Email signup end-to-end** — enter an email in the homepage Stay Updated form, click Subscribe, observe the "check your email" status. Open the inbox, click the confirmation link, verify the subscriber appears in MailerLite dashboard. Repeat for the footer form. Repeat for one subpage's footer form.
3. **Lighthouse re-run** — confirm Spec A's perf gains held: Performance ≥ 90 desktop / ≥ 75 mobile, LCP < 2.5s, CLS < 0.1, total page weight under 600 KB.
4. **Network panel** — confirm Google Fonts requests happen with `preconnect` priority. Confirm MailerLite universal.js loads asynchronously and does not block render.
5. **Screen reader spot-check** — VoiceOver / NVDA reads the header lockup correctly, the Stay Updated section announces the form label, status messages are read on submission.

## Risk and rollback

- **Visual regression risk** — moderate. The redesign touches every page. Mitigation: do the work on a feature branch (`brand/spec-b` or similar), run the visual smoke test before merge, keep `main` clean if anything looks off.
- **MailerLite outage risk** — low. If MailerLite is down at submission time, the form shows a network-error message. Subscribers can retry. No data is lost (nothing was stored on our side anyway).
- **Font loading FOUT** — `font-display: swap` means body text flashes between system font and Inter on first load. Acceptable trade-off vs. invisible text.
- **Perf regression risk** — adding ~70 KB of fonts + ~25 KB of MailerLite JS. Net new ~95 KB across the page. Well within the spec's < 600 KB budget; LCP impact minimal because fonts use `swap` and MailerLite JS is deferred.
- **Rollback path** — single feature branch, single merge commit. `git revert` undoes the entire change.

## Out of scope (deferred to future)

- Welcome email automation in MailerLite.
- Segmenting subscribers (e.g., "researchers" vs. "clinicians" vs. "general").
- Custom sender domain (currently uses MailerLite's default `@mailerlite.com` reply-to).
- Replacing the GSAP animation library (Spec A's `defer` made it acceptable).
- Self-hosting Inter / Source Serif 4 to drop the Google Fonts CDN dependency.
- Adding social-media share metadata beyond what `og:` tags currently provide.
- Anything for the data catalog tables on `platform.html`.

## Manual setup (user, one-time)

1. **MailerLite account:** mailerlite.com → create free account → create subscriber group "SPACESCANS Updates" → create embedded form → copy the `data-account` and `data-form` IDs.
2. Provide those IDs to the implementation phase. The plan will document where to paste them.
