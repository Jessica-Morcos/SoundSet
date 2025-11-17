// src/pages/Suggestions.jsx
import { useEffect, useState, useContext } from "react";
import { getAllSongs } from "../api/songs";
import { getMyPreferences, updateMyPreferences } from "../api/user";
import { getMyPlaylists, addSongToPlaylist } from "../api/playlist";
import { PlayerContext } from "../context/PlayerContext";

import { Play, ListPlus, Plus } from "lucide-react";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const decadeToYears = {
  "1990s": [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
  "2000s": [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009],
  "2010s": [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019],
  "2020s": [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029],
};

const yearsToDecades = (years) => {
  const result = new Set();
  years.forEach((y) => {
    if (y >= 1990 && y < 2000) result.add("1990s");
    else if (y >= 2000 && y < 2010) result.add("2000s");
    else if (y >= 2010 && y < 2020) result.add("2010s");
    else if (y >= 2020 && y < 2030) result.add("2020s");
  });
  return [...result];
};

export default function Suggestions() {
  const { playSong, addToQueue } = useContext(PlayerContext);

  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const [preferences, setPreferences] = useState({
    genres: [],
    bands: [],
    years: [],
  });

  const [options, setOptions] = useState({
    genres: [],
    bands: [],
    years: [],
  });

  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // ---------------- LOAD PREFERENCES + PLAYLISTS ----------------
  useEffect(() => {
    async function loadData() {
      try {
        const [songData, prefData, playlistData] = await Promise.all([
          getAllSongs(token),
          getMyPreferences(token),
          getMyPlaylists(token),
        ]);

        setPlaylists(playlistData || []);

        let genres = [...new Set(songData.map((s) => s.genre).filter(Boolean))].sort();
        let bands = [...new Set(songData.map((s) => s.artist).filter(Boolean))].sort();
        let years = [...new Set(songData.map((s) => s.year).filter((y) => y && !isNaN(y)))];

        setOptions({
          genres,
          bands,
          years: yearsToDecades(years),
        });

        setPreferences({
          genres: prefData.genres || [],
          bands: prefData.bands || [],
          years: yearsToDecades(prefData.years || []),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load preferences");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // ---------------- LOAD SUGGESTED SONGS ----------------
  useEffect(() => {
    if (loading || !token) return;

    async function load() {
      const res = await fetch(`${BASE_URL}/songs/suggest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSongs(await res.json());
    }

    load();
  }, [loading]);

  // ---------------- SAVE PREFERENCES ----------------
  const handleSave = async () => {
    toast.loading("Saving preferences...");

    const convertedYears = preferences.years.flatMap((d) => decadeToYears[d] || []);

    try {
      const payload = {
        genres: preferences.genres,
        bands: preferences.bands,
        years: convertedYears,
      };

      const res = await updateMyPreferences(payload, token);

      toast.dismiss();
      toast.success("Preferences saved!");

      setPreferences({
        genres: res.preferences.genres,
        bands: res.preferences.bands,
        years: yearsToDecades(res.preferences.years),
      });

      const refreshed = await fetch(`${BASE_URL}/songs/suggest`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      setSongs(refreshed);
    } catch {
      toast.dismiss();
      toast.error("Failed to save preferences");
    }
  };

  // ---------------- ADD SONG TO PLAYLIST ----------------
  const handleAddSong = async (playlistId, songId) => {
    try {
      const res = await addSongToPlaylist(playlistId, songId, token);
      toast.success(res.message || "Added!");
      setOpenMenu(null);
    } catch (err) {
      toast.error(err.message || "Failed to add song.");
    }
  };

  if (loading)
    return <p className="text-white text-center mt-10">Loading preferences...</p>;

  // ========================================================================
  //                                UI
  // ========================================================================
  return (
    <div className="p-8 text-white min-h-screen pb-[10rem]">
      <h1 className="text-3xl font-bold mb-8">Your Music Preferences</h1>

      {/* -------------------------------- PREFS PANEL -------------------------------- */}
      <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-3xl mx-auto shadow-xl mb-10">

        {/* Genres */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Genres</h2>
          <div className="flex flex-wrap gap-2">
            {options.genres.map((g) => (
              <button
                key={g}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    genres: prev.genres.includes(g)
                      ? prev.genres.filter((x) => x !== g)
                      : [...prev.genres, g],
                  }))
                }
                className={`px-3 py-1 rounded-full border ${
                  preferences.genres.includes(g)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {/* Artists */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Artists</h2>
          <div className="flex flex-wrap gap-2">
            {options.bands.map((a) => (
              <button
                key={a}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    bands: prev.bands.includes(a)
                      ? prev.bands.filter((x) => x !== a)
                      : [...prev.bands, a],
                  }))
                }
                className={`px-3 py-1 rounded-full border ${
                  preferences.bands.includes(a)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </section>

        {/* Decades */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Decades</h2>
          <div className="flex flex-wrap gap-2">
            {options.years.map((d) => (
              <button
                key={d}
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    years: prev.years.includes(d)
                      ? prev.years.filter((x) => x !== d)
                      : [...prev.years, d],
                  }))
                }
                className={`px-3 py-1 rounded-full border ${
                  preferences.years.includes(d)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <div className="text-center">
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* -------------------------------- SONG CARDS -------------------------------- */}
      <h2 className="text-3xl font-bold mb-6">Recommended For You 🎧</h2>

      {songs.length === 0 ? (
        <p>No suggestions yet. Play more songs!</p>
      ) : (
        <ul className="grid md:grid-cols-3 gap-6">
          {songs.map((song) => (
            <li
              key={song._id}
              className="group bg-white text-gray-800 rounded-xl shadow-lg p-5 relative"
            >
              {/* ▶ / ➕ queue / ➕ playlist */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">

                {/* PLAY */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSong(song);
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm"
                >
                  <Play size={18} className="text-indigo-700" />
                </button>

                {/* ADD TO QUEUE */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToQueue(song);
                    toast.success("Added to queue!");
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm"
                >
                  <ListPlus size={18} className="text-purple-700" />
                </button>

                {/* ADD TO PLAYLIST */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu((prev) => (prev === song._id ? null : song._id));
                  }}
                  className="p-2 rounded-full bg-white/80 hover:bg-white shadow-sm"
                >
                  <Plus size={18} className="text-green-700" />
                </button>
              </div>

              {/* Song info */}
              <h3 className="text-lg font-bold">{song.title}</h3>
              <p>{song.artist}</p>
              <p className="text-sm text-gray-500">{song.genre}</p>

              {/* PLAYLIST DROPDOWN */}
              {openMenu === song._id && (
                <div className="absolute top-12 right-3 bg-white text-gray-800 shadow-xl rounded-lg p-3 w-48 z-50">
                  <p className="font-semibold mb-2">Add to playlist:</p>

                  {playlists.length === 0 ? (
                    <p className="text-sm text-gray-500">No playlists yet.</p>
                  ) : (
                    playlists.map((pl) => (
                      <button
                        key={pl._id}
                        onClick={() => handleAddSong(pl._id, song._id)}
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                      >
                        {pl.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
