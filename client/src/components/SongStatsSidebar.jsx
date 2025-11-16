// src/components/SongStatsSidebar.jsx
import React, { useContext, useEffect, useState, memo } from "react";
import { useLocation } from "react-router-dom";
import { SidebarContext } from "../context/SidebarContext";
import { PlayerContext } from "../context/PlayerContext";
import {
  getSongStats,
  getSongTimeline,
  getRecentActivity,
} from "../api/stats";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, X } from "lucide-react";

const NAVBAR_HEIGHT = 64;

/* -------- Timeline Tab -------- */
const TimelineTab = memo(({ data }) => {
  if (!data?.length)
    return <p className="text-gray-500">Not enough data yet.</p>;

  return (
    <div className="h-60 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

/* -------- Activity Tab -------- */
const ActivityTab = memo(({ logs, loading }) => {
  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (!logs?.length) return <p className="text-gray-500">No recent activity.</p>;

  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex justify-between text-xs py-1 border-b">
          <div>
            <p className="font-semibold">{log.username}</p>
            <p className="text-gray-500">
              {log.lastSongTitle} • {log.lastSongArtist}
            </p>
          </div>
          <span className="text-gray-400">{formatTimeAgo(log.lastPlayedAt)}</span>
        </div>
      ))}
    </div>
  );
});

/* -------- MAIN COMPONENT -------- */
export default function SongStatsSidebar() {
  const location = useLocation();
  const { isStatsOpen, setIsStatsOpen } = useContext(SidebarContext);
  const { currentSong } = useContext(PlayerContext);

  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const songId = currentSong?._id;

  const isAuthPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  /* -------- Load Stats -------- */
  useEffect(() => {
    if (!isStatsOpen || !songId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancel = false;

    async function load() {
      setLoading(true);
      try {
        const [stats, tdata] = await Promise.all([
          getSongStats(songId, token),
          getSongTimeline(songId, token),
        ]);
        if (cancel) return;

        setOverview(stats ?? null);
        setTimeline(
          (tdata || []).sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => (cancel = true);
  }, [isStatsOpen, songId]);

  /* -------- Load Activity -------- */
  useEffect(() => {
    if (!isStatsOpen || activeTab !== "activity") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancel = false;

    async function load() {
      setActivityLoading(true);
      try {
        const logs = await getRecentActivity(token);
        if (!cancel) setActivity(logs || []);
      } finally {
        if (!cancel) setActivityLoading(false);
      }
    }

    load();
    return () => (cancel = true);
  }, [isStatsOpen, activeTab]);

  if (isAuthPage) return null;

  return (
    <>
      {!isStatsOpen && currentSong && (
        <button
          onClick={() => setIsStatsOpen(true)}
          className="fixed right-4 top-1/2 z-[60] bg-white/90 text-indigo-700 shadow-lg rounded-full p-3 hover:bg-indigo-100"
        >
          <BarChart3 size={20} />
        </button>
      )}

      <AnimatePresence>
        {isStatsOpen && (
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.25 }}
            className="fixed right-0 bg-white text-gray-800 shadow-2xl border-l z-[70] w-[420px] flex flex-col"
            style={{ top: NAVBAR_HEIGHT, height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
          >
            {/* HEADER */}
            <div className="flex justify-between items-start px-4 py-3 bg-indigo-600 text-white">
              <div>
                <p className="text-xs uppercase text-indigo-100">Now Viewing</p>
                <p className="font-bold">{currentSong?.title}</p>
                <p className="text-sm">{currentSong?.artist}</p>
              </div>
              <button
                onClick={() => setIsStatsOpen(false)}
                className="p-1 hover:bg-indigo-500 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* TABS */}
            <div className="flex border-b text-sm">
              {["overview", "timeline", "activity"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2 capitalize ${
                    activeTab === t
                      ? "border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* CONTENT */}
            <div className="p-4 overflow-y-auto flex-1">
              {loading && <p className="text-gray-400">Loading...</p>}

              {activeTab === "overview" && <Overview overview={overview} />}
              {activeTab === "timeline" && <TimelineTab data={timeline} />}
              {activeTab === "activity" && (
                <ActivityTab logs={activity} loading={activityLoading} />
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function Overview({ overview }) {
  if (!overview?.totalPlays)
    return <p className="text-gray-500">No plays yet.</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Total Plays" value={overview.totalPlays} />
      <Stat label="Unique Listeners" value={overview.uniqueListeners} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-indigo-50 border rounded-lg p-3">
      <p className="text-xs text-indigo-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function formatTimeAgo(date) {
  if (!date) return "N/A";
  const diff = (Date.now() - new Date(date)) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}
