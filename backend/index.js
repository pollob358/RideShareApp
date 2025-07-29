import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import driverRoutes from './routes/driver.js';
import rideRoutes from './routes/ride.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import directionsRouter from './routes/directions.js';
import { setRating } from './controllers/ratingController.js';
import paymentRoutes from './routes/payment.js'  // ← import your payment controller



const app = express();

app.use(cors());
app.use(express.json());

// Auth, profile, ride, driver & directions
app.use(authRoutes);
app.use(profileRoutes);
app.use(rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api', directionsRouter);



// Rating endpoint
app.post('/api/ride/:rideId/rate', setRating);

// **Payment endpoint**  
// Front‑end calls POST http://localhost:3002/payment
app.use(paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
