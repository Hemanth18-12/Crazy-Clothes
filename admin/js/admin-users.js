/**
 * Crazy Cloths — Admin Users Logic
 * Features:
 *  - Sortable columns (name, ordersCount, totalSpent) with FLIP animation
 *  - Inline accordion: click a row to expand order history
 *  - totalSpent column computed from orders by matching email
 *  - activityLog writes on delete
 */

let allUsersData        = [];
let allOrdersForUsers   = [];
let usersSortKey        = 'name';
let usersSortDir        = 'asc';  // 'asc' | 'desc'
let expandedUserId      = null;   // tracks the currently open accordion row

// ─────────────────────────────────────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'users') {
    initUsersPage();
  }
});

async function initUsersPage() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db        = firebase.firestore();
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading users…</td></tr>';

  try {
    // 1. Fetch all orders once (to compute per-user stats)
    const ordersSnap     = await db.collection('orders').get();
    allOrdersForUsers    = [];
    ordersSnap.forEach(doc => {
      allOrdersForUsers.push({ id: doc.id, ...doc.data() });
    });

    // 2. Live snapshot of users collection
    db.collection('users')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        allUsersData = [];
        if (snapshot.empty) {
          tableBody.innerHTML =
            '<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No registered users found.</td></tr>';
          computeUserStats([], allOrdersForUsers);
          return;
        }
        snapshot.forEach(doc => {
          allUsersData.push({ id: doc.id, ...doc.data() });
        });

        // Attach computed stats onto each user object so sorting works
        attachComputedStats(allUsersData, allOrdersForUsers);

        computeUserStats(allUsersData, allOrdersForUsers);
        renderUsersTable(allUsersData);
      }, err => {
        console.error(err);
        tableBody.innerHTML =
          '<tr><td colspan="9" style="text-align:center;color:var(--admin-accent);">Failed to load users list.</td></tr>';
      });

  } catch (err) {
    console.error(err);
    tableBody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:var(--admin-accent);">Failed to initialise users.</td></tr>';
  }

  // ── Search
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const q        = e.target.value.toLowerCase().trim();
      const filtered = allUsersData.filter(user => {
        return (
          (user.name  || '').toLowerCase().includes(q) ||
          (user.email || '').toLowerCase().includes(q) ||
          (user.phone || '').toLowerCase().includes(q)
        );
      });
      renderUsersTable(filtered);
    });
  }

  // ── Sortable column headers
  document.querySelectorAll('#users-admin-table th.sortable').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (usersSortKey === key) {
        usersSortDir = usersSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        usersSortKey = key;
        usersSortDir = 'desc'; // default new column → descending
      }
      updateSortArrows();

      // Re-render with current data (respect any active search)
      const q = (document.getElementById('user-search')?.value || '').toLowerCase().trim();
      const dataset = q
        ? allUsersData.filter(u =>
            (u.name  || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q)
          )
        : allUsersData;
      renderUsersTable(dataset);
    });
  });

  updateSortArrows();
}

// ─────────────────────────────────────────────────────────────────────────────
//  ATTACH COMPUTED STATS
//  Enriches each user object with: ordersCount, totalSpent, lastOrderDate
// ─────────────────────────────────────────────────────────────────────────────
function attachComputedStats(users, orders) {
  users.forEach(user => {
    const email       = (user.email || '').toLowerCase().trim();
    const userOrders  = orders.filter(o =>
      (o.customerEmail || '').toLowerCase().trim() === email
    );

    user.ordersCount   = userOrders.length;

    user.totalSpent    = userOrders.reduce((sum, o) => {
      const price = parseFloat(o.totalAmount || o.total || o.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

    // Latest order date (numeric for sorting)
    if (userOrders.length > 0) {
      const sorted           = [...userOrders].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      user._lastOrderDate    = sorted[0].createdAt
        ? new Date(sorted[0].createdAt)
        : null;
      user._userOrdersSorted = sorted;
    } else {
      user._lastOrderDate    = null;
      user._userOrdersSorted = [];
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  COMPUTE STATS CARDS
// ─────────────────────────────────────────────────────────────────────────────
function computeUserStats(users, orders) {
  // Total users
  const totalUsersEl = document.getElementById('stat-total-users');
  if (totalUsersEl) totalUsersEl.textContent = users.length;

  // New this week
  const newUsersEl = document.getElementById('stat-new-users-week');
  if (newUsersEl) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const count = users.filter(u => {
      if (!u.createdAt) return false;
      const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return d >= sevenDaysAgo;
    }).length;
    newUsersEl.textContent = count;
  }

  // Most active (by order count)
  const activeUserEl = document.getElementById('stat-most-active-user');
  if (activeUserEl) {
    const byOrders   = [...users].sort((a, b) => (b.ordersCount || 0) - (a.ordersCount || 0));
    const top        = byOrders[0];
    activeUserEl.textContent =
      top && top.ordersCount > 0
        ? `${top.name || 'Anonymous'} (${top.ordersCount} orders)`
        : 'None';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SORT ARROW SYNC
// ─────────────────────────────────────────────────────────────────────────────
function updateSortArrows() {
  document.querySelectorAll('#users-admin-table th.sortable').forEach(th => {
    const arrow = th.querySelector('.sort-arrow');
    if (!arrow) return;
    if (th.dataset.sort === usersSortKey) {
      arrow.textContent = usersSortDir === 'asc' ? '▲' : '▼';
      th.classList.add('sort-active');
    } else {
      arrow.textContent = '▼';
      th.classList.remove('sort-active');
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  SORT HELPER
// ─────────────────────────────────────────────────────────────────────────────
function sortedUsers(users) {
  return [...users].sort((a, b) => {
    let valA, valB;
    switch (usersSortKey) {
      case 'ordersCount':
        valA = a.ordersCount || 0;
        valB = b.ordersCount || 0;
        break;
      case 'totalSpent':
        valA = a.totalSpent || 0;
        valB = b.totalSpent || 0;
        break;
      case 'name':
      default:
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
        break;
    }
    if (valA < valB) return usersSortDir === 'asc' ? -1 :  1;
    if (valA > valB) return usersSortDir === 'asc' ?  1 : -1;
    return 0;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  RENDER USERS TABLE  (with FLIP animation + accordion)
// ─────────────────────────────────────────────────────────────────────────────
function renderUsersTable(users) {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  if (users.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="9" style="text-align:center;color:var(--admin-text-muted);">No users found.</td></tr>';
    return;
  }

  const sorted = sortedUsers(users);

  // ── FLIP: record old positions
  const oldRects = {};
  tableBody.querySelectorAll('tr[data-user-id]').forEach(row => {
    oldRects[row.dataset.userId] = row.getBoundingClientRect();
  });

  // ── Build new DOM
  tableBody.innerHTML = '';
  sorted.forEach((user, index) => {
    const lastDateStr = user._lastOrderDate
      ? user._lastOrderDate.toLocaleDateString()
      : 'Never';

    const regDate = user.createdAt
      ? (user.createdAt.toDate
          ? user.createdAt.toDate().toLocaleDateString()
          : new Date(user.createdAt).toLocaleDateString())
      : 'N/A';

    const firstLetter   = (user.name || 'U').charAt(0).toUpperCase();
    const spentFormatted = `₹${(user.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    const isExpanded     = expandedUserId === user.id;

    // ── Main row
    const tr = document.createElement('tr');
    tr.dataset.userId = user.id;
    tr.style.animationDelay = `${index * 30}ms`;
    tr.className = isExpanded ? 'user-row-active' : '';

    const safeEmail = (user.email || '').replace(/'/g, "\\'");
    const safeName  = (user.name  || '').replace(/'/g, "\\'");

    tr.innerHTML = `
      <td>
        <div class="admin-table-avatar" style="
          background: hsl(${(user.name || 'U').charCodeAt(0) * 7 % 360}, 55%, 35%);
          color: #fff;
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem;
          flex-shrink: 0;
        ">${firstLetter}</div>
      </td>
      <td style="font-weight:600; cursor:pointer; user-select:none;" class="user-expand-cell">
        <span style="display:inline-flex; align-items:center; gap:0.4rem;">
          <span class="user-chevron" style="font-size:0.65rem; transition:transform 0.2s; transform:${isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}">▶</span>
          ${user.name || 'N/A'}
        </span>
      </td>
      <td class="admin-table-mono">${user.email || 'N/A'}</td>
      <td class="admin-table-mono">${user.phone || 'N/A'}</td>
      <td class="admin-table-mono">${regDate}</td>
      <td class="admin-table-mono" style="font-weight:600; text-align:center;">
        <span class="admin-badge ${user.ordersCount > 0 ? 'accent-blue' : ''}" style="
          display:inline-block;
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          font-size: 0.78rem;
          background: ${user.ordersCount > 0 ? 'var(--admin-accent-muted)' : 'var(--admin-surface-2)'};
          color: ${user.ordersCount > 0 ? 'var(--admin-accent)' : 'var(--admin-text-muted)'};
          font-weight: 700;
        ">${user.ordersCount}</span>
      </td>
      <td class="admin-table-mono" style="font-weight:600; color: ${user.totalSpent > 0 ? 'var(--admin-green)' : 'var(--admin-text-muted)'};">
        ${spentFormatted}
      </td>
      <td class="admin-table-mono">${lastDateStr}</td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button
            class="admin-btn admin-btn-secondary"
            style="padding:0.35rem 0.7rem; font-size:0.73rem;"
            onclick="viewOrdersForUser('${safeEmail}')"
          >📦 Orders</button>
          <button
            class="admin-btn admin-btn-outline"
            style="padding:0.35rem 0.7rem; font-size:0.73rem; color:var(--admin-red); border-color:var(--admin-red);"
            onclick="deleteUser('${user.id}', '${safeName}')"
          >🗑️</button>
        </div>
      </td>
    `;

    // ── Click name cell → expand accordion
    tr.querySelector('.user-expand-cell').addEventListener('click', () => {
      toggleUserAccordion(user.id, user, tr, tableBody);
    });

    tableBody.appendChild(tr);

    // ── If this row was expanded, immediately insert accordion
    if (isExpanded) {
      tableBody.appendChild(buildAccordionRow(user));
    }
  });

  // ── FLIP: animate from old positions to new
  tableBody.querySelectorAll('tr[data-user-id]').forEach(row => {
    const uid = row.dataset.userId;
    if (oldRects[uid]) {
      const newRect  = row.getBoundingClientRect();
      const deltaY   = oldRects[uid].top - newRect.top;
      if (Math.abs(deltaY) > 1) {
        row.style.transition = 'none';
        row.style.transform  = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          row.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1)';
          row.style.transform  = '';
        });
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACCORDION TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function toggleUserAccordion(userId, user, mainRow, tableBody) {
  // Remove any existing accordion row first
  const existing = tableBody.querySelector('tr.user-accordion-row');
  if (existing) existing.remove();

  const chevron = mainRow.querySelector('.user-chevron');

  if (expandedUserId === userId) {
    // Collapse
    expandedUserId = null;
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    mainRow.classList.remove('user-row-active');
    return;
  }

  // Expand new row
  expandedUserId = userId;
  mainRow.classList.add('user-row-active');
  if (chevron) chevron.style.transform = 'rotate(90deg)';

  // Clear active styling on sibling rows
  tableBody.querySelectorAll('tr[data-user-id]').forEach(r => {
    if (r.dataset.userId !== userId) {
      r.classList.remove('user-row-active');
      const c = r.querySelector('.user-chevron');
      if (c) c.style.transform = 'rotate(0deg)';
    }
  });

  const accordionRow = buildAccordionRow(user);
  mainRow.insertAdjacentElement('afterend', accordionRow);

  // Animate in
  requestAnimationFrame(() => {
    accordionRow.querySelector('.user-accordion-inner').style.opacity   = '1';
    accordionRow.querySelector('.user-accordion-inner').style.transform = 'translateY(0)';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILD ACCORDION ROW  (inline order history)
// ─────────────────────────────────────────────────────────────────────────────
function buildAccordionRow(user) {
  const tr       = document.createElement('tr');
  tr.className   = 'user-accordion-row';

  const orders   = user._userOrdersSorted || [];

  let ordersHtml;
  if (orders.length === 0) {
    ordersHtml = '<p style="color:var(--admin-text-muted); font-size:0.82rem; margin:0;">No orders found for this user.</p>';
  } else {
    const rows = orders.map(o => {
      const date    = o.createdAt
        ? new Date(o.createdAt).toLocaleDateString()
        : 'Unknown';
      const amount  = parseFloat(o.totalAmount || o.total || o.price || 0);
      const status  = o.status || 'unknown';
      const statusColor = {
        delivered : 'var(--admin-green)',
        shipped   : 'var(--admin-accent)',
        processing: '#f59e0b',
        cancelled : 'var(--admin-red)',
      }[status.toLowerCase()] || 'var(--admin-text-muted)';

      const items = Array.isArray(o.items)
        ? o.items.map(i => `${i.name || 'Item'} ×${i.qty || i.quantity || 1}`).join(', ')
        : (o.productName || '—');

      return `
        <tr style="border-bottom: 1px solid var(--admin-border);">
          <td style="padding:0.5rem 0.75rem; font-size:0.78rem; color:var(--admin-text-muted); font-family:var(--font-mono);">${o.id ? o.id.slice(0,10) + '…' : '—'}</td>
          <td style="padding:0.5rem 0.75rem; font-size:0.78rem;">${date}</td>
          <td style="padding:0.5rem 0.75rem; font-size:0.78rem; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${items}</td>
          <td style="padding:0.5rem 0.75rem; font-size:0.78rem; font-weight:700; color:var(--admin-green);">₹${amount.toLocaleString('en-IN')}</td>
          <td style="padding:0.5rem 0.75rem;">
            <span style="
              display:inline-block; padding:0.1rem 0.55rem; border-radius:999px;
              font-size:0.7rem; font-weight:700; text-transform:uppercase;
              background: ${statusColor}22; color: ${statusColor};
            ">${status}</span>
          </td>
        </tr>
      `;
    }).join('');

    ordersHtml = `
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:var(--admin-surface-2);">
            <th style="padding:0.4rem 0.75rem; font-size:0.73rem; text-align:left; color:var(--admin-text-muted); font-weight:600;">Order ID</th>
            <th style="padding:0.4rem 0.75rem; font-size:0.73rem; text-align:left; color:var(--admin-text-muted); font-weight:600;">Date</th>
            <th style="padding:0.4rem 0.75rem; font-size:0.73rem; text-align:left; color:var(--admin-text-muted); font-weight:600;">Items</th>
            <th style="padding:0.4rem 0.75rem; font-size:0.73rem; text-align:left; color:var(--admin-text-muted); font-weight:600;">Amount</th>
            <th style="padding:0.4rem 0.75rem; font-size:0.73rem; text-align:left; color:var(--admin-text-muted); font-weight:600;">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  tr.innerHTML = `
    <td colspan="9" style="padding:0; background:var(--admin-surface-2); border-bottom:2px solid var(--admin-accent);">
      <div class="user-accordion-inner" style="
        padding: 1rem 1.5rem;
        opacity: 0;
        transform: translateY(-6px);
        transition: opacity 0.22s ease, transform 0.22s ease;
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
          <span style="font-size:0.8rem; font-weight:700; color:var(--admin-text-secondary); text-transform:uppercase; letter-spacing:0.06em;">
            Order History — ${user.name || user.email || 'User'}
          </span>
          <span style="font-size:0.78rem; color:var(--admin-text-muted);">
            ${orders.length} order${orders.length !== 1 ? 's' : ''} · Total: <strong style="color:var(--admin-green);">₹${(user.totalSpent || 0).toLocaleString('en-IN')}</strong>
          </span>
        </div>
        ${ordersHtml}
      </div>
    </td>
  `;

  return tr;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
function viewOrdersForUser(email) {
  sessionStorage.setItem('admin_orders_filter_email', email);
  window.location.href = 'orders.html';
}

async function deleteUser(id, name) {
  if (!confirm(`Delete the user profile for "${name}" from Firestore?`)) return;
  if (!confirm(`WARNING: This removes the Firestore record only — the Firebase Auth account must be deleted manually in the Firebase Console. Proceed?`)) return;

  if (typeof firebase === 'undefined') return;

  try {
    const db = firebase.firestore();
    await db.collection('users').doc(id).delete();

    // ── Write activity log
    try {
      await db.collection('activityLog').add({
        type      : 'user_deleted',
        message   : `User profile deleted: "${name}"`,
        userId    : id,
        timestamp : firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (_) { /* non-critical */ }

    // ── Animate row out
    const row         = document.getElementById(`user-row-${id}`);
    const accordionEl = document.querySelector('tr.user-accordion-row');
    [row, accordionEl].forEach(el => {
      if (!el) return;
      el.style.transition = 'opacity 0.25s, transform 0.25s';
      el.style.opacity    = '0';
      el.style.transform  = 'translateX(24px)';
    });
    setTimeout(() => {
      row?.remove();
      accordionEl?.remove();
    }, 280);

    if (window.showToast) {
      window.showToast('User Deleted', `"${name}" has been removed from Firestore.`);
    }

  } catch (err) {
    alert('Failed to delete user: ' + err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL EXPORTS (called from onclick attributes in HTML)
// ─────────────────────────────────────────────────────────────────────────────
window.viewOrdersForUser = viewOrdersForUser;
window.deleteUser        = deleteUser;
