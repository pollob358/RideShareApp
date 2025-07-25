import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AvailableRidesPage = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3002/available-rides")
      .then(res => res.json())
      .then(data => { setRides(data); setLoading(false); })
      .catch(() => { setError("Failed to load rides."); setLoading(false); });
  }, []);

  const handleAccept = async (ride_id) => {
    // Send a POST request to assign the ride to the current driver
    // (see DriverHome for full code)
  };

  if (loading) return <div>Loading available rides...</div>;
  if (error) return <div>{error}</div>;
  if (rides.length === 0) return <div>No available rides right now.</div>;

  return (
    <div style={{ maxWidth: 650, margin: "90px auto", padding: 24 }}>
      <h2>Available Ride Requests</h2>
      <ul>
        {rides.map(ride => (
          <li key={ride.ride_id} style={{ borderBottom: "1px solid #eee", padding: 12 }}>
            <div>
              <b>From:</b> {ride.start_location}<br />
              <b>To:</b> {ride.end_location}<br />
              <b>Requested At:</b> {new Date(ride.start_time).toLocaleString()}
            </div>
            <button onClick={() => handleAccept(ride.ride_id)} style={{ marginTop: 8 }}>
              Accept Ride
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default AvailableRidesPage;
