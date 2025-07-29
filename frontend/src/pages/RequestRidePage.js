// src/pages/RequestRidePage.js
import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

// Default map center (fallback) and zoom
const DEFAULT_CENTER = { lat: 23.780636, lng: 90.419325 };
const DEFAULT_ZOOM = 13;
const ORS_API_KEY = "YOUR_ORS_KEY_HERE";

// Custom icons to avoid external CSS
const pickupIcon = new L.DivIcon({
  html: '<div style="background:#1976d2;color:#fff;padding:8px;border-radius:50%;font-size:18px;">📍</div>',
  iconSize: [40, 40], iconAnchor: [20, 40]
});
const dropoffIcon = new L.DivIcon({
  html: '<div style="background:#e53935;color:#fff;padding:8px;border-radius:50%;font-size:18px;">🏁</div>',
  iconSize: [40, 40], iconAnchor: [20, 40]
});

export default function RequestRidePage() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [rideId, setRideId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const startRef = useRef();
  const endRef = useRef();

  // Reverse geocode to get human-readable address
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

  // Suggestion fetcher
  const fetchSuggestions = async (q) => {
    if (!q) return [];
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  };

  // Route fetcher
  const fetchRoute = async (start, end) => {
    const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
    const body = { coordinates: [[start.lng, start.lat], [end.lng, end.lat]] };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error();
      const { features } = await res.json();
      return features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch {
      setError("Failed to calculate route.");
      return [];
    }
  };

  // Handle input changes
  const handleStartChange = async (e) => {
    const q = e.target.value;
    setStartLocation(q);
    setStartSuggestions(q.length > 2 ? await fetchSuggestions(q) : []);
  };
  const handleEndChange = async (e) => {
    const q = e.target.value;
    setEndLocation(q);
    setEndSuggestions(q.length > 2 ? await fetchSuggestions(q) : []);
  };

  // Selection handlers
  const selectStart = async (s) => {
    setStartLocation(s.display_name);
    const pos = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setPickupCoords(pos);
    setStartSuggestions([]);
  };
  const selectEnd = async (s) => {
    setEndLocation(s.display_name);
    const pos = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setEndCoords(pos);
    setEndSuggestions([]);
  };

  // Recalculate route
  useEffect(() => {
    if (pickupCoords && endCoords) {
      (async () => {
        const coords = await fetchRoute(pickupCoords, endCoords);
        setRouteCoords(coords);
      })();
    }
  }, [pickupCoords, endCoords]);

  // Use current location button
  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setPickupCoords(pos);
        const name = await reverseGeocode(pos);
        setStartLocation(name);
        setStartSuggestions([]);
      },
      () => setError("Unable to fetch current location.")
    );
  };

  // Submit ride request
  const handleSubmit = async (e) => {
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          start_location: startLocation,
          end_location: endLocation,
          start_latitude: pickupCoords.lat,
          start_longitude: pickupCoords.lng,
          end_latitude: endCoords.lat,
          end_longitude: endCoords.lng
        })
      });
      const json = await res.json();
      if (res.ok) setRideId(json.ride_id);
      else setError(json.message || "Request failed");
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  };

  // **NEW**: Poll ride status until accepted, then navigate
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
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [rideId, navigate]);

  // Styles
  const container = {
    maxWidth: 800,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial, sans-serif"
  };
  const input = {
    width: "100%",
    padding: 12,
    margin: "8px 0",
    borderRadius: 6,
    border: "1px solid #ccc",
    outline: "none"
  };
  const button = {
    padding: "12px 24px",
    margin: "8px 4px",
    border: "none",
    borderRadius: 6,
    background: "#1976d2",
    color: "#fff",
    cursor: "pointer"
  };
  const suggestionBox = {
    border: "1px solid #ddd",
    borderRadius: 6,
    maxHeight: 150,
    overflowY: "auto",
    background: "#fff"
  };
  const suggestionItem = {
    padding: 8,
    cursor: "pointer"
  };
  const mapCard = {
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    borderRadius: 8,
    overflow: "hidden"
  };

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
          <div style={suggestionBox}>
            {startSuggestions.map(s => (
              <div
                key={s.place_id}
                onMouseDown={() => selectStart(s)}
                style={suggestionItem}
              >
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
          <div style={suggestionBox}>
            {endSuggestions.map(s => (
              <div
                key={s.place_id}
                onMouseDown={() => selectEnd(s)}
                style={suggestionItem}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            onClick={handleUseCurrent}
            style={button}
          >
            📍 Use My Location
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...button, background: "#2e7d32" }}
          >
            {submitting ? "Requesting..." : "Confirm Ride"}
          </button>
        </div>
        {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
      </form>

      <div style={{ marginTop: 20, ...mapCard }}>
        <MapContainer
          center={pickupCoords || DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: 400, width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupCoords && (
            <Marker
              position={[pickupCoords.lat, pickupCoords.lng]}
              icon={pickupIcon}
            >
              <Popup>Pickup Here</Popup>
            </Marker>
          )}
          {endCoords && (
            <Marker
              position={[endCoords.lat, endCoords.lng]}
              icon={dropoffIcon}
            >
              <Popup>Dropoff Here</Popup>
            </Marker>
          )}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: "#1976d2", weight: 5 }}
            />
          )}
        </MapContainer>
      </div>

      {rideId && (
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            color: "#1976d2"
          }}
        >
          <h2>✅ Ride Requested!</h2>
          <p>Your Ride ID: <strong>{rideId}</strong></p>
          <p>Waiting for driver to accept…</p>
        </div>
      )}
    </div>
  );
}
