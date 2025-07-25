import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "#fff",
        padding: "40px 32px",
        borderRadius: 18,
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
        minWidth: 320,
        textAlign: "center"
      }}>
        <h1 style={{
          marginBottom: 10,
          color: "#1976d2",
          letterSpacing: 2,
          fontWeight: 700
        }}>
          🚗 Welcome to RideShare
        </h1>
        <p style={{
          color: "#666",
          marginBottom: 32
        }}>
          Fast, safe, and reliable rides for everyone.
        </p>
        <div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: "12px 32px",
              fontSize: 18,
              margin: "0 8px",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 0.2s",
              boxShadow: "0 2px 8px #c5cae9",
            }}
            onMouseOver={e => e.target.style.background = "#125ea8"}
            onMouseOut={e => e.target.style.background = "#1976d2"}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: "12px 32px",
              fontSize: 18,
              margin: "0 8px",
              background: "#fff",
              color: "#1976d2",
              border: "2px solid #1976d2",
              borderRadius: 8,
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              boxShadow: "0 2px 8px #e1bee7",
            }}
            onMouseOver={e => {
              e.target.style.background = "#f1faff";
              e.target.style.color = "#125ea8";
            }}
            onMouseOut={e => {
              e.target.style.background = "#fff";
              e.target.style.color = "#1976d2";
            }}
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
