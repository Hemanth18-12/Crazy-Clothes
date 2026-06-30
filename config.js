/**
 * ╔══════════════════════════════════════════════════╗
 * ║        CRAZY CLOTHS — STORE CONFIGURATION        ║
 * ║  Fill in your real credentials before deploying  ║
 * ╚══════════════════════════════════════════════════╝
 *
 * This file is gitignored. Never commit real API keys.
 * See SETUP.md for where to find each value.
 */
const CONFIG = {
  storeName: "Crazy Cloths",

  // ── WhatsApp ──────────────────────────────────────
  // Store owner's WhatsApp number. Format: country code + number,
  // no spaces, no + prefix. Example: 919505700178 (91 = India)
  whatsappNumber: "919505700178",

  // ── Cloudinary ────────────────────────────────────
  cloudinary: {
    // Found at: cloudinary.com/console → top-left cloud name
    cloudName: "dhteknetd",
    // Found at: Settings → Upload → Upload presets (must be UNSIGNED)
    uploadPreset: "crazy-cloths-designs",
    // Separate preset for admin product images (can be same preset)
    productUploadPreset: "crazy-cloths-designs"
  },

  // ── EmailJS ───────────────────────────────────────
  // Found at: dashboard.emailjs.com
  emailjs: {
    // Email Services tab → Service ID
    serviceId: "service_63n5tne",
    // Email Templates tab → Template ID
    templateId: "template_r1kcfmp",
    // Account → API Keys → Public Key
    publicKey: "8eM5DjEsLvFKE0v1Y"
  },

  // ── Pricing ───────────────────────────────────────
  // Base prices used for the hardcoded cards.
  // Firestore products use their own stored price field (₹499 default).
  pricing: {
    white: { base: 499, currency: "₹" },
    black: { base: 499, currency: "₹" }
  },

  // ── Feature Flags ─────────────────────────────────
  // Set to true once firebase-config.js is filled in.
  firebaseEnabled: true
};
