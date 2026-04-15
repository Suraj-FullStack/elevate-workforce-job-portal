// Authentication Management
let currentUser = null;

function getToken() { return localStorage.getItem('token'); }
function setToken(token) { localStorage.setItem('token', token); }
function clearToken() { localStorage.removeItem('token'); localStorage.removeItem('user'); }

async function initAuth() {
  const token = getToken();
  if (!token) { updateNavbar(null); return; }
  
  try {
    const data = await api.get('/auth/me');
    currentUser = data.data.user;
    updateNavbar(currentUser);
  } catch (err) {
    clearToken();
    currentUser = null;
    updateNavbar(null);
  }
}

function updateNavbar(user) {
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const companyLinks = document.getElementById('company-nav-links');
  const seekerLinks = document.getElementById('seeker-nav-links');
  const navAvatar = document.getElementById('nav-avatar');
  const navUsername = document.getElementById('nav-username');

  if (user) {
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    userMenu.classList.add('flex');
    navAvatar.textContent = getCompanyInitials(user.full_name);
    navUsername.textContent = user.full_name.split(' ')[0];
    
    if (user.role === 'company') {
      companyLinks.classList.remove('hidden');
      companyLinks.classList.add('flex');
      seekerLinks.classList.add('hidden');
    } else {
      seekerLinks.classList.remove('hidden');
      seekerLinks.classList.add('flex');
      companyLinks.classList.add('hidden');
    }
  } else {
    authButtons.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  hideError('login-error');
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  setLoading('login-btn', true, 'Signing in...');
  
  try {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.data.token);
    currentUser = data.data.user;
    updateNavbar(currentUser);
    showToast(`Welcome back, ${currentUser.full_name.split(' ')[0]}! 👋`);
    
    if (currentUser.role === 'company') {
      showPage('dashboard');
    } else {
      showPage('jobs');
    }
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    setLoading('login-btn', false, 'Sign In');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  hideError('register-error');
  hideError('register-success');
  
  const role = document.getElementById('register-role').value;
  const body = {
    full_name: document.getElementById('register-name').value,
    email: document.getElementById('register-email').value,
    password: document.getElementById('register-password').value,
    phone: document.getElementById('register-phone').value,
    location: document.getElementById('register-location').value,
    role
  };
  
  if (role === 'company') {
    body.company_name = document.getElementById('register-company-name').value;
    if (!body.company_name) {
      showError('register-error', 'Company name is required.');
      return;
    }
  }
  
  setLoading('register-btn', true, 'Creating account...');
  
  try {
    const data = await api.post('/auth/register', body);
    setToken(data.data.token);
    currentUser = data.data.user;
    updateNavbar(currentUser);
    showToast(`Account created! Welcome to Elevate! 🎉`);
    
    if (currentUser.role === 'company') {
      showPage('dashboard');
    } else {
      showPage('jobs');
    }
  } catch (err) {
    showError('register-error', err.message);
  } finally {
    setLoading('register-btn', false, 'Create Account');
  }
}

function logout() {
  clearToken();
  currentUser = null;
  updateNavbar(null);
  toggleDropdown(false);
  showToast('You have been logged out.', 'info');
  showPage('home');
}

function setRegisterRole(role) {
  document.getElementById('register-role').value = role;
  const seekerTab = document.getElementById('seeker-tab');
  const companyTab = document.getElementById('company-tab');
  const companyNameField = document.getElementById('company-name-field');
  
  if (role === 'company') {
    companyTab.classList.add('bg-white', 'text-primary-600', 'shadow-sm');
    companyTab.classList.remove('text-gray-500');
    seekerTab.classList.remove('bg-white', 'text-primary-600', 'shadow-sm');
    seekerTab.classList.add('text-gray-500');
    companyNameField.classList.remove('hidden');
  } else {
    seekerTab.classList.add('bg-white', 'text-primary-600', 'shadow-sm');
    seekerTab.classList.remove('text-gray-500');
    companyTab.classList.remove('bg-white', 'text-primary-600', 'shadow-sm');
    companyTab.classList.add('text-gray-500');
    companyNameField.classList.add('hidden');
  }
}

function fillDemo(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
}

function showRegisterCompany() {
  showPage('register');
  setTimeout(() => setRegisterRole('company'), 100);
}

function toggleDropdown(forceClose) {
  const dropdown = document.getElementById('profile-dropdown');
  if (forceClose === false || !dropdown.classList.contains('hidden')) {
    dropdown.classList.add('hidden');
  } else {
    dropdown.classList.remove('hidden');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('profile-dropdown-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('profile-dropdown')?.classList.add('hidden');
  }
});

// Load profile page
async function loadProfilePage() {
  if (!currentUser) { showPage('login'); return; }
  
  const profileContent = document.getElementById('profile-content');
  
  try {
    const data = await api.get('/auth/me');
    const { user, profile } = data.data;
    
    let profileSpecificHTML = '';
    if (user.role === 'company' && profile) {
      profileSpecificHTML = `
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p class="text-xs text-gray-500">Company</p>
            <p class="font-medium">${profile.company_name || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Industry</p>
            <p class="font-medium">${profile.industry || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Company Size</p>
            <p class="font-medium">${profile.company_size || '—'} employees</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Website</p>
            <p class="font-medium">${profile.website ? `<a href="${profile.website}" target="_blank" class="text-primary-600 hover:underline">${profile.website}</a>` : '—'}</p>
          </div>
        </div>`;
    } else if (user.role === 'job_seeker' && profile) {
      profileSpecificHTML = `
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div class="col-span-2">
            <p class="text-xs text-gray-500">Professional Headline</p>
            <p class="font-medium">${profile.headline || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Experience</p>
            <p class="font-medium">${profile.experience_years || 0} years</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Availability</p>
            <p class="font-medium capitalize">${profile.availability || 'immediately'}</p>
          </div>
          ${profile.skills ? `
          <div class="col-span-2">
            <p class="text-xs text-gray-500 mb-2">Skills</p>
            <div class="flex flex-wrap gap-2">
              ${profile.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>`;
    }
    
    profileContent.innerHTML = `
      <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div class="flex items-center gap-5 mb-6">
          <div class="profile-avatar-lg">
            ${getCompanyInitials(user.full_name)}
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">${user.full_name}</h2>
            <p class="text-gray-500 text-sm">${user.email}</p>
            <span class="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'company' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
              <i class="fas ${user.role === 'company' ? 'fa-building' : 'fa-user'}"></i>
              ${user.role === 'company' ? 'Company' : 'Job Seeker'}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="font-medium">${user.email}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Phone</p>
            <p class="font-medium">${user.phone || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Location</p>
            <p class="font-medium">${user.location || '—'}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Member Since</p>
            <p class="font-medium">${formatDate(user.created_at)}</p>
          </div>
          ${user.bio ? `<div class="col-span-2"><p class="text-xs text-gray-500">Bio</p><p class="text-sm text-gray-700">${user.bio}</p></div>` : ''}
        </div>
        ${profileSpecificHTML}
      </div>`;
  } catch (err) {
    profileContent.innerHTML = `<div class="text-center py-12 text-red-500">${err.message}</div>`;
  }
}
