const pool = require('../config/database');

// GET /api/jobs - List all jobs with pagination and filters
const getJobs = async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search, category, job_type,
      experience_level, city, is_remote, sort = 'created_at'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE j.is_active = TRUE';
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex} OR c.company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (category) {
      whereClause += ` AND j.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    if (job_type) {
      whereClause += ` AND j.job_type = $${paramIndex}`;
      params.push(job_type);
      paramIndex++;
    }
    if (experience_level) {
      whereClause += ` AND j.experience_level = $${paramIndex}`;
      params.push(experience_level);
      paramIndex++;
    }
    if (city) {
      whereClause += ` AND j.city ILIKE $${paramIndex}`;
      params.push(`%${city}%`);
      paramIndex++;
    }
    if (is_remote === 'true') {
      whereClause += ` AND j.is_remote = TRUE`;
    }

    const sortOptions = {
      'created_at': 'j.created_at DESC',
      'salary': 'j.salary_max DESC NULLS LAST',
      'applications': 'j.applications_count DESC'
    };
    const orderBy = sortOptions[sort] || 'j.created_at DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs j 
       JOIN companies c ON j.company_id = c.id 
       ${whereClause}`,
      params
    );
    const totalJobs = parseInt(countResult.rows[0].count);

    const jobsResult = await pool.query(
      `SELECT j.*, c.company_name, c.logo_url as company_logo, c.city as company_city,
              c.industry, c.is_verified as company_verified
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        jobs: jobsResult.rows,
        pagination: {
          total: totalJobs,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalJobs / parseInt(limit)),
          has_next: offset + parseInt(limit) < totalJobs,
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (err) {
    console.error('Get jobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

// GET /api/jobs/:id - Get single job
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count
    await pool.query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [id]);

    const result = await pool.query(
      `SELECT j.*, c.company_name, c.logo_url as company_logo, c.industry, 
              c.company_size, c.website, c.description as company_description,
              c.city as company_city, c.country as company_country, c.is_verified as company_verified,
              u.email as company_email, u.phone as company_phone
       FROM jobs j
       JOIN companies c ON j.company_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE j.id = $1 AND j.is_active = TRUE`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get job by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
};

// POST /api/jobs - Create job (company only)
const createJob = async (req, res) => {
  try {
    const {
      title, description, requirements, responsibilities, job_type,
      experience_level, salary_min, salary_max, salary_currency,
      location, city, country, is_remote, category, skills_required, application_deadline
    } = req.body;

    if (!title || !description || !job_type || !experience_level) {
      return res.status(400).json({ success: false, message: 'Title, description, job type, and experience level are required.' });
    }

    // Get company profile
    const companyResult = await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }
    const company_id = companyResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, requirements, responsibilities, job_type,
        experience_level, salary_min, salary_max, salary_currency, location, city, country,
        is_remote, category, skills_required, application_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [company_id, title, description, requirements, responsibilities, job_type,
        experience_level, salary_min, salary_max, salary_currency || 'NPR',
        location, city, country || 'Nepal', is_remote || false, category,
        skills_required, application_deadline]
    );

    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
};

// PUT /api/jobs/:id - Update job (company only)
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const ownerCheck = await pool.query(
      `SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this job.' });
    }

    const {
      title, description, requirements, responsibilities, job_type,
      experience_level, salary_min, salary_max, salary_currency,
      location, city, country, is_remote, category, skills_required,
      application_deadline, is_active
    } = req.body;

    const result = await pool.query(
      `UPDATE jobs SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        requirements = COALESCE($3, requirements),
        responsibilities = COALESCE($4, responsibilities),
        job_type = COALESCE($5, job_type),
        experience_level = COALESCE($6, experience_level),
        salary_min = COALESCE($7, salary_min),
        salary_max = COALESCE($8, salary_max),
        salary_currency = COALESCE($9, salary_currency),
        location = COALESCE($10, location),
        city = COALESCE($11, city),
        country = COALESCE($12, country),
        is_remote = COALESCE($13, is_remote),
        category = COALESCE($14, category),
        skills_required = COALESCE($15, skills_required),
        application_deadline = COALESCE($16, application_deadline),
        is_active = COALESCE($17, is_active),
        updated_at = NOW()
       WHERE id = $18 RETURNING *`,
      [title, description, requirements, responsibilities, job_type,
        experience_level, salary_min, salary_max, salary_currency,
        location, city, country, is_remote, category, skills_required,
        application_deadline, is_active, id]
    );

    res.json({ success: true, message: 'Job updated successfully!', data: result.rows[0] });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ success: false, message: 'Failed to update job.' });
  }
};

// DELETE /api/jobs/:id - Delete job (company only)
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const ownerCheck = await pool.query(
      `SELECT j.id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this job.' });
    }

    await pool.query('UPDATE jobs SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete job.' });
  }
};

// GET /api/jobs/company/my-jobs - Get company's own jobs
const getMyJobs = async (req, res) => {
  try {
    const companyResult = await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user.id]);
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    const result = await pool.query(
      `SELECT j.*, 
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as total_applications,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'pending') as pending_applications
       FROM jobs j
       WHERE j.company_id = $1
       ORDER BY j.created_at DESC`,
      [companyResult.rows[0].id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get my jobs error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

// GET /api/jobs/categories - Get all categories
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as job_count 
       FROM jobs WHERE is_active = TRUE AND category IS NOT NULL
       GROUP BY category ORDER BY job_count DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

module.exports = { getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, getCategories };
