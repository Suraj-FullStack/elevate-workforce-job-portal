const bcrypt = require('bcryptjs');
const pool = require('./config/database');
const { createTables } = require('./models/schema');
require('dotenv').config();

const seedData = async () => {
  const client = await pool.connect();
  try {
    // Create tables first
    await createTables();

    console.log('🌱 Seeding database...');
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM applications');
    await client.query('DELETE FROM saved_jobs');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM companies');
    await client.query('DELETE FROM job_seekers');
    await client.query('DELETE FROM users');
    await client.query("SELECT setval('users_id_seq', 1, false)");
    await client.query("SELECT setval('companies_id_seq', 1, false)");
    await client.query("SELECT setval('jobs_id_seq', 1, false)");

    const password = await bcrypt.hash('password123', 12);

    // ===== COMPANY USERS =====
    const companyData = [
      { name: 'Leapfrog Technology', email: 'hr@leapfrog.com', phone: '+977-1-5555001', location: 'Kathmandu' },
      { name: 'Deerwalk Services', email: 'careers@deerwalk.com', phone: '+977-1-5555002', location: 'Kathmandu' },
      { name: 'Fusemachines', email: 'jobs@fusemachines.com', phone: '+977-1-5555003', location: 'Kathmandu' },
      { name: 'CloudFactory', email: 'recruit@cloudfactory.com', phone: '+977-1-5555004', location: 'Pokhara' },
      { name: 'Cotiviti Nepal', email: 'hr@cotiviti.com.np', phone: '+977-1-5555005', location: 'Kathmandu' },
    ];

    const companyIds = [];
    for (const c of companyData) {
      const uRes = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, location) VALUES ($1,$2,$3,'company',$4,$5) RETURNING id`,
        [c.name + ' HR', c.email, password, c.phone, c.location]
      );
      companyIds.push(uRes.rows[0].id);
    }

    // Create company profiles
    const companyProfiles = [
      { name: 'Leapfrog Technology', industry: 'Software Development', size: '201-500', founded: 2010, website: 'https://www.lftechnology.com', city: 'Kathmandu', desc: 'Leading software company specializing in product engineering, application development, and technology consulting for global clients.', verified: true },
      { name: 'Deerwalk Services', industry: 'Healthcare IT', size: '1001-5000', founded: 2010, website: 'https://www.deerwalk.com', city: 'Kathmandu', desc: 'Healthcare IT company providing data analytics, software solutions, and services to US healthcare sector.', verified: true },
      { name: 'Fusemachines', industry: 'Artificial Intelligence', size: '51-200', founded: 2015, website: 'https://fusemachines.com', city: 'Kathmandu', desc: 'AI-focused company providing machine learning solutions, AI talent, and education programs to transform businesses globally.', verified: true },
      { name: 'CloudFactory', industry: 'Data Annotation', size: '5001-10000', founded: 2010, website: 'https://www.cloudfactory.com', city: 'Pokhara', desc: 'Managed workforce for AI training data and digital process outsourcing with operations across Nepal.', verified: true },
      { name: 'Cotiviti Nepal', industry: 'Analytics & Healthcare', size: '1001-5000', founded: 2008, website: 'https://www.cotiviti.com', city: 'Kathmandu', desc: 'Analytics company serving healthcare, financial services sectors with advanced data analytics and technology solutions.', verified: false },
    ];

    const dbCompanyIds = [];
    for (let i = 0; i < companyProfiles.length; i++) {
      const cp = companyProfiles[i];
      const cRes = await client.query(
        `INSERT INTO companies (user_id, company_name, industry, company_size, founded_year, website, description, city, country, is_verified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Nepal',$9) RETURNING id`,
        [companyIds[i], cp.name, cp.industry, cp.size, cp.founded, cp.website, cp.desc, cp.city, cp.verified]
      );
      dbCompanyIds.push(cRes.rows[0].id);
    }

    // ===== JOB SEEKER USERS =====
    const seekerData = [
      { name: 'Arun Shrestha', email: 'arun.shrestha@gmail.com', phone: '+977-9801000001', location: 'Kathmandu', headline: 'Full Stack Developer | React & Node.js', skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'], exp: 4 },
      { name: 'Priya Tamang', email: 'priya.tamang@gmail.com', phone: '+977-9801000002', location: 'Lalitpur', headline: 'UI/UX Designer | Figma Expert', skills: ['Figma', 'Adobe XD', 'HTML/CSS', 'User Research', 'Prototyping'], exp: 3 },
      { name: 'Bikash Gurung', email: 'bikash.gurung@gmail.com', phone: '+977-9801000003', location: 'Pokhara', headline: 'Data Scientist | ML & Python', skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Power BI'], exp: 2 },
      { name: 'Sunita Rai', email: 'sunita.rai@gmail.com', phone: '+977-9801000004', location: 'Kathmandu', headline: 'Software Engineer | Java & Spring Boot', skills: ['Java', 'Spring Boot', 'MySQL', 'AWS', 'Git'], exp: 5 },
      { name: 'Rajan Thapa', email: 'rajan.thapa@gmail.com', phone: '+977-9801000005', location: 'Bhaktapur', headline: 'DevOps Engineer | AWS & Kubernetes', skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'], exp: 3 },
    ];

    const seekerUserIds = [];
    for (const s of seekerData) {
      const uRes = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, location) VALUES ($1,$2,$3,'job_seeker',$4,$5) RETURNING id`,
        [s.name, s.email, password, s.phone, s.location]
      );
      seekerUserIds.push(uRes.rows[0].id);
      await client.query(
        `INSERT INTO job_seekers (user_id, headline, skills, experience_years, education)
         VALUES ($1,$2,$3,$4,$5)`,
        [uRes.rows[0].id, s.headline, s.skills, s.exp, "Bachelor's in Computer Science"]
      );
    }

    // ===== JOBS =====
    const jobs = [
      // Leapfrog
      { cid: dbCompanyIds[0], title: 'Senior React Developer', desc: 'We are looking for an experienced React Developer to join our dynamic team. You will be working on cutting-edge web applications for our international clients, collaborating with cross-functional teams to deliver high-quality software solutions.', req: '4+ years React experience\nStrong JavaScript/TypeScript skills\nExperience with Redux, GraphQL\nFamiliarity with testing frameworks\nGood communication skills', resp: 'Develop and maintain React applications\nCollaborate with UI/UX designers\nCode review and mentoring junior devs\nOptimize application performance', type: 'full_time', level: 'senior', smin: 80000, smax: 150000, city: 'Kathmandu', cat: 'Engineering', skills: ['React', 'TypeScript', 'Redux', 'GraphQL'], deadline: '2026-05-30' },
      { cid: dbCompanyIds[0], title: 'Backend Engineer (Node.js)', desc: 'Join our backend team to build scalable APIs and microservices. You will design and implement server-side solutions that power web and mobile applications for clients across US and Europe.', req: '3+ years Node.js experience\nExperience with PostgreSQL/MongoDB\nKnowledge of REST API design\nAWS or cloud experience preferred', resp: 'Design and build REST APIs\nOptimize database queries\nImplement security best practices\nParticipate in system design discussions', type: 'full_time', level: 'mid', smin: 60000, smax: 100000, city: 'Kathmandu', cat: 'Engineering', skills: ['Node.js', 'PostgreSQL', 'AWS', 'Docker'], deadline: '2026-06-15' },
      
      // Deerwalk
      { cid: dbCompanyIds[1], title: 'Healthcare Data Analyst', desc: 'Deerwalk is seeking a Data Analyst to analyze complex healthcare datasets and provide actionable insights to our US healthcare clients. This is an excellent opportunity to work in the intersection of healthcare and technology.', req: '2+ years data analysis experience\nProficiency in SQL and Python\nKnowledge of healthcare data standards\nExperience with BI tools (Tableau/Power BI)', resp: 'Analyze large healthcare datasets\nCreate reports and dashboards\nCollaborate with US-based teams\nIdentify data quality issues', type: 'full_time', level: 'mid', smin: 55000, smax: 90000, city: 'Kathmandu', cat: 'Data Science', skills: ['SQL', 'Python', 'Tableau', 'Healthcare IT'], deadline: '2026-05-20' },
      { cid: dbCompanyIds[1], title: 'Java Software Engineer', desc: 'We need a skilled Java developer to work on our healthcare software platforms. You will develop and maintain enterprise-grade applications used by thousands of healthcare providers across the United States.', req: '3+ years Java experience\nSpring Boot and Hibernate\nMicroservices architecture\nExperience with MySQL/PostgreSQL', resp: 'Develop Java-based microservices\nMaintain and upgrade existing systems\nWrite unit and integration tests\nParticipate in code reviews', type: 'full_time', level: 'mid', smin: 65000, smax: 110000, city: 'Kathmandu', cat: 'Engineering', skills: ['Java', 'Spring Boot', 'Microservices', 'MySQL'], deadline: '2026-06-01' },

      // Fusemachines
      { cid: dbCompanyIds[2], title: 'Machine Learning Engineer', desc: 'Fusemachines is looking for an ML Engineer to develop cutting-edge AI solutions. You will work on real-world machine learning projects, from data preprocessing to model deployment, helping businesses leverage the power of AI.', req: '2+ years ML experience\nProficiency in Python and TensorFlow/PyTorch\nStrong statistics knowledge\nExperience with NLP or Computer Vision', resp: 'Build and deploy ML models\nConduct experiments and A/B tests\nCollaborate with data science team\nMonitor model performance in production', type: 'full_time', level: 'mid', smin: 70000, smax: 120000, city: 'Kathmandu', cat: 'Data Science', skills: ['Python', 'TensorFlow', 'Machine Learning', 'NLP'], deadline: '2026-05-25' },
      { cid: dbCompanyIds[2], title: 'AI Research Intern', desc: 'Join Fusemachines as an AI Research Intern and work on exciting projects in artificial intelligence and machine learning. This internship offers hands-on experience with real AI projects and mentorship from experienced practitioners.', req: 'Currently pursuing BS/MS in CS/AI\nPython programming skills\nBasic knowledge of ML algorithms\nEager to learn and contribute', resp: 'Assist in ML research projects\nImplement and test algorithms\nPrepare technical documentation\nPresent findings to team', type: 'internship', level: 'entry', smin: 15000, smax: 25000, city: 'Kathmandu', cat: 'Data Science', skills: ['Python', 'Machine Learning', 'Research'], deadline: '2026-05-15' },

      // CloudFactory
      { cid: dbCompanyIds[3], title: 'Data Operations Team Lead', desc: 'CloudFactory is hiring a Team Lead for our data operations division. You will manage a team of data workers, ensure quality standards, and coordinate with international clients on AI training data projects.', req: '2+ years supervisory experience\nExperience in data annotation/labeling\nExcellent communication skills\nAbility to manage remote teams', resp: 'Lead a team of 10-15 data workers\nEnsure quality and accuracy of annotations\nLiaise with global clients\nPrepare progress reports', type: 'full_time', level: 'mid', smin: 45000, smax: 75000, city: 'Pokhara', cat: 'Operations', skills: ['Team Management', 'Data Annotation', 'Quality Assurance'], deadline: '2026-06-30' },
      { cid: dbCompanyIds[3], title: 'Remote Data Annotator', desc: 'Work from anywhere as a Remote Data Annotator for CloudFactory. You will label and annotate data used to train AI models for our global clients. This role offers flexible hours and the opportunity to work in the AI industry.', req: 'Attention to detail\nBasic computer skills\nEnglish proficiency\nReliable internet connection', resp: 'Annotate images, text, and audio\nFollow annotation guidelines\nMeet daily targets\nReport quality issues', type: 'remote', level: 'entry', smin: 20000, smax: 35000, city: 'Remote', cat: 'Data Science', skills: ['Data Annotation', 'Attention to Detail', 'English'], deadline: '2026-07-01', remote: true },

      // Cotiviti
      { cid: dbCompanyIds[4], title: 'DevOps Engineer', desc: 'Cotiviti Nepal is seeking a DevOps Engineer to streamline our development and deployment processes. You will be responsible for maintaining our cloud infrastructure and implementing CI/CD pipelines for our analytics platform.', req: '3+ years DevOps experience\nAWS or Azure certification preferred\nKubernetes and Docker expertise\nExperience with Terraform or Ansible', resp: 'Manage cloud infrastructure on AWS\nImplement and maintain CI/CD pipelines\nMonitor system performance\nAutomate infrastructure provisioning', type: 'full_time', level: 'senior', smin: 75000, smax: 130000, city: 'Kathmandu', cat: 'DevOps', skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD'], deadline: '2026-06-10' },
      { cid: dbCompanyIds[4], title: 'Business Analyst', desc: 'Join Cotiviti Nepal as a Business Analyst and bridge the gap between business needs and technical solutions. You will gather requirements, analyze business processes, and work with development teams to deliver analytics solutions.', req: '2+ years BA experience\nExperience with requirements gathering\nSQL knowledge\nExcellent documentation skills', resp: 'Gather and document business requirements\nAnalyze business processes\nWork with development teams\nPrepare functional specifications', type: 'full_time', level: 'mid', smin: 50000, smax: 85000, city: 'Kathmandu', cat: 'Business', skills: ['Business Analysis', 'SQL', 'Requirements Gathering', 'Documentation'], deadline: '2026-05-31' },

      // Extra jobs
      { cid: dbCompanyIds[0], title: 'UI/UX Designer', desc: 'Leapfrog Technology is looking for a creative UI/UX Designer to craft beautiful and intuitive user experiences for our web and mobile applications. You will work closely with product managers and engineers.', req: '3+ years UI/UX design experience\nProficiency in Figma or Adobe XD\nPortfolio of web/mobile designs\nUnderstanding of user research methods', resp: 'Create wireframes and prototypes\nConduct user research and testing\nDesign intuitive user interfaces\nCollaborate with development team', type: 'full_time', level: 'mid', smin: 55000, smax: 95000, city: 'Kathmandu', cat: 'Design', skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'], deadline: '2026-06-20' },
      { cid: dbCompanyIds[1], title: 'QA Engineer', desc: 'We are looking for a detail-oriented QA Engineer to ensure the quality of our healthcare software. You will design and execute test plans, find bugs, and work with developers to ensure software meets quality standards.', req: '2+ years QA experience\nExperience with manual and automated testing\nKnowledge of Selenium or Cypress\nUnderstanding of SDLC', resp: 'Write and execute test cases\nAutomate regression tests\nReport and track bugs\nParticipate in sprint reviews', type: 'full_time', level: 'mid', smin: 45000, smax: 80000, city: 'Kathmandu', cat: 'Engineering', skills: ['QA Testing', 'Selenium', 'Test Automation', 'JIRA'], deadline: '2026-06-05' },
    ];

    const dbJobIds = [];
    for (const j of jobs) {
      const jRes = await client.query(
        `INSERT INTO jobs (company_id, title, description, requirements, responsibilities, job_type,
          experience_level, salary_min, salary_max, salary_currency, city, country, is_remote,
          category, skills_required, application_deadline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'NPR',$10,'Nepal',$11,$12,$13,$14) RETURNING id`,
        [j.cid, j.title, j.desc, j.req, j.resp, j.type, j.level, j.smin, j.smax, j.city,
         j.remote || false, j.cat, j.skills, j.deadline]
      );
      dbJobIds.push(jRes.rows[0].id);
    }

    // ===== APPLICATIONS =====
    const applications = [
      { job: dbJobIds[0], user: seekerUserIds[0], cover: 'I am very excited about this opportunity at Leapfrog Technology. With 4 years of React experience and a strong background in TypeScript, I believe I would be a great fit for your team.', status: 'shortlisted' },
      { job: dbJobIds[0], user: seekerUserIds[3], cover: 'Having worked as a software engineer for 5 years, I am eager to expand into React development. My experience with Java and enterprise software would bring a unique perspective to your team.', status: 'reviewed' },
      { job: dbJobIds[1], user: seekerUserIds[0], cover: 'Node.js has been my primary backend technology for the past 3 years. I have built multiple production APIs serving thousands of users and would love to bring this experience to Leapfrog.', status: 'pending' },
      { job: dbJobIds[2], user: seekerUserIds[2], cover: 'My background in data science and healthcare analytics makes me an ideal candidate for this role. I have analyzed healthcare datasets and created insightful reports.', status: 'hired' },
      { job: dbJobIds[4], user: seekerUserIds[2], cover: 'As a data scientist with 2 years of machine learning experience, including NLP projects, I am thrilled to apply for this position at Fusemachines.', status: 'shortlisted' },
      { job: dbJobIds[7], user: seekerUserIds[4], cover: 'With 3 years of DevOps experience working with AWS, Kubernetes, and Terraform, I am confident I can contribute significantly to Cotiviti Nepal team.', status: 'reviewed' },
      { job: dbJobIds[5], user: seekerUserIds[1], cover: 'I am a recent graduate with strong Python skills and a passion for AI research. This internship would be the perfect opportunity to apply my knowledge.', status: 'pending' },
      { job: dbJobIds[9], user: seekerUserIds[1], cover: 'As a UI/UX designer with 3 years of experience in Figma and a portfolio of 20+ projects, I would love to join Leapfrog Technology and create amazing user experiences.', status: 'pending' },
    ];

    for (const app of applications) {
      await client.query(
        `INSERT INTO applications (job_id, applicant_id, cover_letter, status) VALUES ($1,$2,$3,$4)`,
        [app.job, app.user, app.cover, app.status]
      );
    }

    // Update application counts
    for (const jobId of dbJobIds) {
      const count = await client.query('SELECT COUNT(*) FROM applications WHERE job_id = $1', [jobId]);
      await client.query('UPDATE jobs SET applications_count = $1 WHERE id = $2', [count.rows[0].count, jobId]);
    }

    await client.query('COMMIT');
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Company: hr@leapfrog.com / password123');
    console.log('Company: careers@deerwalk.com / password123');
    console.log('Job Seeker: arun.shrestha@gmail.com / password123');
    console.log('Job Seeker: priya.tamang@gmail.com / password123');
    console.log('\n🎯 Data Summary:');
    console.log(`  • ${companyData.length} companies`);
    console.log(`  • ${seekerData.length} job seekers`);
    console.log(`  • ${jobs.length} job postings`);
    console.log(`  • ${applications.length} applications`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding error:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

seedData();
