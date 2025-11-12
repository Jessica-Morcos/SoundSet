import mongoose from "mongoose";

// 🎵 Subdocument schema for songs inside playlists
const playlistSongSchema = new mongoose.Schema({
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
  order: { type: Number, default: 0 },
});

// 📜 Main Playlist schema
const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Song list references
    songs: [playlistSongSchema],

    // ⏱️ Total duration auto-calculated when songs are added
    totalDurationSec: { type: Number, default: 0 },

    // 🌍 Public / Private visibility for Discover
    isPublic: { type: Boolean, default: false },

    // 🏷️ Classification used in filters and discover pages
    classification: {
      type: String,
      enum: [
        "general",
        "wedding",
        "corporate",
        "birthday",
        "club",
        "charity",
        "custom",
      ],
      default: "general",
    },

    // ✅ Keep inactive ones for soft deletes (optional)
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 🔧 Optional virtual (if you ever need formatted duration)
playlistSchema.virtual("durationMinutes").get(function () {
  return Math.round(this.totalDurationSec / 60);
});

export default mongoose.model("Playlist", playlistSchema);
