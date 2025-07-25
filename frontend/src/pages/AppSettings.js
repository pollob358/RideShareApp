import React, { useState } from 'react';

const AppSettings = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    document.body.style.background = newTheme === "dark" ? "#23272F" : "#fff";
    localStorage.setItem("theme", newTheme);
  };
  return (
    <div style={{
      maxWidth: 400,
      margin: "90px auto",
      padding: 32,
      borderRadius: 16,
      boxShadow: "0 2px 10px #dde3f0",
      background: "#fff"
    }}>
      <h2 style={{ marginBottom: 18 }}>Settings</h2>
      <div>
        <b>Theme:</b>
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <button
            onClick={() => handleThemeChange("light")}
            style={{
              padding: "10px 20px",
              background: theme === "light" ? "#1976d2" : "#eee",
              color: theme === "light" ? "#fff" : "#444",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Light
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            style={{
              padding: "10px 20px",
              background: theme === "dark" ? "#1976d2" : "#eee",
              color: theme === "dark" ? "#fff" : "#444",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
};
export default AppSettings;
