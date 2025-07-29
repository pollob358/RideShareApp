// src/pages/RequestRidePage.js
import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

// Default map center (fallback) and zoom
const DEFAULT_CENTER = { lat: 23.780636, lng: 90.419325 };
const DEFAULT_ZOOM = 13;
// Make sure you have REACT_APP_ORS_API_KEY in your .env
const ORS_API_KEY ="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE4ODA3ODhjMThjNDRmZGQ4NDhlYTRmMTYzYTc0MTE0IiwiaCI6Im11cm11cjY0In0=";

const pickupIcon = new L.DivIcon({
  html: '<div style="background:#1976d2;color:#fff;padding:8px;border-radius:50%;font-size:18px;">📍</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const dropoffIcon = new L.DivIcon({
  html: '<div style="background:#e53935;color:#fff;padding:8px;border-radius:50%;font-size:18px;">🏁</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const haversineDistance = (c1, c2) => {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(c2[0] - c1[0]);
  const dLon = toRad(c2[1] - c1[1]);
  const lat1 = toRad(c1[0]);
  const lat2 = toRad(c2[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function RequestRidePage() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [fare, setFare] = useState(null);
  const [rideId, setRideId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const startRef = useRef();
  const endRef = useRef();

  // Reverse geocode
  const reverseGeocode = async ({ lat, lng }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (!res.ok) return "Current Location";
      const data = await res.json();
      return data.display_name || "Current Location";
    } catch {
      return "Current Location";
    }
  };

  // Address suggestions
  const fetchSuggestions = async q => {
    if (!q) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  };

  // Fetch driving route
  const fetchRoute = async (start, end) => {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ coordinates: [[start.lng, start.lat], [end.lng, end.lat]] }),
        }
      );
      if (!res.ok) throw new Error();
      const { features } = await res.json();
      return features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch {
      setError("Failed to calculate route.");
      return [];
    }
  };

  // Handlers for text inputs
  const handleStartChange = async e => {
    const q = e.target.value;
    setStartLocation(q);
    setStartSuggestions(q.length > 2 ? await fetchSuggestions(q) : []);
  };
  const handleEndChange = async e => {
    const q = e.target.value;
    setEndLocation(q);
    setEndSuggestions(q.length > 2 ? await fetchSuggestions(q) : []);
  };

  // When user picks suggestion
  const selectStart = async s => {
    setStartLocation(s.display_name);
    const pos = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setPickupCoords(pos);
    setStartSuggestions([]);
  };
  const selectEnd = async s => {
    setEndLocation(s.display_name);
    const pos = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setEndCoords(pos);
    setEndSuggestions([]);
  };

  // Recompute route and fare on coord changes
  useEffect(() => {
    if (!pickupCoords || !endCoords) return;
    (async () => {
      const coords = await fetchRoute(pickupCoords, endCoords);
      setRouteCoords(coords);
      if (coords.length > 1) {
        let dist = 0;
        for (let i = 1; i < coords.length; i++) {
          dist += haversineDistance(coords[i - 1], coords[i]);
        }
        // 50 TK per km, rounded to 2 decimals
        setFare(parseFloat((dist * 50).toFixed(2)));
      }
    })();
  }, [pickupCoords, endCoords]);

  // Use device GPS for start
  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setPickupCoords(pos);
        setStartLocation(await reverseGeocode(pos));
        setStartSuggestions([]);
      },
      () => setError("Unable to fetch current location.")
    );
  };

  // Submit ride + fare
  const handleSubmit = async e => {
    e.preventDefault();
    if (!pickupCoords || !endCoords) {
      setError("Please select both pickup and dropoff locations.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3002/request-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          start_location: startLocation,
          end_location: endLocation,
          start_latitude: pickupCoords.lat,
          start_longitude: pickupCoords.lng,
          end_latitude: endCoords.lat,
          end_longitude: endCoords.lng,
          fare, // ← now included!
        }),
      });
      const json = await res.json();
      if (res.ok) setRideId(json.ride_id);
      else setError(json.message || "Request failed");
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  // Poll for acceptance and navigate
  useEffect(() => {
    if (!rideId) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3002/ride-status/${rideId}`);
        const data = await res.json();
        if (data.status === "accepted") {
          clearInterval(iv);
          navigate(`/ride/${rideId}/rider-sim`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [rideId, navigate]);

  // Inline styles (copy yours back if you need more fine-tuning)
  const container = { maxWidth: 800, margin: "40px auto", padding: 20, fontFamily: "Arial, sans-serif" };
  const input = { width: "100%", padding: 12, margin: "8px 0", borderRadius: 6, border: "1px solid #ccc" };
  const btnPrimary = { padding: "12px 24px", borderRadius: 6, border: "none", cursor: "pointer", background: "#1976d2", color: "#fff" };
  const btnConfirm = { ...btnPrimary, background: "#2e7d32" };

  return (
    <div style={container}>
      <h1 style={{ textAlign: "center", color: "#333" }}>📍 Request a Ride</h1>
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          ref={startRef}
          style={input}
          value={startLocation}
          onChange={handleStartChange}
          placeholder="Enter pickup location"
          required
        />
        {startSuggestions.length > 0 && (
          <div style={{ border: "1px solid #ddd", maxHeight: 150, overflowY: "auto", background: "#fff" }}>
            {startSuggestions.map(s => (
              <div key={s.place_id} onMouseDown={() => selectStart(s)} style={{ padding: 8, cursor: "pointer" }}>
                {s.display_name}
              </div>
            ))}
          </div>
        )}

        <input
          ref={endRef}
          style={input}
          value={endLocation}
          onChange={handleEndChange}
          placeholder="Enter dropoff location"
          required
        />
        {endSuggestions.length > 0 && (
          <div style={{ border: "1px solid #ddd", maxHeight: 150, overflowY: "auto", background: "#fff" }}>
            {endSuggestions.map(s => (
              <div key={s.place_id} onMouseDown={() => selectEnd(s)} style={{ padding: 8, cursor: "pointer" }}>
                {s.display_name}
              </div>
            ))}
          </div>
        )}

        {fare != null && (
          <p style={{ margin: "8px 0", fontWeight: 600 }}>
            Estimated Fare: <span style={{ color: "#2e7d32" }}>{fare} TK</span>
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
          <button type="button" onClick={handleUseCurrent} style={btnPrimary}>
            📍 Use My Location
          </button>
          <button type="submit" disabled={submitting} style={btnConfirm}>
            {submitting ? "Requesting..." : "Confirm Ride"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
      </form>

      <div style={{ marginTop: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: 8, overflow: "hidden" }}>
        <MapContainer center={pickupCoords || DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: 400, width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon}><Popup>Pickup Here</Popup></Marker>}
          {endCoords && <Marker position={[endCoords.lat, endCoords.lng]} icon={dropoffIcon}><Popup>Dropoff Here</Popup></Marker>}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ weight: 5 }} />}
        </MapContainer>
      </div>

      {rideId && (
        <div style={{ textAlign: "center", marginTop: 24, color: "#1976d2" }}>
          <h2>✅ Ride Requested!</h2>
          <p>Your Ride ID: <strong>{rideId}</strong></p>
          <p>Waiting for driver to accept…</p>
        </div>
      )}
    </div>
  );
}
