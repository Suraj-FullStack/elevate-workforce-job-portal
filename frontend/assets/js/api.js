// API Configuration
const API_BASE = '/api';

// Generic API call wrapper
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    } catch (err) {
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

// Utility Functions
function formatSalary(min, max, currency = 'NPR') {
  const fmt = (n) => {
    if (!n) return null;
    return new Intl.NumberFormat('en-NP').format(n);
  };
  if (min && max) return `${currency} ${fmt(min)} - ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return 'Salary Negotiable';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}

function getJobTypeBadge(type) {
  const labels = {
    'full_time': 'Full Time', 'part_time': 'Part Time', 'contract': 'Contract',
    'internship': 'Internship', 'remote': 'Remote'
  };
  return `<span class="badge badge-type-${type}">${labels[type] || type}</span>`;
}

function getLevelBadge(level) {
  const labels = {
    'entry': 'Entry Level', 'mid': 'Mid Level', 'senior': 'Senior',
    'lead': 'Lead', 'executive': 'Executive'
  };
  return `<span class="badge badge-level-${level}">${labels[level] || level}</span>`;
}

function getStatusBadge(status) {
  const labels = {
    'pending': 'Pending', 'reviewed': 'Reviewed', 'shortlisted': 'Shortlisted',
    'rejected': 'Rejected', 'hired': 'Hired'
  };
  return `<span class="badge status-${status}">${labels[status] || status}</span>`;
}

function getCompanyInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '?';
}

function getCompanyColor(index) {
  return `company-color-${(index || 0) % 7}`;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toast-icon');
  const msg = document.getElementById('toast-message');
  
  icon.className = type === 'success' ? 'fas fa-check-circle text-green-400' : 'fas fa-exclamation-circle text-red-400';
  msg.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('show');
  }, 3500);
}

function setLoading(btnId, loading, text = 'Loading...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || text;
  }
}

function showError(id, message) {
  const el = document.getElementById(id);
  if (el) { el.textContent = message; el.classList.remove('hidden'); }
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function showSuccess(id, message) {
  const el = document.getElementById(id);
  if (el) { el.textContent = message; el.classList.remove('hidden'); }
}
