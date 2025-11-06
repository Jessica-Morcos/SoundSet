import { useEffect, useState } from "react";

export default function Suggestions() {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3000/api/songs/suggest", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setSongs)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 text-white bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Recommended For You 🎧</h1>
      {songs.length === 0 ? (
        <p>No suggestions yet. Play more songs!</p>
      ) : (
        <ul className="grid md:grid-cols-3 gap-6">
          {songs.map((song) => (
            <li
              key={song._id}
              className="bg-white text-gray-800 rounded-xl shadow-lg p-5 hover:scale-[1.02] transition"
            >
              <h3 className="text-lg font-bold">{song.title}</h3>
              <p>{song.artist}</p>
              <p className="text-sm text-gray-500">{song.genre}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
