import { CONFIG } from '../config';

export function useWhatsApp() {
  const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `CC-${timestamp}-${random}`;
  };

  const sendOwnerNotification = (order, orderId, totalFormatted) => {
    const ownerNumber = CONFIG.whatsappNumber || '919505700178';
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
*Address    :* ${order.customerAddress}

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
