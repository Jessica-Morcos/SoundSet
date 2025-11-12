import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlaylistById, updatePlaylist, deletePlaylist } from "../api/playlist";
import { getAllSongs } from "../api/songs";
import { logPlay } from "../api/stats";
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

  // Filters
  const [genreFilter, setGenreFilter] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const { playSong } = useContext(PlayerContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    Promise.all([getPlaylistById(id, token), getAllSongs(token)]).then(
      ([pl, allSongs]) => {
        setPlaylist(pl);
        setSongs(allSongs);
        setSelectedSongs(pl.songs.map((s) => s.song._id));
      }
    );
  }, [id]);

  // ✅ Save edited playlist
  const handleSaveChanges = async () => {
    const token = localStorage.getItem("token");
    toast.loading("Saving changes...");
    try {
      const res = await updatePlaylist(
        id,
        {
          name: playlist.name,
          classification: playlist.classification, // 👈 added
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
        toast.error("Update failed");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Error updating playlist");
    }
  };

  // ✅ Delete Playlist
  const confirmDelete = async () => {
    const token = localStorage.getItem("token");
    toast.loading("Deleting playlist...");
    try {
      const res = await deletePlaylist(playlist._id, token);
      toast.dismiss();
      if (res.message === "Playlist deleted successfully") {
        toast.success(`Deleted "${playlist.name}"`);
        setShowDeleteModal(false);
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        toast.error(res.message || "Failed to delete playlist");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Error deleting playlist:", err);
      toast.error("Error deleting playlist");
    }
  };

  // 🧠 Handle drag reorder
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(selectedSongs);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setSelectedSongs(reordered);
  };

  if (!playlist)
    return (
      <p className="text-center mt-10 text-gray-300 animate-pulse">
        Loading playlist...
      </p>
    );

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
    <div className="min-h-screen text-white flex flex-col items-center py-10 px-6">
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
          </div>
        </div>

        {/* 👇 Classification Display in View Mode */}
        {!isEditing && (
          <p className="text-gray-500 mb-4 italic">
            {playlist.classification || "general"}
          </p>
        )}

        {/* Edit Mode */}
        {isEditing ? (
          <>
            {/* 🎯 Classification Dropdown */}
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

            {/* 🎵 Selected Songs Reorder */}
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
                              <span>
                                🎵 {song.title} — {song.artist}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedSongs(
                                    selectedSongs.filter((sid) => sid !== id)
                                  )
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

            {/* 🎧 Add Songs Section */}
            <h3 className="text-lg font-semibold mb-2">Add Songs</h3>
            <div className="max-h-64 overflow-y-auto border p-3 rounded-lg mb-4">
              {filteredSongs.map((song) => (
                <div
                  key={song._id}
                  className={`flex justify-between items-center py-2 px-3 rounded-md mb-1 transition ${
                    selectedSongs.includes(song._id)
                      ? "bg-gray-200 opacity-70 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span>
                    {song.title} — {song.artist}
                  </span>
                  {!selectedSongs.includes(song._id) && (
                    <button
                      onClick={() =>
                        setSelectedSongs([...selectedSongs, song._id])
                      }
                      className="text-green-500 font-bold"
                    >
                      ＋
                    </button>
                  )}
                </div>
              ))}
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
        ) : (
          <>
            <p className="text-center text-gray-500 mb-6">
              {playlist.songs.length}{" "}
              {playlist.songs.length === 1 ? "song" : "songs"}
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
                        ? `${Math.floor(entry.song.durationSec / 60)}:${
                            entry.song.durationSec % 60
                          }`
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
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Delete Playlist?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-red-500">
                "{playlist.name}"
              </span>
              ?
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
