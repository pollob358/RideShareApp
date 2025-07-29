// src/pages/DriverHome.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Haversine formula for straight‑line distance in km
const haversineDistance = (c1, c2) => {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lng - c1.lng);
  const lat1 = toRad(c1.lat);
  const lat2 = toRad(c2.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Icons
const carIcon     = new L.DivIcon({ html:'🚗', iconSize:[30,30], iconAnchor:[15,15] });
const pickupIcon  = new L.DivIcon({ html:'📍', iconSize:[30,30], iconAnchor:[15,15] });
const dropoffIcon = new L.DivIcon({ html:'🏁', iconSize:[30,30], iconAnchor:[15,15] });

export default function DriverHome() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [availableRides,  setAvailableRides]  = useState([]);
  const [filteredRides,   setFilteredRides]   = useState([]);
  const [error,           setError]           = useState('');
  const navigate = useNavigate();
  const locPoll  = useRef(null);

  // 1️⃣ Get GPS and store into driver table
  const requestLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(loc);

        const token = localStorage.getItem('token');
        // immediate patch
        fetch('http://localhost:3002/api/driver/update-location', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${token}`
          },
          body: JSON.stringify({
            current_latitude:  loc.lat,
            current_longitude: loc.lng
          })
        });
        // then every 5s
        locPoll.current = setInterval(() => {
          fetch('http://localhost:3002/api/driver/update-location', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization:  `Bearer ${token}`
            },
            body: JSON.stringify({
              current_latitude:  loc.lat,
              current_longitude: loc.lng
            })
          });
        }, 5000);
      },
      () => setError('Permission denied or unavailable')
    );
  };
  useEffect(() => () => clearInterval(locPoll.current), []);

  // 2️⃣ Fetch available rides every 5s (with fare included from backend)
  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3002/available-rides', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setAvailableRides(Array.isArray(data) ? data : []);
      } catch {
        setError('Could not load rides');
      }
    };
    fetchRides();
    const iv = setInterval(fetchRides, 5000);
    return () => clearInterval(iv);
  }, []);

  // 3️⃣ Filter to those within 10 km and ensure fare is defined
  useEffect(() => {
    if (!currentLocation) return setFilteredRides([]);
    setFilteredRides(
      availableRides
        .filter(ride => {
          const start = {
            lat: parseFloat(ride.pickup_lat),
            lng: parseFloat(ride.pickup_lng)
          };
          return haversineDistance(currentLocation, start) <= 10;
        })
        .map(ride => ({
          ...ride,
          fare: typeof ride.fare === 'number' ? ride.fare : 0
        }))
    );
  }, [currentLocation, availableRides]);

  // 4️⃣ Accept ride, final GPS patch, then navigate
  const handleAccept = async rideId => {
    if (!currentLocation) {
      alert('Please enable GPS first');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      // a) accept
      const r1 = await fetch('http://localhost:3002/accept-ride', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ ride_id: rideId })
      });
      const j1 = await r1.json();
      if (!r1.ok) {
        alert(j1.message || 'Could not accept ride');
        return;
      }

      // Remove accepted ride from UI
      setAvailableRides(prev => prev.filter(r => r.ride_id !== rideId));
      setFilteredRides(prev => prev.filter(r => r.ride_id !== rideId));

      // b) final GPS push (reuse same token)
      await fetch('http://localhost:3002/api/driver/update-location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({
          current_latitude:  currentLocation.lat,
          current_longitude: currentLocation.lng
        })
      });
      // c) navigate
      navigate(`/ride/${rideId}/driver-sim`);
    } catch {
      alert('Server error');
    }
  };

  // ——————————————————————————————
  // RENDER
  // ——————————————————————————————
  const styles = {
    page:   { maxWidth:800, margin:'40px auto', padding:20 },
    header: { textAlign:'center', color:'#333', marginBottom:20 },
    btn:    { padding:'10px 20px', marginBottom:16, background:'#1976d2', color:'#fff', border:'none', borderRadius:6, cursor:'pointer' },
    card:   { boxShadow:'0 2px 8px rgba(0,0,0,0.1)', borderRadius:8, padding:16, marginBottom:16 },
    map:    { height:200, width:'100%', borderRadius:8, marginTop:12 }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Driver Dashboard</h1>
      {error && <p style={{ color:'red' }}>{error}</p>}

      {!currentLocation
        ? <button style={styles.btn} onClick={requestLocation}>
            Enable Location Access
          </button>
        : <p><strong>Your GPS:</strong> {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}</p>
      }

      {currentLocation && filteredRides.length === 0 && (
        <p>No ride requests within 10 km.</p>
      )}

      {filteredRides.map(ride => (
        <div key={ride.ride_id} style={styles.card}>
          <p><strong>Ride ID:</strong> {ride.ride_id}</p>
          <p><strong>Pickup:</strong> {ride.start_location}</p>
          <p><strong>Dropoff:</strong> {ride.end_location}</p>
          <p><strong>Distance:</strong> {haversineDistance(
              currentLocation,
              { lat:+ride.pickup_lat, lng:+ride.pickup_lng }
            ).toFixed(2)} km</p>
          <p><strong>Fare:</strong> {ride.fare.toFixed(2)} TK</p>

          <MapContainer
            center={[+ride.pickup_lat, +ride.pickup_lng]}
            zoom={13}
            style={styles.map}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[ride.pickup_lat, ride.pickup_lng]} icon={pickupIcon}>
              <Popup>Pickup</Popup>
            </Marker>
            <Marker position={[ride.end_latitude, ride.end_longitude]} icon={dropoffIcon}>
              <Popup>Dropoff</Popup>
            </Marker>
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={carIcon}>
              <Popup>Your Car</Popup>
            </Marker>
          </MapContainer>

          <button
            style={{ ...styles.btn, background:'#388e3c' }}
            onClick={() => handleAccept(ride.ride_id)}
          >
            ✅ Accept Ride
          </button>
        </div>
      ))}
    </div>
  );
}
