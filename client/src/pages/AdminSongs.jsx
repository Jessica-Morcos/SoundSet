import { useEffect, useState } from "react";
import {
  getAllSongs,
  addSong,
  updateSong,
  deleteSong,
  toggleRestricted,
} from "../api/songs";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminSongs() {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [editingSong, setEditingSong] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    genre: "",
    year: "",
    durationSec: "",
    audioUrl: "",
    coverUrl: "",
  });

  const [filters, setFilters] = useState({
    genre: "",
    artist: "",
    year: "",
    restricted: "",
  });

  // Load all songs
  useEffect(() => {
    const token = localStorage.getItem("token");
    getAllSongs(token).then((data) => {
      if (!Array.isArray(data)) {
        toast.error("Failed to load songs");
        return;
      }
      setSongs(data);
      setFiltered(data);
    });
  }, []);

  // Apply filters
  useEffect(() => {
    let result = songs;
    if (filters.genre) result = result.filter((s) => s.genre === filters.genre);
    if (filters.artist)
      result = result.filter((s) => s.artist === filters.artist);
    if (filters.year)
      result = result.filter((s) => s.year === parseInt(filters.year));
    if (filters.restricted !== "")
      result = result.filter(
        (s) => s.restricted === (filters.restricted === "true")
      );
    setFiltered(result);
  }, [filters, songs]);

  // Upload audio/cover
  const handleFileUpload = async (file, type) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${BASE_URL}/upload/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      setUploading(false);

      if (!data.url) {
        toast.error("Upload failed");
        return null;
      }

      toast.success(`${type === "audio" ? "Audio" : "Cover"} uploaded`);
      return data.url;

    } catch (err) {
      console.error("Upload failed:", err);
      setUploading(false);
      toast.error("Upload failed");
      return null;
    }
  };

  // Add new song
  const handleAddSong = async () => {
    if (!newSong.title.trim() || !newSong.audioUrl) {
      toast.error("Please enter a title and upload audio.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await addSong(newSong, token);

      if (res.song) {
        setSongs((prev) => [...prev, res.song]);

        setNewSong({
          title: "",
          artist: "",
          genre: "",
          year: "",
          durationSec: "",
          audioUrl: "",
          coverUrl: "",
        });

        toast.success("Song added!");
      } else {
        toast.error("Failed to add song");
      }
    } catch (err) {
      toast.error("Server error while adding song");
    }
  };

  // Update song
  const handleUpdate = async (song) => {
    const token = localStorage.getItem("token");

    try {
      const res = await updateSong(song._id, song, token);
      if (res.song) {
        setSongs((prev) =>
          prev.map((s) => (s._id === song._id ? res.song : s))
        );
        setEditingSong(null);
        toast.success("Song updated!");
      } else {
        toast.error("Failed to update song");
      }
    } catch (err) {
      toast.error("Server error while updating song");
    }
  };

  // Delete song
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    toast(
      (t) => (
        <span>
          Delete song?
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await deleteSong(id, token);

                  if (res.message) {
                    setSongs((prev) => prev.filter((s) => s._id !== id));
                    toast.success("Song deleted");
                  }
                } catch (err) {
                  toast.error("Failed to delete song");
                }
              }}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Yes
            </button>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 px-3 py-1 rounded"
            >
              No
            </button>
          </div>
        </span>
      ),
      { duration: 6000 }
    );
  };

  // Toggle restricted
  const handleToggleRestricted = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await toggleRestricted(id, token);

      if (res.song) {
        setSongs((prev) =>
          prev.map((s) => (s._id === id ? res.song : s))
        );
        toast.success(res.song.restricted ? "Song restricted" : "Song unlocked");
      } else {
        toast.error("Failed to update restriction");
      }
    } catch (err) {
      toast.error("Server error toggling restricted status");
    }
  };

  return (
    <div className="min-h-screen text-white py-10 px-6 flex flex-col items-center pb-[10rem]">
      <h1 className="text-4xl font-extrabold mb-6">Admin Song Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {["genre", "artist", "year"].map((key) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            className="bg-white text-gray-700 px-3 py-2 rounded-lg"
          >
            <option value="">
              All {key.charAt(0).toUpperCase() + key.slice(1)}s
            </option>
            {Array.from(new Set(songs.map((s) => s[key]).filter(Boolean))).map(
              (val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              )
            )}
          </select>
        ))}

        <select
          value={filters.restricted}
          onChange={(e) =>
            setFilters({ ...filters, restricted: e.target.value })
          }
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Songs</option>
          <option value="false">Unrestricted</option>
          <option value="true">Restricted</option>
        </select>

        <button
          onClick={() => {
            setFilters({ genre: "", artist: "", year: "", restricted: "" });
            toast.success("Filters reset");
          }}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
        >
          Reset Filters
        </button>
      </div>

      {/* Add Song Form */}
      <div className="bg-white text-gray-800 rounded-xl p-6 shadow-lg w-full max-w-3xl mb-8">
        <h2 className="text-xl font-semibold mb-3 text-indigo-600">Add New Song</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {["title", "artist", "genre", "year", "durationSec"].map((field) => (
            <input
              key={field}
              placeholder={
                field === "durationSec"
                  ? "Duration (sec)"
                  : field.charAt(0).toUpperCase() + field.slice(1)
              }
              value={newSong[field]}
              onChange={(e) =>
                setNewSong({ ...newSong, [field]: e.target.value })
              }
              className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          ))}
        </div>

        {/* Upload Fields */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">

          {/* Audio */}
          <div>
            <label className="text-sm font-semibold">Upload Audio</label>
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file, "audio");
                  if (url) setNewSong({ ...newSong, audioUrl: url });
                }
              }}
            />
          </div>

          {/* Cover */}
          <div>
            <label className="text-sm font-semibold">Upload Cover</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file, "cover");
                  if (url) setNewSong({ ...newSong, coverUrl: url });
                }
              }}
            />
          </div>
        </div>

        <button
          onClick={handleAddSong}
          disabled={uploading}
          className={`mt-6 px-5 py-2 rounded-lg text-white font-semibold ${
            uploading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {uploading ? "Uploading..." : "➕ Add Song"}
        </button>
      </div>

      {/* Song Table */}
      <div className="w-full max-w-6xl overflow-x-auto">
        <table className="w-full bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="p-3">Cover</th>
              <th className="p-3">Title</th>
              <th className="p-3">Artist</th>
              <th className="p-3">Genre</th>
              <th className="p-3">Year</th>
              <th className="p-3">Restricted</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((song) => (
              <tr key={song._id} className="border-b hover:bg-gray-100">

                <td className="p-3">
                  {song.coverUrl && (
                    <img
                      src={song.coverUrl}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  )}
                </td>

                <td className="p-3">{song.title}</td>
                <td className="p-3">{song.artist}</td>
                <td className="p-3">{song.genre}</td>
                <td className="p-3">{song.year}</td>

                <td className="p-3 text-center">
                  {song.restricted ? "🔒" : "✅"}
                </td>

                <td className="p-3">
                  <div className="flex flex-wrap gap-2 justify-center">

                    <button
                      onClick={() => handleToggleRestricted(song._id)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
                    >
                      {song.restricted ? "Unlock" : "Lock"}
                    </button>

                    <button
                      onClick={() => setEditingSong(song)}
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => handleDelete(song._id)}
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                      🗑️
                    </button>

                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingSong && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-indigo-600">
              Edit Song
            </h2>

            <div className="grid gap-3">
              {["title", "artist", "genre", "year", "durationSec"].map(
                (field) => (
                  <input
                    key={field}
                    value={editingSong[field] || ""}
                    onChange={(e) =>
                      setEditingSong({
                        ...editingSong,
                        [field]:
                          field === "year" || field === "durationSec"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                )
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingSong(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => handleUpdate(editingSong)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
