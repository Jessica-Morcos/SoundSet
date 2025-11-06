// server/src/controllers/songController.js
import Song from "../models/Song.js";
import User from "../models/User.js";

// ✅ Get all songs (users see unrestricted, admins see all)
export const listSongs = async (req, res) => {
  try {
    const { genre, year, classification, q, restricted } = req.query;
    const filter = {};

    if (genre) filter.genre = genre;
    if (year) filter.year = Number(year);
    if (classification) filter.classifications = classification;
    if (q) filter.title = { $regex: q, $options: "i" };
    if (restricted) filter.restricted = restricted === "true";

    // Hide restricted songs for non-admin users
    if (req.user?.role !== "admin") {
      filter.restricted = false;
    }

    const songs = await Song.find(filter).limit(100);
    res.json(songs);
  } catch (err) {
    console.error("Error listing songs:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Personalized suggestions
export const suggestSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("history.song");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.history.length === 0) {
      const random = await Song.aggregate([{ $match: { restricted: false } }, { $sample: { size: 10 } }]);
      return res.json(random);
    }

    const genreCounts = {};
    const artistCounts = {};
    user.history.forEach((entry) => {
      const s = entry.song;
      if (!s) return;
      if (s.genre) genreCounts[s.genre] = (genreCounts[s.genre] || 0) + entry.count;
      if (s.artist) artistCounts[s.artist] = (artistCounts[s.artist] || 0) + entry.count;
    });

    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    let suggestions = await Song.find({
      restricted: false,
      $or: [{ genre: topGenre }, { artist: topArtist }],
    }).limit(10);

    if (suggestions.length < 5) {
      const random = await Song.aggregate([{ $match: { restricted: false } }, { $sample: { size: 5 } }]);
      suggestions = [...suggestions, ...random];
    }

    res.json(suggestions);
  } catch (err) {
    console.error("Error suggesting songs:", err);
    res.status(500).json({ message: "Failed to suggest songs" });
  }
};

// ✅ Admin: Create song
export const createSong = async (req, res) => {
  try {
    const song = await Song.create(req.body);
    res.status(201).json({ message: "Song added successfully", song });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Admin: Update song
export const updateSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!song) return res.status(404).json({ message: "Song not found" });
    res.json({ message: "Song updated successfully", song });
  } catch (err) {
    console.error("Error updating song:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Admin: Toggle restricted flag
export const toggleRestricted = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    song.restricted = !song.restricted;
    await song.save();

    res.json({ message: `Song ${song.restricted ? "restricted" : "unrestricted"} successfully`, song });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Admin: Delete song
export const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    await song.deleteOne();
    res.json({ message: "Song deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
