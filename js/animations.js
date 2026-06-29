/**
 * Crazy Cloths - Animations & Scroll Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  initScrollNavbar();
  initMobileMenu();
  initScrollObserver();
  initActiveNavLink();
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
