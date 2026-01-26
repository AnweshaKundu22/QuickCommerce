// Frontend/src/components/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Cart({
  setToken,
  cart: parentCart,
  setCart: setParentCart,
  cartCount,
  setCartCount,
  userId,
}) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [coords, setCoords] = useState({ x: "", y: "" });
  const [checkoutError, setCheckoutError] = useState(""); // ✅ state for checkout errors
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch cart on mount
  useEffect(() => {
    if (!token || !userId) {
      navigate("/signin", { replace: true });
      return;
    }
    fetchCart();
  }, [token, userId]);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      const itemsArray = data.cart?.items || data.items || [];

      const formattedCart = itemsArray.map((i) => ({
        _id: i.product._id,
        name: i.product.name,
        image: i.product.image,
        price: i.price,
        quantity: i.quantity,
      }));

      setCart(formattedCart);
      setParentCart(formattedCart);
      setCartCount(
        data.cartCount || formattedCart.reduce((sum, i) => sum + i.quantity, 0)
      );
      localStorage.setItem(`cart_${userId}`, JSON.stringify(formattedCart));
    } catch (err) {
      console.error("Failed to fetch cart", err);
      const saved = JSON.parse(localStorage.getItem(`cart_${userId}`) || "[]");
      setCart(saved);
      setParentCart(saved);
      setCartCount(saved.reduce((sum, i) => sum + i.quantity, 0));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQty, oldQty) => {
    if (newQty < 1) return removeItem(productId);
    try {
      const delta = newQty - oldQty;
      const res = await fetch(`${API_BASE_URL}/api/orders/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: delta }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");

      const data = await res.json();
      const formattedCart = data.cart.items.map((i) => ({
        _id: i.product._id,
        name: i.product.name,
        image: i.product.image,
        price: i.price,
        quantity: i.quantity,
      }));

      setCart(formattedCart);
      setParentCart(formattedCart);
      setCartCount(
        data.cartCount || formattedCart.reduce((sum, i) => sum + i.quantity, 0)
      );
      localStorage.setItem(`cart_${userId}`, JSON.stringify(formattedCart));
    } catch (err) {
      console.error("Failed to update quantity", err);
    }
  };

  const removeItem = async (productId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/orders/cart/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to remove item");

      const data = await res.json();
      const formattedCart = data.cart.items.map((i) => ({
        _id: i.product._id,
        name: i.product.name,
        image: i.product.image,
        price: i.price,
        quantity: i.quantity,
      }));

      setCart(formattedCart);
      setParentCart(formattedCart);
      setCartCount(
        data.cartCount || formattedCart.reduce((sum, i) => sum + i.quantity, 0)
      );
      localStorage.setItem(`cart_${userId}`, JSON.stringify(formattedCart));
    } catch (err) {
      console.error("Failed to remove item", err);
    }
  };

  const checkout = async () => {
    if (!coords.x || !coords.y) {
      setCheckoutError("Please enter delivery coordinates before checkout.");
      return;
    }
    const lat = parseFloat(coords.x);
    const lon = parseFloat(coords.y);

    // ✅Validating latitude and longitude range
    if(isNaN(lat) || isNaN(lon) || lat<-90 || lat>90 || lon<-180 || lon>180){
      setCheckoutError("❌ Invalid coordinate! X Coordinate must be between -90 and 90, and Y Coordinate between -180 and 180.");
      return;
    }
    try {
      setCheckoutError("");
      const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userX: parseFloat(coords.x),
          userY: parseFloat(coords.y),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || "Checkout failed");
        return;
      }

      setCart([]);
      setParentCart([]);
      setCartCount(0);
      localStorage.setItem(`cart_${userId}`, JSON.stringify([]));

      navigate("/order-confirmation", { state: { order: data.order } });
    } catch (err) {
      console.error("Checkout failed", err);
      setCheckoutError("Checkout failed: " + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem(`cart_${userId}`);
    setToken(null);
    setCart([]);
    setCartCount(0);
    navigate("/signin");
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) return <p className="text-center mt-6">Loading cart...</p>;

  return (
    <div className="min-h-screen w-screen bg-gray-100 flex flex-col font-sans">
      {/* Navbar */}
      <div className="flex justify-between items-center bg-gray-900 text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <h2 className="text-xl font-semibold">My Cart 🛒 ({cartCount})</h2>
        <div className="space-x-2">
          <button
            onClick={() => navigate("/home")}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm"
          >
            Home
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Cart Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6">
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-medium text-gray-600">
              Your cart is empty 🛒
            </h2>
            <button
              onClick={() => navigate("/home")}
              className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium"
            >
              Go Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center bg-white rounded-lg shadow p-4"
                >
                  <img
                    src={item.image || "https://via.placeholder.com/80"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1 ml-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ₹{item.price} × {item.quantity} ={" "}
                      <span className="font-semibold">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity - 1, item.quantity)
                      }
                      className="bg-blue-600 text-white px-2 py-1 rounded-md"
                    >
                      -
                    </button>
                    <span className="min-w-[24px] text-center font-bold text-gray-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1, item.quantity)
                      }
                      className="bg-blue-600 text-white px-2 py-1 rounded-md"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Section */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800">
                Total: ₹{totalAmount.toFixed(2)}
              </h2>

              {!showAddressInput && (
                <button
                  onClick={() => setShowAddressInput(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                >
                  Add Delivery Coordinates 📍
                </button>
              )}

              {showAddressInput && (
                <div className="mt-4 space-y-4">
                  {checkoutError && (
                    <p className="text-red-600 font-medium">{checkoutError}</p>
                  )}
                  <div className="flex gap-4">
                    <input
                      type="number"
                      step="any"
                      placeholder="X coordinate"
                      value={coords.x}
                      onChange={(e) =>
                        setCoords({ ...coords, x: e.target.value })
                      }
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Y coordinate"
                      value={coords.y}
                      onChange={(e) =>
                        setCoords({ ...coords, y: e.target.value })
                      }
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    onClick={checkout}
                    disabled={!coords.x || !coords.y}
                    className={`w-full py-3 rounded-lg text-white font-medium ${
                      coords.x && coords.y
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Checkout ✅
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}