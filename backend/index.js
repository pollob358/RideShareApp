import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import driverRoutes from './routes/driver.js';
import rideRoutes from './routes/ride.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import directionsRouter from './routes/directions.js';
import { setRating } from './controllers/ratingController.js';  // import your controller

const app = express();

app.use(cors());
app.use(express.json());

// Keep your original route setup
app.use(authRoutes);         // /login, /signup
app.use(profileRoutes);      // /profile
app.use(rideRoutes);         // /request-ride, /accept-ride, /available-rides, /ride-status/:ride_id
app.use('/api/driver', driverRoutes); // /api/driver/update-location, etc.
app.use('/api', directionsRouter);

// Add rating POST endpoint
app.post('/api/ride/:rideId/rate', setRating);


// 404 for everything else
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


// catch-all error handler (in case any async throws outside of try/catch)
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
