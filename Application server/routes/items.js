import express from "express";
import Items from "../models/Item.js"; // make sure filename matches exactly

const router = express.Router();

// @route   GET /api/items
// @desc    Get all products
// @access  Public
router.get("/", async (req, res) => {
  try {
    const items = await Items.find();
    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   POST /api/items
// @desc    Add a new product
// @access  Public (for now, later can make admin only)
router.post("/", async (req, res) => {
  try {
    const { name, price, image } = req.body;

    if (!name || !price || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newItem = new Items({
      name,
      price,
      image
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error("Error adding item:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
