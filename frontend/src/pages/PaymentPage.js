import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [fare, setFare] = useState(null);
  const [method, setMethod] = useState('cash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch fare from ride-status endpoint
  useEffect(() => {
    const fetchFare = async () => {
      try {
        //const res = await fetch(`http://localhost:3002/ride-status/${rideId}`);
         const res = await fetch(`http://localhost:3002/payment/fare/${rideId}`, {
         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
       });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.fare == null) {
          throw new Error('Fare not available');
        }
        // parse float in case it's returned as string
        const parsedFare = parseFloat(data.fare);
        if (isNaN(parsedFare)) {
          throw new Error('Invalid fare value');
        }
        setFare(parsedFare);
      } catch (e) {
        setError('Failed to load fare: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFare();
  }, [rideId]);

  const handlePay = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const token = localStorage.getItem('token');

    // 1. Make the payment
    const res = await fetch('http://localhost:3002/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ride_id: rideId,
        amount: fare,
        method
      }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || res.statusText);
    }

    // 2. Notify the driver (new API route you will build on the backend)
    await fetch(`http://localhost:3002/notify-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ride_id: rideId }),
    });

    // 3. Redirect to rating
    navigate(`/ride/${rideId}/rate`);
  } catch (e) {
    setError('Payment failed: ' + e.message);
  }
};


  if (loading) return <div>Loading payment details…</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🚀 Complete Payment</h1>
      <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label><strong>Ride ID:</strong></label>
          <input type="text" value={rideId} readOnly style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label><strong>Amount (TK):</strong></label>
          <input
            type="text"
            value={fare !== null ? fare.toFixed(2) : ''}
            readOnly
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div>
          <label><strong>Payment Method:</strong></label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bKash">bKash</option>
            <option value="bank">Bank Transfer</option>
          </select>
        </div>
        <button
          type="submit"
          style={{ padding: '12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6 }}
        >Pay Now</button>
      </form>
    </div>
  );
}
