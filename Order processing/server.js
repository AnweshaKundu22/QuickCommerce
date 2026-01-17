// Order processing/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/routes.js"; // ESM import

const app = express();

// -----------------------------
// Config
// -----------------------------
const PORT = 6000;
const MONGODB_URI = "mongodb://localhost:27017/quickcommerce";

// -----------------------------
// Middleware
// -----------------------------
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// -----------------------------
// Routes
// -----------------------------
app.use("/api/logistics", routes);

// -----------------------------
// DB connection + server start
// -----------------------------
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ Connected to MongoDB for Order Processing");
  app.listen(PORT, () => {
    console.log(`🚀 Order Processing service running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});