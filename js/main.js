/**
 * Restora Centre for Recovery - site scripts
 * Header state, mobile drawer, enquiry forms, Lenis smooth scroll, GSAP reveals.
 * Motion is progressive: with no JS, no GSAP or reduced-motion, everything shows immediately.
 */
(function () {
  'use strict';

  var CONTACT_EMAIL = 'info@restorarehabcenter.com';
  var CONTACT_PHONE = '+254 795 180 704';
  // Enquiries go straight to the inbox rather than through info@'s forwarding (ImprovMX), so the form
  // keeps working even if forwarding has an outage. Delivery is via FormSubmit (no account): the first
  // submission sends a one-time activation email to FORM_INBOX, and nothing is delivered until it is clicked.
  var FORM_INBOX = 'restoracentreforrecovery@gmail.com';
  var FORMSPREE_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_INBOX;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;

  /* ---------- Header: solid once the page has scrolled ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var update = function () {
      header.classList.toggle('is-solid', window.scrollY > 24 || !header.classList.contains('over-hero'));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Mobile drawer ---------- */
  function initDrawer() {
    var toggle = document.querySelector('.menu-toggle');
    var drawer = document.querySelector('.drawer');
    var overlay = document.querySelector('.drawer-overlay');
    var close = document.querySelector('.drawer-close');
    if (!toggle || !drawer || !overlay) return;

    function setOpen(open) {
      drawer.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open && close) close.focus(); else if (!open) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener('click', function () { setOpen(true); });
    if (close) close.addEventListener('click', function () { setOpen(false); });
    overlay.addEventListener('click', function () { setOpen(false); });
    drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (drawer.classList.contains('open')) setOpen(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false);
    });
  }

  /* ---------- Enquiry forms (no backend: hand the message to the visitor's email app) ---------- */
  function initForms() {
    document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
      var feedback = form.querySelector('.form-feedback');
      var button = form.querySelector('button[type="submit"]');
      var label = button ? button.textContent : '';

      function show(type, text) { feedback.className = 'form-feedback ' + type; feedback.textContent = text; }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (form.elements.fullName.value || '').trim();
        var contact = (form.elements.contact.value || '').trim();
        var who = form.elements.whoFor ? form.elements.whoFor.value : '';
        var message = form.elements.message ? (form.elements.message.value || '').trim() : '';

        if (form.elements._gotcha && form.elements._gotcha.value) return; // spam trap

        if (!name || !contact) {
          show('error', 'Please add your name and a phone number or email so we can reply.');
          (!name ? form.elements.fullName : form.elements.contact).focus();
          return;
        }

        var fallback = 'call ' + CONTACT_PHONE + ' or write to ' + CONTACT_EMAIL + '.';

        // No Formspree endpoint set yet: open the visitor's email app instead
        if (!FORMSPREE_ENDPOINT) {
          var body = 'Name: ' + name + '\nPhone or email: ' + contact + (who ? '\nEnquiry for: ' + who : '') + '\n\n' + message;
          show('success', 'Your email app should open with your message ready to send. If it does not, ' + fallback);
          window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Enquiry from ' + name) + '&body=' + encodeURIComponent(body);
          return;
        }

        var data = new FormData(form);
        data.append('_subject', 'Website enquiry from ' + name);
        data.append('_template', 'table');
        if (/^\S+@\S+\.\S+$/.test(contact)) data.append('email', contact);

        if (button) { button.disabled = true; button.textContent = 'Sending...'; }
        feedback.className = 'form-feedback';
        feedback.textContent = '';
        fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; });
          })
          .then(function (r) {
            // FormSubmit answers 200 even when it has not delivered the message (for example while
            // the form still needs activating), so trust its success flag, not just the status code
            if (!r.ok || String(r.body.success) !== 'true') throw new Error(r.body.message || 'not delivered');
            form.reset();
            show('success', 'Thank you, ' + name + '. We have your message and will reply privately. If it is urgent, please ' + fallback);
          })
          .catch(function () {
            show('error', 'Sorry, your message did not send. Please ' + fallback);
          })
          .then(function () { if (button) { button.disabled = false; button.textContent = label; } });
      });
    });
  }

  /* ---------- Lenis smooth scroll, wired to GSAP's ticker ---------- */
  function initSmoothScroll() {
    if (reduceMotion || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;

    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var url = new URL(a.href, window.location.href);
        if (url.pathname !== window.location.pathname || !url.hash || url.hash === '#') return;
        var target = document.querySelector(url.hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -(76 + 16) });
        history.pushState(null, '', url.hash);
      });
    });
  }

  /* ---------- GSAP: one gentle reveal, one slow hero drift ---------- */
  function initMotion() {
    var root = document.documentElement;
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      root.classList.add('reveal-off');
      return;
    }
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    window.__animReady = true;

    // Hero: staggered arrival on load
    var heroItems = gsap.utils.toArray('[data-hero]');
    if (heroItems.length) {
      gsap.to(heroItems, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.15 });
    }

    // Everything else: reveal once as it enters, small stagger inside a batch
    var items = gsap.utils.toArray('[data-reveal]:not([data-hero])');
    if (items.length) {
      window.ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true });
        }
      });
    }

  }

  /* ---------- Home hero: meadow and butterflies rise once (timing lives in CSS, from Figma) ---------- */
  function initHeroRise() {
    var hero = document.querySelector('.hero-calm');
    if (!hero) return;
    var started = false;
    var play = function () {
      if (started) return;
      started = true;
      requestAnimationFrame(function () { hero.classList.add('is-playing'); });
    };
    // Wait for the meadow and butterflies so the rise is seen, but never hold the page for long
    var imgs = Array.prototype.slice.call(hero.querySelectorAll('.hc-rise img, img.hc-rise'));
    var ready = imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    });
    Promise.all(ready).then(play);
    setTimeout(play, 2500);
  }

  /* ---------- Facility gallery: open a photo full size ---------- */
  function initGallery() {
    var tiles = document.querySelectorAll('.g-item, .gallery-lead');
    if (!tiles.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close photo">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(box);

    var img = box.querySelector('img');
    var cap = box.querySelector('figcaption');
    var closeBtn = box.querySelector('.lightbox-close');
    var lastFocus = null;

    function open(src, alt, text) {
      img.src = src; img.alt = alt;
      cap.textContent = text || '';
      cap.hidden = !text;
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      closeBtn.focus();
    }

    function close() {
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    tiles.forEach(function (tile) {
      var i = tile.querySelector('img');
      if (!i) return;
      var c = tile.querySelector('figcaption');
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', 'View photo: ' + i.alt);
      function go() { lastFocus = tile; open(i.currentSrc || i.src, i.alt, c ? c.textContent : ''); }
      tile.addEventListener('click', go);
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === closeBtn) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
  }

  /* ---------- Cookie consent: analytics only after "Accept" ----------
     The loader in each page's <head> keeps Google Tag Manager switched off until the visitor has
     accepted (window.restoraLoadAnalytics). The choice is kept for 12 months in localStorage and
     can be changed from "Cookie Settings" in the footer. */
  function initConsent() {
    var KEY = 'restora-cookie-consent';
    var YEAR = 365 * 24 * 60 * 60 * 1000;

    function readChoice() {
      try {
        var c = JSON.parse(localStorage.getItem(KEY));
        if (c && (c.choice === 'granted' || c.choice === 'denied') && Date.now() - c.at < YEAR) return c.choice;
      } catch (e) {}
      return null;
    }
    function saveChoice(choice) {
      try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() })); } catch (e) {}
    }
    function clearAnalyticsCookies() {
      var host = location.hostname;
      var domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
      document.cookie.split(';').forEach(function (part) {
        var name = part.split('=')[0].trim();
        if (!/^(_ga|_gid|_gat)/.test(name)) return;
        domains.forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      });
    }

    var bar = document.createElement('section');
    bar.className = 'cookie-bar';
    bar.setAttribute('aria-labelledby', 'cookieTitle');
    bar.hidden = true;
    bar.innerHTML =
      '<p class="cookie-title" id="cookieTitle">Cookies and analytics</p>' +
      '<p>With your permission, we use Google Analytics cookies to see how people use this website, so we can make it easier to use. ' +
      'Your self-check answers are never collected. If you decline, no analytics run.</p>' +
      '<p class="cookie-more"><a href="privacy.html#analytics">Read our privacy policy</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-navy btn-sm" data-consent="granted">Accept</button>' +
      '<button type="button" class="btn btn-outline btn-sm" data-consent="denied">Decline</button>' +
      '</div>';
    document.body.appendChild(bar);

    var returnFocus = null;
    function open(fromSettings) {
      returnFocus = fromSettings || null;
      bar.hidden = false;
      requestAnimationFrame(function () { bar.classList.add('is-open'); });
      if (fromSettings) bar.querySelector('[data-consent="granted"]').focus({ preventScroll: true });
    }
    function close() {
      bar.classList.remove('is-open');
      setTimeout(function () { bar.hidden = true; }, 300);
      if (returnFocus) returnFocus.focus({ preventScroll: true });
    }

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      saveChoice(choice);
      if (choice === 'granted') {
        if (window.restoraLoadAnalytics) window.restoraLoadAnalytics();
      } else {
        var wasOn = !!window.__gtmLoaded;
        if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
        clearAnalyticsCookies();
        // Tag Manager cannot be unloaded from a running page, so start this page again without it
        if (wasOn) { window.location.reload(); return; }
      }
      close();
    });

    document.querySelectorAll('[data-cookie-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn); });
    });

    if (!readChoice()) open();
  }

  function init() {
    initConsent();
    initHeader();
    initForms();
    initSmoothScroll();
    initDrawer();
    initMotion();
    initHeroRise();
    initGallery();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
