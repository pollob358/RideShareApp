// routes/directions.js
import express from "express";
import fetch from "node-fetch";
const router = express.Router();

router.post("/", async (req, res) => {
  const { start, end } = req.body;
  const ORS_API_KEY = process.env.ORS_API_KEY || "YOUR_API_KEY";
  const url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
  try {
    const orsRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat],
        ],
      }),
    });
    const data = await orsRes.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch directions" });
  }
});

export default router;
