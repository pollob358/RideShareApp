import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const roles = [
  { label: "Rider", color: "#1976d2", bg: "#e3f2fd" },
  { label: "Driver", color: "#a52745", bg: "#ffe0e3" },
];

const Login = () => {
  const [role, setRole] = useState('Rider');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3002/login', {
        role,
        id,
        password,
      });

      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);

        
        const payload = JSON.parse(atob(res.data.token.split('.')[1]));
        localStorage.setItem('rid', payload.rid);
        localStorage.setItem('role', payload.role);

        setMessage(res.data.message);

        setTimeout(() => {
          if (role === 'Rider') {
            navigate('/rider/home');
          } else if (role === 'Driver') {
            navigate('/driver/home');
          }
        }, 700);
      } else {
        setErrorMsg('No token received!');
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      overflow: "hidden",
      fontFamily: "inherit"
    }}>
      <div
        onClick={() => setRole("Rider")}
        style={{
          width: "50%",
          background: roles[0].bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s",
          cursor: "pointer",
          flexDirection: "column",
          zIndex: role === "Rider" ? 2 : 1
        }}
      >
        <div style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: 2,
          color: role === "Rider" ? roles[0].color : "#777",
          transition: "color 0.2s"
        }}>
          Rider Login
        </div>
        <div style={{
          marginTop: 18,
          fontSize: 20,
          color: "#444",
          opacity: role === "Rider" ? 1 : 0.6,
          fontWeight: 500
        }}>
          {role === "Rider" ? "Click again to continue" : "Click to login as Rider"}
        </div>
      </div>

      <div
        onClick={() => setRole("Driver")}
        style={{
          width: "50%",
          background: roles[1].bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.3s",
          cursor: "pointer",
          flexDirection: "column",
          zIndex: role === "Driver" ? 2 : 1
        }}
      >
        <div style={{
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: 2,
          color: role === "Driver" ? roles[1].color : "#777",
          transition: "color 0.2s"
        }}>
          Driver Login
        </div>
        <div style={{
          marginTop: 18,
          fontSize: 20,
          color: "#444",
          opacity: role === "Driver" ? 1 : 0.6,
          fontWeight: 500
        }}>
          {role === "Driver" ? "Click again to continue" : "Click to login as Driver"}
        </div>
      </div>

      
      <div style={{
        position: "fixed",
        top: 0,
        left: role === "Rider" ? 0 : "50vw",
        width: "50vw",
        height: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 40px 0 rgba(31, 38, 135, 0.09)",
        borderRadius: "0px",
        zIndex: 10,
        transition: "left 0.5s cubic-bezier(.55,.06,.68,.19)"
      }}>
        <div style={{
          marginBottom: 12,
          fontWeight: 700,
          color: role === "Rider" ? roles[0].color : roles[1].color,
          fontSize: 32,
          letterSpacing: 1
        }}>
          {role} Login
        </div>
        <div style={{ marginBottom: 20, color: "#666", fontSize: 17 }}>
          Welcome back! Please login to your account.
        </div>
        <input
          type="text"
          placeholder={role === 'Rider' ? "Rider ID" : "Driver ID"}
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            width: "74%",
            marginBottom: 18,
            padding: 14,
            border: "1.5px solid #dde3f0",
            borderRadius: 8,
            fontSize: 19
          }}
        />
        <input
          type="password"
          placeholder={role === 'Rider' ? "Password" : "License (for Driver)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "74%",
            marginBottom: 22,
            padding: 14,
            border: "1.5px solid #dde3f0",
            borderRadius: 8,
            fontSize: 19
          }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "74%",
            padding: "13px 0",
            background: loading
              ? (role === "Rider" ? "#64a9ee" : "#de7693")
              : (role === "Rider" ? "#1976d2" : "#a52745"),
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: 1,
            marginBottom: 14,
            boxShadow: "0 3px 12px #dde3f0",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {message && (
          <div style={{
            color: '#219653',
            marginTop: 6,
            marginBottom: 6,
            fontWeight: 500,
            fontSize: 17
          }}>{message}</div>
        )}
        {errorMsg && (
          <div style={{
            color: '#e23b41',
            marginTop: 6,
            marginBottom: 6,
            fontWeight: 500,
            fontSize: 17
          }}>{errorMsg}</div>
        )}
        <div style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 16
        }}>
          New here?{" "}
          <a href="/signup" style={{ color: role === "Rider" ? "#1976d2" : "#a52745", fontWeight: 700 }}>
            Signup
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
