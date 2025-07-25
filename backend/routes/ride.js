// routes/ride.js

import express from 'express';
import { 
  requestRide, 
  getAvailableRides, 
  acceptRide, 
  getRideStatus,
  updateRideStatus
} from '../controllers/rideController.js';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';

const router = express.Router();

// Riders request a ride (must be authenticated as Rider)
router.post('/request-ride', authenticateJWT, requestRide);

// Drivers accept a ride (must be authenticated as Driver)
router.post('/accept-ride', authenticateJWT, acceptRide);

// Update ride status (used by driver/rider simulation)
router.patch('/ride-status', authenticateJWT, updateRideStatus);

// Show available rides (public or authenticated)
router.get('/available-rides', getAvailableRides);

// Ride status (for simulation: both Rider/Driver can poll this)
router.get('/ride-status/:ride_id', getRideStatus);

export default router;
