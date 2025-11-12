// server/src/routes/playlistRoutes.js
import express from "express";
import Playlist from "../models/Playlist.js"; // ✅ ADD THIS IMPORT
import {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
} from "../controllers/playlistController.js";
import { authMiddleware } from "../middleware/auth.js";
import { togglePublic } from "../controllers/playlistController.js";
import { clonePlaylist } from "../controllers/playlistController.js";





const router = express.Router();

router.post("/", authMiddleware, createPlaylist);
router.get("/mine", authMiddleware, getMyPlaylists);
router.get("/:id", authMiddleware, getPlaylistById);
router.put("/:id/publish", authMiddleware, togglePublic);
router.post("/:id/clone", authMiddleware, clonePlaylist);

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // ✅ Ensure only the owner can delete
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ❌ Do NOT delete songs; just remove the playlist
    await Playlist.findByIdAndDelete(req.params.id);

    // ✅ Explicitly return a JSON 200 OK
    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update playlist (rename, reorder, or replace songs)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Ensure only owner can edit
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ Update name or classification if provided
    if (req.body.name) playlist.name = req.body.name;
    if (req.body.classification) playlist.classification = req.body.classification;

    // ✅ Replace songs if provided
    if (req.body.songs && Array.isArray(req.body.songs)) {
      // Map to expected schema format
      playlist.songs = req.body.songs.map((s, i) => ({
        song: s.songId,
        order: s.order ?? i,
      }));

      // Recalculate total duration
      const Song = (await import("../models/Song.js")).default;
      const songDocs = await Song.find({ _id: { $in: playlist.songs.map(s => s.song) } });
      playlist.totalDurationSec = songDocs.reduce((sum, s) => sum + s.durationSec, 0);

      // Enforce duration limits
      if (playlist.totalDurationSec < 0 || playlist.totalDurationSec > 3 * 60 * 60) {
        return res.status(400).json({
          message: "Playlist duration must be between 0 and 3 hours.",
        });
      }
    }

    await playlist.save();

    // Repopulate for frontend
    const updated = await Playlist.findById(playlist._id).populate("songs.song");
    res.json({ message: "Playlist updated successfully", playlist: updated });
  } catch (err) {
    console.error("Error updating playlist:", err);
    res.status(500).json({ message: err.message });
  }
});




export default router;
