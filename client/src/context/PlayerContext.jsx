// src/context/PlayerContext.jsx
import { createContext, useState, useRef, useEffect } from "react";

export const PlayerContext = createContext();

export default function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  // core player state
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 🔥 NEW: in-memory queue (NO persistence)
  const [queue, setQueue] = useState([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // progress tracking
  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => {
      const current = audio.currentTime || 0;
      const dur = audio.duration || 0;

      setDuration(dur);

      setProgress((prev) => {
        if (Math.abs(prev - current) < 0.25) return prev;
        return current;
      });
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, []);

  // ▶ play a song (optionally within a playlist)
  const playSong = async (song, list = []) => {
    const audio = audioRef.current;

    // if a playlist is passed, treat it as the active context
    if (Array.isArray(list) && list.length) {
      setPlaylist(list);
      const i = list.findIndex((s) => s._id === song._id);
      setCurrentIndex(i >= 0 ? i : 0);

      // whenever you start a brand-new playlist, wipe the old queue
      setQueue([]);
    }

    if (!currentSong || currentSong._id !== song._id) {
      audio.src = song.audioUrl;
      audio.currentTime = 0;
      setCurrentSong(song);
    }

    audio.play();
    setIsPlaying(true);

    // log play for stats
    const token = localStorage.getItem("token");
    if (token && song?._id) {
      try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/stats/log`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ songId: song._id }),
        });
      } catch (err) {
        console.error("Failed to log play:", err);
      }
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (t) => {
    audioRef.current.currentTime = t;
    setProgress(t);
  };

  // 🔥 NEW: queue helpers
  const addToQueue = (song) => {
    if (!song || !song._id) return;
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (songId) => {
    setQueue((prev) => prev.filter((s) => s._id !== songId));
  };

  const clearQueue = () => setQueue([]);

  // ⏭ nextSong: queue first, then playlist
  const nextSong = () => {
    // 1) if there is a queue, consume it first
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playSong(next); // do NOT touch playlist index
      return;
    }

    // 2) otherwise fall back to playlist behaviour
    if (!playlist.length) return;

    const next = currentIndex + 1;
    const wrap = next >= playlist.length ? 0 : next;

    setCurrentIndex(wrap);
    playSong(playlist[wrap], playlist);
  };

  const prevSong = () => {
    if (!playlist.length) return;

    const prev = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    setCurrentIndex(prev);
    playSong(playlist[prev], playlist);
  };

  const resetPlayer = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.src = "";

    setPlaylist([]);
    setCurrentSong(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setIsFullscreen(false);

    // reset queue as well
    setQueue([]);
    setIsQueueOpen(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        // core state
        currentSong,
        playlist,
        currentIndex,
        isPlaying,
        progress,
        duration,
        isFullscreen,
        setIsFullscreen,

        // queue state
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        isQueueOpen,
        setIsQueueOpen,

        // controls
        playSong,
        togglePlay,
        seek,
        nextSong,
        prevSong,
        resetPlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
