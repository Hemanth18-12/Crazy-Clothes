/**
 * Crazy Cloths — Admin Orders & Notifications Logic (Redesigned Layout & Controls)
 */

let allOrdersData = [];
let selectedOrderIds = new Set();
let currentSortColumn = 'createdAt';
let currentSortDirection = 'desc';

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initRealtimeNotifications();

  const page = document.body.dataset.page;
  if (page === 'orders') {
    initOrdersPage();
  }
});

// ── CLOCK ──────────────────────────────────────────────────
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

// ── REAL-TIME NOTIFICATIONS SYSTEM ──────────────────────────
function initRealtimeNotifications() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();
  const bell = document.getElementById('topbar-bell');
  const badge = document.getElementById('topbar-bell-badge');

  let lastVisitTime = localStorage.getItem('cc_last_visit_time');
  if (!lastVisitTime) {
    lastVisitTime = new Date().toISOString();
    localStorage.setItem('cc_last_visit_time', lastVisitTime);
  }

  let unreadCount = parseInt(localStorage.getItem('cc_unread_count') || '0');
  updateBellBadge(unreadCount);

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
      // Scale-pulse micro-animation on update
      badge.style.transform = 'scale(1.2)';
      setTimeout(() => badge.style.transform = 'scale(1)', 200);
    } else {
      badge.style.display = 'none';
    }
  }

  db.collection('orders').onSnapshot(snapshot => {
    let isInitial = true;
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const order = change.doc.data();
        const orderIdStr = order.orderId || change.doc.id;
        const createdAt = order.createdAt;

        if (createdAt && createdAt > lastVisitTime) {
          unreadCount++;
          localStorage.setItem('cc_unread_count', unreadCount.toString());
          updateBellBadge(unreadCount);

          if (bell) {
            bell.classList.add('shake');
            setTimeout(() => bell.classList.remove('shake'), 600);
          }

          showAdminToast(`New Order!`, `#CC-${orderIdStr} from ${order.customerName || 'Customer'}`);
          flashBrowserTitle();
        }
      }
    });
    isInitial = false;
  });
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

  window.addEventListener('focus', () => {
    clearInterval(titleFlashInterval);
    document.title = originalTitle;
  }, { once: true });
}

// ── FLIP ANIMATION RE-ORDER HELPER ───────────────────────────
function flipSort(renderFn) {
  const table = document.getElementById('orders-admin-table');
  if (!table) { renderFn(); return; }
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  
  // Record positions
  const oldRects = new Map(rows.map(row => [row.id, row.getBoundingClientRect()]));
  
  renderFn();
  
  // Apply visual delta transforms
  const newRows = Array.from(table.querySelectorAll('tbody tr'));
  newRows.forEach(row => {
    const oldRect = oldRects.get(row.id);
    if (oldRect) {
      const newRect = row.getBoundingClientRect();
      const deltaY = oldRect.top - newRect.top;
      if (deltaY !== 0) {
        row.style.transform = `translateY(${deltaY}px)`;
        row.style.transition = 'none';
        requestAnimationFrame(() => {
          row.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          row.style.transform = 'translateY(0)';
        });
      }
    }
  });
}

// ── ORDERS PAGE INITIALIZATION ──────────────────────────────
async function initOrdersPage() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Loading orders database...</td></tr>';

  db.collection('orders')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      allOrdersData = [];
      tableBody.innerHTML = '';

      if (snapshot.empty) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--admin-text-muted);">No orders found.</td></tr>';
        return;
      }

      snapshot.forEach(doc => {
        const data = doc.data();
        allOrdersData.push({ id: doc.id, ...data });
      });

      // Maintain active sorting
      sortOrdersData();
      applyFilters();
    }, err => {
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--admin-accent);">Failed to load orders.</td></tr>';
    });

  // Filters setup
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

    renderOrders(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFrom.addEventListener('change', applyFilters);
  dateTo.addEventListener('change', applyFilters);

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      // Export current filtered set
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

  // Header checkbox multi-select toggling
  const selectAllCb = document.getElementById('select-all-orders');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      const checked = e.target.checked;
      const rows = document.querySelectorAll('.order-select-cb');
      rows.forEach(cb => {
        cb.checked = checked;
        const rowId = cb.dataset.id;
        if (checked) {
          selectedOrderIds.add(rowId);
          const tr = document.getElementById(`order-row-${rowId}`);
          if (tr) tr.classList.add('selected-row');
        } else {
          selectedOrderIds.delete(rowId);
          const tr = document.getElementById(`order-row-${rowId}`);
          if (tr) tr.classList.remove('selected-row');
        }
      });
      updateBulkActionBar();
    });
  }

  // Density Preference loader
  window.setRowDensity = (density) => {
    const table = document.getElementById('orders-admin-table');
    const comfortableBtn = document.getElementById('btn-density-comfortable');
    const compactBtn = document.getElementById('btn-density-compact');
    if (!table || !comfortableBtn || !compactBtn) return;

    if (density === 'compact') {
      table.classList.add('density-compact');
      compactBtn.classList.add('active');
      comfortableBtn.classList.remove('active');
    } else {
      table.classList.remove('density-compact');
      comfortableBtn.classList.add('active');
      compactBtn.classList.remove('active');
    }
    localStorage.setItem('cc_order_row_density', density);
  };
  const savedDensity = localStorage.getItem('cc_order_row_density') || 'comfortable';
  window.setRowDensity(savedDensity);

  // Sorting columns header setup
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      handleSortClick(th.dataset.sort);
    });
  });

  // Check if deep linked from command palette search
  setTimeout(() => {
    const deepOpenId = sessionStorage.getItem('cc_open_order_modal_id');
    if (deepOpenId) {
      sessionStorage.removeItem('cc_open_order_modal_id');
      openOrderModal(deepOpenId);
    }
  }, 400);

  // Keyboard navigation setup
  initKeyboardRowNavigation();
}

// ── SORTING ALGORITHMS ──────────────────────────────────────
function sortOrdersData() {
  allOrdersData.sort((a, b) => {
    let valA = a[currentSortColumn];
    let valB = b[currentSortColumn];

    if (currentSortColumn === 'price') {
      valA = parseFloat(valA) || 0;
      valB = parseFloat(valB) || 0;
    } else {
      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
    }

    if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

function handleSortClick(column) {
  if (currentSortColumn === column) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = column;
    currentSortDirection = 'asc';
  }

  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = '▼';

    if (th.dataset.sort === column) {
      th.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
      if (arrow) arrow.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
    }
  });

  flipSort(() => {
    sortOrdersData();
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
      // Re-trigger visual filter list render
      searchInput.dispatchEvent(new Event('input'));
    } else {
      renderOrders(allOrdersData);
    }
  });
}

// ── RENDER ROWS ────────────────────────────────────────────
function renderOrders(orders) {
  const tableBody = document.getElementById('orders-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (orders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--admin-text-muted);">No orders match filters.</td></tr>';
    return;
  }

  orders.forEach((o, index) => {
    const tr = document.createElement('tr');
    tr.id = `order-row-${o.id}`;
    tr.style.animationDelay = `${index * 20}ms`;
    if (selectedOrderIds.has(o.id)) {
      tr.classList.add('selected-row');
    }

    const orderIdDisplay = o.orderId || o.id.slice(0, 8);
    const dateFormatted = o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A';
    const statusVal = o.status || 'Pending';

    const customDesignHtml = o.cloudinaryUrl 
      ? `<img src="${o.cloudinaryUrl}" alt="Design" style="width:36px;height:36px;object-fit:cover;border-radius:4px;cursor:pointer;border:1px solid var(--admin-border);" onclick="event.stopPropagation(); openOrderModal('${o.id}')">`
      : '<span style="color:var(--admin-text-muted);font-size:0.75rem;">No design</span>';

    const isChecked = selectedOrderIds.has(o.id) ? 'checked' : '';

    tr.innerHTML = `
      <td class="cb-col" onclick="event.stopPropagation()">
        <input type="checkbox" class="admin-cb order-select-cb" data-id="${o.id}" ${isChecked} onchange="toggleSelectOrderRow('${o.id}', this.checked)">
      </td>
      <td class="admin-table-mono" style="cursor:pointer;" onclick="openOrderModal('${o.id}')">#${orderIdDisplay}</td>
      <td style="font-weight:600;cursor:pointer;" onclick="openOrderModal('${o.id}')">${o.customerName || 'Anonymous'}</td>
      <td class="admin-table-mono">${o.customerPhone || 'N/A'}</td>
      <td>${o.productName || 'T-Shirt'} <span style="font-size:0.75rem;color:var(--admin-text-muted);">(${o.color || 'white'})</span></td>
      <td>${customDesignHtml}</td>
      <td class="admin-table-mono" style="font-weight:600;">₹${o.price || 499}</td>
      <td class="admin-table-mono" style="font-size:0.8rem;">${dateFormatted}</td>
      <td>
        <!-- Click to Edit Inline badge drop-down -->
        <span class="badge ${statusVal.toLowerCase()}" style="cursor:pointer;" onclick="toggleInlineStatusEdit(event, '${o.id}', '${statusVal}')">${statusVal}</span>
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

// ── INDIVIDUAL ROW CHECKBOX SELECTION ───────────────────────
function toggleSelectOrderRow(id, checked) {
  const tr = document.getElementById(`order-row-${id}`);
  if (checked) {
    selectedOrderIds.add(id);
    if (tr) tr.classList.add('selected-row');
  } else {
    selectedOrderIds.delete(id);
    if (tr) tr.classList.remove('selected-row');
    const selectAllCb = document.getElementById('select-all-orders');
    if (selectAllCb) selectAllCb.checked = false;
  }
  updateBulkActionBar();
}
window.toggleSelectOrderRow = toggleSelectOrderRow;

function updateBulkActionBar() {
  const bar = document.getElementById('bulk-action-bar');
  const countEl = document.getElementById('bulk-selected-count');
  if (bar && countEl) {
    countEl.textContent = selectedOrderIds.size;
    if (selectedOrderIds.size > 0) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }
}

// ── BULK OPERATIONS ──────────────────────────────────────────
async function bulkUpdateStatus(newStatus) {
  if (selectedOrderIds.size === 0) return;
  if (typeof firebase === 'undefined') return;
  const db = firebase.firestore();
  
  const promises = [];
  selectedOrderIds.forEach(id => {
    const o = allOrdersData.find(order => order.id === id);
    const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;
    
    promises.push(
      db.collection('orders').doc(id).update({
        status: newStatus,
        [`statusTimes.${newStatus}`]: new Date().toISOString()
      }).then(() => {
        logAdminAction("updated order status", "orders", id, `#CC-${orderIdStr} to ${newStatus}`);
      })
    );
  });

  try {
    await Promise.all(promises);
    showAdminToast("Bulk Update Success", `Updated ${selectedOrderIds.size} orders to status: ${newStatus}`);
    selectedOrderIds.clear();
    updateBulkActionBar();
    const selectAllCb = document.getElementById('select-all-orders');
    if (selectAllCb) selectAllCb.checked = false;
  } catch (err) {
    alert("Bulk update failed: " + err.message);
  }
}
window.bulkUpdateStatus = bulkUpdateStatus;

function bulkExportCSV() {
  if (selectedOrderIds.size === 0) return;
  const selectedOrders = allOrdersData.filter(o => selectedOrderIds.has(o.id));
  exportOrdersCSV(selectedOrders);
}
window.bulkExportCSV = bulkExportCSV;

async function bulkDeleteOrders() {
  if (selectedOrderIds.size === 0) return;
  if (!confirm(`Are you sure you want to permanently delete the ${selectedOrderIds.size} selected orders?`)) return;

  if (typeof firebase === 'undefined') return;
  const db = firebase.firestore();
  const promises = [];

  selectedOrderIds.forEach(id => {
    const o = allOrdersData.find(order => order.id === id);
    const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;

    promises.push(
      db.collection('orders').doc(id).delete().then(() => {
        logAdminAction("deleted order", "orders", id, `#CC-${orderIdStr}`);
      })
    );
  });

  try {
    await Promise.all(promises);
    showAdminToast("Bulk Delete Success", `Successfully removed ${promises.length} orders.`);
    selectedOrderIds.clear();
    updateBulkActionBar();
    const selectAllCb = document.getElementById('select-all-orders');
    if (selectAllCb) selectAllCb.checked = false;
  } catch (err) {
    alert("Bulk delete failed: " + err.message);
  }
}
window.bulkDeleteOrders = bulkDeleteOrders;

// ── INLINE STATUS DROPDOWN EDITING ──────────────────────────
function toggleInlineStatusEdit(event, orderId, currentStatus) {
  event.stopPropagation();
  const badge = event.target;
  const parent = badge.parentElement;
  
  const select = document.createElement('select');
  select.className = 'status-inline-select';
  
  ['Pending', 'Confirmed', 'Dispatched', 'Delivered'].forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    if (s === currentStatus) opt.selected = true;
    select.appendChild(opt);
  });
  
  parent.innerHTML = '';
  parent.appendChild(select);
  select.focus();

  const commitInlineStatus = async () => {
    const newStatus = select.value;
    if (newStatus !== currentStatus) {
      await updateOrderStatus(orderId, newStatus);
    } else {
      // Re-render row to restore badge visual
      renderOrders(allOrdersData);
    }
  };

  select.addEventListener('change', commitInlineStatus);
  select.addEventListener('blur', () => {
    setTimeout(() => {
      if (parent.contains(select)) {
        renderOrders(allOrdersData);
      }
    }, 150);
  });
}
window.toggleInlineStatusEdit = toggleInlineStatusEdit;

// ── UPDATE STATUS LOGIC ────────────────────────────────────
async function updateOrderStatus(id, newStatus) {
  if (typeof firebase === 'undefined') return;
  const db = firebase.firestore();

  try {
    const orderRef = db.collection('orders').doc(id);
    await orderRef.update({
      status: newStatus,
      [`statusTimes.${newStatus}`]: new Date().toISOString()
    });

    const o = allOrdersData.find(order => order.id === id);
    const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;
    logAdminAction("updated order status", "orders", id, `#CC-${orderIdStr} to ${newStatus}`);

    // Automated WhatsApp notifications on status change
    if (o && o.customerPhone) {
      let text = "";
      if (newStatus === 'Confirmed') {
        text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} has been confirmed. We're preparing it for dispatch. 📦`;
      } else if (newStatus === 'Dispatched') {
        text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} is on its way! Expected delivery in 3-5 days. 🚚`;
      } else if (newStatus === 'Delivered') {
        text = `Hi ${o.customerName}! Your order #CC-${orderIdStr} has been delivered. We hope you love it! Leave us a review on the app. ⭐`;
      }

      if (text) {
        const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
      }
    }

    const row = document.getElementById(`order-row-${id}`);
    if (row) {
      row.classList.add('row-flash-green');
      setTimeout(() => row.classList.remove('row-flash-green'), 500);
    }
  } catch (err) {
    alert('Failed to update status: ' + err.message);
  }
}

// ── ACTION BUTTON LOGIC ────────────────────────────────────
async function confirmOrder(id) {
  await updateOrderStatus(id, 'Confirmed');
}

async function dispatchOrder(id) {
  await updateOrderStatus(id, 'Dispatched');
}

async function deleteOrder(id) {
  const o = allOrdersData.find(order => order.id === id);
  const orderIdStr = o ? (o.orderId || o.id.slice(0, 8)) : id;

  if (!confirm('Are you sure you want to delete this order? This action is permanent.')) return;

  try {
    await firebase.firestore().collection('orders').doc(id).delete();
    logAdminAction("deleted order", "orders", id, `#CC-${orderIdStr}`);
    showAdminToast("Order Deleted", `Order #CC-${orderIdStr} was permanently deleted.`);
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

// ── ORDER DETAIL MODAL ────────────────────────────────────
function openOrderModal(id) {
  const o = allOrdersData.find(order => order.id === id);
  if (!o) return;

  const modalBackdrop = document.getElementById('order-detail-modal-backdrop');
  const modalContent = document.getElementById('order-detail-modal-content');
  if (!modalBackdrop || !modalContent) return;

  const orderIdDisplay = o.orderId || o.id.slice(0, 8);
  const statusVal = o.status || 'Pending';

  modalContent.innerHTML = `
    <button class="admin-modal-close" onclick="closeOrderModal()">×</button>
    <h3 class="admin-modal-title">Order Details — #CC-${orderIdDisplay}</h3>
    
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

// ── EXPORT CSV ────────────────────────────────────────────
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

// ── KEYBOARD ROW NAVIGATION ──────────────────────────────────
function initKeyboardRowNavigation() {
  let activeRowIndex = -1;
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const rows = Array.from(document.querySelectorAll('#orders-table-body tr'));
    if (rows.length === 0 || rows[0].querySelector('td[colspan]')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeRowIndex < rows.length - 1) {
        if (activeRowIndex >= 0) rows[activeRowIndex].style.outline = 'none';
        activeRowIndex++;
        rows[activeRowIndex].style.outline = '2px solid var(--admin-accent)';
        rows[activeRowIndex].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeRowIndex > 0) {
        rows[activeRowIndex].style.outline = 'none';
        activeRowIndex--;
        rows[activeRowIndex].style.outline = '2px solid var(--admin-accent)';
        rows[activeRowIndex].scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter') {
      if (activeRowIndex >= 0 && activeRowIndex < rows.length) {
        e.preventDefault();
        const rowId = rows[activeRowIndex].id.replace('order-row-', '');
        openOrderModal(rowId);
      }
    }
  });
}

// Global Exports
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.updateOrderStatus = updateOrderStatus;
window.confirmOrder = confirmOrder;
window.dispatchOrder = dispatchOrder;
window.deleteOrder = deleteOrder;
