// server/src/controllers/djController.js
import DjProfile from "../models/DjProfile.js";
import Playlist from "../models/Playlist.js";


export const saveDjProfile = async (req, res) => {
  try {
    const existing = await DjProfile.findOne({ user: req.user._id });

    if (!existing) {
      const profile = await DjProfile.create({
        user: req.user._id,
        ...req.body,
      });
      return res.status(201).json({ message: "DJ profile created", profile });
    }

    Object.assign(existing, req.body);
    await existing.save();
    res.json({ message: "DJ profile updated", profile: existing });
  } catch (err) {
    console.error("DJ save error:", err);     // << 🆕 now covered
    res.status(500).json({ message: err.message });
  }
};


export const listDjs = async (_req, res) => {
  try {
    const djs = await DjProfile.find();
    res.json(djs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDjById = async (req, res) => {
  try {
    const profile = await DjProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: "DJ not found" });

    const playlists = await Playlist.find({
      owner: profile.user,
      isPublic: true,
    });

    res.json({ profile, playlists });
  } catch (err) {
    console.error("DJ fetch error:", err);     // << 🆕 now covered
    res.status(500).json({ message: err.message });
  }
};
