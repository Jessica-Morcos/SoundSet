import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import {
  getMyPlaylists,
  deletePlaylist,
} from "../api/playlist";

import toast from "react-hot-toast";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const navigate = useNavigate();

  // Load user + playlists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const userData = await getCurrentUser(token);
        const playlistData = await getMyPlaylists(token);

        setUser(userData);
        setPlaylists(playlistData);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      }
    };

    loadData();
  }, [navigate]);

  // Navigate to playlist view
  const handleOpenPlaylist = (id) => {
    navigate(`/playlist/${id}`);
  };

  // 🔥 Toast-based confirm dialog
  const confirmDelete = (name) =>
    new Promise((resolve) => {
      toast(
        (t) => (
          <div className="text-center">
            <p className="font-semibold text-sm">
              Delete "{name}"?
            </p>

            <div className="flex justify-center gap-3 mt-3">
              <button
                onClick={() => {
                  resolve(true);
                  toast.dismiss(t.id);
                }}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Delete
              </button>

              <button
                onClick={() => {
                  resolve(false);
                  toast.dismiss(t.id);
                }}
                className="bg-gray-300 px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

  // ❌ Delete playlist with toast notifications
  const handleDelete = async (id, name) => {
    const token = localStorage.getItem("token");

    const confirmed = await confirmDelete(name);
    if (!confirmed) return;

    try {
      const res = await deletePlaylist(id, token);

      if (res.message === "Playlist deleted successfully") {
        toast.success(`Deleted "${name}"`);

        const updated = await getMyPlaylists(token);
        setPlaylists(updated);
      } else {
        toast.error(res.message || "Failed to delete playlist");
      }
    } catch (err) {
      console.error("Error deleting playlist:", err);
      toast.error("Server error while deleting playlist");
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center p-8 pb-[10rem]">
      {/* Welcome Section */}
      <div className="w-full max-w-5xl text-left mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.username || "User"} !
        </h1>
      </div>

      {/* Playlists Section */}
      <div className="w-full max-w-5xl bg-white rounded-2xl p-6 text-gray-800 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Your Playlists
        </h3>

        {playlists.length === 0 ? (
          <p className="text-center text-gray-500">
            You don’t have any playlists yet — create one!
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {playlists.map((pl) => (
              <li
                key={pl._id}
                className="group relative bg-indigo-100 rounded-xl p-5 shadow-md hover:shadow-lg transition transform hover:scale-[1.02] cursor-pointer"
              >
                <div onClick={() => handleOpenPlaylist(pl._id)}>
                  <h4 className="text-lg font-semibold text-indigo-800 truncate">
                    {pl.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {pl.songs?.length || 0} songs
                  </p>
                </div>

                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(pl._id, pl.name);
                    }}
                    className="bg-red-500 text-white text-xs px-2 py-1 rounded-md hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
