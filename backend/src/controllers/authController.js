const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, email, password, role, company_name, phone, location } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (!['job_seeker', 'company'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be job_seeker or company.' });
    }

    if (role === 'company' && !company_name) {
      return res.status(400).json({ success: false, message: 'Company name is required for company registration.' });
    }

    // Check if email exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, location) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, role, created_at`,
      [full_name, email, password_hash, role, phone || null, location || null]
    );
    const user = userResult.rows[0];

    // Create role-specific profile
    if (role === 'company') {
      await client.query(
        `INSERT INTO companies (user_id, company_name) VALUES ($1, $2)`,
        [user.id, company_name]
      );
    } else {
      await client.query(
        `INSERT INTO job_seekers (user_id) VALUES ($1)`,
        [user.id]
      );
    }

    await client.query('COMMIT');

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: { user, token }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, phone, location, bio, avatar_url FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === 'company') {
      const companyResult = await pool.query(
        'SELECT * FROM companies WHERE user_id = $1',
        [user.id]
      );
      profile = companyResult.rows[0] || null;
    } else {
      const seekerResult = await pool.query(
        'SELECT * FROM job_seekers WHERE user_id = $1',
        [user.id]
      );
      profile = seekerResult.rows[0] || null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      data: { user: userWithoutPassword, profile, token }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, phone, location, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];
    let profile = null;

    if (user.role === 'company') {
      const companyResult = await pool.query('SELECT * FROM companies WHERE user_id = $1', [user.id]);
      profile = companyResult.rows[0] || null;
    } else {
      const seekerResult = await pool.query('SELECT * FROM job_seekers WHERE user_id = $1', [user.id]);
      profile = seekerResult.rows[0] || null;
    }

    res.json({ success: true, data: { user, profile } });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user data.' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, phone, location, bio } = req.body;
    
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), 
       location = COALESCE($3, location), bio = COALESCE($4, bio), updated_at = NOW()
       WHERE id = $5`,
      [full_name, phone, location, bio, req.user.id]
    );

    // Update role-specific profile
    if (req.user.role === 'company') {
      const { company_name, industry, company_size, website, description, address, city } = req.body;
      await client.query(
        `UPDATE companies SET 
          company_name = COALESCE($1, company_name),
          industry = COALESCE($2, industry),
          company_size = COALESCE($3, company_size),
          website = COALESCE($4, website),
          description = COALESCE($5, description),
          address = COALESCE($6, address),
          city = COALESCE($7, city),
          updated_at = NOW()
         WHERE user_id = $8`,
        [company_name, industry, company_size, website, description, address, city, req.user.id]
      );
    } else {
      const { headline, skills, experience_years, education, linkedin_url, portfolio_url, availability } = req.body;
      await client.query(
        `UPDATE job_seekers SET 
          headline = COALESCE($1, headline),
          skills = COALESCE($2, skills),
          experience_years = COALESCE($3, experience_years),
          education = COALESCE($4, education),
          linkedin_url = COALESCE($5, linkedin_url),
          portfolio_url = COALESCE($6, portfolio_url),
          availability = COALESCE($7, availability),
          updated_at = NOW()
         WHERE user_id = $8`,
        [headline, skills, experience_years, education, linkedin_url, portfolio_url, availability, req.user.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  } finally {
    client.release();
  }
};

module.exports = { register, login, getMe, updateProfile };
