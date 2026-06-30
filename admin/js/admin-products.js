/**
 * Crazy Cloths — Admin Products Logic (Redesigned with drag reorder, inline edit, and logging)
 */

let editingProductId = null;
let uploadedFile = null;
let currentImageUrl = '';
let currentCloudinaryPublicId = '';
let currentProductsView = localStorage.getItem('cc_products_view') || 'grid';

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
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; display:flex; flex-direction:column; gap:8px;">
        <div class="skeleton-product-card skeleton">
          <div class="skeleton-product-img skeleton"></div>
          <div class="skeleton-product-body">
            <div class="skeleton-line skeleton" style="width:60%;"></div>
            <div class="skeleton-line skeleton" style="width:40%;"></div>
          </div>
        </div>
      </div>
    `;

    // Listen to firestore snapshot (ordered by sortOrder if available, else by createdAt)
    db.collection('products')
      .onSnapshot(snapshot => {
        productsGrid.innerHTML = '';
        if (snapshot.empty) {
          productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
              <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color:var(--admin-text-muted); margin-bottom:1rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div style="font-weight:600; font-size:14px; margin-bottom:0.5rem; color:var(--admin-text-primary);">No products cataloged yet</div>
              <p style="color:var(--admin-text-muted); font-size:12px; margin-bottom:1.5rem;">Create your first product to display on the storefront.</p>
              <button class="admin-btn admin-btn-primary" onclick="toggleProductPanel(true)">Add First Product</button>
            </div>
          `;
          return;
        }

        // Convert snapshot docs to array and sort locally by sortOrder (asc) or createdAt (desc)
        const productsList = [];
        snapshot.forEach(doc => {
          productsList.push({ id: doc.id, ...doc.data() });
        });

        productsList.sort((a, b) => {
          const sortA = typeof a.sortOrder === 'number' ? a.sortOrder : 999999;
          const sortB = typeof b.sortOrder === 'number' ? b.sortOrder : 999999;
          if (sortA !== sortB) return sortA - sortB;
          
          const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : 0;
          const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : 0;
          return dateB - dateA;
        });

        productsList.forEach((product, index) => {
          createProductCard(product, productsGrid, index);
        });

        // Re-apply view preference (grid / list)
        setProductsView(currentProductsView);
      }, err => {
        console.error(err);
        productsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--admin-danger);">Failed to load products catalog.</div>';
      });
  }

  // Setup Form Submit
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', handleProductFormSubmit);
  }

  // Setup Drag and Drop Zone for image upload
  initDragAndDrop();

  // Load view preference on startup
  setProductsView(currentProductsView);

  // Check if deep linked from command palette search
  setTimeout(() => {
    const deepScrollId = sessionStorage.getItem('cc_scroll_product_id');
    if (deepScrollId) {
      sessionStorage.removeItem('cc_scroll_product_id');
      focusAndHighlightProductCard(deepScrollId);
    }
  }, 500);
}

// ── PRODUCTS GRID / LIST VIEW TOGGLE ───────────────────────
function setProductsView(view) {
  currentProductsView = view;
  localStorage.setItem('cc_products_view', view);
  
  const grid = document.getElementById('products-grid');
  const gridBtn = document.getElementById('btn-view-grid');
  const listBtn = document.getElementById('btn-view-list');
  if (!grid || !gridBtn || !listBtn) return;
  
  if (view === 'list') {
    grid.className = 'admin-products-list';
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  } else {
    grid.className = 'admin-products-grid';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  }
}
window.setProductsView = setProductsView;

// ── DRAG AND DROP CATALOG REORDERING ────────────────────────
let dragCardId = null;

function initDragAndDropReorder(card, productId) {
  card.setAttribute('draggable', 'true');
  
  card.addEventListener('dragstart', (e) => {
    dragCardId = productId;
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', productId);
  });
  
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    document.querySelectorAll('.admin-product-card').forEach(c => c.classList.remove('drag-over'));
  });
  
  card.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (dragCardId !== productId) {
      card.classList.add('drag-over');
    }
  });
  
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });
  
  card.addEventListener('drop', async (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    const droppedId = e.dataTransfer.getData('text/plain');
    
    if (droppedId && droppedId !== productId) {
      await swapProductSortOrder(droppedId, productId);
    }
  });
}

async function swapProductSortOrder(id1, id2) {
  if (typeof firebase === 'undefined') return;
  const db = firebase.firestore();
  
  try {
    const doc1 = await db.collection('products').doc(id1).get();
    const doc2 = await db.collection('products').doc(id2).get();
    if (!doc1.exists || !doc2.exists) return;
    
    const data1 = doc1.data();
    const data2 = doc2.data();
    
    // Assign values if they don't exist yet
    let sort1 = typeof data1.sortOrder === 'number' ? data1.sortOrder : Date.now();
    let sort2 = typeof data2.sortOrder === 'number' ? data2.sortOrder : Date.now() - 5000;
    
    // Swap the sort values
    const batch = db.batch();
    batch.update(db.collection('products').doc(id1), { sortOrder: sort2 });
    batch.update(db.collection('products').doc(id2), { sortOrder: sort1 });
    
    await batch.commit();
    showAdminToast("Catalog Reordered", `Swapped product indices successfully.`);
  } catch (err) {
    console.error("Catalog reordering failed:", err);
  }
}

// ── INLINE PRICE EDITING ────────────────────────────────────
function togglePriceInlineEdit(event, productId, currentPrice) {
  event.stopPropagation();
  const priceEl = event.target;
  if (priceEl.tagName === 'INPUT') return;

  const input = document.createElement('input');
  input.type = 'number';
  input.value = currentPrice;
  input.className = 'price-edit-input';
  
  const parent = priceEl.parentElement;
  priceEl.replaceWith(input);
  input.focus();
  input.select();

  const commitPrice = async () => {
    const newPrice = parseInt(input.value) || currentPrice;
    if (newPrice !== currentPrice) {
      try {
        await firebase.firestore().collection('products').doc(productId).update({
          price: newPrice
        });
        
        const newPriceEl = document.createElement('div');
        newPriceEl.className = 'admin-product-price price-save-flash';
        newPriceEl.textContent = `₹${newPrice}`;
        newPriceEl.addEventListener('click', (e) => togglePriceInlineEdit(e, productId, newPrice));
        input.replaceWith(newPriceEl);
        
        const doc = await firebase.firestore().collection('products').doc(productId).get();
        const name = doc.exists ? doc.data().name : 'Product';
        logAdminAction("updated price", "products", productId, `of "${name}" to ₹${newPrice}`);
        showAdminToast("Price Updated", `Price changed to ₹${newPrice}`);
      } catch (err) {
        alert("Failed to update price: " + err.message);
        restoreOriginalPrice();
      }
    } else {
      restoreOriginalPrice();
    }
  };

  const restoreOriginalPrice = () => {
    const originalPriceEl = document.createElement('div');
    originalPriceEl.className = 'admin-product-price';
    originalPriceEl.textContent = `₹${currentPrice}`;
    originalPriceEl.addEventListener('click', (e) => togglePriceInlineEdit(e, productId, currentPrice));
    input.replaceWith(originalPriceEl);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      commitPrice();
    } else if (e.key === 'Escape') {
      restoreOriginalPrice();
    }
  });

  input.addEventListener('blur', commitPrice);
}
window.togglePriceInlineEdit = togglePriceInlineEdit;

// ── DRAG AND DROP ZONE FOR IMAGE UPLOAD ──────────────────────
function initDragAndDrop() {
  const dropzone = document.getElementById('product-dropzone');
  const fileInput = document.getElementById('product-file-input');
  const previewContainer = document.getElementById('dropzone-preview-container');
  const previewImg = document.getElementById('dropzone-preview-img');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

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
    handleFiles(dt.files);
  }, false);

  function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    uploadedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'flex';
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

// ── FORM SUBMISSION (Add / Edit) ──────────────────────────
async function handleProductFormSubmit(e) {
  e.preventDefault();

  const categoryEl     = document.getElementById('product-category');
  const category       = categoryEl ? categoryEl.value : 'catalog';
  const isCustomizable = category === 'customizable';

  // For customizable blanks, name and type are auto-generated from color
  const colorEl  = document.getElementById('product-color');
  const color    = colorEl ? colorEl.value : 'white';
  const name     = isCustomizable
    ? `${color.charAt(0).toUpperCase() + color.slice(1)} Vision Tee`
    : (document.getElementById('product-name').value.trim() || '');
  const type     = isCustomizable
    ? 'Blank T-Shirt'
    : (document.getElementById('product-type').value || 'Oversized T-Shirt');
  const price    = parseInt(document.getElementById('product-price').value) || 499;
  const inStock  = document.getElementById('product-stock').checked;

  if (!isCustomizable && !name) {
    alert('Product name is required for catalog items.');
    return;
  }

  const saveBtn = document.getElementById('product-save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  let imageUrl              = currentImageUrl;
  let cloudinaryPublicId    = currentCloudinaryPublicId;

  if (uploadedFile) {
    try {
      const uploadPreset = CONFIG.cloudinary.productUploadPreset || CONFIG.cloudinary.uploadPreset;
      const result = await uploadToCloudinary(uploadedFile, uploadPreset, 'products');
      imageUrl           = result.secure_url;
      cloudinaryPublicId = result.public_id;
    } catch (err) {
      alert('Image upload failed: ' + err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
      return;
    }
  }

  // Catalog items always require an image; customizable blanks can fall back to static
  if (!isCustomizable && !imageUrl) {
    alert('Please upload a product image for catalog items.');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
    return;
  }

  const db = firebase.firestore();
  try {
    const productData = {
      name,
      type,
      color,
      price,
      stockStatus:        inStock ? 'inStock' : 'outOfStock',
      isCustomizable,
      category,
      imageUrl:           imageUrl || '',
      cloudinaryPublicId: cloudinaryPublicId || '',
      createdAt:          firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editingProductId) {
      await db.collection('products').doc(editingProductId).update(productData);
      logAdminAction("updated product", "products", editingProductId, `"${name}"`);
      showAdminToast("Product Updated", `"${name}" was successfully modified.`);
    } else {
      productData.sortOrder = Date.now();
      const docRef = await db.collection('products').add(productData);
      logAdminAction("added product", "products", docRef.id, `"${name}" (${category})`);
      showAdminToast("Product Added", `"${name}" was added to the catalog.`);
    }

    toggleProductPanel(false);
  } catch (err) {
    alert('Firestore operation failed: ' + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
}

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
    xhr.onerror = () => reject(new Error('Network error uploading image.'));
    xhr.send(fd);
  });
}

// ── CREATE PRODUCT CARD ────────────────────────────────────
function createProductCard(product, container, index) {
  const card = document.createElement('div');
  card.className = 'admin-product-card';
  card.id = `product-card-${product.id}`;
  
  card.style.opacity   = '0';
  card.style.transform = 'translateY(15px)';
  card.style.transition = 'opacity 0.4s var(--ease-admin), transform 0.4s var(--ease-admin), border-color 0.3s, box-shadow 0.3s';

  const priceVal  = product.price || 499;
  const isInStock = product.stockStatus === 'inStock';
  const category  = product.category || 'catalog';
  const catColor  = category === 'customizable' ? 'var(--admin-warning)' : 'var(--admin-accent)';
  const catLabel  = category === 'customizable' ? '✏️ Custom Blank' : '📦 Catalog';
  const imgSrc    = product.imageUrl || (product.color === 'black' ? '../assets/images/black-t-shirt.png' : '../assets/images/white-t-shirt.png');

  card.innerHTML = `
    <div class="admin-product-img">
      <img src="${imgSrc}" alt="${product.name}" loading="lazy">
      <div class="admin-product-badges">
        <span class="admin-card-badge" style="background:${catColor}22; color:${catColor};">${catLabel}</span>
      </div>
    </div>
    <div class="admin-product-details">
      <div class="admin-product-name" title="${product.name}">${product.name}</div>
      <div class="admin-product-meta">${product.type || 'T-Shirt'} · ${product.color || 'white'}</div>
      <!-- Click price to edit -->
      <div class="admin-product-price" style="cursor:pointer;" onclick="togglePriceInlineEdit(event, '${product.id}', ${priceVal})">₹${priceVal}</div>
      <div style="margin-top:0.4rem;">
        <span class="badge ${isInStock ? 'stock-in' : 'stock-out'}">
          ${isInStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
    </div>
    <div class="admin-product-card-actions">
      <button onclick="editProduct('${product.id}')">✏️ Edit</button>
      <button onclick="toggleStockStatus('${product.id}', '${product.stockStatus}')">🔌 Stock</button>
      <button class="btn-delete" onclick="showDeleteConfirm('${product.id}', true)">🗑️ Delete</button>
    </div>

    <!-- Inline delete confirmations -->
    <div class="admin-product-delete-confirm" id="delete-confirm-${product.id}">
      <p>Are you sure?</p>
      <div class="admin-product-delete-confirm-btns">
        <button class="admin-btn admin-btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deleteProduct('${product.id}', '${product.cloudinaryPublicId || product.publicId || ''}')">Yes</button>
        <button class="admin-btn admin-btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="showDeleteConfirm('${product.id}', false)">Cancel</button>
      </div>
    </div>
  `;

  container.appendChild(card);
  initDragAndDropReorder(card, product.id);

  setTimeout(() => {
    card.style.opacity   = '1';
    card.style.transform = 'translateY(0)';
  }, index * 45);
}

// ── TOGGLE STOCK STATUS ────────────────────────────────────
async function toggleStockStatus(id, currentStatus) {
  if (typeof firebase === 'undefined') return;
  const newStatus = currentStatus === 'inStock' ? 'outOfStock' : 'inStock';

  try {
    const doc = await firebase.firestore().collection('products').doc(id).get();
    const name = doc.exists ? doc.data().name : 'Product';
    
    await firebase.firestore().collection('products').doc(id).update({
      stockStatus: newStatus
    });
    
    logAdminAction("toggled stock", "products", id, `of "${name}" to ${newStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}`);
    showAdminToast("Stock Updated", `"${name}" marked as ${newStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}.`);
  } catch (err) {
    alert('Stock toggle failed: ' + err.message);
  }
}

function showDeleteConfirm(id, show) {
  const confirmArea = document.getElementById(`delete-confirm-${id}`);
  if (confirmArea) {
    if (show) confirmArea.classList.add('active');
    else confirmArea.classList.remove('active');
  }
}

// ── DELETE PRODUCT ─────────────────────────────────────────
async function deleteProduct(id, publicId) {
  if (typeof firebase === 'undefined') return;

  try {
    const doc = await firebase.firestore().collection('products').doc(id).get();
    const name = doc.exists ? doc.data().name : 'Product';

    await firebase.firestore().collection('products').doc(id).delete();

    const card = document.getElementById(`product-card-${id}`);
    if (card) {
      card.style.transform = 'scale(0.8)';
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 250);
    }

    logAdminAction("deleted product", "products", id, `"${name}"`);
    showAdminToast("Product Deleted", `"${name}" was removed from the catalog.`);
  } catch (err) {
    alert('Failed to delete product: ' + err.message);
  }
}

// ── EDIT PRODUCT FILL PANEL ────────────────────────────────
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

    document.getElementById('panel-title').textContent = 'Edit Product';
    document.getElementById('product-name').value  = data.name  || '';
    document.getElementById('product-type').value  = data.type  || 'Oversized T-Shirt';
    document.getElementById('product-color').value = data.color || 'white';
    document.getElementById('product-price').value = data.price || 499;
    document.getElementById('product-stock').checked  = data.stockStatus === 'inStock';
    document.getElementById('product-custom').checked = data.isCustomizable === true;

    // Category selector
    const catEl = document.getElementById('product-category');
    if (catEl) catEl.value = data.category || 'catalog';

    // Trigger form field visibility update
    if (window._updateCategoryFormFields) window._updateCategoryFormFields(data.category || 'catalog');

    currentImageUrl           = data.imageUrl || '';
    currentCloudinaryPublicId = data.cloudinaryPublicId || data.publicId || '';

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

    toggleProductPanel(true);
  } catch (err) {
    alert('Failed to load product details: ' + err.message);
  }
}

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

    setTimeout(() => {
      editingProductId = null;
      uploadedFile = null;
      currentImageUrl = '';
      currentCloudinaryPublicId = '';
      document.getElementById('panel-title').textContent = 'Add New Product';
      document.getElementById('product-form').reset();
      clearDragAndDrop();
    }, 300);
  }
}

// Global exports
window.toggleProductPanel = toggleProductPanel;
window.editProduct = editProduct;
window.toggleStockStatus = toggleStockStatus;
window.showDeleteConfirm = showDeleteConfirm;
window.deleteProduct = deleteProduct;
