// src/pages/Signup.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const roles = [
  { label: "Rider", color: "#1976d2", bg: "#e3f2fd" },
  { label: "Driver", color: "#a52745", bg: "#ffe0e3" },
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  license: '',
  vehicle: {
    plate: '',
    make: '',
    model: '',
    year: '',
    color: '',
    seats: ''
  }
};

const Signup = () => {
  const [role, setRole] = useState('Rider');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRoleChange = (selected) => {
    setRole(selected);
    if (selected === "Rider") {
      setForm(prev => ({
        ...prev,
        license: '',
        vehicle: {
          plate: '',
          make: '',
          model: '',
          year: '',
          color: '',
          seats: ''
        }
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle.')) {
      const key = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [key]: value
        }
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = { ...form, wantsToBeDriver: role === "Driver" };
      const res = await axios.post('http://localhost:3002/signup', payload);
      alert(res.data.message);
      navigate('/login');
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        err.message ||
        'Signup failed'
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
        onClick={() => handleRoleChange("Rider")}
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
          Rider Signup
        </div>
        <div style={{
          marginTop: 18,
          fontSize: 20,
          color: "#444",
          opacity: role === "Rider" ? 1 : 0.6,
          fontWeight: 500
        }}>
          {role === "Rider" ? "Click again to continue" : "Click to signup as Rider"}
        </div>
      </div>

      <div
        onClick={() => handleRoleChange("Driver")}
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
          Driver Signup
        </div>
        <div style={{
          marginTop: 18,
          fontSize: 20,
          color: "#444",
          opacity: role === "Driver" ? 1 : 0.6,
          fontWeight: 500
        }}>
          {role === "Driver" ? "Click again to continue" : "Click to signup as Driver"}
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
        justifyContent: "flex-start",
        boxShadow: "0 8px 40px 0 rgba(31, 38, 135, 0.09)",
        borderRadius: "0px",
        zIndex: 10,
        transition: "left 0.5s cubic-bezier(.55,.06,.68,.19)",
        overflow: "hidden"
      }}>
        <div style={{
          marginTop: 40,
          marginBottom: 12,
          fontWeight: 700,
          color: role === "Rider" ? roles[0].color : roles[1].color,
          fontSize: 32,
          letterSpacing: 1
        }}>
          {role} Signup
        </div>
        <div
          style={{
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto"
          }}
        >
          <form onSubmit={handleSubmit} style={{
            width: "74%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingBottom: 34
          }}>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 14,
                fontSize: 17,
                borderRadius: 8,
                border: "1.5px solid #dde3f0"
              }}
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 14,
                fontSize: 17,
                borderRadius: 8,
                border: "1.5px solid #dde3f0"
              }}
            />
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 14,
                fontSize: 17,
                borderRadius: 8,
                border: "1.5px solid #dde3f0"
              }}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 14,
                fontSize: 17,
                borderRadius: 8,
                border: "1.5px solid #dde3f0"
              }}
            />

            
            {role === "Driver" && (
              <>
                <input
                  name="license"
                  placeholder="License Number"
                  value={form.license}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.plate"
                  placeholder="License Plate"
                  value={form.vehicle.plate}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.make"
                  placeholder="Manufacturer"
                  value={form.vehicle.make}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.model"
                  placeholder="Model"
                  value={form.vehicle.model}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.year"
                  placeholder="Year"
                  value={form.vehicle.year}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.color"
                  placeholder="Color"
                  value={form.vehicle.color}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
                <input
                  name="vehicle.seats"
                  placeholder="Seats"
                  value={form.vehicle.seats}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 17,
                    borderRadius: 8,
                    border: "1.5px solid #dde3f0"
                  }}
                />
              </>
            )}

            {errorMsg && (
              <div style={{ color: "#e23b41", fontWeight: 500, fontSize: 16 }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
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
                boxShadow: "0 3px 12px #dde3f0",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              {loading ? "Signing up..." : "Signup"}
            </button>
          </form>
        </div>
        
        <div style={{
          textAlign: "center",
          margin: "18px 0 32px 0",
          fontSize: 16
        }}>
          Already have an account?{' '}
          <a href="/login" style={{
            color: role === "Rider" ? "#1976d2" : "#a52745",
            fontWeight: 700,
            textDecoration: "underline"
          }}>
            Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
