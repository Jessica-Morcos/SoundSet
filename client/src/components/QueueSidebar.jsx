// src/components/QueueSidebar.jsx
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2 } from "lucide-react";

const NAVBAR_HEIGHT = 64;

export default function QueueSidebar() {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentSong,
    playlist,
    currentIndex,
    queue,
    playSong,
    removeFromQueue,
    clearQueue,
  } = useContext(PlayerContext);

  if (!currentSong) return null;

  const upcomingFromPlaylist =
    Array.isArray(playlist) && playlist.length
      ? playlist.slice(currentIndex + 1)
      : [];

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <motion.aside
          initial={{ x: 360 }}
          animate={{ x: 0 }}
          exit={{ x: 360 }}
          transition={{ duration: 0.25 }}
          className="fixed right-0 top-[64px] w-[360px] bg-[#1b1230] text-white border-l border-purple-700 shadow-2xl z-[60] flex flex-col"
          style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-300">
                Queue
              </p>
              <p className="text-sm text-purple-100">
                Now playing + what’s next
              </p>
            </div>
            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs flex items-center gap-1 text-purple-200 hover:text-white"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-1 rounded-full hover:bg-purple-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* NOW PLAYING */}
            <section>
              <p className="text-xs uppercase text-purple-300 mb-2">
                Now Playing
              </p>
              <div className="flex items-center gap-3 bg-purple-900/40 rounded-xl px-3 py-2">
                {currentSong.coverUrl && (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-sm">{currentSong.title}</p>
                  <p className="text-xs text-purple-200">
                    {currentSong.artist}
                  </p>
                </div>
              </div>
            </section>

            {/* UP NEXT – QUEUE */}
            <section>
              <p className="text-xs uppercase text-purple-300 mb-2">
                Up Next (Queue)
              </p>

              {queue.length === 0 ? (
                <p className="text-xs text-purple-200">
                  No queued songs yet. Use <span className="font-semibold">
                    “Add to Queue”
                  </span>{" "}
                  on songs to fill this up.
                </p>
              ) : (
                <div className="space-y-1">
                  {queue.map((song, index) => (
                    <button
                      key={song._id || index}
                      onClick={() => {
                        // play this song now + remove it from queue
                        removeFromQueue(song._id);
                        playSong(song);
                      }}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-purple-900/70 text-left text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {song.coverUrl && (
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-9 h-9 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-[0.8rem] leading-tight">
                            {song.title}
                          </p>
                          <p className="text-[0.7rem] text-purple-200">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(song._id);
                        }}
                        className="ml-2 text-purple-300 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* NEXT FROM PLAYLIST */}
            {upcomingFromPlaylist.length > 0 && (
              <section className="pt-2 border-t border-purple-800/60">
                <p className="text-xs uppercase text-purple-300 mb-2">
                  Next from playlist
                </p>
                <div className="space-y-1">
                  {upcomingFromPlaylist.map((song, index) => (
                    <button
                      key={song._id || index}
                      onClick={() => playSong(song, playlist)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-purple-900/50 text-left text-xs"
                    >
                      {song.coverUrl && (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-9 h-9 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-[0.8rem] leading-tight">
                          {song.title}
                        </p>
                        <p className="text-[0.7rem] text-purple-200">
                          {song.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
