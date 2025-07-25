import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const carIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="17" fill="#1976d2" stroke="#fff" stroke-width="3"/>
    <text x="18" y="24" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold">&#128663;</text>
    </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});
const pickupIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="17" fill="#43a047" stroke="#fff" stroke-width="3"/>
    <text x="18" y="24" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial">&#x1F6A9;</text>
    </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});
const dropoffIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="17" fill="#d32f2f" stroke="#fff" stroke-width="3"/>
    <text x="18" y="24" font-size="18" text-anchor="middle" fill="#fff" font-family="Arial">&#x1F6A9;</text>
    </svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

// ✅ CORRECT! Use your backend:
const fetchRoute = async (start, end) => {
  if (!start || !end) return [];
  const res = await fetch("http://localhost:3002/api/directions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  // Defensive: check if features exist
  if (!data.features || !data.features[0]) return [];
  return data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
};


const DriverSimulationPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [routeToPickup, setRouteToPickup] = useState([]);
  const [routeToDropoff, setRouteToDropoff] = useState([]);
  const [simStatus, setSimStatus] = useState("pending");
  const [animating, setAnimating] = useState(false);
  const animationId = useRef(null);

  // Only fetch ride ONCE, and never overwrite once started
  const hasStartedMoving = useRef(false);

  useEffect(() => {
    fetch(`http://localhost:3002/ride-status/${rideId}`)
      .then(res => res.json())
      .then(data => {
        setRide(data);
        if (data.driver && !hasStartedMoving.current) {
          setDriverPos({ lat: data.driver.lat, lng: data.driver.lng });
          setSimStatus("to_pickup");
        }
      });
  }, [rideId]);

  // When ready, fetch route to pickup
  useEffect(() => {
    if (!ride || !driverPos || !ride.start || simStatus !== "to_pickup") return;
    fetchRoute(driverPos, ride.start).then(path => {
      setRouteToPickup(path);
    });
  }, [ride, driverPos, simStatus]);

  // Animate to pickup
  useEffect(() => {
    if (simStatus !== "to_pickup" || routeToPickup.length < 2 || animating) return;
    setAnimating(true);
    hasStartedMoving.current = true;
    let i = 0;
    setDriverPos({ lat: routeToPickup[0][0], lng: routeToPickup[0][1] });
    animationId.current = setInterval(() => {
      i++;
      if (i < routeToPickup.length) {
        setDriverPos({ lat: routeToPickup[i][0], lng: routeToPickup[i][1] });
      } else {
        clearInterval(animationId.current);
        fetch("http://localhost:3002/ride-status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ride_id: rideId, status: "picked_up" }),
        });
        setTimeout(() => {
          setSimStatus("picked_up");
          setAnimating(false);
        }, 700);
      }
    }, 45);
    return () => clearInterval(animationId.current);
  }, [simStatus, routeToPickup, animating, rideId]);

  // After pickup, fetch route to dropoff
  useEffect(() => {
    if (simStatus !== "picked_up" || !ride || !ride.start || !ride.end) return;
    setTimeout(async () => {
      const path = await fetchRoute(ride.start, ride.end);
      setRouteToDropoff(path);
      setSimStatus("to_dropoff");
    }, 600);
  }, [simStatus, ride]);

  // Animate to dropoff
  useEffect(() => {
    if (simStatus !== "to_dropoff" || routeToDropoff.length < 2 || animating) return;
    setAnimating(true);
    let i = 0;
    setDriverPos({ lat: routeToDropoff[0][0], lng: routeToDropoff[0][1] });
    animationId.current = setInterval(() => {
      i++;
      if (i < routeToDropoff.length) {
        setDriverPos({ lat: routeToDropoff[i][0], lng: routeToDropoff[i][1] });
      } else {
        clearInterval(animationId.current);
        fetch("http://localhost:3002/ride-status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ride_id: rideId, status: "completed" }),
        });
        setTimeout(() => {
          setSimStatus("completed");
          setAnimating(false);
        }, 400);
      }
    }, 45);
    return () => clearInterval(animationId.current);
  }, [simStatus, routeToDropoff, animating, rideId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationId.current) clearInterval(animationId.current);
    };
  }, []);

  if (!ride || !driverPos) return <div>Loading simulation...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "36px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #dde3f0" }}>
      <h2 style={{ textAlign: "center" }}>Driver Journey Simulation</h2>
      <div style={{ margin: "22px 0" }}>
        <b>Status:</b>{" "}
        {simStatus === "pending" && "Loading..."}
        {simStatus === "to_pickup" && "Driving to pickup..."}
        {simStatus === "picked_up" && "Waiting at pickup point..."}
        {simStatus === "to_dropoff" && "Driving to dropoff..."}
        {simStatus === "completed" && "Ride complete!"}
      </div>
      <div style={{ height: 420, borderRadius: 10, overflow: "hidden" }}>
        <MapContainer
          center={driverPos}
          zoom={14}
          style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.start.lat, ride.start.lng]} icon={pickupIcon}>
            <Popup>Pickup</Popup>
          </Marker>
          <Marker position={[ride.end.lat, ride.end.lng]} icon={dropoffIcon}>
            <Popup>Dropoff</Popup>
          </Marker>
          <Marker key={driverPos ? `${driverPos.lat},${driverPos.lng}` : "driver"}
                  position={[driverPos.lat, driverPos.lng]} icon={carIcon}>
            <Popup>Driver</Popup>
          </Marker>
          {routeToPickup.length > 1 && simStatus === "to_pickup" && (
            <Polyline positions={routeToPickup} color="#1976d2" />
          )}
          {routeToDropoff.length > 1 && simStatus === "to_dropoff" && (
            <Polyline positions={routeToDropoff} color="#d32f2f" />
          )}
        </MapContainer>
      </div>
      <div style={{ marginTop: 18, textAlign: "center" }}>
        {simStatus === "completed" && (
          <button style={buttonStyle} onClick={() => navigate("/driver/home")}>
            Back to Home
          </button>
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: "12px 32px",
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 17,
  fontWeight: 600,
  cursor: "pointer"
};

export default DriverSimulationPage;
