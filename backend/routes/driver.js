import express from 'express';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';
import { updateDriverLocation, getDriverLocation, getRandomDriver } from '../controllers/driverController.js';


const router = express.Router();

// PATCH /api/driver/location (Driver updates their current location)
router.patch('/location', authenticateJWT, updateDriverLocation);

// GET /api/driver/location?driver_id=... (Anyone can fetch a driver's current location)
router.get('/location', getDriverLocation);

// GET /api/driver/random (Get a random driver with location)
router.get('/random', getRandomDriver);

export default router;
