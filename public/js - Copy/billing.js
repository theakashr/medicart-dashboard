/* ============================================================
   MediCart - Billing Logic
   Search, cart management, real-time calculations
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let cart = [];
let selectedSearchIndex = -1;
let activeCategory = '';
let paymentMethod = 'cash';
let shopConfig = {};

// ── DOM References ───────────────────────────────────────────
const searchInput = document.getElementById('medicineSearch');
const searchResults = document.getElementById('searchResults');
const cartBody = document.getElementById('cartBody');
const cartEmpty = document.getElementById('cartEmpty');
const cartCount = document.getElementById('cartCount');

// ── Initialize ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  startClock('liveTime');
  initSearch();
  initCategoryFilters();
  initPaymentMethods();
  initThemeToggle();
  initKeyboardShortcuts();
  initButtonHandlers();

  try {
    shopConfig = await api.getShopConfig();
  } catch (e) {
    shopConfig = { name: 'MediCart Pharmacy', address: '', phone: '', gstin: '' };
  }
});

// ── Search ───────────────────────────────────────────────────
function initSearch() {
  const debouncedSearch = debounce(performSearch, 250);
  searchInput.addEventListener('input', debouncedSearch);
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length >= 1) performSearch();
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-section')) {
      searchResults.classList.add('hidden');
    }
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleSearchKeydown);
}

async function performSearch() {
  const query = searchInput.value.trim();
  if (query.length < 1) {
    searchResults.classList.add('hidden');
    return;
  }

  try {
    const results = await api.searchMedicines(query, activeCategory);
    renderSearchResults(results, query);
  } catch (err) {
    searchResults.innerHTML = '<div class="search-empty"><div class="search-empty__icon">⚠️</div><p>Search failed. Please try again.</p></div>';
    searchResults.classList.remove('hidden');
  }
}

function renderSearchResults(medicines, query) {
  selectedSearchIndex = -1;
  if (medicines.length === 0) {
    searchResults.innerHTML = `
      <div class="search-empty">
        <div class="search-empty__icon">🔍</div>
        <p>No medicines found for "<strong>${query}</strong>"</p>
      </div>`;
    searchResults.classList.remove('hidden');
    return;
  }

  searchResults.innerHTML = medicines.map((med, i) => {
    const stock = getStockStatus(med.stock, med.lowStockThreshold);
    const emoji = getCategoryEmoji(med.category);
    const inCart = cart.find(c => c._id === med._id);

    return `
      <div class="search-result-item" data-index="${i}" data-id="${med._id}"
           onclick='addToCartFromSearch(${JSON.stringify(med).replace(/'/g, "&#39;")})'>
        <div class="search-result__icon">${emoji}</div>
        <div class="search-result__info">
          <div class="search-result__name">${highlightMatch(med.name, query)}</div>
          <div class="search-result__meta">
            <span>${med.category}</span>
            <span>•</span>
            <span>${med.manufacturer || 'N/A'}</span>
            <span>•</span>
            <span class="search-result__stock ${stock.class}">${stock.label}</span>
            ${inCart ? '<span class="badge badge-primary">In Cart</span>' : ''}
          </div>
        </div>
        <div>
          <div class="search-result__price">${formatCurrency(med.sellingPrice)}</div>
          <div class="text-xs text-muted text-right">GST ${med.gstPercent}%</div>
        </div>
      </div>`;
  }).join('');

  searchResults.classList.remove('hidden');
}

function handleSearchKeydown(e) {
  const items = searchResults.querySelectorAll('.search-result-item');
  if (!items.length || searchResults.classList.contains('hidden')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSearchIndex = Math.min(selectedSearchIndex + 1, items.length - 1);
    updateSearchHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
    updateSearchHighlight(items);
  } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
    e.preventDefault();
    items[selectedSearchIndex].click();
  } else if (e.key === 'Escape') {
    searchResults.classList.add('hidden');
    searchInput.blur();
  }
}

function updateSearchHighlight(items) {
  items.forEach((item, i) => {
    item.classList.toggle('active', i === selectedSearchIndex);
    if (i === selectedSearchIndex) item.scrollIntoView({ block: 'nearest' });
  });
}

// ── Category Filters ─────────────────────────────────────────
function initCategoryFilters() {
  document.getElementById('categoryFilters').addEventListener('click', (e) => {
    const chip = e.target.closest('.category-chip');
    if (!chip) return;

    document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.category;

    if (searchInput.value.trim()) performSearch();
  });
}

// ── Cart Management ──────────────────────────────────────────
function addToCartFromSearch(medicine) {
  // Check if out of stock
  if (medicine.stock <= 0) {
    showToast(`${medicine.name} is out of stock!`, 'error');
    return;
  }

  // Check if already in cart
  const existing = cart.find(item => item._id === medicine._id);
  if (existing) {
    if (existing.quantity >= medicine.stock) {
      showToast(`Maximum stock reached for ${medicine.name}`, 'warning');
      return;
    }
    existing.quantity += 1;
    showToast(`${medicine.name} quantity updated to ${existing.quantity}`, 'info');
  } else {
    cart.push({
      _id: medicine._id,
      name: medicine.name,
      genericName: medicine.genericName || '',
      category: medicine.category,
      sellingPrice: medicine.sellingPrice,
      gstPercent: medicine.gstPercent,
      stock: medicine.stock,
      lowStockThreshold: medicine.lowStockThreshold || 10,
      quantity: 1,
      discount: 0
    });
    showToast(`${medicine.name} added to cart`, 'success');
  }

  searchResults.classList.add('hidden');
  searchInput.value = '';
  searchInput.focus();
  renderCart();
  updateSummary();
}

function updateQuantity(id, delta) {
  const item = cart.find(c => c._id === id);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty < 1) return;
  if (newQty > item.stock) {
    showToast(`Only ${item.stock} units available for ${item.name}`, 'warning');
    return;
  }

  item.quantity = newQty;
  renderCart();
  updateSummary();
}

function setQuantity(id, value) {
  const item = cart.find(c => c._id === id);
  if (!item) return;

  const qty = parseInt(value) || 1;
  if (qty < 1) { item.quantity = 1; }
  else if (qty > item.stock) {
    item.quantity = item.stock;
    showToast(`Max stock: ${item.stock}`, 'warning');
  } else {
    item.quantity = qty;
  }

  renderCart();
  updateSummary();
}

function setDiscount(id, value) {
  const item = cart.find(c => c._id === id);
  if (!item) return;

  const disc = parseFloat(value) || 0;
  item.discount = Math.min(Math.max(disc, 0), 100);
  renderCart();
  updateSummary();
}

function removeFromCart(id) {
  const item = cart.find(c => c._id === id);
  cart = cart.filter(c => c._id !== id);
  if (item) showToast(`${item.name} removed from cart`, 'info');
  renderCart();
  updateSummary();
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm('Clear all items from cart?')) return;
  cart = [];
  renderCart();
  updateSummary();
  showToast('Cart cleared', 'info');
}

// ── Cart Rendering ───────────────────────────────────────────
function renderCart() {
  cartCount.textContent = cart.length;
  cartEmpty.style.display = cart.length === 0 ? 'block' : 'none';

  if (cart.length === 0) {
    cartBody.innerHTML = '';
    return;
  }

  cartBody.innerHTML = cart.map((item, index) => {
    const basePrice = item.sellingPrice * item.quantity;
    const discountAmt = basePrice * (item.discount / 100);
    const afterDiscount = basePrice - discountAmt;
    const gstAmt = afterDiscount * (item.gstPercent / 100);
    const lineTotal = afterDiscount + gstAmt;
    const stock = getStockStatus(item.stock - item.quantity, item.lowStockThreshold);

    return `
      <tr class="animate-fadeInUp delay-${Math.min(index, 4)}" data-id="${item._id}">
        <td>${index + 1}</td>
        <td>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__generic">${item.genericName || item.category}</div>
          ${item.stock - item.quantity <= item.lowStockThreshold && item.stock - item.quantity > 0
            ? `<div class="low-stock-alert">⚠️ Only ${item.stock - item.quantity} left after this</div>` : ''}
        </td>
        <td>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQuantity('${item._id}', -1)" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
            <input class="qty-value" type="number" value="${item.quantity}" min="1" max="${item.stock}"
                   onchange="setQuantity('${item._id}', this.value)" aria-label="Quantity">
            <button class="qty-btn" onclick="updateQuantity('${item._id}', 1)" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
          </div>
        </td>
        <td>${formatCurrency(item.sellingPrice)}</td>
        <td><span class="badge badge-info">${item.gstPercent}%</span></td>
        <td>
          <input class="discount-input" type="number" value="${item.discount}" min="0" max="100" step="0.5"
                 onchange="setDiscount('${item._id}', this.value)" aria-label="Discount %">
        </td>
        <td class="font-semibold">${formatCurrency(lineTotal)}</td>
        <td>
          <button class="remove-btn" onclick="removeFromCart('${item._id}')" title="Remove" aria-label="Remove item">✕</button>
        </td>
      </tr>`;
  }).join('');
}

// ── Bill Summary Calculation ─────────────────────────────────
function updateSummary() {
  let subtotal = 0;
  let totalGST = 0;
  let totalDiscount = 0;

  cart.forEach(item => {
    const basePrice = item.sellingPrice * item.quantity;
    const discountAmt = basePrice * (item.discount / 100);
    const afterDiscount = basePrice - discountAmt;
    const gstAmt = afterDiscount * (item.gstPercent / 100);

    subtotal += afterDiscount;
    totalGST += gstAmt;
    totalDiscount += discountAmt;
  });

  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const beforeRound = subtotal + totalGST;
  const rOff = roundOff(beforeRound);
  const grandTotal = Math.round(beforeRound);

  document.getElementById('sumSubtotal').textContent = formatCurrency(subtotal);
  document.getElementById('sumCGST').textContent = formatCurrency(cgst);
  document.getElementById('sumSGST').textContent = formatCurrency(sgst);
  document.getElementById('sumGST').textContent = formatCurrency(totalGST);
  document.getElementById('sumDiscount').textContent = '-' + formatCurrency(totalDiscount);
  document.getElementById('sumRoundOff').textContent = (rOff >= 0 ? '+' : '') + formatCurrency(rOff);
  document.getElementById('sumGrandTotal').textContent = formatCurrency(grandTotal);
}

function getBillData() {
  let subtotal = 0, totalGST = 0, totalDiscount = 0;
  const items = cart.map(item => {
    const basePrice = item.sellingPrice * item.quantity;
    const discountAmt = basePrice * (item.discount / 100);
    const afterDiscount = basePrice - discountAmt;
    const gstAmt = afterDiscount * (item.gstPercent / 100);
    const cgst = gstAmt / 2;
    const sgst = gstAmt / 2;
    const lineTotal = afterDiscount + gstAmt;

    subtotal += afterDiscount;
    totalGST += gstAmt;
    totalDiscount += discountAmt;

    return {
      medicine: item._id,
      medicineName: item.name,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
      gstPercent: item.gstPercent,
      gstAmount: Math.round(gstAmt * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      discountPercent: item.discount,
      discountAmount: Math.round(discountAmt * 100) / 100,
      lineTotal: Math.round(lineTotal * 100) / 100
    };
  });

  const rOff = roundOff(subtotal + totalGST);
  return {
    items,
    customer: {
      name: document.getElementById('customerName').value || 'Walk-in Customer',
      phone: document.getElementById('customerPhone').value || ''
    },
    subtotal: Math.round(subtotal * 100) / 100,
    totalGST: Math.round(totalGST * 100) / 100,
    totalCGST: Math.round((totalGST / 2) * 100) / 100,
    totalSGST: Math.round((totalGST / 2) * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    grandTotal: Math.round(subtotal + totalGST),
    roundOff: Math.round(rOff * 100) / 100,
    paymentMethod
  };
}

// ── Payment Methods ──────────────────────────────────────────
function initPaymentMethods() {
  document.getElementById('paymentMethods').addEventListener('click', (e) => {
    const method = e.target.closest('.payment-method');
    if (!method) return;

    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    method.classList.add('active');
    paymentMethod = method.dataset.method;
  });
}

// ── Theme Toggle ─────────────────────────────────────────────
function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const saved = localStorage.getItem('medicart-theme');
  if (saved === 'dark') document.documentElement.dataset.theme = 'dark';

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('medicart-theme', isDark ? 'light' : 'dark');
  });
}

// ── Keyboard Shortcuts ───────────────────────────────────────
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Ctrl+Enter to generate bill
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btnGenerateBill').click();
    }
  });
}

// ── Button Handlers ──────────────────────────────────────────
function initButtonHandlers() {
  document.getElementById('btnClearCart').addEventListener('click', clearCart);

  document.getElementById('btnGenerateBill').addEventListener('click', async () => {
    if (cart.length === 0) {
      showToast('Cart is empty! Add medicines first.', 'warning');
      return;
    }
    await generateBill();
  });

  document.getElementById('btnCancelBill').addEventListener('click', () => {
    if (cart.length === 0) return;
    if (confirm('Cancel this bill?')) {
      cart = [];
      renderCart();
      updateSummary();
      document.getElementById('customerName').value = '';
      document.getElementById('customerPhone').value = '';
      showToast('Bill cancelled', 'info');
    }
  });

  document.getElementById('btnHoldBill').addEventListener('click', () => {
    if (cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    const draftKey = 'medicart-draft-' + Date.now();
    localStorage.setItem(draftKey, JSON.stringify({
      cart, customer: {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value
      },
      date: new Date().toISOString()
    }));
    showToast('Bill saved as draft', 'success');
  });

  document.getElementById('btnDraftSave').addEventListener('click', () => {
    if (cart.length === 0) { showToast('Cart is empty', 'warning'); return; }
    const draftKey = 'medicart-draft-' + Date.now();
    localStorage.setItem(draftKey, JSON.stringify({
      cart, customer: {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value
      },
      date: new Date().toISOString()
    }));
    showToast('Draft saved successfully!', 'success');
  });

  document.getElementById('btnRecentBills').addEventListener('click', loadRecentBills);
}

// ── Generate Bill ────────────────────────────────────────────
async function generateBill() {
  const billData = getBillData();
  const btn = document.getElementById('btnGenerateBill');
  btn.disabled = true;
  btn.innerHTML = '⏳ Processing...';

  try {
    const invoice = await api.createInvoice(billData);
    showToast(`Invoice ${invoice.invoiceNumber} generated successfully!`, 'success');

    // Update stock in local cart state
    cart.forEach(item => { item.stock -= item.quantity; });

    // Show invoice
    renderInvoice(invoice);
    document.getElementById('invoiceModal').classList.remove('hidden');

    // Clear cart
    cart = [];
    renderCart();
    updateSummary();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
  } catch (err) {
    showToast(err.message || 'Failed to generate bill', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🧾 Generate Bill & Print';
  }
}

// ── Recent Bills ─────────────────────────────────────────────
async function loadRecentBills() {
  const modal = document.getElementById('recentBillsModal');
  const list = document.getElementById('recentBillsList');
  modal.classList.remove('hidden');
  list.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">Loading...</p>';

  try {
    const data = await api.getInvoices(1, 15);
    if (!data.invoices || data.invoices.length === 0) {
      list.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">No bills found</p>';
      return;
    }

    list.innerHTML = data.invoices.map(inv => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid var(--gray-200);">
        <div>
          <div class="font-semibold">${inv.invoiceNumber}</div>
          <div class="text-xs text-muted">${inv.customer?.name || 'Walk-in'} · ${formatDateTime(inv.createdAt)}</div>
        </div>
        <div class="text-right">
          <div class="font-bold text-primary">${formatCurrency(inv.grandTotal)}</div>
          <span class="badge ${inv.status === 'completed' ? 'badge-success' : inv.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}">${inv.status}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p class="text-muted text-center" style="padding:2rem;">Failed to load bills</p>';
  }
}
