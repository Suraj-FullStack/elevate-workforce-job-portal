// Main App Controller - Page Navigation and Initialization

let currentPageName = 'home';
const pageHistory = [];

function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
  
  // Show target page
  const targetPage = document.getElementById(`page-${pageName}`);
  if (!targetPage) { console.warn(`Page ${pageName} not found`); return; }
  
  targetPage.classList.remove('hidden');
  
  // Track history
  if (currentPageName !== pageName) {
    pageHistory.push(currentPageName);
  }
  currentPageName = pageName;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Page-specific initializations
  onPageLoad(pageName);
}

function goBack() {
  const prevPage = pageHistory.pop() || 'home';
  showPage(prevPage);
}

function onPageLoad(pageName) {
  switch (pageName) {
    case 'home':
      loadFeaturedJobs();
      loadCategories();
      loadFeaturedCompanies();
      loadHomeStats();
      break;
    case 'jobs':
      loadJobsList(1);
      break;
    case 'companies':
      loadCompaniesList();
      break;
    case 'dashboard':
      if (!currentUser) { showPage('login'); return; }
      if (currentUser.role !== 'company') { showPage('home'); return; }
      loadDashboard();
      break;
    case 'post-job':
      if (!currentUser) { showPage('login'); return; }
      if (currentUser.role !== 'company') { 
        showToast('Only companies can post jobs', 'error');
        showPage('home'); 
        return; 
      }
      break;
    case 'my-applications':
      if (!currentUser) { showPage('login'); return; }
      if (currentUser.role !== 'job_seeker') { showPage('home'); return; }
      loadMyApplications();
      break;
    case 'profile':
      if (!currentUser) { showPage('login'); return; }
      loadProfilePage();
      break;
  }
}

async function loadHomeStats() {
  try {
    const [jobs, companies] = await Promise.all([
      api.get('/jobs?limit=1'),
      api.get('/companies?limit=1')
    ]);
    
    const totalJobs = jobs.data.pagination.total;
    const totalCompanies = companies.data.pagination.total;
    
    animateCounter('stat-jobs', totalJobs);
    animateCounter('stat-companies', totalCompanies);
    animateCounter('stat-applicants', totalCompanies * 15 + 42); // Approximate
  } catch (err) {
    // Silent fail for stats
  }
}

function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let current = 0;
  const duration = 1000;
  const steps = 30;
  const increment = target / steps;
  const interval = duration / steps;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
      el.textContent = target + '+';
    } else {
      el.textContent = Math.floor(current) + '+';
    }
  }, interval);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeApplyModal();
    document.getElementById('profile-dropdown')?.classList.add('hidden');
  }
});

// Search on Enter key in filter inputs
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.id === 'filter-search' || activeEl.id === 'filter-city')) {
      applyFilters();
    }
    if (activeEl && (activeEl.id === 'hero-search' || activeEl.id === 'hero-location')) {
      heroSearch();
    }
  }
});

// Close apply modal on backdrop click
document.getElementById('apply-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('apply-modal')) {
    closeApplyModal();
  }
});

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize auth state
  await initAuth();
  
  // Show home page by default
  showPage('home');
  
  console.log('🚀 Elevate Workforce Solutions initialized');
});
