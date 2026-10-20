/**
 * Restora Centre for Recovery - site scripts
 * Header state, mobile drawer, enquiry forms, Lenis smooth scroll, GSAP reveals.
 * Motion is progressive: with no JS, no GSAP or reduced-motion, everything shows immediately.
 */
(function () {
  'use strict';

  var CONTACT_EMAIL = 'restoracentreforrecovery@gmail.com';
  var CONTACT_PHONE = '+254 795 180 704';
  // Paste your Formspree form URL here, e.g. 'https://formspree.io/f/abcdwxyz'
  var FORMSPREE_ENDPOINT = '';
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
        if (/^\S+@\S+\.\S+$/.test(contact)) data.append('email', contact);

        if (button) { button.disabled = true; button.textContent = 'Sending...'; }
        feedback.className = 'form-feedback';
        feedback.textContent = '';
        fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('status ' + res.status);
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

    // Hero photograph drifts a little slower than the page
    var heroImg = document.querySelector('.hero-media img');
    if (heroImg && window.matchMedia('(min-width: 821px)').matches) {
      gsap.to(heroImg, {
        yPercent: -10, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  function init() {
    initHeader();
    initForms();
    initSmoothScroll();
    initDrawer();
    initMotion();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
