/**
 * Crazy Cloths — Admin Orders & Notifications Logic
 */

// Global orders array to hold filtered results
let allOrdersData = [];

document.addEventListener('DOMContentLoaded', () => {
  // Common Topbar Clock
  initClock();

  // Initialize notifications on all pages
  initRealtimeNotifications();

  // Route-specific logic
  const page = document.body.dataset.page;
  if (page === 'orders') {
    initOrdersPage();
  }
});

// ────────────────────────────────────────────────────────────
//  CLOCK
// ────────────────────────────────────────────────────────────
function initClock() {
  const clockEl = document.getElementById('topbar-clock');
  if (!clockEl) return;
  const updateClock = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
  };
  updateClock();
  setInterval(updateClock, 1000);
}

// ────────────────────────────────────────────────────────────
//  REAL-TIME NOTIFICATIONS SYSTEM
// ────────────────────────────────────────────────────────────
function initRealtimeNotifications() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();
  const bell = document.getElementById('topbar-bell');
  const badge = document.getElementById('topbar-bell-badge');

  // Load last visit time
  let lastVisitTime = localStorage.getItem('cc_last_visit_time');
  if (!lastVisitTime) {
    lastVisitTime = new Date().toISOString();
    localStorage.setItem('cc_last_visit_time', lastVisitTime);
  }

  // Active unread count
  let unreadCount = parseInt(localStorage.getItem('cc_unread_count') || '0');
  updateBellBadge(unreadCount);

  // Update last visit time & clear count on bell click or when visiting orders.html
  if (bell) {
    bell.addEventListener('click', () => {
      clearUnreadNotifications();
    });
  }

  if (document.body.dataset.page === 'orders') {
    clearUnreadNotifications();
  }

  function clearUnreadNotifications() {
    localStorage.setItem('cc_last_visit_time', new Date().toISOString());
    localStorage.setItem('cc_unread_count', '0');
    updateBellBadge(0);
  }

  function updateBellBadge(count) {
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Listen to orders
  db.collection('orders').onSnapshot(snapshot => {
    // Skip the first snapshot triggers which are historical on first page load
    let isInitial = true;
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const order = change.doc.data();
        const orderIdStr = order.orderId || change.doc.id;
        const createdAt = order.createdAt;

        // If this order is newer than last visit time
        if (createdAt && createdAt > lastVisitTime) {
          // Increment count
          unreadCount++;
          localStorage.setItem('cc_unread_count', unreadCount.toString());
          updateBellBadge(unreadCount);

          // Shake bell
          if (bell) {
            bell.classList.add('shake');
            setTimeout(() => bell.classList.remove('shake'), 600);
          }

          // Show Toast
          showToast(`New Order!`, `#CC-${orderIdStr} from ${order.customerName || 'Customer'}`);

          // Flash Title
          flashBrowserTitle();
        }
      }
    });
    isInitial = false;
  });
}

// ────────────────────────────────────────────────────────────
//  TOAST & TITLE FLASH HELPERS
// ────────────────────────────────────────────────────────────
function showToast(title, message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.innerHTML = `
    <div class="admin-toast-body">
      <div class="admin-toast-title">${title}</div>
      <div class="admin-toast-message">${message}</div>
    </div>
    <button class="admin-toast-close">×</button>
  `;

  // Navigate to orders on click (except the close button)
  toast.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-toast-close')) {
      e.stopPropagation();
      dismissToast(toast);
    } else {
      window.location.href = 'orders.html';
    }
  });

  container.appendChild(toast);

  // Auto dismiss after 4 seconds
  const autoClose = setTimeout(() => {
    dismissToast(toast);
  }, 4000);

  function dismissToast(el) {
    clearTimeout(autoClose);
    el.classList.add('slide-out');
    setTimeout(() => el.remove(), 400);
  }
}

let titleFlashInterval = null;
function flashBrowserTitle() {
  if (titleFlashInterval) clearInterval(titleFlashInterval);
  const originalTitle = document.title;
  let flash = true;
  titleFlashInterval = setInterval(() => {
    document.title = flash ? "🔴 New Order! — Crazy Cloths" : originalTitle;
    flash = !flash;
  }, 1000);

  // Stop flashing when user focuses window
  window.addEventListener('focus', () => {
    clearInterval(titleFlashInterval);
    document.title = originalTitle;
  }, { once: true });
}

// ────────────────────────────────────────────────────────────
//  ORDERS PAGE LOGIC
// ────────────────────────────────────────────────────────────
async function initOrdersPage() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading orders...</td></tr>';

  // Listen to firestore snapshot
  db.collection('orders')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      allOrdersData = [];
      tableBody.innerHTML = '';

      if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No orders found.</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        allOrdersData.push({ id: doc.id, ...data });
      });

      renderOrders(allOrdersData);
    }, err => {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--admin-accent);">Failed to load orders.</td></tr>';
    });

  // Wire up filter controls
  const searchInput = document.getElementById('order-search');
  const statusFilter = document.getElementById('order-status-filter');
  const dateFrom = document.getElementById('order-date-from');
  const dateTo = document.getElementById('order-date-to');
  const exportBtn = document.getElementById('export-csv-btn');

  const applyFilters = () => {
    const q = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;
    const fromVal = dateFrom.value;
    const toVal = dateTo.value;

    const filtered = allOrdersData.filter(o => {
      // 1. Search ID or customer name
      const idMatch = (o.orderId || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      const nameMatch = (o.customerName || '').toLowerCase().includes(q);
      if (q && !idMatch && !nameMatch) return false;

      // 2. Status Match
      const currentStatus = o.status || 'Pending';
      if (status !== 'all' && currentStatus.toLowerCase() !== status.toLowerCase()) return false;

      // 3. Date range match
      if (o.createdAt) {
        const orderDate = o.createdAt.split('T')[0];
        if (fromVal && orderDate < fromVal) return false;
        if (toVal && orderDate > toVal) return false;
      }

      return true;
    });

    renderOrders(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFrom.addEventListener('change', applyFilters);
  dateTo.addEventListener('change', applyFilters);

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      // Export current filtered dataset
      const q = searchInput.value.toLowerCase().trim();
      const status = statusFilter.value;
      const fromVal = dateFrom.value;
      const toVal = dateTo.value;

      const filtered = allOrdersData.filter(o => {
        const idMatch = (o.orderId || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        if (q && !idMatch && !nameMatch) return false;

        const currentStatus = o.status || 'Pending';
        if (status !== 'all' && currentStatus.toLowerCase() !== status.toLowerCase()) return false;

        if (o.createdAt) {
          const orderDate = o.createdAt.split('T')[0];
          if (fromVal && orderDate < fromVal) return false;
          if (toVal && orderDate > toVal) return false;
        }
        return true;
      });

      exportOrdersCSV(filtered);
    });
  }
}

// ────────────────────────────────────────────────────────────
//  RENDER ORDERS TABLE
// ────────────────────────────────────────────────────────────
function renderOrders(orders) {
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No orders match current filters.</td></tr>';
    return;
  }

  orders.forEach((o, index) => {
    const tr = document.createElement('tr');
    tr.id = `order-row-${o.id}`;
    tr.style.animationDelay = `${index * 40}ms`;

    const orderIdDisplay = o.orderId || o.id.slice(0, 8);
    const dateFormatted = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A';
    const statusVal = o.status || 'Pending';

    const customDesignHtml = o.cloudinaryUrl 
      ? `<img src="${o.cloudinaryUrl}" alt="Design" style="width:40px;height:40px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="event.stopPropagation(); openOrderModal('${o.id}')">`
      : '<span style="color:var(--admin-text-muted);font-size:0.75rem;">No design</span>';

    tr.innerHTML = `
      <td class="admin-table-mono" style="cursor:pointer;" onclick="openOrderModal('${o.id}')">#${orderIdDisplay}</td>
      <td style="font-weight:600;cursor:pointer;" onclick="openOrderModal('${o.id}')">${o.customerName || 'Anonymous'}</td>
      <td class="admin-table-mono">${o.customerPhone || 'N/A'}</td>
      <td>${o.productName || 'T-Shirt'} <span style="font-size:0.75rem;color:var(--admin-text-muted);">(${o.color || 'white'})</span></td>
      <td>${customDesignHtml}</td>
      <td class="admin-table-mono" style="font-weight:600;">₹${o.price || 499}</td>
      <td class="admin-table-mono" style="font-size:0.8rem;">${dateFormatted}</td>
      <td>
        <select class="admin-select" style="min-width:120px;padding:0.3rem 0.6rem;font-size:0.8rem;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="Pending" ${statusVal === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${statusVal === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Dispatched" ${statusVal === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Delivered" ${statusVal === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="admin-btn admin-btn-icon" title="View Details" onclick="openOrderModal('${o.id}')">👁️</button>
          <button class="admin-btn admin-btn-icon" title="Confirm" onclick="confirmOrder('${o.id}')">✅</button>
          <button class="admin-btn admin-btn-icon" title="Dispatch" onclick="dispatchOrder('${o.id}')">🚚</button>
          <button class="admin-btn admin-btn-icon" title="Delete" onclick="deleteOrder('${o.id}')">🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ────────────────────────────────────────────────────────────
//  UPDATE STATUS LOGIC
// ────────────────────────────────────────────────────────────
async function updateOrderStatus(id, newStatus) {
  if (typeof firebase === 'undefined') return;
  const db = firebase.firestore();

  try {
    const orderRef = db.collection('orders').doc(id);
    await orderRef.update({
      status: newStatus,
      [`statusTimes.${newStatus}`]: new Date().toISOString()
    });

    // Row highlights briefly green
    const row = document.getElementById(`order-row-${id}`);
    if (row) {
      row.classList.add('row-flash-green');
      setTimeout(() => row.classList.remove('row-flash-green'), 500);
    }
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
}

// ────────────────────────────────────────────────────────────
//  ACTION BUTTON LOGIC
// ────────────────────────────────────────────────────────────
async function confirmOrder(id) {
  const o = allOrdersData.find(order => order.id === id);
  if (!o) return;

  await updateOrderStatus(id, 'Confirmed');

  // Send WhatsApp notification
  const text = `Hi ${o.customerName}! Your Crazy Cloths order #${o.orderId || o.id.slice(0, 8)} has been confirmed. We'll dispatch it soon! 🎉`;
  const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
}

async function dispatchOrder(id) {
  const o = allOrdersData.find(order => order.id === id);
  if (!o) return;

  await updateOrderStatus(id, 'Dispatched');

  // Send WhatsApp notification
  const text = `Hi ${o.customerName}! Your order #${o.orderId || o.id.slice(0, 8)} has been dispatched! Expected delivery in 3-5 days. 📦`;
  const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
}

async function deleteOrder(id) {
  if (!confirm('Are you sure you want to delete this order? This action is permanent.')) return;

  try {
    await firebase.firestore().collection('orders').doc(id).delete();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

// ────────────────────────────────────────────────────────────
//  ORDER DETAIL MODAL
// ────────────────────────────────────────────────────────────
function openOrderModal(id) {
  const o = allOrdersData.find(order => order.id === id);
  if (!o) return;

  const modalBackdrop = document.getElementById('order-detail-modal-backdrop');
  const modalContent = document.getElementById('order-detail-modal-content');
  if (!modalBackdrop || !modalContent) return;

  const orderIdDisplay = o.orderId || o.id.slice(0, 8);
  const statusVal = o.status || 'Pending';

  // Build the modal HTML
  modalContent.innerHTML = `
    <button class="admin-modal-close" onclick="closeOrderModal()">×</button>
    <h3 class="admin-modal-title">Order Details — #CC-${orderIdDisplay}</h3>
    
    <!-- Visual Timeline -->
    <div class="admin-timeline">
      <div class="admin-timeline-step ${statusVal === 'Pending' || statusVal === 'Confirmed' || statusVal === 'Dispatched' || statusVal === 'Delivered' ? 'active' : ''} ${statusVal !== 'Pending' ? 'done' : ''}">
        <div class="admin-timeline-icon">1</div>
        <div class="admin-timeline-label">Placed</div>
        <div class="admin-timeline-date">${o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''}</div>
      </div>
      <div class="admin-timeline-step ${statusVal === 'Confirmed' || statusVal === 'Dispatched' || statusVal === 'Delivered' ? 'active' : ''} ${statusVal !== 'Pending' && statusVal !== 'Confirmed' ? 'done' : ''}">
        <div class="admin-timeline-icon">2</div>
        <div class="admin-timeline-label">Confirmed</div>
        <div class="admin-timeline-date">${o.statusTimes && o.statusTimes.Confirmed ? new Date(o.statusTimes.Confirmed).toLocaleDateString() : ''}</div>
      </div>
      <div class="admin-timeline-step ${statusVal === 'Dispatched' || statusVal === 'Delivered' ? 'active' : ''} ${statusVal === 'Delivered' ? 'done' : ''}">
        <div class="admin-timeline-icon">3</div>
        <div class="admin-timeline-label">Dispatched</div>
        <div class="admin-timeline-date">${o.statusTimes && o.statusTimes.Dispatched ? new Date(o.statusTimes.Dispatched).toLocaleDateString() : ''}</div>
      </div>
      <div class="admin-timeline-step ${statusVal === 'Delivered' ? 'active done' : ''}">
        <div class="admin-timeline-icon">4</div>
        <div class="admin-timeline-label">Delivered</div>
        <div class="admin-timeline-date">${o.statusTimes && o.statusTimes.Delivered ? new Date(o.statusTimes.Delivered).toLocaleDateString() : ''}</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:2rem;">
      <div>
        <h4 style="text-transform:uppercase; font-size:0.8rem; letter-spacing:0.05em; color:var(--admin-text-muted); margin-bottom:0.75rem;">Customer Information</h4>
        <p style="margin-bottom:0.4rem;"><strong>Name:</strong> ${o.customerName || 'N/A'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Email:</strong> ${o.customerEmail || 'N/A'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Phone:</strong> ${o.customerPhone || 'N/A'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Address:</strong> ${o.customerAddress || 'N/A'}</p>
      </div>

      <div>
        <h4 style="text-transform:uppercase; font-size:0.8rem; letter-spacing:0.05em; color:var(--admin-text-muted); margin-bottom:0.75rem;">Product Details</h4>
        <p style="margin-bottom:0.4rem;"><strong>Product:</strong> ${o.productName || 'Custom T-Shirt'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Color:</strong> ${o.color || 'N/A'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Size:</strong> ${o.size || 'N/A'}</p>
        <p style="margin-bottom:0.4rem;"><strong>Quantity:</strong> ${o.quantity || 1}</p>
        <p style="margin-bottom:0.4rem;"><strong>Total Price:</strong> ₹${o.price || 499}</p>
        ${o.specialInstructions ? `<p style="margin-bottom:0.4rem;"><strong>Notes:</strong> ${o.specialInstructions}</p>` : ''}
      </div>
    </div>

    ${o.cloudinaryUrl ? `
      <div style="margin-top:2rem;">
        <h4 style="text-transform:uppercase; font-size:0.8rem; letter-spacing:0.05em; color:var(--admin-text-muted); margin-bottom:0.75rem;">Custom Design Graphic</h4>
        <a href="${o.cloudinaryUrl}" target="_blank">
          <img src="${o.cloudinaryUrl}" alt="Custom Design" style="max-width:100%; max-height:300px; border:1px solid var(--admin-border); border-radius:4px; margin-top:0.5rem; object-fit:contain;">
        </a>
      </div>
    ` : ''}

    <div style="margin-top:2.5rem; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--admin-border); padding-top:1.5rem;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <span style="font-weight:600; font-size:0.85rem; color:var(--admin-text-muted);">Change Status:</span>
        <select class="admin-select" style="min-width:140px;" onchange="updateOrderStatus('${o.id}', this.value); setTimeout(() => openOrderModal('${o.id}'), 300)">
          <option value="Pending" ${statusVal === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${statusVal === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Dispatched" ${statusVal === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Delivered" ${statusVal === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </div>
      <button class="admin-btn admin-btn-secondary" onclick="closeOrderModal()">Close Window</button>
    </div>
  `;

  modalBackdrop.classList.add('active');
}

function closeOrderModal() {
  const modalBackdrop = document.getElementById('order-detail-modal-backdrop');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

// ────────────────────────────────────────────────────────────
//  EXPORT CSV
// ────────────────────────────────────────────────────────────
function exportOrdersCSV(orders) {
  const headers = [
    'Order ID', 'Customer Name', 'Phone', 'Email',
    'Address', 'Product', 'Color', 'Design URL',
    'Price', 'Date', 'Status'
  ];
  const rows = orders.map(o => [
    o.orderId || o.id, o.customerName || 'N/A', o.customerPhone || 'N/A', o.customerEmail || 'N/A',
    o.customerAddress || 'N/A', o.productName || 'N/A', o.color || 'N/A',
    o.cloudinaryUrl || 'No design',
    o.price || 499, o.createdAt || 'N/A', o.status || 'Pending'
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${(v.toString()).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crazy-cloths-orders-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Make modal actions global
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.updateOrderStatus = updateOrderStatus;
window.confirmOrder = confirmOrder;
window.dispatchOrder = dispatchOrder;
window.deleteOrder = deleteOrder;
