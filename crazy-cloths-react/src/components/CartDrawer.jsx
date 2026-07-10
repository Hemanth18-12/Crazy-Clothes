import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CONFIG } from '../config';
import { useWhatsApp } from '../hooks/useWhatsApp';

export default function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    isOpen,
    closeCart,
    clearCart
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { generateOrderId } = useWhatsApp();

  // Shipping details state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Errors state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Prefill details from currentUser if available
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      // Try to recover phone from Firestore or user metadata if possible
      const savedPhone = sessionStorage.getItem('cc_user_phone');
      if (savedPhone) setPhone(savedPhone);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full Name is required.';
    if (!phone.trim()) errs.phone = 'WhatsApp Number is required.';
    if (!address.trim()) errs.address = 'Delivery Address is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!currentUser) {
      sessionStorage.setItem('cc_redirect_after_login', window.location.pathname + window.location.search);
      closeCart();
      navigate('/login');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Format order details for WhatsApp
      const orderId = generateOrderId();
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Build product list string
      let itemsListStr = '';
      items.forEach((item, index) => {
        const designStr = item.cloudinaryUrl || 'No custom design';
        itemsListStr += `
${index + 1}. *${item.name}*
   *Color      :* ${item.color ? item.color.charAt(0).toUpperCase() + item.color.slice(1) : ''}
   *Size       :* ${item.size || 'Free Size'}
   *Quantity   :* ${item.quantity}
   *Price      :* ₹${item.price * item.quantity}
   *Design     :* ${designStr}
`;
      });

      const totalFormatted = `₹${subtotal}`;

      // Owner notification text
      const ownerMessage = `🛍️ *NEW CART ORDER — ${CONFIG.storeName}*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Order ID   :* #${orderId}
*Date       :* ${dateStr}

👕 *CART ITEMS*${itemsListStr}
━━━━━━━━━━━━━━━━━━━━━━━━━
*Total Amount :* ${totalFormatted}

👤 *CUSTOMER DETAILS*
*Name       :* ${name}
*Email      :* ${email || 'Not provided'}
*Phone      :* ${phone}
*Address    :* ${address}

📝 *Notes:* ${notes || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

      // Customer friendly text
      const customerMessage = `Hey ${name}! 👋
Your cart order of ${items.length} items has been placed with *Crazy Cloths!* 🎉

*Order ID   :* #${orderId}
*Total      :* ${totalFormatted}

We'll confirm details and dispatch within *24 hours*.
Questions? Reply to this chat anytime.

— Team Crazy Cloths 🖤`;

      // 2. Open WhatsApp for Owner & Customer
      const ownerNumber = CONFIG.whatsappNumber || '919505700178';
      const cleanOwnerNumber = ownerNumber.replace(/[^0-9]/g, '');
      const ownerUrl = `https://wa.me/${cleanOwnerNumber}?text=${encodeURIComponent(ownerMessage)}`;
      
      const cleanCustomerPhone = phone.replace(/[^0-9]/g, '');
      const customerUrl = `https://wa.me/${cleanCustomerPhone}?text=${encodeURIComponent(customerMessage)}`;

      // 3. Save Order to Firestore (One entry per item, or single order entry containing items list)
      // Standard practice: save as a single order document with items sub-array
      if (CONFIG.firebaseEnabled) {
        const dbModule = await import('../firebase/config');
        const { collection, addDoc } = await import('firebase/firestore');
        
        await addDoc(collection(dbModule.db, 'orders'), {
          orderId,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            cloudinaryUrl: i.cloudinaryUrl || null
          })),
          price: subtotal,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          customerAddress: address,
          specialInstructions: notes,
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
      }

      // Save to localStorage for SuccessPage receipt rendering
      localStorage.setItem('crazy_cloths_last_order', JSON.stringify({
        orderId,
        total: totalFormatted,
        productName: `${items.length} Items`,
        color: items[0]?.color,
        size: items[0]?.size,
        quantity: items.reduce((acc, curr) => acc + curr.quantity, 0)
      }));

      // Trigger popups
      window.open(ownerUrl, '_blank');
      setTimeout(() => {
        if (cleanCustomerPhone) {
          window.open(customerUrl, '_blank');
        }
      }, 400);

      // Clear cart & close drawer
      clearCart();
      closeCart();
      setSubmitting(false);

      // Redirect to success page
      navigate('/success');
    } catch (err) {
      console.error('Checkout failed:', err);
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          opacity: 1,
          transition: 'opacity 0.3s ease'
        }}
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '480px',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.4)',
          overflowY: 'auto'
        }}
      >
        {/* Drawer Header */}
        <div 
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', margin: 0 }}>
            Your Cart
          </h2>
          <button 
            onClick={closeCart}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '2rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', margin: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                Your cart is empty
              </h3>
              <button onClick={closeCart} className="btn btn-accent" style={{ padding: '0.8rem 2rem' }}>
                Browse Collection
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {items.map((item, idx) => (
                  <div 
                    key={`${item.id}-${item.color}-${item.size}-${idx}`}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      background: 'var(--color-surface-2)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <img 
                      src={item.cloudinaryUrl || item.imageUrl || '/assets/images/white-t-shirt.png'} 
                      alt={item.name} 
                      style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', textTransform: 'uppercase' }}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        Size: {item.size} · Color: {item.color}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', color: 'var(--color-accent)' }}>
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                    {/* Quantity Selector & Remove Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ padding: '0 0.5rem', fontFamily: 'var(--font-mono)' }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.color, item.size, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-primary)', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id, item.color, item.size)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  borderTop: '1px solid var(--color-border)', 
                  paddingTop: '1rem', 
                  fontFamily: 'var(--font-display)' 
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>Subtotal</span>
                <span style={{ fontSize: '1.5rem', color: 'var(--color-accent)' }}>₹{subtotal}</span>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                  Delivery Details
                </h3>

                <div className="form-group">
                  <input 
                    type="text" 
                    className={`form-input ${errors.name ? 'input-invalid' : ''}`}
                    placeholder=" " 
                    value={name} 
                    onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: null })); }}
                  />
                  <label className="form-label">Full Name *</label>
                  {errors.name && <div className="form-input-error" style={{ display: 'block' }}>{errors.name}</div>}
                </div>

                <div className="form-group">
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder=" " 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="form-label">Email Address</label>
                </div>

                <div className="form-group">
                  <input 
                    type="tel" 
                    className={`form-input ${errors.phone ? 'input-invalid' : ''}`} 
                    placeholder=" " 
                    value={phone} 
                    onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: null })); }}
                  />
                  <label className="form-label">WhatsApp Number *</label>
                  {errors.phone && <div className="form-input-error" style={{ display: 'block' }}>{errors.phone}</div>}
                </div>

                <div className="form-group">
                  <textarea 
                    className={`form-input ${errors.address ? 'input-invalid' : ''}`} 
                    rows="2" 
                    style={{ resize: 'vertical' }} 
                    placeholder=" " 
                    value={address} 
                    onChange={(e) => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: null })); }}
                  />
                  <label className="form-label">Delivery Address *</label>
                  {errors.address && <div className="form-input-error" style={{ display: 'block' }}>{errors.address}</div>}
                </div>

                <div className="form-group">
                  <textarea 
                    className="form-input" 
                    rows="2" 
                    style={{ resize: 'vertical' }} 
                    placeholder=" " 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <label className="form-label">Special Instructions (Optional)</label>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-accent btn-premium" 
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {submitting ? 'Processing...' : 'Place Order via WhatsApp'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
