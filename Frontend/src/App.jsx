import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Cart from "./components/Cart";
import OrderConfirmation from "./components/OrderConfirmation";

export default function App() {
  // ✅ Token & UserId state
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");

  // ✅ Cart state (always from backend)
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0); // ✅ global cart count

  // ✅ Update Token & UserId
  const updateToken = (newToken, newUserId = "") => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      if (newUserId) {
        localStorage.setItem("userId", newUserId);
        setUserId(newUserId);
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      setUserId("");
      setCart([]);
      setCartCount(0); // clear count on logout
    }
    setToken(newToken);
  };

  // ✅ Fetch Cart from backend when userId or token changes
  useEffect(() => {
    const fetchCart = async () => {
      if (userId && token) {
        try {
          const res = await fetch("http://localhost:5000/api/orders/cart", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) throw new Error("Failed to fetch cart");

          const data = await res.json();
          const items = data.items || [];
          setCart(items);
          setCartCount(data.cartCount || items.reduce((sum, i) => sum + i.quantity, 0)); // ✅ set global cartCount
        } catch (err) {
          console.error("Error fetching cart:", err);
          setCart([]);
          setCartCount(0);
        }
      } else {
        setCart([]);
        setCartCount(0);
      }
    };

    fetchCart();
  }, [userId, token]);

  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={token ? <Navigate to="/home" replace /> : <Navigate to="/signin" replace />}
        />

        {/* Public routes */}
        <Route
          path="/signin"
          element={
            token ? (
              <Navigate to="/home" replace />
            ) : (
              <SignIn setToken={(tok, uid) => updateToken(tok, uid)} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            token ? (
              <Navigate to="/home" replace />
            ) : (
              <SignUp setToken={(tok, uid) => updateToken(tok, uid)} />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            token ? (
              <HomePage
                cart={cart}
                setCart={setCart}
                cartCount={cartCount}
                setCartCount={setCartCount} // ✅ pass cartCount setter
                setToken={updateToken}
                userId={userId}
              />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/cart"
          element={
            token ? (
              <Cart
                cart={cart}
                setCart={setCart}
                cartCount={cartCount}
                setCartCount={setCartCount} // ✅ pass cartCount setter
                setToken={updateToken}
                userId={userId}
              />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
        <Route
          path="/order-confirmation"
          element={
            token ? (
              <OrderConfirmation cart={cart} setCart={setCart} setCartCount={setCartCount} userId={userId} />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}