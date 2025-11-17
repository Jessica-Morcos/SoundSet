// src/components/SongCard.jsx
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { Play, ListPlus } from "lucide-react";

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
        <div className="mt-3 flex gap-2">

          {/* Play */}
          <button
            onClick={handlePlay}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition"
          >
            <Play size={16} />
            <span className="text-xs font-medium">Play</span>
          </button>

          {/* Queue */}
          <button
            onClick={handleAddToQueue}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-purple-500 text-purple-600 hover:bg-purple-50 transition"
          >
            <ListPlus size={16} />
            <span className="text-xs font-medium">Queue</span>
          </button>

        </div>

      </div>
    </div>
  );
}
