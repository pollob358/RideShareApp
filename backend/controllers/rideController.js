// backend/controllers/rideController.js
import pool from '../db.js';

// Riders request a ride
export const requestRide = async (req, res) => {
  try {
    const {
      start_location,
      end_location,
      start_latitude,
      start_longitude,
      end_latitude,
      end_longitude
    } = req.body;
    const { rid: rider_id } = req.user;

    const rideResult = await pool.query(
      `INSERT INTO Ride
        (Vehicle_ID, Is_Shared, Start_Time, Start_Latitude, Start_Longitude, End_Latitude, End_Longitude, Start_Location, End_Location, Status)
       VALUES (NULL, FALSE, NOW(), $1, $2, $3, $4, $5, $6, 'pending')
       RETURNING Ride_ID`,
      [ start_latitude, start_longitude, end_latitude, end_longitude, start_location, end_location ]
    );
    const ride_id = rideResult.rows[0].ride_id;

    await pool.query(`INSERT INTO Ride_Request (Ride_ID) VALUES ($1)`, [ride_id]);
    await pool.query(
      `INSERT INTO Ride_Riders (Rider_ID, Ride_ID) VALUES ($1, $2)`,
      [rider_id, ride_id]
    );

    res.status(201).json({ message: 'Ride requested!', ride_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error requesting ride', error: err.detail || err.message });
  }
};

// Drivers accept a ride
export const acceptRide = async (req, res) => {
  try {
    const { ride_id } = req.body;
    const driver_id = req.user.rid;

    // Check for any active rides
    const active = await pool.query(
      `SELECT 1 FROM Ride WHERE Vehicle_ID IN (SELECT Vehicle_ID FROM Vehicle WHERE Driver_ID = $1)
       AND Status <> 'completed'`,
      [driver_id]
    );
    // if (active.rows.length) {
    //   return res.status(403).json({ message: 'You already have an active ride.' });
    // }

    const vehicleRes = await pool.query(
      `SELECT Vehicle_ID FROM Vehicle WHERE Driver_ID = $1`, [driver_id]
    );
    if (!vehicleRes.rows.length) return res.status(400).json({ message: 'Driver has no vehicle' });
    const vehicle_id = vehicleRes.rows[0].vehicle_id;

    const rideRes = await pool.query(
      `SELECT Status FROM Ride WHERE Ride_ID = $1`, [ride_id]
    );
    if (!rideRes.rows.length) return res.status(404).json({ message: 'Ride not found' });
    if (rideRes.rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Ride not available' });
    }

    await pool.query(
      `UPDATE Ride SET Vehicle_ID = $1, Status = 'accepted' WHERE Ride_ID = $2`,
      [vehicle_id, ride_id]
    );

    res.json({ message: 'Ride accepted!', ride_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error accepting ride', error: err.detail || err.message });
  }
};

// Update ride status (for simulations)
export const updateRideStatus = async (req, res) => {
  try {
    const { ride_id, status } = req.body;
    await pool.query(
      `UPDATE Ride SET Status = $1 WHERE Ride_ID = $2`,
      [status, ride_id]
    );
    res.json({ message: 'Ride status updated', ride_id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update ride status', error: err.message });
  }
};

// Get all pending ride requests
export const getAvailableRides = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         r.Ride_ID,
         r.Start_Location, r.End_Location,
         r.Start_Latitude, r.Start_Longitude,
         r.End_Latitude, r.End_Longitude,
         r.Start_Time
       FROM Ride_Request rr
       JOIN Ride r ON rr.Ride_ID = r.Ride_ID
       WHERE r.Status = 'pending'
       ORDER BY r.Start_Time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch available rides', error: err.message });
  }
};

export const getRideStatus = async (req, res) => {
  const { rideId } = req.params;

  try {
    // Get ride + linked driver via JOINs
    const result = await pool.query(`
      SELECT 
        r.ride_id,
        r.status,
        r.start_latitude, r.start_longitude,
        r.end_latitude,   r.end_longitude,
        d.current_latitude AS driver_lat,
        d.current_longitude AS driver_lng
      FROM Ride r
      LEFT JOIN Vehicle v ON r.vehicle_id = v.vehicle_id
      LEFT JOIN Driver d  ON v.driver_id = d.driver_id
      WHERE r.ride_id = $1
    `, [rideId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const ride = result.rows[0];

    res.json({
      ride_id: ride.ride_id,
      status: ride.status,
      start:  { lat: ride.start_latitude, lng: ride.start_longitude },
      end:    { lat: ride.end_latitude,   lng: ride.end_longitude },
      driver: ride.driver_lat != null && ride.driver_lng != null
        ? { lat: ride.driver_lat, lng: ride.driver_lng }
        : null
    });

  } catch (err) {
    console.error("💥 getRideStatus error:", err.stack);
    res.status(500).json({
      message: "Failed to fetch ride status",
      error: err.message
    });
  }
};
