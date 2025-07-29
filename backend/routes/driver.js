
// backend/routes/driver.js
import express from 'express';
import { authenticateJWT } from '../middleware/AuthenticateJWT.js';
import { updateDriverLocation, getDriverLocation} from '../controllers/driverController.js';

const router = express.Router();

router.patch('/update-location', authenticateJWT, updateDriverLocation);
router.get('/location', getDriverLocation);

export default router;
