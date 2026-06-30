# Crazy Cloths Setup Guide

This document describes how to set up the external services (Firebase, Cloudinary, EmailJS) required to run the upgraded Crazy Cloths static storefront.

---

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name your project (e.g., `Crazy-Cloths`) and click **Create**.
3. Once ready, click the **Web icon (</>)** on the dashboard to register a new web application.
4. Copy the `firebaseConfig` credentials object shown on the screen.
5. Open [js/firebase-config.js](file:///c:/Users/Hp/OneDrive/Desktop/Crazy-Cloths/js/firebase-config.js) and paste the values into the `firebaseConfig` object.
6. In `config.js`, set `firebaseEnabled: true`.

### Enable Authentication
1. In the Firebase Sidebar, click **Build** > **Authentication** > **Get Started**.
2. Go to the **Sign-in method** tab, select **Email/Password**, enable it, and click **Save**.
3. Go to the **Users** tab and click **Add user** to add your administrators and testing accounts.
   - Admin accounts must match one of the email addresses configured in the `ADMIN_EMAILS` array inside [js/auth.js](file:///c:/Users/Hp/OneDrive/Desktop/Crazy-Cloths/js/auth.js).

### Enable Firestore Database
1. In the Firebase Sidebar, click **Build** > **Firestore Database** > **Create database**.
2. Choose **Start in production mode** (or test mode) and select your database location.
3. Under the **Rules** tab, replace the rules with the following configuration to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Check if the requesting user is a registered administrator
    // NOTE: keep this list in sync with ADMIN_EMAILS in js/auth.js
    function isAdmin() {
      return request.auth != null &&
        (request.auth.token.email == 'hemanth.t18122005@gmail.com' ||
         request.auth.token.email == 'admin2@crazycloths.com' ||
         request.auth.token.email == 'admin3@crazycloths.com' ||
         request.auth.token.email == 'admin4@crazycloths.com' ||
         request.auth.token.email == 'admin5@crazycloths.com');
    }

    // Products Collection — anyone can browse, only admins can write
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Orders Collection
    // FIX: customers can now read their OWN orders (My Orders page).
    // Admins can still read ALL orders (admin dashboard).
    match /orders/{orderId} {
      allow read: if isAdmin() ||
                    (request.auth != null &&
                     resource.data.customerEmail == request.auth.token.email);
      allow write: if request.auth != null;
    }

    // Users Collection — each user can only access their own document
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      // FIX: Wishlist subcollection — must be explicitly covered.
      // The parent /users/{uid} rule does NOT cascade to subcollections.
      match /wishlist/{productId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }

      // Drafts subcollection (used by the order form)
      match /drafts/{draftId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // Reviews Collection — anyone can read; only authenticated users can write
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 2. Cloudinary Setup

1. Sign up or log in at [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name** from the dashboard.
3. Open [config.js](file:///c:/Users/Hp/OneDrive/Desktop/Crazy-Cloths/config.js) and paste it into `cloudinary.cloudName`.
4. In Cloudinary, go to **Settings (gear icon)** > **Upload** > scroll down to **Upload presets**.
5. Click **Add upload preset**.
6. Set the **Signing Mode** to **Unsigned**.
7. Set the **Folder** if you want to organize files (e.g., `designs` or `products`).
8. Copy the generated **Upload preset name** and paste it into `cloudinary.uploadPreset` and `cloudinary.productUploadPreset` in `config.js`.

---

## 3. EmailJS Setup

1. Create a free account at [EmailJS](https://www.emailjs.com/).
2. Go to **Email Services** > click **Add New Service** (e.g., Gmail) and connect your account. Copy the **Service ID**.
3. Go to **Email Templates** > click **Create New Template**.
4. Configure your email template subject and content. Use the following variables enclosed in double curly braces:
   - `{{customer_name}}`
   - `{{customer_email}}`
   - `{{order_id}}`
   - `{{order_date}}`
   - `{{product_name}}`
   - `{{product_color}}`
   - `{{product_size}}`
   - `{{quantity}}`
   - `{{total_price}}`
   - `{{design_link}}`
   - `{{notes}}`
   - `{{store_name}}`
5. Save the template and copy the **Template ID**.
6. Go to **Account** > **API Keys** and copy the **Public Key**.
7. Update `config.js` with all three credentials under the `emailjs` key.
