import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
      },
    ],

    totalAmount: { type: Number, default: 0 },
    status: { type: String, default: "Pending" }, // order lifecycle
    isCart: { type: Boolean, default: true }, // ✅ distinguishes cart vs. order

    // 🚚 Delivery details
    deliveryLocation: {
      x: { type: Number },
      y: { type: Number },
    },

    nearestWarehouse: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
      name: String,
      x: Number,
      y: Number,
    },

    nearestHotspot: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Hotspot" },
      name: String,
      x: Number,
      y: Number,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;