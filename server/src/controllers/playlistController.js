import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

const MIN_SEC = 0;
const MAX_SEC = 3 * 60 * 60; // 3 hours

// ✅ Create new playlist
export const createPlaylist = async (req, res) => {
  try {
    const { name, songs = [], classification = "general" } = req.body;

    // If no songs provided → create an empty playlist
    if (!Array.isArray(songs) || songs.length === 0) {
      const playlist = await Playlist.create({
        name,
        owner: req.user._id,
        songs: [],
        totalDurationSec: 0,
        classification
      });

      return res.status(201).json(playlist);
    }

    // If songs exist → validate them
    const songDocs = await Song.find({
      _id: { $in: songs.map((s) => s.songId) }
    });

    const totalDurationSec = songDocs.reduce((sum, s) => sum + s.durationSec, 0);

    if (totalDurationSec < MIN_SEC || totalDurationSec > MAX_SEC) {
      return res
        .status(400)
        .json({ message: "Playlist must be between 1 and 3 hours." });
    }

    const playlist = await Playlist.create({
      name,
      owner: req.user._id,
      songs: songs.map((s) => ({
        song: s.songId,
        order: s.order || 0
      })),
      totalDurationSec,
      classification
    });

    return res.status(201).json(playlist);

  } catch (err) {
    console.error("Playlist creation error:", err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get logged-in user playlists
export const getMyPlaylists = async (req, res) => {
  const lists = await Playlist.find({ owner: req.user._id }).populate("songs.song");
  res.json(lists);
};

export const togglePublic = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const isOwner = playlist.owner.toString() === req.user._id.toString();

    // ADMIN → can toggle any playlist
    if (req.user.role === "admin") {
      playlist.isPublic = !playlist.isPublic;
      await playlist.save();

      return res.json({
        message: `Playlist is now ${playlist.isPublic ? "public" : "private"}`,
        playlist,
      });
    }

    // DJ → can ONLY toggle their own playlist
    if (req.user.role === "dj") {
      if (!isOwner) {
        return res.status(403).json({ message: "DJs can only publish their own playlists" });
      }

      playlist.isPublic = !playlist.isPublic;
      await playlist.save();

      return res.json({
        message: `Playlist is now ${playlist.isPublic ? "public" : "private"}`,
        playlist,
      });
    }

    // Regular user → never allowed
    return res.status(403).json({ message: "Only DJs or admins can publish playlists" });

  } catch (err) {
    console.error("Error toggling public:", err);
    res.status(500).json({ message: "Failed to toggle playlist visibility" });
  }
};



export const clonePlaylist = async (req, res) => {
  try {
    const sourcePlaylist = await Playlist.findById(req.params.id).populate("songs.song");
    if (!sourcePlaylist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    if (!sourcePlaylist.isPublic) {
      return res.status(403).json({ message: "This playlist is not public" });
    }

    // Prevent duplicate copies
    const existing = await Playlist.findOne({
      owner: req.user._id,
      name: `${sourcePlaylist.name} (Copy)`,
    });
    if (existing) {
      return res.status(400).json({ message: "You already added this playlist." });
    }

    // ⭐ RECALCULATE duration if missing or invalid
    let totalDurationSec = sourcePlaylist.totalDurationSec;

    if (!totalDurationSec || isNaN(totalDurationSec)) {
      totalDurationSec = sourcePlaylist.songs.reduce((sum, entry) => {
        return sum + (entry.song?.durationSec || 0);
      }, 0);
    }

    const cloned = new Playlist({
      owner: req.user._id,
      name: `${sourcePlaylist.name} (Copy)`,
      classification: sourcePlaylist.classification,
      songs: sourcePlaylist.songs.map((entry) => ({
        song: entry.song._id,
        order: entry.order,
      })),
      totalDurationSec,
      isPublic: false,
    });

    await cloned.save();
    await cloned.populate("owner", "username role");

    res.status(201).json({
      message: "Playlist added to your account!",
      playlist: cloned,
    });

  } catch (err) {
    console.error("Error cloning playlist:", err);
    res.status(500).json({ message: "Failed to clone playlist" });
  }
};


export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("songs.song")
      .populate("owner", "username role");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // 🧠 Allow if it's public or owned by the user
    const isOwner =
      req.user && playlist.owner?._id?.toString() === req.user._id.toString();
    if (!playlist.isPublic && !isOwner) {
      return res.status(403).json({ message: "This playlist is private." });
    }

    // ✅ Filter out restricted/deleted songs
    playlist.songs = playlist.songs.filter(
      (entry) => entry.song && entry.song.restricted === false
    );

    // Return full playlist with songs
    res.json(playlist);
  } catch (err) {
    console.error("Error fetching playlist:", err);
    res.status(500).json({ message: "Error fetching playlist" });
  }
};


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
