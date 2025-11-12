// server/src/controllers/songController.js
import Song from "../models/Song.js";
import User from "../models/User.js";
import mongoose from "mongoose";

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

// Advanced personalized suggestions (weighted by recency + preferences) + DE-DUPED
export const suggestSongs = async (req, res) => {
  try {
    const TARGET = Number(req.query.limit) || 12; // you can change default
    const user = await User.findById(req.user._id).populate("history.song");
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const genreScores = {};
    const artistScores = {};

    // 1) Score genres/artists by frequency & recency
    user.history.forEach((entry) => {
      const s = entry.song;
      if (!s) return;
      const daysAgo = (now - new Date(entry.playedAt)) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.max(0.2, 1 - daysAgo / 30); // decay
      const score = entry.count * recencyWeight;

      if (s.genre)  genreScores[s.genre]   = (genreScores[s.genre]   || 0) + score;
      if (s.artist) artistScores[s.artist] = (artistScores[s.artist] || 0) + score;
    });

    // 2) Boost user preferences
    const prefBoost = 2;
    user.preferences?.genres?.forEach(g => { genreScores[g]  = (genreScores[g]  || 0) + prefBoost; });
    user.preferences?.bands?.forEach(a  => { artistScores[a] = (artistScores[a] || 0) + prefBoost; });

    // 3) Top signals
    const topGenres  = Object.entries(genreScores).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([g])=>g);
    const topArtists = Object.entries(artistScores).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([a])=>a);
    const years      = Array.isArray(user.preferences?.years) ? user.preferences.years : [];

    const orConditions = [];
    if (topGenres.length)  orConditions.push({ genre:  { $in: topGenres } });
    if (topArtists.length) orConditions.push({ artist: { $in: topArtists } });
    if (years.length)      orConditions.push({ year:   { $in: years } });

    // 4) Main query
    let initial = [];
    if (orConditions.length) {
      initial = await Song.find({ restricted: false, $or: orConditions }).limit(TARGET * 2);
    }

    // 5) DE-DUPE by _id
    const uniqMap = new Map();
    for (const s of initial) uniqMap.set(String(s._id), s);

    // 6) If not enough, sample random excluding already picked IDs
    if (uniqMap.size < TARGET) {
      const alreadyIds = Array.from(uniqMap.keys()).map(id => new mongoose.Types.ObjectId(id));
      const needed = TARGET - uniqMap.size;

      const extra = await Song.aggregate([
        { $match: { restricted: false, _id: { $nin: alreadyIds } } },
        { $sample: { size: needed } }
      ]);

      for (const s of extra) uniqMap.set(String(s._id), s);
    }

    // 7) Score-sort final list (optional but nice)
    let suggestions = Array.from(uniqMap.values());
    suggestions.sort((a, b) => {
      const gDiff = (genreScores[b.genre]  || 0) - (genreScores[a.genre]  || 0);
      const aDiff = (artistScores[b.artist]|| 0) - (artistScores[a.artist]|| 0);
      return gDiff + aDiff;
    });

    // 8) Trim to TARGET and send
    res.json(suggestions.slice(0, TARGET));
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
