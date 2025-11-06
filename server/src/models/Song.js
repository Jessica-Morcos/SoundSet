import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: String,
  genre: String,
  year: Number,
  durationSec: { type: Number, required: true },
  classifications: [String],
  restricted: { type: Boolean, default: false },

  // 🔹 NEW FIELDS
  audioUrl: { type: String }, // link to the mp3
  coverUrl: { type: String }, // link to album image
});

export default mongoose.model("Song", songSchema);
