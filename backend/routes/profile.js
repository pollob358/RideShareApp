import express from 'express';
import { getProfile } from '../controllers/profileController.js';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';

const router = express.Router();

router.get('/profile', authenticateJWT, getProfile);

export default router;
