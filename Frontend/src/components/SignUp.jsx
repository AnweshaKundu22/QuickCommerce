import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


export default function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "🎉 Registration successful!", type: "success" });
        
        // Save userId if backend sends it
        if (data.userId) {
          localStorage.setItem("userId", data.userId);
        }
        // Redirect after 2 sec
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setMessage({
          text: data.message || "❌ Registration failed",
          type: "error",
        });
        // Only clear message for error cases
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 3000);
      }
      
    } catch (error) {
      console.error("Error registering:", error);
      setMessage({ text: "⚠ Server error", type: "error" });
      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
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
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Create an account 🔐</h2>

          {message.text && (
            <div
              style={{
                ...styles.message,
                backgroundColor:
                  message.type === "success" ? "#4ade80" : "#f87171",
              }}
            >
              {message.text}
            </div>
          )}

          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={styles.input}
            className="text-black"
            required
          />
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
            className="text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Register
          </button>
          <p style={styles.linkText}>
            Already have an account?{" "}
            <Link to="/signin" style={styles.link}>
              Sign In
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