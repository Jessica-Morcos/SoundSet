import { useEffect, useState } from "react";
import {
  getAllSongs,
  addSong,
  updateSong,
  deleteSong,
  toggleRestricted,
} from "../api/songs";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminSongs() {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [editingSong, setEditingSong] = useState(null); // 👈 for edit modal
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

  useEffect(() => {
    const token = localStorage.getItem("token");
    getAllSongs(token).then((data) => {
      setSongs(data);
      setFiltered(data);
    });
  }, []);

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

  const uniqueGenres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const uniqueArtists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
  const uniqueYears = [...new Set(songs.map((s) => s.year).filter(Boolean))];

  // ✅ Upload helper
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
      return data.url;
    } catch (err) {
      console.error("Upload failed:", err);
      setUploading(false);
      alert("Upload failed");
    }
  };

  // ✅ Add Song
  const handleAddSong = async () => {
    const token = localStorage.getItem("token");
    if (!newSong.title.trim() || !newSong.audioUrl) {
      alert("Please enter title and upload audio file.");
      return;
    }
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
      alert("✅ Song added!");
    } else alert("❌ Failed to add song");
  };

  // ✅ Update Song
  const handleUpdate = async (song) => {
    const token = localStorage.getItem("token");
    const res = await updateSong(song._id, song, token);
    if (res.song) {
      setSongs((prev) =>
        prev.map((s) => (s._id === song._id ? res.song : s))
      );
      setEditingSong(null);
      alert("✅ Song updated!");
    } else alert("❌ Failed to update song");
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this song?")) return;
    const res = await deleteSong(id, token);
    if (res.message) {
      setSongs((prev) => prev.filter((s) => s._id !== id));
      alert("🗑️ Song deleted!");
    }
  };

  const handleToggleRestricted = async (id) => {
    const token = localStorage.getItem("token");
    const res = await toggleRestricted(id, token);
    if (res.song) {
      setSongs((prev) =>
        prev.map((s) => (s._id === id ? res.song : s))
      );
    }
  };

  return (
    <div className="min-h-screen text-white py-10 px-6 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold mb-6">Admin Song Management ⚙️</h1>

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
                <option key={val}>{val}</option>
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
          onClick={() =>
            setFilters({ genre: "", artist: "", year: "", restricted: "" })
          }
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
        >
          Reset Filters
        </button>
      </div>

      {/* Add Song Form */}
      <div className="bg-white text-gray-800 rounded-xl p-6 shadow-lg w-full max-w-3xl mb-8">
        <h2 className="text-xl font-semibold mb-3 text-indigo-600">
          Add New Song
        </h2>
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

        {/* Uploads */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600">
              Upload Audio
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file, "audio");
                  setNewSong({ ...newSong, audioUrl: url });
                }
              }}
              className="text-sm"
            />
            {newSong.audioUrl && (
              <audio controls src={newSong.audioUrl} className="mt-2 w-full" />
            )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-600">
              Upload Cover
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = await handleFileUpload(file, "cover");
                  setNewSong({ ...newSong, coverUrl: url });
                }
              }}
              className="text-sm"
            />
            {newSong.coverUrl && (
              <img
                src={newSong.coverUrl}
                alt="cover preview"
                className="mt-2 w-30 h-30 object-cover rounded-lg"
              />
            )}
          </div>
        </div>

        <button
          onClick={handleAddSong}
          disabled={uploading}
          className={`mt-6 px-5 py-2 rounded-lg text-white font-semibold ${
            uploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {uploading ? "Uploading..." : "➕ Add Song"}
        </button>
      </div>

      {/* Songs Table */}
      <div className="w-full max-w-6xl overflow-x-auto">
        <table className="w-full bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="p-3 text-left">Cover</th>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Artist</th>
              <th className="p-3 text-left">Genre</th>
              <th className="p-3 text-left">Year</th>
              <th className="p-3 text-center">Restricted</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((song) => (
              <tr
                key={song._id}
                className={`border-b ${
                  song.restricted
                    ? "bg-red-100 hover:bg-red-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <td className="p-3">
                  {song.coverUrl && (
                    <img
                      src={song.coverUrl}
                      alt="cover"
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
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => handleToggleRestricted(song._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    {song.restricted ? "Unlock" : "Lock"}
                  </button>
                  <button
                    onClick={() => setEditingSong(song)} // 👈 open edit modal
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(song._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✏️ Edit Song Modal */}
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
                    placeholder={field}
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

              <label className="text-sm font-semibold text-gray-600">
                Classification
              </label>
              <select
                value={editingSong.classification || "general"}
                onChange={(e) =>
                  setEditingSong({
                    ...editingSong,
                    classification: e.target.value,
                  })
                }
                className="p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {[
                  "general",
                  "wedding",
                  "corporate",
                  "birthday",
                  "club",
                  "charity",
                  "custom",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingSong.restricted || false}
                  onChange={(e) =>
                    setEditingSong({
                      ...editingSong,
                      restricted: e.target.checked,
                    })
                  }
                />
                Restricted
              </label>
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
