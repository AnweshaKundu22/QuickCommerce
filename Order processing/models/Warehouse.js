import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  lat: {
    type: Number,
    required: true,
  },
  lng: {
    type: Number,
    required: true,
  },
});

export default mongoose.model("Warehouse", warehouseSchema);