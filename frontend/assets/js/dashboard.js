// Company Dashboard Management

async function loadDashboard() {
  if (!currentUser || currentUser.role !== 'company') {
    showPage('login');
    return;
  }
  
  // Update header
  document.getElementById('dashboard-company-name').textContent = `Logged in as ${currentUser.full_name}`;
  
  // Load stats
  loadDashboardStats();
  // Load my jobs
  loadMyJobs();
}

async function loadDashboardStats() {
  try {
    const data = await api.get('/applications/company/dashboard');
    const { stats, recent_applications } = data.data;
    
    document.getElementById('ds-active-jobs').textContent = stats.active_jobs || 0;
    document.getElementById('ds-total-apps').textContent = stats.total_applications || 0;
    document.getElementById('ds-pending').textContent = stats.pending_applications || 0;
    document.getElementById('ds-hired').textContent = stats.hired_count || 0;
    
    // Recent applications
    const recentContainer = document.getElementById('recent-apps-list');
    if (!recent_applications || !recent_applications.length) {
      recentContainer.innerHTML = '<div class="text-center py-8 text-gray-400 text-sm">No applications yet</div>';
      return;
    }
    
    recentContainer.innerHTML = recent_applications.map(app => `
      <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div class="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-primary-700 font-semibold text-xs">${getCompanyInitials(app.full_name)}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">${app.full_name}</p>
          <p class="text-xs text-gray-500 truncate">${app.job_title}</p>
        </div>
        <div class="text-right flex-shrink-0">
          ${getStatusBadge(app.status)}
          <p class="text-xs text-gray-400 mt-1">${timeAgo(app.applied_at)}</p>
        </div>
      </div>`).join('');
  } catch (err) {
    console.error('Dashboard stats error:', err);
  }
}

async function loadMyJobs() {
  const container = document.getElementById('my-jobs-list');
  
  try {
    const data = await api.get('/jobs/company/my-jobs');
    const jobs = data.data;
    
    if (!jobs.length) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-briefcase text-4xl mb-4 block"></i>
          <p class="font-medium">No jobs posted yet</p>
          <p class="text-sm mt-1">Post your first job to start receiving applications</p>
          <button onclick="showPage('post-job')" class="mt-4 bg-primary-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Post a Job
          </button>
        </div>`;
      return;
    }
    
    container.innerHTML = jobs.map(job => `
      <div class="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-semibold text-gray-800 text-sm">${job.title}</h3>
              ${job.is_active 
                ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"><i class="fas fa-circle text-green-500 mr-1" style="font-size:6px"></i>Active</span>'
                : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500"><i class="fas fa-circle text-gray-400 mr-1" style="font-size:6px"></i>Inactive</span>'
              }
            </div>
            <div class="flex flex-wrap gap-1.5 mt-1">
              ${getJobTypeBadge(job.job_type)}
              ${getLevelBadge(job.experience_level)}
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button onclick="showEditJobModal(${job.id})" class="text-gray-400 hover:text-primary-600 text-sm p-1.5 hover:bg-primary-50 rounded-lg transition-colors" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="confirmDeleteJob(${job.id}, '${job.title.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-red-600 text-sm p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex gap-4 text-xs text-gray-500">
            <span><i class="fas fa-users mr-1 text-blue-400"></i>${job.total_applications || 0} total</span>
            <span><i class="fas fa-clock mr-1 text-yellow-400"></i>${job.pending_applications || 0} pending</span>
            <span><i class="fas fa-calendar mr-1 text-gray-400"></i>${timeAgo(job.created_at)}</span>
          </div>
          <button onclick="loadApplicants(${job.id})" class="text-xs bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
            View Applicants
          </button>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center py-8 text-red-400">${err.message}</div>`;
  }
}

async function loadApplicants(jobId) {
  showPage('applicants');
  const container = document.getElementById('applicants-list');
  const titleEl = document.getElementById('applicants-job-title');
  
  try {
    const data = await api.get(`/applications/job/${jobId}`);
    const { job_title, applicants } = data.data;
    
    titleEl.textContent = job_title || '';
    
    if (!applicants.length) {
      container.innerHTML = `
        <div class="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <i class="fas fa-user-slash text-4xl mb-4 block"></i>
          <p class="font-medium">No applicants yet</p>
          <p class="text-sm mt-1">Share your job posting to attract candidates</p>
        </div>`;
      return;
    }
    
    container.innerHTML = applicants.map(app => `
      <div class="bg-white border border-gray-200 rounded-xl p-5">
        <div class="flex flex-col md:flex-row md:items-start gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold">${getCompanyInitials(app.full_name)}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div>
                <h3 class="font-semibold text-gray-800">${app.full_name}</h3>
                <p class="text-sm text-gray-500">${app.email} ${app.phone ? '• ' + app.phone : ''}</p>
              </div>
              ${getStatusBadge(app.status)}
            </div>
            
            ${app.headline ? `<p class="text-sm text-primary-600 mb-2">${app.headline}</p>` : ''}
            
            <div class="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
              ${app.experience_years ? `<span><i class="fas fa-briefcase mr-1"></i>${app.experience_years} years exp.</span>` : ''}
              ${app.location ? `<span><i class="fas fa-map-marker-alt mr-1"></i>${app.location}</span>` : ''}
              <span><i class="fas fa-calendar mr-1"></i>Applied ${timeAgo(app.applied_at)}</span>
            </div>
            
            ${app.skills && app.skills.length ? `
            <div class="flex flex-wrap gap-1.5 mb-3">
              ${app.skills.slice(0, 5).map(s => `<span class="skill-tag">${s}</span>`).join('')}
              ${app.skills.length > 5 ? `<span class="text-xs text-gray-400">+${app.skills.length - 5} more</span>` : ''}
            </div>` : ''}
            
            ${app.cover_letter ? `
            <div class="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
              <p class="text-xs font-semibold text-gray-600 mb-1">Cover Letter:</p>
              <p class="text-sm text-gray-600 leading-relaxed">${app.cover_letter}</p>
            </div>` : ''}
            
            <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              ${['reviewed', 'shortlisted', 'hired', 'rejected'].map(status => `
                <button onclick="updateStatus(${app.id}, '${status}')" 
                  class="text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                  ${app.status === status 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                  }">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400">${err.message}</div>`;
  }
}

async function updateStatus(applicationId, status) {
  try {
    await api.put(`/applications/${applicationId}/status`, { status });
    showToast(`Application marked as ${status}`);
    // Refresh current view
    const jobId = document.getElementById('applicants-job-title') ? 
      document.getElementById('applicants-list').dataset.jobId : null;
    // Re-render with updated status
    const cards = document.querySelectorAll('#applicants-list > div');
    // Simple approach: reload the page
    history.go(0);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function confirmDeleteJob(jobId, jobTitle) {
  if (confirm(`Are you sure you want to delete "${jobTitle}"?\n\nThis will remove the job from listings (applications will be preserved).`)) {
    try {
      await api.delete(`/jobs/${jobId}`);
      showToast('Job deleted successfully.');
      loadMyJobs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
}

async function showEditJobModal(jobId) {
  // Simple edit using prompt approach — in production would use a modal
  try {
    const data = await api.get(`/jobs/${jobId}`);
    const job = data.data;
    
    // Toggle active status
    const newStatus = !job.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (confirm(`Do you want to ${action} this job posting?\n\n"${job.title}"`)) {
      await api.put(`/jobs/${jobId}`, { is_active: newStatus });
      showToast(`Job ${action}d successfully.`);
      loadMyJobs();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}
