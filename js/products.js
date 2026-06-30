/**
 * Crazy Cloths — Dynamic Product Loader (Firestore)
 *
 * v2 — Live onSnapshot listener, category-split loading,
 *       animated new-arrival cards, console field warnings.
 *
 * Required Firestore schema per product document:
 * {
 *   name: string,
 *   type: string,
 *   color: string,            // "white" | "black" | ...
 *   price: number,
 *   imageUrl: string,
 *   cloudinaryPublicId: string,
 *   stockStatus: "inStock" | "outOfStock",
 *   isCustomizable: boolean,
 *   category: "catalog" | "customizable",
 *   sortOrder: number,
 *   createdAt: Firestore Timestamp
 * }
 */

const REQUIRED_FIELDS = [
  'name', 'type', 'color', 'price', 'imageUrl',
  'stockStatus', 'category', 'sortOrder', 'createdAt'
];

// Track IDs already rendered so we can animate new arrivals
const _renderedIds = new Set();

// ── WISHLIST REALTIME STATE SYNC ──────────────────────────────
window.userWishlistSet = new Set();

if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      firebase.firestore().collection('users').doc(user.uid).collection('wishlist')
        .onSnapshot((snapshot) => {
          window.userWishlistSet.clear();
          snapshot.forEach(doc => {
            window.userWishlistSet.add(doc.id);
          });
          // Update visual heart states
          document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
            const pid = btn.dataset.productId;
            if (window.userWishlistSet.has(pid)) {
              btn.classList.add('wishlisted');
            } else {
              btn.classList.remove('wishlisted');
            }
          });
        });
    } else {
      window.userWishlistSet.clear();
      document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
        btn.classList.remove('wishlisted');
      });
    }
  });
}

window.toggleProductWishlist = async function(event, productId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  if (typeof firebase === 'undefined') return;
  const user = firebase.auth().currentUser;
  if (!user) {
    sessionStorage.setItem('cc_redirect_after_login', window.location.href);
    window.location.href = 'login.html';
    return;
  }

  const btn = event ? event.currentTarget : null;
  if (btn) {
    btn.classList.add('pop-active');
    setTimeout(() => btn.classList.remove('pop-active'), 300);
  }

  const wishRef = firebase.firestore().collection('users').doc(user.uid).collection('wishlist').doc(productId);
  
  try {
    if (window.userWishlistSet.has(productId)) {
      await wishRef.delete();
    } else {
      await wishRef.set({
        addedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.error("Wishlist operation failed:", err);
  }
};


const ProductsService = {

  /**
   * Attach a live Firestore listener for catalog products (category == "catalog")
   * and render them into containerId. Calls onSelect when a card is clicked.
   *
   * Returns the unsubscribe function so callers can detach when needed.
   */
  loadCatalog(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return () => {};

    this._showSkeletons(container, 4);

    if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) {
      this._showEmpty(container, 'catalog');
      return () => {};
    }

    _renderedIds.clear();

    const unsub = firebase.firestore()
      .collection('products')
      .where('stockStatus', '==', 'inStock')
      .where('category', '==', 'catalog')
      .onSnapshot(
        (snapshot) => {
          if (snapshot.empty) {
            container.innerHTML = '';
            this._showEmpty(container, 'catalog');
            return;
          }

          // Client-side sort: sortOrder asc, createdAt desc as tiebreaker
          const docs = [];
          snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            this._warnMissingFields(data);
            docs.push(data);
          });

          docs.sort((a, b) => {
            const sA = typeof a.sortOrder === 'number' ? a.sortOrder : 999999;
            const sB = typeof b.sortOrder === 'number' ? b.sortOrder : 999999;
            if (sA !== sB) return sA - sB;
            const dA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : 0;
            const dB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : 0;
            return dB - dA;
          });

          // Determine which IDs are new (for animation)
          const newIds = new Set();
          docs.forEach(p => { if (!_renderedIds.has(p.id)) newIds.add(p.id); });

          // Full re-render (keeps order correct)
          container.innerHTML = '';
          docs.forEach((product) => {
            const isNew = newIds.has(product.id);
            const card = this._renderCard(product, onSelect, isNew);
            container.appendChild(card);
            _renderedIds.add(product.id);
          });

          if (window.reinitScrollObserver) window.reinitScrollObserver();
        },
        (err) => {
          console.error('Firestore catalog listener error:', err);
          this._showEmpty(container, 'catalog');
        }
      );

    return unsub;
  },

  /**
   * Attach a live Firestore listener for customizable products (category == "customizable").
   * These are always the two fixed blank-tee entries.
   */
  loadCustomizable(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return () => {};

    if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) {
      // Fallback: render the static white/black cards
      this._renderStaticCustomizables(container, onSelect);
      return () => {};
    }

    const unsub = firebase.firestore()
      .collection('products')
      .where('stockStatus', '==', 'inStock')
      .where('category', '==', 'customizable')
      .onSnapshot(
        (snapshot) => {
          container.innerHTML = '';
          if (snapshot.empty) {
            // Fallback to static cards if no customizable entries in Firestore
            this._renderStaticCustomizables(container, onSelect);
            return;
          }
          snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const card = this._renderCustomizableCard(product, onSelect);
            container.appendChild(card);
          });
          if (window.reinitScrollObserver) window.reinitScrollObserver();
        },
        (err) => {
          console.error('Firestore customizable listener error:', err);
          this._renderStaticCustomizables(container, onSelect);
        }
      );

    return unsub;
  },

  /** Legacy compat: loads catalog products only (used if called with old API) */
  async load(containerId, onSelect) {
    return this.loadCatalog(containerId, onSelect);
  },

  // ── CARD RENDERERS ───────────────────────────────────────────────────────

  _renderCard(product, onSelect, isNew = false) {
    const card = document.createElement('div');
    card.className = `product-card card-hover-lift reveal-on-scroll${product.color === 'black' ? ' product-card--black' : ''}`;
    card.dataset.productId = product.id;

    if (isNew) {
      // New-arrival animation: slide down + fade in
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(-20px)';
      card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        });
      });
    }

    const colorLabel = product.color
      ? product.color.charAt(0).toUpperCase() + product.color.slice(1)
      : '';

    const isWishlisted = window.userWishlistSet && window.userWishlistSet.has(product.id);
    const wishClass = isWishlisted ? ' wishlisted' : '';

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${product.imageUrl || 'assets/images/white-tee.png'}"
             alt="${product.name}" loading="lazy">
        <div class="product-badges">
          <span class="stock-badge in-stock">In Stock</span>
        </div>
        <button class="wishlist-heart-btn${wishClass}" aria-label="Toggle Wishlist" data-product-id="${product.id}" onclick="toggleProductWishlist(event, '${product.id}')">
          <svg viewBox="0 0 24 24" class="heart-icon">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="product-info">
        <span class="product-meta">${product.type || 'T-Shirt'} · ${colorLabel}</span>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price">₹${product.price || 499}</div>
        <button class="btn btn-accent btn-press-feedback" style="margin-top:auto;">
          Order Now
        </button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onSelect === 'function') onSelect(product);
    });
    card.addEventListener('click', () => {
      if (typeof onSelect === 'function') onSelect(product);
    });

    return card;
  },

  _renderCustomizableCard(product, onSelect) {
    const card = document.createElement('div');
    const isBlack = (product.color || '').toLowerCase() === 'black';
    card.className = `product-card card-hover-lift reveal-on-scroll${isBlack ? ' product-card--black' : ''}`;
    card.dataset.productId = product.id;

    const imgSrc = product.imageUrl
      || (isBlack ? 'assets/images/black-t-shirt.png' : 'assets/images/white-t-shirt.png');

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${imgSrc}" alt="${product.color} Custom T-Shirt" loading="lazy">
        <div class="product-badges">
          <span class="stock-badge in-stock">In Stock</span>
          <span class="custom-badge">✏️ Customizable</span>
        </div>
      </div>
      <div class="product-info">
        <span class="product-meta">Blank Tee · ${product.color ? product.color.charAt(0).toUpperCase() + product.color.slice(1) : ''}</span>
        <h3 class="product-title">${product.name || (isBlack ? 'Black Vision Tee' : 'White Vision Tee')}</h3>
        <div class="product-price">₹${product.price || 499}</div>
        <button class="btn btn-accent btn-press-feedback" style="margin-top:auto;">
          Customize &amp; Order
        </button>
      </div>
    `;

    const handler = () => { if (typeof onSelect === 'function') onSelect(product); };
    card.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); handler(); });
    card.addEventListener('click', handler);

    return card;
  },

  _renderStaticCustomizables(container, onSelect) {
    const statics = [
      { id: '__static_white', color: 'white', name: 'White Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: 'assets/images/white-t-shirt.png' },
      { id: '__static_black', color: 'black', name: 'Black Vision Tee', price: 499, category: 'customizable', stockStatus: 'inStock', isCustomizable: true, imageUrl: 'assets/images/black-t-shirt.png' }
    ];
    statics.forEach(product => {
      container.appendChild(this._renderCustomizableCard(product, onSelect));
    });
    if (window.reinitScrollObserver) window.reinitScrollObserver();
  },

  // ── UTILITIES ────────────────────────────────────────────────────────────

  _warnMissingFields(product) {
    const missing = REQUIRED_FIELDS.filter(f => product[f] === undefined || product[f] === null || product[f] === '');
    if (missing.length) {
      console.warn(
        `[ProductsService] Document "${product.id}" is missing required fields: ${missing.join(', ')}`,
        product
      );
    }
  },

  _showSkeletons(container, count) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const skel = document.createElement('div');
      skel.className = 'skeleton-card';
      skel.innerHTML = `
        <div class="skeleton-img"></div>
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line narrow"></div>
      `;
      container.appendChild(skel);
    }
  },

  _showEmpty(container, type) {
    const msg = type === 'customizable'
      ? 'Custom tees coming soon. 🔥'
      : 'NEW STOCK DROPPING SOON';
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1; text-align:center; padding:3rem 1rem;">
        <p style="font-family:var(--font-display);font-size:2rem;color:var(--color-white);margin-bottom:0.5rem;">
          ${msg}
        </p>
        <p style="font-family:var(--font-mono);font-size:0.85rem;color:var(--color-text-secondary);">
          Check back shortly. 🔥
        </p>
      </div>
    `;
  }
};

window.ProductsService = ProductsService;

// Re-run IntersectionObserver on dynamically added cards
window.reinitScrollObserver = function() {
  const newCards = document.querySelectorAll('.reveal-on-scroll:not(.observed)');
  if (!newCards.length) return;

  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        o.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  newCards.forEach(el => {
    el.classList.add('observed');
    obs.observe(el);
  });
};
