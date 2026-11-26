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

## Recovery stories (home page carousel)

The carousel in `index.html` (section `stories`) shows one card per story. The seven stories in it now are **samples**, so the section is **hidden on the live site** (`hidden` on the `<section class="stories">` tag). To preview it, add `?preview-stories` to the home page address, for example `https://www.restorarehabcenter.com/?preview-stories`.

**Publishing the section** (ideally with 5 or more approved stories, so both sides of the carousel are filled): replace every sample `<article class="story">` with real ones, then delete `data-preview-only hidden` from the section tag.

**How a story gets onto the site**

1. A client fills in the form on `share-your-story.html` (linked under the carousel and in every footer; staff can also send clients the link directly).
2. It arrives in restoracentreforrecovery@gmail.com with the subject **"Story to review: <name>"**. Nothing is published automatically.
3. The team reads it. If they approve it, they **forward the email to the website designer** (or add the Gmail label **Approved story**). If not, they simply archive it. They can phone or email the client first if a detail needs checking.
4. The designer adds one `<article class="story">` to `index.html`, copying the email's fields into the card:

| Email field | Goes into |
|---|---|
| Name shown on card | first `<span>` in `.story-who` |
| Who they are (card tag) | second `<span>` in `.story-who` |
| Headline | `.story-stat` (if "Not given", write a short one and check it with the team) |
| Story (quote) | `<blockquote><p>` |
| Care received (photo caption) | `<figcaption>`, and pick a matching photo from `images/` |

Never use a photo of a real client unless they have agreed to it separately. Keep the approved email: it is the record of consent. If someone asks for their story to be removed, delete their `<article>` and update the `aria-label` numbers ("1 of 7" and so on) on the remaining cards.

## Email

`info@restorarehabcenter.com` forwards to restoracentreforrecovery@gmail.com through [ImprovMX](https://improvmx.com). DNS lives at Vercel, so the mail records are there, not at TrueHost:

| Type | Value | Priority |
|---|---|---|
| MX | `mx1.improvmx.com` | 10 |
| MX | `mx2.improvmx.com` | 20 |
| TXT | `v=spf1 include:spf.improvmx.com ~all` | |
