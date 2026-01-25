import express from "express";
import mongoose from "mongoose";
import cors from "cors";
//import config from "config";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";
import recommendationsRoute from "./routes/recommendations.js"; // ✅ NEW
import Item from "./models/Item.js";
import Order from "./models/Order.js";
import { authMiddleware } from "./middleware/middleware.js";
import dotenv from "dotenv";
dotenv.config();


const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// -----------------------
// Root + Health
// -----------------------
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running 🚀" });
});

// -----------------------
// Routes
// -----------------------
app.use("/api/auth", authRoutes);

// -----------------------
// 🛍 Feature 1 - Product Listing
// -----------------------
app.get("/api/products", async (req, res) => {
  try {
    const products = await Item.find({});
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error fetching products" });
  }
});

// -----------------------
// 🛒 Feature 2 - Orders
// -----------------------
app.use("/api/orders", orderRoutes);

app.post("/api/orders/checkout", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Order.findOne({ user: userId, isCart: true }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    cart.isCart = false;
    await cart.save();

    const newCart = new Order({ user: userId, items: [], totalAmount: 0, isCart: true });
    await newCart.save();

    res.json({ message: "Order placed successfully ✅", order: cart });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// -----------------------
// 🧠 Feature 3 - AI Recommendations
// -----------------------
app.use("/api/recommendations", recommendationsRoute); // ✅ connect recommendations route

// -----------------------
// MongoDB Connect + Start
// -----------------------
//mongoose.connect(config.get("mongoURI"))
mongoose.connect(process.env.mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));