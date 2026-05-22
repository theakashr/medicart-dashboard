/* ============================================================
   MediCart - Shared App Components
   Sidebar, Navbar, Theme, Utilities for all pages
   ============================================================ */

const SIDEBAR_LINKS = [
  { href:'/', icon:'dashboard', label:'Dashboard' },
  { href:'/billing', icon:'billing', label:'Billing' },
  { href:'/staff', icon:'staff', label:'Staff' },
  { href:'/medicines', icon:'medicines', label:'Medicines' },
  { href:'/inventory', icon:'inventory', label:'Inventory' },
  { href:'/customers', icon:'customers', label:'Customers' },
  { href:'/reports', icon:'reports', label:'Reports' },
  { href:'/settings', icon:'settings', label:'Settings' },
];

const SVG_ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  billing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>',
  staff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  medicines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 1.5H8A6.5 6.5 0 0 0 1.5 8v0a6.5 6.5 0 0 0 6.5 6.5h0"/><path d="M13.5 22.5H16a6.5 6.5 0 0 0 6.5-6.5v0A6.5 6.5 0 0 0 16 9.5h0"/><line x1="1" y1="23" x2="23" y2="1"/></svg>',
  inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
};

/**
 * Render the sidebar into a target element
 */
function renderSidebar(activePath) {
  const currentPath = activePath || window.location.pathname;
  const mainLinks = SIDEBAR_LINKS.slice(0, 2);
  const manageLinks = SIDEBAR_LINKS.slice(2, 6);
  const systemLinks = SIDEBAR_LINKS.slice(6);

  function linkHTML(link) {
    const isActive = currentPath === link.href || (link.href !== '/' && currentPath.startsWith(link.href));
    return `<a href="${link.href}" class="sidebar-link${isActive ? ' active' : ''}" title="${link.label}">
      <span class="sidebar-link__icon">${SVG_ICONS[link.icon]}</span>
      <span class="sidebar-link__text">${link.label}</span>
    </a>`;
  }

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo" aria-label="MediCart logo">M+</div>
        <div class="sidebar__brand-text">
          <div class="sidebar__name">MediCart</div>
          <div class="sidebar__sub">Medical Management</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="sidebar__section-label">Main</div>
        ${mainLinks.map(linkHTML).join('')}
        <div class="sidebar__section-label">Manage</div>
        ${manageLinks.map(linkHTML).join('')}
        <div class="sidebar__section-label">System</div>
        ${systemLinks.map(linkHTML).join('')}
      </nav>
      <div class="sidebar-footer">
        <a href="#" onclick="logout();return false;" class="sidebar-link sidebar-footer__logout">
          <span class="sidebar-link__icon">${SVG_ICONS.logout}</span>
          <span class="sidebar-link__text">Logout</span>
        </a>
        <div class="sidebar-footer__copy">MediCart v2.0 &copy; 2026</div>
      </div>
    </aside>
    <div class="sidebar-overlay" id="sidebarOverlay"></div>`;
}

/**
 * Render the top navbar
 */
function renderNavbar(title, subtitle) {
  const user = (typeof AuthManager !== 'undefined' && AuthManager.getUser()) || { name:'User' };
  const initial = (user.name || 'U')[0].toUpperCase();
  const nameParts = (user.name || 'User').split(' ');
  const honorifics = ['dr.','mr.','mrs.','ms.','prof.','sr.','jr.'];
  const firstName = (nameParts.length > 1 && honorifics.includes(nameParts[0].toLowerCase()))
    ? nameParts.slice(0,2).join(' ') : nameParts[0];

  const searchIconHtml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

  const isViewer = user && user.role === 'viewer';
  const badgeHtml = isViewer ? `<span class="role-badge role-badge--viewer" style="margin-left: 0.5rem; background: var(--gray-200); color: var(--gray-700); font-size: 0.6875rem; padding: 0.125rem 0.375rem; border-radius: 4px; font-weight: 600;">View Only</span>` : '';

  return `
    <nav class="top-navbar" id="topNavbar">
      <div class="navbar__left">
        <button class="hamburger-btn" id="hamburgerBtn" aria-label="Toggle menu">${SVG_ICONS.menu}</button>
        <div>
          <div class="navbar__title">${title || 'Dashboard'}</div>
          ${subtitle ? `<div class="navbar__subtitle">${subtitle}</div>` : ''}
        </div>
      </div>
      <div class="navbar__right">
        <div class="navbar__clock" id="navClock" aria-live="polite"></div>
        <div class="navbar__search" onclick="document.querySelector('.search-input')?.focus()" role="button" tabindex="0" aria-label="Search">
          ${searchIconHtml}
          <span class="navbar__search-text">Search...</span>
          <span class="navbar__search-kbd">⌘K</span>
        </div>
        <button class="navbar__icon-btn" title="Notifications" aria-label="Notifications">
          ${SVG_ICONS.bell}<span class="navbar__badge" aria-label="Unread notifications"></span>
        </button>
        <button class="theme-toggle" id="themeToggle" title="Toggle theme" aria-label="Toggle theme"></button>
        <div class="navbar__user" id="userProfileBtn" role="button" tabindex="0" aria-label="User menu">
          <div class="navbar__avatar" id="userAvatar">${user.photo ? `<img src="${user.photo}" alt="${firstName}" referrerpolicy="no-referrer">` : initial}</div>
          <span class="navbar__user-name" id="userName">${firstName}${badgeHtml}</span>
        </div>
      </div>
    </nav>`;
}

/**
 * Initialize shared app components
 */
function initApp(pageTitle, pageSubtitle) {
  // Theme
  const saved = localStorage.getItem('medicart-theme');
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';

  // Render sidebar & navbar into app shell
  const appRoot = document.getElementById('appRoot');
  if (appRoot) {
    const sidebarHTML = renderSidebar();
    const navbarHTML = renderNavbar(pageTitle, pageSubtitle);
    const content = document.getElementById('pageContent')?.innerHTML || '';
    appRoot.innerHTML = `
      ${sidebarHTML}
      <main class="main-content">
        ${navbarHTML}
        <div class="page-content" id="pageContent">${content}</div>
      </main>`;
  }

  // Hamburger toggle
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Theme toggle
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const updateTheme = (isDark) => {
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      localStorage.setItem('medicart-theme', isDark ? 'dark' : 'light');
    };
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      updateTheme(!isDark);
    });
  }

  // Navbar clock
  const clockEl = document.getElementById('navClock');
  if (clockEl) {
    function updateClock() {
      clockEl.textContent = new Date().toLocaleString('en-IN', {
        weekday:'short', hour:'2-digit', minute:'2-digit', hour12:true
      });
    }
    updateClock();
    setInterval(updateClock, 30000); // update every 30s instead of 1s for perf
  }
}

/**
 * Animated counter
 */
function animateCounter(el, target, prefix='', suffix='', duration=1200) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
