// server/src/controllers/statsController.js
import mongoose from "mongoose";
import PlayHistory from "../models/PlayHistory.js";
import Song from "../models/Song.js";

// ✅ Log a song play
export const logPlay = async (req, res) => {
  try {
    const { songId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }

    const song = await Song.findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    // Record the play in PlayHistory
    await PlayHistory.create({
      user: req.user._id,
      song: song._id,
      playedAt: new Date(),
    });

    res.status(201).json({ message: `Play logged for ${song.title}` });
  } catch (err) {
    console.error("Error logging play:", err);
    res.status(500).json({ message: "Failed to log play" });
  }
};

// ✅ Get play frequency (per song)
export const getFrequency = async (req, res) => {
  try {
    const data = await PlayHistory.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: "$song",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "songInfo",
        },
      },
      { $unwind: { path: "$songInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          songId: "$_id",
          count: 1,
          "songInfo.title": 1,
          "songInfo.artist": 1,
          "songInfo.genre": 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching frequency:", err);
    res.status(500).json({ message: "Failed to fetch song frequency" });
  }
};

// ✅ Most played artists
export const getTopArtists = async (req, res) => {
  try {
    const data = await PlayHistory.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "songInfo",
        },
      },
      { $unwind: "$songInfo" },
      {
        $group: {
          _id: "$songInfo.artist",
          plays: { $sum: 1 },
        },
      },
      { $sort: { plays: -1 } },
      { $limit: 5 },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching artist stats:", err);
    res.status(500).json({ message: "Failed to fetch artist stats" });
  }
};

// ✅ Most played genres
export const getTopGenres = async (req, res) => {
  try {
    const data = await PlayHistory.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "songInfo",
        },
      },
      { $unwind: "$songInfo" },
      {
        $group: {
          _id: "$songInfo.genre",
          plays: { $sum: 1 },
        },
      },
      { $sort: { plays: -1 } },
      { $limit: 5 },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching genre stats:", err);
    res.status(500).json({ message: "Failed to fetch genre stats" });
  }
};
