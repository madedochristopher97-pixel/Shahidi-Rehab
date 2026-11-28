/**
 * Restora Centre for Recovery - site scripts
 * Header state, mobile drawer, enquiry forms, Lenis smooth scroll, GSAP reveals.
 * Motion is progressive: with no JS, no GSAP or reduced-motion, everything shows immediately.
 */
(function () {
  'use strict';

  // Shown and linked across the site; people email the Gmail inbox directly.
  var CONTACT_EMAIL = 'restoracentreforrecovery@gmail.com';
  var CONTACT_PHONE = '+254 795 180 704';
  // Form enquiries are delivered via FormSubmit (no account): the first
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

  /* ---------- Share your story: sent to the team's inbox for approval, never straight onto the site ----------
     The email's field names match the parts of a story card, so an approved email can be copied into
     index.html as it is. Approval steps are in README.md ("Recovery stories"). */
  function initReviewForm() {
    var form = document.querySelector('form[data-review]');
    if (!form) return;
    var feedback = form.querySelector('.form-feedback');
    var button = form.querySelector('button[type="submit"]');
    var label = button.textContent;
    var story = form.elements.story;
    var count = form.querySelector('.field-count');
    var max = Number(story.getAttribute('maxlength')) || 400;

    function show(type, text) { feedback.className = 'form-feedback ' + type; feedback.textContent = text; }
    function updateCount() { var left = max - story.value.length; count.textContent = left < 120 ? left + ' characters left' : ''; }
    story.addEventListener('input', updateCount);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements._gotcha.value) return; // spam trap
      var v = function (n) { return (form.elements[n].value || '').trim(); };
      var name = v('displayName');

      var missing = !name ? form.elements.displayName : !v('relation') ? form.elements.relation : !v('story') ? story : !form.elements.consent.checked ? form.elements.consent : null;
      if (missing) {
        show('error', missing === form.elements.consent
          ? 'Please tick the box to agree that we can publish your story.'
          : 'Please add the name to show, who you are and your story.');
        missing.focus();
        return;
      }

      var data = new FormData();
      data.append('_subject', 'Story to review: ' + name);
      data.append('_template', 'table');
      data.append('_captcha', 'false');
      data.append('Name shown on card', name);
      data.append('Who they are (card tag)', v('relation'));
      data.append('Care received (photo caption)', v('care') || 'Not given');
      data.append('Headline', v('headline') || 'Not given');
      data.append('Story (quote)', v('story'));
      data.append('Private contact (never published)', v('contact') || 'Not given');
      data.append('Consent to publish', 'Yes, ticked on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      data.append('To approve', 'Forward this email to the website designer, or add the Gmail label "Approved story". Nothing is published until then.');
      if (/^\S+@\S+\.\S+$/.test(v('contact'))) data.append('email', v('contact'));

      button.disabled = true; button.textContent = 'Sending...';
      feedback.className = 'form-feedback'; feedback.textContent = '';
      fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (r) {
          if (!r.ok || String(r.body.success) !== 'true') throw new Error(r.body.message || 'not delivered');
          form.reset(); updateCount();
          show('success', 'Thank you, ' + name.replace(/\.+$/, '') + '. Our team will read your story before anything is published, and may contact you first if you left your details.');
        })
        .catch(function () {
          show('error', 'Sorry, your story did not send. Please try again, or WhatsApp it to us on ' + CONTACT_PHONE + '.');
        })
        .then(function () { button.disabled = false; button.textContent = label; });
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

  // Recovery stories carousel (home). Each card gets its size and position from its distance to the
  // active card; CSS transitions do the motion (see "RECOVERY STORIES" in css/style.css).
  function initStories() {
    var root = document.querySelector('[data-stories]');
    if (!root) return;
    // While the section still holds sample stories it is hidden, except on the preview link (?preview-stories)
    var section = root.closest('.stories');
    if (section && section.hidden) {
      if (!/[?&]preview-stories(=|&|$)/.test(window.location.search)) return;
      section.hidden = false;
    }
    var stage = root.querySelector('.stories-stage');
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.story'));
    var dotsWrap = root.querySelector('.stories-dots');
    var pauseBtn = root.querySelector('.stories-pause');
    var n = cards.length;
    if (n < 2) return;

    var DWELL = 6500;   // ms each story stays (matches --dwell in the CSS)
    var SWAP = 240;     // ms before the incoming photo and text appear
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var active = 0, prev = [], timer = null, swapTimer = null, startedAt = 0, remaining = DWELL;
    var userPaused = reduce, hover = false, focusIn = false, visible = false;

    var dots = cards.map(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stories-dot';
      b.setAttribute('aria-label', 'Story ' + (i + 1) + ' of ' + n);
      b.appendChild(document.createElement('span'));
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function offset(i) {
      var d = ((i - active) % n + n) % n;
      return d > Math.floor(n / 2) ? d - n : d;
    }

    function sizes() {
      var cw = stage.clientWidth;
      if (cw >= 900) return { w0: Math.min(660, cw * 0.56), h0: 420, w1: 96, h1: 280, w2: 60, h2: 168, gap: 14, r0: 22, r1: 16 };
      if (cw >= 640) return { w0: cw - 2 * (64 + 12) - 2 * (36 + 12), h0: 400, w1: 64, h1: 260, w2: 36, h2: 150, gap: 12, r0: 20, r1: 14 };
      // Phones: photo on top, story below; the card is as tall as the longest story needs
      var w0 = cw - 2 * (16 + 8), ph = Math.round(w0 * 0.66);
      stage.style.setProperty('--w0', w0 + 'px');
      stage.style.setProperty('--ph', ph + 'px');
      var body = 0;
      cards.forEach(function (c) { body = Math.max(body, c.querySelector('.story-body').offsetHeight); });
      return { w0: w0, h0: ph + body, w1: 16, h1: Math.round((ph + body) * 0.68), w2: 0, h2: 0, gap: 8, r0: 18, r1: 10 };
    }

    function layout(animate) {
      var s = sizes();
      stage.style.height = s.h0 + 'px';
      stage.style.setProperty('--w0', s.w0 + 'px');
      cards.forEach(function (card, i) {
        var d = offset(i), a = Math.abs(d), side = d < 0 ? -1 : 1;
        var inner = s.w0 / 2 + s.gap;
        var w, h, x, r = s.r1, op = 1;
        if (a === 0) { w = s.w0; h = s.h0; x = -w / 2; r = s.r0; }
        else if (a === 1) { w = s.w1; h = s.h1; x = side > 0 ? inner : -inner - w; }
        else if (a === 2 && s.w2) { w = s.w2; h = s.h2; x = side > 0 ? inner + s.w1 + s.gap : -inner - s.w1 - s.gap - w; }
        else {
          var far = inner + s.w1 + s.gap + (s.w2 ? s.w2 + s.gap : 0);
          w = (s.w2 || s.w1) * 0.6; h = (s.h2 || s.h1) * 0.6; x = side > 0 ? far : -far - w; op = 0;
        }
        // A card that changes sides off-screen (or across a multi-step jump) moves without animating
        var p = prev[i];
        if (!animate || (p !== undefined && p * d < 0 && Math.abs(p - d) > 1)) card.classList.add('no-anim');
        card.style.width = w + 'px';
        card.style.height = h + 'px';
        card.style.opacity = op;
        card.style.zIndex = 10 - a;
        card.style.setProperty('--x', x + 'px');
        card.style.setProperty('--r', r + 'px');
        card.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
        prev[i] = d;
      });
      void stage.offsetWidth;
      cards.forEach(function (card) { card.classList.remove('no-anim'); });
      dots.forEach(function (b, i) { b.setAttribute('aria-current', i === active ? 'true' : 'false'); });
    }

    function go(to) {
      to = ((to % n) + n) % n;
      if (to === active) return;
      var old = cards[active], next = cards[to];
      old.classList.remove('is-active', 'is-swapping');
      active = to;
      next.classList.add('is-active', 'is-swapping');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(function () { next.classList.remove('is-swapping'); }, SWAP);
      layout(true);
      clearTimeout(timer); timer = null; remaining = DWELL;
      sync();
    }

    function running() { return !userPaused && !hover && !focusIn && visible && !document.hidden; }

    function sync() {
      var run = running();
      root.classList.toggle('is-paused', !run);
      stage.setAttribute('aria-live', run ? 'off' : 'polite');
      if (run && !timer) {
        startedAt = Date.now();
        timer = setTimeout(function () { timer = null; go(active + 1); }, remaining);
      } else if (!run && timer) {
        clearTimeout(timer); timer = null;
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
      }
    }

    function setPaused(p) {
      userPaused = p;
      pauseBtn.setAttribute('aria-label', p ? 'Play stories' : 'Pause stories');
      pauseBtn.innerHTML = p
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
      sync();
    }

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () { if (i !== active) go(i); });
    });
    pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
    root.addEventListener('mouseenter', function () { hover = true; sync(); });
    root.addEventListener('mouseleave', function () { hover = false; sync(); });
    root.addEventListener('focusin', function () { focusIn = true; sync(); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focusIn = false; sync(); } });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    });
    var touchX = null;
    stage.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(stage);
    } else { visible = true; }

    var raf = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { layout(false); });
    });

    cards[0].classList.add('is-active');
    layout(false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(false); });
    setPaused(userPaused);
  }

  /* ---------- Footer visitor counter ----------
     Counts come from /api/visitors (api/visitors.js, which reads Google Analytics and is cached for 15 min).
     Nothing is shown until real numbers arrive: if the endpoint is not configured, fails, or the page is
     served without it (local preview), the footer looks exactly as before. */
  var VISIT_PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Past 7 days' },
    { key: 'month', label: 'Past 30 days' },
    { key: 'year', label: 'Past year' }
  ];

  function initVisitorCounter() {
    var footerTop = document.querySelector('.site-footer .footer-top');
    if (!footerTop || !window.fetch) return;

    function render(data) {
      if (!data || VISIT_PERIODS.some(function (p) { return typeof data[p.key] !== 'number'; })) return;
      var box = document.createElement('div');
      box.className = 'footer-visits';
      box.setAttribute('role', 'region');
      box.setAttribute('aria-labelledby', 'footerVisitsTitle');
      box.innerHTML =
        '<p class="footer-visits-title" id="footerVisitsTitle">Visitors to this site</p>' +
        '<dl class="footer-visits-list">' +
        VISIT_PERIODS.map(function (p) {
          return '<div><dt>' + p.label + '</dt><dd>' + Math.max(0, Math.round(data[p.key])).toLocaleString('en-US') + '</dd></div>';
        }).join('') +
        '</dl>' +
        '<p class="footer-visits-note">Counted by Google Analytics, from visitors who accept cookies.</p>';
      footerTop.appendChild(box);
      requestAnimationFrame(function () { box.classList.add('is-ready'); });
    }

    function load() {
      fetch('/api/visitors', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(render)
        .catch(function () {});
    }

    // Only ask once the footer is close to view, so pages nobody scrolls to the end of make no request.
    if (!('IntersectionObserver' in window)) return load();
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      load();
    }, { rootMargin: '800px 0px' });
    io.observe(footerTop);
  }

  function init() {
    initConsent();
    initHeader();
    initForms();
    initReviewForm();
    initSmoothScroll();
    initDrawer();
    initStories();   // before initMotion, so a previewed stories section is visible when reveals are measured
    initMotion();
    initHeroRise();
    initGallery();
    initVisitorCounter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
