import DjProfile from "../models/DjProfile.js";
import Playlist from "../models/Playlist.js";

// ✅ Create or update DJ profile
export const saveDjProfile = async (req, res) => {
  try {
    const { displayName, bio, classifications } = req.body;
    const existing = await DjProfile.findOne({ user: req.user._id });
    if (existing) {
      existing.displayName = displayName;
      existing.bio = bio;
      existing.classifications = classifications;
      await existing.save();
      return res.json({ message: "DJ profile updated", profile: existing });
    }
    const profile = await DjProfile.create({
      user: req.user._id,
      displayName,
      bio,
      classifications,
    });
    res.status(201).json({ message: "DJ profile created", profile });
  } catch (err) {
    console.error("Error saving DJ profile:", err);
    res.status(500).json({ message: "Failed to save DJ profile" });
  }
};

// ✅ Public: list all DJs
export const listDjs = async (_req, res) => {
  try {
    const profiles = await DjProfile.find().populate("user", "username");
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Failed to list DJs" });
  }
};

// ✅ Public: get one DJ profile + public playlists
export const getDjById = async (req, res) => {
  try {
    const profile = await DjProfile.findById(req.params.id).populate("user", "username");
    if (!profile) return res.status(404).json({ message: "DJ not found" });
    const playlists = await Playlist.find({ isPublic: true, owner: profile.user._id });
    res.json({ profile, playlists });
  } catch (err) {
    res.status(500).json({ message: "Failed to load DJ profile" });
  }
};
