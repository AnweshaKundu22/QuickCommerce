import express from "express";
//import config from "config";
import Item from "../models/Item.js";
import Order from "../models/Order.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

//const GEMINI_API_KEY = config.get("your-gemini-Api-Key");
const GEMINI_API_KEY = process.env.your-gemini-Api-Key;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    // -------------------
    // 1️⃣ Fetch all available products
    // -------------------
    const availableProducts = await Item.find({});
    if (!availableProducts.length) {
      return res.status(404).json({
        success: false,
        message: "No products available.",
      });
    }

    // -------------------
    // 2️⃣ Fetch user past orders
    // -------------------
    const userOrders = await Order.find({ user: userId, isCart: false })
      .populate("items.product")
      .sort({ createdAt: -1 })
      .limit(10);

    const orderHistory = userOrders.map((order) => ({
      items: order.items.map((i) => ({
        name: i.product?.name,
        category: i.product?.category,
        price: i.price,
      })),
    }));

    // -------------------
    // 3️⃣ Prepare Gemini prompt
    // -------------------
    const prompt = `
You are a smart shopping assistant 🛍.
Based on the user's past purchase history and current available products, recommend 3–5 relevant products they may like.

User's purchase history:
${JSON.stringify(orderHistory, null, 2)}

Available products:
${JSON.stringify(
      availableProducts.map((p) => ({
        name: p.name,
        category: p.category,
        price: p.price
      })),
      null,
      2
    )}

Return ONLY a valid JSON array in this format:
[
  { "name": "Product Name", "category": "Category","price": "Price","reason": "Why it's recommended" }
]
No markdown, no code blocks.
`;

    // -------------------
    // 4️⃣ Call Gemini API
    // -------------------
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API Error:", data);
      return res.status(500).json({
        success: false,
        message: "Gemini API request failed",
        details: data.error || data,
      });
    }

    // -------------------
    // 5️⃣ Extract and match AI recommendations with DB
    // -------------------
    let recommendations = [];
    try {
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/[\u0000-\u001F]+/g, "")
        .trim();

      const match = cleaned.match(/\[[\s\S]*\]/);
      const jsonText = match ? match[0] : cleaned;

      const aiRecs = JSON.parse(jsonText);

      // Match with DB to get _id and image
      recommendations = aiRecs.map((rec) => {
        const productMatch = availableProducts.find(
          (p) => p.name.toLowerCase() === rec.name.toLowerCase()
        );

        return productMatch
          ? {
              _id: productMatch._id,
              name: productMatch.name,
              category: productMatch.category,
              price: productMatch.price,
              image: productMatch.image || "",
              reason: rec.reason || "Recommended for you",
            }
          : {
              name: rec.name,
              category: rec.category,
              price: rec.price,
              image: "",
              reason: rec.reason || "Recommended for you",
            };
      });
    } catch (err) {
      console.warn("⚠ Could not parse Gemini output as JSON:", err);
      console.log("🪶 Raw Gemini output:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    }

    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("❌ Server error while generating recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;