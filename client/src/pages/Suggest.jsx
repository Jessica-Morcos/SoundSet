import { useEffect, useState } from "react";
import { getAllSongs } from "../api/songs";
import { getMyPreferences, updateMyPreferences } from "../api/user";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Suggestions() {
  const [songs, setSongs] = useState([]);
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

  // 🔹 Load available genres/artists/years and current preferences
  useEffect(() => {
    async function loadData() {
      try {
        const [songData, prefData] = await Promise.all([
          getAllSongs(token),
          getMyPreferences(token),
        ]);

        const genres = [...new Set(songData.map((s) => s.genre).filter(Boolean))];
        const bands = [...new Set(songData.map((s) => s.artist).filter(Boolean))];
        const years = [
          ...new Set(songData.map((s) => s.year).filter((y) => y && !isNaN(y))),
        ];

        setOptions({ genres, bands, years });
        setPreferences({
          genres: prefData.genres || [],
          bands: prefData.bands || [],
          years: prefData.years || [],
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

    useEffect(() => {
      if (!token) return;
      const loadSuggestions = async () => {
        try {
          const res = await fetch(`${BASE_URL}/songs/suggest`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setSongs(data); // ✅ replace, never append
        } catch (err) {
          console.error(err);
        }
      };
      loadSuggestions();
    }, []); 

  const toggleValue = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSave = async () => {
  toast.loading("Saving preferences...");
  try {
    const res = await updateMyPreferences(preferences, token);
    toast.dismiss();
    toast.success("Preferences updated!");
    setPreferences(res.preferences);

    setSongs([]); // clear
    const refreshed = await fetch(`${BASE_URL}/songs/suggest`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
    setSongs(refreshed); // replace

  } catch (err) {
    toast.dismiss();
    toast.error("Failed to save preferences");
  }
};




  if (loading)
    return <p className="text-white text-center mt-10">Loading preferences...</p>;

  return (
    <div className="p-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Your Music Preferences 🎶</h1>

      {/* Preferences Section */}
      <div className="bg-white text-gray-800 rounded-2xl p-6 w-full max-w-3xl mx-auto shadow-xl mb-10">
        {/* Genres */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Genres</h2>
          <div className="flex flex-wrap gap-2">
            {options.genres.length === 0 ? (
              <p className="text-sm text-gray-500">No genres found</p>
            ) : (
              options.genres.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleValue("genres", g)}
                  className={`px-3 py-1 rounded-full border ${
                    preferences.genres.includes(g)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {g}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Artists */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Artists</h2>
          <div className="flex flex-wrap gap-2">
            {options.bands.length === 0 ? (
              <p className="text-sm text-gray-500">No artists found</p>
            ) : (
              options.bands.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleValue("bands", a)}
                  className={`px-3 py-1 rounded-full border ${
                    preferences.bands.includes(a)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {a}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Years */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Favorite Years</h2>
          <div className="flex flex-wrap gap-2">
            {options.years.length === 0 ? (
              <p className="text-sm text-gray-500">No years found</p>
            ) : (
              options.years.map((y) => (
                <button
                  key={y}
                  onClick={() => toggleValue("years", y)}
                  className={`px-3 py-1 rounded-full border ${
                    preferences.years.includes(y)
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {y}
                </button>
              ))
            )}
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

      {/* Recommended Songs */}
      <h2 className="text-3xl font-bold mb-6">Recommended For You 🎧</h2>
      {songs.length === 0 ? (
        <p>No suggestions yet. Play more songs!</p>
      ) : (
        <ul className="grid md:grid-cols-3 gap-6">
          {songs.map((song) => (
            <li
              key={song._id}
              className="bg-white text-gray-800 rounded-xl shadow-lg p-5 hover:scale-[1.02] transition"
            >
              <h3 className="text-lg font-bold">{song.title}</h3>
              <p>{song.artist}</p>
              <p className="text-sm text-gray-500">{song.genre}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
