import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../css/admin.css';

export default function AdminLayout({ children, title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('Loading time...');
  const [unreadCount, setUnreadCount] = useState(0);
  const [shakeBell, setShakeBell] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Live clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Notifications bell / unread orders logic
  useEffect(() => {
    let lastVisit = localStorage.getItem('cc_last_visit_time');
    if (!lastVisit) {
      lastVisit = new Date().toISOString();
      localStorage.setItem('cc_last_visit_time', lastVisit);
    }

    const savedUnread = parseInt(localStorage.getItem('cc_unread_count') || '0', 10);
    setUnreadCount(savedUnread);

    // If on orders page, clear notifications
    if (location.pathname === '/admin/orders') {
      localStorage.setItem('cc_last_visit_time', new Date().toISOString());
      localStorage.setItem('cc_unread_count', '0');
      setUnreadCount(0);
    }

    const q = query(collection(db, 'orders'));
    let isInitial = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          const createdAt = order.createdAt;
          
          if (!isInitial && createdAt && createdAt > lastVisit) {
            const currentPath = window.location.pathname;
            if (currentPath === '/admin/orders') {
              // Automatically mark read if on orders page
              localStorage.setItem('cc_last_visit_time', new Date().toISOString());
              localStorage.setItem('cc_unread_count', '0');
              setUnreadCount(0);
            } else {
              setUnreadCount((prev) => {
                const next = prev + 1;
                localStorage.setItem('cc_unread_count', next.toString());
                return next;
              });
              setShakeBell(true);
              setTimeout(() => setShakeBell(false), 600);
            }

            const orderIdStr = order.orderId || change.doc.id.slice(0, 8);
            window.showAdminToast(
              'New Order!',
              `#CC-${orderIdStr} from ${order.customerName || 'Customer'}`,
              'success'
            );
          }
        }
      });
      isInitial = false;
    });

    return unsubscribe;
  }, [location.pathname]);

  // Global Toasts system
  useEffect(() => {
    const addToast = (toastTitle, toastMessage, type = 'success') => {
      const id = Date.now() + Math.random().toString();
      setToasts((prev) => [...prev, { id, title: toastTitle, message: toastMessage, type, closing: false }]);
      
      setTimeout(() => {
        startCloseToast(id);
      }, 4000);
    };

    window.showToast = addToast;
    window.showAdminToast = addToast;

    return () => {
      delete window.showToast;
      delete window.showAdminToast;
    };
  }, []);

  const startCloseToast = (id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const handleBellClick = () => {
    localStorage.setItem('cc_last_visit_time', new Date().toISOString());
    localStorage.setItem('cc_unread_count', '0');
    setUnreadCount(0);
    navigate('/admin/orders');
  };

  const adminEmail = currentUser?.email || 'admin@crazycloths.com';
  const adminInitial = adminEmail.charAt(0).toUpperCase();

  const isLinkActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`} id="admin-sidebar">
        <div className="admin-logo-area">
          <div className="admin-logo-text">CRAZY<span>CLOTHS</span></div>
          <span className="admin-badge">Admin</span>
        </div>

        <nav className="admin-nav-section">
          <div className="admin-nav-label">Core</div>
          <Link
            to="/admin"
            className={`admin-nav-item ${isLinkActive('/admin') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-nav-icon">🏠</span>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/orders"
            className={`admin-nav-item ${isLinkActive('/admin/orders') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-nav-icon">📦</span>
            <span>Orders</span>
          </Link>
          <Link
            to="/admin/products"
            className={`admin-nav-item ${isLinkActive('/admin/products') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-nav-icon">👕</span>
            <span>Products</span>
          </Link>
          <Link
            to="/admin/users"
            className={`admin-nav-item ${isLinkActive('/admin/users') ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="admin-nav-icon">👥</span>
            <span>Users</span>
          </Link>

          <div className="admin-nav-label">Session</div>
          <button
            className="admin-nav-item"
            onClick={handleLogout}
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <span className="admin-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar">
            {adminInitial}
          </div>
          <div className="admin-sidebar-info">
            <div className="admin-sidebar-name">{adminEmail}</div>
            <div className="admin-sidebar-role">Administrator</div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="admin-slide-panel-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{ zIndex: 140 }}
        ></div>
      )}

      {/* CONTENT WRAPPER */}
      <div className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ☰
            </button>
            <h2 className="admin-page-title">{title || 'Dashboard'}</h2>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-live-dot">LIVE</div>
            <div className="admin-clock">{timeStr}</div>

            <button
              className={`admin-notification-btn ${shakeBell ? 'shake' : ''}`}
              onClick={handleBellClick}
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className="admin-notification-badge">{unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="admin-content">{children}</div>
      </div>

      {/* TOAST CONTAINER */}
      <div className="admin-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-toast ${toast.type || 'success'} ${toast.closing ? 'slide-out' : ''}`}>
            <div className="admin-toast-msg">
              <strong style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{toast.title}</strong>
              <div style={{ fontSize: '0.72rem', marginTop: '2px', color: 'var(--a-text2)' }}>{toast.message}</div>
            </div>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--a-text3)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
              onClick={() => startCloseToast(toast.id)}
            >
              ×
            </button>
            <div className="admin-toast-progress"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
