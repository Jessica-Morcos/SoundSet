// server/src/controllers/statsController.js
import User from "../models/User.js";
import Song from "../models/Song.js";

// Logs when a user plays a song
export const logPlay = async (req, res) => {
  try {
    const { songId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    // Check if song already exists in history
    const existing = user.history.find(
      (h) => h.song.toString() === songId.toString()
    );
    if (existing) {
      existing.count += 1;
      existing.playedAt = new Date();
    } else {
      user.history.push({ song: songId, count: 1 });
    }

    await user.save();

    res.json({ message: `Play logged for ${song.title}` });
  } catch (err) {
    console.error("Error logging play:", err);
    res.status(500).json({ message: "Failed to log play" });
  }
};
