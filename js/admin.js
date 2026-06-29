/**
 * Crazy Cloths — Admin Panel Logic
 *
 * Requires auth.js to be loaded first.
 * All write operations check admin session before executing.
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ── Guard: must be admin ─────────────────────────────────
  if (typeof AuthService !== 'undefined' && CONFIG.firebaseEnabled) {
    await AuthService.requireAdmin();
  }

  // Inject admin email into header
  const emailEl = document.getElementById('admin-email-display');
  if (emailEl) emailEl.textContent = AuthService.getEmail();

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => AuthService.logout());
  }

  // Route-specific init
  const page = document.body.dataset.page;
  if (page === 'dashboard') initDashboard();
  if (page === 'products')  initProducts();
});

// ────────────────────────────────────────────────────────────
//  DASHBOARD
// ────────────────────────────────────────────────────────────
async function initDashboard() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();

  // Total products
  try {
    const prodSnap = await db.collection('products').get();
    const el = document.getElementById('stat-total-products');
    if (el) el.textContent = prodSnap.size;
  } catch (e) { console.error(e); }

  // Orders today
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const ordSnap = await db.collection('orders')
      .where('createdAt', '>=', today.toISOString())
      .get();
    const el = document.getElementById('stat-orders-today');
    if (el) el.textContent = ordSnap.size;
  } catch (e) { console.error(e); }

  // Orders all time
  try {
    const allOrd = await db.collection('orders').get();
    const el = document.getElementById('stat-orders-total');
    if (el) el.textContent = allOrd.size;
  } catch (e) { console.error(e); }
}

// ────────────────────────────────────────────────────────────
//  PRODUCTS MANAGEMENT
// ────────────────────────────────────────────────────────────
function initProducts() {
  const addForm = document.getElementById('add-product-form');
  if (addForm) addForm.addEventListener('submit', handleAddProduct);
  loadAdminProducts();
}

async function handleAddProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('add-product-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const name     = document.getElementById('ap-name').value.trim();
  const type     = document.getElementById('ap-type').value;
  const color    = document.getElementById('ap-color').value;
  const price    = parseInt(document.getElementById('ap-price').value) || 499;
  const stock    = document.getElementById('ap-stock').value;
  const custom   = document.getElementById('ap-custom').value === 'yes';
  const fileEl   = document.getElementById('ap-image');
  const file     = fileEl && fileEl.files[0];

  let imageUrl    = '';
  let publicId    = '';

  // Upload product image to Cloudinary
  if (file) {
    try {
      const result = await uploadToCloudinary(file, CONFIG.cloudinary.productUploadPreset, 'products');
      imageUrl  = result.secure_url;
      publicId  = result.public_id;
    } catch (err) {
      showAdminMsg('add-product-msg', 'Image upload failed: ' + err.message, 'error');
      btn.disabled = false; btn.textContent = 'Add Product';
      return;
    }
  }

  // Save to Firestore
  try {
    const docRef = await firebase.firestore().collection('products').add({
      name, type, color, price,
      stockStatus: stock,
      isCustomizable: custom,
      imageUrl, publicId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showAdminMsg('add-product-msg', `Product "${name}" added successfully!`, 'success');
    rippleBurst(btn);
    e.target.reset();

    // Prepend the new card to the existing products grid
    prependProductCard({ id: docRef.id, name, type, color, price, stockStatus: stock, isCustomizable: custom, imageUrl });

  } catch (err) {
    showAdminMsg('add-product-msg', 'Firestore save failed: ' + err.message, 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Add Product';
}

function loadAdminProducts() {
  const grid = document.getElementById('admin-product-grid');
  if (!grid || typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  grid.innerHTML = '<p style="color:var(--color-text-secondary);font-family:var(--font-mono);">Loading products...</p>';

  firebase.firestore().collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      grid.innerHTML = '';
      if (snapshot.empty) {
        grid.innerHTML = '<p style="color:var(--color-text-secondary);font-family:var(--font-mono);">No products yet. Add one above.</p>';
        return;
      }
      snapshot.forEach(doc => {
        prependProductCard({ id: doc.id, ...doc.data() }, grid, false);
      });
    }, err => { console.error(err); });
}

function prependProductCard(product, container, animate = true) {
  const grid = container || document.getElementById('admin-product-grid');
  if (!grid) return;

  const card = document.createElement('div');
  card.className = 'admin-product-card' + (animate ? ' anim-slide-in-top' : '');
  card.id = `apcard-${product.id}`;
  card.innerHTML = `
    <div class="admin-product-img">
      ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}">` : '<div class="no-img">No Image</div>'}
    </div>
    <div class="admin-product-info">
      <strong>${product.name}</strong>
      <span>${product.type || ''} · ${product.color || ''}</span>
      <span>₹${product.price || 499}</span>
      <span class="stock-badge ${product.stockStatus === 'inStock' ? 'in-stock' : 'out-of-stock'}">
        ${product.stockStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}
      </span>
    </div>
    <div class="admin-product-actions">
      <button class="btn btn-secondary" onclick="toggleStock('${product.id}', '${product.stockStatus}')">Toggle Stock</button>
      <button class="btn btn-accent" onclick="deleteProduct('${product.id}', '${product.publicId || ''}')">Delete</button>
    </div>
  `;

  if (animate && grid.firstChild) {
    grid.insertBefore(card, grid.firstChild);
  } else {
    grid.appendChild(card);
  }
}

async function toggleStock(productId, currentStatus) {
  const newStatus = currentStatus === 'inStock' ? 'outOfStock' : 'inStock';
  try {
    await firebase.firestore().collection('products').doc(productId).update({ stockStatus: newStatus });
    // UI update: swap badge text
    const card = document.getElementById(`apcard-${productId}`);
    if (card) {
      const badge = card.querySelector('.stock-badge');
      badge.textContent = newStatus === 'inStock' ? 'In Stock' : 'Out of Stock';
      badge.className   = `stock-badge ${newStatus === 'inStock' ? 'in-stock' : 'out-of-stock'}`;
      const toggleBtn = card.querySelector('button');
      // Update the onclick with new status
      toggleBtn.setAttribute('onclick', `toggleStock('${productId}', '${newStatus}')`);
    }
  } catch (e) { alert('Failed to update stock: ' + e.message); }
}

async function deleteProduct(productId, cloudinaryPublicId) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await firebase.firestore().collection('products').doc(productId).delete();
    const card = document.getElementById(`apcard-${productId}`);
    if (card) card.remove();

    // Attempt Cloudinary delete (requires server-side signed request in production)
    if (cloudinaryPublicId) {
      console.log('Cloudinary publicId to delete:', cloudinaryPublicId,
        '— Signed deletion requires a server-side endpoint. See SETUP.md.');
    }
  } catch (e) { alert('Delete failed: ' + e.message); }
}

// ── Cloudinary upload helper ──────────────────────────────
function uploadToCloudinary(file, preset, folder) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
    const fd  = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    if (folder) fd.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(JSON.parse(xhr.responseText).error?.message || xhr.statusText));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

// ── UI helpers ────────────────────────────────────────────
function showAdminMsg(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `auth-message ${type} visible`;
  setTimeout(() => el.classList.remove('visible'), 5000);
}

function rippleBurst(btn) {
  const circle = document.createElement('span');
  circle.className = 'ripple-circle';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  circle.style.width  = circle.style.height = size + 'px';
  circle.style.left   = '50%';
  circle.style.top    = '50%';
  circle.style.marginLeft = circle.style.marginTop = -(size / 2) + 'px';
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 700);
}
