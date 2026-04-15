const pool = require('../config/database');

// POST /api/applications - Apply for a job
const applyForJob = async (req, res) => {
  try {
    const { job_id, cover_letter, resume_url } = req.body;

    if (!job_id) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    // Check if job exists and is active
    const jobCheck = await pool.query('SELECT id, title, applications_count FROM jobs WHERE id = $1 AND is_active = TRUE', [job_id]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found or no longer active.' });
    }

    // Check if already applied
    const existingApp = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2',
      [job_id, req.user.id]
    );
    if (existingApp.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    const result = await pool.query(
      `INSERT INTO applications (job_id, applicant_id, cover_letter, resume_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [job_id, req.user.id, cover_letter || null, resume_url || null]
    );

    // Update application count
    await pool.query('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1', [job_id]);

    res.status(201).json({
      success: true,
      message: `Successfully applied for "${jobCheck.rows[0].title}"!`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Apply for job error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

// GET /api/applications/my-applications - Get job seeker's applications
const getMyApplications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, j.title as job_title, j.job_type, j.location, j.salary_min, j.salary_max,
              j.salary_currency, j.city, j.experience_level,
              c.company_name, c.logo_url as company_logo, c.industry
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.applicant_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my applications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

// GET /api/applications/job/:jobId - Get applicants for a job (company only)
const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to this company
    const ownerCheck = await pool.query(
      `SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = $1 AND c.user_id = $2`,
      [jobId, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these applicants.' });
    }

    const result = await pool.query(
      `SELECT a.*, u.full_name, u.email, u.phone, u.location,
              js.headline, js.experience_years, js.skills, js.education, js.linkedin_url, js.portfolio_url
       FROM applications a
       JOIN users u ON a.applicant_id = u.id
       LEFT JOIN job_seekers js ON js.user_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    // Get job info
    const jobInfo = await pool.query('SELECT title FROM jobs WHERE id = $1', [jobId]);

    res.json({
      success: true,
      data: {
        job_title: jobInfo.rows[0]?.title,
        total: result.rows.length,
        applicants: result.rows
      }
    });
  } catch (err) {
    console.error('Get job applicants error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch applicants.' });
  }
};

// PUT /api/applications/:id/status - Update application status (company only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Verify company owns the job
    const ownerCheck = await pool.query(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       WHERE a.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this application.' });
    }

    const result = await pool.query(
      `UPDATE applications SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [status, notes, id]
    );

    res.json({ success: true, message: 'Application status updated.', data: result.rows[0] });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

// GET /api/applications/company/dashboard - Company dashboard stats
const getCompanyDashboard = async (req, res) => {
  try {
    const companyResult = await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }
    const companyId = companyResult.rows[0].id;

    const stats = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM jobs WHERE company_id = $1 AND is_active = TRUE) as active_jobs,
        (SELECT COUNT(*) FROM jobs WHERE company_id = $1) as total_jobs,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1) as total_applications,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'pending') as pending_applications,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'shortlisted') as shortlisted_applications,
        (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = $1 AND a.status = 'hired') as hired_count,
        (SELECT SUM(views_count) FROM jobs WHERE company_id = $1) as total_views`,
      [companyId]
    );

    // Recent applications
    const recentApps = await pool.query(
      `SELECT a.id, a.status, a.applied_at, u.full_name, u.email, j.title as job_title
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.applicant_id = u.id
       WHERE j.company_id = $1
       ORDER BY a.applied_at DESC LIMIT 5`,
      [companyId]
    );

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        recent_applications: recentApps.rows
      }
    });
  } catch (err) {
    console.error('Company dashboard error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.' });
  }
};

module.exports = { applyForJob, getMyApplications, getJobApplicants, updateApplicationStatus, getCompanyDashboard };
