import { logPlay } from "../api/stats";

export default function SongCard({ song, isSelected, onSelect }) {
  const handlePlay = async () => {
    const token = localStorage.getItem("token");
    try {
      await logPlay(song._id, token);
      alert(`Played "${song.title}" logged!`);
    } catch (err) {
      console.error("Failed to log play:", err);
      alert("Failed to log song play");
    }
  };

  return (
    <div
      onClick={() => onSelect(song)}
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

      <button
        onClick={(e) => {
          e.stopPropagation(); // avoid selecting when clicking play
          handlePlay();
        }}
        className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
      >
        ▶ Play
      </button>
    </div>
  );
}
