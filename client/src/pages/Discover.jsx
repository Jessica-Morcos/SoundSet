import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Discover() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/playlist/discover`)
      .then((res) => res.json())
      .then((data) => setPlaylists(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error loading public playlists:", err));
  }, []);

  return (
    <div className="p-10 text-white min-h-screen pb-[10rem]">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">
        Discover Public Playlists
      </h1>

      {playlists.length === 0 ? (
        <p className="text-center text-gray-400">No public playlists yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <div
              key={pl._id}
              className="bg-white text-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="font-bold text-xl mb-1 text-indigo-700">{pl.name}</h2>
              <p className="text-sm text-gray-500 mb-2 italic">
                {pl.classification || "General"}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                by <span className="font-semibold">{pl.owner?.username}</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {pl.songs?.length || 0} songs
              </p>
              <Link
                to={`/playlist/${pl._id}`}
                className="block bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-center"
              >
                View Playlist
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}