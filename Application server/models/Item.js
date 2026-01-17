// Application server/models/Item.js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" }, // optional URL
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 100, min: 0 },
    category: { type: String, default: "general" },
  },
  { timestamps: true, collection: "products" }
);

export default mongoose.model("Item", ItemSchema, "products");