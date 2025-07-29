import express from 'express';
import { notifyDriver } from '../controllers/notificationcontroller.js';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';

const router = express.Router();

router.post('/notify-driver', authenticateJWT, notifyDriver);

export default router;
