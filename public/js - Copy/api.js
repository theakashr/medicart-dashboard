/* ============================================================
   MediCart - API Helper Functions
   Centralized API calls to the Express backend
   ============================================================ */

const API_BASE = '/api';

/**
 * Fetch wrapper that automatically appends the JWT authorization header
 */
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('medicart-token');
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

const api = {
  /**
   * Search medicines by query string
   */
  async searchMedicines(query, category = '') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    const res = await fetchWithAuth(`${API_BASE}/medicines/search?${params}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  /**
   * Get all medicines with pagination
   */
  async getMedicines(page = 1, limit = 50) {
    const res = await fetchWithAuth(`${API_BASE}/medicines?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load medicines');
    return res.json();
  },

  /**
   * Get single medicine by ID
   */
  async getMedicine(id) {
    const res = await fetchWithAuth(`${API_BASE}/medicines/${id}`);
    if (!res.ok) throw new Error('Medicine not found');
    return res.json();
  },

  /**
   * Create a new medicine
   */
  async createMedicine(medicineData) {
    const res = await fetchWithAuth(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicineData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create medicine');
    }
    return res.json();
  },

  /**
   * Update a medicine
   */
  async updateMedicine(id, medicineData) {
    const res = await fetchWithAuth(`${API_BASE}/medicines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicineData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update medicine');
    }
    return res.json();
  },

  /**
   * Delete a medicine
   */
  async deleteMedicine(id) {
    const res = await fetchWithAuth(`${API_BASE}/medicines/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete medicine');
    }
    return res.json();
  },

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData) {
    const res = await fetchWithAuth(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create invoice');
    }
    return res.json();
  },

  /**
   * Get recent invoices
   */
  async getInvoices(page = 1, limit = 20) {
    const res = await fetchWithAuth(`${API_BASE}/invoices?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load invoices');
    return res.json();
  },

  /**
   * Search customers
   */
  async searchCustomers(query) {
    const res = await fetchWithAuth(`${API_BASE}/customers/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Customer search failed');
    return res.json();
  },

  /**
   * Get shop configuration
   */
  async getShopConfig() {
    const res = await fetchWithAuth(`${API_BASE}/shop-config`);
    if (!res.ok) throw new Error('Failed to load shop config');
    return res.json();
  },

  /**
   * Get medicine stats for dashboard
   */
  async getMedicineStats() {
    const res = await fetchWithAuth(`${API_BASE}/medicines/stats/overview`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  /**
   * Get invoice/sales stats
   */
  async getInvoiceStats() {
    const res = await fetchWithAuth(`${API_BASE}/invoices/stats/overview`);
    if (!res.ok) throw new Error('Failed to load sales stats');
    return res.json();
  }
};
