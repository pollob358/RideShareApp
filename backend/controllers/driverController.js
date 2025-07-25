import pool from '../db.js';

export const updateDriverLocation = async (req, res) => {
  try {
    const { rid, role } = req.user;
    if (role !== 'Driver') {
      return res.status(403).json({ message: "Forbidden: Only drivers can update location" });
    }
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }
    await pool.query(
      "UPDATE Driver SET Current_Latitude = $1, Current_Longitude = $2 WHERE Driver_ID = $3",
      [latitude, longitude, rid]
    );
    res.json({ message: "Driver location updated successfully" });
  } catch (err) {
    console.error("Error updating driver location:", err);
    res.status(500).json({ message: "Failed to update driver location", error: err.message });
  }
};
// Already imported: import pool from '../db.js';

export const getRandomDriver = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         Driver_ID as driver_id, 
         Current_Latitude as current_latitude, 
         Current_Longitude as current_longitude
       FROM Driver
       WHERE Current_Latitude IS NOT NULL AND Current_Longitude IS NOT NULL
       ORDER BY RANDOM()
       LIMIT 1`
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "No drivers with valid locations found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to get random driver", error: err.message });
  }
};


export const getDriverLocation = async (req, res) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ message: "Driver ID is required" });
    const result = await pool.query(
      "SELECT Current_Latitude, Current_Longitude FROM Driver WHERE Driver_ID = $1",
      [driver_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const row = result.rows[0];
    res.json({ lat: row.current_latitude, lng: row.current_longitude });
  } catch (err) {
    console.error("Error fetching driver location:", err);
    res.status(500).json({ message: "Failed to fetch driver location", error: err.message });
  }
};
