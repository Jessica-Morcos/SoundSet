import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Stats() {
  const [songData, setSongData] = useState([]);
  const [artistData, setArtistData] = useState([]);
  const [genreData, setGenreData] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // 🎵 Song play frequency
    fetch(`${BASE_URL}/stats/frequency`, { headers })
      .then((res) => res.json())
      .then((data) =>
        setSongData(
          data.map((d) => ({
            name: d.title || "Unknown",
            plays: d.count,
          }))
        )
      )
      .catch((err) => console.error("Error fetching song stats:", err));

    // 🎤 Top artists (fixed stray quote)
    fetch(`${BASE_URL}/stats/artist`, { headers })
      .then((res) => res.json())
      .then((data) =>
        setArtistData(
          data.map((d) => ({
            name: d._id || "Unknown",
            value: d.plays,
          }))
        )
      )
      .catch((err) => console.error("Error fetching artist stats:", err));

    // 🎧 Top genres
    fetch(`${BASE_URL}/stats/genre`, { headers })
      .then((res) => res.json())
      .then((data) =>
        setGenreData(
          data.map((d) => ({
            name: d._id || "Unknown",
            value: d.plays,
          }))
        )
      )
      .catch((err) => console.error("Error fetching genre stats:", err));
  }, []);

  const COLORS = ["#6366f1", "#ec4899", "#22c55e", "#f59e0b", "#06b6d4"];

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-10 px-6 pb-[10rem]">
      <h1 className="text-4xl font-extrabold mb-10">Your Listening Stats</h1>

      <div className="grid md:grid-cols-2 gap-10 w-full max-w-6xl">
        {/* SONG FREQUENCY */}
        <ChartCard title="Song Play Frequency" data={songData}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={songData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="plays" stroke="#6366f1" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ARTIST PIE */}
        <ChartCard title="Most Played Artists" data={artistData}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={artistData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {artistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* GENRE PIE */}
        <ChartCard title="Most Played Genres" data={genreData} span>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, data, children, span }) {
  return (
    <div
      className={`bg-white text-gray-800 rounded-2xl shadow-lg p-8 ${
        span ? "md:col-span-2" : ""
      }`}
    >
      <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600">{title}</h2>
      {data.length === 0 ? (
        <p className="text-center text-gray-500">No data yet.</p>
      ) : (
        children
      )}
    </div>
  );
}
