import express from "express"
import { authenticateJWT } from "../middleware/AuthenticateJWT.js";
import { setRating } from "../controllers/ratingController.js";

const router=express.Router();

//router.post('/ratings',authenticateJWT,setRating);
// ratingRoutes.js
router.post('/api/ride/:rideId/rate', authenticateJWT, setRating);


export default router;