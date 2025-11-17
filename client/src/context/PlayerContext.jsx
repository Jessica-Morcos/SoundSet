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

  // ▶ play a song
  const playSong = async (song, list = []) => {
    const audio = audioRef.current;

    if (Array.isArray(list) && list.length) {
      setPlaylist(list);
      const i = list.findIndex((s) => s._id === song._id);
      setCurrentIndex(i >= 0 ? i : 0);

      setQueue([]); // wipe queue if switching playlists
    }

    if (!currentSong || currentSong._id !== song._id) {
      audio.src = song.audioUrl;
      audio.currentTime = 0;
      setCurrentSong(song);
    }

    audio.play();
    setIsPlaying(true);

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

  // ⭐ NEW: reorder queue (drag & drop)
  const reorderQueue = (fromIndex, toIndex) => {
    setQueue((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // queue helpers
  const addToQueue = (song) => {
    if (!song || !song._id) return;
    setQueue((prev) => [...prev, song]);
  };

  const removeFromQueue = (songId) => {
    setQueue((prev) => prev.filter((s) => s._id !== songId));
  };

  const clearQueue = () => setQueue([]);

  // next/prev logic
  const nextSong = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playSong(next);
      return;
    }

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

    setQueue([]);
    setIsQueueOpen(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        playlist,
        currentIndex,
        isPlaying,
        progress,
        duration,
        isFullscreen,
        setIsFullscreen,

        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,  
        isQueueOpen,
        setIsQueueOpen,

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
