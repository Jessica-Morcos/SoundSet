// server/src/models/Playlist.js
import mongoose from "mongoose";

const playlistSongSchema = new mongoose.Schema({
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
  order: Number,
});

const playlistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  songs: [playlistSongSchema],  // <-- this should store references only
  totalDurationSec: { type: Number, default: 0 },
  classification: {
  type: String,
  enum: ["general", "wedding", "corporate", "birthday", "club", "charity", "custom"],
  default: "general",
},

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Playlist", playlistSchema);
