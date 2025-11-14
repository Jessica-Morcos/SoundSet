// src/pages/PlaylistView.jsx
import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlaylistById, updatePlaylist, deletePlaylist } from "../api/playlist";
import { getAllSongs } from "../api/songs";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PlayerContext } from "../context/PlayerContext";

export default function PlaylistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);

  // Filters
  const [genreFilter, setGenreFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { playSong } = useContext(PlayerContext);

  // Get user (role + id)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed to fetch role")))
      .then((data) => {
        setUserRole(data.role);
        setUserId(data._id);
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, [BASE_URL]);

  // Load playlist + all songs
  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([getPlaylistById(id, token), getAllSongs(token)])
      .then(([pl, allSongs]) => {
        if (!pl || !pl.songs) {
          toast.error("Playlist not found or not accessible.");
          navigate("/discover");
          return;
        }
        setPlaylist(pl);
        setSongs(allSongs);
        setSelectedSongs(pl.songs.map((s) => s.song._id));
      })
      .catch((err) => {
        console.error("Error loading playlist:", err);
        toast.error("Could not load playlist");
      });
  }, [id, navigate]);

  // keep selectedSongs in sync if playlist.songs gets refreshed externally
  useEffect(() => {
    if (playlist?.songs) {
      setSelectedSongs(playlist.songs.map((s) => s.song._id));
    }
  }, [playlist?._id, playlist?.songs?.length]);

  // Save edits (owner only)
  const handleSaveChanges = async () => {
    const token = localStorage.getItem("token");
    toast.loading("Saving changes...");
    try {
      const res = await updatePlaylist(
        id,
        {
          name: playlist.name,
          classification: playlist.classification,
          songs: selectedSongs.map((songId, i) => ({ songId, order: i })),
        },
        token
      );
      toast.dismiss();
      if (res.message === "Playlist updated successfully") {
        toast.success("Playlist updated successfully!");
        setPlaylist(res.playlist);
        setIsEditing(false);
      } else {
        toast.error(res.message || "Update failed");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error updating playlist");
    }
  };

  // Delete (owner only)
  const confirmDelete = async () => {
    const token = localStorage.getItem("token");
    toast.loading("Deleting playlist...");
    try {
      const res = await deletePlaylist(playlist._id, token);
      toast.dismiss();
      if (res.message === "Playlist deleted successfully") {
        toast.success(`Deleted "${playlist.name}"`);
        setShowDeleteModal(false);
        setTimeout(() => navigate("/dashboard"), 800);
      } else toast.error(res.message || "Failed to delete playlist");
    } catch (err) {
      toast.dismiss();
      toast.error("Error deleting playlist");
    }
  };

  // Publish (DJ/Admin only)
  const handleTogglePublish = async () => {
    const token = localStorage.getItem("token");
    toast.loading("Updating visibility...");
    try {
      const res = await fetch(`${BASE_URL}/playlist/${playlist._id}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok) {
        toast.success(data.message);
        setPlaylist((p) => ({ ...p, isPublic: !p.isPublic }));
      } else {
        toast.error(data.message || "Failed to toggle publish");
      }
    } catch {
      toast.dismiss();
      toast.error("Server error while toggling playlist");
    }
  };

  // Clone (for non-owners)
  const handleClonePlaylist = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to add this playlist.");
      return;
    }
    toast.loading("Adding playlist...");
    try {
      const res = await fetch(`${BASE_URL}/playlist/${playlist._id}/clone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast.dismiss();
      if (res.ok) toast.success(data.message || "Playlist added!");
      else toast.error(data.message || "Failed to add playlist");
    } catch {
      toast.dismiss();
      toast.error("Server error while cloning playlist.");
    }
  };

  // Drag reorder
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(selectedSongs);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSelectedSongs(reordered);
  };

  if (!playlist || !playlist.songs)
    return (
      <p className="text-center mt-10 text-gray-300 animate-pulse">
        Loading playlist...
      </p>
    );

  const isOwner =
    (userId && playlist.owner?._id === userId) ||
    (playlist.owner && playlist.owner === userId);

  // Filters
  const filteredSongs = songs.filter((song) => {
    return (
      (!genreFilter || song.genre === genreFilter) &&
      (!artistFilter || song.artist === artistFilter) &&
      (!yearFilter || song.year === parseInt(yearFilter))
    );
  });

  const uniqueGenres = [...new Set(songs.map((s) => s.genre).filter(Boolean))];
  const uniqueArtists = [...new Set(songs.map((s) => s.artist).filter(Boolean))];
  const uniqueYears = [...new Set(songs.map((s) => s.year).filter(Boolean))];

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-10 px-6 pb-[10rem]">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          {isEditing ? (
            <input
              className="text-3xl font-bold text-indigo-700 border-b border-indigo-400 outline-none w-2/3"
              value={playlist.name}
              onChange={(e) =>
                setPlaylist({ ...playlist, name: e.target.value })
              }
            />
          ) : (
            <h1 className="text-4xl font-extrabold text-indigo-700">
              {playlist.name}
            </h1>
          )}

          <div className="flex gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                >
                  Delete
                </button>

                {(userRole === "dj" || userRole === "admin") && (
                  <button
                    onClick={handleTogglePublish}
                    className={`px-4 py-2 rounded-lg text-white ${
                      playlist.isPublic
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-500 hover:bg-gray-600"
                    }`}
                  >
                    {playlist.isPublic ? "Unpublish" : "Publish"}
                  </button>
                )}
              </>
            ) : (
              !playlist.name.endsWith("(Copy)") && (
                <button
                  onClick={handleClonePlaylist}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  ➕ Add to My Playlists
                </button>
              )
            )}
          </div>
        </div>

        {/* VIEW MODE */}
        {!isEditing ? (
          <>
            <p className="text-gray-500 mb-4 italic">
              {playlist.classification || "general"}
            </p>
            <p className="text-center text-gray-500 mb-6">
              {playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}
            </p>

            <ul className="divide-y divide-gray-200">
              {playlist.songs.map((entry, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-3 px-4 hover:bg-gray-100 rounded-lg transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {entry.song?.title || "Untitled Song"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.song?.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-400">
                      {entry.song?.durationSec
                        ? `${Math.floor(entry.song.durationSec / 60)}:${String(
                            entry.song.durationSec % 60
                          ).padStart(2, "0")}`
                        : ""}
                    </p>
                    <button
                      onClick={() =>
                        playSong(entry.song, playlist.songs.map((s) => s.song))
                      }
                      className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                    >
                      ▶ Play
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          /* EDIT MODE */
          <>
            {/* Classification */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Classification
              </label>
              <select
                value={playlist.classification || "general"}
                onChange={(e) =>
                  setPlaylist({ ...playlist, classification: e.target.value })
                }
                className="bg-white text-gray-700 px-3 py-2 rounded-lg border w-full"
              >
                {["general", "wedding", "corporate", "birthday", "club", "charity"].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-4">
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
                Reset
              </button>
            </div>

            {/* Reorder current playlist */}
            <h3 className="text-lg font-semibold mb-2">Your Playlist</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="playlist-songs">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="max-h-64 overflow-y-auto border p-3 rounded-lg mb-4 bg-gray-50"
                  >
                    {selectedSongs.map((id, index) => {
                      const song = songs.find((s) => s._id === id);
                      if (!song) return null;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="flex justify-between items-center bg-white rounded-md p-2 mb-2 shadow-sm hover:shadow-md"
                            >
                              <span>🎵 {song.title} — {song.artist}</span>
                              <button
                                onClick={() =>
                                  setSelectedSongs((prev) => prev.filter((sid) => sid !== id))
                                }
                                className="text-red-500 font-bold"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Add songs */}
            <h3 className="text-lg font-semibold mb-2">Add Songs</h3>
            <div className="max-h-64 overflow-y-auto border p-3 rounded-lg mb-4">
              {filteredSongs.map((song) => {
                const already = selectedSongs.includes(song._id);
                return (
                  <div
                    key={song._id}
                    className={`flex justify-between items-center py-2 px-3 rounded-md mb-1 transition ${
                      already ? "bg-gray-200 opacity-70 cursor-not-allowed" : "hover:bg-gray-100"
                    }`}
                  >
                    <span>{song.title} — {song.artist}</span>
                    {!already && (
                      <button
                        onClick={() =>
                          setSelectedSongs((prev) =>
                            prev.includes(song._id) ? prev : [...prev, song._id]
                          )
                        }
                        className="text-green-600 font-bold"
                      >
                        ＋
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <button
                onClick={handleSaveChanges}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-3">Delete Playlist?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-red-500">"{playlist.name}"</span>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
