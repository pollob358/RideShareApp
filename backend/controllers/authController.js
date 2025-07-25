// controllers/authController.js

import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

// ---- LOGIN ----
export const login = async (req, res) => {
  const { role, id, password } = req.body;
  try {
    let result, rid, userData;
    if (role === 'Rider') {
      // id = RID for Rider login
      result = await pool.query(
        'SELECT * FROM Rider WHERE RID = $1 AND Password = $2',
        [id, password]
      );
      if (result.rows.length > 0) {
        rid = result.rows[0].rid;
        userData = { rid, role: 'Rider' };
      }
    } else if (role === 'Driver') {
      // id = Driver_ID for Driver login
      result = await pool.query(
        'SELECT * FROM Driver WHERE Driver_ID = $1 AND License = $2',
        [id, password]
      );
      if (result.rows.length > 0) {
        rid = result.rows[0].driver_id;
        userData = { rid, role: 'Driver' };
      }
    }
    if (result && result.rows.length > 0) {
      const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '2h' });
      res.json({ message: `Welcome, ${role}!`, token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Login error');
  }
};


// ---- SIGNUP ----
export const signup = async (req, res) => {
  const {
    name, email, phone, password,
    wantsToBeDriver, license, vehicle
  } = req.body;

  try {
    // 1. Insert into Person, get PID
    const personInsert = await pool.query(
      'INSERT INTO Person (Email, Name, Phone_Number) VALUES ($1, $2, $3) RETURNING PID',
      [email, name, phone]
    );
    const pid = personInsert.rows[0].pid;

    // 2. Insert into Rider (PID, Password)
    // Note: RID is auto-generated. You only need PID, Password. (No need to provide RID)
    await pool.query(
      'INSERT INTO Rider (PID, Password) VALUES ($1, $2)',
      [pid, password]
    );

    // 3. If wantsToBeDriver, insert into Driver and Vehicle tables
    if (wantsToBeDriver) {
  // Set default starting location (can randomize, or ask user)
  const DEFAULT_DRIVER_LAT = 23.780636;
  const DEFAULT_DRIVER_LNG = 90.419325;
  const driverInsert = await pool.query(
    'INSERT INTO Driver (PID, Rating, Is_Active, License, Current_Latitude, Current_Longitude) VALUES ($1, 5.0, TRUE, $2, $3, $4) RETURNING Driver_ID',
    [pid, license, DEFAULT_DRIVER_LAT, DEFAULT_DRIVER_LNG]
  );
  const driverId = driverInsert.rows[0].driver_id;

  await pool.query(
    `INSERT INTO Vehicle (Driver_ID, License_Plate, Manufacturer, Model, Year, Color, Seats)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      driverId,
      vehicle.plate,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.color,
      vehicle.seats
    ]
  );
}

    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed', error: err.detail || err.message });
  }
};
