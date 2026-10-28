import express from 'express';
import {
  getAllApplications,
  getApplicationById,
  createApplication,
  updateStatus,
  updateApplication,
  deleteApplication
} from '../controllers/jobApplicationController.js';

const router = express.Router();

router.get('/', getAllApplications);
router.get('/:id', getApplicationById);
router.post('/', createApplication);
router.put('/:id/status', updateStatus);
router.put('/:id', updateApplication);
router.delete('/:id', deleteApplication);

export default router;
