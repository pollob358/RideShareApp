import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RiderHome = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rid');
    setMenuOpen(false);
    navigate('/');
  };

  const handleMenuClick = (action) => {
    setMenuOpen(false);
    if (action === 'profile') navigate('/profile');
    if (action === 'settings') navigate('/settings');
    if (action === 'logout') handleLogout();
  };

  const handleRequestRide = () => {
    navigate('/request-ride');
  };

  // NEW: Handle rating button click
  const handleRateRide = () => {
    // Prompt user to confirm they want to rate a ride
    const rideId = prompt("Enter the Ride ID you want to rate:");
    if (!rideId) {
      alert("Ride ID is required to proceed.");
      return;
    }

    const confirmed = window.confirm(`Do you want to rate ride #${rideId}?`);
    if (confirmed) {
      // Navigate to rating page with rideId param
      navigate(`/ride/${rideId}/rate`);
    }
  };

  return (
    <div>
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
          Rider Home
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
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
            title="User Menu"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#1976d2" />
              <circle cx="24" cy="18" r="8" fill="#fff" />
              <ellipse cx="24" cy="34" rx="12" ry="8" fill="#fff" />
            </svg>
          </button>
          {menuOpen && (
            <div ref={menuRef} style={{
              position: "absolute",
              right: 0,
              marginTop: 12,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 16px #dde3f0",
              minWidth: 140,
              zIndex: 200,
              overflow: "hidden",
            }}>
              <div
                style={menuItemStyle}
                onClick={() => handleMenuClick('profile')}
              >Profile</div>
              <div
                style={menuItemStyle}
                onClick={() => handleMenuClick('settings')}
              >Settings</div>
              <div
                style={{ ...menuItemStyle, color: "#c62828", fontWeight: 700 }}
                onClick={() => handleMenuClick('logout')}
              >Logout</div>
            </div>
          )}
        </div>
      </div>
      <div style={{
        maxWidth: 500,
        margin: '84px auto 0 auto',
        padding: 24,
        border: '1px solid #eee',
        borderRadius: 10,
        boxShadow: '0 2px 8px #eee',
        position: "relative",
        background: "#fff"
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Welcome, Rider!</h2>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button
            style={{
              display: "inline-block",
              background: "#1976d2",
              color: "#fff",
              padding: "16px 42px",
              borderRadius: 10,
              border: "none",
              fontSize: 20,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px #dde3f0",
              marginTop: 30,
              marginRight: 15
            }}
            onClick={handleRequestRide}
          >
            Request a Ride
          </button>

          {/* New Rate Ride Button */}
          <button
            style={{
              display: "inline-block",
              background: "#43a047",
              color: "#fff",
              padding: "16px 42px",
              borderRadius: 10,
              border: "none",
              fontSize: 20,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px #dde3f0",
              marginTop: 30
            }}
            onClick={handleRateRide}
          >
            Rate a Ride
          </button>
        </div>
      </div>
    </div>
  );
};

const menuItemStyle = {
  padding: "12px 24px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
  background: "#fff",
  fontWeight: 500,
  fontSize: 16,
  transition: "background 0.15s",
};

export default RiderHome;
