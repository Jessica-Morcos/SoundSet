import { createContext, useState, useRef, useEffect } from "react";

export const PlayerContext = createContext();

export default function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync progress bar
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

  // Controls
  const playSong = (song) => {
    if (!song?.audioUrl) return;
    const audio = audioRef.current;
    if (currentSong?._id !== song._id) {
      audio.src = song.audioUrl;
      setCurrentSong(song);
    }
    audio.play();
    setIsPlaying(true);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + seconds));
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
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
