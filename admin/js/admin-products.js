/**
 * Crazy Cloths — Admin Products Logic
 */

let editingProductId = null;
let uploadedFile = null;
let currentImageUrl = '';
let currentCloudinaryPublicId = '';

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'products') {
    initProductsPage();
  }
});

function initProductsPage() {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;

  const db = firebase.firestore();

  // Load products list in real-time
  const productsGrid = document.getElementById('products-grid');
  if (productsGrid) {
    productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading products...</div>';

    db.collection('products')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        productsGrid.innerHTML = '';
        if (snapshot.empty) {
          productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--admin-text-muted);">No products found. Add one above!</div>';
          return;
        }

        snapshot.forEach((doc, index) => {
          const product = { id: doc.id, ...doc.data() };
          createProductCard(product, productsGrid, index);
        });
      }, err => {
        console.error(err);
        productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--admin-accent);">Failed to load products catalog.</div>';
      });
  }

  // Setup Form Submit
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', handleProductFormSubmit);
  }

  // Setup Drag and Drop Zone
  initDragAndDrop();
}

// ────────────────────────────────────────────────────────────
//  DRAG AND DROP ZONE
// ────────────────────────────────────────────────────────────
function initDragAndDrop() {
  const dropzone = document.getElementById('product-dropzone');
  const fileInput = document.getElementById('product-file-input');
  const previewContainer = document.getElementById('dropzone-preview-container');
  const previewImg = document.getElementById('dropzone-preview-img');

  if (!dropzone || !fileInput) return;

  // Click to select
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Drag events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }, false);

  function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    uploadedFile = file;

    // Show Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'flex';
      // Hide icon & instructions
      dropzone.querySelector('svg').style.display = 'none';
      dropzone.querySelector('span').style.display = 'none';
      dropzone.querySelector('p').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

function clearDragAndDrop() {
  uploadedFile = null;
  const dropzone = document.getElementById('product-dropzone');
  const previewContainer = document.getElementById('dropzone-preview-container');
  if (dropzone && previewContainer) {
    previewContainer.style.display = 'none';
    dropzone.querySelector('svg').style.display = 'block';
    dropzone.querySelector('span').style.display = 'block';
    dropzone.querySelector('p').style.display = 'block';
  }
}

// ────────────────────────────────────────────────────────────
//  FORM SUBMISSION (Add / Edit)
// ────────────────────────────────────────────────────────────
async function handleProductFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('product-name').value.trim();
  const type = document.getElementById('product-type').value;
  const color = document.getElementById('product-color').value;
  const price = parseInt(document.getElementById('product-price').value) || 499;
  const inStock = document.getElementById('product-stock').checked;
  const customizable = document.getElementById('product-custom').checked;

  const saveBtn = document.getElementById('product-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  let imageUrl = currentImageUrl;
  let publicId = currentCloudinaryPublicId;

  // 1. Upload image to Cloudinary if new file is selected
  if (uploadedFile) {
    try {
      const uploadPreset = CONFIG.cloudinary.productUploadPreset || CONFIG.cloudinary.uploadPreset;
      const result = await uploadToCloudinary(uploadedFile, uploadPreset, 'products');
      imageUrl = result.secure_url;
      publicId = result.public_id;
    } catch (err) {
      alert('Cloudinary upload failed: ' + err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
      return;
    }
  }

  if (!imageUrl) {
    alert('Please upload a product image.');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
    return;
  }

  // 2. Save to Firestore
  const db = firebase.firestore();
  try {
    const productData = {
      name,
      type,
      color,
      price,
      stockStatus: inStock ? 'inStock' : 'outOfStock',
      isCustomizable: customizable,
      imageUrl,
      publicId, // Cloudinary identifier
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editingProductId) {
      // Update
      await db.collection('products').doc(editingProductId).update(productData);
      showAdminToast('Product Updated', `"${name}" has been updated successfully.`);
    } else {
      // Add
      await db.collection('products').add(productData);
      showAdminToast('Product Added', `"${name}" has been added to catalog.`);
    }

    // Success: Close Panel & Reset Form
    toggleProductPanel(false);
  } catch (err) {
    alert('Firestore operation failed: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
}

// ────────────────────────────────────────────────────────────
//  CLOUDINARY HELPER
// ────────────────────────────────────────────────────────────
function uploadToCloudinary(file, preset, folder) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    if (folder) fd.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText).error?.message || xhr.statusText));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during image upload.'));
    xhr.send(fd);
  });
}

// ────────────────────────────────────────────────────────────
//  CREATE PRODUCT GRID CARDS
// ────────────────────────────────────────────────────────────
function createProductCard(product, container, index) {
  const card = document.createElement('div');
  card.className = 'admin-product-card';
  card.id = `product-card-${product.id}`;
  // Staggered slide up or simple fade animation can be added
  card.style.opacity = '0';
  card.style.transform = 'translateY(15px)';
  card.style.transition = 'opacity 0.4s ease, transform 0.4s ease, border-color 0.3s, box-shadow 0.3s';

  const priceVal = product.price || 499;
  const isCustom = product.isCustomizable === true;
  const isInStock = product.stockStatus === 'inStock';

  card.innerHTML = `
    <div class="admin-product-img">
      <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
      <div class="admin-product-badges">
        ${isCustom ? '<span class="admin-card-badge customizable">Custom</span>' : ''}
      </div>
    </div>
    <div class="admin-product-details">
      <div class="admin-product-name" title="${product.name}">${product.name}</div>
      <div class="admin-product-meta">${product.type || 'T-Shirt'} · ${product.color || 'white'}</div>
      <div class="admin-product-price">₹${priceVal}</div>
      <div style="margin-top:0.25rem;">
        <span class="badge ${isInStock ? 'stock-in' : 'stock-out'}">
          ${isInStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
    <div class="admin-product-card-actions">
      <button onclick="editProduct('${product.id}')">✏️ Edit</button>
      <button onclick="toggleStockStatus('${product.id}', '${product.stockStatus}')">📦 Stock</button>
      <button class="btn-delete" onclick="showDeleteConfirm('${product.id}', true)">🗑️ Delete</button>
    </div>

    <!-- Inline Confirmation -->
    <div class="admin-product-delete-confirm" id="delete-confirm-${product.id}">
      <p>Are you sure?</p>
      <div class="admin-product-delete-confirm-btns">
        <button class="admin-btn admin-btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deleteProduct('${product.id}', '${product.publicId || ''}')">Yes</button>
        <button class="admin-btn admin-btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="showDeleteConfirm('${product.id}', false)">Cancel</button>
      </div>
    </div>
  `;

  container.appendChild(card);
  
  // Animation delay trigger
  setTimeout(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, index * 50);
}

// ────────────────────────────────────────────────────────────
//  CARD ACTIONS
// ────────────────────────────────────────────────────────────
async function toggleStockStatus(id, currentStatus) {
  if (typeof firebase === 'undefined') return;
  const newStatus = currentStatus === 'inStock' ? 'outOfStock' : 'inStock';

  try {
    await firebase.firestore().collection('products').doc(id).update({
      stockStatus: newStatus
    });
    // The onSnapshot listener handles real-time visual updates automatically
  } catch (err) {
    alert('Stock toggle failed: ' + err.message);
  }
}

function showDeleteConfirm(id, show) {
  const confirmArea = document.getElementById(`delete-confirm-${id}`);
  if (confirmArea) {
    if (show) {
      confirmArea.classList.add('active');
    } else {
      confirmArea.classList.remove('active');
    }
  }
}

async function deleteProduct(id, publicId) {
  if (typeof firebase === 'undefined') return;

  try {
    // Delete from Firestore
    await firebase.firestore().collection('products').doc(id).delete();

    // Scale 1->0 transition before card goes away
    const card = document.getElementById(`product-card-${id}`);
    if (card) {
      card.style.transform = 'scale(0)';
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 300);
    }

    // Cloudinary signature deletion limit note
    if (publicId) {
      console.log(`Cloudinary deletion requested for: ${publicId}. ` +
                  `Note: Anonymous client side deletion of Cloudinary assets requires backend signed APIs.`);
    }

    showAdminToast('Product Deleted', 'The product was removed from catalog.');
  } catch (err) {
    alert('Failed to delete product: ' + err.message);
  }
}

// ────────────────────────────────────────────────────────────
//  EDIT PRODUCT FILL PANEL
// ────────────────────────────────────────────────────────────
async function editProduct(id) {
  if (typeof firebase === 'undefined') return;

  try {
    const doc = await firebase.firestore().collection('products').doc(id).get();
    if (!doc.exists) {
      alert('Product does not exist.');
      return;
    }

    const data = doc.data();
    editingProductId = id;

    // Prefill form
    document.getElementById('panel-title').textContent = 'Edit Product';
    document.getElementById('product-name').value = data.name || '';
    document.getElementById('product-type').value = data.type || 'Oversized T-Shirt';
    document.getElementById('product-color').value = data.color || 'white';
    document.getElementById('product-price').value = data.price || 499;
    document.getElementById('product-stock').checked = data.stockStatus === 'inStock';
    document.getElementById('product-custom').checked = data.isCustomizable === true;

    // Show current image preview
    currentImageUrl = data.imageUrl || '';
    currentCloudinaryPublicId = data.publicId || '';

    const previewContainer = document.getElementById('dropzone-preview-container');
    const previewImg = document.getElementById('dropzone-preview-img');
    const dropzone = document.getElementById('product-dropzone');

    if (currentImageUrl && previewContainer && previewImg && dropzone) {
      previewImg.src = currentImageUrl;
      previewContainer.style.display = 'flex';
      dropzone.querySelector('svg').style.display = 'none';
      dropzone.querySelector('span').style.display = 'none';
      dropzone.querySelector('p').style.display = 'none';
    }

    // Open panel
    toggleProductPanel(true);
  } catch (err) {
    alert('Failed to load product details: ' + err.message);
  }
}

// ────────────────────────────────────────────────────────────
//  UI HELPERS
// ────────────────────────────────────────────────────────────
function toggleProductPanel(show) {
  const panel = document.getElementById('product-slide-panel');
  const backdrop = document.getElementById('product-panel-backdrop');
  if (!panel) return;

  if (show) {
    panel.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
  } else {
    panel.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');

    // Reset panel state & inputs after sliding out
    setTimeout(() => {
      editingProductId = null;
      uploadedFile = null;
      currentImageUrl = '';
      currentCloudinaryPublicId = '';
      document.getElementById('panel-title').textContent = 'Add New Product';
      document.getElementById('product-form').reset();
      clearDragAndDrop();
    }, 400);
  }
}

function showAdminToast(title, msg) {
  // Leverage existing toast system in admin-orders.js
  if (window.showToast) {
    window.showToast(title, msg);
  } else {
    alert(`${title}: ${msg}`);
  }
}

// Make globally available
window.toggleProductPanel = toggleProductPanel;
window.editProduct = editProduct;
window.toggleStockStatus = toggleStockStatus;
window.showDeleteConfirm = showDeleteConfirm;
window.deleteProduct = deleteProduct;
