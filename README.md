# Restora Centre for Recovery

Marketing website for Restora Centre for Recovery, an addiction treatment and family support centre on Old Namanga Road, Nairobi.

- **Phone / WhatsApp:** +254 795 180 704
- **Email:** restoracentreforrecovery@gmail.com
- **Location:** Old Namanga Road, Nairobi

## Stack

Plain HTML, CSS and JavaScript. No build step.

- **Smooth scroll:** [Lenis](https://github.com/darkroomengineering/lenis) 1.1.20 (`js/vendor/lenis.min.js`)
- **Motion:** [GSAP](https://gsap.com) 3.12.7 + ScrollTrigger (`js/vendor/`), used for one gentle reveal and a slow hero drift
- Motion is disabled for `prefers-reduced-motion`, and content shows normally if scripts fail to load.

## Run locally

```bash
python -m http.server 8080
```

Open http://localhost:8080/index.html

## Structure

```
index.html, about.html, programs.html, admissions.html,
resources.html (families), contact.html, privacy.html, terms.html
css/style.css      Design tokens and all components
js/main.js         Header, drawer, forms, Lenis, GSAP
js/vendor/         Lenis, GSAP, ScrollTrigger (self-hosted)
fonts/             Cooper BT (headlines) + Plus Jakarta Sans (body); woff2 in use, ttf originals kept
images/            Optimised webp photos, logo + icon SVGs
Assets/Hero/       Original brand logo SVGs and hero photo (source files)
```

## Brand assets

| Use | File |
| --- | --- |
| Header over hero, footer | `images/logo-white.svg` |
| Header on light, mobile menu | `images/logo-blue.svg` |
| Favicon | `images/icon-blue.svg` |
| Spare icon marks | `images/icon-blue.svg`, `images/icon-white.svg` |

The files in `images/` are SVGO-optimised copies of the originals in `Assets/Hero/`.

## Enquiry forms

There is no server. The forms open the visitor's email app with the message pre-filled, addressed to the centre. To receive submissions directly, connect the forms to a form service (Formspree, Netlify Forms, etc.) in `initForms()` in `js/main.js`.
