// Mobile nav toggle — shared across pages later (Section 11)
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Header goes from transparent to solid once the page scrolls
const siteHeader = document.querySelector('.site-header');
const SCROLL_THRESHOLD = 40;

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });
}