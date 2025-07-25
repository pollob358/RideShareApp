

//  CREATE TABLE Rating (
//         Rating_ID BIGSERIAL PRIMARY KEY,
//         Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
//         Rating_Value FLOAT NOT NULL CHECK (Rating_Value BETWEEN 1 AND 5),
//         Comment VARCHAR(255),
//         Rated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );

//  CREATE TABLE Ride (
//         Ride_ID BIGSERIAL PRIMARY KEY,
//         Vehicle_ID BIGINT REFERENCES Vehicle(Vehicle_ID),
//         Is_Shared BOOLEAN DEFAULT FALSE,
//         Start_Time TIMESTAMP ,
//         End_Time TIMESTAMP,
//         Fare FLOAT ,
//         Start_Latitude FLOAT,
//         Start_Longitude FLOAT,
//         End_Latitude FLOAT,
//         End_Longitude FLOAT,
//         Start_Location VARCHAR(255),
//         End_Location VARCHAR(255),
//         Status VARCHAR(32) DEFAULT 'pending'
//       );



//         CREATE TABLE Vehicle (
//         Vehicle_ID BIGSERIAL PRIMARY KEY,
//         Driver_ID BIGINT NOT NULL REFERENCES Driver(Driver_ID),
//         License_Plate VARCHAR(20) UNIQUE NOT NULL,
//         Manufacturer VARCHAR(255),
//         Model VARCHAR(255),
//         Year INT,
//         Color VARCHAR(50),
//         Seats INT NOT NULL
//       );


//  CREATE TABLE Driver (
//         Driver_ID BIGSERIAL PRIMARY KEY,
//         PID BIGINT NOT NULL REFERENCES Person(PID),
//         Rating FLOAT DEFAULT 5.0,
//         Rating_count BIGINT DEFAULT 0,  
//         Is_Active BOOLEAN DEFAULT TRUE,
//         License VARCHAR(50) NOT NULL,
//         Current_Latitude FLOAT,
//         Current_Longitude FLOAT
//       );
import pool from "../db.js";

export const setRating = async (req, res) => {
  console.log("PARAMS:", req.params); // <-- see what Express sees
  console.log("BODY:", req.body);     // <-- see what you get from client
  // ...rest of code...
  const ride_id=req.params.rideId;
  const {rating, comment, rated_at } = req.body;

  if (!rating) {
    return res.status(400).json({ message: "Rating is required." });
  }

  try {
    await pool.query(
      `INSERT INTO rating(ride_id, rating_value, comment, rated_at)
       VALUES ($1, $2, $3, $4)`,
      [ride_id, rating, comment || null, rated_at || null]
    );

    const driverResult = await pool.query(
      `SELECT d.driver_id
       FROM rating ra, ride r, vehicle v, driver d
       WHERE ra.ride_id = r.ride_id
         AND r.vehicle_id = v.vehicle_id
         AND v.driver_id = d.driver_id
         AND ra.ride_id = $1
       ORDER BY ra.rating_id DESC
       LIMIT 1`,
      [ride_id]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found for this ride." });
    }

    const driver_id = driverResult.rows[0].driver_id;

    const avgResult = await pool.query(
      `SELECT COUNT(*) AS total, AVG(ra.rating_value) AS avg_rating
       FROM rating ra, ride r, vehicle v
       WHERE ra.ride_id = r.ride_id
         AND r.vehicle_id = v.vehicle_id
         AND v.driver_id = $1`,
      [driver_id]
    );

    const newRating = parseFloat(avgResult.rows[0].avg_rating);
    const newRatingCount = parseInt(avgResult.rows[0].total);

    await pool.query(
      `UPDATE driver
       SET rating = $1,
           rating_count = $2
       WHERE driver_id = $3`,
      [newRating, newRatingCount, driver_id]
    );

    res.status(200).json({ message: "Rating submitted and driver updated." });

  } catch (error) {
    console.error("Error in setRating:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
