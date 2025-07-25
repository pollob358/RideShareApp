import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const RatingPage = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");  // <-- NEW
  const [submitted, setSubmitted] = useState(false);

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      await fetch(`http://localhost:3002/api/ride/${rideId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ride_id: rideId, rating, comment }) // <-- SEND COMMENT TOO
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate("/rider/home");
      }, 1200);
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Rate Your Ride</h2>
      <p>Please rate your experience for Ride ID: {rideId}</p>
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((val) => (
          <span
            key={val}
            style={val <= rating ? styles.starSelected : styles.star}
            onClick={() => handleRatingChange(val)}
          >
            ★
          </span>
        ))}
      </div>
      <textarea
        style={styles.textarea}
        placeholder="Leave a comment (optional)"
        value={comment}
        onChange={handleCommentChange}
        rows={4}
      />
      <button
        onClick={handleSubmit}
        style={styles.button}
        disabled={rating === 0}
      >
        Submit Rating
      </button>
      {submitted && (
        <p style={styles.success}>
          Thanks for rating! Redirecting to Rider Home...
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    padding: 24,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center"
  },
  stars: {
    margin: "20px 0",
    fontSize: 32,
    cursor: "pointer"
  },
  star: {
    color: "#ccc",
    margin: "0 5px"
  },
  starSelected: {
    color: "#ff9800",
    margin: "0 5px"
  },
  textarea: {
    width: "100%",
    borderRadius: 6,
    border: "1px solid #ccc",
    padding: 10,
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    resize: "vertical"
  },
  button: {
    padding: "10px 24px",
    fontSize: 16,
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  success: {
    marginTop: 20,
    color: "green",
    fontWeight: "bold"
  }
};

export default RatingPage;
