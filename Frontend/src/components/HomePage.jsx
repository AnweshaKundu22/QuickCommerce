import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HomePage({ cart, setCart, cartCount, setCartCount, setToken, userId }) {
  const [products, setProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // -----------------------------
  // Load user cart from backend
  // -----------------------------
  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API_BASE_URL}/api/orders/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.items && Array.isArray(data.items)) {
          const formattedCart = data.items.map((i) => ({
            _id: i.product._id,
            name: i.product.name,
            image: i.product.image,
            price: i.price,
            quantity: i.quantity,
          }));
          setCart(formattedCart);
          setCartCount(
            data.cartCount || formattedCart.reduce((sum, i) => sum + i.quantity, 0)
          );
          localStorage.setItem(`cart_${userId}`, JSON.stringify(formattedCart));
        }
      })
      .catch(err => console.error("Failed to fetch cart:", err));
  }, [token, userId, setCart, setCartCount]);

  // -----------------------------
  // Fetch all products from backend
  // -----------------------------
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  // -----------------------------
  // Fetch AI-based recommendations
  // -----------------------------
  useEffect(() => {
    if (!token || !userId) return;

    fetch(`${API_BASE_URL}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.recommendations)) {
          setRecommendedProducts(data.recommendations);
        }
      })
      .catch(err => console.error("Failed to fetch recommendations:", err));
  }, [token, userId]);

  // -----------------------------
  // Add product to cart
  // -----------------------------
  const addToCart = async (product) => {
    if (!userId) {
      alert("Please login first");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product._id, quantity: 1 }),
      });

      const data = await res.json();
      if (data && data.cart && data.cart.items) {
        const formattedCart = data.cart.items.map((i) => ({
          _id: i.product._id,
          name: i.product.name,
          image: i.product.image,
          price: i.price,
          quantity: i.quantity,
        }));
        setCart(formattedCart);
        setCartCount(
          data.cartCount || formattedCart.reduce((sum, i) => sum + i.quantity, 0)
        );
        localStorage.setItem(`cart_${userId}`, JSON.stringify(formattedCart));
      }
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem(`cart_${userId}`);
    setToken?.(null);
    setCart([]);
    setCartCount(0);
    navigate("/signin", { replace: true });
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f8f9fa", minHeight: "100vh", width: "100vw" }}>
      {/* Navbar */}
      <header style={{ background: "#343a40", color: "#fff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1000, width: "100%" }}>
        <h2 style={{ margin: 0 }}>
          <span style={{color: "#ff2f50"}}>Quick</span>
          <span style={{color:"#38bdf8"}}>Commerce</span>
        </h2>
        <div>
          <Link to="/cart" style={{ color: "#fff", marginRight: "20px", textDecoration: "none" }}>
            🛒 Cart ({cartCount})
          </Link>
          <button
            onClick={handleLogout}
            style={{ background: "#dc3545", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ----------------------------- */}
      {/* Recommended Products Section */}
      {/* ----------------------------- */}
      {recommendedProducts.length > 0 && (
        <section style={{ padding: "30px 20px", background: "#fff7e6", marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "20px", fontSize: "1.8rem", color: "#ff8800", textAlign: "center" }}>
            🌟 Recommended for You
          </h2>
          <div style={{ display: "flex", overflowX: "auto", gap: "20px", padding: "10px 0" }}>
            {recommendedProducts.map((product, idx) => (
              <div key={idx} style={{ minWidth: "220px", background: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flexShrink: 0 }}>
                <img
                  src = {product.image}
                  alt = {product.name}
                  style = {{
                    width: "100%",
                    height: "160px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    marginBottom: "10px",
                  }}
                />
                <h3 style={{ marginBottom: "10px", color: "#333" }}>{product.name}</h3>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#28a745" }}>₹{product.price}</p>
                <button onClick={() => addToCart(product)} style={{ background: "#007bff", color: "white", border: "none", padding: "8px 12px", borderRadius: "5px", cursor: "pointer" }}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------- */}
      {/* All Products Section */}
      {/* ----------------------------- */}
      <main style={{ padding: "30px 20px" }}>
        <h1 style={{ marginBottom: "30px", textAlign: "center", fontSize: "2rem", fontWeight: "bold", color: "#222" }}>🛍 Product Listing</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "25px", width: "95%", margin: "0 auto" }}>
          {products.length === 0 ? (
            <p style={{ textAlign: "center", gridColumn: "1/-1" }}>No products available</p>
          ) : (
            products.map((product) => (
              <div key={product._id} style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", minHeight: "320px", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />
                ) : (
                  <div style={{ width: "100%", height: "150px", background: "#e9ecef", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", marginBottom: "10px" }}>
                    No Image
                  </div>
                )}
                <h3 style={{ marginBottom: "10px", color: "#333" }}>{product.name}</h3>
                <p style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>₹{product.price}</p>
                <button onClick={() => addToCart(product)} style={{ background: "#007bff", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer", transition: "background 0.3s ease" }}>
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}