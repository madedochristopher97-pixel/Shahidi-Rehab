/**
 * Restora Centre for Recovery - self-checks
 * The addiction self-check (based on the ASI) and the alcohol withdrawal check (based on the CIWA-Ar).
 * Everything happens in the browser: answers are never stored, and nothing is sent anywhere.
 */
(function () {
  'use strict';

  var PHONE_HREF = 'tel:+254795180704';
  var PHONE_TEXT = '+254 795 180 704';
  var LEVELS = ['Not at all', 'Slightly', 'Moderately', 'Considerably', 'Extremely'];

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scrollToEl(el) {
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -92 });
    else el.scrollIntoView({ block: 'start' });
  }

  function dateText() {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ---------- Shared: read answers, flag gaps, show results ---------- */
  function collect(form) {
    var missing = [];
    var values = {};
    qsa('fieldset[data-q]', form).forEach(function (fs) {
      var name = fs.getAttribute('data-q');
      var picked = qs('input[name="' + name + '"]:checked', fs);
      fs.classList.toggle('is-missing', !picked);
      if (picked) values[name] = parseInt(picked.value, 10);
      else missing.push(fs);
    });
    return { values: values, missing: missing };
  }

  function reportMissing(form, missing) {
    var box = qs('.check-errors', form);
    if (!missing.length) { box.hidden = true; box.innerHTML = ''; return false; }
    box.innerHTML = '<p><strong>' +
      (missing.length === 1 ? 'One question still needs an answer.' : missing.length + ' questions still need an answer.') +
      '</strong> They are marked below.</p>';
    box.hidden = false;
    scrollToEl(missing[0]);
    var first = qs('input', missing[0]);
    if (first) first.focus({ preventScroll: true });
    return true;
  }

  function printHead(title, extra) {
    return '<div class="print-only print-head"><p><strong>Restora Centre for Recovery</strong> &middot; restorarehabcenter.com &middot; ' +
      PHONE_TEXT + '</p><p>' + esc(title) + ' &middot; ' + dateText() + (extra ? ' &middot; ' + esc(extra) : '') + '</p></div>';
  }

  function actions() {
    return '<div class="res-actions no-print">' +
      '<button type="button" class="btn btn-navy" data-print>Save as PDF or print</button>' +
      '<button type="button" class="btn btn-outline" data-reset>Start again</button>' +
      '<a class="btn btn-primary" href="' + PHONE_HREF + '">Call ' + PHONE_TEXT + '</a>' +
      '</div>' +
      '<p class="res-hint no-print">To save a PDF, choose “Save as PDF” as the printer in the window that opens.</p>';
  }

  var PRIVACY = '<p class="res-fine">Your answers stay on this device. Nothing has been saved or sent.</p>';

  function wire(form, results, render, onReset) {
    // Reveal "See my results" only now that this script is running (see .is-ready in style.css)
    form.classList.add('is-ready');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var got = collect(form);
      if (reportMissing(form, got.missing)) return;
      results.innerHTML = render(got.values);
      results.hidden = false;
      scrollToEl(results);
      results.focus({ preventScroll: true });
    });

    // Clear a question's "needs an answer" mark as soon as it is answered
    form.addEventListener('change', function (e) {
      var fs = e.target.closest('fieldset[data-q]');
      if (fs) fs.classList.remove('is-missing');
    });

    results.addEventListener('click', function (e) {
      if (e.target.closest('[data-print]')) { window.print(); return; }
      if (!e.target.closest('[data-reset]')) return;
      form.reset();
      qsa('.is-missing', form).forEach(function (fs) { fs.classList.remove('is-missing'); });
      reportMissing(form, []);
      if (onReset) onReset();
      results.hidden = true;
      results.innerHTML = '';
      scrollToEl(form);
      var first = qs('input', form);
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* ---------- Addiction self-check (ASI) ---------- */
  function meter(label, val, max, cls) {
    return '<div class="res-bar"><span class="res-bar-label">' + label + '</span>' +
      '<span class="meter' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><span style="width:' + Math.round(val / max * 100) + '%"></span></span>' +
      '<span class="res-bar-val">' + val + ' &middot; ' + LEVELS[val] + '</span></div>';
  }

  function renderAsi(form) {
    return function (v) {
      var areas = qsa('[data-area]', form).map(function (el) {
        var k = el.getAttribute('data-area');
        return { name: el.getAttribute('data-name'), t: v[k + '-t'], i: v[k + '-i'] };
      });
      // Most troubling first; ties broken by how much help is wanted
      var sorted = areas.slice().sort(function (a, b) { return (b.t - a.t) || (b.i - a.i); });
      var names = function (list) { return esc(list.map(function (a) { return a.name; }).join(', ')); };
      var troubled = areas.filter(function (a) { return a.t >= 3; });
      var wantHelp = areas.filter(function (a) { return a.i >= 3; });

      var summary = troubled.length
        ? 'You rated <strong>' + (troubled.length === 1 ? 'one area' : troubled.length + ' areas') +
          '</strong> as considerably or extremely troubling over the past 30 days: <strong>' + names(troubled) + '</strong>.'
        : 'You did not rate any area as considerably or extremely troubling over the past 30 days.';
      if (wantHelp.length) summary += ' You said getting help matters a lot to you for <strong>' + names(wantHelp) + '</strong>.';

      // Thoughts of self-harm are covered by the psychiatric area: surface crisis help, not just a bar
      var crisis = v['psychiatric-t'] >= 3
        ? '<div class="emergency"><p><strong>If you are having thoughts of harming yourself or ending your life,</strong> please do not wait. ' +
          'Call <a href="tel:999">999</a> or <a href="tel:112">112</a> now, or call us on <a href="' + PHONE_HREF + '">' + PHONE_TEXT +
          '</a>. We are open 24 hours a day.</p></div>'
        : '';

      var rows = sorted.map(function (a) {
        return '<div class="res-row"><div class="res-name">' + esc(a.name) + '</div>' +
          meter('How troubled', a.t, 4) + meter('How much you want help', a.i, 4, 'alt') + '</div>';
      }).join('');

      return printHead('Addiction self-check, based on the Addiction Severity Index (ASI)') +
        '<p class="res-kicker">Your results</p>' +
        '<h2>Where addiction is touching your life</h2>' +
        '<p class="res-summary">' + summary + '</p>' +
        crisis +
        '<div class="res-list">' + rows + '</div>' +
        '<p class="res-msg">This is a picture of your own answers, not a diagnosis and not an ASI score. A trained clinician can carry out the full ASI interview and use it to plan treatment around the areas that matter most to you. Our admissions team can talk it through with you, in confidence, at any hour.</p>' +
        actions() + PRIVACY;
    };
  }

  /* ---------- Alcohol withdrawal check (CIWA-Ar) ---------- */
  var BANDS = {
    minimal: {
      label: 'Minimal', title: 'Minimal withdrawal, for now',
      text: '<p>Your answers suggest minimal withdrawal at the moment. <strong>This does not mean withdrawal is safe.</strong> Symptoms can get worse over the next two to three days, and stopping heavy drinking should always be medically supervised. Check again if anything changes, and call us for advice.</p>'
    },
    moderate: {
      label: 'Moderate', title: 'Moderate withdrawal',
      text: '<p><strong>Medical supervision is strongly advised.</strong> Withdrawal at this level can get worse quickly, and treatment given early can prevent complications. Please call us now. We are open 24 hours a day.</p>'
    },
    severe: {
      label: 'Severe', title: 'Severe withdrawal',
      text: '<p><strong>This level of withdrawal needs medical treatment now.</strong> Call us, or go to the nearest hospital emergency department. If any danger sign appears, such as a seizure, confusion or seeing things that are not there, call <a href="tel:999">999</a> or <a href="tel:112">112</a> straight away.</p>'
    }
  };

  // Fewer than 8 is minimal, 8 to 15 moderate, more than 15 severe (maximum 67)
  function band(total) { return total < 8 ? 'minimal' : (total <= 15 ? 'moderate' : 'severe'); }

  // The three bands get equal width on the gauge. Keep the marker inside its own band,
  // never on a boundary, so a 7 and an 8 can't look the same.
  function markerPos(total, b) {
    if (b === 'minimal') return 2 + (total / 7) * 29;
    if (b === 'moderate') return 35.5 + ((total - 8) / 7) * 29;
    return 69 + ((Math.min(total, 67) - 16) / 51) * 29;
  }

  function renderCiwa(form) {
    return function (v) {
      var items = qsa('fieldset[data-q]', form).map(function (fs) {
        var k = fs.getAttribute('data-q');
        return { label: fs.getAttribute('data-label'), val: v[k], max: parseInt(fs.getAttribute('data-max'), 10) };
      });
      var total = items.reduce(function (sum, it) { return sum + it.val; }, 0);
      var b = band(total);
      var dangers = qsa('input[name="danger"]:checked', form).map(function (c) { return c.parentNode.textContent.trim(); });
      var who = qs('input[name="who"]:checked', form);
      var whoText = who ? (who.value === 'self' ? 'Answered about myself' : 'Answered about someone I am with') : '';

      // Any danger sign outranks the score, so it leads the results
      var danger = dangers.length
        ? '<div class="emergency emergency-lead">' + qs('.danger-alert', form).innerHTML +
          '<p class="danger-list">Danger signs ticked: ' + esc(dangers.join('; ')) + '.</p></div>'
        : '';

      var rows = items.map(function (it) {
        return '<tr><td>' + esc(it.label) + '</td><td>' + it.val + ' / ' + it.max + '</td></tr>';
      }).join('');

      return printHead('Alcohol withdrawal check, based on the CIWA-Ar', whoText) +
        danger +
        '<p class="res-kicker">Your results</p>' +
        '<h2>' + BANDS[b].title + '</h2>' +
        '<div class="res-score"><span class="num">' + total + '</span><span class="of">out of 67</span>' +
        '<span class="band band-' + b + '">' + BANDS[b].label + '</span></div>' +
        '<div class="zones" aria-hidden="true"><span class="z1"></span><span class="z2"></span><span class="z3"></span>' +
        '<i class="marker" style="left:' + markerPos(total, b).toFixed(1) + '%"></i></div>' +
        '<div class="zone-labels" aria-hidden="true"><span>0 to 7 &middot; Minimal</span><span>8 to 15 &middot; Moderate</span><span>16+ &middot; Severe</span></div>' +
        '<div class="res-msg">' + BANDS[b].text + '</div>' +
        '<table class="res-table"><caption class="sr-only">Score for each symptom</caption>' +
        '<thead><tr><th scope="col">Symptom</th><th scope="col">Score</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="res-msg">This is a rough guide, not a medical assessment. The CIWA-Ar is designed to be scored by a nurse or doctor who can observe the symptoms directly.</p>' +
        actions() + PRIVACY;
    };
  }

  // Show the emergency message the moment a danger sign is ticked, not after the whole check
  function wireDanger(form) {
    var alertBox = qs('.danger-alert', form);
    function update() { alertBox.hidden = !qs('input[name="danger"]:checked', form); }
    form.addEventListener('change', function (e) { if (e.target.name === 'danger') update(); });
    return update;
  }

  function init() {
    var asi = qs('#asiForm');
    if (asi) wire(asi, qs('#asiResults'), renderAsi(asi));
    var ciwa = qs('#ciwaForm');
    if (ciwa) wire(ciwa, qs('#ciwaResults'), renderCiwa(ciwa), wireDanger(ciwa));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
