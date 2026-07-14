import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

// ─── Helpers ───────────────────────────────────────────
function getCustomerTag(user) {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 86400000);
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  const regDate = user.createdAt
    ? (user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt))
    : null;

  const orderCount = user.ordersCount || 0;
  const spent = user.totalSpent || 0;
  const lastOrder = user.lastOrderDate;

  if (orderCount >= 5 || spent >= 5000) return 'VIP';
  if (spent >= 2000) return 'HIGH VALUE';
  if (orderCount >= 2) return 'REGULAR';
  if (lastOrder && lastOrder < thirtyDaysAgo && orderCount > 0) return 'INACTIVE';
  if (regDate && regDate >= sevenDaysAgo) return 'NEW';
  return 'REGULAR';
}

const TAG_STYLES = {
  VIP:        { color: '#FF1A1A', background: 'rgba(255,26,26,0.12)', border: '1px solid rgba(255,26,26,0.3)' },
  'HIGH VALUE': { color: '#FFD700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)' },
  REGULAR:    { color: '#00cc66', background: 'rgba(0,204,102,0.12)', border: '1px solid rgba(0,204,102,0.3)' },
  NEW:        { color: '#4488FF', background: 'rgba(68,136,255,0.12)', border: '1px solid rgba(68,136,255,0.3)' },
  INACTIVE:   { color: '#888', background: 'rgba(128,128,128,0.12)', border: '1px solid rgba(128,128,128,0.3)' },
};

function TagBadge({ tag }) {
  const style = TAG_STYLES[tag] || TAG_STYLES['REGULAR'];
  return (
    <span style={{
      ...style,
      display: 'inline-block', fontFamily: 'var(--a-font-mono)',
      fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: '2px', fontWeight: 700
    }}>
      {tag}
    </span>
  );
}

function Avatar({ name }) {
  const letter = (name || 'C').charAt(0).toUpperCase();
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
      background: 'var(--a-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--a-font-display)', fontSize: '1rem', color: '#fff', fontWeight: 700
    }}>
      {letter}
    </div>
  );
}

function LargeAvatar({ name }) {
  const letter = (name || 'C').charAt(0).toUpperCase();
  return (
    <div style={{
      width: '72px', height: '72px', borderRadius: '50%',
      background: 'var(--a-red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--a-font-display)', fontSize: '2rem', color: '#fff', fontWeight: 700,
      margin: '0 auto 16px'
    }}>
      {letter}
    </div>
  );
}

// ─── WhatsApp helpers ────────────────────────────────────
const BROADCAST_TEMPLATES = [
  { key: 'new_arrival', label: 'New Arrival', text: (name) => `Hey ${name}! New styles just dropped on Crazy Cloths 🔥 Check them out: crazy-clothes.vercel.app` },
  { key: 'sale', label: 'Sale Alert', text: (name) => `Hey ${name}! Our sale is live 🛒 Shop now before stock runs out: crazy-clothes.vercel.app` },
  { key: 'restock', label: 'Restock Alert', text: (name) => `Hey ${name}! The item you wanted is back in stock 👕 crazy-clothes.vercel.app` },
];

// ─── Main Component ──────────────────────────────────────
export default function AdminCustomers() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search / filter / sort
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [wishlistOnlyNoOrder, setWishlistOnlyNoOrder] = useState(false);

  // Customer detail modal
  const [detailModal, setDetailModal] = useState(null);
  const [detailWishlist, setDetailWishlist] = useState([]);
  const [detailOrders, setDetailOrders] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Broadcast modal
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSegment, setBroadcastSegment] = useState('ALL');
  const [broadcastTemplate, setBroadcastTemplate] = useState(0);
  const [broadcastCustomMsg, setBroadcastCustomMsg] = useState('');
  const [broadcastQueue, setBroadcastQueue] = useState(null); // { list, idx }

  // ── Load customers + orders ──────────────────────────────
  useEffect(() => {
    document.title = 'Crazy Cloths — Customer Intelligence';

    const loadData = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        const ordersList = [];
        ordersSnap.forEach((d) => ordersList.push({ id: d.id, ...d.data() }));

        const usersQuery = collection(db, 'users');
        const unsubscribe = onSnapshot(usersQuery, async (snap) => {
          const usersList = [];
          snap.forEach((d) => usersList.push({ id: d.id, ...d.data() }));

          const enriched = await Promise.all(usersList.map(async (user) => {
            const email = (user.email || '').toLowerCase().trim();
            const userOrders = ordersList.filter(
              (o) => (o.customerEmail || '').toLowerCase().trim() === email
            );

            const totalSpent = userOrders.reduce((s, o) => s + (parseFloat(o.total || o.price || 0) || 0), 0);
            const sortedOrders = [...userOrders].sort((a, b) =>
              new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            );
            const lastOrderDate = sortedOrders[0]?.createdAt ? new Date(sortedOrders[0].createdAt) : null;

            // Fetch wishlist count
            let wishlistCount = 0;
            try {
              const wSnap = await getDocs(collection(db, 'users', user.id, 'wishlist'));
              wishlistCount = wSnap.size;
            } catch (_) {}

            const enrichedUser = {
              ...user,
              ordersCount: userOrders.length,
              totalSpent,
              lastOrderDate,
              wishlistCount,
              userOrdersSorted: sortedOrders,
            };
            enrichedUser.tag = getCustomerTag(enrichedUser);
            return enrichedUser;
          }));

          setCustomers(enriched);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Failed to load customers:', err);
        setLoading(false);
      }
    };

    let unsub = null;
    loadData().then((u) => { unsub = u; });
    return () => { if (unsub) unsub(); };
  }, []);

  // ── Open customer detail modal ────────────────────────────
  const openDetail = async (customer) => {
    setDetailModal(customer);
    setDetailWishlist([]);
    setDetailOrders(customer.userOrdersSorted || []);
    setLoadingDetail(true);
    try {
      const wSnap = await getDocs(collection(db, 'users', customer.id, 'wishlist'));
      const wishIds = [];
      wSnap.forEach((d) => wishIds.push(d.id));

      const products = await Promise.all(
        wishIds.slice(0, 8).map(async (pid) => {
          try {
            const pSnap = await getDoc(doc(db, 'products', pid));
            return pSnap.exists() ? { id: pSnap.id, ...pSnap.data() } : null;
          } catch (_) { return null; }
        })
      );
      setDetailWishlist(products.filter(Boolean));
    } catch (_) {}
    setLoadingDetail(false);
  };

  // ── Filtering / sorting ───────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // Wishlist-but-no-order filter
    if (wishlistOnlyNoOrder) {
      list = list.filter((u) => (u.wishlistCount || 0) > 0 && (u.ordersCount || 0) === 0);
    }

    // Tag filter
    if (tagFilter !== 'ALL') {
      list = list.filter((u) => u.tag === tagFilter);
    }

    // Search
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let va, vb;
      if (sortKey === 'totalSpent') { va = a.totalSpent || 0; vb = b.totalSpent || 0; }
      else if (sortKey === 'ordersCount') { va = a.ordersCount || 0; vb = b.ordersCount || 0; }
      else if (sortKey === 'lastOrderDate') { va = a.lastOrderDate?.getTime() || 0; vb = b.lastOrderDate?.getTime() || 0; }
      else {
        const toMs = (u) => u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate().getTime() : new Date(u.createdAt).getTime()) : 0;
        va = toMs(a); vb = toMs(b);
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });

    return list;
  }, [customers, search, tagFilter, sortKey, sortDir, wishlistOnlyNoOrder]);

  // ── Broadcast helpers ─────────────────────────────────────
  const getBroadcastList = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const thirtyDaysAgo = new Date(now - 30 * 86400000);

    switch (broadcastSegment) {
      case 'NEW': return customers.filter((u) => {
        const d = u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
        return d && d >= sevenDaysAgo;
      });
      case 'INACTIVE': return customers.filter((u) =>
        u.lastOrderDate && u.lastOrderDate < thirtyDaysAgo
      );
      case 'HIGH VALUE': return customers.filter((u) => (u.totalSpent || 0) >= 2000);
      default: return customers.filter((u) => u.phone);
    }
  };

  const getMessageForCustomer = (customer) => {
    const firstName = (customer.name || 'there').split(' ')[0];
    if (broadcastTemplate < BROADCAST_TEMPLATES.length) {
      return BROADCAST_TEMPLATES[broadcastTemplate].text(firstName);
    }
    return (broadcastCustomMsg || 'Hey [name]! Check out Crazy Cloths!').replace('[name]', firstName);
  };

  const startBroadcast = () => {
    const list = getBroadcastList().filter((u) => u.phone);
    if (!list.length) { alert('No customers with phone numbers in this segment.'); return; }
    setBroadcastOpen(false);
    setBroadcastQueue({ list, idx: 0 });
  };

  const sendNextBroadcast = () => {
    if (!broadcastQueue) return;
    const { list, idx } = broadcastQueue;
    const customer = list[idx];
    const phone = (customer.phone || '').replace(/\D/g, '');
    if (phone) {
      const msg = getMessageForCustomer(customer);
      const formatted = phone.startsWith('91') ? phone : '91' + phone;
      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
    }
    if (idx + 1 >= list.length) {
      setBroadcastQueue(null);
    } else {
      setBroadcastQueue({ list, idx: idx + 1 });
    }
  };

  // ── KPI stats ─────────────────────────────────────────────
  const totalCustomers = customers.length;
  const newThisWeek = customers.filter((u) => {
    const d = u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
    return d && d >= new Date(Date.now() - 7 * 86400000);
  }).length;
  const vipCount = customers.filter((u) => u.tag === 'VIP').length;

  // ── Format helpers ────────────────────────────────────────
  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = d.toDate ? d.toDate() : new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <AdminLayout title="Customer Intelligence">
      {/* KPI Row */}
      <div className="admin-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header"><span className="admin-stat-label">Total Customers</span><span className="admin-stat-icon">👤</span></div>
          <div className="admin-stat-value">{totalCustomers}</div>
          <div className="admin-stat-trend neutral"><span>Registered</span></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header"><span className="admin-stat-label">New This Week</span><span className="admin-stat-icon">🆕</span></div>
          <div className="admin-stat-value">{newThisWeek}</div>
          <div className="admin-stat-trend positive"><span>Last 7 days</span></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header"><span className="admin-stat-label">VIP Customers</span><span className="admin-stat-icon">⭐</span></div>
          <div className="admin-stat-value">{vipCount}</div>
          <div className="admin-stat-trend neutral"><span>5+ orders or ₹5000+ spent</span></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-table-card" style={{ marginBottom: '20px', padding: '14px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          type="text"
          className="admin-form-input"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1', minWidth: '200px', padding: '8px 12px', height: 'auto', fontSize: '0.75rem' }}
        />

        {/* Tag filter */}
        <select className="admin-form-select" style={{ height: 'auto', padding: '8px 10px', fontSize: '0.72rem' }} value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="ALL">All Tags</option>
          {['NEW','REGULAR','HIGH VALUE','INACTIVE','VIP'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Sort */}
        <select className="admin-form-select" style={{ height: 'auto', padding: '8px 10px', fontSize: '0.72rem' }} value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="createdAt">Sort: Registration Date</option>
          <option value="ordersCount">Sort: Total Orders</option>
          <option value="totalSpent">Sort: Total Spent</option>
          <option value="lastOrderDate">Sort: Last Active</option>
        </select>
        <button
          className="admin-btn"
          style={{ padding: '8px 12px' }}
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
        >
          {sortDir === 'desc' ? '↓' : '↑'}
        </button>

        {/* Wishlist no order toggle */}
        <button
          className={`admin-btn ${wishlistOnlyNoOrder ? 'red' : ''}`}
          style={{ padding: '8px 12px', fontSize: '0.65rem', fontFamily: 'var(--a-font-mono)', textTransform: 'uppercase' }}
          onClick={() => setWishlistOnlyNoOrder((v) => !v)}
        >
          ♥ Wishlist, No Order
        </button>

        {/* Broadcast */}
        <button
          className="admin-btn red"
          style={{ padding: '8px 16px', marginLeft: 'auto' }}
          onClick={() => setBroadcastOpen(true)}
        >
          📢 Broadcast Message
        </button>
      </div>

      {/* Customers Table */}
      <div className="admin-table-card">
        <div className="admin-table-scroll">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem' }}>
              Loading customer intelligence…
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem' }}>
              No customers match the current filters.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Orders</th>
                  <th>Spent</th>
                  <th>Last Order</th>
                  <th>Tag</th>
                  <th>♥</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((u) => (
                  <tr key={u.id} onClick={() => openDetail(u)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar name={u.name} />
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{u.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${u.email}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--a-blue)', fontFamily: 'var(--a-font-mono)', fontSize: '0.68rem' }}>
                        {u.email || '—'}
                      </a>
                    </td>
                    <td>
                      {u.phone ? (
                        <a
                          href={`https://wa.me/91${u.phone.replace(/\D/g,'')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: '#25D366', fontFamily: 'var(--a-font-mono)', fontSize: '0.68rem' }}
                        >
                          📱 {u.phone}
                        </a>
                      ) : <span style={{ color: 'var(--a-text3)', fontSize: '0.68rem' }}>—</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.68rem', color: 'var(--a-text2)' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600, textAlign: 'center' }}>{u.ordersCount || 0}</td>
                    <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600, color: 'var(--a-text)' }}>{fmt(u.totalSpent || 0)}</td>
                    <td style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.68rem', color: 'var(--a-text2)' }}>
                      {u.lastOrderDate ? u.lastOrderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td><TagBadge tag={u.tag} /></td>
                    <td style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem', color: 'var(--a-red)' }}>
                      {u.wishlistCount > 0 ? `♥ ${u.wishlistCount}` : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button className="admin-btn" style={{ padding: '4px 8px', fontSize: '0.65rem' }} onClick={() => openDetail(u)}>👁</button>
                        {u.phone && (
                          <button
                            className="admin-btn"
                            style={{ padding: '4px 8px', fontSize: '0.65rem', color: '#25D366' }}
                            onClick={() => window.open(`https://wa.me/91${u.phone.replace(/\D/g,'')}`, '_blank')}
                          >💬</button>
                        )}
                        <button
                          className="admin-btn"
                          style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                          onClick={() => {
                            sessionStorage.setItem('admin_orders_filter_email', u.email);
                            navigate('/admin/orders');
                          }}
                        >📦</button>
                        {/* Nudge button for wishlist-but-no-order */}
                        {(u.wishlistCount || 0) > 0 && (u.ordersCount || 0) === 0 && u.phone && (
                          <button
                            className="admin-btn"
                            style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--a-yellow)' }}
                            onClick={() => {
                              const name = (u.name || 'there').split(' ')[0];
                              const msg = `Hey ${name}! 👋 You saved some items on Crazy Cloths but haven't ordered yet. Complete your order now while stock lasts 🔥 crazy-clothes.vercel.app`;
                              const phone = u.phone.replace(/\D/g, '');
                              const formatted = phone.startsWith('91') ? phone : '91' + phone;
                              window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                          >🎯 Nudge</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ──── CUSTOMER DETAIL MODAL ──── */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--a-surface)', border: '1px solid var(--a-border)', width: '100%', maxWidth: '900px', position: 'relative' }}>
            {/* Close */}
            <button
              onClick={() => { setDetailModal(null); setDetailWishlist([]); setDetailOrders([]); }}
              style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: 'var(--a-text2)', fontSize: '1.6rem', cursor: 'pointer', zIndex: 10 }}
            >×</button>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '400px' }}>
              {/* LEFT — Profile Card */}
              <div style={{ borderRight: '1px solid var(--a-border)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <LargeAvatar name={detailModal.name} />
                <h3 style={{ fontFamily: 'var(--a-font-display)', fontSize: '1.2rem', color: 'var(--a-text)', marginBottom: '4px' }}>{detailModal.name || 'Unknown'}</h3>
                <a href={`mailto:${detailModal.email}`} style={{ color: 'var(--a-blue)', fontFamily: 'var(--a-font-mono)', fontSize: '0.7rem', marginBottom: '8px' }}>{detailModal.email}</a>
                {detailModal.phone && (
                  <a href={`https://wa.me/91${detailModal.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', fontFamily: 'var(--a-font-mono)', fontSize: '0.7rem', marginBottom: '8px' }}>
                    📱 {detailModal.phone}
                  </a>
                )}
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--a-font-mono)', color: 'var(--a-text3)', marginBottom: '16px' }}>
                  Registered {fmtDate(detailModal.createdAt)}
                </div>
                <TagBadge tag={detailModal.tag} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '20px' }}>
                  {detailModal.phone && (
                    <button
                      className="admin-btn red"
                      style={{ width: '100%', padding: '8px' }}
                      onClick={() => window.open(`https://wa.me/91${detailModal.phone.replace(/\D/g,'')}`, '_blank')}
                    >
                      💬 Send WhatsApp
                    </button>
                  )}
                  <button
                    className="admin-btn"
                    style={{ width: '100%', padding: '8px' }}
                    onClick={() => {
                      sessionStorage.setItem('admin_orders_filter_email', detailModal.email);
                      navigate('/admin/orders');
                    }}
                  >
                    📦 View All Orders
                  </button>
                </div>
              </div>

              {/* RIGHT — Stats + Wishlist + Orders */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: '80vh' }}>
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                  {[
                    { label: 'Total Orders', val: detailModal.ordersCount || 0 },
                    { label: 'Total Spent', val: fmt(detailModal.totalSpent || 0) },
                    { label: 'Avg Order', val: detailModal.ordersCount > 0 ? fmt((detailModal.totalSpent || 0) / detailModal.ordersCount) : '—' },
                    { label: 'Last Order', val: detailModal.lastOrderDate ? detailModal.lastOrderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—' },
                    { label: 'Wishlist Items', val: detailModal.wishlistCount || 0 },
                    { label: 'Status', val: <TagBadge tag={detailModal.tag} /> },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: 'var(--a-surface2)', border: '1px solid var(--a-border)', padding: '12px' }}>
                      <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.58rem', textTransform: 'uppercase', color: 'var(--a-text3)', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                      <div style={{ fontFamily: 'var(--a-font-display)', fontSize: '1.1rem', color: 'var(--a-text)', fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Wishlist Section */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--a-text3)', marginBottom: '12px' }}>
                    Wishlisted Products
                  </div>
                  {loadingDetail ? (
                    <div style={{ color: 'var(--a-text3)', fontSize: '0.72rem', fontFamily: 'var(--a-font-mono)' }}>Loading…</div>
                  ) : detailWishlist.length === 0 ? (
                    <div style={{ color: 'var(--a-text3)', fontSize: '0.72rem', fontFamily: 'var(--a-font-mono)' }}>No wishlisted products.</div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {detailWishlist.map((p) => {
                        const imgSrc = p.imageUrl || (p.color === 'black' ? '/assets/images/black-t-shirt.png' : '/assets/images/white-t-shirt.png');
                        return (
                          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <img src={imgSrc} alt={p.name} style={{ width: '52px', height: '64px', objectFit: 'cover', border: '1px solid var(--a-border)' }} />
                            <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', maxWidth: '60px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Order History */}
                <div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--a-text3)', marginBottom: '12px' }}>
                    Order History ({detailOrders.length})
                  </div>
                  {detailOrders.length === 0 ? (
                    <div style={{ color: 'var(--a-text3)', fontSize: '0.72rem', fontFamily: 'var(--a-font-mono)' }}>No orders placed yet.</div>
                  ) : (
                    <table className="admin-table" style={{ fontSize: '0.7rem' }}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Product</th>
                          <th>Date</th>
                          <th>Price</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailOrders.map((o) => {
                          const oid = o.orderId || o.id?.slice(0, 8);
                          const dStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
                          const st = (o.status || 'Pending').toLowerCase();
                          return (
                            <tr
                              key={o.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                navigate('/admin/orders', { state: { highlightOrderId: o.id } });
                              }}
                            >
                              <td className="admin-order-id">#{oid}</td>
                              <td>{o.productName || 'T-Shirt'}</td>
                              <td style={{ fontFamily: 'var(--a-font-mono)', color: 'var(--a-text2)' }}>{dStr}</td>
                              <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600 }}>₹{o.price || o.total || '—'}</td>
                              <td><span className={`admin-status ${st}`}>{o.status || 'Pending'}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──── BROADCAST MODAL ──── */}
      {broadcastOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--a-surface)', border: '1px solid var(--a-border)', padding: '32px', maxWidth: '520px', width: '100%', position: 'relative' }}>
            <button onClick={() => setBroadcastOpen(false)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: 'var(--a-text2)', fontSize: '1.6rem', cursor: 'pointer' }}>×</button>

            <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--a-red)', letterSpacing: '0.1em', marginBottom: '8px' }}>WhatsApp Broadcast</div>
            <h3 style={{ fontFamily: 'var(--a-font-display)', fontSize: '1.2rem', color: 'var(--a-text)', marginBottom: '20px' }}>📢 Send to Segment</h3>

            {/* Segment */}
            <div className="admin-form-group">
              <label className="admin-form-label">Recipients</label>
              <select className="admin-form-select" value={broadcastSegment} onChange={(e) => setBroadcastSegment(e.target.value)}>
                <option value="ALL">All Customers</option>
                <option value="NEW">New (last 7 days)</option>
                <option value="INACTIVE">Inactive (no order 30 days)</option>
                <option value="HIGH VALUE">High Value (₹2000+)</option>
              </select>
            </div>

            {/* Template */}
            <div className="admin-form-group">
              <label className="admin-form-label">Message Template</label>
              <select className="admin-form-select" value={broadcastTemplate} onChange={(e) => setBroadcastTemplate(Number(e.target.value))}>
                {BROADCAST_TEMPLATES.map((t, i) => <option key={t.key} value={i}>{t.label}</option>)}
                <option value={BROADCAST_TEMPLATES.length}>Custom Message</option>
              </select>
            </div>

            {/* Custom message */}
            {broadcastTemplate >= BROADCAST_TEMPLATES.length && (
              <div className="admin-form-group">
                <label className="admin-form-label">Custom Message (use [name] as placeholder)</label>
                <textarea
                  className="admin-form-input"
                  rows={4}
                  value={broadcastCustomMsg}
                  onChange={(e) => setBroadcastCustomMsg(e.target.value)}
                  placeholder="Hey [name]! Check out our new collection..."
                  style={{ resize: 'vertical', fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem' }}
                />
              </div>
            )}

            {/* Preview */}
            <div style={{ background: 'var(--a-surface2)', border: '1px solid var(--a-border)', padding: '12px', marginBottom: '20px', fontSize: '0.72rem', fontFamily: 'var(--a-font-mono)', color: 'var(--a-text2)', whiteSpace: 'pre-wrap' }}>
              <div style={{ color: 'var(--a-text3)', fontSize: '0.58rem', textTransform: 'uppercase', marginBottom: '6px' }}>Preview (first customer)</div>
              {(() => {
                const sample = getBroadcastList()[0];
                if (!sample) return 'No customers in this segment.';
                return getMessageForCustomer(sample);
              })()}
            </div>

            <button
              className="admin-btn red"
              style={{ width: '100%', padding: '12px', fontSize: '0.8rem' }}
              onClick={startBroadcast}
            >
              SEND TO {getBroadcastList().filter((u) => u.phone).length} CUSTOMERS
            </button>
          </div>
        </div>
      )}

      {/* ──── BROADCAST FLOATING QUEUE BAR ──── */}
      {broadcastQueue && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--a-surface)', border: '1px solid var(--a-border)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 9999, minWidth: '320px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text3)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Broadcasting — {broadcastQueue.idx} / {broadcastQueue.list.length} sent
            </div>
            <div style={{ background: 'var(--a-border)', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((broadcastQueue.idx / broadcastQueue.list.length) * 100)}%`, height: '100%', background: 'var(--a-red)', transition: 'width 0.3s' }} />
            </div>
          </div>
          <button
            className="admin-btn red"
            style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
            onClick={sendNextBroadcast}
          >
            Next → {broadcastQueue.list[broadcastQueue.idx]?.name?.split(' ')[0] || 'Customer'}
          </button>
          <button
            className="admin-btn"
            style={{ padding: '8px 12px' }}
            onClick={() => setBroadcastQueue(null)}
          >
            Stop
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
