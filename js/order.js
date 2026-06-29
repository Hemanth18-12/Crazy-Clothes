/**
 * Crazy Cloths — Order Page Orchestrator & Form Validator
 *
 * Changes from v1:
 *  - Design upload is now OPTIONAL
 *  - Email field added to customer form
 *  - Calls WhatsAppService (owner + customer messages)
 *  - Calls EmailService.sendConfirmation()
 *  - Saves order to Firestore (if Firebase configured)
 *  - Login guard triggers only at submit time (browse freely)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ── DOM refs ─────────────────────────────────────────────
  const colorButtons   = document.querySelectorAll('.color-btn, .color-card-btn');
  const sizeButtons    = document.querySelectorAll('.size-btn, .size-box-btn');
  const qtyInput       = document.getElementById('qty-input');
  const nameInput      = document.getElementById('name-input');
  const emailInput     = document.getElementById('email-input');
  const phoneInput     = document.getElementById('phone-input');
  const addressInput   = document.getElementById('address-input');
  const notesInput     = document.getElementById('notes-input');
  const baseMockup     = document.getElementById('base-mockup');
  const orderForm      = document.getElementById('order-form');
  const placeOrderBtn  = document.getElementById('place-order-btn');
  const summaryColor   = document.getElementById('sum-color');
  const summarySize    = document.getElementById('sum-size');
  const summaryQty     = document.getElementById('sum-qty');
  const summaryDesign  = document.getElementById('sum-design');
  const summaryTotal   = document.getElementById('sum-total');
  const summaryName    = document.getElementById('sum-product-name');
  const designOverlay  = document.getElementById('design-overlay');

  // ── Internal state ───────────────────────────────────────
  let selectedColor   = 'white';
  let selectedSize    = 'Free Size';
  let selectedProduct = null; // set when user picks from Firestore grid

  init();

  // ────────────────────────────────────────────────────────
  function init() {
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setColor(btn.dataset.color);
        updateSummary();
        saveCurrentDraft();
      });
    });

    if (sizeButtons && sizeButtons.length > 0) {
      sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          setSize(btn.dataset.size);
          updateSummary();
          saveCurrentDraft();
        });
      });
    }

    [qtyInput, nameInput, emailInput, phoneInput, addressInput, notesInput].forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        updateSummary();
        saveCurrentDraft();
        const errEl = document.getElementById(`${input.id}-error`);
        if (errEl) { errEl.style.display = 'none'; input.classList.remove('input-invalid'); }
      });
    });

    window.triggerSummaryUpdate = () => { updateSummary(); saveCurrentDraft(); };

    restoreState();

    if (orderForm) {
      orderForm.addEventListener('submit', (e) => { e.preventDefault(); handleOrderSubmit(); });
    }
  }

  // ── Color / size setters ─────────────────────────────────
  function setColor(color) {
    if (selectedColor === color) return;
    selectedColor = color;
    colorButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.color === color));
    if (baseMockup) {
      baseMockup.style.opacity = '0';
      setTimeout(() => {
        baseMockup.src = color === 'black' ? 'assets/images/black-tee.png' : 'assets/images/white-tee.png';
        baseMockup.style.opacity = '1';
        const c = baseMockup.parentElement;
        c.classList.remove('pulse-active');
        void c.offsetWidth;
        c.classList.add('pulse-active');
      }, 200);
    }
  }

  function setSize(size) {
    selectedSize = size || 'Free Size';
    // Toggle active on both .size-btn and .size-box-btn
    document.querySelectorAll('.size-btn, .size-box-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === size);
    });
    const err = document.getElementById('size-error');
    if (err) err.style.display = 'none';
  }

  // ── Product selection from Firestore grid ─────────────────
  window.onProductSelected = function(product) {
    selectedProduct = product;
    setColor(product.color || 'white');
    updateSummary();
    // Scroll to the order form section
    const formSection = document.getElementById('order-form-section');
    if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Summary update ───────────────────────────────────────
  function getUnitPrice() {
    if (selectedProduct) return selectedProduct.price || 499;
    const priceConfig = CONFIG.pricing[selectedColor];
    return priceConfig ? priceConfig.base : 499;
  }

  function getCurrency() {
    const priceConfig = CONFIG.pricing[selectedColor];
    return (priceConfig && priceConfig.currency) ? priceConfig.currency : '₹';
  }

  function updateSummary() {
    const qty = parseInt((qtyInput && qtyInput.value) || 1) || 1;
    const unit = getUnitPrice();
    const currency = getCurrency();
    const total = unit * qty;

    if (summaryColor) summaryColor.textContent = selectedColor.toUpperCase();
    if (summarySize)  summarySize.textContent  = selectedSize || 'None Selected';
    if (summaryQty)   summaryQty.textContent   = qty;
    if (summaryTotal) summaryTotal.innerHTML   = `<span>${currency}${total}</span>`;
    if (summaryName)  summaryName.textContent  = selectedProduct ? selectedProduct.name : `${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} T-Shirt`;

    const cUrl = window.UploaderState ? window.UploaderState.getCloudinaryUrl() : null;
    if (summaryDesign) {
      if (cUrl) {
        summaryDesign.innerHTML = `<img src="${cUrl}" alt="Design" style="max-height:48px;max-width:48px;object-fit:contain;border:1px solid var(--color-border);padding:2px;">`;
      } else {
        const fileInput = document.getElementById('file-input');
        summaryDesign.textContent = (fileInput && fileInput.files[0]) ? 'Uploading...' : 'No Design (Optional)';
      }
    }
  }

  // ── State persistence ────────────────────────────────────
  function restoreState() {
    const draft = CartManager.getDraft();
    const urlParams = new URLSearchParams(window.location.search);
    const colorParam = urlParams.get('color');

    if (draft) {
      setColor(draft.color || 'white');
      if (draft.size) setSize(draft.size);
      if (qtyInput)     qtyInput.value     = draft.quantity || 1;
      if (nameInput)    nameInput.value    = draft.customerName || '';
      if (emailInput)   emailInput.value   = draft.customerEmail || '';
      if (phoneInput)   phoneInput.value   = draft.customerPhone || '';
      if (addressInput) addressInput.value = draft.customerAddress || '';
      if (notesInput)   notesInput.value   = draft.specialInstructions || '';

      if (draft.cloudinaryUrl && window.UploaderState) {
        window.UploaderState.setCloudinaryUrl(draft.cloudinaryUrl);
        if (designOverlay) { designOverlay.src = draft.cloudinaryUrl; designOverlay.style.display = 'block'; }
        const thumb = document.getElementById('preview-thumbnail');
        const previewCont = document.getElementById('upload-preview-container');
        if (thumb && previewCont) {
          thumb.src = draft.cloudinaryUrl;
          previewCont.classList.add('active');
          ['upload-icon','upload-text','upload-subtext'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
          });
        }
      }
    } else if (colorParam === 'white' || colorParam === 'black') {
      setColor(colorParam);
    } else {
      setColor('white');
    }
    updateSummary();
  }

  function saveCurrentDraft() {
    CartManager.saveDraft({
      color: selectedColor,
      size: selectedSize,
      quantity: parseInt((qtyInput && qtyInput.value) || 1) || 1,
      cloudinaryUrl: window.UploaderState ? window.UploaderState.getCloudinaryUrl() : null,
      customerName:  nameInput    ? nameInput.value    : '',
      customerEmail: emailInput   ? emailInput.value   : '',
      customerPhone: phoneInput   ? phoneInput.value   : '',
      customerAddress: addressInput ? addressInput.value : '',
      specialInstructions: notesInput ? notesInput.value : ''
    });
  }

  // ── Submit handler ───────────────────────────────────────
  async function handleOrderSubmit() {
    let isValid = true;

    // Login guard — require auth before placing order
    if (typeof AuthService !== 'undefined' && CONFIG.firebaseEnabled) {
      const user = await new Promise(resolve => {
        if (typeof firebase === 'undefined') { resolve(null); return; }
        firebase.auth().onAuthStateChanged(u => resolve(u));
      });
      if (!user) {
        sessionStorage.setItem('cc_redirect_after_login', window.location.href);
        window.location.href = 'login.html';
        return;
      }
    }

    // Validate size (always Free Size, so always valid)

    // Design upload — optional, but block if mid-upload
    if (window.UploaderState && window.UploaderState.getIsUploading()) {
      showErr('upload-error', 'Design still uploading, please wait...');
      isValid = false;
    }

    // Required fields
    if (!nameInput || !nameInput.value.trim()) {
      showErr('name-input-error', 'Full Name is required.');
      if (nameInput) nameInput.classList.add('input-invalid');
      isValid = false;
    }
    if (!phoneInput || !phoneInput.value.trim()) {
      showErr('phone-input-error', 'Phone number is required.');
      if (phoneInput) phoneInput.classList.add('input-invalid');
      isValid = false;
    }
    if (!addressInput || !addressInput.value.trim()) {
      showErr('address-input-error', 'Delivery address is required.');
      if (addressInput) addressInput.classList.add('input-invalid');
      isValid = false;
    }
    const qty = parseInt((qtyInput && qtyInput.value) || 0);
    if (isNaN(qty) || qty < 1) {
      showErr('qty-input-error', 'Quantity must be at least 1.');
      if (qtyInput) qtyInput.classList.add('input-invalid');
      isValid = false;
    }

    if (!isValid) {
      const firstInvalid = document.querySelector('.input-invalid, .form-input-error[style*="block"]');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Disable button
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Redirecting to WhatsApp...';

    // Build order object
    const timestamp  = Date.now();
    const random     = Math.floor(1000 + Math.random() * 9000);
    const orderId    = `CC-${timestamp}-${random}`;
    const unit       = getUnitPrice();
    const currency   = getCurrency();
    const totalFormatted = `${currency}${unit * qty}`;

    const finalOrder = {
      orderId,
      productName:         selectedProduct ? selectedProduct.name : `${selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)} T-Shirt`,
      productId:           selectedProduct ? selectedProduct.id : null,
      color:               selectedColor,
      size:                selectedSize,
      quantity:            qty,
      price:               unit * qty,
      cloudinaryUrl:       window.UploaderState ? (window.UploaderState.getCloudinaryUrl() || null) : null,
      customerName:        nameInput    ? nameInput.value.trim()    : '',
      customerEmail:       emailInput   ? emailInput.value.trim()   : '',
      customerPhone:       phoneInput   ? phoneInput.value.trim()   : '',
      customerAddress:     addressInput ? addressInput.value.trim() : '',
      specialInstructions: notesInput   ? notesInput.value.trim()   : '',
      createdAt:           new Date().toISOString()
    };

    // 1. Save to localStorage for success page
    try {
      localStorage.setItem('crazy_cloths_last_order', JSON.stringify({
        orderId, total: totalFormatted,
        productName: finalOrder.productName,
        color: finalOrder.color, size: finalOrder.size, quantity: finalOrder.quantity
      }));
      CartManager.clearDraft();
    } catch (e) { console.error(e); }

    // 2. Save to Firestore (silent fail)
    if (CONFIG.firebaseEnabled && typeof firebase !== 'undefined') {
      try {
        await firebase.firestore().collection('orders').add(finalOrder);
      } catch (e) { console.error('Firestore order save failed:', e); }
    }

    // 3. Open WhatsApp (owner + customer)
    window.WhatsAppService.sendOrderNotification(finalOrder, orderId, totalFormatted);

    // 4. Send email (silent fail)
    if (window.EmailService) {
      window.EmailService.sendConfirmation(finalOrder, orderId, totalFormatted);
    }

    // 5. Redirect to success page
    setTimeout(() => { window.location.href = 'success.html'; }, 1200);
  }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
});
