import { useEffect, useState } from "react";
import { getAllSongs } from "../api/songs";
import { createPlaylist } from "../api/playlist";
import toast from "react-hot-toast";

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

  // 🔍 Filters + search
  useEffect(() => {
    let result = songs;

    if (genreFilter) result = result.filter((s) => s.genre === genreFilter);
    if (artistFilter) result = result.filter((s) => s.artist === artistFilter);
    if (yearFilter) result = result.filter((s) => s.year === parseInt(yearFilter));

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

  // ⭐ Toggle select
  const toggleSong = (song) => {
    if (selected.find((s) => s._id === song._id)) {
      setSelected(selected.filter((s) => s._id !== song._id));
    } else {
      setSelected([...selected, song]);
    }
  };

  // ⭐ Create playlist
  const handleCreate = async () => {
    // Playlist name empty
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

      // success
      if (!res.message?.includes("Failed")) {
        toast.success("Playlist created!");
        setName("");
        setSelected([]);
      } else {
        toast.error(res.message || "Failed to create playlist");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while creating playlist");
    }
  };

  const uniqueGenres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const uniqueArtists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
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
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Playlist Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter playlist name"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4"
        />

        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Classification
        </label>
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
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Genres</option>
          {uniqueGenres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Artists</option>
          {uniqueArtists.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="bg-white text-gray-700 px-3 py-2 rounded-lg"
        >
          <option value="">All Years</option>
          {uniqueYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
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

      {/* Search */}
      <div className="w-full max-w-5xl mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs by title, artist, or genre..."
          className="w-full p-3 bg-white text-gray-800 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Songs grid */}
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Available Songs</h2>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-300">No songs found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((song) => (
              <div
                key={song._id}
                onClick={() => toggleSong(song)}
                className={`cursor-pointer bg-white text-gray-800 p-5 rounded-xl shadow-md transition ${
                  selected.find((s) => s._id === song._id)
                    ? "ring-4 ring-indigo-500"
                    : "hover:shadow-lg"
                }`}
              >
                <h3 className="text-lg font-bold">{song.title}</h3>
                <p className="text-sm text-gray-600">
                  {song.artist} • {song.genre || "Unknown"}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Duration: {Math.floor(song.durationSec / 60)} min
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
