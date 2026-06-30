/**
 * Crazy Cloths — Global Command Palette (Ctrl+K / Cmd+K Search)
 */

document.addEventListener('DOMContentLoaded', () => {
  createCommandPaletteMarkup();
  initCommandPaletteListeners();
});

// Cache variables for active session
let cmdCachedOrders = [];
let cmdCachedProducts = [];
let cmdCachedUsers = [];
let cmdActiveIndex = -1;
let cmdResultsList = [];

// ── Create HTML Structure Dynamically ─────────────────────────
function createCommandPaletteMarkup() {
  const backdrop = document.createElement('div');
  backdrop.id = 'cmd-backdrop';
  backdrop.className = 'cmd-backdrop';
  backdrop.innerHTML = `
    <div class="cmd-modal">
      <div class="cmd-input-wrap">
        <span class="cmd-search-icon">🔍</span>
        <input type="text" id="cmd-search-input" class="cmd-input" placeholder="Search orders, products, users..." autocomplete="off">
        <span class="cmd-esc-hint">ESC</span>
      </div>
      <div class="cmd-results" id="cmd-results-container">
        <div class="cmd-empty">Type anything to search...</div>
      </div>
      <div class="cmd-footer">
        <span><kbd>▲▼</kbd> Navigate</span>
        <span><kbd>Enter</kbd> Select</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  // Add trigger button to Topbar right (before clock/indicator)
  const topbarClock = document.getElementById('topbar-clock');
  const topbar = document.querySelector('.admin-topbar-right');
  if (topbar && topbarClock) {
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'cmd-palette-btn';
    triggerBtn.innerHTML = `
      <span>🔍 Search...</span>
      <kbd class="cmd-palette-kbd">Ctrl K</kbd>
    `;
    triggerBtn.addEventListener('click', () => toggleCommandPalette(true));
    topbar.insertBefore(triggerBtn, topbar.firstChild);
  }
}

// ── Initialize Event Listeners ──────────────────────────────
function initCommandPaletteListeners() {
  const backdrop = document.getElementById('cmd-backdrop');
  const input = document.getElementById('cmd-search-input');
  
  if (!backdrop || !input) return;

  // Toggle Command Palette on Ctrl/Cmd + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCommandPalette(true);
    }
  });

  // Close when clicking outside modal
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      toggleCommandPalette(false);
    }
  });

  // Debounced typing handler
  let debounceTimeout;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      performSearch(input.value.trim());
    }, 200);
  });

  // Arrow keys navigation
  input.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('.cmd-result-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      cmdActiveIndex = (cmdActiveIndex + 1) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cmdActiveIndex = (cmdActiveIndex - 1 + items.length) % items.length;
      updateActiveItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (cmdActiveIndex >= 0 && cmdActiveIndex < items.length) {
        items[cmdActiveIndex].click();
      }
    }
  });
}

// ── Toggle Visibility ─────────────────────────────────────────
async function toggleCommandPalette(show) {
  const backdrop = document.getElementById('cmd-backdrop');
  const input = document.getElementById('cmd-search-input');
  if (!backdrop || !input) return;

  if (show) {
    backdrop.classList.add('open');
    input.value = '';
    input.focus();
    cmdActiveIndex = -1;
    document.getElementById('cmd-results-container').innerHTML = '<div class="cmd-empty">Type anything to search...</div>';
    
    // Fetch and cache collections for this session to minimize subsequent reads
    fetchSearchCache();
  } else {
    backdrop.classList.remove('open');
  }
}

// ── Update Active Item Highlight ──────────────────────────────
function updateActiveItem(items) {
  items.forEach((item, index) => {
    if (index === cmdActiveIndex) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('active');
    }
  });
}

// ── Fetch Firebase Collections for cache ───────────────────────
async function fetchSearchCache() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;
  const db = firebase.firestore();

  try {
    // Parallel fetches
    const [ordersSnap, productsSnap, usersSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('products').get(),
      db.collection('users').get()
    ]);

    cmdCachedOrders = [];
    ordersSnap.forEach(doc => {
      cmdCachedOrders.push({ id: doc.id, ...doc.data() });
    });

    cmdCachedProducts = [];
    productsSnap.forEach(doc => {
      cmdCachedProducts.push({ id: doc.id, ...doc.data() });
    });

    cmdCachedUsers = [];
    usersSnap.forEach(doc => {
      cmdCachedUsers.push({ id: doc.id, ...doc.data() });
    });

  } catch (err) {
    console.warn("Failed to prefetch search cache:", err);
  }
}

// ── Perform Filtered Search ────────────────────────────────────
function performSearch(q) {
  const container = document.getElementById('cmd-results-container');
  if (!container) return;

  if (!q) {
    container.innerHTML = '<div class="cmd-empty">Type anything to search...</div>';
    cmdActiveIndex = -1;
    return;
  }

  q = q.toLowerCase();
  
  // 1. Filter Orders
  const orders = cmdCachedOrders.filter(o => 
    (o.orderId || '').toLowerCase().includes(q) || 
    (o.customerName || '').toLowerCase().includes(q)
  );

  // 2. Filter Products
  const products = cmdCachedProducts.filter(p => 
    (p.name || '').toLowerCase().includes(q)
  );

  // 3. Filter Users
  const users = cmdCachedUsers.filter(u => 
    (u.name || '').toLowerCase().includes(q) || 
    (u.email || '').toLowerCase().includes(q)
  );

  // Build Results HTML
  let html = '';
  cmdResultsList = []; // Flattened list for indexing

  // Add Orders Section
  if (orders.length > 0) {
    html += `<div class="cmd-group-header">Orders</div>`;
    orders.forEach(o => {
      const label = o.orderId || o.id.slice(0, 8);
      const title = `#CC-${label} — ${o.customerName || 'Anonymous'}`;
      const subtitle = `${o.productName || 'T-Shirt'} · ₹${o.price || 499}`;
      cmdResultsList.push({ type: 'order', id: o.id });
      html += `
        <div class="cmd-result-item" onclick="navigateSearchResult('order', '${o.id}')">
          <div class="cmd-result-icon">📦</div>
          <div>
            <div class="cmd-result-primary">${title}</div>
            <div class="cmd-result-secondary">${subtitle}</div>
          </div>
        </div>
      `;
    });
  }

  // Add Products Section
  if (products.length > 0) {
    html += `<div class="cmd-group-header">Products</div>`;
    products.forEach(p => {
      const title = p.name;
      const subtitle = `${p.type || 'T-Shirt'} · ₹${p.price || 499} · ${p.stockStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}`;
      cmdResultsList.push({ type: 'product', id: p.id });
      html += `
        <div class="cmd-result-item" onclick="navigateSearchResult('product', '${p.id}')">
          <div class="cmd-result-icon">👕</div>
          <div>
            <div class="cmd-result-primary">${title}</div>
            <div class="cmd-result-secondary">${subtitle}</div>
          </div>
        </div>
      `;
    });
  }

  // Add Users Section
  if (users.length > 0) {
    html += `<div class="cmd-group-header">Users</div>`;
    users.forEach(u => {
      const title = u.name || 'Anonymous';
      const subtitle = `${u.email || 'N/A'} · ${u.phone || 'N/A'}`;
      cmdResultsList.push({ type: 'user', id: u.id, email: u.email });
      html += `
        <div class="cmd-result-item" onclick="navigateSearchResult('user', '${u.id}', '${u.email}')">
          <div class="cmd-result-icon">👥</div>
          <div>
            <div class="cmd-result-primary">${title}</div>
            <div class="cmd-result-secondary">${subtitle}</div>
          </div>
        </div>
      `;
    });
  }

  if (cmdResultsList.length === 0) {
    container.innerHTML = `<div class="cmd-empty">No results found for "${q}"</div>`;
  } else {
    container.innerHTML = html;
  }
  cmdActiveIndex = -1;
}

// ── Search Action Navigation ──────────────────────────────────
function navigateSearchResult(type, id, extra) {
  toggleCommandPalette(false);

  if (type === 'order') {
    // If not already on orders page, redirect and open modal via sessionStorage
    if (document.body.dataset.page !== 'orders') {
      sessionStorage.setItem('cc_open_order_modal_id', id);
      window.location.href = 'orders.html';
    } else {
      if (window.openOrderModal) window.openOrderModal(id);
    }
  } 
  else if (type === 'product') {
    if (document.body.dataset.page !== 'products') {
      sessionStorage.setItem('cc_scroll_product_id', id);
      window.location.href = 'products.html';
    } else {
      focusAndHighlightProductCard(id);
    }
  } 
  else if (type === 'user') {
    if (document.body.dataset.page !== 'users') {
      sessionStorage.setItem('cc_filter_user_email', extra || '');
      window.location.href = 'users.html';
    } else {
      const searchInput = document.getElementById('user-search');
      if (searchInput) {
        searchInput.value = extra || '';
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  }
}
window.navigateSearchResult = navigateSearchResult;

// Auxiliary helper to scroll/highlight product card
function focusAndHighlightProductCard(id) {
  const card = document.getElementById(`product-card-${id}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('row-flash-green');
    setTimeout(() => card.classList.remove('row-flash-green'), 1200);
  }
}
window.focusAndHighlightProductCard = focusAndHighlightProductCard;
