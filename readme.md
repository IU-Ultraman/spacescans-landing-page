# About

The code in this repo is for the landing page for the SPACESCANS Project. It is a simple static site with HTML, JS, and CSS. The CSS is mainly tailwinds classes, and it can be hosted on any HTTP server as its starting point is an index.html file.

## Heritage

This site was built from the free [Dev Portfolio Template](https://jamie-dev-portfolio.netlify.app/) created by [Paul Freeman](https://github.com/PaulleDemon). The Usage information below is unchanged from the original template.

- Note that the `css/tailwinds-build.css` file does not cover every class in Tailwinds, just the ones that were used in the original template. This means that attempting to use arbitrary tailwinds classes may not work, and you may need to create custom classes to use functionality that is in the rest of Tailwinds that isn't already included.

- You can get around this limitation and use the rest of tailwinds by developing on this project like a NPM project. Run `npm install` to install tailwinds and any other dependencies in `package.json` to get started with that.

## Usage

- This template uses tailwind css every tailwind class are prefixed with `tw-`, to help differentiate
  between tailwind classes and other classes

During development add the following to head tag

```html
<link
  rel="stylesheet"
  href="tailwind-runtime.css"
/><!--replace with path to your tailwind runtime-->
```

During production use

```html
<link
  rel="stylesheet"
  href="tailwind-build.css"
/><!--replace with path to your tailwind build-->
```

To start Tailwind during development use

```html
npm run start:tailwind
```

To create a build file use

```html
npm run build:tailwind
```

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
