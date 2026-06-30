/**
 * Crazy Cloths - Animations & Scroll Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  initScrollNavbar();
  initMobileMenu();
  initScrollObserver();
  initActiveNavLink();
  initSmoothNavLinks();
  initScrollSpy();
  initHashScroll();
});

/**
 * Transition header styling on scroll
 */
function initScrollNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

/**
 * Mobile Navigation Drawer Toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  
  if (!menuToggle || !mobileDrawer) return;

  menuToggle.addEventListener('click', () => {
    const isActive = menuToggle.classList.toggle('active');
    mobileDrawer.classList.toggle('active', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
  });

  // Close drawer when clicking a link
  const links = mobileDrawer.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mobileDrawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/**
 * Scroll Fade-Slide-In Observer
 */
function initScrollObserver() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (elements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
}

/**
 * Highlight active link in header based on current page path
 */
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'index.html' && (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '')) {
      link.classList.add('active');
    } else if (href && !href.startsWith('#') && !href.startsWith('index.html#') && currentPath.endsWith(href)) {
      link.classList.add('active');
    }
  });
}

/* ─────────────────────────────────────────────
   SMOOTH SECTION SCROLLING
────────────────────────────────────────────── */

const HEADER_OFFSET = 84; // px — sticky header height + a little breathing room

/**
 * Smoothly scroll to a section by its ID, then trigger the landing flash.
 * @param {string} sectionId  - The id attribute of the target section (no #)
 * @param {boolean} flash     - Whether to play the highlight animation on landing
 */
window.scrollToSection = function(sectionId, flash = true) {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const targetTop = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
  window.scrollTo({ top: targetTop, behavior: 'smooth' });

  if (flash) {
    // Detect when scroll settles, then trigger flash on the section heading block
    let settled;
    const checkSettled = () => {
      clearTimeout(settled);
      settled = setTimeout(() => {
        window.removeEventListener('scroll', checkSettled);
        const heading = target.querySelector('h2, h1');
        const flashTarget = heading ? heading.closest('div') || heading : target;
        flashTarget.classList.remove('nav-section-flash');
        // Force reflow so re-adding the class restarts the animation
        void flashTarget.offsetWidth;
        flashTarget.classList.add('nav-section-flash');
        flashTarget.addEventListener('animationend', () => {
          flashTarget.classList.remove('nav-section-flash');
        }, { once: true });
      }, 80);
    };
    window.addEventListener('scroll', checkSettled, { passive: true });
    // Fallback: fire even if page barely moves
    settled = setTimeout(() => {
      window.removeEventListener('scroll', checkSettled);
      const heading = target.querySelector('h2, h1');
      const flashTarget = heading ? heading.closest('div') || heading : target;
      void flashTarget.offsetWidth;
      flashTarget.classList.add('nav-section-flash');
      flashTarget.addEventListener('animationend', () => flashTarget.classList.remove('nav-section-flash'), { once: true });
    }, 700);
  }
};

/**
 * Intercept anchor clicks on [data-section-link] nav items (homepage only).
 * Prevents default instant jump; uses smooth scrollToSection instead.
 */
function initSmoothNavLinks() {
  const isHomepage = window.location.pathname.endsWith('index.html')
                  || window.location.pathname.endsWith('/')
                  || window.location.pathname === '';
  if (!isHomepage) return;

  document.querySelectorAll('[data-section-link]').forEach(link => {
    const sectionId = link.getAttribute('data-section-link');
    if (sectionId === 'home') return; // let home link navigate normally
    link.addEventListener('click', e => {
      e.preventDefault();
      scrollToSection(sectionId, true);
      // Update URL hash without jumping
      history.pushState(null, '', `#${sectionId}`);
    });
  });
}

/**
 * On homepage load: if URL has a valid hash fragment (#collection, #customize, etc.),
 * wait for layout to settle then smooth-scroll + flash to that section.
 */
function initHashScroll() {
  const isHomepage = window.location.pathname.endsWith('index.html')
                  || window.location.pathname.endsWith('/')
                  || window.location.pathname === '';
  if (!isHomepage) return;

  const hash = window.location.hash.replace('#', '');
  if (!hash) return;

  // Delay to allow DOM rendering and auth-gate visibility to settle
  setTimeout(() => {
    scrollToSection(hash, true);
  }, 350);
}

/* ─────────────────────────────────────────────
   SCROLLSPY — active nav underline on scroll
────────────────────────────────────────────── */

/**
 * Watches homepage sections with IntersectionObserver.
 * Adds/removes .scroll-active to matching nav links as sections enter the viewport.
 */
function initScrollSpy() {
  const isHomepage = window.location.pathname.endsWith('index.html')
                  || window.location.pathname.endsWith('/')
                  || window.location.pathname === '';
  if (!isHomepage) return;

  const sections = ['how-it-works', 'collection', 'customize'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks  = document.querySelectorAll('[data-section-link]');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      navLinks.forEach(link => {
        if (link.getAttribute('data-section-link') === id) {
          if (entry.isIntersecting) {
            link.classList.add('scroll-active');
          } else {
            link.classList.remove('scroll-active');
          }
        }
      });
    });
  }, {
    rootMargin: `-${HEADER_OFFSET}px 0px -40% 0px`,
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
}


/**
 * Transition header styling on scroll
 */
function initScrollNavbar() {
  const header = document.querySelector('header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  };

  // Run on load and on scroll
  handleScroll();
  window.addEventListener('scroll', handleScroll);
}

/**
 * Mobile Navigation Drawer Toggle
 */
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  
  if (!menuToggle || !mobileDrawer) return;

  menuToggle.addEventListener('click', () => {
    const isActive = menuToggle.classList.toggle('active');
    mobileDrawer.classList.toggle('active', isActive);
    
    // Prevent body scrolling when menu is open
    document.body.style.overflow = isActive ? 'hidden' : '';
  });

  // Close drawer when clicking a link
  const links = mobileDrawer.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mobileDrawer.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/**
 * Scroll Fade-Slide-In Observer
 */
function initScrollObserver() {
  const elements = document.querySelectorAll('.reveal-on-scroll');
  if (elements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Once revealed, we don't need to observe it anymore
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
}

/**
 * Highlight active link in header
 */
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // Exact path matching or fragment matching
    if (href === 'index.html' && (currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '')) {
      link.classList.add('active');
    } else if (currentPath.endsWith(href)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
