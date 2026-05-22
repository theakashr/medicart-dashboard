/* ============================================================
   MediCart - Utility Functions
   Shared helpers for formatting, DOM, and notifications
   ============================================================ */

/**
 * Format number as Indian Rupee currency
 */
function formatCurrency(amount) {
  return '₹' + Number(amount).toFixed(2);
}

/**
 * Format date to readable string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

/**
 * Format date + time
 */
function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✅'}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Debounce function for search input
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Highlight matching text
 */
function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Generate a simple unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category) {
  const map = {
    'Tablets': '💊', 'Capsules': '💉', 'Syrups': '🧴',
    'Injections': '💉', 'Ointments': '🧪', 'Drops': '💧',
    'Inhalers': '🌬️', 'Supplements': '🍊', 'First Aid': '🩹',
    'Surgical': '🏥', 'Ayurvedic': '🌿', 'Other': '📦'
  };
  return map[category] || '📦';
}

/**
 * Get stock status label
 */
function getStockStatus(stock, threshold = 10) {
  if (stock <= 0) return { label: 'Out of Stock', class: 'stock-out', badge: 'badge-danger' };
  if (stock <= threshold) return { label: `Low: ${stock}`, class: 'stock-low', badge: 'badge-warning' };
  return { label: `In Stock: ${stock}`, class: 'stock-ok', badge: 'badge-success' };
}

/**
 * Round to nearest rupee (Indian convention)
 */
function roundOff(amount) {
  return Math.round(amount) - amount;
}

/**
 * Number to words (for invoice)
 */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  const n = Math.round(Math.abs(num));

  function convert(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(n) + ' Rupees Only';
}

/**
 * Live clock updater
 */
function startClock(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  function update() {
    el.textContent = new Date().toLocaleString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }
  update();
  setInterval(update, 1000);
}
