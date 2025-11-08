import express from "express";
import PlayHistory from "../models/PlayHistory.js";
import { authMiddleware } from "../middleware/auth.js";
import mongoose from "mongoose";
const router = express.Router();

router.post("/log", authMiddleware, async (req, res) => {
  try {
    const { songId } = req.body;

    // Ensure valid ObjectId type
    const song = await mongoose.model("Song").findById(songId);
    if (!song) return res.status(404).json({ message: "Song not found" });

    await PlayHistory.create({
      user: req.user._id,
      song: song._id,
    });

    res.status(201).json({ message: `Play logged for ${song.title}` });
  } catch (err) {
    console.error("Error logging play:", err);
    res.status(500).json({ message: "Failed to log play" });
  }
});


router.get("/frequency", authMiddleware, async (req, res) => {
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
          localField: "_id", // matches _id in songs
          foreignField: "_id",
          as: "songInfo",
        },
      },
      { $unwind: { path: "$songInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          "songInfo.title": 1,
          "songInfo.artist": 1,
          "songInfo.genre": 1,
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    console.error("Error fetching frequency:", err);
    res.status(500).json({ message: "Failed to fetch frequency stats" });
  }
});

// ✅ Most played artists
router.get("/artist", authMiddleware, async (req, res) => {
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
  ]);
  res.json(data);
});

// ✅ Most played genres
router.get("/genre", authMiddleware, async (req, res) => {
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
  ]);
  res.json(data);
});

export default router;
