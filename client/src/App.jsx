import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

import PlayerProvider from "./context/PlayerContext";
import PlayerBar from "./components/PlayerBar";

function AppContent() {
  const location = useLocation();

  // hide navbar on login/register pages
  const hideNavbar =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 🔐 Admin Routes */}
        <Route path="/admin/songs" element={<AdminSongs />} />
        <Route path="/admin/users" element={<AdminUsers />} />

        {/* 🎵 User Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suggest" element={<Suggest />} />
        <Route path="/playlist/:id" element={<PlaylistView />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/playlist-builder" element={<PlaylistBuilder />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 🎧 Wrap entire app in PlayerProvider */}
      <PlayerProvider>
        <AppContent />
        {/* 🔹 Always visible bottom bar */}
        <PlayerBar />
      </PlayerProvider>
    </BrowserRouter>
  );
}
