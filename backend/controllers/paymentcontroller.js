import pool from '../db.js';

/**
 * Create a new payment record for a completed ride
 */
// controllers/payment.controller.js

export const createPayment = async (req, res) => {
  try {
    const { ride_id, method } = req.body;
    if (!ride_id || !method) {
      return res
        .status(400)
        .json({ message: 'ride_id and method are required' });
    }

    // 1) Verify ride exists and grab its fare
    const rideRes = await pool.query(
      `SELECT Fare
         FROM Ride
        WHERE Ride_ID = $1`,
      [ride_id]
    );
    if (!rideRes.rows.length) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    const amount = rideRes.rows[0].fare;
    if (amount == null) {
      return res
        .status(400)
        .json({ message: 'Ride fare is not set, cannot process payment' });
    }

    // 2) Insert into Payment table
    const insertRes = await pool.query(
      `INSERT INTO Payment (Ride_ID, Amount, Method, Status)
       VALUES ($1, $2, $3, 'completed')
       RETURNING Payment_ID`,
      [ride_id, amount, method]
    );

    // 3) Mark the ride as paid/completed
    await pool.query(
      `UPDATE Ride
          SET Status = 'completed'
        WHERE Ride_ID = $1`,
      [ride_id]
    );

    res.status(201).json({
      message: 'Payment recorded',
      payment_id: insertRes.rows[0].payment_id,
      amount
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res
      .status(500)
      .json({ message: 'Server error', error: err.detail || err.message });
  }
};


export const getFare = async (req, res) => {
  try {
    const { rideId } = req.params;

    // 1) Fetch the fare from Ride
    const { rows } = await pool.query(
      `SELECT Fare
         FROM Ride
        WHERE Ride_ID = $1`,
      [rideId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const { fare } = rows[0];
    if (fare == null) {
      return res
        .status(400)
        .json({ message: 'Fare not set for this ride' });
    }

    // 2) Return it
    res.json({ rideId, fare });
  } catch (err) {
    console.error('Error fetching fare:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};