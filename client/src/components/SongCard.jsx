// src/components/SongCard.jsx
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";

export default function SongCard({ song, isSelected, onSelect }) {
  const { playSong, addToQueue } = useContext(PlayerContext);

  const handlePlay = (e) => {
    e.stopPropagation();
    playSong(song); // use current playlist context if already set elsewhere
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(song);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(song)}
      className={`p-4 rounded-xl shadow-md border cursor-pointer transition-all ${
        isSelected
          ? "bg-indigo-100 border-indigo-500"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      <h3 className="font-semibold text-lg text-gray-800">{song.title}</h3>
      <p className="text-gray-500 text-sm">
        {song.artist || "Unknown Artist"} • {song.genre || "Genre N/A"}
      </p>
      <p className="text-xs text-gray-400">
        Duration: {Math.floor(song.durationSec / 60)} min
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handlePlay}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          ▶ Play
        </button>

        <button
          onClick={handleAddToQueue}
          className="px-3 py-2 border border-indigo-400 text-indigo-700 text-xs rounded-lg hover:bg-indigo-50 transition"
        >
          + Add to Queue
        </button>
      </div>
    </div>
  );
}
