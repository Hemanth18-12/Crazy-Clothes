import { CONFIG } from '../config';

export function useWhatsApp() {
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CC-${timestamp}-${random}`;
  };

  const sendOwnerNotification = (order, orderId, totalFormatted) => {
    const ownerNumber = CONFIG.whatsappNumber || '918019101606';
    const cleanOwnerNumber = ownerNumber.replace(/[^0-9]/g, '');

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const designLine = order.cloudinaryUrl
      ? order.cloudinaryUrl
      : 'No custom design';

    const addressString = order.address 
      ? [order.address.houseNo, order.address.street, order.address.village, order.address.city, order.address.state, order.address.pincode, order.address.landmark].filter(Boolean).join(', ')
      : order.customerAddress;

    const message = `🛍️ *NEW ORDER — ${CONFIG.storeName}*
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
*Address    :* ${addressString}

📝 *Notes:* ${order.specialInstructions || 'None'}
━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const url = `https://wa.me/${cleanOwnerNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sendCustomerNotification = (order, orderId, totalFormatted) => {
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    if (!phone) return;

    const message = `Hey ${order.customerName}! 👋
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
  };

  const sendOrderNotification = (order, orderId, totalFormatted) => {
    sendOwnerNotification(order, orderId, totalFormatted);
    // Slight delay to prevent pop-up blocking issues
    setTimeout(() => {
      sendCustomerNotification(order, orderId, totalFormatted);
    }, 400);
  };

  return {
    generateOrderId,
    sendOwnerNotification,
    sendCustomerNotification,
    sendOrderNotification
  };
}

/**
 * Send an automated status update WhatsApp message to the customer.
 * Called when admin changes an order status in the Orders page.
 */
export function sendStatusUpdateToCustomer(order, newStatus) {
  const phone = (order.customerPhone || '').replace(/\D/g, '');
  if (!phone) return;

  const firstName = order.customerName?.split(' ')[0] || 'there';
  const orderIdStr = order.orderId || order.id?.slice(0, 8) || 'N/A';

  const messages = {
    confirmed: `Hi ${firstName}! 🎉

Your Crazy Cloths order has been confirmed!

Order ID  : #${orderIdStr}
Product   : ${order.productName || 'T-Shirt'}
Amount    : ₹${order.price || order.total || ''}

We're getting it ready for dispatch. You'll hear from us soon!

— Crazy Cloths 🖤
crazy-clothes.vercel.app`,

    dispatched: `Hi ${firstName}! 📦

Your order is on its way!

Order ID  : #${orderIdStr}
Product   : ${order.productName || 'T-Shirt'}

Expected delivery in 3-5 business days. Track your delivery with the courier partner.

Thank you for shopping with Crazy Cloths! 🖤
crazy-clothes.vercel.app`,

    delivered: `Hi ${firstName}! ✅

Your Crazy Cloths order has been delivered!

Order ID  : #${orderIdStr}

We hope you love it! 🔥
Drop us a review — it means the world to us.

— Crazy Cloths 🖤
crazy-clothes.vercel.app`,

    cancelled: `Hi ${firstName},

We're sorry — your order #${orderIdStr} has been cancelled.

If you have any questions, reply to this message and we'll help you out.

— Crazy Cloths 🖤`
  };

  // Map Firestore status values (capitalised) to message keys (lowercase)
  const statusKey = newStatus?.toLowerCase();
  const message = messages[statusKey];
  if (!message) return;

  // Add 91 prefix if not already present
  const formattedPhone = phone.startsWith('91') ? phone : '91' + phone;

  window.open(
    `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
    '_blank'
  );
}
