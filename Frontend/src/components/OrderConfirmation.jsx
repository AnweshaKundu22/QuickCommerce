import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  const [statusUpdates, setStatusUpdates] = useState([]);
  const [currentStage, setCurrentStage] = useState(order?.status || "Pending");

  if (!order)
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        No order details found.
      </p>
    );

  const formatDate = (d) => {
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const orderDate = formatDate(order.createdAt);
  const estimatedDelivery = formatDate(
    new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000)
  );

  const statusColors = {
    Pending: "#ffc107",
    Picking: "#17a2b8",
    WarehouseToHotspot: "#fd7e14",
    HotspotToUser: "#6610f2",
    Delivered: "#28a745",
  };

  const statusStages = [
    "Pending",
    "Picking",
    "WarehouseToHotspot",
    "HotspotToUser",
    "Delivered",
  ];

  // -----------------------------
  // Live tracking effect (auto-start)
  // -----------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let interval;

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/orders/logistics/status/${order._id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) return;

        const data = await res.json();
        const updates = data.updates || [];

        setStatusUpdates(updates);

        if (updates.length > 0) {
          const lastStage = updates[updates.length - 1].stage || "Pending";
          setCurrentStage(lastStage);

          // Stop polling if delivered
          if (lastStage === "Delivered" && interval) {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching live status:", err);
      }
    };

    // Immediate fetch
    fetchStatus();

    // Poll every 2 seconds
    interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [order._id]);

  const currentColor = statusColors[currentStage] || "#6c757d";

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f8f9fa",
        minHeight: "100vh",
        padding: "40px 20px",
      }}
      className="w-screen"
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#28a745", fontSize: "2rem", marginBottom: "10px" }}>
            🎉 Order Placed Successfully!
          </h1>
          <p style={{ color: "#555" }}>Thank you for shopping with us.</p>
          <p style={{ fontWeight: "bold", marginTop: "10px", color: "#333" }}>
            Order ID: <span style={{ color: "#007bff" }}>{order._id}</span>
          </p>
          <p style={{ marginTop: "5px", color: "#555" }}>
            Order Date: <strong style={{ color: "#333" }}>{orderDate}</strong>
          </p>
          <p style={{ marginTop: "5px", color: "#555" }}>
            Status:{" "}
            <span
              style={{
                color: "#fff",
                background: currentColor,
                padding: "6px 12px",
                borderRadius: "15px",
                fontWeight: "bold",
              }}
            >
              {currentStage}
            </span>
          </p>
          <p style={{ marginTop: "5px", color: "#555" }}>
            Estimated Delivery: <strong style={{ color: "#333" }}>{estimatedDelivery}</strong>
          </p>
        </div>

        {/* Items */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", color: "#333" }}>
            Order Summary
          </h2>
          {order.items.map((item) => (
            <div
              key={item._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <img
                  src={item.product.image || "https://via.placeholder.com/60"}
                  alt={item.product.name}
                  style={{ width: "60px", height: "60px", borderRadius: "6px", objectFit: "cover" }}
                />
                <span style={{ fontWeight: "bold", color: "#333" }}>{item.product.name}</span>
              </div>
              <span style={{ fontWeight: "bold", color: "#28a745" }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right", marginBottom: "30px" }}>
          <h2>
            Total: <span style={{ color: "#28a745" }}>₹{order.totalAmount.toFixed(2)}</span>
          </h2>
        </div>

        {/* Live Tracking Section */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", color: "#333" }}>
            Live Order Tracking 🚀
          </h2>

          {/* Timeline */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
              marginTop: "40px",
            }}
          >
            {statusStages.map((stage, idx) => {
              const currentIdx = statusStages.indexOf(currentStage);
              const isCompleted = idx <= currentIdx;

              return (
                <div key={stage} style={{ flex: 1, textAlign: "center", position: "relative" }}>
                  {/* Connecting line */}
                  {idx < statusStages.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "15px",
                        left: "59%",
                        width: "82%",
                        height: "4px",
                        background: isCompleted && idx < currentIdx ? "#28a745" : "#ddd",
                        zIndex: 0,
                        transition: "background 0.4s ease",
                      }}
                    ></div>
                  )}

                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: isCompleted ? "#28a745" : "#ddd",
                      margin: "0 auto 10px auto",
                      lineHeight: "32px",
                      color: "#fff",
                      fontWeight: "bold",
                      transition: "background 0.4s ease",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: isCompleted ? "#28a745" : "#555" }}>
                    {stage}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Status Messages */}
          <div style={{ marginTop: "30px", background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
            <h4 style={{ marginBottom: "10px", color: "#333" }}>Live Updates:</h4>
            {statusUpdates.length === 0 ? (
              <p>⏳ Waiting for updates...</p>
            ) : (
              statusUpdates.map((u, i) => (
                <p key={i} style={{ color: "#555", margin: "5px 0" }}>
                  <strong>{u.stage}:</strong> {u.message || ""}{" "}
                  <small>({new Date(u.time).toLocaleTimeString()})</small>
                </p>
              ))
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/home")}
            style={{
              background: "#007bff",
              color: "#fff",
              padding: "12px 25px",
              border: "none",
              borderRadius: "6px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}