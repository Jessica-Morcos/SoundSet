import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

const MIN_SEC = 0;
const MAX_SEC = 3 * 60 * 60; // 3 hours

// ✅ Create new playlist
export const createPlaylist = async (req, res) => {
  try {
    const { name, songs, classification } = req.body;
    const songDocs = await Song.find({ _id: { $in: songs.map((s) => s.songId) } });

    const totalDurationSec = songDocs.reduce((sum, s) => sum + s.durationSec, 0);
    if (totalDurationSec < MIN_SEC || totalDurationSec > MAX_SEC) {
      return res.status(400).json({ message: "Playlist must be between 1 and 3 hours." });
    }

    const playlist = await Playlist.create({
      name,
      owner: req.user._id,
      songs: songs.map((s) => ({ song: s.songId, order: s.order })),
      totalDurationSec,
      classification,
    });

    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get logged-in user playlists
export const getMyPlaylists = async (req, res) => {
  const lists = await Playlist.find({ owner: req.user._id }).populate("songs.song");
  res.json(lists);
};

// ✅ Toggle public/private (DJ/Admin only)
export const togglePublic = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    if (req.user.role !== "dj" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only DJs or admins can publish playlists" });
    }

    playlist.isPublic = !playlist.isPublic;
    await playlist.save();

    res.json({
      message: `Playlist is now ${playlist.isPublic ? "public" : "private"}`,
      playlist,
    });
  } catch (err) {
    console.error("Error toggling public status:", err);
    res.status(500).json({ message: "Failed to toggle playlist visibility" });
  }
};

// ✅ Clone a public playlist into the current user's account
export const clonePlaylist = async (req, res) => {
  try {
    const sourcePlaylist = await Playlist.findById(req.params.id).populate("songs.song");
    if (!sourcePlaylist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!sourcePlaylist.isPublic) {
      return res.status(403).json({ message: "This playlist is not public" });
    }

    const existing = await Playlist.findOne({
      owner: req.user._id,
      name: `${sourcePlaylist.name} (Copy)`,
    });
    if (existing) {
      return res.status(400).json({ message: "You already added this playlist." });
    }

    const cloned = new Playlist({
      owner: req.user._id,
      name: `${sourcePlaylist.name} (Copy)`,
      classification: sourcePlaylist.classification,
      songs: sourcePlaylist.songs.map((entry) => ({
        song: entry.song._id,
        order: entry.order,
      })),
      totalDurationSec: sourcePlaylist.totalDurationSec,
      isPublic: false,
    });

    await cloned.save();
    res.status(201).json({
      message: "Playlist added to your account!",
      playlist: cloned,
    });
  } catch (err) {
    console.error("Error cloning playlist:", err);
    res.status(500).json({ message: "Failed to clone playlist" });
  }
};

// ✅ Get a single playlist (owner access only)
export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate("songs.song");
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    playlist.songs = playlist.songs.filter(
      (entry) => entry.song && entry.song.restricted === false
    );

    res.json(playlist);
  } catch (err) {
    console.error("Error fetching playlist:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ NEW: List all public playlists (for Discover)
export const listPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true })
      .populate("owner", "username role")
      .populate("songs.song")
      .sort({ updatedAt: -1 });

    res.json(playlists);
  } catch (err) {
    console.error("Error fetching public playlists:", err);
    res.status(500).json({ message: "Failed to load public playlists" });
  }
};
