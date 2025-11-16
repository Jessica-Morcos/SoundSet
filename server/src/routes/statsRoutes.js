import express from "express";
import PlayHistory from "../models/PlayHistory.js";
import { authMiddleware } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

/* ------------------------------------------------------
   EXISTING — DO NOT TOUCH
------------------------------------------------------ */

router.post("/log", authMiddleware, async (req, res) => {
  try {
    const { songId } = req.body;

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
          localField: "_id",
          foreignField: "_id",
          as: "songInfo",
        },
      },
      { $unwind: "$songInfo" },
      {
        $project: {
          songId: "$_id",
          title: "$songInfo.title",
          artist: "$songInfo.artist",
          genre: "$songInfo.genre",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json(data);
  } catch (err) {
    console.error("Error fetching frequency:", err);
    res.status(500).json({ message: "Failed to fetch frequency stats" });
  }
});

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

/* ------------------------------------------------------
   NEW FEATURE #1 — SONG STATS (ANY SONG)
------------------------------------------------------ */

router.get("/song/:id", authMiddleware, async (req, res) => {
  try {
    const songId = req.params.id;

    const stats = await PlayHistory.aggregate([
      { $match: { song: new mongoose.Types.ObjectId(songId) } },
      {
        $group: {
          _id: "$song",
          totalPlays: { $sum: 1 },
          uniqueListeners: { $addToSet: "$user" },
          firstPlayed: { $min: "$playedAt" },
          lastPlayed: { $max: "$playedAt" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPlays: 1,
          uniqueListeners: { $size: "$uniqueListeners" },
          firstPlayed: 1,
          lastPlayed: 1,
        },
      },
    ]);

    res.json(stats[0] || {});
  } catch (err) {
    console.error("Error fetching song stats:", err);
    res.status(500).json({ message: "Failed to fetch song stats" });
  }
});

/* ------------------------------------------------------
   NEW FEATURE #2 — SONG TIMELINE FOR GRAPH
------------------------------------------------------ */

router.get("/song/:id/timeline", authMiddleware, async (req, res) => {
  try {
    const songId = req.params.id;

    const data = await PlayHistory.aggregate([
      { $match: { song: new mongoose.Types.ObjectId(songId) } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$playedAt" },
            month: { $month: "$playedAt" },
            year: { $year: "$playedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          count: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching timeline:", err);
    res.status(500).json({ message: "Failed to fetch timeline data" });
  }
});

/* ------------------------------------------------------
   OLD DETAIL LOG ROUTE (kept for compatibility)
------------------------------------------------------ */

router.get("/user/:userId/logs", authMiddleware, async (req, res) => {
  try {
    const logs = await PlayHistory.find({ user: req.params.userId })
      .populate("song", "title artist genre")
      .sort({ playedAt: -1 });

    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch play logs" });
  }
});

/* ------------------------------------------------------
   NEW FEATURE #3 — ALL USERS' LAST ACTIVITY (Spotify-style)
------------------------------------------------------ */

router.get("/users/recent", authMiddleware, async (req, res) => {
  try {
    const data = await PlayHistory.aggregate([
      // sort newest first so $first gets the latest play
      { $sort: { playedAt: -1 } },
      {
        $group: {
          _id: "$user",
          lastPlayedAt: { $first: "$playedAt" },
          lastSong: { $first: "$song" },
        },
      },
      // join user to get username
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      // join song to get title + artist
      {
        $lookup: {
          from: "songs",
          localField: "lastSong",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: "$song" },
      {
        $project: {
          _id: 0, // ✨ do NOT expose user ids
          username: "$user.username",
          lastSongTitle: "$song.title",
          lastSongArtist: "$song.artist",
          lastPlayedAt: 1,
        },
      },
      { $sort: { lastPlayedAt: -1 } },
      { $limit: 50 },
    ]);

    res.json(data);
  } catch (err) {
    console.error("Error fetching recent activity:", err);
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
});

export default router;
