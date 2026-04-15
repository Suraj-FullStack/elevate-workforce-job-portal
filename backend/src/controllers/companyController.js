const pool = require('../config/database');

// GET /api/companies - List all companies
const getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, industry } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE u.is_active = TRUE';
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (c.company_name ILIKE $${paramIndex} OR c.industry ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (industry) {
      whereClause += ` AND c.industry = $${paramIndex}`;
      params.push(industry);
      paramIndex++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM companies c JOIN users u ON c.user_id = u.id ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT c.*, u.email, u.phone,
              (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.is_active = TRUE) as active_jobs
       FROM companies c
       JOIN users u ON c.user_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        companies: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('Get companies error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
};

// GET /api/companies/:id - Get single company with jobs
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, u.email, u.phone, u.created_at as member_since
       FROM companies c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const jobs = await pool.query(
      `SELECT id, title, job_type, experience_level, city, salary_min, salary_max, 
              salary_currency, applications_count, created_at
       FROM jobs WHERE company_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: { company: result.rows[0], jobs: jobs.rows }
    });
  } catch (err) {
    console.error('Get company by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch company.' });
  }
};

module.exports = { getCompanies, getCompanyById };
