import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";

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
    nextSong,
    prevSong,
  } = useContext(PlayerContext);

  if (!currentSong) return null;

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <AnimatePresence>
      {/* ─────────── Mini Player (bottom bar) ─────────── */}
      {!isFullscreen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 right-0 bg-indigo-700 text-white p-3 shadow-2xl flex items-center justify-between cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        >
          {/* Song Info */}
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

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSong();
              }}
              className="text-gray-200 hover:text-white transition-colors"
            >
              <SkipBack size={22} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-purple-500 hover:bg-purple-600 rounded-full p-3 text-white shadow-lg transition-colors"
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSong();
              }}
              className="text-gray-200 hover:text-white transition-colors"
            >
              <SkipForward size={22} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-500">
            <div
              className="h-1 bg-purple-400"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* ─────────── Fullscreen Player ─────────── */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white z-50"
        >
          {/* Cover */}
          {currentSong.coverUrl && (
            <img
              src={currentSong.coverUrl}
              alt="cover"
              className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl mb-6 shadow-2xl"
            />
          )}
          <h2 className="text-3xl font-bold">{currentSong.title}</h2>
          <p className="text-gray-300 mb-4">{currentSong.artist}</p>

          {/* Progress */}
          <div className="w-4/5 max-w-lg">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-purple-400"
            />
            <div className="flex justify-between text-sm text-gray-300">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <button
              onClick={prevSong}
              className="flex items-center gap-2 text-lg text-gray-300 hover:text-white transition-colors"
            >
              <SkipBack size={28} />
            </button>

            <button
              onClick={togglePlay}
              className="bg-purple-500 hover:bg-purple-600 rounded-full p-5 text-white transition-colors shadow-lg"
            >
              {isPlaying ? <Pause size={36} /> : <Play size={36} />}
            </button>

            <button
              onClick={nextSong}
              className="flex items-center gap-2 text-lg text-gray-300 hover:text-white transition-colors"
            >
              <SkipForward size={28} />
            </button>
          </div>

          {/* Close */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-gray-300 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
