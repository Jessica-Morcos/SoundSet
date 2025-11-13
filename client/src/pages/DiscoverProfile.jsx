import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function DiscoverProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/dj/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.profile);
        setPlaylists(data.playlists || []);
      })
      .catch((err) => console.error("Error loading DJ profile:", err));
  }, [id]);

  const handleClonePlaylist = async (playlistId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to add playlists.");
      return;
    }

    toast.loading("Adding playlist...");
    try {
      const res = await fetch(`${BASE_URL}/playlist/${playlistId}/clone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok) {
        toast.success(data.message || "Playlist added to your account!");
      } else {
        toast.error(data.message || "Failed to add playlist");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Error cloning playlist:", err);
      toast.error("Server error while adding playlist.");
    }
  };

  if (!profile)
    return (
      <p className="text-center text-gray-400 mt-20 animate-pulse">
        Loading DJ profile...
      </p>
    );

  return (
    <div className="p-10 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-indigo-400">
        {profile.displayName || profile.user?.username}
      </h1>
      <p className="text-gray-300 mb-8">{profile.bio}</p>

      <h2 className="text-2xl font-semibold mb-4 text-indigo-300">
        Published Playlists
      </h2>

      {playlists.length === 0 ? (
        <p className="text-gray-400">No public playlists yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <div
              key={pl._id}
              className="bg-white text-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h3 className="font-bold text-lg mb-1 text-indigo-700">
                {pl.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {pl.classification || "General"}
              </p>

              <button
                onClick={() => handleClonePlaylist(pl._id)}
                className="bg-indigo-600 text-white w-full py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                ➕ Add to My Playlists
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
