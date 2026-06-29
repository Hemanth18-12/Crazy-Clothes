/**
 * Crazy Cloths — Dynamic Product Loader (Firestore)
 *
 * Loads products from Firestore and renders them into a container.
 * Falls back gracefully if Firebase is not configured.
 */

const ProductsService = {

  /**
   * Load in-stock products from Firestore and render into containerId.
   * @param {string} containerId  - ID of the grid container element
   * @param {function} onSelect   - Callback when a product card is clicked (product object)
   */
  async load(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show skeleton loaders while fetching
    this._showSkeletons(container, 4);

    if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) {
      // Firebase not configured — show empty state with a friendly message
      this._showEmpty(container);
      return;
    }

    try {
      const snapshot = await firebase.firestore()
        .collection('products')
        .where('stockStatus', '==', 'inStock')
        .orderBy('createdAt', 'desc')
        .get();

      container.innerHTML = ''; // clear skeletons

      if (snapshot.empty) {
        this._showEmpty(container);
        return;
      }

      snapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        const card = this._renderCard(product, onSelect);
        container.appendChild(card);
      });

      // Trigger scroll-reveal on newly inserted cards
      if (window.reinitScrollObserver) {
        window.reinitScrollObserver();
      }

    } catch (err) {
      console.error('Firestore product load failed:', err);
      this._showEmpty(container);
    }
  },

  /**
   * Renders a single product card DOM element.
   */
  _renderCard(product, onSelect) {
    const card = document.createElement('div');
    card.className = `product-card card-hover-lift reveal-on-scroll${product.color === 'black' ? ' product-card--black' : ''}`;
    card.dataset.productId = product.id;

    const stockBadge = product.stockStatus === 'inStock'
      ? '<span class="stock-badge in-stock">In Stock</span>'
      : '<span class="stock-badge out-of-stock">Out of Stock</span>';

    const customBadge = product.isCustomizable
      ? '<span class="custom-badge">✏️ Customizable</span>'
      : '';

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${product.imageUrl || 'assets/images/white-tee.png'}"
             alt="${product.name}" loading="lazy">
        <div class="product-badges">${stockBadge}${customBadge}</div>
      </div>
      <div class="product-info">
        <span class="product-meta">${product.type || 'T-Shirt'} · ${product.color ? product.color.charAt(0).toUpperCase() + product.color.slice(1) : ''}</span>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price">₹${product.price || 499}</div>
        <button class="btn btn-accent btn-press-feedback" style="margin-top:auto;"
                ${product.stockStatus !== 'inStock' ? 'disabled' : ''}>
          ${product.isCustomizable ? 'Customize & Order' : 'Order Now'}
        </button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof onSelect === 'function') onSelect(product);
    });

    return card;
  },

  /** Render grey skeleton placeholder cards */
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

  /** Show friendly empty state */
  _showEmpty(container) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1; text-align:center; padding: 3rem 1rem;">
        <p style="font-family:var(--font-display);font-size:2rem;color:var(--color-white);margin-bottom:0.5rem;">
          NEW STOCK DROPPING SOON
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
