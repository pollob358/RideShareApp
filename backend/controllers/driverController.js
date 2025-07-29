// backend/controllers/driverController.js
import pool from '../db.js';

// PATCH /api/driver/update-location
// Accepts either { latitude, longitude } or { current_latitude, current_longitude }
export const updateDriverLocation = async (req, res) => {
  try {
    const driverId = req.user.rid;
    const latitude  = req.body.current_latitude  ?? req.body.latitude;
    const longitude = req.body.current_longitude ?? req.body.longitude;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: "latitude & longitude required" });
    }
    await pool.query(
      `UPDATE Driver
          SET Current_Latitude  = $1,
              Current_Longitude = $2
        WHERE Driver_ID = $3`,
      [latitude, longitude, driverId]
    );
    res.json({ message: 'Location updated', lat: latitude, lng: longitude });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update location', error: err.message });
  }
};

// GET /api/driver/location?driver_id=...
// Returns { lat, lng } from the Driver table
export const getDriverLocation = async (req, res) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id) {
      return res.status(400).json({ message: "driver_id required" });
    }
    const { rows } = await pool.query(
      `SELECT Current_Latitude, Current_Longitude
         FROM Driver
        WHERE Driver_ID = $1`,
      [driver_id]
    );
    if (!rows.length) return res.status(404).json({ message: "Driver not found" });
    const { current_latitude, current_longitude } = rows[0];
    res.json({ lat: current_latitude, lng: current_longitude });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch driver location", error: err.message });
  }
};
