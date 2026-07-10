import emailjs from '@emailjs/browser';
import { CONFIG } from '../config';

export function useEmail() {
  const sendConfirmation = async (order, orderId, totalFormatted) => {
    const { serviceId, templateId, publicKey } = CONFIG.emailjs;
    
    if (!serviceId || serviceId === 'your_service_id' || !templateId || !publicKey) {
      console.warn('EmailJS is not fully configured in config.js — skipping email confirmation.');
      return;
    }

    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const templateParams = {
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        order_id: `#${orderId}`,
        order_date: dateStr,
        product_name: order.productName || `${order.color} T-Shirt`,
        product_color: order.color ? order.color.toUpperCase() : '',
        product_size: order.size,
        quantity: order.quantity,
        total_price: totalFormatted,
        design_link: order.cloudinaryUrl || 'No custom design',
        notes: order.specialInstructions || 'None',
        store_name: CONFIG.storeName
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);
    } catch (err) {
      // Silent failure — log only
      console.error('EmailJS send failed (non-critical):', err);
    }
  };

  return { sendConfirmation };
}
