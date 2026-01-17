// Application server/routes/order.js
import express from "express";
import Order from "../models/Order.js";
import { authMiddleware } from "../middleware/middleware.js";
import http from "http"; // Node HTTP agent

const router = express.Router();

/**
 * Helper: reliably get the ESM Item model
 */
async function getItemModel() {
  const mod = await import("../models/Item.js");
  return mod.default || mod.Item || mod;
}

// -----------------------------
// Helper: Fetch status from Order Processing server
// -----------------------------
async function fetchOrderStatusFromProcessing(orderId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 6000,
      path: `/api/logistics/status/${orderId}`,
      method: "GET",
    };

    const reqHttp = http.request(options, (resp) => {
      let data = "";
      resp.on("data", (chunk) => (data += chunk));
      resp.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve(json.updates || []);
        } catch {
          resolve([]);
        }
      });
    });

    reqHttp.on("error", (err) => {
      console.error("❌ Error fetching status from Order Processing:", err);
      resolve([]);
    });

    reqHttp.end();
  });
}

// -----------------------------
// GET live order status (no cache!) ✅
// -----------------------------
router.get("/logistics/status/:id", authMiddleware, async (req, res) => {
  const orderId = req.params.id;

  try {
    // Always fetch fresh updates from Order Processing server
    const updates = await fetchOrderStatusFromProcessing(orderId);
    res.json({ orderId, updates });
  } catch (err) {
    console.error("❌ Error in live status API:", err);
    res.status(500).json({ error: "Failed to fetch order status" });
  }
});

// -----------------------------
// GET current user's cart
// -----------------------------
router.get("/cart", authMiddleware, async (req, res) => {
  try {
    let cart = await Order.findOne({ user: req.user.id, isCart: true }).populate("items.product");
    if (!cart) {
      cart = new Order({ user: req.user.id, items: [], totalAmount: 0, isCart: true });
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    console.error("❌ Error fetching cart:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// -----------------------------
// Add / Update item in cart
// -----------------------------
router.post("/cart", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity || 1);
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const Item = await getItemModel();
    const product = await Item.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Order.findOne({ user: req.user.id, isCart: true });
    if (!cart) {
      cart = new Order({ user: req.user.id, items: [], totalAmount: 0, isCart: true });
    }

    const existing = cart.items.find(i => String(i.product) === String(product._id));
    if (existing) {
      existing.quantity += quantity;
      existing.name = product.name;
      existing.price = product.price;
    } else {
      cart.items.push({ product: product._id, name: product.name, price: product.price, quantity });
    }

    cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await cart.save();
    await cart.populate("items.product");

    res.json({
      message: "Cart updated successfully",
      cart,
      cartCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    });
  } catch (err) {
    console.error("❌ Error updating cart:", err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// -----------------------------
// Remove item from cart
// -----------------------------
router.delete("/cart/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    let cart = await Order.findOne({ user: req.user.id, isCart: true });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(i => String(i._id) !== id && String(i.product) !== id);
    cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await cart.save();
    await cart.populate("items.product");

    res.json({
      message: "Item removed",
      cart,
      cartCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    });
  } catch (err) {
    console.error("❌ Error removing item:", err);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// -----------------------------
// Checkout
// -----------------------------
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { userX, userY } = req.body;
    if (userX === undefined || userY === undefined)
      return res.status(400).json({ error: "Delivery coordinates required" });

    const cart = await Order.findOne({ user: req.user.id, isCart: true }).populate("items.product");
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    // Prepare payload for Order Processing server
    const postData = JSON.stringify({
      orderId: cart._id.toString(),
      userX,
      userY,
      quantity: cart.items.reduce((sum, i) => sum + i.quantity, 0),
      items: cart.items.map(i => ({ product: i.product.name, quantity: i.quantity }))
    });

    // Call Order Processing server
    const logisticsData = await new Promise((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 6000,
        path: "/api/logistics/nearest",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };

      const reqHttp = http.request(options, (resp) => {
        let body = "";
        resp.on("data", chunk => (body += chunk));
        resp.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (err) {
            reject(new Error("Invalid JSON from Order Processing"));
          }
        });
      });

      reqHttp.on("error", (err) => reject(err));
      reqHttp.write(postData);
      reqHttp.end();
    });

    // Update cart as order
    cart.isCart = false;
    cart.status = "Pending";
    cart.deliveryLocation = { x: userX, y: userY };
    cart.nearestWarehouse = logisticsData.nearestWarehouse;
    cart.nearestHotspot = logisticsData.nearestHotspot;
    await cart.save();

    // Create new empty cart
    const newCart = new Order({ user: req.user.id, items: [], totalAmount: 0, isCart: true });
    await newCart.save();

    // Respond immediately to frontend
    res.json({ message: "Order placed successfully ✅", order: cart });

  } catch (err) {
    console.error("❌ Checkout error:", err);
    if (!res.headersSent) res.status(500).json({ error: err.message || "Checkout failed" });
  }
});

// -----------------------------
// Get all past orders
// -----------------------------
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id, isCart: false }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;