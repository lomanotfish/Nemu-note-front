import mongoose from "mongoose";

const MONGODB_URI = Bun.env.MONGODB_URI ?? "";

if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in .env");

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log("[DB] Connected to MongoDB");
}
