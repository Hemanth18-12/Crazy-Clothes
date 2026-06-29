/**
 * Crazy Cloths — Admin Users Logic
 */

let allUsersData = [];
let allOrdersForUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'users') {
    initUsersPage();
  }
});

async function initUsersPage() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading users...</td></tr>';

  try {
    // 1. Fetch all orders to compute stats (orders count and last order date)
    const ordersSnap = await db.collection('orders').get();
    allOrdersForUsers = [];
    ordersSnap.forEach(doc => {
      allOrdersForUsers.push(doc.data());
    });

    // 2. Fetch all users from Firestore
    db.collection('users')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        allUsersData = [];
        tableBody.innerHTML = '';

        if (snapshot.empty) {
          tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--admin-text-muted);">No registered users found.</td></tr>';
          return;
        }

        snapshot.forEach(doc => {
          allUsersData.push({ id: doc.id, ...doc.data() });
        });

        // Compute Stats
        computeUserStats(allUsersData, allOrdersForUsers);

        // Render Table
        renderUsersTable(allUsersData);
      }, err => {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--admin-accent);">Failed to load users list.</td></tr>';
      });

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--admin-accent);">Failed to initialize users.</td></tr>';
  }

  // Setup Search Input
  const searchInput = document.getElementById('user-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allUsersData.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
      renderUsersTable(filtered);
    });
  }
}

// ────────────────────────────────────────────────────────────
//  COMPUTE STATS ROWS
// ────────────────────────────────────────────────────────────
function computeUserStats(users, orders) {
  // Total registered users
  const totalUsersEl = document.getElementById('stat-total-users');
  if (totalUsersEl) {
    totalUsersEl.textContent = users.length;
  }

  // New users this week (within last 7 days)
  const newUsersEl = document.getElementById('stat-new-users-week');
  if (newUsersEl) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const countThisWeek = users.filter(user => {
      if (!user.createdAt) return false;
      const userDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      return userDate >= sevenDaysAgo;
    }).length;
    newUsersEl.textContent = countThisWeek;
  }

  // Most active user by order count
  const activeUserEl = document.getElementById('stat-most-active-user');
  if (activeUserEl) {
    const userOrderCounts = {};
    orders.forEach(order => {
      const email = (order.customerEmail || '').toLowerCase().trim();
      if (email) {
        userOrderCounts[email] = (userOrderCounts[email] || 0) + 1;
      }
    });

    let maxOrders = 0;
    let mostActiveEmail = 'N/A';

    for (const [email, count] of Object.entries(userOrderCounts)) {
      if (count > maxOrders) {
        maxOrders = count;
        mostActiveEmail = email;
      }
    }

    // Find user name corresponding to this email
    const matchUser = users.find(u => (u.email || '').toLowerCase().trim() === mostActiveEmail);
    if (matchUser && maxOrders > 0) {
      activeUserEl.textContent = `${matchUser.name || 'Anonymous'} (${maxOrders} orders)`;
    } else {
      activeUserEl.textContent = 'None';
    }
  }
}

// ────────────────────────────────────────────────────────────
//  RENDER USERS TABLE
// ────────────────────────────────────────────────────────────
function renderUsersTable(users) {
  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--admin-text-muted);">No users found.</td></tr>';
    return;
  }

  users.forEach((user, index) => {
    // 1. Calculate orders count & last order date
    const userEmail = (user.email || '').toLowerCase().trim();
    const userOrders = allOrdersForUsers.filter(o => (o.customerEmail || '').toLowerCase().trim() === userEmail);
    const ordersCount = userOrders.length;

    let lastOrderDateStr = 'Never';
    if (ordersCount > 0) {
      // Find latest order date
      const sorted = userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sorted[0] && sorted[0].createdAt) {
        lastOrderDateStr = new Date(sorted[0].createdAt).toLocaleDateString();
      }
    }

    const regDate = user.createdAt
      ? (user.createdAt.toDate ? user.createdAt.toDate().toLocaleDateString() : new Date(user.createdAt).toLocaleDateString())
      : 'N/A';

    const tr = document.createElement('tr');
    tr.id = `user-row-${user.id}`;
    tr.style.animationDelay = `${index * 40}ms`;

    const firstLetter = (user.name || 'U').charAt(0).toUpperCase();

    tr.innerHTML = `
      <td>
        <div class="admin-table-avatar">${firstLetter}</div>
      </td>
      <td style="font-weight:600;">${user.name || 'N/A'}</td>
      <td class="admin-table-mono">${user.email || 'N/A'}</td>
      <td class="admin-table-mono">${user.phone || 'N/A'}</td>
      <td class="admin-table-mono">${regDate}</td>
      <td class="admin-table-mono" style="font-weight:600; text-align:center;">${ordersCount}</td>
      <td class="admin-table-mono">${lastOrderDateStr}</td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="admin-btn admin-btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="viewOrdersForUser('${user.email}')">👁️ View Orders</button>
          <button class="admin-btn admin-btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deleteUser('${user.id}', '${user.name}')">🗑️ Delete</button>
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// ────────────────────────────────────────────────────────────
//  ACTIONS
// ────────────────────────────────────────────────────────────
function viewOrdersForUser(email) {
  // Store user's email filter in sessionStorage and redirect to orders.html
  sessionStorage.setItem('admin_orders_filter_email', email);
  window.location.href = 'orders.html';
}

async function deleteUser(id, name) {
  if (!confirm(`Are you sure you want to delete the user "${name}" from the Firestore users database?`)) return;
  if (!confirm(`WARNING: Deleting this user profile will remove their record from Firestore, but it CANNOT delete them from Firebase Authentication directly from the client. To fully remove them, delete the account in the Firebase Console Auth tab. Proceed anyway?`)) return;

  if (typeof firebase === 'undefined') return;

  try {
    // Delete user from Firestore users collection
    await firebase.firestore().collection('users').doc(id).delete();

    // Trigger row visual removal
    const row = document.getElementById(`user-row-${id}`);
    if (row) {
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => row.remove(), 300);
    }

    if (window.showToast) {
      window.showToast('User Profile Deleted', `User "${name}" has been removed from Firestore.`);
    } else {
      alert(`User profile deleted successfully!`);
    }

  } catch (err) {
    alert('Failed to delete user profile: ' + err.message);
  }
}

// Make globally available
window.viewOrdersForUser = viewOrdersForUser;
window.deleteUser = deleteUser;
