// server/src/controllers/playlistController.js
import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";

const MIN_SEC = 0;      // 1 hour
const MAX_SEC = 3 * 60 * 60;  // 3 hours

export const createPlaylist = async (req, res) => {
  try {
    const { name, songs, classification } = req.body;
    // songs: [{songId, order}]
    const songDocs = await Song.find({ _id: { $in: songs.map(s => s.songId) } });

    const totalDurationSec = songDocs.reduce((sum, s) => sum + s.durationSec, 0);

    if (totalDurationSec < MIN_SEC || totalDurationSec > MAX_SEC) {
      return res.status(400).json({ message: "Playlist must be between 1 and 3 hours." });
    }

    const playlist = await Playlist.create({
      name,
      owner: req.user._id,
      songs: songs.map(s => ({ song: s.songId, order: s.order })),
      totalDurationSec,
      classification
    });

    res.status(201).json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyPlaylists = async (req, res) => {
  const lists = await Playlist.find({ owner: req.user._id }).populate("songs.song");
  res.json(lists);
};

// ✅ Get single playlist by ID (for PlaylistView.jsx)
export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id).populate("songs.song");
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Make sure only the owner can access their playlist
    if (playlist.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(playlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
