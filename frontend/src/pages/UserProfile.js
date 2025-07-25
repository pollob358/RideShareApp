
import React, { useEffect, useState } from "react";
import axios from "axios";

const cardStyle = {
  background: "#fff",
  padding: "32px 28px",
  borderRadius: 16,
  minWidth: 320,
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.14)",
  maxWidth: 480,
  margin: "60px auto",
  fontSize: 17,
  lineHeight: "1.7",
};

const avatarStyle = {
  width: 82,
  height: 82,
  background: "#1976d2",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 18px auto",
};

const buttonStyle = {
  background: "#e3f2fd",
  border: "none",
  borderRadius: 7,
  padding: "8px 18px",
  fontWeight: 600,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 7,
  marginBottom: 7,
  transition: "background 0.2s",
};

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [expandedVehicle, setExpandedVehicle] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setProfileError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setProfileError("No token found. Please login again.");
          setLoading(false);
          return;
        }
        const res = await axios.get(`http://localhost:3002/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        setProfile(res.data);
      } catch (e) {
        setProfileError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div style={cardStyle}>
      <div style={avatarStyle}>
        <svg width="44" height="44" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="22" fill="#1976d2" />
          <circle cx="22" cy="17" r="8" fill="#fff" />
          <ellipse cx="22" cy="34" rx="12" ry="7" fill="#fff" />
        </svg>
      </div>
      <h2 style={{ textAlign: "center", color: "#1976d2", marginBottom: 18 }}>Your Profile</h2>
      {loading && <div>Loading...</div>}
      {profileError && <div style={{ color: "red" }}>{profileError}</div>}
      {profile && (
        <>
          <div><b>Name:</b> {profile.name}</div>
          <div><b>Email:</b> {profile.email}</div>
          <div><b>Phone:</b> {profile.phone_number}</div>
          {profile.created_at && (
            <div>
              <b>Account Created:</b> {(new Date(profile.created_at)).toLocaleDateString()}
            </div>
          )}
          <div><b>Role:</b> {profile.role}</div>
          {profile.role === "Driver" && (
            <div style={{ marginTop: 12, background: "#f3e1ea", padding: 10, borderRadius: 8 }}>
              <div><b>License:</b> {profile.license}</div>
              {profile.rating && (
                <div><b>Rating:</b> {profile.rating}</div>
              )}
              {profile.is_active !== undefined && (
                <div><b>Status:</b> {profile.is_active ? "Active" : "Inactive"}</div>
              )}
              {profile.vehicles && profile.vehicles.length > 0 && (
                <div>
                  <b>Vehicles:</b>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {profile.vehicles.map((v, idx) => (
                      <li key={v.vehicle_id || idx} style={{ marginBottom: 5 }}>
                        <button
                          style={{
                            ...buttonStyle,
                            background: expandedVehicle === idx ? "#bbdefb" : "#e3f2fd"
                          }}
                          onClick={() => setExpandedVehicle(expandedVehicle === idx ? null : idx)}
                        >
                          {v.license_plate || "Unknown Plate"}{" "}
                          {expandedVehicle === idx ? "▲" : "▼"}
                        </button>
                        {expandedVehicle === idx && (
                          <div style={{
                            marginTop: 5,
                            background: "#e3f0fc",
                            padding: 10,
                            borderRadius: 8
                          }}>
                            <div><b>Manufacturer:</b> {v.manufacturer}</div>
                            <div><b>Model:</b> {v.model}</div>
                            <div><b>Year:</b> {v.year}</div>
                            <div><b>Color:</b> {v.color}</div>
                            <div><b>Seats:</b> {v.seats}</div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;
