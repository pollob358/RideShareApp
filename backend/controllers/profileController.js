import pool from '../db.js';

export const getProfile = async (req, res) => {
  const { rid } = req.user;
  if (!rid) return res.status(400).json({ message: "RID required" });

  try {
    const personResult = await pool.query(
      `SELECT Name, Email, Phone_Number, PID FROM Person WHERE PID = $1`,
      [rid]
    );
    if (personResult.rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    let profile = { ...personResult.rows[0] };

    const riderResult = await pool.query(
      `SELECT RID, Created_at, Password FROM Rider WHERE RID = $1`,
      [rid]
    );
    if (riderResult.rows.length > 0) {
      profile.role = "Rider";
      profile.created_at = riderResult.rows[0].created_at;
    }

    const driverResult = await pool.query(
      `SELECT License, Rating, Is_active FROM Driver WHERE Driver_ID = $1`,
      [rid]
    );
    if (driverResult.rows.length > 0) {
      profile.role = "Driver";
      profile.license = driverResult.rows[0].license;
      profile.rating = driverResult.rows[0].rating;
      profile.is_active = driverResult.rows[0].is_active;

      const vehicleResult = await pool.query(
        `SELECT Vehicle_ID, License_Plate, Manufacturer, Model, Year, Color, Seats
         FROM Vehicle WHERE Driver_ID = $1`,
        [rid]
      );
      profile.vehicles = vehicleResult.rows;
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile" });
  }
};
