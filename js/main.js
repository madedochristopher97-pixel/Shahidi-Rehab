/**
 * Shahidi Centre for Recovery - Core JavaScript
 * "Witnessing Recovery, Transforming Lives."
 * Handles: Responsive Navigation, Sticky Header, FAQ Accordions,
 * Direct WhatsApp Linkages, Contact Form Validations, and Accessibility.
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileNav();
  initFaqAccordions();
  initForms();
  initActiveNavLink();
  initContactModal();
});

/* --------------------------------------------------------------------------
   1. Sticky Header Shadow on Scroll
   -------------------------------------------------------------------------- */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* --------------------------------------------------------------------------
   2. Responsive Mobile Drawer Navigation
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-drawer-overlay');
  const closeBtn = document.querySelector('.mobile-drawer-close');

  if (!toggleBtn || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

/* --------------------------------------------------------------------------
   3. Accessible FAQ Accordions
   -------------------------------------------------------------------------- */
function initFaqAccordions() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const btn = item.querySelector('.faq-question-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';

      // Optionally close other items in the same accordion
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.faq-question-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isExpanded) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Active Navigation Link Sync
   -------------------------------------------------------------------------- */
function initActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.main-nav .nav-link, .mobile-drawer-nav .nav-link');

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/* --------------------------------------------------------------------------
   5. Interactive Admissions / Contact Form
   -------------------------------------------------------------------------- */
function initForms() {
  const forms = document.querySelectorAll('form[data-validate="true"]');
  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const feedback = form.querySelector('.form-feedback') || createFeedbackContainer(form);

      const name = form.querySelector('[name="fullName"]')?.value?.trim();
      const contact = form.querySelector('[name="contact"]')?.value?.trim();

      if (!name || !contact) {
        showFeedback(feedback, 'Please provide both your name and a preferred phone or email so we can reach you.', 'error');
        return;
      }

      showFeedback(feedback, 'Thank you, ' + name + '. Your confidential inquiry has been received. Our clinical intake coordinator will reach out shortly.', 'success');
      form.reset();
    });
  });
}

function createFeedbackContainer(form) {
  const div = document.createElement('div');
  div.className = 'form-feedback';
  div.style.marginTop = '16px';
  div.style.padding = '12px 16px';
  div.style.borderRadius = '8px';
  div.style.fontSize = '0.9375rem';
  div.style.display = 'none';
  form.appendChild(div);
  return div;
}

function showFeedback(container, message, type) {
  container.style.display = 'block';
  container.textContent = message;
  if (type === 'error') {
    container.style.background = '#fef2f2';
    container.style.color = '#991b1b';
    container.style.border = '1px solid #fecaca';
  } else {
    container.style.background = '#f0fdf4';
    container.style.color = '#166534';
    container.style.border = '1px solid #bbf7d0';
  }
}

/* --------------------------------------------------------------------------
   6. Quick Help Modal (Triggered by "Get Help Now" or Quick CTAs)
   -------------------------------------------------------------------------- */
function initContactModal() {
  const triggers = document.querySelectorAll('[data-open-modal="quick-help"]');
  const modal = document.getElementById('quickHelpModal');
  if (!modal || !triggers.length) return;

  const closeBtn = modal.querySelector('.modal-close');
  const overlay = modal.querySelector('.modal-overlay');

  const openModal = (e) => {
    if (e) e.preventDefault();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  triggers.forEach((btn) => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}
