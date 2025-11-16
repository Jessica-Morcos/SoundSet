// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PlaylistBuilder from "./pages/PlaylistBuilder.jsx";
import Navbar from "./components/Navbar.jsx";
import PlaylistView from "./pages/PlaylistView.jsx";
import Stats from "./pages/Stats.jsx";
import Suggest from "./pages/Suggest.jsx";
import AdminSongs from "./pages/AdminSongs.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import PlayerProvider from "./context/PlayerContext.jsx";
import SidebarProvider from "./context/SidebarContext.jsx";
import PlayerBar from "./components/PlayerBar.jsx";
import Discover from "./pages/Discover.jsx";
import DiscoverProfile from "./pages/DiscoverProfile.jsx";
import SongStatsSidebar from "./components/SongStatsSidebar.jsx";
import QueueSidebar from "./components/QueueSidebar.jsx";

function AppContent() {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1c0f2f] via-[#5b3a9b] to-[#9c7df5] text-white flex flex-col">
      {!hideNavbar && <Navbar />}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1"
        >
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/admin/songs" element={<AdminSongs />} />
            <Route path="/admin/users" element={<AdminUsers />} />

            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:id" element={<DiscoverProfile />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/suggest" element={<Suggest />} />
            <Route path="/playlist/:id" element={<PlaylistView />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/playlist-builder" element={<PlaylistBuilder />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* stats sidebar context */}
      <SidebarProvider>
        {/* player + queue context */}
        <PlayerProvider>
          <AppContent />
          <PlayerBar />
          <SongStatsSidebar />
          <QueueSidebar />
        </PlayerProvider>
      </SidebarProvider>
    </BrowserRouter>
  );
}
