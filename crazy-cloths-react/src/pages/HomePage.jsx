import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartDrawer from '../components/CartDrawer';

export default function HomePage() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  // Scroll animations IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Magnetic button hover effect
  useEffect(() => {
    const primaryBtn = document.getElementById('hero-btn-primary');
    const secondaryBtn = document.getElementById('hero-btn-secondary');

    const handleMouseMove = (e, btn) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate3d(${x * 0.18}px, ${y * 0.18}px, 0)`;
    };

    const handleMouseLeave = (btn) => {
      btn.style.transform = 'translate3d(0, 0, 0)';
    };

    const setupBtn = (btn) => {
      if (!btn) return;
      const move = (e) => handleMouseMove(e, btn);
      const leave = () => handleMouseLeave(btn);
      btn.addEventListener('mousemove', move);
      btn.addEventListener('mouseleave', leave);
      return () => {
        btn.removeEventListener('mousemove', move);
        btn.removeEventListener('mouseleave', leave);
      };
    };

    const cleanPrimary = setupBtn(primaryBtn);
    const cleanSecondary = setupBtn(secondaryBtn);

    return () => {
      if (cleanPrimary) cleanPrimary();
      if (cleanSecondary) cleanSecondary();
    };
  }, []);

  return (
    <>
      <CartDrawer />
      
      {/* HERO SECTION */}
      <section className="hero">
        <div className="noise-overlay"></div>
        <div className="hero-blob"></div>
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1600&q=80"
          alt="Streetwear models wearing custom apparel"
          className="hero-bg"
          onLoad={() => setHeroLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: heroLoaded ? 0.45 : 0,
            transition: 'opacity 0.6s ease-in-out'
          }}
        />
        <div className="hero-bg-overlay"></div>

        <div className="container hero-content">
          <div className="hero-inner">
            <div className="hero-title-container">
              <h1 className="hero-title slam-left">WEAR YOUR</h1>
            </div>
            <div className="hero-title-container" style={{ marginBottom: '1.5rem' }}>
              <h1 className="hero-title stroke-accent slam-right">VISION</h1>
            </div>
            <p className="hero-subhead fade-up-anim delay-sub">
              Premium heavyweight cotton t-shirts customized with your uploaded graphics. No templates, no limits. Engineered for the street, tailored for the bold.
            </p>
            <div className="hero-ctas fade-up-anim delay-ctas" style={{ marginBottom: '4rem' }}>
              <Link
                to="/collection"
                id="hero-btn-primary"
                className="btn btn-primary shimmer-btn"
              >
                Shop Collection
              </Link>
              <Link
                to="/customize"
                id="hero-btn-secondary"
                className="btn btn-secondary wipe-btn"
              >
                Customize Yours
              </Link>
            </div>
          </div>
        </div>

        {/* Scrolling Ticker Strip */}
        <div className="ticker-wrap fade-up-anim delay-ticker" style={{ position: 'absolute', bottom: '6rem', left: 0 }}>
          <div className="ticker-content">
            <span>FREE DELIVERY · </span>
            <span>CUSTOM PRINTS · </span>
            <span>SAME DAY DISPATCH · </span>
            <span>100% COTTON · </span>
            <span>MADE TO ORDER · </span>
            <span>FREE DELIVERY · </span>
            <span>CUSTOM PRINTS · </span>
            <span>SAME DAY DISPATCH · </span>
            <span>100% COTTON · </span>
            <span>MADE TO ORDER · </span>
          </div>
        </div>

        {/* Bouncing Scroll Indicator */}
        <div
          className="scroll-indicator"
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="page-section reveal-on-scroll">
        <div className="container" style={{ position: 'relative' }}>
          <h2 style={{ fontSize: '4rem', marginBottom: '4rem', textAlign: 'center', textTransform: 'uppercase' }}>HOW IT WORKS</h2>
          
          <div className="steps-line-container">
            <svg width="100%" height="2" viewBox="0 0 1000 2" fill="none" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="1000" y2="1" stroke="var(--color-accent)" strokeWidth="2" className="steps-connecting-line"></line>
            </svg>
          </div>

          <div className="how-it-works-row">
            <div className="step-card reveal-on-scroll stagger-1">
              <div className="step-num">01</div>
              <div>
                <h3 className="step-title">UPLOAD DESIGN</h3>
                <p>Drop your custom graphics, text, or artwork. We support all high-res image formats.</p>
              </div>
            </div>
            
            <div className="step-card reveal-on-scroll stagger-2">
              <div className="step-num">02</div>
              <div>
                <h3 className="step-title">CHOOSE FIT &amp; COLOR</h3>
                <p>Select between Paper White or Ink Black bases. Find your perfect tailored fit.</p>
              </div>
            </div>
            
            <div className="step-card reveal-on-scroll stagger-3">
              <div className="step-num">03</div>
              <div>
                <h3 className="step-title">ORDER VIA WHATSAPP</h3>
                <p>Verify your mockups and checkout. Your order details are dispatched directly to our chat.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STRIP SECTION */}
      <section className="brand-strip reveal-on-scroll">
        <div className="container">
          <div className="brand-strip-grid">
            <div className="brand-strip-col">
              <svg className="brand-strip-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <div className="brand-strip-stat">100% ORGANIC COTTON</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#999999' }}>Heavyweight 240GSM combed weave fabric base.</p>
            </div>
            <div className="brand-strip-col">
              <svg className="brand-strip-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5A2.5 2.5 0 0119 14.5v.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="brand-strip-stat">ETHICALLY SOURCED</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#999999' }}>Fair-trade certified mills, premium wash drapes.</p>
            </div>
            <div className="brand-strip-col">
              <svg className="brand-strip-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <div className="brand-strip-stat">INFINITE CREATIVITY</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#999999' }}>Vibrant, crack-resistant high-definition DTF prints.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL MARQUEE */}
      <section className="marquee-wrap reveal-on-scroll">
        <div className="marquee-list">
          <div className="testimonial-card-premium">
            <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"The print detail holds up amazing even after 10 washes. The fit is perfectly oversized."</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700 }}>— RAHUL K.</span>
          </div>
          <div className="testimonial-card-premium">
            <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"Best custom streetwear fit I've found online. The combed cotton feels incredibly dense."</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700 }}>— ARYAN M.</span>
          </div>
          <div className="testimonial-card-premium">
            <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"WhatsApp ordering was simple, got order confirmed in minutes. Amazing customer service."</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700 }}>— SIMRAN S.</span>
          </div>
          <div className="testimonial-card-premium">
            <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>"Fabric weight is solid, doesn't feel thin or cheap. Perfect shoulders drape."</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 700 }}>— HARSH V.</span>
          </div>
        </div>
      </section>
    </>
  );
}
