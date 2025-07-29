// src/pages/RiderSimulationPage.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// ICONS
const carIcon     = new L.DivIcon({ html: "🚗", iconSize: [30, 30], iconAnchor: [15, 15] });
const pickupIcon  = new L.DivIcon({ html: "📍", iconSize: [30, 30], iconAnchor: [15, 15] });
const dropoffIcon = new L.DivIcon({ html: "🏁", iconSize: [30, 30], iconAnchor: [15, 15] });

// ROUTE FETCHER
const ORS_KEY = "5b3ce3597851110001cf6248159fb5b9de2a4436a27aa58dcf630560";
async function fetchRoute(start, end) {
  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        "Authorization": ORS_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ coordinates: [[start.lng, start.lat], [end.lng, end.lat]] })
    }
  );
  if (!res.ok) throw new Error(`Route fetch failed (${res.status})`);
  const { features } = await res.json();
  return features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}

export default function RiderSimulationPage() {
  const { rideId } = useParams();
  const navigate   = useNavigate();

  const [ride,        setRide]      = useState(null);
  const [driverPos,   setDriverPos] = useState(null);
  const [status,      setStatus]    = useState("pending");
  const [toPickup,    setToPickup]  = useState([]);
  const [toDropoff,   setToDropoff] = useState([]);
  const [error,       setError]     = useState("");
  const animRef       = useRef();

  // 1) Load ride + driver position
  useEffect(() => {
    fetch(`http://localhost:3002/ride-status/${rideId}`)
      .then(r => {
        if (!r.ok) throw new Error(`Server ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!data.driver) throw new Error("Driver not assigned yet");
        setRide({ start: data.start, end: data.end });
        setDriverPos({ lat: data.driver.lat, lng: data.driver.lng });
        setStatus("accepted");
      })
      .catch(err => setError("Failed to load ride: " + err.message));
  }, [rideId]);

  // 2) Fetch route to pickup
  useEffect(() => {
    if (status !== "accepted" || !ride || !driverPos) return;
    fetchRoute(driverPos, ride.start)
      .then(path => {
        if (path.length < 2) {
          setStatus("picked_up");
        } else {
          setToPickup(path);
          setStatus("to_pickup");
        }
      })
      .catch(() => setStatus("picked_up"));
  }, [status, driverPos, ride]);

  // 3) Animate to pickup
  useEffect(() => {
    if (status !== "to_pickup" || toPickup.length < 2) return;
    let i = 0;
    animRef.current = setInterval(() => {
      if (i < toPickup.length) {
        setDriverPos({ lat: toPickup[i][0], lng: toPickup[i][1] });
        i++;
      } else {
        clearInterval(animRef.current);
        setStatus("picked_up");
      }
    }, 60);
    return () => clearInterval(animRef.current);
  }, [status, toPickup]);

  // 4) Fetch route to dropoff
  useEffect(() => {
    if (status !== "picked_up" || !ride) return;
    fetchRoute(ride.start, ride.end)
      .then(path => {
        setToDropoff(path);
        setStatus("to_dropoff");
      })
      .catch(err => setError("Dropoff fetch failed: " + err.message));
  }, [status, ride]);

  // 5) Animate to dropoff, then redirect to payment
  useEffect(() => {
    if (status !== "to_dropoff" || toDropoff.length < 2) return;
    let i = 0;
    animRef.current = setInterval(() => {
      if (i < toDropoff.length) {
        setDriverPos({ lat: toDropoff[i][0], lng: toDropoff[i][1] });
        i++;
      } else {
        clearInterval(animRef.current);
        setStatus("completed");
        // redirect to payment page instead of rating
        setTimeout(() => navigate(`/ride/${rideId}/payment`), 1000);
      }
    }, 60);
    return () => clearInterval(animRef.current);
  }, [status, toDropoff, navigate, rideId]);

  if (error)      return <div style={{ color: "red", padding: 20 }}>{error}</div>;
  if (!ride)      return <div>Loading ride…</div>;
  if (!driverPos) return <div>Setting up simulation…</div>;

  const center     = [driverPos.lat, driverPos.lng];
  const statusText = {
    to_pickup:   "🚗 Heading to pickup…",
    picked_up:   "✅ Arrived at pickup!",
    to_dropoff:  "🚗 En route to drop‑off…",
    completed:   "🏁 Ride complete!"
  }[status] || "Waiting…";

  return (
    <div style={{
      maxWidth: 700, margin: "40px auto", padding: 24,
      background: "#fff", borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ textAlign: "center" }}>Rider Simulation</h2>
      <p style={{ textAlign: "center", color: "#1976d2", fontSize: 18 }}>{statusText}</p>
      <div style={{ height: 400, borderRadius: 10, overflow: "hidden", marginTop: 16 }}>
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.start.lat, ride.start.lng]} icon={pickupIcon}>
            <Popup>Pickup Point</Popup>
          </Marker>
          <Marker position={[ride.end.lat, ride.end.lng]} icon={dropoffIcon}>
            <Popup>Dropoff Point</Popup>
          </Marker>
          <Marker position={center} icon={carIcon}>
            <Popup>Driver</Popup>
          </Marker>
          {status === "to_pickup" && <Polyline positions={toPickup} color="#1976d2" />}
          {status === "to_dropoff" && <Polyline positions={toDropoff} color="#d32f2f" />}
        </MapContainer>
      </div>
    </div>
  );
}
