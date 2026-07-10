import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminOrders() {
  const location = useLocation();
  const { currentUser } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [rowDensity, setRowDensity] = useState('comfortable'); // 'comfortable' | 'compact'
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);

  const closeOrderModal = () => setModalOpen(false);

  // Load orders in real-time
  useEffect(() => {
    document.title = 'Crazy Cloths — Orders Management';

    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to admin orders:', err);
      }
    );

    return unsubscribe;
  }, []);

  // Handle deep-linking filters and highlights
  useEffect(() => {
    if (location.state && location.state.highlightOrderId && orders.length > 0) {
      const match = orders.find((o) => o.id === location.state.highlightOrderId);
      if (match) {
        setActiveOrder(match);
        setModalOpen(true);
      }
    }

    const filterEmail = sessionStorage.getItem('admin_orders_filter_email');
    if (filterEmail) {
      sessionStorage.removeItem('admin_orders_filter_email');
      setSearch(filterEmail);
    }
  }, [location.state, orders]);

  // Sync active order if it is updated in the real-time list
  useEffect(() => {
    if (activeOrder && orders.length > 0) {
      const updated = orders.find((o) => o.id === activeOrder.id);
      if (updated) {
        setActiveOrder(updated);
      }
    }
  }, [orders, activeOrder]);

  const logAdminAction = async (action, targetId, targetLabel) => {
    try {
      const email = currentUser?.email || 'admin@crazycloths.com';
      const name = currentUser?.displayName || email.split('@')[0];

      await addDoc(collection(db, 'activityLog'), {
        adminEmail: email,
        adminName: name,
        action,
        targetType: 'orders',
        targetId: targetId || '',
        targetLabel: targetLabel || '',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Activity logging failed:', err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const o = orders.find((order) => order.id === orderId);
      const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : orderId;

      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        [`statusTimes.${newStatus}`]: new Date().toISOString()
      });

      await logAdminAction('updated order status', orderId, `#CC-${orderIdStr} to ${newStatus}`);

      // Automated WhatsApp notifications
      if (o && o.customerPhone) {
        let text = '';
        if (newStatus === 'Confirmed') {
          text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} has been confirmed. We're preparing it for dispatch. 📦`;
        } else if (newStatus === 'Dispatched') {
          text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} is on its way! Expected delivery in 3-5 days. 🚚`;
        } else if (newStatus === 'Delivered') {
          text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} has been delivered. We hope you love it! Leave us a review on the app. ⭐`;
        }

        if (text) {
          const cleanPhone = o.customerPhone.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
        }
      }

      window.showAdminToast(
        'Status Updated',
        `Order #CC-${orderIdStr} marked as ${newStatus}`
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const o = orders.find((order) => order.id === orderId);
    const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : orderId;

    if (!confirm(`Are you sure you want to delete order #CC-${orderIdStr}? This action is permanent.`)) return;

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      await logAdminAction('deleted order', orderId, `#CC-${orderIdStr}`);
      window.showAdminToast('Order Deleted', `Order #CC-${orderIdStr} was permanently deleted.`, 'error');
      if (activeOrder && activeOrder.id === orderId) {
        setModalOpen(false);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed: ' + err.message);
    }
  };

  // Bulk actions
  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedIds.size === 0) return;
    const promises = Array.from(selectedIds).map(async (id) => {
      const o = orders.find((order) => order.id === id);
      const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;

      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        [`statusTimes.${newStatus}`]: new Date().toISOString()
      });
      await logAdminAction('updated order status', id, `#CC-${orderIdStr} to ${newStatus}`);
    });

    try {
      await Promise.all(promises);
      window.showAdminToast('Bulk Update Success', `Updated ${selectedIds.size} orders to status: ${newStatus}`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk update failed:', err);
      alert('Bulk update failed: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to permanently delete the ${selectedIds.size} selected orders?`)) return;

    const promises = Array.from(selectedIds).map(async (id) => {
      const o = orders.find((order) => order.id === id);
      const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;

      await deleteDoc(doc(db, 'orders', id));
      await logAdminAction('deleted order', id, `#CC-${orderIdStr}`);
    });

    try {
      await Promise.all(promises);
      window.showAdminToast('Bulk Delete Success', `Successfully removed ${promises.length} orders.`, 'error');
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Bulk delete failed: ' + err.message);
    }
  };

  const handleExportCSV = (itemsToExport) => {
    const headers = [
      'Order ID', 'Customer Name', 'Phone', 'Email',
      'Address', 'Product', 'Color', 'Design URL',
      'Price', 'Date', 'Status'
    ];
    const rows = itemsToExport.map((o) => [
      o.orderId || o.id, o.customerName || 'N/A', o.customerPhone || 'N/A', o.customerEmail || 'N/A',
      o.customerAddress || 'N/A', o.productName || 'N/A', o.color || 'N/A',
      o.cloudinaryUrl || 'No design',
      o.price || 499, o.createdAt || 'N/A', o.status || 'Pending'
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crazy-cloths-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Row selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = new Set(filteredOrders.map((o) => o.id));
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Sorting helper
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter orders local list
  const filteredOrders = orders.filter((o) => {
    const orderIdStr = `#CC-${o.orderId || o.id.slice(0, 8)}`.toLowerCase();
    const customerName = (o.customerName || '').toLowerCase();
    const queryStr = search.toLowerCase();

    const matchesSearch =
      orderIdStr.includes(queryStr) ||
      customerName.includes(queryStr) ||
      (o.customerPhone && o.customerPhone.includes(queryStr));

    const matchesStatus =
      statusFilter === 'all' || (o.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();

    let matchesDate = true;
    if (o.createdAt) {
      const oDate = o.createdAt.split('T')[0];
      if (dateFrom && oDate < dateFrom) matchesDate = false;
      if (dateTo && oDate > dateTo) matchesDate = false;
    } else if (dateFrom || dateTo) {
      matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort orders list
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (sortColumn === 'id') {
      valA = a.orderId || a.id;
      valB = b.orderId || b.id;
    }

    if (valA === undefined || valA === null) valA = '';
    if (valB === undefined || valB === null) valB = '';

    if (typeof valA === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }
  });

  return (
    <AdminLayout title="Orders Management">
      {/* FILTERS BAR */}
      <div className="admin-table-card" style={{ marginBottom: '28px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="admin-search-input"
              style={{ maxWidth: '300px' }}
              placeholder="Search Order ID, Name, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text2)', textTransform: 'uppercase' }}>From:</span>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '130px', padding: '6px 10px', fontSize: '0.7rem' }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text2)', textTransform: 'uppercase' }}>To:</span>
              <input
                type="date"
                className="admin-search-input"
                style={{ width: '130px', padding: '6px 10px', fontSize: '0.7rem' }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Row Density Toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--a-border)', borderRadius: '2px', overflow: 'hidden' }}>
              <button
                className={`admin-btn ${rowDensity === 'comfortable' ? 'red' : ''}`}
                style={{ border: 'none', padding: '6px 12px' }}
                onClick={() => setRowDensity('comfortable')}
              >
                Comfort
              </button>
              <button
                className={`admin-btn ${rowDensity === 'compact' ? 'red' : ''}`}
                style={{ border: 'none', padding: '6px 12px' }}
                onClick={() => setRowDensity('compact')}
              >
                Compact
              </button>
            </div>

            <button
              className="admin-btn"
              onClick={() => handleExportCSV(filteredOrders)}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ORDERS TABLE CARD */}
      <div className="admin-table-card">
        <div className="admin-table-scroll">
          <table
            className="admin-table"
            style={{ fontSize: rowDensity === 'compact' ? '0.75rem' : '0.82rem' }}
          >
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      filteredOrders.every((o) => selectedIds.has(o.id))
                    }
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  Order ID {sortColumn === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('customerName')}>
                  Customer Name {sortColumn === 'customerName' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th>Phone</th>
                <th>Product</th>
                <th>Design</th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('price')}>
                  Price {sortColumn === 'price' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                  Order Date {sortColumn === 'createdAt' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status {sortColumn === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>
                    Loading orders database...
                  </td>
                </tr>
              ) : sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: 'var(--a-text3)', padding: '24px' }}>
                    No orders matching filters.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o, idx) => {
                  const orderIdDisplay = o.orderId || o.id.slice(0, 8);
                  const dateFormatted = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString()
                    : 'N/A';
                  const statusVal = o.status || 'Pending';

                  return (
                    <tr
                      key={o.id}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={(e) => handleSelectOne(o.id, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td
                        className="admin-order-id"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setActiveOrder(o);
                          setModalOpen(true);
                        }}
                      >
                        #CC-{orderIdDisplay}
                      </td>
                      <td
                        style={{ fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => {
                          setActiveOrder(o);
                          setModalOpen(true);
                        }}
                      >
                        {o.customerName || 'Anonymous'}
                      </td>
                      <td style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem' }}>{o.customerPhone || 'N/A'}</td>
                      <td>
                        {o.productName || 'Custom Fit'}
                      </td>
                      <td>
                        {o.cloudinaryUrl ? (
                          <img
                            src={o.cloudinaryUrl}
                            alt="Design"
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'cover',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              border: '1px solid var(--a-border)'
                            }}
                            onClick={() => {
                              setActiveOrder(o);
                              setModalOpen(true);
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--a-text3)', fontFamily: 'var(--a-font-mono)', textTransform: 'uppercase' }}>
                            No design
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600 }}>
                        ₹{o.price || 499}
                      </td>
                      <td style={{ fontFamily: 'var(--a-font-mono)', color: 'var(--a-text2)' }}>{dateFormatted}</td>
                      <td>
                        <span className={`admin-status ${statusVal.toLowerCase()}`}>
                          {statusVal}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="admin-btn"
                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                            title="View Details"
                            onClick={() => {
                              setActiveOrder(o);
                              setModalOpen(true);
                            }}
                          >
                            👁️
                          </button>
                          {statusVal === 'Pending' && (
                            <button
                              className="admin-btn red"
                              style={{ padding: '4px 8px', minWidth: 'auto' }}
                              title="Confirm Order"
                              onClick={() => handleUpdateStatus(o.id, 'Confirmed')}
                            >
                              ✓
                            </button>
                          )}
                          {statusVal === 'Confirmed' && (
                            <button
                              className="admin-btn red"
                              style={{ padding: '4px 8px', minWidth: 'auto' }}
                              title="Dispatch Order"
                              onClick={() => handleUpdateStatus(o.id, 'Dispatched')}
                            >
                              🚚
                            </button>
                          )}
                          <button
                            className="admin-btn danger"
                            style={{ padding: '4px 8px', minWidth: 'auto' }}
                            title="Delete Order"
                            onClick={() => handleDeleteOrder(o.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: 'var(--a-bg2)',
            border: '1px solid var(--a-red)',
            boxShadow: '0 8px 32px rgba(255, 26, 26, 0.2)',
            animation: 'panelSlideIn 0.3s ease-out',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--a-text)' }}>
            <strong>{selectedIds.size}</strong> orders selected
          </span>
          <div style={{ width: '1px', height: '20px', background: 'var(--a-border)' }}></div>
          <button
            className="admin-btn"
            onClick={() => handleBulkUpdateStatus('Confirmed')}
          >
            Confirm Selected
          </button>
          <button
            className="admin-btn"
            onClick={() => handleBulkUpdateStatus('Dispatched')}
          >
            Dispatch Selected
          </button>
          <button
            className="admin-btn red"
            onClick={() =>
              handleExportCSV(orders.filter((o) => selectedIds.has(o.id)))
            }
          >
            Export Selected CSV
          </button>
          <button className="admin-btn danger" onClick={handleBulkDelete}>
            Delete Selected
          </button>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {modalOpen && activeOrder && (
        <div
          className="admin-modal-backdrop"
          onClick={closeOrderModal}
        >
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Order Details — #CC-{activeOrder.orderId || activeOrder.id.slice(0, 8)}
              </h3>
              <button className="admin-panel-close" onClick={closeOrderModal}>
                &times;
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Timeline in Details Modal */}
              <div className="order-timeline">
                <div
                  className={`order-timeline-step ${
                    ['Pending', 'Confirmed', 'Dispatched', 'Delivered'].includes(
                      activeOrder.status || 'Pending'
                    )
                      ? 'done'
                      : ''
                  }`}
                >
                  <div className="order-timeline-dot">1</div>
                  <div className="order-timeline-label">Placed</div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', marginTop: '4px' }}>
                    {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <div
                  className={`order-timeline-step ${
                    ['Confirmed', 'Dispatched', 'Delivered'].includes(
                      activeOrder.status || 'Pending'
                    )
                      ? 'done'
                      : ''
                  } ${activeOrder.status === 'Confirmed' ? 'current' : ''}`}
                >
                  <div className="order-timeline-dot">2</div>
                  <div className="order-timeline-label">Confirmed</div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', marginTop: '4px' }}>
                    {activeOrder.statusTimes && activeOrder.statusTimes.Confirmed
                      ? new Date(activeOrder.statusTimes.Confirmed).toLocaleDateString()
                      : ''}
                  </div>
                </div>
                <div
                  className={`order-timeline-step ${
                    ['Dispatched', 'Delivered'].includes(activeOrder.status || 'Pending')
                      ? 'done'
                      : ''
                  } ${activeOrder.status === 'Dispatched' ? 'current' : ''}`}
                >
                  <div className="order-timeline-dot">3</div>
                  <div className="order-timeline-label">Dispatched</div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', marginTop: '4px' }}>
                    {activeOrder.statusTimes && activeOrder.statusTimes.Dispatched
                      ? new Date(activeOrder.statusTimes.Dispatched).toLocaleDateString()
                      : ''}
                  </div>
                </div>
                <div
                  className={`order-timeline-step ${
                    (activeOrder.status || 'Pending') === 'Delivered' ? 'done' : ''
                  } ${activeOrder.status === 'Delivered' ? 'current' : ''}`}
                >
                  <div className="order-timeline-dot">4</div>
                  <div className="order-timeline-label">Delivered</div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.55rem', color: 'var(--a-text3)', marginTop: '4px' }}>
                    {activeOrder.statusTimes && activeOrder.statusTimes.Delivered
                      ? new Date(activeOrder.statusTimes.Delivered).toLocaleDateString()
                      : ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                <div>
                  <h4 className="admin-form-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--a-border)', paddingBottom: '6px' }}>
                    Customer Info
                  </h4>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Name:</strong> {activeOrder.customerName || 'N/A'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Email:</strong> {activeOrder.customerEmail || 'N/A'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Phone:</strong> {activeOrder.customerPhone || 'N/A'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Address:</strong> {activeOrder.customerAddress || 'N/A'}
                  </p>
                </div>

                <div>
                  <h4 className="admin-form-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--a-border)', paddingBottom: '6px' }}>
                    Product Details
                  </h4>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Product:</strong> {activeOrder.productName || 'Custom T-Shirt'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Color:</strong> {activeOrder.color || 'N/A'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Size:</strong> {activeOrder.size || 'N/A'}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Quantity:</strong> {activeOrder.quantity || 1}
                  </p>
                  <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--a-text2)' }}>Total:</strong> ₹{activeOrder.price || 499}
                  </p>
                  {activeOrder.specialInstructions && (
                    <p style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--a-text2)' }}>Notes:</strong> {activeOrder.specialInstructions}
                    </p>
                  )}
                </div>
              </div>

              {activeOrder.cloudinaryUrl && (
                <div style={{ marginTop: '24px' }}>
                  <h4 className="admin-form-label" style={{ marginBottom: '12px', borderBottom: '1px solid var(--a-border)', paddingBottom: '6px' }}>
                    Custom Design Graphic
                  </h4>
                  <a href={activeOrder.cloudinaryUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={activeOrder.cloudinaryUrl}
                      alt="Custom Design"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '220px',
                        border: '1px solid var(--a-border)',
                        marginTop: '8px',
                        objectFit: 'contain',
                        background: 'var(--a-bg)'
                      }}
                    />
                  </a>
                </div>
              )}

              <div
                style={{
                  marginTop: '32px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--a-border)',
                  paddingTop: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="admin-form-label" style={{ margin: 0 }}>
                    Change Status:
                  </span>
                  <select
                    className="admin-form-select"
                    style={{ minWidth: '140px', padding: '6px 12px' }}
                    value={activeOrder.status || 'Pending'}
                    onChange={(e) => handleUpdateStatus(activeOrder.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
                <button className="admin-btn" onClick={closeOrderModal}>
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
