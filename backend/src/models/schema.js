const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('job_seeker', 'company')),
        phone VARCHAR(20),
        location VARCHAR(255),
        bio TEXT,
        avatar_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Companies table (extended profile for company users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        company_size VARCHAR(50),
        founded_year INTEGER,
        website VARCHAR(500),
        description TEXT,
        logo_url VARCHAR(500),
        address VARCHAR(500),
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Nepal',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Job seekers table (extended profile)
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_seekers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        headline VARCHAR(255),
        skills TEXT[],
        experience_years INTEGER DEFAULT 0,
        education TEXT,
        resume_url VARCHAR(500),
        linkedin_url VARCHAR(500),
        portfolio_url VARCHAR(500),
        availability VARCHAR(50) DEFAULT 'immediately',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT,
        responsibilities TEXT,
        job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'remote')),
        experience_level VARCHAR(50) NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
        salary_min DECIMAL(12,2),
        salary_max DECIMAL(12,2),
        salary_currency VARCHAR(10) DEFAULT 'NPR',
        location VARCHAR(255),
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Nepal',
        is_remote BOOLEAN DEFAULT FALSE,
        category VARCHAR(100),
        skills_required TEXT[],
        application_deadline DATE,
        is_active BOOLEAN DEFAULT TRUE,
        views_count INTEGER DEFAULT 0,
        applications_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Applications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        applicant_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cover_letter TEXT,
        resume_url VARCHAR(500),
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
        notes TEXT,
        applied_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(job_id, applicant_id)
      )
    `);

    // Saved jobs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
        saved_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, job_id)
      )
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id)`);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { createTables };
