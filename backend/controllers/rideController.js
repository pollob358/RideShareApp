// controllers/rideController.js

import pool from '../db.js';

// Request a Ride (expects authenticated user - req.user.rid)
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
      [
        start_latitude, start_longitude,
        end_latitude, end_longitude,
        start_location, end_location
      ]
    );
    const ride_id = rideResult.rows[0].ride_id;

    // Ride_Request INSERTION is still manual, unless you have a trigger for this as well:
    await pool.query(
      `INSERT INTO Ride_Request (Ride_ID) VALUES ($1)`, [ride_id]
    );

    await pool.query(
      `INSERT INTO Ride_Riders (Rider_ID, Ride_ID)
       VALUES ($1, $2)`,
      [rider_id, ride_id]
    );

    res.status(201).json({ message: "Ride requested!", ride_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error requesting ride", error: err.detail || err.message });
  }
};

export const acceptRide = async (req, res) => {
  try {
    const { ride_id } = req.body;
    const driver_id = req.user.rid;

    // Only allow one active ride per driver
    const activeRide = await pool.query(
      `SELECT * FROM Ride WHERE Vehicle_ID IN (SELECT Vehicle_ID FROM Vehicle WHERE Driver_ID = $1) AND Status IN ('accepted', 'movingToPickup', 'waitingPickup', 'movingToDropoff')`,
      [driver_id]
    );
    if (activeRide.rows.length > 0) {
      return res.status(403).json({ message: "You already have an active ride." });
    }

    // Get driver's vehicle
    const vehicleRes = await pool.query(
      `SELECT Vehicle_ID FROM Vehicle WHERE Driver_ID = $1`, [driver_id]
    );
    if (vehicleRes.rows.length === 0) return res.status(400).json({ message: "Driver has no vehicle" });
    const vehicle_id = vehicleRes.rows[0].vehicle_id;

    // Ensure ride is still pending
    const rideRes = await pool.query(
      `SELECT Status FROM Ride WHERE Ride_ID = $1`, [ride_id]
    );
    if (!rideRes.rows.length) return res.status(404).json({ message: "Ride not found" });
    if (rideRes.rows[0].status !== 'pending') {
      return res.status(400).json({ message: "Ride is no longer available" });
    }

    // Update ride: assign vehicle, set status
    await pool.query(
      `UPDATE Ride SET Vehicle_ID = $1, Status = 'accepted' WHERE Ride_ID = $2`,
      [vehicle_id, ride_id]
    );
    // DO NOT delete from Ride_Request in JS – the trigger will do this!

    res.json({ message: "Ride accepted!", ride_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error accepting ride", error: err.detail || err.message });
  }
};

// New: Update ride status (for simulation control)
export const updateRideStatus = async (req, res) => {
  try {
    const { ride_id, status } = req.body;
    await pool.query(
      `UPDATE Ride SET Status = $1 WHERE Ride_ID = $2`,
      [status, ride_id]
    );
    res.json({ message: "Ride status updated", ride_id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update ride status", error: err.message });
  }
};

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
        ORDER BY r.Start_Time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch available rides', error: err.message });
  }
};

export const getRideStatus = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const rideRes = await pool.query(
      `SELECT 
          Ride_ID, Status, Vehicle_ID,
          Start_Latitude, Start_Longitude, End_Latitude, End_Longitude
        FROM Ride WHERE Ride_ID = $1`, [ride_id]
    );
    if (!rideRes.rows.length) return res.status(404).json({ message: "Ride not found" });
    const ride = rideRes.rows[0];

    // If accepted, show driver location
    let driverLocation = null;
    if (ride.status !== 'pending' && ride.vehicle_id) {
      const driverRes = await pool.query(
        `SELECT Driver.Driver_ID, Current_Latitude, Current_Longitude
         FROM Vehicle JOIN Driver ON Vehicle.Driver_ID = Driver.Driver_ID
         WHERE Vehicle.Vehicle_ID = $1`, [ride.vehicle_id]
      );
      if (driverRes.rows.length) {
        driverLocation = {
          driver_id: driverRes.rows[0].driver_id,
          lat: driverRes.rows[0].current_latitude,
          lng: driverRes.rows[0].current_longitude,
        };
      }
    }

    res.json({
      ride_id: ride.ride_id,
      status: ride.status,
      vehicle_id: ride.vehicle_id,
      start: { lat: ride.start_latitude, lng: ride.start_longitude },
      end: { lat: ride.end_latitude, lng: ride.end_longitude },
      driver: driverLocation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch ride status", error: err.message });
  }
};
