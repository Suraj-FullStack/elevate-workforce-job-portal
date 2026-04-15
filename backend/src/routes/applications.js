const express = require('express');
const router = express.Router();
const { applyForJob, getMyApplications, getJobApplicants, updateApplicationStatus, getCompanyDashboard } = require('../controllers/applicationController');
const { authenticate, authorizeRole } = require('../middleware/auth');

router.post('/', authenticate, authorizeRole('job_seeker'), applyForJob);
router.get('/my-applications', authenticate, authorizeRole('job_seeker'), getMyApplications);
router.get('/company/dashboard', authenticate, authorizeRole('company'), getCompanyDashboard);
router.get('/job/:jobId', authenticate, authorizeRole('company'), getJobApplicants);
router.put('/:id/status', authenticate, authorizeRole('company'), updateApplicationStatus);

module.exports = router;
