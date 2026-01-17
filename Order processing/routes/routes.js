// routes/routes.js
import express from "express";
import { findNearestWarehouseAndHotspot, getOrderStatus } from "../controllers/controller.js";

const router = express.Router();

// -----------------------------
// POST /api/logistics/nearest
// Finds nearest warehouse + hotspot and starts simulation
// -----------------------------
router.post("/nearest", findNearestWarehouseAndHotspot);

// -----------------------------
// GET /api/logistics/status/:orderId
// Returns current status timeline for given order
// -----------------------------
router.get("/status/:orderId", getOrderStatus);

export default router;