// Order processing/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/routes.js"; // ESM import
import dotenv from "dotenv";
dotenv.config();

const app = express();

// -----------------------------
// Config
// -----------------------------
const PORT = 6000;
//const MONGODB_URI = "mongodb+srv://reach2anwesha_db_user:AnweshaDB2002@quickcommerce-cluster.dfgv8em.mongodb.net/quick_commerce?appName=quickcommerce-cluster";

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
mongoose.connect(process.env.mongoURI, {
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