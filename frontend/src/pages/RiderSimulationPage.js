import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// --- ICONS ---
const carIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#1976d2" stroke="#fff" stroke-width="3"/><text x="18" y="24" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="bold">&#128663;</text></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});
const pickupIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#43a047" stroke="#fff" stroke-width="3"/><text x="18" y="24" font-size="16" text-anchor="middle" fill="#fff" font-family="Arial">&#x1F6A9;</text></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});
const dropoffIcon = new L.DivIcon({
  className: "",
  html: `<svg width="34" height="34" viewBox="0 0 36 36"><circle cx="18" cy="18" r="17" fill="#d32f2f" stroke="#fff" stroke-width="3"/><text x="18" y="24" font-size="18" text-anchor="middle" fill="#fff" font-family="Arial">&#x1F6A9;</text></svg>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const ORS_API_KEY = "5b3ce3597851110001cf6248159fb5b9de2a4436a27aa58dcf630560";

const fetchRoute = async (start, end) => {
  if (!start || !end || !("lat" in start) || !("lng" in start) || !("lat" in end) || !("lng" in end)) {
    return [];
  }
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
  if (!res.ok) return [];
  const data = await res.json();
  return data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
};

const RiderSimulationPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const [ride, setRide] = useState(null);
  const [simStatus, setSimStatus] = useState("pending");
  const [driverPos, setDriverPos] = useState(null);
  const [routeToPickup, setRouteToPickup] = useState([]);
  const [routeToDropoff, setRouteToDropoff] = useState([]);
  const [error, setError] = useState("");
  const [animationId, setAnimationId] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3002/ride-status/${rideId}`)
      .then(res => res.json())
      .then(data => {
        let startObj = data.start;
        let endObj = data.end;
        if ((!startObj || typeof startObj !== "object") && data.start_latitude !== undefined && data.start_longitude !== undefined) {
          startObj = { lat: Number(data.start_latitude), lng: Number(data.start_longitude) };
        }
        if ((!endObj || typeof endObj !== "object") && data.end_latitude !== undefined && data.end_longitude !== undefined) {
          endObj = { lat: Number(data.end_latitude), lng: Number(data.end_longitude) };
        }
        if (!startObj || isNaN(startObj.lat) || isNaN(startObj.lng) || !endObj || isNaN(endObj.lat) || isNaN(endObj.lng)) {
          setError("Invalid or missing ride location data from server.");
        } else {
          setRide({ ...data, start: startObj, end: endObj });
          setError("");
        }
      })
      .catch(err => setError("Could not load ride info: " + err.message));
  }, [rideId]);

  useEffect(() => {
    if (!ride || simStatus !== "pending" || !ride.start || !ride.end) return;
    const assignDriverTimeout = setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:3002/api/driver/random");
        const driver = await res.json();
        if (!driver.current_latitude || !driver.current_longitude) {
          setError("Random driver from backend has no location.");
          return;
        }
        const initialDriver = {
          lat: driver.current_latitude,
          lng: driver.current_longitude,
        };
        setDriverPos(initialDriver);
        setSimStatus("accepted");
        const path = await fetchRoute(initialDriver, ride.start);
        setRouteToPickup(path);
      } catch (e) {
        setError("Failed to get a random driver: " + e.message);
      }
    }, 1800);
    return () => clearTimeout(assignDriverTimeout);
  }, [ride, simStatus]);

  useEffect(() => {
    if (simStatus !== "accepted" || routeToPickup.length < 2) return;
    if (animationId) clearInterval(animationId);
    let i = 0;
    setDriverPos({ lat: routeToPickup[0][0], lng: routeToPickup[0][1] });
    const id = setInterval(() => {
      i++;
      if (i < routeToPickup.length) {
        setDriverPos({ lat: routeToPickup[i][0], lng: routeToPickup[i][1] });
      } else {
        clearInterval(id);
        setAnimationId(null);
        setTimeout(() => setSimStatus("picked_up"), 400);
      }
    }, 60);
    setAnimationId(id);
    return () => clearInterval(id);
  }, [simStatus, routeToPickup]);

  useEffect(() => {
    if (simStatus !== "picked_up" || !ride) return;
    const startDropoffTimeout = setTimeout(async () => {
      const path = await fetchRoute(ride.start, ride.end);
      setRouteToDropoff(path);
      setSimStatus("on_the_way");
    }, 1000);
    return () => clearTimeout(startDropoffTimeout);
  }, [simStatus, ride]);

  useEffect(() => {
    if (simStatus !== "on_the_way" || routeToDropoff.length < 2) return;
    if (animationId) clearInterval(animationId);
    let i = 0;
    setDriverPos({ lat: routeToDropoff[0][0], lng: routeToDropoff[0][1] });
    const id = setInterval(() => {
      i++;
      if (i < routeToDropoff.length) {
        setDriverPos({ lat: routeToDropoff[i][0], lng: routeToDropoff[i][1] });
      } else {
        clearInterval(id);
        setAnimationId(null);
        setTimeout(() => {
          setSimStatus("completed");
          setTimeout(() => {
            // ✅ Fixed path here:
            navigate(`/ride/${rideId}/rate`);
          }, 1000);
        }, 400);
      }
    }, 60);
    setAnimationId(id);
    return () => clearInterval(id);
  }, [simStatus, routeToDropoff]);

  useEffect(() => {
    return () => {
      if (animationId) clearInterval(animationId);
    };
  }, [animationId]);

  if (error) return <div style={{ color: "red", padding: 20, fontWeight: 600 }}>{error}</div>;
  if (!ride) return <div>Loading...</div>;
  if (!ride.start || !ride.end) return <div style={{ color: "red", padding: 20 }}>Ride info not found or invalid start/end location.</div>;

  function statusText(status) {
    switch (status) {
      case "pending": return "Looking for drivers nearby...";
      case "accepted": return "A driver has been assigned and is on the way!";
      case "picked_up": return "Driver has arrived at pickup point!";
      case "on_the_way": return "On the way to your destination...";
      case "completed": return "Ride complete!";
      default: return status;
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "36px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #dde3f0" }}>
      <h2 style={{ textAlign: "center" }}>Your Ride Status</h2>
      <div style={{ margin: "22px 0", fontWeight: 500, color: "#1976d2" }}>
        {statusText(simStatus)}
      </div>
      <div style={{ height: 420, borderRadius: 10, overflow: "hidden" }}>
        <MapContainer
          center={[ride.start.lat, ride.start.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[ride.start.lat, ride.start.lng]} icon={pickupIcon}>
            <Popup>Pickup Point</Popup>
          </Marker>
          <Marker position={[ride.end.lat, ride.end.lng]} icon={dropoffIcon}>
            <Popup>Dropoff Point</Popup>
          </Marker>
          {driverPos && (
            <Marker position={[driverPos.lat, driverPos.lng]} icon={carIcon}>
              <Popup>Driver</Popup>
            </Marker>
          )}
          {simStatus === "accepted" && routeToPickup.length > 1 && (
            <Polyline positions={routeToPickup} color="#1976d2" />
          )}
          {simStatus === "on_the_way" && routeToDropoff.length > 1 && (
            <Polyline positions={routeToDropoff} color="#d32f2f" />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RiderSimulationPage;
