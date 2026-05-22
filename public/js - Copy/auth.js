/* ============================================================
   MediCart - Authentication Logic
   Firebase Google + Email auth, JWT session, protected routes
   ============================================================ */

const AUTH_API = '/api/auth';

// ── Auth State Manager ───────────────────────────────────────
const AuthManager = {
  /**
   * Get stored JWT token
   */
  getToken() {
    return localStorage.getItem('medicart-token');
  },

  /**
   * Get stored user data
   */
  getUser() {
    const data = localStorage.getItem('medicart-user');
    return data ? JSON.parse(data) : null;
  },

  /**
   * Save auth session
   */
  saveSession(token, user) {
    localStorage.setItem('medicart-token', token);
    localStorage.setItem('medicart-user', JSON.stringify(user));
  },

  /**
   * Clear auth session
   */
  clearSession() {
    localStorage.removeItem('medicart-token');
    localStorage.removeItem('medicart-user');
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return !!this.getToken();
  },

  /**
   * Send Firebase user data to backend and get JWT
   */
  async syncWithBackend(firebaseUser, provider = 'google') {
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          photo: firebaseUser.photoURL || '',
          provider
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Backend sync failed');
      }

      const data = await res.json();
      this.saveSession(data.token, data.user);
      return data;
    } catch (err) {
      console.error('Backend sync error:', err);
      throw err;
    }
  },

  /**
   * Verify current token with backend
   */
  async verifySession() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch(`${AUTH_API}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};

// ── Google Sign In ───────────────────────────────────────────
async function signInWithGoogle() {
  try {
    showAuthLoading(true);
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;

    // Sync with backend (saves to MongoDB + gets JWT)
    await AuthManager.syncWithBackend(user, 'google');

    showAuthToast('Welcome, ' + user.displayName + '!', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  } catch (err) {
    console.error('Google sign-in error:', err);
    handleAuthError(err);
  } finally {
    showAuthLoading(false);
  }
}

// ── Email/Password Sign Up ───────────────────────────────────
async function signUpWithEmail(name, email, password) {
  try {
    showAuthLoading(true);

    // Create user in Firebase
    const result = await auth.createUserWithEmailAndPassword(email, password);

    // Update display name
    await result.user.updateProfile({ displayName: name });

    // Sync with backend
    await AuthManager.syncWithBackend(
      { ...result.user, displayName: name },
      'email'
    );

    showAuthToast('Account created successfully!', 'success');

    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  } catch (err) {
    console.error('Signup error:', err);
    handleAuthError(err);
  } finally {
    showAuthLoading(false);
  }
}

// ── Email/Password Login ─────────────────────────────────────
async function loginWithEmail(email, password) {
  try {
    showAuthLoading(true);

    const result = await auth.signInWithEmailAndPassword(email, password);

    // Sync with backend
    await AuthManager.syncWithBackend(result.user, 'email');

    showAuthToast('Welcome back!', 'success');

    setTimeout(() => {
      window.location.href = '/';
    }, 800);
  } catch (err) {
    console.error('Login error:', err);
    handleAuthError(err);
  } finally {
    showAuthLoading(false);
  }
}

// ── Forgot Password ─────────────────────────────────────────
async function resetPassword(email) {
  try {
    showAuthLoading(true);
    await auth.sendPasswordResetEmail(email);
    showAuthToast('Password reset email sent! Check your inbox.', 'success');
  } catch (err) {
    handleAuthError(err);
  } finally {
    showAuthLoading(false);
  }
}

// ── Logout ───────────────────────────────────────────────────
async function logout() {
  try {
    await auth.signOut();
    AuthManager.clearSession();
    window.location.href = '/login.html';
  } catch (err) {
    console.error('Logout error:', err);
    AuthManager.clearSession();
    window.location.href = '/login.html';
  }
}

// ── Firebase Auth State Listener ─────────────────────────────
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('🔐 Auth state: Signed in as', user.email);
  } else {
    console.log('🔓 Auth state: Signed out');
  }
});

// ── Protect Page (call on protected pages) ───────────────────
async function requireAuth() {
  if (!AuthManager.isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }

  const valid = await AuthManager.verifySession();
  if (!valid) {
    AuthManager.clearSession();
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ── Redirect if already logged in (call on login/signup) ─────
function redirectIfLoggedIn() {
  if (AuthManager.isLoggedIn()) {
    window.location.href = '/';
  }
}

// ── Error Handler ────────────────────────────────────────────
function handleAuthError(err) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed. Try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please check and try again.',
    'auth/popup-blocked': 'Popup blocked by browser. Please allow popups.',
  };

  const code = err.code || '';
  const msg = messages[code] || err.message || 'Authentication failed. Please try again.';
  showAuthToast(msg, 'error');

  // Show inline error if form exists
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }
}

// ── UI Helpers ───────────────────────────────────────────────
function showAuthLoading(show) {
  const loader = document.getElementById('authLoader');
  const btns = document.querySelectorAll('.auth-btn');

  if (loader) loader.classList.toggle('hidden', !show);
  btns.forEach(btn => { btn.disabled = show; });
}

function showAuthToast(message, type = 'success') {
  // Use global toast if available
  if (typeof showToast === 'function') {
    showToast(message, type);
    return;
  }

  // Standalone toast for auth pages
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

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
  }, 4000);
}

// ── Render User Profile in Dashboard ─────────────────────────
function renderUserProfile() {
  const user = AuthManager.getUser();
  if (!user) return;

  // Update avatar
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) {
    if (user.photo) {
      avatarEl.innerHTML = `<img src="${user.photo}" alt="${user.name}" referrerpolicy="no-referrer">`;
    } else {
      avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
    }
  }

  // Update name
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name || 'User';

  // Update email
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = user.email || '';

  // Update role badge
  const roleEl = document.getElementById('userRole');
  if (roleEl) roleEl.textContent = user.role || 'admin';
}
