// server/src/models/User.js
import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
  playedAt: { type: Date, default: Date.now },
  count: { type: Number, default: 1 }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // actual login, not just DJ name
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "dj", "admin"], default: "user" },
  preferences: {
    genres: [String],
    bands: [String],
    years: [Number]
  },
  history: [historySchema],          // to suggest songs from user history
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
