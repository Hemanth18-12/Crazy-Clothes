/**
 * Crazy Cloths — EmailJS Order Confirmation
 *
 * Sends a transactional email to the customer after a successful order.
 * Failure is silent — WhatsApp is the primary channel.
 *
 * Setup:
 * 1. Create an account at emailjs.com
 * 2. Add an Email Service (Gmail, Outlook, etc.)
 * 3. Create a template with these variables:
 *    {{customer_name}}, {{order_id}}, {{product_name}}, {{product_color}},
 *    {{product_size}}, {{quantity}}, {{total_price}}, {{design_link}},
 *    {{customer_email}}, {{order_date}}
 * 4. Copy Service ID, Template ID, and Public Key into config.js
 */

const EmailService = {
  /**
   * Send order confirmation email to the customer.
   * @param {Object} order   - Full order object
   * @param {string} orderId - Generated order reference ID
   * @param {string} total   - Formatted total price string (e.g. "₹499")
   */
  async sendConfirmation(order, orderId, total) {
    // Skip silently if EmailJS SDK or config not available
    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS SDK not loaded — skipping email confirmation.');
      return;
    }

    const { serviceId, templateId, publicKey } = CONFIG.emailjs;
    if (!serviceId || serviceId === 'your_service_id') {
      console.warn('EmailJS not configured in config.js — skipping email confirmation.');
      return;
    }

    try {
      emailjs.init(publicKey);

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const templateParams = {
        customer_name:  order.customerName,
        customer_email: order.customerEmail,
        order_id:       `#${orderId}`,
        order_date:     dateStr,
        product_name:   order.productName || `${order.color} T-Shirt`,
        product_color:  order.color ? order.color.toUpperCase() : '',
        product_size:   order.size,
        quantity:       order.quantity,
        total_price:    total,
        design_link:    order.cloudinaryUrl || 'No custom design',
        notes:          order.specialInstructions || 'None',
        store_name:     CONFIG.storeName
      };

      await emailjs.send(serviceId, templateId, templateParams);
      console.log('Order confirmation email sent to', order.customerEmail);
    } catch (err) {
      // Silent failure — log only, never show to customer
      console.error('EmailJS send failed (non-critical):', err);
    }
  }
};

window.EmailService = EmailService;
