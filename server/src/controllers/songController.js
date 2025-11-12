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

// Personalized suggestions (based on history + preferences)
export const suggestSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("history.song");
    if (!user) return res.status(404).json({ message: "User not found" });

    const filter = { restricted: false };
    const matchGenres = new Set();
    const matchArtists = new Set();

    // Gather genres/artists from listening history
    user.history.forEach((entry) => {
      const s = entry.song;
      if (!s) return;
      if (s.genre) matchGenres.add(s.genre);
      if (s.artist) matchArtists.add(s.artist);
    });

    // Add preferences (genres/bands/years)
    if (user.preferences.genres?.length)
      user.preferences.genres.forEach((g) => matchGenres.add(g));
    if (user.preferences.bands?.length)
      user.preferences.bands.forEach((b) => matchArtists.add(b));

    const matchYears = user.preferences.years?.length
      ? user.preferences.years
      : [];

    // Build main query
    const orConditions = [];
    if (matchGenres.size > 0)
      orConditions.push({ genre: { $in: Array.from(matchGenres) } });
    if (matchArtists.size > 0)
      orConditions.push({ artist: { $in: Array.from(matchArtists) } });
    if (matchYears.length > 0)
      orConditions.push({ year: { $in: matchYears } });

    // Fetch matching songs
    let suggestions = [];
    if (orConditions.length > 0) {
      suggestions = await Song.find({
        ...filter,
        $or: orConditions,
      }).limit(15);
    }

    //  If not enough, fill with random unrestricted songs
    if (suggestions.length < 10) {
      const extra = await Song.aggregate([
        { $match: { restricted: false } },
        { $sample: { size: 10 - suggestions.length } },
      ]);
      suggestions = [...suggestions, ...extra];
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
