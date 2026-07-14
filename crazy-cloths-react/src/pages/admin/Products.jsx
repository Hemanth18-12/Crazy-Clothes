import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CONFIG } from '../../config';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminProducts() {
  const { currentUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Panel state (slide-in)
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [formCategory, setFormCategory] = useState('catalog');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Oversized T-Shirt');
  const [formColor, setFormColor] = useState('white');
  const [formPrice, setFormPrice] = useState(499);
  const [formStockCount, setFormStockCount] = useState('');
  const [formInStock, setFormInStock] = useState(true);
  const [formCustomizable, setFormCustomizable] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Inline delete confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Inline price edit states
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceVal, setEditingPriceVal] = useState(499);

  // Sort mode
  const [sortMode, setSortMode] = useState('sortOrder'); // 'sortOrder' | 'wishlistCount' | 'price'

  // Stock alert modal for back-in-stock notifications
  const [stockAlertModal, setStockAlertModal] = useState(null); // { product, wishlisted: [] }
  const [stockAlertIdx, setStockAlertIdx] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Crazy Cloths — Products Catalog';

    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Initial sort by sortOrder — user can override via sortMode
        list.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching products:', err);
      }
    );

    return unsubscribe;
  }, []);

  // Highlight / Scroll to product if redirected from dashboard
  useEffect(() => {
    const scrollId = sessionStorage.getItem('cc_scroll_product_id');
    if (scrollId && products.length > 0) {
      sessionStorage.removeItem('cc_scroll_product_id');
      setTimeout(() => {
        const el = document.getElementById(`product-card-${scrollId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.borderColor = 'var(--a-red)';
          setTimeout(() => {
            el.style.borderColor = '';
          }, 2000);
        }
      }, 500);
    }
  }, [products]);

  const logAdminAction = async (action, targetId, targetLabel) => {
    try {
      const email = currentUser?.email || 'admin@crazycloths.com';
      const name = currentUser?.displayName || email.split('@')[0];

      await addDoc(collection(db, 'activityLog'), {
        adminEmail: email,
        adminName: name,
        action,
        targetType: 'products',
        targetId: targetId || '',
        targetLabel: targetLabel || '',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Activity logging failed:', err);
    }
  };

  const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`;
      const fd = new FormData();
      fd.append('file', file);
      fd.append(
        'upload_preset',
        CONFIG.cloudinary.productUploadPreset || CONFIG.cloudinary.uploadPreset
      );
      fd.append('folder', 'products');

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
  };

  const handleOpenPanel = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormCategory(product.category || 'catalog');
      setFormName(product.name || '');
      setFormType(product.type || 'Oversized T-Shirt');
      setFormColor(product.color || 'white');
      setFormPrice(product.price || 499);
      setFormStockCount(product.stockCount !== undefined && product.stockCount !== null ? product.stockCount.toString() : '');
      setFormInStock(product.stockStatus === 'inStock');
      setFormCustomizable(!!product.isCustomizable);
      setUploadPreview(product.imageUrl || '');
      setSelectedFile(null);
    } else {
      setEditingProduct(null);
      setFormCategory('catalog');
      setFormName('');
      setFormType('Oversized T-Shirt');
      setFormColor('white');
      setFormPrice(499);
      setFormStockCount('');
      setFormInStock(true);
      setFormCustomizable(false);
      setUploadPreview('');
      setSelectedFile(null);
    }
    setPanelOpen(true);
  };

  const handleCategoryChange = (val) => {
    setFormCategory(val);
    if (val === 'customizable') {
      setFormCustomizable(true);
    } else {
      setFormCustomizable(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    const isCustom = formCategory === 'customizable';
    let finalName = formName;

    if (isCustom) {
      finalName = formColor === 'black' ? 'Black Vision Tee' : 'White Vision Tee';
    }

    if (!isCustom && !finalName) {
      alert('Product name is required for catalog items.');
      return;
    }

    setIsUploading(true);

    let imageUrl = editingProduct ? editingProduct.imageUrl : '';
    let cloudinaryPublicId = editingProduct ? editingProduct.cloudinaryPublicId : '';

    if (selectedFile) {
      try {
        const result = await uploadToCloudinary(selectedFile);
        imageUrl = result.secure_url;
        cloudinaryPublicId = result.public_id;
      } catch (err) {
        alert('Image upload failed: ' + err.message);
        setIsUploading(false);
        return;
      }
    }

    if (!isCustom && !imageUrl) {
      alert('Please upload a product image for catalog items.');
      setIsUploading(false);
      return;
    }

    try {
      const stockCountVal = formStockCount.trim() !== '' ? parseInt(formStockCount, 10) : null;
      const productData = {
        name: finalName,
        type: isCustom ? 'T-Shirt' : formType,
        color: formColor,
        price: parseInt(formPrice, 10) || 499,
        stockStatus: formInStock ? 'inStock' : 'outOfStock',
        stockCount: stockCountVal,
        isCustomizable: isCustom ? true : formCustomizable,
        category: formCategory,
        imageUrl: imageUrl || '',
        cloudinaryPublicId: cloudinaryPublicId || ''
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        await logAdminAction('updated product', editingProduct.id, `"${finalName}"`);
        window.showAdminToast('Product Updated', `"${finalName}" was successfully modified.`);
      } else {
        productData.sortOrder = Date.now();
        productData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'products'), productData);
        await logAdminAction('added product', docRef.id, `"${finalName}" (${formCategory})`);
        window.showAdminToast('Product Added', `"${finalName}" was added to the catalog.`);
      }

      setPanelOpen(false);
    } catch (err) {
      console.error('Firestore save failed:', err);
      alert('Failed to save product: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleStock = async (productId, currentStatus) => {
    const newStatus = currentStatus === 'inStock' ? 'outOfStock' : 'inStock';
    try {
      const docSnap = await getDoc(doc(db, 'products', productId));
      const name = docSnap.exists() ? docSnap.data().name : 'Product';

      await updateDoc(doc(db, 'products', productId), {
        stockStatus: newStatus
      });

      await logAdminAction('toggled stock', productId, `of "${name}" to ${newStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}`);
      window.showAdminToast('Stock Updated', `"${name}" marked as ${newStatus === 'inStock' ? 'In Stock' : 'Out of Stock'}.`);

      // If toggled to inStock — check for wishlisted customers to notify
      if (newStatus === 'inStock') {
        try {
          const wishSnap = await getDocs(collection(db, 'productWishlists', productId, 'users'));
          const wishlisted = [];
          wishSnap.forEach((d) => wishlisted.push({ id: d.id, ...d.data() }));
          if (wishlisted.length > 0) {
            setStockAlertModal({ product: { id: productId, name, ...docSnap.data() }, wishlisted });
            setStockAlertIdx(0);
          }
        } catch (_) {
          // productWishlists may not exist yet — ignore
        }
      }
    } catch (err) {
      console.error('Stock toggle failed:', err);
      alert('Stock toggle failed: ' + err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const docSnap = await getDoc(doc(db, 'products', productId));
      const name = docSnap.exists() ? docSnap.data().name : 'Product';

      await deleteDoc(doc(db, 'products', productId));
      await logAdminAction('deleted product', productId, `"${name}"`);
      window.showAdminToast('Product Deleted', `"${name}" was removed from the catalog.`, 'error');
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete product failed:', err);
      alert('Delete product failed: ' + err.message);
    }
  };

  const handleInlinePriceSave = async (productId, currentPrice) => {
    const priceVal = parseInt(editingPriceVal, 10);
    if (isNaN(priceVal) || priceVal === currentPrice) {
      setEditingPriceId(null);
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, 'products', productId));
      const name = docSnap.exists() ? docSnap.data().name : 'Product';

      await updateDoc(doc(db, 'products', productId), {
        price: priceVal
      });

      await logAdminAction('updated price', productId, `of "${name}" to ₹${priceVal}`);
      window.showAdminToast('Price Updated', `Price changed to ₹${priceVal}`);
      setEditingPriceId(null);
    } catch (err) {
      console.error('Failed to update price inline:', err);
      alert('Failed to update price: ' + err.message);
      setEditingPriceId(null);
    }
  };

  const renderCardImage = (p) => {
    if (p.imageUrl) return p.imageUrl;
    return p.color === 'black'
      ? '/assets/images/black-t-shirt.png'
      : '/assets/images/white-t-shirt.png';
  };

  // Compute display-sorted list
  const displayProducts = [...products].sort((a, b) => {
    if (sortMode === 'wishlistCount') return (b.wishlistCount || 0) - (a.wishlistCount || 0);
    if (sortMode === 'price') return (b.price || 0) - (a.price || 0);
    return (b.sortOrder || 0) - (a.sortOrder || 0);
  });

  return (
    <AdminLayout title="Products Catalog">
      {/* HEADER CONTROL BAR */}
      <div
        className="admin-table-card"
        style={{
          marginBottom: '28px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--a-text2)' }}>
          Catalog Size: <strong>{products.length}</strong> items
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Sort Mode */}
          <select
            className="admin-form-select"
            style={{ padding: '6px 10px', fontSize: '0.72rem', fontFamily: 'var(--a-font-mono)', height: 'auto' }}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="sortOrder">Sort: Default</option>
            <option value="wishlistCount">Sort: Most Wishlisted</option>
            <option value="price">Sort: Price (High-Low)</option>
          </select>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--a-border)', borderRadius: '2px', overflow: 'hidden' }}>
            <button
              className={`admin-btn ${viewMode === 'grid' ? 'red' : ''}`}
              style={{ border: 'none', padding: '6px 12px' }}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={`admin-btn ${viewMode === 'list' ? 'red' : ''}`}
              style={{ border: 'none', padding: '6px 12px' }}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
          <button className="admin-btn red" onClick={() => handleOpenPanel()}>
            ➕ Add Product
          </button>
        </div>
      </div>

      {/* PRODUCTS RESPONSIVE GRID / LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h3>Loading products catalog...</h3>
        </div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">👕</div>
          <div className="admin-empty-title">Catalog is Empty</div>
          <div className="admin-empty-text">Click Add Product to start building your catalog.</div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="admin-products-grid">
          {displayProducts.map((p) => {
            const isLowStock =
              p.stockCount !== undefined && p.stockCount !== null && p.stockCount <= 5;
            const isInStock = p.stockStatus === 'inStock';
            const catLabel = p.category === 'customizable' ? 'Custom Tee' : 'Catalog';

            return (
              <div
                key={p.id}
                className="admin-product-card"
                id={`product-card-${p.id}`}
                style={{ position: 'relative' }}
              >
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <img className="admin-product-img" src={renderCardImage(p)} alt={p.name} loading="lazy" />
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(5, 5, 5, 0.85)',
                      border: '1px solid var(--a-border)',
                      fontFamily: 'var(--a-font-mono)',
                      fontSize: '0.55rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      color: p.category === 'customizable' ? 'var(--a-yellow)' : 'var(--a-red)'
                    }}
                  >
                    {catLabel}
                  </span>
                </div>

                <div className="admin-product-info">
                  <div className="admin-product-name" title={p.name}>
                    {p.name}
                  </div>
                  <div className="admin-product-meta">
                    {p.type || 'T-Shirt'} · {p.color || 'white'}
                  </div>

                  {/* Inline Price Editor */}
                  {editingPriceId === p.id ? (
                    <input
                      type="number"
                      className="admin-form-input"
                      style={{ width: '80px', padding: '4px 8px', fontFamily: 'var(--a-font-mono)', height: 'auto', marginBottom: '12px' }}
                      value={editingPriceVal}
                      onChange={(e) => setEditingPriceVal(e.target.value)}
                      onBlur={() => handleInlinePriceSave(p.id, p.price)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlinePriceSave(p.id, p.price);
                        if (e.key === 'Escape') setEditingPriceId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="admin-product-price"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setEditingPriceId(p.id);
                        setEditingPriceVal(p.price || 499);
                      }}
                    >
                      ₹{p.price || 499}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span className={`admin-status ${isInStock ? 'delivered' : 'pending'}`}>
                      {isInStock ? 'In Stock' : 'Out of'}
                    </span>
                    {isLowStock && (
                      <span className="admin-status pending">
                        Low: {p.stockCount} left
                      </span>
                    )}
                    {/* Wishlist badge */}
                    {(p.wishlistCount || 0) > 0 && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        fontFamily: 'var(--a-font-mono)', fontSize: '0.58rem',
                        color: 'var(--a-red)', background: 'rgba(255,26,26,0.1)',
                        border: '1px solid rgba(255,26,26,0.25)', padding: '4px 8px', borderRadius: '2px'
                      }}>
                        ♥ {p.wishlistCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-product-actions" style={{ padding: '0 14px 14px' }}>
                  <button className="admin-btn" style={{ padding: '6px', flex: 1 }} onClick={() => handleOpenPanel(p)}>Edit</button>
                  <button className="admin-btn" style={{ padding: '6px', flex: 1 }} onClick={() => handleToggleStock(p.id, p.stockStatus)}>Stock</button>
                  <button className="admin-btn danger" style={{ padding: '6px' }} onClick={() => setDeleteConfirmId(p.id)}>
                    🗑️
                  </button>
                </div>

                {/* Inline Delete Confirmation Overlay */}
                {deleteConfirmId === p.id && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(5, 5, 5, 0.95)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      zIndex: 10
                    }}
                  >
                    <p style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--a-red)' }}>Are you sure?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="admin-btn danger"
                        style={{ padding: '4px 12px' }}
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        Yes
                      </button>
                      <button
                        className="admin-btn"
                        style={{ padding: '4px 12px' }}
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Color</th>
                  <th>Price</th>
                  <th>Stock Status</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isInStock = p.stockStatus === 'inStock';
                  const isLowStock = p.stockCount !== undefined && p.stockCount !== null && p.stockCount <= 5;
                  return (
                    <tr key={p.id}>
                      <td>
                        <img
                          src={renderCardImage(p)}
                          alt={p.name}
                          style={{ width: '32px', height: '40px', objectFit: 'cover', border: '1px solid var(--a-border)' }}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.type || 'T-Shirt'}</td>
                      <td style={{ textTransform: 'uppercase', fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem' }}>{p.color}</td>
                      <td style={{ fontFamily: 'var(--a-font-mono)', fontWeight: 600 }}>
                        {editingPriceId === p.id ? (
                          <input
                            type="number"
                            className="admin-form-input"
                            style={{ width: '80px', padding: '4px 8px', fontFamily: 'var(--a-font-mono)', height: 'auto' }}
                            value={editingPriceVal}
                            onChange={(e) => setEditingPriceVal(e.target.value)}
                            onBlur={() => handleInlinePriceSave(p.id, p.price)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleInlinePriceSave(p.id, p.price);
                              if (e.key === 'Escape') setEditingPriceId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setEditingPriceId(p.id);
                              setEditingPriceVal(p.price || 499);
                            }}
                          >
                            ₹{p.price || 499}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span className={`admin-status ${isInStock ? 'delivered' : 'pending'}`}>
                            {isInStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                          {isLowStock && (
                            <span className="admin-status pending">
                              Low: {p.stockCount} left
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', color: p.category === 'customizable' ? 'var(--a-yellow)' : 'var(--a-text2)' }}>
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="admin-btn" style={{ padding: '4px 8px' }} onClick={() => handleOpenPanel(p)}>Edit</button>
                          <button className="admin-btn" style={{ padding: '4px 8px' }} onClick={() => handleToggleStock(p.id, p.stockStatus)}>Toggle Stock</button>
                          <button className="admin-btn danger" style={{ padding: '4px 8px' }} onClick={() => handleDeleteProduct(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLIDE-IN PANEL BACKDROP */}
      {panelOpen && (
        <div className="admin-slide-panel-backdrop" onClick={() => setPanelOpen(false)}></div>
      )}

      {/* SLIDE-IN PANEL FOR ADD / EDIT */}
      <div className={`admin-slide-panel ${panelOpen ? 'active' : ''}`}>
        <div className="admin-panel-header">
          <h3 className="admin-panel-title">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button className="admin-panel-close" onClick={() => setPanelOpen(false)}>
            &times;
          </button>
        </div>

        <div className="admin-panel-body">
          <form onSubmit={handleSaveProduct}>
            {/* Category */}
            <div className="admin-form-group">
              <label className="admin-form-label">Category *</label>
              <select
                className="admin-form-select"
                value={formCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="catalog">Catalog Item (Pre-designed)</option>
                <option value="customizable">Customizable Blank (Template)</option>
              </select>
            </div>

            {/* Form Fields for Catalog only */}
            {formCategory === 'catalog' && (
              <>
                {/* Product Name */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Product Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Streetwear Oversized Tee"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                {/* Product Type */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Product Type *</label>
                  <select
                    className="admin-form-select"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="Oversized T-Shirt">Oversized T-Shirt</option>
                    <option value="Polo T-Shirt">Polo T-Shirt</option>
                    <option value="Round Neck T-Shirt">Round Neck T-Shirt</option>
                    <option value="Sleeveless T-Shirt">Sleeveless T-Shirt</option>
                    <option value="Full Sleeve T-Shirt">Full Sleeve T-Shirt</option>
                  </select>
                </div>
              </>
            )}

            {/* Color Selection */}
            <div className="admin-form-group">
              <label className="admin-form-label">Color *</label>
              <select
                className="admin-form-select"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
              >
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="navy">Navy Blue</option>
                <option value="grey">Grey</option>
                <option value="red">Red</option>
              </select>
            </div>

            {/* Price */}
            <div className="admin-form-group">
              <label className="admin-form-label">Price (₹) *</label>
              <input
                type="number"
                className="admin-form-input"
                min="1"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                required
              />
            </div>

            {/* Stock Count */}
            <div className="admin-form-group">
              <label className="admin-form-label">Stock Count (Optional)</label>
              <input
                type="number"
                className="admin-form-input"
                min="0"
                placeholder="Leave blank for unlimited"
                value={formStockCount}
                onChange={(e) => setFormStockCount(e.target.value)}
              />
            </div>

            {/* Switches */}
            <div style={{ display: 'flex', gap: '24px', margin: '20px 0' }}>
              {/* Stock Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="form-stock-switch"
                  checked={formInStock}
                  onChange={(e) => setFormInStock(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="form-stock-switch" className="admin-form-label" style={{ margin: 0, cursor: 'pointer' }}>In Stock</label>
              </div>

              {/* Customizable (catalog only) */}
              {formCategory === 'catalog' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="form-custom-switch"
                    checked={formCustomizable}
                    onChange={(e) => setFormCustomizable(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="form-custom-switch" className="admin-form-label" style={{ margin: 0, cursor: 'pointer' }}>Customizable</label>
                </div>
              )}
            </div>

            {/* Image Upload Zone (catalog only) */}
            {formCategory === 'catalog' && (
              <div className="admin-form-group">
                <label className="admin-form-label">Product Image *</label>
                <div
                  className="admin-upload-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="admin-upload-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '28px', height: '28px', margin: '0 auto' }}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <div className="admin-upload-text">Drag image here or click to browse</div>
                  <div className="admin-upload-sub">Supports PNG, JPG up to 10MB</div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {uploadPreview && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img src={uploadPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '110px', border: '1px solid var(--a-border)', objectFit: 'contain' }} />
                    <button type="button" className="admin-btn" style={{ padding: '4px 12px' }} onClick={clearFile}>Change Image</button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="admin-btn red"
              style={{ width: '100%', padding: '12px', marginTop: '16px' }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading & Saving...' : 'Save Product'}
            </button>
          </form>
        </div>
      </div>

      {/* STOCK ALERT MODAL — notify wishlisted customers when product restocked */}
      {stockAlertModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--a-surface)', border: '1px solid var(--a-border)',
            padding: '32px', maxWidth: '480px', width: '90%', position: 'relative'
          }}>
            <button
              onClick={() => setStockAlertModal(null)}
              style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: 'var(--a-text2)', fontSize: '1.4rem', cursor: 'pointer' }}
            >×</button>
            <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Back In Stock Alert
            </div>
            <h3 style={{ color: 'var(--a-text)', fontFamily: 'var(--a-font-display)', fontSize: '1.2rem', marginBottom: '4px' }}>
              {stockAlertModal.product.name}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--a-text2)', fontFamily: 'var(--a-font-mono)', marginBottom: '20px' }}>
              {stockAlertModal.wishlisted.length} customer{stockAlertModal.wishlisted.length !== 1 ? 's' : ''} wishlisted this product.
              Send them a WhatsApp notification one at a time.
            </p>

            {/* Progress */}
            <div style={{ background: 'var(--a-border)', borderRadius: '2px', height: '4px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((stockAlertIdx / stockAlertModal.wishlisted.length) * 100)}%`, height: '100%', background: 'var(--a-green)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text3)', marginBottom: '20px' }}>
              {stockAlertIdx} / {stockAlertModal.wishlisted.length} sent
            </div>

            {stockAlertIdx < stockAlertModal.wishlisted.length ? (
              <>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--a-surface2)', border: '1px solid var(--a-border)' }}>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.72rem', color: 'var(--a-text)', fontWeight: 600 }}>
                    {stockAlertModal.wishlisted[stockAlertIdx].name || 'Customer'}
                  </div>
                  <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.65rem', color: 'var(--a-text3)' }}>
                    {stockAlertModal.wishlisted[stockAlertIdx].phone || 'No phone'}
                  </div>
                </div>
                <button
                  className="admin-btn red"
                  style={{ width: '100%', padding: '12px' }}
                  onClick={() => {
                    const u = stockAlertModal.wishlisted[stockAlertIdx];
                    const phone = (u.phone || '').replace(/\D/g, '');
                    if (phone) {
                      const msg = `Hey ${u.name?.split(' ')[0] || 'there'}! 🔥 ${stockAlertModal.product.name} is back in stock on Crazy Cloths! Grab yours before it sells out: crazy-clothes.vercel.app`;
                      const formatted = phone.startsWith('91') ? phone : '91' + phone;
                      window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                    setStockAlertIdx((prev) => prev + 1);
                  }}
                >
                  📲 Send WhatsApp → Next ({stockAlertIdx + 1}/{stockAlertModal.wishlisted.length})
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                <div style={{ fontFamily: 'var(--a-font-mono)', fontSize: '0.75rem', color: 'var(--a-green)' }}>
                  All {stockAlertModal.wishlisted.length} customers notified!
                </div>
                <button className="admin-btn" style={{ marginTop: '16px', padding: '8px 24px' }} onClick={() => setStockAlertModal(null)}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
