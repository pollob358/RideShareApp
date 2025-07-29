import express from 'express';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';
import { createPayment,getFare } from '../controllers/paymentcontroller.js';

const router = express.Router();

// POST /accept-ride triggers ride acceptance (existing)
// New endpoint: POST /payment to record a payment
router.post('/payment', authenticateJWT, createPayment);
router.get('/payment/fare/:rideId', getFare);
export default router;
