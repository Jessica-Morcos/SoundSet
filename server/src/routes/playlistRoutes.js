import express from "express";
import Playlist from "../models/Playlist.js";
import {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  togglePublic,
  clonePlaylist,
  listPublicPlaylists, // ✅ added
} from "../controllers/playlistController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createPlaylist);
router.get("/mine", authMiddleware, getMyPlaylists);
router.get("/:id", authMiddleware, getPlaylistById);
router.put("/:id/publish", authMiddleware, togglePublic);
router.post("/:id/clone", authMiddleware, clonePlaylist);

// ✅ Public endpoint — no login required
router.get("/discover", listPublicPlaylists);

router.get("/debug/public", async (req, res) => {
  const playlists = await Playlist.find().select("name isPublic owner");
  res.json(playlists);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update playlist (rename, reorder, etc.)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (req.body.name) playlist.name = req.body.name;
    if (req.body.classification) playlist.classification = req.body.classification;

    if (req.body.songs && Array.isArray(req.body.songs)) {
      playlist.songs = req.body.songs.map((s, i) => ({
        song: s.songId,
        order: s.order ?? i,
      }));

      const Song = (await import("../models/Song.js")).default;
      const songDocs = await Song.find({ _id: { $in: playlist.songs.map((s) => s.song) } });
      playlist.totalDurationSec = songDocs.reduce((sum, s) => sum + s.durationSec, 0);

      if (playlist.totalDurationSec < 0 || playlist.totalDurationSec > 3 * 60 * 60) {
        return res.status(400).json({
          message: "Playlist duration must be between 0 and 3 hours.",
        });
      }
    }

    await playlist.save();
    const updated = await Playlist.findById(playlist._id).populate("songs.song");
    res.json({ message: "Playlist updated successfully", playlist: updated });
  } catch (err) {
    console.error("Error updating playlist:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
