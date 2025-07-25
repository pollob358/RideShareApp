import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";

const ORS_API_KEY = "5b3ce3597851110001cf6248159fb5b9de2a4436a27aa58dcf630560";

const fetchSuggestions = async (query) => {
  if (!query) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
  );
  return await res.json();
};

const fetchRoute = async (start, end) => {
  const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
  const body = {
    coordinates: [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ]
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": ORS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Failed to fetch route");
  const data = await res.json();
  return {
    coords: data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distance: data.features[0].properties.summary.distance, // meters
    duration: data.features[0].properties.summary.duration // seconds
  };
};

// Custom map icons
const startIcon = new L.DivIcon({
  className: "",
  html: `<svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#1976d2" stroke="#fff" stroke-width="3"/><text x="18" y="23" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold">&#128663;</text></svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});
const endIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 34 34"><rect x="1" y="1" width="32" height="32" rx="8" fill="#d32f2f" stroke="#fff" stroke-width="2"/><text x="17" y="24" font-size="18" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold">&#x1F6A9;</text></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});
const driverIcon = new L.DivIcon({
  className: "",
  html: `<svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="#2e7d32" stroke="#fff" stroke-width="3"/><text x="14" y="19" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial">&#128663;</text></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const RequestRidePage = () => {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState({ start: false, end: false });
  const [routeLoading, setRouteLoading] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const navigate = useNavigate();
  const startInputRef = useRef();
  const endInputRef = useRef();

  // Route calculation
  useEffect(() => {
    const getRoute = async () => {
      setError("");
      setRouteCoords([]);
      setDistance(null);
      setDuration(null);
      if (pickupCoords && endCoords) {
        setRouteLoading(true);
        try {
          const data = await fetchRoute(pickupCoords, endCoords);
          setRouteCoords(data.coords);
          setDistance(data.distance);
          setDuration(data.duration);
        } catch (e) {
          setError("Failed to get route/path. Try different locations.");
        }
        setRouteLoading(false);
      }
    };
    getRoute();
  }, [pickupCoords, endCoords]);

  // Defensive: Ensure nearbyDrivers is always an array
  useEffect(() => {
    if (pickupCoords) {
      fetch(`http://localhost:3002/api/driver/nearby?lat=${pickupCoords.lat}&lng=${pickupCoords.lng}&radius=0.05`)
        .then(res => res.json())
        .then(data => setNearbyDrivers(Array.isArray(data) ? data : []))
        .catch(() => setNearbyDrivers([]));
    } else {
      setNearbyDrivers([]);
    }
  }, [pickupCoords]);

  const handleStartInput = async (e) => {
    const value = e.target.value;
    setStartLocation(value);
    if (value.length > 2) {
      setShowSuggestions(s => ({ ...s, start: true }));
      const suggestions = await fetchSuggestions(value);
      setStartSuggestions(suggestions);
    } else {
      setStartSuggestions([]);
      setShowSuggestions(s => ({ ...s, start: false }));
    }
  };

  const handleEndInput = async (e) => {
    const value = e.target.value;
    setEndLocation(value);
    if (value.length > 2) {
      setShowSuggestions(s => ({ ...s, end: true }));
      const suggestions = await fetchSuggestions(value);
      setEndSuggestions(suggestions);
    } else {
      setEndSuggestions([]);
      setShowSuggestions(s => ({ ...s, end: false }));
    }
  };

  const selectStartSuggestion = (s) => {
    setStartLocation(s.display_name);
    setPickupCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setStartSuggestions([]);
    setShowSuggestions(s => ({ ...s, start: false }));
    endInputRef.current?.focus();
  };
  const selectEndSuggestion = (s) => {
    setEndLocation(s.display_name);
    setEndCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setEndSuggestions([]);
    setShowSuggestions(s => ({ ...s, end: false }));
  };

  const handleUseCurrent = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStartLocation("Current Location");
        setStartSuggestions([]);
        setShowSuggestions(s => ({ ...s, start: false }));
      },
      () => setError("Failed to get location")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to request a ride.");
        setSubmitting(false);
        return;
      }
      const body = {
        start_location: startLocation,
        end_location: endLocation,
        start_latitude: pickupCoords?.lat,
        start_longitude: pickupCoords?.lng,
        end_latitude: endCoords?.lat,
        end_longitude: endCoords?.lng,
      };
      const res = await fetch("http://localhost:3002/request-ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Ride requested! Your request ID: " + data.request_id);
        navigate(`/ride/${data.ride_id}/rider-sim`);
      } else {
        setError(data.message || "Failed to request ride");
      }
    } catch (err) {
      setError("Network or server error");
    }
    setSubmitting(false);
  };

  const onMarkerDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setPickupCoords({ lat: position.lat, lng: position.lng });
  };

  const blurSuggestions = (type) => {
    setTimeout(() => setShowSuggestions(s => ({ ...s, [type]: false })), 150);
  };

  function FlyToRoute({ routeCoords }) {
    const map = useMap();
    useEffect(() => {
      if (routeCoords && routeCoords.length > 1) {
        map.fitBounds(routeCoords, { padding: [25, 25] });
      }
    }, [routeCoords, map]);
    return null;
  }

  const formatDuration = (sec) => {
    if (!sec) return "";
    const min = Math.floor(sec / 60);
    const remSec = Math.round(sec % 60);
    if (min < 60) return `${min} min${min !== 1 ? "s" : ""} ${remSec}s`;
    const hr = Math.floor(min / 60);
    const min2 = min % 60;
    return `${hr}h ${min2}min`;
  };

  return (
    <div style={{
      maxWidth: 420,
      margin: "90px auto",
      padding: 24,
      background: "#fff",
      borderRadius: 10,
      boxShadow: "0 2px 8px #eee",
      minHeight: 450,
      position: "relative"
    }}>
      <h2 style={{ textAlign: "center" }}>Request a Ride</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ margin: "18px 0", position: "relative" }}>
          <label>
            <b>Start Location:</b>
            <input
              type="text"
              ref={startInputRef}
              value={startLocation}
              onChange={handleStartInput}
              onFocus={() => { if (startLocation.length > 2) setShowSuggestions(s => ({ ...s, start: true })) }}
              onBlur={() => blurSuggestions("start")}
              placeholder="Enter start address or click button"
              style={inputStyle}
              required
              autoComplete="off"
            />
          </label>
          <button type="button" style={miniBtnStyle} onClick={handleUseCurrent}>
            Use Current Location
          </button>
          {showSuggestions.start && startSuggestions.length > 0 && (
            <div style={suggestionBoxStyle}>
              {startSuggestions.map(s => (
                <div
                  key={s.place_id}
                  style={suggestionItemStyle}
                  onMouseDown={() => selectStartSuggestion(s)}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ margin: "18px 0", position: "relative" }}>
          <label>
            <b>End Location:</b>
            <input
              type="text"
              ref={endInputRef}
              value={endLocation}
              onChange={handleEndInput}
              onFocus={() => { if (endLocation.length > 2) setShowSuggestions(s => ({ ...s, end: true })) }}
              onBlur={() => blurSuggestions("end")}
              placeholder="Enter destination address"
              style={inputStyle}
              required
              autoComplete="off"
            />
          </label>
          {showSuggestions.end && endSuggestions.length > 0 && (
            <div style={suggestionBoxStyle}>
              {endSuggestions.map(s => (
                <div
                  key={s.place_id}
                  style={suggestionItemStyle}
                  onMouseDown={() => selectEndSuggestion(s)}
                >
                  {s.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        {pickupCoords && (
          <div style={{ margin: "20px 0" }}>
            <MapContainer
              center={pickupCoords}
              zoom={13}
              style={{ height: "260px", width: "100%", borderRadius: 8 }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <Marker
                position={[pickupCoords.lat, pickupCoords.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: onMarkerDragEnd
                }}
                icon={startIcon}
              >
                <Popup>Pickup location (drag to adjust)</Popup>
              </Marker>
              {endCoords && (
                <Marker position={[endCoords.lat, endCoords.lng]} icon={endIcon}>
                  <Popup>Dropoff location</Popup>
                </Marker>
              )}
              {routeCoords.length > 1 && (
                <>
                  <Polyline
                    positions={routeCoords}
                    pathOptions={{ color: "#1976d2", weight: 6, opacity: 0.7 }}
                  />
                  <FlyToRoute routeCoords={routeCoords} />
                </>
              )}
              {Array.isArray(nearbyDrivers) && nearbyDrivers.map(driver =>
                driver.current_latitude && driver.current_longitude ? (
                  <Marker
                    key={driver.driver_id}
                    position={[driver.current_latitude, driver.current_longitude]}
                    icon={driverIcon}
                  >
                    <Popup>Driver #{driver.driver_id}</Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
            {routeLoading && (
              <div style={{ textAlign: "center", margin: 8 }}>Calculating route...</div>
            )}
            {!routeLoading && distance && duration && (
              <div style={{
                marginTop: 12,
                textAlign: "center",
                background: "#f5f5f5",
                borderRadius: 8,
                padding: "10px 6px",
                fontSize: 16
              }}>
                <b>Estimated distance:</b> {(distance / 1000).toFixed(2)} km
                <br />
                <b>Estimated time:</b> {formatDuration(duration)}
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: "red", textAlign: "center", marginBottom: 10 }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting || !pickupCoords || !endCoords}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            background: "#1976d2",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
            border: "none",
            cursor: (submitting || !pickupCoords || !endCoords) ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px #dde3f0",
            marginTop: 18
          }}
        >
          {submitting ? "Requesting..." : "Confirm Request"}
        </button>
      </form>
    </div>
  );
};

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  marginBottom: 5,
  padding: 10,
  borderRadius: 7,
  border: "1px solid #bbb",
  fontSize: 15
};
const miniBtnStyle = {
  marginLeft: 10,
  padding: "7px 16px",
  border: "none",
  borderRadius: 6,
  background: "#e3e9f5",
  color: "#1976d2",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  marginTop: 8
};
const suggestionBoxStyle = {
  position: "absolute",
  top: 45,
  left: 0,
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 4,
  zIndex: 9999,
  width: "100%",
  maxHeight: 160,
  overflowY: "auto",
  boxShadow: "0 2px 8px #eee"
};
const suggestionItemStyle = {
  padding: "9px 14px",
  cursor: "pointer",
  fontSize: 15,
  borderBottom: "1px solid #f4f4f4"
};

export default RequestRidePage;
