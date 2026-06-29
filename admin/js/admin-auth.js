// Admin auth guard — runs before page renders
(function() {
  const email = sessionStorage.getItem('cc_user_email');
  const ADMIN_EMAILS = [
    "hemanth.t18122005@gmail.com",
    "admin2@crazycloths.com",
    "admin3@crazycloths.com",
    "admin4@crazycloths.com",
    "admin5@crazycloths.com"
  ];
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    // If not matching, redirect immediately
    window.location.replace('../login.html');
  }
})();

// Double verify auth state when Firebase SDK has initialized
document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged((user) => {
      const ADMIN_EMAILS = [
        "hemanth.t18122005@gmail.com",
        "admin2@crazycloths.com",
        "admin3@crazycloths.com",
        "admin4@crazycloths.com",
        "admin5@crazycloths.com"
      ];
      if (!user || !user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        // Clear session and redirect
        sessionStorage.removeItem('cc_user_email');
        sessionStorage.removeItem('cc_user_name');
        sessionStorage.removeItem('cc_user_uid');
        window.location.replace('../login.html');
      }
    });
  }
});
