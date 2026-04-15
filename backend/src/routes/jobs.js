const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, updateJob, deleteJob, getMyJobs, getCategories } = require('../controllers/jobController');
const { authenticate, authorizeRole } = require('../middleware/auth');

router.get('/', getJobs);
router.get('/categories', getCategories);
router.get('/company/my-jobs', authenticate, authorizeRole('company'), getMyJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, authorizeRole('company'), createJob);
router.put('/:id', authenticate, authorizeRole('company'), updateJob);
router.delete('/:id', authenticate, authorizeRole('company'), deleteJob);

module.exports = router;
