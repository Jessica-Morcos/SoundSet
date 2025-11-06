// server/src/models/DjProfile.js
import mongoose from "mongoose";

const djProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  displayName: String,
  bio: String,
  classifications: [String], // “band”, “genre”, “year” like in backlog
  isFeatured: { type: Boolean, default: false }
});

export default mongoose.model("DjProfile", djProfileSchema);
