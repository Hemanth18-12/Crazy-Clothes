import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import LogoMark from '../components/LogoMark';

export default function LoginPage() {
  const {
    currentUser,
    isAdmin,
    loginCustomer,
    registerCustomer,
    loginAdmin,
    loginWithGoogle,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Tab & View States
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' | 'admin'
  const [panelView, setPanelView] = useState('login'); // 'login' | 'register' | 'admin'
  const [animClass, setAnimClass] = useState('form-enter');

  // Entrance & Animation States
  const [cardEnter, setCardEnter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Form States
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [duplicatePhoneError, setDuplicatePhoneError] = useState('');
  const [duplicateEmailError, setDuplicateEmailError] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Page entrance trigger
  useEffect(() => {
    const timer = setTimeout(() => setCardEnter(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect handling on mount or when currentUser updates
  useEffect(() => {
    if (currentUser) {
      const redirectPath = sessionStorage.getItem('cc_redirect_after_login');
      const destination = redirectPath || (isAdmin ? '/admin' : location.state?.from?.pathname || '/');
      
      if (redirectPath) {
        sessionStorage.removeItem('cc_redirect_after_login');
      }

      setSuccess(true);
      const timer = setTimeout(() => {
        navigate(destination, { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentUser, isAdmin, navigate, location]);

  // Sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cc_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const triggerError = (msg) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 400);
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (error) setError('');
  };

  // Switch panel wrapper with transitions
  const transitionToPanel = (targetView) => {
    if (targetView === panelView) return;
    setAnimClass('form-exit');
    setTimeout(() => {
      setPanelView(targetView);
      setAnimClass('form-enter');
    }, 250);
  };

  const checkPhoneDuplicate = async (phone) => {
    if (!phone) return;
    setPhoneChecking(true);
    setDuplicatePhoneError('');
    try {
      const cleanPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDuplicatePhoneError('This phone number is already registered.');
      }
    } catch (err) {
      console.error(err);
    }
    setPhoneChecking(false);
  };

  const checkEmailDuplicate = async (email) => {
    if (!email) return;
    setEmailChecking(true);
    setDuplicateEmailError('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDuplicateEmailError('This email is already registered.');
      }
    } catch (err) {
      console.error(err);
    }
    setEmailChecking(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      triggerError('Please fill in all fields.');
      return;
    }
    
    const cleanPhone = regPhone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      triggerError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (duplicatePhoneError || duplicateEmailError) {
      triggerError('Please fix duplicate errors first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await registerCustomer(regEmail, regPassword, regName, cleanPhone);
    } catch (err) {
      console.error(err);
      triggerError(err.message || 'Failed to register.');
      setLoading(false);
    }
  };

  const handleCustomerLoginSubmit = async (e) => {
    e.preventDefault();
    if (!custEmail.trim() || !custPassword) {
      triggerError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginCustomer(custEmail, custPassword);
    } catch (err) {
      console.error(err);
      triggerError(err.message || 'Failed to login.');
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      triggerError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginAdmin(adminEmail, adminPassword);
    } catch (err) {
      console.error(err);
      triggerError(err.message || 'Failed to login as admin.');
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      triggerError(err.message || 'Google sign in failed.');
      setGoogleLoading(false);
    }
  };

  const GoogleSVG = () => (
    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v8.88h12.67c-.55 2.97-2.23 5.49-4.75 7.18l7.35 5.69C43.54 36.63 46.5 30.82 46.5 24z" />
      <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.35-5.69c-2.22 1.5-5.06 2.42-8.54 2.42-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );

  const EyeIcon = ({ visible }) => (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9a3 3 0 1 1-3 3" />
          <path d="M17 17a10 10 0 0 1-13-13" />
          <path d="M21 21a10 10 0 0 1-13-13" />
          <path d="M1 12s4-8 11-8a10 10 0 0 1 8 4" />
          <path d="M23 12a10 10 0 0 1-8 8" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  const SpinnerSVG = () => (
    <div style={{
      width: '18px',
      height: '18px',
      border: '2px solid rgba(0,0,0,0.1)',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'button-spin 0.6s linear infinite',
      display: 'inline-block'
    }}></div>
  );

  return (
    <div className="auth-split-container">
      {/* LEFT: Animated Brand Panel (Desktop Only) */}
      <div className="auth-brand-panel">
        {/* Background ambient glows (existing) */}
        <div className="auth-brand-glow"></div>
        <div className="auth-brand-glow-2"></div>

        {/* New hero radial glow — fades in first, behind everything */}
        <div className="auth-hero-glow"></div>

        <div className="auth-hero-content">
          {/* Top: Logo */}
          <div className="auth-brand-logo cc-logo-word">
            <span style={{ display: 'block' }}>
              {"CRAZY".split("").map((char, i) => (
                <span key={i} className="cc-logo-letter" style={{ "--i": i }}>{char}</span>
              ))}
            </span>
            <span className="cc-logo-word--accent" style={{ display: 'block' }}>
              {"CLOTHS".split("").map((char, i) => (
                <span key={i} className="cc-logo-letter" style={{ "--i": 5 + i + 1 }}>{char}</span>
              ))}
            </span>
          </div>

          {/* Mid: Streetwear model photo with animated motion trails overlay */}
          <div className="auth-hero-figure-wrap">
            <img
              className="auth-hero-svg auth-hero-img"
              src="/assets/images/hardik-cutout.png"
              alt="Streetwear model in bold athletic outfit"
            />

            {/* Speed-trail SVG overlay — absolute, pointer-events none */}
            <svg
              className="auth-trails-overlay"
              viewBox="0 0 200 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Trail 1 — long horizontal speed line */}
              <line className="auth-trail auth-trail--1"
                x1="5" y1="130" x2="100" y2="130"
                stroke="rgba(220,38,38,0.65)" strokeWidth="2.8" strokeLinecap="round"
              />
              {/* Trail 2 — medium line, upper */}
              <line className="auth-trail auth-trail--2"
                x1="18" y1="100" x2="90" y2="100"
                stroke="rgba(220,38,38,0.48)" strokeWidth="2" strokeLinecap="round"
              />
              {/* Trail 3 — medium line, mid */}
              <line className="auth-trail auth-trail--3"
                x1="22" y1="158" x2="85" y2="158"
                stroke="rgba(220,38,38,0.42)" strokeWidth="1.6" strokeLinecap="round"
              />
              {/* Trail 4 — short, lower */}
              <line className="auth-trail auth-trail--4"
                x1="30" y1="200" x2="80" y2="188"
                stroke="rgba(220,38,38,0.32)" strokeWidth="1.3" strokeLinecap="round"
              />
              {/* Trail 5 — subtle, near top */}
              <line className="auth-trail auth-trail--5"
                x1="28" y1="68" x2="72" y2="58"
                stroke="rgba(220,38,38,0.25)" strokeWidth="1.1" strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Bottom: Staggered headline + subline + pills */}
          <div style={{ marginTop: 'auto' }}>
            <div className="auth-hero-headline">
              WEAR YOUR<span>VISION</span>
            </div>
            <p className="auth-hero-subline">
              Premium custom streetwear, printed to order.
              No templates. No limits. Bold by design.
            </p>

            <div className="auth-brand-pills" style={{ marginTop: '1.5rem' }}>
              <div className="auth-brand-pill">Custom Prints</div>
              <div className="auth-brand-pill">Fast Delivery</div>
              <div className="auth-brand-pill">Premium Cotton</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Redesigned Form Panel */}
      <div className="auth-form-panel">
        <div className={`auth-card ${cardEnter ? 'auth-card-enter' : ''} ${isShaking ? 'auth-card-shake' : ''}`}>
          {/* Mobile Logo */}
          <div className="auth-mobile-logo">
            <LogoMark />
          </div>

          {/* Tabs */}
          <div className="auth-tabs-container">
            <div className="auth-tabs" role="tablist">
              <button
                className={`auth-tab ${activeTab === 'customer' ? 'active' : ''}`}
                id="tab-customer"
                role="tab"
                aria-selected={activeTab === 'customer'}
                onClick={() => {
                  setActiveTab('customer');
                  setError('');
                  transitionToPanel('login');
                }}
              >
                Customer
              </button>
              <button
                className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
                id="tab-admin"
                role="tab"
                aria-selected={activeTab === 'admin'}
                onClick={() => {
                  setActiveTab('admin');
                  setError('');
                  transitionToPanel('admin');
                }}
              >
                Admin
              </button>
              <div
                className="tab-indicator"
                id="tab-indicator"
                style={{
                  transform: activeTab === 'customer' ? 'translateX(0)' : 'translateX(100%)',
                  transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              ></div>
            </div>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="auth-message error visible" style={{ display: 'block', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {/* TRANSITION WRAPPER PANEL */}
          <div className={animClass}>
            {/* STATE 1: CUSTOMER LOGIN */}
            {panelView === 'login' && (
              <div className="form-panel active" id="panel-customer">
                <form onSubmit={handleCustomerLoginSubmit} id="sub-login">
                  <h2 className="auth-form-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                    Welcome Back
                  </h2>

                  <div className="input-group">
                    <input
                      type="email"
                      id="cust-email"
                      placeholder=" "
                      autoComplete="email"
                      className="form-input-premium"
                      value={custEmail}
                      onChange={handleInputChange(setCustEmail)}
                    />
                    <label htmlFor="cust-email" className="form-label">Email Address</label>
                    <div className="input-underline"></div>
                  </div>

                  <div className="input-group">
                    <input
                      type={showCustPassword ? 'text' : 'password'}
                      id="cust-password"
                      placeholder=" "
                      autoComplete="current-password"
                      className="form-input-premium"
                      value={custPassword}
                      onChange={handleInputChange(setCustPassword)}
                    />
                    <label htmlFor="cust-password" className="form-label">Password</label>
                    <div className="input-underline"></div>
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCustPassword(!showCustPassword)}
                      tabIndex="-1"
                    >
                      <EyeIcon visible={showCustPassword} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || googleLoading || success}
                    className={`btn btn-premium ${success ? 'btn-success-state' : ''}`}
                    style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {success ? (
                      <>✓ Success</>
                    ) : loading ? (
                      <SpinnerSVG />
                    ) : (
                      'Login'
                    )}
                  </button>

                  <div className="auth-divider" style={{ textAlign: 'center', margin: '1.5rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></span>
                    <span>OR</span>
                    <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></span>
                  </div>

                  <button
                    type="button"
                    disabled={loading || googleLoading || success}
                    onClick={handleGoogleClick}
                    className="btn btn-premium"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', width: '100%', backgroundColor: 'transparent' }}
                  >
                    {googleLoading ? <SpinnerSVG /> : <GoogleSVG />}
                    Continue with Google
                  </button>

                  <p className="auth-toggle-link" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
                    New here? <span style={{ cursor: 'pointer', color: 'var(--color-accent)', textDecoration: 'underline' }} onClick={() => transitionToPanel('register')}>Create account →</span>
                  </p>
                </form>
              </div>
            )}

            {/* STATE 2: CUSTOMER REGISTER */}
            {panelView === 'register' && (
              <div className="form-panel active" id="panel-register">
                <form onSubmit={handleRegisterSubmit}>
                  <h2 className="auth-form-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                    Join Us
                  </h2>

                  <div className="input-group">
                    <input type="text" id="reg-name" placeholder=" " className="form-input-premium" value={regName} onChange={handleInputChange(setRegName)} />
                    <label htmlFor="reg-name" className="form-label">Full Name</label>
                    <div className="input-underline"></div>
                  </div>

                  <div className="input-group">
                    <input type="email" id="reg-email" placeholder=" " className={`form-input-premium ${duplicateEmailError ? 'input-invalid' : ''}`} value={regEmail} onChange={(e) => { handleInputChange(setRegEmail)(e); setDuplicateEmailError(''); }} onBlur={(e) => checkEmailDuplicate(e.target.value)} />
                    <label htmlFor="reg-email" className="form-label">Email Address</label>
                    <div className="input-underline"></div>
                    {emailChecking && <p style={{fontSize:'0.7rem', color:'var(--color-text-secondary)'}}>Checking...</p>}
                    {duplicateEmailError && <p className="field-error" style={{marginTop:'4px', color:'var(--color-accent)'}}>⚠ {duplicateEmailError}</p>}
                  </div>

                  <div className="input-group">
                    <input type="tel" id="reg-phone" placeholder=" " className={`form-input-premium ${duplicatePhoneError ? 'input-invalid' : ''}`} value={regPhone} onChange={(e) => { handleInputChange(setRegPhone)(e); setDuplicatePhoneError(''); }} onBlur={(e) => checkPhoneDuplicate(e.target.value)} />
                    <label htmlFor="reg-phone" className="form-label">WhatsApp Number</label>
                    <div className="input-underline"></div>
                    {phoneChecking && <p style={{fontSize:'0.7rem', color:'var(--color-text-secondary)'}}>Checking...</p>}
                    {duplicatePhoneError && <p className="field-error" style={{marginTop:'4px', color:'var(--color-accent)'}}>⚠ {duplicatePhoneError}</p>}
                  </div>

                  <div className="input-group">
                    <input type={showRegPassword ? 'text' : 'password'} id="reg-password" placeholder=" " className="form-input-premium" value={regPassword} onChange={handleInputChange(setRegPassword)} />
                    <label htmlFor="reg-password" className="form-label">Password</label>
                    <div className="input-underline"></div>
                    <button type="button" className="password-toggle-btn" onClick={() => setShowRegPassword(!showRegPassword)} tabIndex="-1">
                      <EyeIcon visible={showRegPassword} />
                    </button>
                  </div>

                  <button type="submit" disabled={loading || googleLoading || success} className={`btn btn-premium ${success ? 'btn-success-state' : ''}`} style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    {success ? <>✓ Success</> : loading ? <SpinnerSVG /> : 'Create Account'}
                  </button>

                  <div className="auth-divider" style={{ textAlign: 'center', margin: '1.5rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></span>
                    <span>OR</span>
                    <span style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></span>
                  </div>

                  <button type="button" disabled={loading || googleLoading || success} onClick={handleGoogleClick} className="btn btn-premium" style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 500, textTransform: 'none', letterSpacing: 'normal', width: '100%', backgroundColor: 'transparent' }}>
                    {googleLoading ? <SpinnerSVG /> : <GoogleSVG />}
                    Continue with Google
                  </button>

                  <p className="auth-toggle-link" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
                    <span style={{ cursor: 'pointer', color: 'var(--color-accent)', textDecoration: 'underline' }} onClick={() => transitionToPanel('login')}>← Back to login</span>
                  </p>
                </form>
              </div>
            )}

            {/* STATE 3: ADMIN ACCESS */}
            {panelView === 'admin' && (
              <div className="form-panel active" id="panel-admin">
                <form onSubmit={handleAdminLoginSubmit}>
                  <h2 className="auth-form-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                    Admin Access
                  </h2>

                  <div className="input-group">
                    <input
                      type="email"
                      id="admin-email"
                      placeholder=" "
                      autoComplete="email"
                      className="form-input-premium"
                      value={adminEmail}
                      onChange={handleInputChange(setAdminEmail)}
                    />
                    <label htmlFor="admin-email" className="form-label">Admin Email</label>
                    <div className="input-underline"></div>
                  </div>

                  <div className="input-group">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      id="admin-password"
                      placeholder=" "
                      autoComplete="current-password"
                      className="form-input-premium"
                      value={adminPassword}
                      onChange={handleInputChange(setAdminPassword)}
                    />
                    <label htmlFor="admin-password" className="form-label">Password</label>
                    <div className="input-underline"></div>
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      tabIndex="-1"
                    >
                      <EyeIcon visible={showAdminPassword} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || googleLoading || success}
                    className={`btn btn-premium ${success ? 'btn-success-state' : ''}`}
                    style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {success ? (
                      <>✓ Success</>
                    ) : loading ? (
                      <SpinnerSVG />
                    ) : (
                      'Admin Login'
                    )}
                  </button>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '1.5rem' }}>
                    Access restricted to authorised staff only.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
