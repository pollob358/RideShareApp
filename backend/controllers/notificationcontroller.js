import pool from '../db.js';

export const notifyDriver = async (req, res) => {
  const { ride_id } = req.body;
  try {
    // Example: get driver info via vehicle
    const result = await pool.query(`
      SELECT d.Driver_ID, p.Phone_Number, p.Email
      FROM Ride r
      JOIN Vehicle v ON r.Vehicle_ID = v.Vehicle_ID
      JOIN Driver d ON v.Driver_ID = d.Driver_ID
      JOIN Person p ON d.PID = p.PID
      WHERE r.Ride_ID = $1
    `, [ride_id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driver = result.rows[0];
    console.log(`📣 Notify driver ${driver.driver_id} - Payment received`);

    // You can extend this to send email or real-time messages
    res.json({ message: 'Driver notified' });
  } catch (err) {
    console.error('Notification error:', err);
    res.status(500).json({ message: 'Notification failed' });
  }
};
