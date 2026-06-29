/**
 * Crazy Cloths — WhatsApp Order Notification Builder
 *
 * Sends two messages:
 *  1. Store owner at 919505700178 — full order details
 *  2. Customer at their phone number — friendly confirmation
 */

const WhatsAppService = {

  /**
   * Message 1: Full order details to the store owner
   */
  sendOwnerNotification(order, orderId, totalFormatted) {
    const STORE_NUMBER = '919505700178';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const designLine = order.cloudinaryUrl
      ? order.cloudinaryUrl
      : 'No custom design';

    const message =
`🛍️ *NEW ORDER — ${CONFIG.storeName}*
━━━━━━━━━━━━━━━━━━━━━━━━━
*Order ID   :* #${orderId}
*Date       :* ${dateStr}

👕 *PRODUCT DETAILS*
*T-Shirt    :* ${order.productName || (order.color + ' T-Shirt')}
*Color      :* ${order.color ? order.color.charAt(0).toUpperCase() + order.color.slice(1) : ''}
*Size       :* ${order.size}
*Quantity   :* ${order.quantity}
*Price      :* ${totalFormatted}
*Custom Design :* ${designLine}

👤 *CUSTOMER DETAILS*
*Name       :* ${order.customerName}
*Email      :* ${order.customerEmail || 'Not provided'}
*Phone      :* ${order.customerPhone}
*Address    :* ${order.customerAddress}

📝 *Notes:* ${order.specialInstructions || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const url = `https://wa.me/${STORE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  /**
   * Message 2: Friendly confirmation to the customer
   */
  sendCustomerNotification(order, orderId, totalFormatted) {
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    if (!phone) return; // skip if no phone

    const message =
`Hey ${order.customerName}! 👋
Your order has been placed with *Crazy Cloths!* 🎉

*Order ID   :* #${orderId}
*Product    :* ${order.productName || (order.color + ' T-Shirt')}
*Size       :* ${order.size}
*Color      :* ${order.color ? order.color.charAt(0).toUpperCase() + order.color.slice(1) : ''}
*Total      :* ${totalFormatted}

We'll confirm and dispatch within *24 hours*.
Questions? Reply to this chat anytime.

— Team Crazy Cloths 🖤`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  /**
   * Convenience: fire both messages back to back
   */
  sendOrderNotification(order, orderId, totalFormatted) {
    this.sendOwnerNotification(order, orderId, totalFormatted);
    // Slight delay so browsers don't block the second popup
    setTimeout(() => {
      this.sendCustomerNotification(order, orderId, totalFormatted);
    }, 400);
  }
};

window.WhatsAppService = WhatsAppService;
