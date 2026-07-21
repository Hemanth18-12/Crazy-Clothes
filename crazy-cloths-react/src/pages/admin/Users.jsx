import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, getDocs, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Sorting
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    document.title = 'Crazy Cloths — Registered Users';

    const loadData = async () => {
      try {
        // 1. Fetch all orders once
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersList = [];
        ordersSnapshot.forEach((doc) => {
          ordersList.push({ id: doc.id, ...doc.data() });
        });

        // 2. Real-time listen to users
        const usersQuery = query(collection(db, 'users'));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
          const usersList = [];
          snapshot.forEach((doc) => {
            usersList.push({ id: doc.id, ...doc.data() });
          });

          // Enrich user objects with stats computed from orders snapshot
          const enrichedUsers = usersList.map((user) => {
            const email = (user.email || '').toLowerCase().trim();
            const userOrders = ordersList.filter(
              (o) => (o.customerEmail || '').toLowerCase().trim() === email
            );

            // Compute spent
            const totalSpent = userOrders.reduce((sum, o) => {
              const priceVal = parseFloat(o.total || o.price || 0);
              return sum + (isNaN(priceVal) ? 0 : priceVal);
            }, 0);

            // Sort user orders by date descending
            const sortedUserOrders = [...userOrders].sort((a, b) => {
              const dA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dB - dA;
            });

            const lastOrderDate = sortedUserOrders[0]?.createdAt
              ? new Date(sortedUserOrders[0].createdAt)
              : null;

            return {
              ...user,
              ordersCount: userOrders.length,
              totalSpent,
              lastOrderDate,
              userOrdersSorted: sortedUserOrders
            };
          });

          setUsers(enrichedUsers);
          setLoading(false);
        });

        return unsubscribeUsers;
      } catch (err) {
        console.error('Failed to load users and orders:', err);
        setLoading(false);
      }
    };

    let unsubscribe = null;
    loadData().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logAdminAction = async (action, targetId, targetLabel) => {
    try {
      const email = currentUser?.email || 'admin@crazycloths.com';
      const name = currentUser?.displayName || email.split('@')[0];

      await addDoc(collection(db, 'activityLog'), {
        adminEmail: email,
        adminName: name,
        action,
        targetType: 'users',
        targetId: targetId || '',
        targetLabel: targetLabel || '',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Activity logging failed:', err);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Delete the user profile for "${userName}" from Firestore?`)) return;
    if (!confirm(`WARNING: This removes the Firestore record only — the Firebase Auth account must be deleted manually in the Firebase Console. Proceed?`)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      await logAdminAction('deleted user profile', userId, `"${userName}"`);

      window.showAdminToast('User Deleted', `"${userName}" has been removed from Firestore.`, 'error');
      if (expandedUserId === userId) {
        setExpandedUserId(null);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleViewOrders = (email) => {
    sessionStorage.setItem('admin_orders_filter_email', email);
    navigate('/admin/orders');
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc'); // Default new column -> desc
    }
  };

  const toggleAccordion = (userId) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  // Stats computation
  const totalUsers = users.length;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsersWeek = users.filter((u) => {
    if (!u.createdAt) return false;
    const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    return d >= sevenDaysAgo;
  }).length;

  const usersSortedByOrders = [...users].sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
  const topUser = usersSortedByOrders[0];
  const mostActiveUserLabel =
    topUser && topUser.ordersCount > 0
      ? `${topUser.name || 'Anonymous'} (${topUser.ordersCount} orders)`
      : 'None';

  // Filter list
  const filteredUsers = users.filter((u) => {
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    const queryStr = search.toLowerCase().trim();

    return name.includes(queryStr) || email.includes(queryStr) || phone.includes(queryStr);
  });

  // Sort list
  const sortedUsersList = [...filteredUsers].sort((a, b) => {
    let valA, valB;
    if (sortKey === 'ordersCount') {
      valA = a.ordersCount || 0;
      valB = b.ordersCount || 0;
    } else if (sortKey === 'totalSpent') {
      valA = a.totalSpent || 0;
      valB = b.totalSpent || 0;
    } else {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <AdminLayout title="Registered Users">
      {/* STATS ROW */}
      <div className="admin-stats-row">
        {/* Stat 1: Total Users */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Users</span>
            <span className="admin-stat-icon">👥</span>
          </div>
          <div className="admin-stat-value">{totalUsers}</div>
        </div>

        {/* Stat 2: New Users This Week */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">New Users This Week</span>
            <span className="admin-stat-icon">🗓️</span>
          </div>
          <div className="admin-stat-value">{newUsersWeek}</div>
        </div>

        {/* Stat 3: Most Active User */}
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Most Active User</span>
            <span className="admin-stat-icon">🔥</span>
          </div>
          <div
            className="admin-stat-value"
            style={{
              fontSize: '1.2rem',
              fontFamily: 'var(--a-font-body)',
              lineHeight: 1.5,
              paddingTop: '16px',
              letterSpacing: 'normal',
              textTransform: 'none'
            }}
          >
            {mostActiveUserLabel}
          </div>
        </div>
      </div>

      {/* SEARCH BAR CARD */}
      <div className="admin-table-card" style={{ marginBottom: '28px', padding: '16px 20px' }}>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search by name, email, or phone in real-time..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* USERS TABLE CARD */}
      <div className="admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-table" id="users-admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Avatar</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Full Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('ordersCount')}>
                  Orders {sortKey === 'ordersCount' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('totalSpent')}>
                  Total Spent {sortKey === 'totalSpent' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th>Last Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>
                    Loading users registry…
                  </td>
                </tr>
              ) : sortedUsersList.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--a-text3)', padding: '24px' }}>
                    No users matching filters found.
                  </td>
                </tr>
              ) : (
                sortedUsersList.map((user) => {
                  const isExpanded = expandedUserId === user.id;
                  const firstLetter = (user.name || 'U').charAt(0).toUpperCase();
                  const regDate = user.createdAt
                    ? user.createdAt.toDate
                      ? user.createdAt.toDate().toLocaleDateString()
                      : new Date(user.createdAt).toLocaleDateString()
                    : 'N/A';
                  const lastOrderStr = user.lastOrderDate
                    ? user.lastOrderDate.toLocaleDateString()
                    : 'Never';

                  return (
                    <React.Fragment key={user.id}>
                      <tr>
                        <td>
                          <div className="admin-avatar">
                            {firstLetter}
                          </div>
                        </td>
                        <td
                          style={{ fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleAccordion(user.id)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.6rem',
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                color: 'var(--a-red)'
                              }}
                            >
                              ▶
                            </span>
                            {user.name || 'N/A'}
                          </span>
                        </td>
                        <td className="admin-table-mono" style={{ fontSize: '0.75rem' }}>{user.email || 'N/A'}</td>
                        <td className="admin-table-mono" style={{ fontSize: '0.75rem' }}>{user.phone || 'N/A'}</td>
                        <td className="admin-table-mono" style={{ fontSize: '0.75rem' }}>{regDate}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-status ${user.ordersCount > 0 ? 'confirmed' : 'pending'}`}>
                            {user.ordersCount}
                          </span>
                        </td>
                        <td
                          className="admin-table-mono"
                          style={{
                            fontWeight: 600,
                            color: user.totalSpent > 0 ? 'var(--a-green)' : 'var(--a-text3)'
                          }}
                        >
                          ₹{(user.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="admin-table-mono" style={{ fontSize: '0.75rem' }}>{lastOrderStr}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="admin-btn"
                              style={{ padding: '4px 10px' }}
                              onClick={() => handleViewOrders(user.email)}
                            >
                              Orders
                            </button>
                            <button
                              className="admin-btn danger"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleDeleteUser(user.id, user.name || 'User')}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Row */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan="9"
                            style={{
                              padding: 0,
                              background: 'var(--a-bg2)'
                            }}
                          >
                              <div
                                style={{
                                  padding: '16px 24px',
                                  borderLeft: '3px solid var(--a-red)',
                                  background: 'var(--a-surface)'
                                }}
                              >
                                {/* User Details Card */}
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: '16px',
                                  background: 'var(--a-surface2)',
                                  border: '1px solid var(--a-border)',
                                  padding: '16px',
                                  borderRadius: '4px',
                                  marginBottom: '20px'
                                }}>
                                  <div>
                                    <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Info</div>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem' }}><strong>Email:</strong> {user.email || 'N/A'}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem' }}>
                                      <strong>Phone:</strong>{' '}
                                      {user.phone ? (
                                        <a href={`https://wa.me/91${user.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>
                                          📱 {user.phone}
                                        </a>
                                      ) : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text3)', textTransform: 'uppercase', marginBottom: '6px' }}>Saved Delivery Address</div>
                                    {user.address && (user.address.houseNo || user.address.city) ? (
                                      <p style={{ margin: 0, fontSize: '0.78rem', fontFamily: 'var(--a-font-mono)', lineHeight: '1.4' }}>
                                        {[user.address.houseNo, user.address.street, user.address.village].filter(Boolean).join(', ')}<br/>
                                        {[user.address.city, user.address.state, user.address.pincode].filter(Boolean).join(', ')}
                                        {user.address.landmark && <><br/><span style={{ color: 'var(--a-text3)', fontSize: '0.72rem' }}>Near: {user.address.landmark}</span></>}
                                      </p>
                                    ) : (
                                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--a-text3)', fontStyle: 'italic' }}>No address saved.</p>
                                    )}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px'
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      color: 'var(--a-text)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                      fontFamily: 'var(--a-font-mono)'
                                    }}
                                  >
                                    Order History — {user.name || user.email || 'User'}
                                  </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--a-text2)' }}>
                                  {user.ordersCount} order{user.ordersCount !== 1 ? 's' : ''} · Total:{' '}
                                  <strong style={{ color: 'var(--a-green)' }}>
                                    ₹
                                    {(user.totalSpent || 0).toLocaleString('en-IN', {
                                      maximumFractionDigits: 0
                                    })}
                                  </strong>
                                </span>
                              </div>

                              {user.userOrdersSorted?.length === 0 ? (
                                <p style={{ color: 'var(--a-text3)', fontSize: '0.8rem', margin: 0, fontFamily: 'var(--a-font-mono)' }}>
                                  No orders found for this user.
                                </p>
                              ) : (
                                <table className="admin-table">
                                  <thead>
                                    <tr>
                                      <th>Order ID</th>
                                      <th>Date</th>
                                      <th>Items</th>
                                      <th>Amount</th>
                                      <th>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {user.userOrdersSorted.map((o) => {
                                      const orderIdDisplay = o.orderId || o.id.slice(0, 8);
                                      const date = o.createdAt
                                        ? new Date(o.createdAt).toLocaleDateString()
                                        : 'Unknown';
                                      const amount = parseFloat(o.total || o.price || 0);
                                      const status = o.status || 'Pending';

                                      return (
                                        <tr key={o.id}>
                                          <td className="admin-order-id">
                                            #CC-{orderIdDisplay}
                                          </td>
                                          <td style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem' }}>
                                            {date}
                                          </td>
                                          <td>
                                            {o.productName || '—'}
                                          </td>
                                          <td
                                            style={{
                                              fontWeight: 700,
                                              color: 'var(--a-green)',
                                              fontFamily: 'var(--a-font-mono)'
                                            }}
                                          >
                                            ₹{amount.toLocaleString('en-IN')}
                                          </td>
                                          <td>
                                            <span className={`admin-status ${status.toLowerCase()}`}>
                                              {status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
