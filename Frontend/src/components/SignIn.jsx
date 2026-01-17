import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignIn({ setToken }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "✅ Login successful!", type: "success" });

        // Save token and userId both
        if (data.token && data.userId) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.userId);
          setToken(data.token, data.userId); // Pass both to App
        }

        // Redirect to home after a short delay
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 1000);
      } else {
        setMessage({
          text: data.message || "❌ Invalid credentials",
          type: "error",
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      setMessage({ text: "⚠ Server error", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  return (
    <div style={styles.container} className="w-screen">
      <div style={styles.card}>
        <div style={styles.brandContainer}>
          
          <h1 style={styles.brand}>
            <span style={{color: "#ff2f50"}}>🛒Quick</span>
            <span style={{color:"#38bdf8"}}>Commerce</span>
          </h1>
        </div>
        <p style={styles.subtitle}>Welcome back! Sign in to continue</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Sign In 🔑</h2>

          {message.text && (
            <div
              style={{
                ...styles.message,
                backgroundColor: message.type === "success" ? "#4ade80" : "#f87171",
              }}
            >
              {message.text}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            className="text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            className="text-black"
            required
          />
          <button type="submit" style={styles.button}>
            Sign In
          </button>
          <p style={styles.linkText}>
            Don’t have an account?{" "}
            <Link to="/signup" style={styles.link}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "rgb(170, 203, 237)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  card: {
    backgroundColor: "#1e293b",
    //backdropFilter: "blur(12px)",
    padding: "40px 35px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
    width: "350px",
    textAlign: "center",
  },
  brandContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  brand: {
    fontSize: "1.8rem",
    fontWeight: "700",
    letterSpacing: "1px",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: "14px",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  message: {
    padding: "10px",
    borderRadius: "6px",
    color: "white",
    marginBottom: "15px",
    fontWeight: "bold",
  },
  input: {
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #475569",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#f8fafc",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    background: "linear-gradient(90deg, #38bdf8, #3b82f6)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    letterSpacing: "0.5px",
    transition: "transform 0.2s ease, background 0.3s",
  },
  linkText: {
    marginTop: "15px",
    color: "#cbd5e1",
    fontSize: "14px",
  },
  link: {
    color: "#38bdf8",
    textDecoration: "none",
    fontWeight: "500",
  },
};