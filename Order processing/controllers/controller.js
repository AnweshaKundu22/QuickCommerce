// Order processing/controllers/controller.js
import Warehouse from "../models/Warehouse.js";
import Hotspot from "../models/Hotspot.js";

// In-memory status map for all orders
const orderStatusMap = new Map();

// Euclidean distance
const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Helper to update status
const updateStatus = (orderId, stage, message) => {
  const history = orderStatusMap.get(orderId) || [];
  history.push({ stage, message, time: new Date().toISOString() });
  orderStatusMap.set(orderId, history);
  console.log(`📦 [${orderId}] ${stage} → ${message}`);
};

// -----------------------------
// POST /api/logistics/nearest
// Finds nearest warehouse + hotspot and starts simulation
// -----------------------------
export const findNearestWarehouseAndHotspot = async (req, res) => {
  try {
    const { userX, userY, quantity = 1, orderId = Date.now().toString() } = req.body;

    if (userX === undefined || userY === undefined)
      return res.status(400).json({ error: "User coordinates required" });

    // --- 1️⃣ Nearest warehouse ---
    const warehouses = await Warehouse.find();
    if (!warehouses.length) throw new Error("No warehouses available");

    let nearestWarehouse = warehouses[0];
    let minDist = calculateDistance(userX, userY, nearestWarehouse.lat, nearestWarehouse.lng);

    warehouses.forEach((w) => {
      const dist = calculateDistance(userX, userY, w.lat, w.lng);
      if (dist < minDist) {
        nearestWarehouse = w;
        minDist = dist;
      }
    });

    // --- 2️⃣ Nearest hotspot ---
    const hotspots = await Hotspot.find();
    if (!hotspots.length) throw new Error("No hotspots available");

    let nearestHotspot = hotspots[0];
    let minHotspotDist = calculateDistance(
      nearestWarehouse.lat,
      nearestWarehouse.lng,
      nearestHotspot.lat,
      nearestHotspot.lng
    );

    hotspots.forEach((h) => {
      const dist = calculateDistance(nearestWarehouse.lat, nearestWarehouse.lng, h.lat, h.lng);
      if (dist < minHotspotDist) {
        nearestHotspot = h;
        minHotspotDist = dist;
      }
    });

    // --- 3️⃣ Simulation ---
    const pickingDelay = quantity * 5000; // 5s per item
    const speedFactor = 3000;
    const warehouseToHotspotDelay = minHotspotDist * speedFactor;
    const hotspotToUserDelay = minDist * speedFactor;
    const totalTime = pickingDelay + warehouseToHotspotDelay + hotspotToUserDelay;

    // Initialize status
    orderStatusMap.set(orderId, []);
    updateStatus(orderId, "Pending", "Order created, waiting for processing…");

    // Schedule status updates asynchronously
    setTimeout(() => updateStatus(orderId, "Picking", `Picking ${quantity} items at ${nearestWarehouse.name}`), 100);
    setTimeout(() => updateStatus(orderId, "WarehouseToHotspot", `Moving from ${nearestWarehouse.name} → ${nearestHotspot.name}`), pickingDelay);
    setTimeout(() => updateStatus(orderId, "HotspotToUser", `Delivering from ${nearestHotspot.name} → User`), pickingDelay + warehouseToHotspotDelay);
    setTimeout(() => updateStatus(orderId, "Delivered", "Order delivered ✅"), totalTime + 2000);

    // Respond immediately with order info
    return res.json({
      orderId,
      nearestWarehouse,
      nearestHotspot,
      distanceToWarehouse: minDist.toFixed(2),
      distanceWarehouseToHotspot: minHotspotDist.toFixed(2),
      estimatedDeliveryTimeMs: totalTime,
    });
  } catch (err) {
    console.error("❌ Error in nearest warehouse calculation:", err);
    res.status(500).json({ error: err.message || "Failed to calculate nearest warehouse/hotspot" });
  }
};

// -----------------------------
// GET /api/logistics/status/:orderId
// Returns current status timeline for given order
// -----------------------------
export const getOrderStatus = (req, res) => {
  const { orderId } = req.params;
  if (!orderStatusMap.has(orderId)) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json({ orderId, updates: orderStatusMap.get(orderId) });
};