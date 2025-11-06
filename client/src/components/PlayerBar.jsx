import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    progress,
    duration,
    seek,
    skip,
    isFullscreen,
    setIsFullscreen,
  } = useContext(PlayerContext);

  if (!currentSong) return null;

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      {!isFullscreen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 bg-indigo-700 text-white p-3 shadow-2xl flex items-center justify-between cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          <div className="flex items-center gap-3">
            {currentSong.coverUrl && (
              <img
                src={currentSong.coverUrl}
                alt="cover"
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{currentSong.title}</p>
              <p className="text-sm text-gray-300">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(-30);
              }}
              className="text-lg hover:text-gray-300"
            >
              ⏪ 30s
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-2xl font-bold"
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(30);
              }}
              className="text-lg hover:text-gray-300"
            >
              30s ⏩
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-500">
            <div
              className="h-1 bg-green-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      )}

      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white z-50"
        >
          {currentSong.coverUrl && (
            <img
              src={currentSong.coverUrl}
              alt="cover"
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl mb-6 shadow-2xl"
            />
          )}
          <h2 className="text-3xl font-bold">{currentSong.title}</h2>
          <p className="text-gray-300 mb-4">{currentSong.artist}</p>

          <div className="w-4/5 max-w-lg">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-green-400"
            />
            <div className="flex justify-between text-sm text-gray-300">
              <span>{Math.floor(progress)}s</span>
              <span>{Math.floor(duration)}s</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => skip(-30)}
              className="text-2xl hover:text-gray-300"
            >
              ⏪ 30s
            </button>
            <button
              onClick={togglePlay}
              className="bg-green-500 rounded-full p-4 text-3xl"
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <button
              onClick={() => skip(30)}
              className="text-2xl hover:text-gray-300"
            >
              30s ⏩
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-gray-300 hover:text-white text-xl"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
