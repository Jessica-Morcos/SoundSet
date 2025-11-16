// src/context/PlayerContext.jsx
import { createContext, useState, useRef, useEffect } from "react";

export const PlayerContext = createContext();

export default function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => {
      const current = audio.currentTime || 0;
      const dur = audio.duration || 0;

      setDuration(dur);

      setProgress(prev => {
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

  const playSong = async (song, list = []) => {
    const audio = audioRef.current;

    if (list.length) {
      setPlaylist(list);
      const i = list.findIndex(s => s._id === song._id);
      setCurrentIndex(i >= 0 ? i : 0);
    }

    if (currentSong?._id !== song._id) {
      audio.src = song.audioUrl;
      setCurrentSong(song);
    }

    audio.play();
    setIsPlaying(true);

    const token = localStorage.getItem("token");
    if (token) {
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

  const nextSong = () => {
    if (!playlist.length) return;

    const next = currentIndex + 1;
    const wrap = next >= playlist.length ? 0 : next;

    setCurrentIndex(wrap);
    playSong(playlist[wrap]);
  };

  const prevSong = () => {
    if (!playlist.length) return;

    const prev = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;

    setCurrentIndex(prev);
    playSong(playlist[prev]);
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
