import { createContext, useState, useRef, useEffect } from "react";

export const PlayerContext = createContext();

export default function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());

  const [playlist, setPlaylist] = useState([]);       // all songs in current list
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update progress continuously
  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, []);

  // 🔁 Auto play next when current song ends
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => nextSong();
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [playlist, currentIndex]);

  // ▶ Play a song (with optional playlist)
  const playSong = async (song, list = []) => {
  const audio = audioRef.current;

  if (list.length) {
    setPlaylist(list);
    const index = list.findIndex((s) => s._id === song._id);
    setCurrentIndex(index >= 0 ? index : 0);
  }

  if (currentSong?._id !== song._id) {
    audio.src = song.audioUrl;
    setCurrentSong(song);
  }

  audio.play();
  setIsPlaying(true);

  // 🧠 Log the play
  const token = localStorage.getItem("token");
  if (token && song._id) {
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
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + seconds));
  };

  // ⏭ Next / ⏮ Previous
  const nextSong = () => {
    if (!playlist.length) return;
    const next = currentIndex + 1;
    if (next < playlist.length) {
      setCurrentIndex(next);
      playSong(playlist[next]);
    } else {
      // optional loop
      setCurrentIndex(0);
      playSong(playlist[0]);
    }
  };

  const prevSong = () => {
    if (!playlist.length) return;
    const prev = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    setCurrentIndex(prev);
    playSong(playlist[prev]);
  };

  const value = {
    currentSong,
    isPlaying,
    progress,
    duration,
    isFullscreen,
    setIsFullscreen,
    playSong,
    togglePlay,
    seek,
    skip,
    nextSong,
    prevSong,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
