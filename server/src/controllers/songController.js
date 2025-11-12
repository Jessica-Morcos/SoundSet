// server/src/controllers/songController.js
import Song from "../models/Song.js";
import User from "../models/User.js";

// Get all songs (users see unrestricted, admins see all)
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

// Advanced personalized suggestions (weighted by recency + preferences)
export const suggestSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("history.song");
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const genreScores = {};
    const artistScores = {};

    // Score genres/artists based on play frequency & recency
    user.history.forEach((entry) => {
      const song = entry.song;
      if (!song) return;

      const daysAgo = (now - new Date(entry.playedAt)) / (1000 * 60 * 60 * 24);
      // Decay factor: recent plays matter more (7 days = full weight, 30+ = less)
      const recencyWeight = Math.max(0.2, 1 - daysAgo / 30);

      const score = entry.count * recencyWeight;

      if (song.genre)
        genreScores[song.genre] = (genreScores[song.genre] || 0) + score;
      if (song.artist)
        artistScores[song.artist] = (artistScores[song.artist] || 0) + score;
    });

    //  Add small boost for user preferences
    const prefBoost = 2; // tune if needed
    user.preferences.genres?.forEach(
      (g) => (genreScores[g] = (genreScores[g] || 0) + prefBoost)
    );
    user.preferences.bands?.forEach(
      (a) => (artistScores[a] = (artistScores[a] || 0) + prefBoost)
    );

    // Determine top scoring genres/artists
    const topGenres = Object.entries(genreScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
    const topArtists = Object.entries(artistScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a);

    // Build filter combining history + preferences
    const matchYears = user.preferences.years?.length
      ? user.preferences.years
      : [];

    const orConditions = [];
    if (topGenres.length) orConditions.push({ genre: { $in: topGenres } });
    if (topArtists.length) orConditions.push({ artist: { $in: topArtists } });
    if (matchYears.length) orConditions.push({ year: { $in: matchYears } });

    // Query matching unrestricted songs
    let suggestions = [];
    if (orConditions.length > 0) {
      suggestions = await Song.find({
        restricted: false,
        $or: orConditions,
      }).limit(20);
    }

    //  Fill with random unrestricted songs if not enough
    if (suggestions.length < 10) {
      const extra = await Song.aggregate([
        { $match: { restricted: false } },
        { $sample: { size: 10 - suggestions.length } },
      ]);
      suggestions = [...suggestions, ...extra];
    }

    // Sort final list by weighted “score” if applicable
    suggestions.sort((a, b) => {
      const gScore = (genreScores[b.genre] || 0) - (genreScores[a.genre] || 0);
      const aScore =
        (artistScores[b.artist] || 0) - (artistScores[a.artist] || 0);
      return gScore + aScore;
    });

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
