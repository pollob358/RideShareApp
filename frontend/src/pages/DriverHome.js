import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

const DriverHome = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState('');
  const [accepting, setAccepting] = useState({});
  const navigate = useNavigate();
  const dropdownRef = useRef();

  // Fetch location from backend (database), NOT from browser geolocation
  useEffect(() => {
    const fetchDriverLocation = async () => {
      setLoading(true);
      setError('');
      try {
        const driver_id = localStorage.getItem('rid');
        const token = localStorage.getItem('token');
        if (!driver_id || !token) {
          setError("Not logged in as driver");
          setLoading(false);
          return;
        }
        const res = await fetch(
          `http://localhost:3002/api/driver/location?driver_id=${driver_id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok && data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng });
        } else {
          setError("Could not fetch driver location from database.");
        }
      } catch (err) {
        setError("Error fetching location");
      }
      setLoading(false);
    };
    fetchDriverLocation();
  }, []);

  // Dropdown outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Fetch available rides
  const loadRides = () => {
    setRidesLoading(true);
    fetch("http://localhost:3002/available-rides")
      .then(res => res.json())
      .then(data => { setRides(data); setRidesLoading(false); })
      .catch(() => { setRidesError("Failed to load rides."); setRidesLoading(false); });
  };
  useEffect(loadRides, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rid');
    setDropdownOpen(false);
    navigate('/');
  };

  // Accept ride (token required!)
  const handleAcceptRide = async (ride_id) => {
    setAccepting(a => ({ ...a, [ride_id]: true }));
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please login again.");
        setAccepting(a => ({ ...a, [ride_id]: false }));
        navigate("/login");
        return;
      }
      const res = await fetch("http://localhost:3002/accept-ride", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ride_id }),
      });
      const data = await res.json();
      if (res.ok) {
        setRides(rides => rides.filter(r => r.ride_id !== ride_id));
        alert("Ride accepted! Redirecting to journey simulation...");
        // Route to simulation page for the accepted ride:
        navigate(`/ride/${ride_id}/driver-sim`);
      } else {
        alert(data.message || "Failed to accept ride");
        loadRides();
      }
    } catch {
      alert("Network or server error while accepting ride.");
    }
    setAccepting(a => ({ ...a, [ride_id]: false }));
  };

  return (
    <div>
      {/* Header & Dropdown */}
      <div style={{
        width: "100vw",
        height: 52,
        background: "#1976d2",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 26px",
        boxSizing: "border-box",
        boxShadow: "0 2px 10px #b0b6be44",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 102,
      }}>
        <div style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: 21,
          letterSpacing: 1,
        }}>
          Driver Dashboard
        </div>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((open) => !open)}
            style={{
              width: 34,
              height: 34,
              background: "#1565c0",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px #dde3f0",
              padding: 0,
            }}
            title="User Profile"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#1976d2" />
              <circle cx="24" cy="18" r="8" fill="#fff" />
              <ellipse cx="24" cy="34" rx="12" ry="8" fill="#fff" />
            </svg>
          </button>
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 40,
              background: "#fff",
              border: "1px solid #e0e4ea",
              boxShadow: "0 2px 16px #dde3f0cc",
              borderRadius: 12,
              minWidth: 148,
              zIndex: 999,
              overflow: "hidden"
            }}>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                style={dropdownItemStyle}
              >Profile</button>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                style={dropdownItemStyle}
              >Settings</button>
              <button
                onClick={handleLogout}
                style={{ ...dropdownItemStyle, color: "#c0392b", borderTop: "1px solid #f3f3f3" }}
              >Logout</button>
            </div>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: 540,
        margin: '84px auto 0 auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 10,
        boxShadow: '0 2px 8px #eee',
        position: "relative",
        background: "#fff"
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Welcome, Driver!</h2>

        {/* Location and Map */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            Loading your database location...
          </div>
        )}
        {error && (
          <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>
            {error}
          </div>
        )}
        {location && (
          <div>
            <div style={{ margin: "12px 0", textAlign: "center" }}>
              <b>Your Current Location (from database):</b>
              <div>Latitude: {location.lat}</div>
              <div>Longitude: {location.lng}</div>
            </div>
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={15}
              style={{ height: "350px", width: "100%", borderRadius: 12 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  You are here! (from DB)
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Available Rides Section */}
        <div style={{ marginTop: 40 }}>
          <h3 style={{ textAlign: 'center' }}>Available Ride Requests</h3>
          {ridesLoading && <div>Loading rides...</div>}
          {ridesError && <div style={{ color: 'red' }}>{ridesError}</div>}
          {!ridesLoading && rides.length === 0 && <div style={{ textAlign: 'center', color: '#777' }}>No available rides at the moment.</div>}
          {rides.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {rides.map(ride => (
                <li key={ride.ride_id} style={{ border: "1px solid #eee", borderRadius: 8, margin: "16px 0", padding: 14 }}>
                  <div><b>From:</b> {ride.start_location}</div>
                  <div><b>To:</b> {ride.end_location}</div>
                  <div><b>Requested At:</b> {new Date(ride.start_time).toLocaleString()}</div>
                  <button
                    onClick={() => handleAcceptRide(ride.ride_id)}
                    disabled={accepting[ride.ride_id]}
                    style={{
                      marginTop: 10,
                      padding: "9px 24px",
                      borderRadius: 7,
                      background: "#1976d2",
                      color: "#fff",
                      fontWeight: 600,
                      border: "none",
                      cursor: accepting[ride.ride_id] ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 6px #dde3f0"
                    }}
                  >
                    {accepting[ride.ride_id] ? "Accepting..." : "Accept"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const dropdownItemStyle = {
  width: "100%",
  padding: "11px 17px",
  textAlign: "left",
  background: "none",
  border: "none",
  fontSize: 15.5,
  color: "#222",
  cursor: "pointer",
  fontWeight: 500,
  outline: "none"
};

export default DriverHome;
