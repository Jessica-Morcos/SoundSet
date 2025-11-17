// src/pages/PlaylistBuilder.jsx
import { useEffect, useState, useContext } from "react";
import { getAllSongs } from "../api/songs";
import { createPlaylist } from "../api/playlist";
import toast from "react-hot-toast";
import { Play, Plus, X, ListPlus } from "lucide-react";
import { PlayerContext } from "../context/PlayerContext";

export default function PlaylistBuilder() {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [classification, setClassification] = useState("general");
  const [genreFilter, setGenreFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [search, setSearch] = useState("");

  const { playSong, addToQueue } = useContext(PlayerContext);

  // Load songs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to view songs");
      return;
    }

    getAllSongs(token).then((data) => {
      if (Array.isArray(data)) {
        const safe = data.filter((s) => !s.restricted);
        setSongs(safe);
        setFiltered(safe);
      } else {
        setSongs([]);
        setFiltered([]);
        toast.error("Failed to load songs");
      }
    });
  }, []);

  // Filters logic
  useEffect(() => {
    let result = songs;

    if (genreFilter) result = result.filter((s) => s.genre === genreFilter);
    if (artistFilter) result = result.filter((s) => s.artist === artistFilter);
    if (yearFilter)
      result = result.filter((s) => s.year === parseInt(yearFilter));

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.genre && s.genre.toLowerCase().includes(q))
      );
    }

    setFiltered(result);
  }, [genreFilter, artistFilter, yearFilter, search, songs]);

  // Add to Playlist Selection
  const addSongToSelection = (song) => {
    if (selected.some((s) => s._id === song._id)) {
      toast("Already in this playlist", { icon: "ℹ️" });
      return;
    }
    setSelected((prev) => [...prev, song]);
    toast.success(`Added "${song.title}"`);
  };

  const removeFromSelection = (id) => {
    setSelected((prev) => prev.filter((s) => s._id !== id));
    toast("Removed from playlist", { icon: "🗑️" });
  };

  // Create playlist
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in to create a playlist");
      return;
    }

    const data = {
      name,
      classification,
      songs: selected.map((s, i) => ({ songId: s._id, order: i })),
    };

    try {
      const res = await createPlaylist(data, token);

      if (!res.message?.includes("Failed")) {
        toast.success("Playlist created!");
        setName("");
        setSelected([]);
      } else toast.error(res.message || "Failed to create playlist");
    } catch (err) {
      console.error(err);
      toast.error("Server error while creating playlist");
    }
  };

  const uniqueGenres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const uniqueArtists = [
    ...new Set(songs.map((s) => s.artist).filter(Boolean)),
  ];
  const uniqueYears = [...new Set(songs.map((s) => s.year).filter(Boolean))];

  const classifications = [
    "general",
    "wedding",
    "corporate",
    "birthday",
    "club",
    "charity",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-6 text-white pb-[10rem]">
      <h1 className="text-4xl font-extrabold mb-4">Create Playlist</h1>
      <p className="text-gray-200 mb-8">Choose songs to build your custom playlist</p>

      {/* Playlist name + classification */}
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl mb-10">
        <label className="block text-sm font-semibold text-gray-600 mb-2">Playlist Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter playlist name"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <label className="block text-sm font-semibold text-gray-600 mb-2">Classification</label>
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        >
          {classifications.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg w-full hover:bg-indigo-700 transition"
        >
          Save Playlist
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Genres</option>
          {uniqueGenres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Artists</option>
          {uniqueArtists.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Years</option>
          {uniqueYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <button
          onClick={() => {
            setGenreFilter("");
            setArtistFilter("");
            setYearFilter("");
            setSearch("");
            toast.success("Filters reset");
          }}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300"
        >
          Reset Filters
        </button>
      </div>

      {/* Search bar */}
      <div className="w-full max-w-5xl mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs by title, artist, or genre..."
          className="w-full p-3 bg-white text-gray-800 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Selected Playlist Preview */}
      {selected.length > 0 && (
        <div className="w-full max-w-5xl mb-6">
          <div className="bg-white/95 text-gray-900 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">
                Your Playlist{" "}
                <span className="text-gray-500 text-sm">
                  ({selected.length} songs)
                </span>
              </h2>

              <button
                onClick={() => setSelected([])}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {selected.map((song) => (
                <div
                  key={song._id}
                  className="flex items-center justify-between bg-gray-100 rounded-xl px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{song.title}</span>
                    <span className="text-xs text-gray-600">
                      {song.artist} • {song.genre}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromSelection(song._id)}
                    className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Songs */}
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Available Songs</h2>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-300">No songs found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((song) => {
              const isSelected = selected.some((s) => s._id === song._id);

              return (
                <div
                  key={song._id}
                  className={`bg-white text-gray-800 p-5 rounded-xl shadow-md transition relative ${
                    isSelected
                      ? "border-2 border-indigo-500 shadow-indigo-300/40"
                      : "hover:shadow-lg"
                  }`}
                >
                  <h3 className="text-lg font-bold">{song.title}</h3>
                  <p className="text-sm text-gray-600">
                    {song.artist} • {song.genre}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Duration: {Math.floor(song.durationSec / 60)} min
                  </p>

                  {/* ICON ROW */}
                  <div className="flex items-center justify-end gap-2 mt-4">

                    {/* ▶ PLAY */}
                    <button
                      type="button"
                      onClick={() => playSong(song)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Play size={16} />
                    </button>

                    {/* ➕ ADD TO PLAYLIST */}
                    <button
                      type="button"
                      onClick={() => addSongToSelection(song)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "border border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                      }`}
                    >
                      <Plus size={18} />
                    </button>

                    {/* 📥 ADD TO QUEUE */}
                    <button
                      type="button"
                      onClick={() => {
                        addToQueue(song);
                        toast.success("Added to queue");
                      }}
                      className="w-8 h-8 rounded-full border border-purple-500 text-purple-600 hover:bg-purple-50 flex items-center justify-center"
                    >
                      <ListPlus size={18} />
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
