import pool from './db.js';

const populateDB = async () => {
  try {
    // ========== 1. DROP ALL TABLES ==========
    await pool.query(`
      DROP TABLE IF EXISTS Payment CASCADE;
      DROP TABLE IF EXISTS Ride_Riders CASCADE;
      DROP TABLE IF EXISTS Ride_Request CASCADE;
      DROP TABLE IF EXISTS Accident CASCADE;
      DROP TABLE IF EXISTS Rating CASCADE;
      DROP TABLE IF EXISTS Ride CASCADE;
      DROP TABLE IF EXISTS Microbus CASCADE;
      DROP TABLE IF EXISTS Motorcycle CASCADE;
      DROP TABLE IF EXISTS Car CASCADE;
      DROP TABLE IF EXISTS Vehicle CASCADE;
      DROP TABLE IF EXISTS Driver CASCADE;
      DROP TABLE IF EXISTS Rider CASCADE;
      DROP TABLE IF EXISTS Admin CASCADE;
      DROP TABLE IF EXISTS Person CASCADE;
    `);

    // ========== 2. CREATE TABLES ==========

    await pool.query(`
      CREATE TABLE Person (
        PID BIGSERIAL PRIMARY KEY,
        Email VARCHAR(255) UNIQUE NOT NULL,
        Name VARCHAR(255) NOT NULL,
        Phone_Number VARCHAR(20) NOT NULL
      );

      CREATE TABLE Rider (
        RID BIGSERIAL PRIMARY KEY,
        PID BIGINT NOT NULL REFERENCES Person(PID),
        Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Password VARCHAR(255) NOT NULL
      );

      CREATE TABLE Driver (
        Driver_ID BIGSERIAL PRIMARY KEY,
        PID BIGINT NOT NULL REFERENCES Person(PID),
        Rating FLOAT DEFAULT 5.0,
        Rating_count BIGINT DEFAULT 0,
        Is_Active BOOLEAN DEFAULT TRUE,
        License VARCHAR(50) NOT NULL,
        Current_Latitude FLOAT,
        Current_Longitude FLOAT
      );

      CREATE TABLE Admin (
        Admin_ID BIGSERIAL PRIMARY KEY,
        PID BIGINT NOT NULL REFERENCES Person(PID),
        Password VARCHAR(255) NOT NULL
      );

      CREATE TABLE Vehicle (
        Vehicle_ID BIGSERIAL PRIMARY KEY,
        Driver_ID BIGINT NOT NULL REFERENCES Driver(Driver_ID),
        License_Plate VARCHAR(20) UNIQUE NOT NULL,
        Manufacturer VARCHAR(255),
        Model VARCHAR(255),
        Year INT,
        Color VARCHAR(50),
        Seats INT NOT NULL
      );

      CREATE TABLE Car (
        Car_ID BIGSERIAL PRIMARY KEY,
        Vehicle_ID BIGINT NOT NULL REFERENCES Vehicle(Vehicle_ID),
        AC BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE Motorcycle (
        Bike_ID BIGSERIAL PRIMARY KEY,
        Vehicle_ID BIGINT NOT NULL REFERENCES Vehicle(Vehicle_ID),
        KickStart BOOLEAN DEFAULT FALSE,
        Type VARCHAR(50)
      );

      CREATE TABLE Microbus (
        Bus_ID BIGSERIAL PRIMARY KEY,
        Vehicle_ID BIGINT NOT NULL REFERENCES Vehicle(Vehicle_ID),
        Roof_Rack BOOLEAN DEFAULT FALSE,
        AC BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE Ride (
        Ride_ID BIGSERIAL PRIMARY KEY,
        Vehicle_ID BIGINT REFERENCES Vehicle(Vehicle_ID),
        Is_Shared BOOLEAN DEFAULT FALSE,
        Start_Time TIMESTAMP ,
        End_Time TIMESTAMP,
        Fare FLOAT ,
        Start_Latitude FLOAT,
        Start_Longitude FLOAT,
        End_Latitude FLOAT,
        End_Longitude FLOAT,
        Start_Location VARCHAR(255),
        End_Location VARCHAR(255),
        Status VARCHAR(32) DEFAULT 'pending'
      );

      CREATE TABLE Ride_Riders (
        Ride_Riders_ID BIGSERIAL PRIMARY KEY,
        Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
        Rider_ID BIGINT NOT NULL REFERENCES Rider(RID)
      );

      CREATE TABLE Rating (
        Rating_ID BIGSERIAL PRIMARY KEY,
        Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
        Rating_Value FLOAT NOT NULL CHECK (Rating_Value BETWEEN 1 AND 5),
        Comment VARCHAR(255),
        Rated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE Accident (
        Accident_ID BIGSERIAL PRIMARY KEY,
        Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
        Accident_Time TIMESTAMP NOT NULL,
        Latitude FLOAT,
        Longitude FLOAT,
        Location VARCHAR(255)
      );

      CREATE TABLE Ride_Request (
        Request_ID BIGSERIAL PRIMARY KEY,
        Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
        Requested_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Status VARCHAR(30) DEFAULT 'pending'
      );

      CREATE TABLE Payment (
        Payment_ID BIGSERIAL PRIMARY KEY,
        Ride_ID BIGINT NOT NULL REFERENCES Ride(Ride_ID),
        Amount FLOAT NOT NULL,
        Method VARCHAR(50),
        Status VARCHAR(50) DEFAULT 'pending',
        Paid_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE Ride_Request
      ADD COLUMN Start_Latitude FLOAT,
      ADD COLUMN Start_Longitude FLOAT;
    `);

    // ========== 3. INSERT DUMMY DATA ==========

    // --- Riders ---
    const rider1 = await pool.query(
      `INSERT INTO Person (Email, Name, Phone_Number)
       VALUES ('rider1@email.com', 'Rider One', '9000000001') RETURNING PID`
    );
    const rider2 = await pool.query(
      `INSERT INTO Person (Email, Name, Phone_Number)
       VALUES ('rider2@email.com', 'Rider Two', '9000000002') RETURNING PID`
    );
    const rider1PID = rider1.rows[0].pid;
    const rider2PID = rider2.rows[0].pid;

    const rider1Row = await pool.query(
      `INSERT INTO Rider (PID, Password)
       VALUES ($1, 'rider1pass') RETURNING RID`,
      [rider1PID]
    );
    const rider2Row = await pool.query(
      `INSERT INTO Rider (PID, Password)
       VALUES ($1, 'rider2pass') RETURNING RID`,
      [rider2PID]
    );
    const rider1RID = rider1Row.rows[0].rid;
    const rider2RID = rider2Row.rows[0].rid;

    // --- Drivers ---
    const driver1 = await pool.query(
      `INSERT INTO Person (Email, Name, Phone_Number)
       VALUES ('driver1@email.com', 'Driver One', '9110000001') RETURNING PID`
    );
    const driver2 = await pool.query(
      `INSERT INTO Person (Email, Name, Phone_Number)
       VALUES ('driver2@email.com', 'Driver Two', '9110000002') RETURNING PID`
    );
    const driver1PID = driver1.rows[0].pid;
    const driver2PID = driver2.rows[0].pid;

    const driver1Row = await pool.query(
      `INSERT INTO Driver (PID, Rating, Is_Active, License, Current_Latitude, Current_Longitude)
       VALUES ($1, 4.8, TRUE, 'LIC1001', 23.780636, 90.419325) RETURNING Driver_ID`,
      [driver1PID]
    );
    const driver2Row = await pool.query(
      `INSERT INTO Driver (PID, Rating, Is_Active, License, Current_Latitude, Current_Longitude)
       VALUES ($1, 4.6, TRUE, 'LIC1002', 23.777176, 90.399452) RETURNING Driver_ID`,
      [driver2PID]
    );
    const driver1ID = driver1Row.rows[0].driver_id;
    const driver2ID = driver2Row.rows[0].driver_id;

    // --- Vehicles ---
    const vehicle1 = await pool.query(
      `INSERT INTO Vehicle (Driver_ID, License_Plate, Manufacturer, Model, Year, Color, Seats)
       VALUES ($1, 'BAN123', 'Toyota', 'Corolla', 2021, 'Blue', 4) RETURNING Vehicle_ID`,
      [driver1ID]
    );
    const vehicle2 = await pool.query(
      `INSERT INTO Vehicle (Driver_ID, License_Plate, Manufacturer, Model, Year, Color, Seats)
       VALUES ($1, 'DHA456', 'Honda', 'Civic', 2022, 'Red', 4) RETURNING Vehicle_ID`,
      [driver2ID]
    );
    const vehicle1ID = vehicle1.rows[0].vehicle_id;
    const vehicle2ID = vehicle2.rows[0].vehicle_id;

    // Optionally, insert into Car table
    await pool.query(
      `INSERT INTO Car (Vehicle_ID, AC) VALUES ($1, TRUE), ($2, FALSE)`,
      [vehicle1ID, vehicle2ID]
    );

    // --- Admin ---
    // Insert a person for admin
    const adminPerson = await pool.query(
      `INSERT INTO Person (Email, Name, Phone_Number)
       VALUES ('admin@email.com', 'Admin User', '8000000000') RETURNING PID`
    );
    const adminPID = adminPerson.rows[0].pid;

    await pool.query(
      `INSERT INTO Admin (PID, Password)
       VALUES ($1, 'adminpass')`,
      [adminPID]
    );

    // --- Rides & relations ---
    const ride1 = await pool.query(
      `INSERT INTO Ride
        (Vehicle_ID, Is_Shared, Start_Time, Fare, Start_Latitude, Start_Longitude, End_Latitude, End_Longitude, Start_Location, End_Location, Status)
       VALUES
        ($1, FALSE, NOW(), 200, 23.780636, 90.419325, 23.777176, 90.399452, 'Banani', 'Dhanmondi', 'completed')
       RETURNING Ride_ID`,
      [vehicle1ID]
    );
    const ride1ID = ride1.rows[0].ride_id;

    await pool.query(
      `INSERT INTO Ride_Riders (Ride_ID, Rider_ID)
       VALUES ($1, $2)`,
      [ride1ID, rider1RID]
    );

    await pool.query(
      `INSERT INTO Payment (Ride_ID, Amount, Method, Status)
       VALUES ($1, 200, 'cash', 'completed')`,
      [ride1ID]
    );

    await pool.query(
      `INSERT INTO Rating (Ride_ID, Rating_Value, Comment)
       VALUES ($1, 5, 'Great ride!')`,
      [ride1ID]
    );

    console.log('✅ Tables created and dummy data inserted!');

  } catch (err) {
    console.error('❌ Error setting up database:', err);
  } finally {
    await pool.end();
  }
};

populateDB();
