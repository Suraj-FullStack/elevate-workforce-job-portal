// Jobs Management
let currentPage = 1;
let currentJobId = null;
let previousPage = 'home';
const JOBS_PER_PAGE = 8;

async function loadFeaturedJobs() {
  const container = document.getElementById('featured-jobs');
  try {
    const data = await api.get('/jobs?limit=6&sort=created_at');
    const jobs = data.data.jobs;
    
    // Update stats
    document.getElementById('stat-jobs').textContent = data.data.pagination.total + '+';
    
    if (!jobs.length) {
      container.innerHTML = '<div class="col-span-3 text-center text-gray-400 py-8">No jobs available yet.</div>';
      return;
    }
    
    container.innerHTML = jobs.map((job, i) => createJobCard(job, i)).join('');
  } catch (err) {
    container.innerHTML = '<div class="col-span-3 text-center text-red-400 py-8">Failed to load jobs.</div>';
  }
}

async function loadCategories() {
  const container = document.getElementById('categories-grid');
  const categoryIcons = {
    'Engineering': { icon: 'fa-code', color: 'blue' },
    'Data Science': { icon: 'fa-chart-line', color: 'purple' },
    'Design': { icon: 'fa-paint-brush', color: 'pink' },
    'DevOps': { icon: 'fa-server', color: 'green' },
    'Business': { icon: 'fa-briefcase', color: 'yellow' },
    'Operations': { icon: 'fa-cogs', color: 'orange' },
    'Marketing': { icon: 'fa-bullhorn', color: 'red' },
    'Finance': { icon: 'fa-dollar-sign', color: 'emerald' },
  };
  
  try {
    const data = await api.get('/jobs/categories');
    const categories = data.data;
    
    const colorMap = { blue: '#3b82f6', purple: '#8b5cf6', pink: '#ec4899', green: '#10b981', yellow: '#f59e0b', orange: '#f97316', red: '#ef4444', emerald: '#059669' };
    
    if (!categories.length) {
      container.innerHTML = '<div class="col-span-4 text-center text-gray-400">No categories yet.</div>';
      return;
    }
    
    container.innerHTML = categories.map(cat => {
      const info = categoryIcons[cat.category] || { icon: 'fa-folder', color: 'blue' };
      const color = colorMap[info.color] || '#3b82f6';
      return `
        <div class="category-card" onclick="quickFilter('${cat.category}')">
          <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style="background: ${color}20">
            <i class="fas ${info.icon} text-xl" style="color: ${color}"></i>
          </div>
          <h3 class="font-semibold text-gray-800 text-sm">${cat.category}</h3>
          <p class="text-xs text-gray-400 mt-1">${cat.job_count} jobs</p>
        </div>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div class="col-span-4 text-center text-gray-400">Failed to load categories.</div>';
  }
}

async function loadJobsList(page = 1) {
  currentPage = page;
  const container = document.getElementById('jobs-list');
  const countText = document.getElementById('jobs-count-text');
  
  const search = document.getElementById('filter-search')?.value || '';
  const city = document.getElementById('filter-city')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const job_type = document.getElementById('filter-job-type')?.value || '';
  const experience_level = document.getElementById('filter-experience')?.value || '';
  const sort = document.getElementById('jobs-sort')?.value || 'created_at';
  
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', JOBS_PER_PAGE);
  params.set('sort', sort);
  if (search) params.set('search', search);
  if (city) params.set('city', city);
  if (category) params.set('category', category);
  if (job_type) params.set('job_type', job_type);
  if (experience_level) params.set('experience_level', experience_level);
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-primary-600 text-2xl"></i></div>';
  
  try {
    const data = await api.get(`/jobs?${params}`);
    const { jobs, pagination } = data.data;
    
    countText.textContent = `Showing ${Math.min((page-1)*JOBS_PER_PAGE + 1, pagination.total)}-${Math.min(page*JOBS_PER_PAGE, pagination.total)} of ${pagination.total} jobs`;
    
    if (!jobs.length) {
      container.innerHTML = `
        <div class="text-center py-16 text-gray-400">
          <i class="fas fa-search text-4xl mb-4 block"></i>
          <p class="text-lg font-medium">No jobs found</p>
          <p class="text-sm mt-1">Try adjusting your filters</p>
          <button onclick="clearFilters()" class="mt-4 text-primary-600 hover:text-primary-800 text-sm font-medium">Clear Filters</button>
        </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }
    
    container.innerHTML = jobs.map((job, i) => createJobListItem(job, i)).join('');
    renderPagination(pagination);
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400">${err.message}</div>`;
  }
}

function createJobCard(job, index = 0) {
  return `
    <div class="job-card" onclick="viewJob(${job.id})">
      <div class="flex items-start gap-3">
        <div class="company-logo ${getCompanyColor(index)}">${getCompanyInitials(job.company_name)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-gray-800 text-sm leading-tight">${job.title}</h3>
            ${job.company_verified ? '<i class="fas fa-check-circle text-blue-500 text-xs" title="Verified"></i>' : ''}
          </div>
          <p class="text-gray-500 text-xs mt-0.5">${job.company_name}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${getJobTypeBadge(job.job_type)}
        ${getLevelBadge(job.experience_level)}
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-500">
        <span><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>${job.city || 'Nepal'}</span>
        <span class="salary-text"><i class="fas fa-money-bill-wave mr-1"></i>${formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-gray-50 text-xs text-gray-400">
        <span><i class="fas fa-users mr-1"></i>${job.applications_count || 0} applicants</span>
        <span>${timeAgo(job.created_at)}</span>
      </div>
    </div>`;
}

function createJobListItem(job, index = 0) {
  return `
    <div class="job-card md:flex-row md:items-center" onclick="viewJob(${job.id})">
      <div class="flex items-start gap-4 flex-1 min-w-0">
        <div class="company-logo ${getCompanyColor(index)} w-12 h-12">${getCompanyInitials(job.company_name)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-gray-800">${job.title}</h3>
            ${job.company_verified ? '<i class="fas fa-check-circle text-blue-500 text-xs" title="Verified Company"></i>' : ''}
          </div>
          <div class="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
            <span class="font-medium text-gray-700">${job.company_name}</span>
            <span class="hidden md:inline">•</span>
            <span><i class="fas fa-map-marker-alt mr-1 text-gray-400 text-xs"></i>${job.city || 'Nepal'}</span>
            <span class="hidden md:inline">•</span>
            <span class="salary-text font-medium"><i class="fas fa-money-bill-wave mr-1 text-xs"></i>${formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${getJobTypeBadge(job.job_type)}
            ${getLevelBadge(job.experience_level)}
            ${job.category ? `<span class="badge" style="background:#f0fdf4;color:#166534">${job.category}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-3 md:mt-0 md:ml-4 flex-shrink-0">
        <div class="text-right hidden md:block">
          <p class="text-xs text-gray-400">${timeAgo(job.created_at)}</p>
          <p class="text-xs text-gray-400 mt-0.5">${job.applications_count || 0} applicants</p>
        </div>
        <button onclick="event.stopPropagation(); viewJob(${job.id})" 
          class="bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          View Job
        </button>
      </div>
    </div>`;
}

function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  if (pagination.total_pages <= 1) { container.innerHTML = ''; return; }
  
  let html = '';
  
  if (pagination.has_prev) {
    html += `<button onclick="loadJobsList(${pagination.page - 1})" class="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"><i class="fas fa-chevron-left"></i></button>`;
  }
  
  for (let i = 1; i <= pagination.total_pages; i++) {
    if (i === 1 || i === pagination.total_pages || Math.abs(i - pagination.page) <= 2) {
      html += `<button onclick="loadJobsList(${i})" class="px-3 py-2 border rounded-lg text-sm transition-colors ${i === pagination.page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 hover:bg-gray-50'}">${i}</button>`;
    } else if (Math.abs(i - pagination.page) === 3) {
      html += `<span class="px-2 py-2 text-gray-400">...</span>`;
    }
  }
  
  if (pagination.has_next) {
    html += `<button onclick="loadJobsList(${pagination.page + 1})" class="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"><i class="fas fa-chevron-right"></i></button>`;
  }
  
  container.innerHTML = html;
}

async function viewJob(jobId) {
  currentJobId = jobId;
  showPage('job-detail');
  
  const content = document.getElementById('job-detail-content');
  
  try {
    const data = await api.get(`/jobs/${jobId}`);
    const job = data.data;
    
    // Check if user has already applied
    let hasApplied = false;
    let applyButton = '';
    
    if (currentUser) {
      if (currentUser.role === 'job_seeker') {
        try {
          const myApps = await api.get('/applications/my-applications');
          hasApplied = myApps.data.some(a => a.job_id === jobId);
        } catch (e) {}
        
        applyButton = hasApplied 
          ? `<button disabled class="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-semibold cursor-not-allowed">
               <i class="fas fa-check-circle mr-2 text-green-500"></i>Already Applied
             </button>`
          : `<button onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')" 
               class="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
               <i class="fas fa-paper-plane mr-2"></i>Apply Now
             </button>`;
      } else if (currentUser.role === 'company') {
        applyButton = `<div class="text-center text-sm text-gray-400 py-2">Log in as a job seeker to apply</div>`;
      }
    } else {
      applyButton = `
        <button onclick="showPage('login')" class="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors">
          <i class="fas fa-sign-in-alt mr-2"></i>Login to Apply
        </button>`;
    }
    
    const skillsHTML = job.skills_required && job.skills_required.length 
      ? job.skills_required.map(s => `<span class="skill-tag">${s}</span>`).join('')
      : '';
    
    const reqHTML = job.requirements 
      ? job.requirements.split('\n').filter(r => r.trim()).map(r => `<li class="flex items-start gap-2 text-sm"><i class="fas fa-check-circle text-green-500 mt-0.5 flex-shrink-0 text-xs"></i><span>${r.trim()}</span></li>`).join('')
      : '';
    
    const respHTML = job.responsibilities 
      ? job.responsibilities.split('\n').filter(r => r.trim()).map(r => `<li class="flex items-start gap-2 text-sm"><i class="fas fa-angle-right text-primary-400 mt-1 flex-shrink-0"></i><span>${r.trim()}</span></li>`).join('')
      : '';
    
    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-start gap-4">
              <div class="company-logo ${getCompanyColor(0)} w-14 h-14 text-xl rounded-xl">${getCompanyInitials(job.company_name)}</div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-800 mb-1">${job.title}</h1>
                <div class="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                  <span class="font-semibold text-primary-600">${job.company_name}</span>
                  ${job.company_verified ? '<i class="fas fa-check-circle text-blue-500" title="Verified Company"></i>' : ''}
                  <span>•</span>
                  <span><i class="fas fa-map-marker-alt mr-1 text-gray-400"></i>${job.city || 'Nepal'}</span>
                  <span>•</span>
                  <span><i class="fas fa-clock mr-1 text-gray-400"></i>${timeAgo(job.created_at)}</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  ${getJobTypeBadge(job.job_type)}
                  ${getLevelBadge(job.experience_level)}
                  ${job.category ? `<span class="badge" style="background:#f0fdf4;color:#166534">${job.category}</span>` : ''}
                  ${job.is_remote ? `<span class="badge" style="background:#ecfdf5;color:#047857"><i class="fas fa-wifi mr-1"></i>Remote</span>` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Job Description</h2>
            <p class="text-gray-600 text-sm leading-relaxed">${job.description}</p>
          </div>
          
          ${respHTML ? `
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Responsibilities</h2>
            <ul class="space-y-2">${respHTML}</ul>
          </div>` : ''}
          
          ${reqHTML ? `
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Requirements</h2>
            <ul class="space-y-2">${reqHTML}</ul>
          </div>` : ''}
          
          ${skillsHTML ? `
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Required Skills</h2>
            <div class="flex flex-wrap gap-2">${skillsHTML}</div>
          </div>` : ''}
        </div>

        <!-- Sidebar -->
        <div class="space-y-5">
          <!-- Apply Card -->
          <div class="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <div class="mb-4 pb-4 border-b border-gray-100">
              <div class="text-2xl font-bold text-green-600 mb-1">${formatSalary(job.salary_min, job.salary_max, job.salary_currency)}</div>
              <p class="text-xs text-gray-400">Monthly salary</p>
            </div>
            ${applyButton}
            <div class="mt-4 space-y-2 text-sm text-gray-500">
              <div class="flex items-center gap-2"><i class="fas fa-users w-4 text-gray-400"></i>${job.applications_count || 0} applicants</div>
              <div class="flex items-center gap-2"><i class="fas fa-eye w-4 text-gray-400"></i>${job.views_count || 0} views</div>
              ${job.application_deadline ? `<div class="flex items-center gap-2"><i class="fas fa-calendar w-4 text-gray-400"></i>Deadline: ${formatDate(job.application_deadline)}</div>` : ''}
            </div>
          </div>

          <!-- Company Info -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="font-semibold text-gray-800 mb-4">About ${job.company_name}</h3>
            <div class="space-y-2.5 text-sm text-gray-600">
              ${job.industry ? `<div class="flex items-center gap-2"><i class="fas fa-industry w-4 text-gray-400"></i>${job.industry}</div>` : ''}
              ${job.company_size ? `<div class="flex items-center gap-2"><i class="fas fa-users w-4 text-gray-400"></i>${job.company_size} employees</div>` : ''}
              ${job.company_city ? `<div class="flex items-center gap-2"><i class="fas fa-map-marker-alt w-4 text-gray-400"></i>${job.company_city}, Nepal</div>` : ''}
              ${job.company_description ? `<p class="text-gray-500 text-xs mt-2 leading-relaxed">${job.company_description.substring(0, 120)}...</p>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="text-center py-12 text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2 block"></i>${err.message}</div>`;
  }
}

// Apply Modal
let applyJobId = null;

function openApplyModal(jobId, jobTitle) {
  if (!currentUser) { showPage('login'); return; }
  applyJobId = jobId;
  document.getElementById('apply-modal-job-title').textContent = jobTitle;
  document.getElementById('apply-cover-letter').value = '';
  hideError('apply-error');
  document.getElementById('apply-success').classList.add('hidden');
  document.getElementById('apply-modal').classList.remove('hidden');
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.add('hidden');
  applyJobId = null;
}

async function submitApplication() {
  hideError('apply-error');
  const coverLetter = document.getElementById('apply-cover-letter').value;
  
  setLoading('apply-submit-btn', true, 'Submitting...');
  
  try {
    const data = await api.post('/applications', { job_id: applyJobId, cover_letter: coverLetter });
    showSuccess('apply-success', data.message);
    setTimeout(() => {
      closeApplyModal();
      viewJob(applyJobId); // Refresh job view
      showToast('Application submitted successfully! 🎉');
    }, 1500);
  } catch (err) {
    showError('apply-error', err.message);
  } finally {
    setLoading('apply-submit-btn', false, 'Submit Application');
  }
}

// Filters
function applyFilters() {
  loadJobsList(1);
}

function clearFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-job-type').value = '';
  document.getElementById('filter-experience').value = '';
  loadJobsList(1);
}

function quickFilter(category) {
  showPage('jobs');
  setTimeout(() => {
    document.getElementById('filter-category').value = category;
    applyFilters();
  }, 100);
}

function heroSearch() {
  const search = document.getElementById('hero-search').value;
  const city = document.getElementById('hero-location').value;
  showPage('jobs');
  setTimeout(() => {
    if (search) document.getElementById('filter-search').value = search;
    if (city) document.getElementById('filter-city').value = city;
    applyFilters();
  }, 100);
}

// Post Job
async function handlePostJob(e) {
  e.preventDefault();
  hideError('post-job-error');
  
  const skillsInput = document.getElementById('job-skills').value;
  const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  const body = {
    title: document.getElementById('job-title').value,
    description: document.getElementById('job-description').value,
    requirements: document.getElementById('job-requirements').value,
    responsibilities: document.getElementById('job-responsibilities').value,
    job_type: document.getElementById('job-type-input').value,
    experience_level: document.getElementById('job-experience').value,
    salary_min: document.getElementById('job-salary-min').value || null,
    salary_max: document.getElementById('job-salary-max').value || null,
    city: document.getElementById('job-city').value,
    category: document.getElementById('job-category').value,
    skills_required: skills,
    application_deadline: document.getElementById('job-deadline').value || null
  };
  
  setLoading('post-job-btn', true, 'Posting...');
  
  try {
    await api.post('/jobs', body);
    showSuccess('post-job-success', 'Job posted successfully!');
    showToast('Job posted successfully! 🚀');
    document.getElementById('post-job-form').reset();
    setTimeout(() => {
      showPage('dashboard');
      loadDashboard();
    }, 1500);
  } catch (err) {
    showError('post-job-error', err.message);
  } finally {
    setLoading('post-job-btn', false, 'Post Job');
  }
}

async function loadMyApplications() {
  const container = document.getElementById('my-applications-list');
  
  try {
    const data = await api.get('/applications/my-applications');
    const apps = data.data;
    
    if (!apps.length) {
      container.innerHTML = `
        <div class="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <i class="fas fa-file-alt text-4xl mb-4 block"></i>
          <p class="text-lg font-medium">No applications yet</p>
          <p class="text-sm mt-1">Start applying to jobs to track them here</p>
          <button onclick="showPage('jobs')" class="mt-4 bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Browse Jobs
          </button>
        </div>`;
      return;
    }
    
    container.innerHTML = apps.map(app => `
      <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div class="company-logo ${getCompanyColor(Math.random() * 7 | 0)} flex-shrink-0">${getCompanyInitials(app.company_name)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 class="font-semibold text-gray-800 cursor-pointer hover:text-primary-600 transition-colors" onclick="viewJob(${app.job_id})">${app.job_title}</h3>
              <p class="text-sm text-gray-500">${app.company_name} • ${app.city || 'Nepal'}</p>
            </div>
            ${getStatusBadge(app.status)}
          </div>
          <div class="flex flex-wrap gap-2 mt-2">
            ${getJobTypeBadge(app.job_type)}
            ${getLevelBadge(app.experience_level)}
          </div>
        </div>
        <div class="text-right text-xs text-gray-400 flex-shrink-0">
          <div class="font-medium text-green-600 text-sm">${formatSalary(app.salary_min, app.salary_max, app.salary_currency)}</div>
          <div class="mt-1">Applied ${timeAgo(app.applied_at)}</div>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400">${err.message}</div>`;
  }
}
