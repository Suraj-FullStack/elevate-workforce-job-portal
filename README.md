# Elevate Workforce Solutions — Nepal Job Portal

## 🌐 Live URL
**https://3000-ifum2qwadj4oroj0tzavo-5634da27.sandbox.novita.ai**

---

## 📌 Project Overview
**Elevate Workforce Solutions** is a full-stack job portal for Nepal, connecting talented professionals with top companies.

---

## 🏗 Architecture

```
webapp/
├── backend/               # Node.js + Express REST API
│   ├── src/
│   │   ├── config/        # Database connection (PostgreSQL)
│   │   ├── controllers/   # Business logic
│   │   │   ├── authController.js
│   │   │   ├── jobController.js
│   │   │   ├── applicationController.js
│   │   │   └── companyController.js
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── models/        # DB schema + migrations
│   │   ├── routes/        # REST API routes
│   │   ├── seed.js        # Database seeder
│   │   └── server.js      # Express app entry point
│   └── package.json
└── frontend/              # HTML + Tailwind CSS SPA
    ├── index.html
    └── assets/
        ├── css/style.css
        └── js/
            ├── api.js     # API client + utilities
            ├── auth.js    # Authentication logic
            ├── jobs.js    # Job listings + applications
            ├── companies.js
            ├── dashboard.js
            └── app.js     # SPA router
```

---

## ✅ Completed Features

### Authentication
- ✅ Register (Job Seeker / Company)
- ✅ Login with JWT tokens
- ✅ Logout
- ✅ Role-based access control

### Job Seekers
- ✅ Browse & search jobs with filters (category, type, level, city)
- ✅ Pagination
- ✅ Job detail view
- ✅ Apply to jobs with cover letter
- ✅ Track application status (My Applications)
- ✅ User profile page

### Companies
- ✅ Post new jobs
- ✅ Edit/delete job listings
- ✅ View all applicants per job
- ✅ Update applicant status (pending/reviewed/shortlisted/hired/rejected)
- ✅ Company dashboard with stats

### General
- ✅ Home page with featured jobs, categories, companies
- ✅ Company listings page
- ✅ Responsive design (mobile-friendly)
- ✅ Demo accounts pre-loaded

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/jobs | List jobs (paginated, filtered) |
| GET | /api/jobs/:id | Get job details |
| POST | /api/jobs | Create job (company) |
| PUT | /api/jobs/:id | Update job (company) |
| DELETE | /api/jobs/:id | Delete job (company) |
| GET | /api/jobs/company/my-jobs | Company's jobs |
| GET | /api/jobs/categories | Job categories |
| POST | /api/applications | Apply for job |
| GET | /api/applications/my-applications | Seeker's applications |
| GET | /api/applications/job/:jobId | Job applicants (company) |
| PUT | /api/applications/:id/status | Update app status |
| GET | /api/applications/company/dashboard | Dashboard stats |
| GET | /api/companies | List companies |
| GET | /api/companies/:id | Company details |
| GET | /api/health | Health check |

---

## 🗄 Database Schema (PostgreSQL)

- **users** — Auth + basic profile
- **companies** — Company-specific profile
- **job_seekers** — Seeker-specific profile (skills, experience)
- **jobs** — Job listings
- **applications** — Job applications with status
- **saved_jobs** — Bookmarked jobs

---

## 👤 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 🏢 Company | Elevate@workforce.com | password123 |
| 🏢 Company | careers@Elevate.com | password123 |
| 👤 Job Seeker | surajkumar@gmail.com | password123 |
| 👤 Job Seeker | Surajks@gmail.com | password123 |

---

## 🌱 Seed Data

- 5 Companies (Leapfrog, Deerwalk, Fusemachines, CloudFactory, Cotiviti)
- 5 Job Seekers with profiles
- 12 Job Postings across categories
- 8 Applications with various statuses

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Tailwind CSS, Vanilla JS (SPA) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Security | bcryptjs, helmet, rate-limiting |
| Process | PM2 |

> **Note:** This project uses Node.js/Express as the backend (architecturally identical to .NET Web API with controllers, services, middleware, and JWT). The .NET SDK requires ~500MB disk space which exceeded sandbox limits.

---

## 🚀 Running Locally

```bash
# Start PostgreSQL
sudo service postgresql start

# Seed database
cd backend && node src/seed.js

# Start server (PM2)
pm2 start ecosystem.config.cjs

# Or run directly
node src/server.js
```

**Last Updated:** 2026-04-15
**Status:** ✅ Live
