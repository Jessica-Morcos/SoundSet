import { useEffect, useState } from "react";
import { getAllSongs } from "../api/songs";
import { createPlaylist } from "../api/playlist";

export default function PlaylistBuilder() {
  const [songs, setSongs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [classification, setClassification] = useState("general"); // 👈 new
  const [genreFilter, setGenreFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token in localStorage – user must log in.");
      return;
    }

    getAllSongs(token).then((data) => {
      if (Array.isArray(data)) {
        const safe = data.filter((s) => !s.restricted);
        setSongs(safe);
        setFiltered(safe);
      } else {
        console.warn("Unexpected songs response:", data);
        setSongs([]);
        setFiltered([]);
      }
    });
  }, []);

  useEffect(() => {
    let result = songs;
    if (genreFilter) result = result.filter((s) => s.genre === genreFilter);
    if (artistFilter) result = result.filter((s) => s.artist === artistFilter);
    if (yearFilter)
      result = result.filter((s) => s.year === parseInt(yearFilter));
    setFiltered(result);
  }, [genreFilter, artistFilter, yearFilter, songs]);

  const toggleSong = (song) => {
    if (selected.find((s) => s._id === song._id)) {
      setSelected(selected.filter((s) => s._id !== song._id));
    } else {
      setSelected([...selected, song]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert("Please enter a playlist name.");

    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in to create a playlist.");

    const data = {
      name,
      classification, // 👈 now dynamic
      songs: selected.map((s, i) => ({ songId: s._id, order: i })),
    };

    const res = await createPlaylist(data, token);
    alert(res.message || "Playlist created!");
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
    "custom",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-6 text-white">
      <h1 className="text-4xl font-extrabold mb-4">Create Playlist</h1>
      <p className="text-gray-200 mb-8">
        Choose songs to build your custom playlist 🎧
      </p>

      {/* Playlist name & classification */}
      <div className="bg-white text-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl mb-10">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Playlist Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter playlist name"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
        />

        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Classification
        </label>
        <select
          value={classification}
          onChange={(e) => setClassification(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
        >
          {classifications.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
          className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition w-full"
        >
          Save Playlist
        </button>
      </div>

      {/* 🔍 Filter Bar */}
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
          }}
          className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Reset Filters
        </button>
      </div>

      {/* Songs */}
      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Available Songs</h2>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-300">No songs available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((song) => (
              <div
                key={song._id}
                onClick={() => toggleSong(song)}
                className={`cursor-pointer bg-white text-gray-800 p-5 rounded-xl shadow-md transition transform hover:scale-[1.02] ${
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
