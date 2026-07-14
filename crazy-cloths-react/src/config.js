export const CONFIG = {
  storeName: 'Crazy Cloths',
  
  // WhatsApp config
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '918019101606',

  // Cloudinary config
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    productUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  },

  // EmailJS config
  emailjs: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  },

  // Pricing defaults
  pricing: {
    white: { base: 499, currency: '₹' },
    black: { base: 499, currency: '₹' },
  },

  // Admin emails with authorization rights
  adminEmails: [
    'hemanth.t18122005@gmail.com',
    'admin2@crazycloths.com',
    'admin3@crazycloths.com',
    'admin4@crazycloths.com',
    'admin5@crazycloths.com',
  ],
};
