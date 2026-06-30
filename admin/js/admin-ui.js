/**
 * Crazy Cloths — Global Admin Layout, Toasts, Shortcuts & Activity Log Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize general layout enhancements
  initSidebarCollapsible();
  initLiveClockAndIndicator();
  initKeyboardShortcuts();
  initToastContainer();
});

// ── Collapsible Sidebar ─────────────────────────────────────
function initSidebarCollapsible() {
  const sidebar = document.getElementById('admin-sidebar');
  if (!sidebar) return;

  // Create collapse toggle button in sidebar header if it doesn't exist
  let logoArea = sidebar.querySelector('.admin-sidebar-logo-area');
  if (logoArea) {
    let toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-collapse-btn';
    toggleBtn.innerHTML = '◀';
    toggleBtn.title = 'Toggle Sidebar';
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('cc_admin_sidebar_collapsed', isCollapsed ? 'true' : 'false');
      toggleBtn.innerHTML = isCollapsed ? '▶' : '◀';
      document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    });
    logoArea.appendChild(toggleBtn);

    // Load saved setting
    const savedCollapsed = localStorage.getItem('cc_admin_sidebar_collapsed') === 'true';
    if (savedCollapsed) {
      sidebar.classList.add('collapsed');
      toggleBtn.innerHTML = '▶';
      document.body.classList.add('sidebar-collapsed');
    }
  }
}

// ── Live Clock & Real-time Active Dot ─────────────────────────────
function initLiveClockAndIndicator() {
  // The header already has page-title. Let's insert the breadcrumbs and live active indicator dynamically.
  const titleEl = document.querySelector('.admin-page-title');
  if (titleEl) {
    const pageName = document.body.dataset.page;
    const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
    // Convert titleEl into a Breadcrumb
    const breadcrumbHtml = `
      <div class="admin-breadcrumb">
        <a href="dashboard.html">Admin</a>
        <span class="admin-breadcrumb-sep">/</span>
        <span class="admin-breadcrumb-current">${formattedPageName}</span>
      </div>
    `;
    titleEl.outerHTML = breadcrumbHtml;
  }

  // Setup the Live status indicator in Topbar right
  const topbarRight = document.querySelector('.admin-topbar-right');
  if (topbarRight) {
    const liveIndicator = document.createElement('div');
    liveIndicator.className = 'admin-live-indicator';
    liveIndicator.innerHTML = `
      <span class="admin-live-dot"></span>
      <span>LIVE</span>
    `;
    // Insert before clock
    topbarRight.insertBefore(liveIndicator, topbarRight.firstChild);
  }
}

// ── Toast System ──────────────────────────────────────────
function initToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }
}

function showAdminToast(title, message) {
  const container = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.innerHTML = `
    <div class="admin-toast-body">
      <div class="admin-toast-title">${title}</div>
      <div class="admin-toast-message">${message}</div>
    </div>
    <button class="admin-toast-close">×</button>
    <div class="admin-toast-progress"></div>
  `;

  // Click close button
  toast.querySelector('.admin-toast-close').addEventListener('click', (e) => {
    e.stopPropagation();
    dismissToast(toast);
  });

  container.appendChild(toast);

  const autoClose = setTimeout(() => {
    dismissToast(toast);
  }, 4000);

  function dismissToast(el) {
    clearTimeout(autoClose);
    el.classList.add('slide-out');
    setTimeout(() => el.remove(), 300);
  }
}
// Override window.showToast for backward compatibility with existing controller scripts
window.showToast = showAdminToast;
window.showAdminToast = showAdminToast;

// ── Keyboard Shortcuts Modal ─────────────────────────────────
function initKeyboardShortcuts() {
  // Create help modal HTML dynamically
  const backdrop = document.createElement('div');
  backdrop.id = 'shortcuts-modal-backdrop';
  backdrop.className = 'shortcuts-modal-backdrop';
  backdrop.innerHTML = `
    <div class="shortcuts-modal" onclick="event.stopPropagation()">
      <h3>
        <span>Keyboard Shortcuts</span>
        <button class="shortcuts-close" onclick="toggleShortcutsModal(false)">×</button>
      </h3>
      <div class="shortcuts-list">
        <div class="shortcut-item">
          <span class="shortcut-desc">Open Command Palette</span>
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd></span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-desc">New Product (Products page)</span>
          <span class="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>N</kbd> / <kbd>⌘</kbd> + <kbd>N</kbd></span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-desc">Close Panel or Modal</span>
          <span class="shortcut-keys"><kbd>Esc</kbd></span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-desc">Open Shortcuts Menu</span>
          <span class="shortcut-keys"><kbd>?</kbd></span>
        </div>
      </div>
    </div>
  `;
  backdrop.addEventListener('click', () => toggleShortcutsModal(false));
  document.body.appendChild(backdrop);

  // Global keydown listeners
  document.addEventListener('keydown', (e) => {
    // 1. Esc closes modals
    if (e.key === 'Escape') {
      toggleShortcutsModal(false);
      if (window.closeOrderModal) window.closeOrderModal();
      if (window.toggleProductPanel) window.toggleProductPanel(false);
      const palette = document.getElementById('cmd-backdrop');
      if (palette) palette.classList.remove('open');
    }

    // 2. '?' key opens shortcuts modal (avoid triggering when typing in inputs/textareas)
    if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      toggleShortcutsModal(true);
    }

    // 3. Ctrl+N opens new product on products page
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      if (document.body.dataset.page === 'products') {
        e.preventDefault();
        if (window.toggleProductPanel) window.toggleProductPanel(true);
      }
    }
  });

  // Attach a small help button or listener to trigger ? from footer
  const profileSection = document.querySelector('.admin-sidebar-profile');
  if (profileSection) {
    const helpBtn = document.createElement('button');
    helpBtn.className = 'admin-btn admin-btn-outline admin-btn-icon';
    helpBtn.style.marginLeft = 'auto';
    helpBtn.style.padding = '0';
    helpBtn.style.width = '24px';
    helpBtn.style.height = '24px';
    helpBtn.style.fontSize = '10px';
    helpBtn.style.border = 'none';
    helpBtn.textContent = '❓';
    helpBtn.title = 'Keyboard Shortcuts (?)';
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleShortcutsModal(true);
    });
    profileSection.appendChild(helpBtn);
  }
}

function toggleShortcutsModal(show) {
  const backdrop = document.getElementById('shortcuts-modal-backdrop');
  if (backdrop) {
    if (show) backdrop.classList.add('open');
    else backdrop.classList.remove('open');
  }
}
window.toggleShortcutsModal = toggleShortcutsModal;

// ── Firestore Activity Log Writer ──────────────────────────
async function logAdminAction(action, targetType, targetId, targetLabel) {
  if (typeof firebase === 'undefined' || !CONFIG.firebaseEnabled) return;
  const db = firebase.firestore();

  try {
    const email = AuthService.getEmail() || 'admin@crazycloths.com';
    const name = AuthService.getDisplayName() || email.split('@')[0];

    const logEntry = {
      adminEmail: email,
      adminName: name,
      action: action,
      targetType: targetType,
      targetId: targetId || '',
      targetLabel: targetLabel || '',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('activityLog').add(logEntry);
  } catch (err) {
    console.error("Activity logging failed:", err);
  }
}
window.logAdminAction = logAdminAction;

// ── Relative Timestamp Formatter ──────────────────────────────
function getRelativeTimeString(date) {
  const timeMs = typeof date === 'number' ? date : date.getTime();
  const deltaSeconds = Math.round((Date.now() - timeMs) / 1000);

  const cutoffs = [60, 3600, 86400, 86400 * 7, 86400 * 30, Infinity];
  const units = ['second', 'minute', 'hour', 'day', 'week', 'month'];
  
  const unitIndex = cutoffs.findIndex(cutoff => deltaSeconds < cutoff);
  if (unitIndex === 0) return 'Just now';

  const divisor = unitIndex > 0 ? cutoffs[unitIndex - 1] : 1;
  const count = Math.floor(deltaSeconds / divisor);
  return `${count} ${units[unitIndex]}s ago`.replace('1s ago', '1 ago').replace('s ago', ' ago');
}
window.getRelativeTimeString = getRelativeTimeString;
