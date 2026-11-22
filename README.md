# Restora Centre for Recovery

Marketing website for Restora Centre for Recovery, an addiction treatment and family support centre on Old Namanga Rd, Kitengela.

- **Phone / WhatsApp:** +254 795 180 704
- **Email:** info@restorarehabcenter.com (forwards to restoracentreforrecovery@gmail.com via ImprovMX)
- **Location:** Old Namanga Rd, Kitengela

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
index.html, about.html, programs.html, admissions.html, sitemap.xml, robots.txt,
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

Forms are delivered by [FormSubmit](https://formsubmit.co) straight to restoracentreforrecovery@gmail.com, set as `FORM_INBOX` in `js/main.js`. They deliberately bypass the info@ forwarding, so enquiries still arrive if ImprovMX has an outage.

**FormSubmit must be activated once per inbox.** The first submission sends an activation email to `FORM_INBOX`, and nothing is delivered until someone clicks **Activate Form** in it. If `FORM_INBOX` is ever changed, submit one test and activate again.

The form checks FormSubmit's `success` flag, not just the HTTP status, because FormSubmit answers 200 even when it has not delivered (for example before activation). Visitors see a clear success or error message, with the phone number as backup, and each form includes a hidden spam-trap field.

## Email

`info@restorarehabcenter.com` forwards to restoracentreforrecovery@gmail.com through [ImprovMX](https://improvmx.com). DNS lives at Vercel, so the mail records are there, not at TrueHost:

| Type | Value | Priority |
|---|---|---|
| MX | `mx1.improvmx.com` | 10 |
| MX | `mx2.improvmx.com` | 20 |
| TXT | `v=spf1 include:spf.improvmx.com ~all` | |
