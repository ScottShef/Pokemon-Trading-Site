import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listing.js";
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
