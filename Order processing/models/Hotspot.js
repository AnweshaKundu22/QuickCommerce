import mongoose from "mongoose";

const hotspotSchema = new mongoose.Schema({
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
  warehouse: {
    type: String, // storing warehouse name (as in your DB)
    required: true,
  },
});

export default mongoose.model("Hotspot", hotspotSchema);