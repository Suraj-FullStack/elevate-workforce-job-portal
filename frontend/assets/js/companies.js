// Companies Management

async function loadFeaturedCompanies() {
  const container = document.getElementById('featured-companies');
  
  try {
    const data = await api.get('/companies?limit=5');
    const companies = data.data.companies;
    
    // Update stats
    document.getElementById('stat-companies').textContent = data.data.pagination.total + '+';
    
    if (!companies.length) {
      container.innerHTML = '<div class="col-span-5 text-center text-gray-400 py-8">No companies yet.</div>';
      return;
    }
    
    container.innerHTML = companies.map((company, i) => `
      <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center text-center hover:border-primary-300 hover:shadow-md transition-all cursor-pointer" onclick="viewCompany(${company.id})">
        <div class="company-logo ${getCompanyColor(i)} w-14 h-14 text-xl rounded-xl mb-3">${getCompanyInitials(company.company_name)}</div>
        <div class="font-semibold text-gray-800 text-sm leading-tight flex items-center gap-1 justify-center">
          ${company.company_name}
          ${company.is_verified ? '<i class="fas fa-check-circle text-blue-500 text-xs" title="Verified"></i>' : ''}
        </div>
        <p class="text-xs text-gray-500 mt-0.5">${company.industry || 'Technology'}</p>
        <p class="text-xs text-primary-600 font-medium mt-2">${company.active_jobs || 0} open jobs</p>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = '<div class="col-span-5 text-center text-gray-400">Failed to load companies.</div>';
  }
}

async function loadCompaniesList() {
  const container = document.getElementById('companies-list');
  const search = document.getElementById('company-search')?.value || '';
  
  container.innerHTML = '<div class="text-center py-12 col-span-3"><i class="fas fa-spinner fa-spin text-primary-600 text-2xl"></i></div>';
  
  try {
    const params = new URLSearchParams({ limit: 12 });
    if (search) params.set('search', search);
    
    const data = await api.get(`/companies?${params}`);
    const companies = data.data.companies;
    
    if (!companies.length) {
      container.innerHTML = `
        <div class="text-center py-16 text-gray-400 col-span-3">
          <i class="fas fa-building text-4xl mb-4 block"></i>
          <p class="text-lg font-medium">No companies found</p>
        </div>`;
      return;
    }
    
    container.innerHTML = companies.map((company, i) => `
      <div class="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer" onclick="viewCompany(${company.id})">
        <div class="flex items-start gap-4 mb-4">
          <div class="company-logo ${getCompanyColor(i)} w-14 h-14 text-xl rounded-xl flex-shrink-0">${getCompanyInitials(company.company_name)}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1 flex-wrap">
              <h3 class="font-semibold text-gray-800 truncate">${company.company_name}</h3>
              ${company.is_verified ? '<i class="fas fa-check-circle text-blue-500 text-xs" title="Verified"></i>' : ''}
            </div>
            <p class="text-sm text-primary-600 font-medium">${company.industry || 'Technology'}</p>
            <p class="text-xs text-gray-500 mt-0.5"><i class="fas fa-map-marker-alt mr-1"></i>${company.city || 'Nepal'}</p>
          </div>
        </div>
        ${company.description ? `<p class="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">${company.description.substring(0, 100)}...</p>` : ''}
        <div class="flex items-center justify-between pt-3 border-t border-gray-50">
          <div class="flex gap-3 text-xs text-gray-500">
            ${company.company_size ? `<span><i class="fas fa-users mr-1"></i>${company.company_size}</span>` : ''}
            ${company.founded_year ? `<span><i class="fas fa-calendar mr-1"></i>${company.founded_year}</span>` : ''}
          </div>
          <span class="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
            ${company.active_jobs || 0} open jobs
          </span>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400 col-span-3">${err.message}</div>`;
  }
}

async function viewCompany(companyId) {
  // Navigate to jobs page with company filter would be ideal
  // For now, show a toast and redirect to jobs
  showToast('Viewing company profile...');
  showPage('jobs');
}

function searchCompanies() {
  loadCompaniesList();
}

// Enter key for company search
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && document.getElementById('company-search') === document.activeElement) {
    searchCompanies();
  }
});
