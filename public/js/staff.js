/* ============================================================
   MediCart - Staff Management Module
   Full CRUD, attendance, profile, activity tracking
   ============================================================ */

const STAFF_API = '/api/staff';
let currentPage = 1;
let editingStaffId = null;

const StaffManager = {
  async init() {
    this.loadStats();
    this.loadStaff();
    this.bindEvents();
    sessionStorage.removeItem('staffLogin');
  },

  bindEvents() {
    document.getElementById('addStaffBtn')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('saveStaffBtn')?.addEventListener('click', () => this.saveStaff());
    document.getElementById('staffSearch')?.addEventListener('input', debounce(() => this.loadStaff(), 300));
    document.getElementById('filterRole')?.addEventListener('change', () => this.loadStaff());
    document.getElementById('filterShift')?.addEventListener('change', () => this.loadStaff());
    document.getElementById('filterStatus')?.addEventListener('change', () => this.loadStaff());
    document.getElementById('staffModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeStaffModal();
    });
    document.getElementById('profileDrawer')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeProfileDrawer();
    });
    document.getElementById('attendanceModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAttendanceModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeStaffModal();
        closeProfileDrawer();
        closeAttendanceModal();
        closeAllMenus();
      }
    });
  },

  async loadStats() {
    try {
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${STAFF_API}/stats/overview`, { headers });
      if (!res.ok) return;
      const stats = await res.json();

      animateCounter(document.getElementById('statTotalStaff'), stats.totalStaff || 0);
      animateCounter(document.getElementById('statActiveStaff'), stats.activeStaff || 0);
      animateCounter(document.getElementById('statPresentToday'), stats.presentToday || 0);
      animateCounter(document.getElementById('statSuspended'), stats.suspendedStaff || 0);
    } catch (err) { /* stats are optional */ }
  },

  async loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    try {
      const search = document.getElementById('staffSearch')?.value || '';
      const role = document.getElementById('filterRole')?.value || '';
      const shift = document.getElementById('filterShift')?.value || '';
      const status = document.getElementById('filterStatus')?.value || '';
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = new URLSearchParams({ page: currentPage, limit: 20 });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (shift) params.set('shift', shift);
      if (status) params.set('status', status);

      const res = await fetch(`${STAFF_API}?${params}`, { headers });
      if (!res.ok) { tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Failed to load staff.</td></tr>'; return; }

      const data = await res.json();
      this.renderTable(data.staff || []);
      this.renderPagination(data);
      document.getElementById('staffCount').textContent = `${data.total || 0} members`;
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Error loading staff. Make sure you are logged in.</td></tr>';
    }
  },

  renderTable(staffList) {
    const tbody = document.getElementById('staffTableBody');
    if (!staffList.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">👥 No staff members found. Click "Add Staff" to get started.</td></tr>';
      return;
    }

    const user = (typeof AuthManager !== 'undefined' && AuthManager.getUser()) || null;
    const isViewer = user && user.role === 'viewer';

    tbody.innerHTML = staffList.map(s => {
      const initial = (s.name || 'U')[0].toUpperCase();
      const avatar = s.photo
        ? `<img src="${s.photo}" alt="${s.name}">`
        : initial;
      const shiftIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

      return `<tr>
        <td>
          <div class="staff-info">
            <div class="staff-avatar">${avatar}</div>
            <div>
              <div class="staff-name">${escapeHtml(s.name)}</div>
              <div class="staff-email">${escapeHtml(s.email)}</div>
            </div>
          </div>
        </td>
        <td><span class="role-badge role-badge--${s.role}">${formatRole(s.role)}</span></td>
        <td>
          <div style="font-size:0.8125rem;color:var(--gray-700)">${s.phone || '—'}</div>
        </td>
        <td><span class="shift-badge">${shiftIcon} ${formatShift(s.shift)}</span></td>
        <td><span style="font-weight:600;color:var(--gray-700)">₹${(s.salary || 0).toLocaleString('en-IN')}</span></td>
        <td><span class="status-badge status-badge--${s.status}">${s.status}</span></td>
        <td>
          <div style="font-size:0.75rem;color:var(--gray-600)">
            ${s.performance?.billsCreated || 0} bills
          </div>
        </td>
        <td>
          <div class="actions-dropdown" data-staff-id="${s._id}">
            <button class="actions-toggle" onclick="toggleActionsMenu('${s._id}')">⋮</button>
            <div class="actions-menu" id="menu-${s._id}">
              <button class="actions-menu-item" onclick="StaffManager.viewProfile('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View Profile
              </button>
              ${isViewer ? '' : `
              <button class="actions-menu-item" onclick="StaffManager.editStaff('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="actions-menu-item" onclick="StaffManager.resetPassword('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Reset Password
              </button>
              ${s.status === 'active' ? `
              <button class="actions-menu-item actions-menu-item--danger" onclick="StaffManager.toggleSuspend('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Suspend
              </button>
              ` : `
              <button class="actions-menu-item" onclick="StaffManager.activateStaff('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Activate
              </button>
              `}
              <button class="actions-menu-item actions-menu-item--danger" onclick="StaffManager.deleteStaff('${s._id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
              `}
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  renderPagination(data) {
    const container = document.getElementById('pagination');
    if (!container || data.pages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    if (data.currentPage > 1) {
      html += `<button onclick="StaffManager.goToPage(${data.currentPage - 1})">←</button>`;
    }
    for (let i = Math.max(1, data.currentPage - 2); i <= Math.min(data.pages, data.currentPage + 2); i++) {
      html += `<button class="${i === data.currentPage ? 'active' : ''}" onclick="StaffManager.goToPage(${i})">${i}</button>`;
    }
    if (data.currentPage < data.pages) {
      html += `<button onclick="StaffManager.goToPage(${data.currentPage + 1})">→</button>`;
    }
    container.innerHTML = html;
  },

  goToPage(page) {
    currentPage = page;
    this.loadStaff();
  },

  openAddModal() {
    editingStaffId = null;
    document.getElementById('staffModalTitle').textContent = '👤 Add Staff Member';
    document.getElementById('saveStaffBtn').textContent = 'Save Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('formJoiningDate').value = new Date().toISOString().split('T')[0];
    ['permBilling','permInventory','permCustomers','permMedicines'].forEach(id => document.getElementById(id).checked = true);
    ['permReports','permSettings','permStaffManagement'].forEach(id => document.getElementById(id).checked = false);
    document.getElementById('formPassword').required = true;
    openModal('staffModal');
  },

  async editStaff(id) {
    try {
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${STAFF_API}/${id}`, { headers });
      if (!res.ok) { showToast('Failed to load staff details', 'error'); return; }
      const staff = await res.json();

      editingStaffId = id;
      document.getElementById('staffModalTitle').textContent = '✏️ Edit Staff Member';
      document.getElementById('saveStaffBtn').textContent = 'Update Staff';
      document.getElementById('formName').value = staff.name || '';
      document.getElementById('formEmail').value = staff.email || '';
      document.getElementById('formPhone').value = staff.phone || '';
      document.getElementById('formRole').value = staff.role || '';
      document.getElementById('formShift').value = staff.shift || 'morning';
      document.getElementById('formSalary').value = staff.salary || '';
      document.getElementById('formAddress').value = staff.address || '';
      document.getElementById('formJoiningDate').value = staff.joiningDate ? staff.joiningDate.split('T')[0] : '';
      document.getElementById('formPassword').required = false;
      document.getElementById('formPassword').value = '';

      if (staff.permissions) {
        document.getElementById('permBilling').checked = staff.permissions.billing !== false;
        document.getElementById('permInventory').checked = staff.permissions.inventory !== false;
        document.getElementById('permReports').checked = staff.permissions.reports === true;
        document.getElementById('permCustomers').checked = staff.permissions.customers !== false;
        document.getElementById('permMedicines').checked = staff.permissions.medicines !== false;
        document.getElementById('permSettings').checked = staff.permissions.settings === true;
        document.getElementById('permStaffManagement').checked = staff.permissions.staff_management === true;
      }

      openModal('staffModal');
    } catch (err) {
      showToast('Error loading staff details', 'error');
    }
  },

  async saveStaff() {
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const password = document.getElementById('formPassword').value;
    const phone = document.getElementById('formPhone').value.trim();
    const role = document.getElementById('formRole').value;
    const shift = document.getElementById('formShift').value;
    const salary = parseFloat(document.getElementById('formSalary').value) || 0;
    const address = document.getElementById('formAddress').value.trim();
    const joiningDate = document.getElementById('formJoiningDate').value;

    if (!name || !email) { showToast('Name and email are required.', 'error'); return; }
    if (!editingStaffId && (!password || password.length < 6)) { showToast('Password must be at least 6 characters.', 'error'); return; }

    const permissions = {
      billing: document.getElementById('permBilling').checked,
      inventory: document.getElementById('permInventory').checked,
      reports: document.getElementById('permReports').checked,
      customers: document.getElementById('permCustomers').checked,
      medicines: document.getElementById('permMedicines').checked,
      settings: document.getElementById('permSettings').checked,
      staff_management: document.getElementById('permStaffManagement').checked
    };

    try {
      const token = AuthManager.getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const body = { name, email, phone, role, shift, salary, address, joiningDate, permissions };
      if (password) body.password = password;

      let res;
      if (editingStaffId) {
        res = await fetch(`${STAFF_API}/${editingStaffId}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      } else {
        res = await fetch(STAFF_API, { method: 'POST', headers, body: JSON.stringify(body) });
      }

      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || 'Failed to save staff', 'error');
        return;
      }

      showToast(editingStaffId ? 'Staff member updated successfully' : 'Staff member added successfully', 'success');
      closeStaffModal();
      this.loadStaff();
      this.loadStats();
    } catch (err) {
      showToast('Error saving staff member', 'error');
    }
  },

  async deleteStaff(id) {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;

    try {
      const token = AuthManager.getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${STAFF_API}/${id}`, { method: 'DELETE', headers });

      if (!res.ok) { showToast('Failed to delete staff member', 'error'); return; }

      showToast('Staff member deleted successfully', 'success');
      closeAllMenus();
      this.loadStaff();
      this.loadStats();
    } catch (err) {
      showToast('Error deleting staff member', 'error');
    }
  },

  async toggleSuspend(id) {
    try {
      const token = AuthManager.getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${STAFF_API}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'suspended' })
      });

      if (!res.ok) { showToast('Failed to suspend staff member', 'error'); return; }

      showToast('Staff member suspended', 'warning');
      closeAllMenus();
      this.loadStaff();
    } catch (err) {
      showToast('Error suspending staff member', 'error');
    }
  },

  async activateStaff(id) {
    try {
      const token = AuthManager.getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${STAFF_API}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'active' })
      });

      if (!res.ok) { showToast('Failed to activate staff member', 'error'); return; }

      showToast('Staff member activated', 'success');
      closeAllMenus();
      this.loadStaff();
    } catch (err) {
      showToast('Error activating staff member', 'error');
    }
  },

  async resetPassword(id) {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }

    try {
      const token = AuthManager.getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${STAFF_API}/${id}/reset-password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ newPassword })
      });

      if (!res.ok) { showToast('Failed to reset password', 'error'); return; }

      showToast('Password reset successfully', 'success');
      closeAllMenus();
    } catch (err) {
      showToast('Error resetting password', 'error');
    }
  },

  async viewProfile(id) {
    try {
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${STAFF_API}/${id}`, { headers });
      if (!res.ok) { showToast('Failed to load profile', 'error'); return; }

      const staff = await res.json();
      this.renderProfile(staff);
      openDrawer('profileDrawer');
      closeAllMenus();
    } catch (err) {
      showToast('Error loading profile', 'error');
    }
  },

  renderProfile(staff) {
    const container = document.getElementById('profileDrawerBody');
    const initial = (staff.name || 'U')[0].toUpperCase();
    const avatar = staff.photo ? `<img src="${staff.photo}" alt="${staff.name}">` : initial;

    const recentActivity = (staff.activityLogs || []).slice(-10).reverse().map(a => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-action">${escapeHtml(a.action)}${a.details ? ': ' + escapeHtml(a.details) : ''}</div>
          <div class="activity-time">${formatDate(a.timestamp)}</div>
        </div>
      </div>
    `).join('') || '<div style="text-align:center;color:var(--gray-400);padding:1rem 0">No recent activity</div>';

    container.innerHTML = `
      <div class="profile-header">
        <div class="profile-img">${avatar}</div>
        <div class="profile-name">${escapeHtml(staff.name)}</div>
        <div class="profile-email">${escapeHtml(staff.email)}</div>
        <div class="profile-role-row"><span class="role-badge role-badge--${staff.role}">${formatRole(staff.role)}</span></div>
      </div>

      <div class="profile-stats-grid">
        <div class="profile-stat">
          <div class="profile-stat__value">${staff.performance?.billsCreated || 0}</div>
          <div class="profile-stat__label">Bills Created</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__value">₹${(staff.performance?.totalSales || 0).toLocaleString('en-IN')}</div>
          <div class="profile-stat__label">Total Sales</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__value">${formatShift(staff.shift)}</div>
          <div class="profile-stat__label">Shift</div>
        </div>
        <div class="profile-stat">
          <div class="profile-stat__value"><span class="status-badge status-badge--${staff.status}" style="font-size:0.75rem">${staff.status}</span></div>
          <div class="profile-stat__label">Status</div>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section__title">Contact Details</div>
        <div class="profile-detail">
          <span class="profile-detail__label">📧 Email</span>
          <span class="profile-detail__value">${escapeHtml(staff.email)}</span>
        </div>
        <div class="profile-detail">
          <span class="profile-detail__label">📞 Phone</span>
          <span class="profile-detail__value">${staff.phone || '—'}</span>
        </div>
        <div class="profile-detail">
          <span class="profile-detail__label">📍 Address</span>
          <span class="profile-detail__value">${staff.address || '—'}</span>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section__title">Employment</div>
        <div class="profile-detail">
          <span class="profile-detail__label">💰 Salary</span>
          <span class="profile-detail__value">₹${(staff.salary || 0).toLocaleString('en-IN')}/month</span>
        </div>
        <div class="profile-detail">
          <span class="profile-detail__label">📅 Joined</span>
          <span class="profile-detail__value">${formatDate(staff.joiningDate)}</span>
        </div>
        <div class="profile-detail">
          <span class="profile-detail__label">🕐 Shift Timing</span>
          <span class="profile-detail__value">${staff.shiftTiming?.start || '09:00'} - ${staff.shiftTiming?.end || '17:00'}</span>
        </div>
        <div class="profile-detail">
          <span class="profile-detail__label">📊 Attendance</span>
          <span class="profile-detail__value"><a href="#" onclick="StaffManager.viewAttendance('${staff._id}');return false;">View History →</a></span>
        </div>
      </div>

      <div class="profile-section">
        <div class="profile-section__title" style="display:flex;align-items:center;justify-content:space-between">
          <span>📋 Recent Activity</span>
          <span style="font-weight:400;font-size:0.6875rem;color:var(--gray-400)">Last 10</span>
        </div>
        <div class="activity-timeline">${recentActivity}</div>
      </div>
    `;
  },

  async viewAttendance(id) {
    try {
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      document.getElementById('attendanceMonth').value = month;
      document.getElementById('attendanceYear').value = year;

      const yearSelect = document.getElementById('attendanceYear');
      yearSelect.innerHTML = '';
      for (let y = year - 2; y <= year + 1; y++) {
        yearSelect.innerHTML += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;
      }

      document.getElementById('attendanceMonth').onchange = () => this.loadAttendance(id);
      document.getElementById('attendanceYear').onchange = () => this.loadAttendance(id);

      this.attendanceStaffId = id;
      await this.loadAttendance(id);
      openModal('attendanceModal');
    } catch (err) {
      showToast('Error loading attendance', 'error');
    }
  },

  async loadAttendance(staffId) {
    const id = staffId || this.attendanceStaffId;
    if (!id) return;

    try {
      const token = AuthManager.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const month = document.getElementById('attendanceMonth').value;
      const year = document.getElementById('attendanceYear').value;

      const res = await fetch(`${STAFF_API}/${id}/attendance?month=${month}&year=${year}`, { headers });
      if (!res.ok) return;

      const data = await res.json();
      const list = document.getElementById('attendanceList');
      const att = data.attendance || [];

      if (!att.length) {
        list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--gray-400)">No attendance records for this month.</div>';
        return;
      }

      list.innerHTML = att.map(a => {
        const clockIn = a.clockIn ? new Date(a.clockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
        const clockOut = a.clockOut ? new Date(a.clockOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
        const hours = a.workingHours ? a.workingHours.toFixed(1) + ' hrs' : '—';
        const statusEmoji = a.status === 'present' ? '✅' : a.status === 'late' ? '⚠️' : a.status === 'half-day' ? '⏳' : '❌';
        return `<div class="attendance-item">
          <div><span class="attendance-date">${formatDate(a.date)}</span></div>
          <div><span class="attendance-time">${statusEmoji} ${clockIn} - ${clockOut}</span></div>
          <div><span class="attendance-hours">${hours}</span></div>
        </div>`;
      }).join('');
    } catch (err) {
      // silent
    }
  },

  openClockInModal() { /* handled by inline buttons */ }
};

/* ── Modal / Drawer Helpers ───────────────────────────────── */
function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}
function closeStaffModal() {
  document.getElementById('staffModal')?.classList.add('hidden');
}
function openDrawer(id) {
  document.getElementById(id)?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeProfileDrawer() {
  document.getElementById('profileDrawer')?.classList.add('hidden');
  document.body.style.overflow = '';
}
function closeAttendanceModal() {
  document.getElementById('attendanceModal')?.classList.add('hidden');
}
function toggleActionsMenu(id) {
  closeAllMenus();
  const menu = document.getElementById(`menu-${id}`);
  if (menu) menu.classList.toggle('open');
}
function closeAllMenus() {
  document.querySelectorAll('.actions-menu').forEach(m => m.classList.remove('open'));
}
function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  if (input) input.type = input.type === 'password' ? 'text' : 'password';
}

/* ── Helpers ──────────────────────────────────────────────── */
function formatRole(role) {
  const map = { admin: 'Admin', pharmacist: 'Pharmacist', cashier: 'Cashier', inventory_manager: 'Inventory Mgr', sales_staff: 'Sales Staff' };
  return map[role] || role;
}
function formatShift(shift) {
  const map = { morning: 'Morning', afternoon: 'Afternoon', night: 'Night', flexible: 'Flexible' };
  return map[shift] || shift;
}
function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
