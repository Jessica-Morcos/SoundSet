import { useLocation, Link } from "react-router-dom";
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import logo from "../assets/logoLongWhite.png";

export default function Navbar() {
  const location = useLocation();
  const role = localStorage.getItem("role");

  // 🔥 pull resetPlayer() from the context
  const { resetPlayer } = useContext(PlayerContext);

  const linkClasses = (path) =>
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-white text-[#5b3a9b] font-semibold shadow-sm"
        : "text-white hover:text-[#d8caff] hover:bg-[#5b3a9b]/40"
    }`;

  return (
    <nav className="w-full bg-gradient-to-r from-[#5b3a9b] via-[#5b3a9b] to-[#5b3a9b] shadow-lg py-3 px-8 flex flex-wrap items-center justify-between">

      {/* LEFT - LOGO */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="SoundSet Logo"
          className="h-15 w-auto drop-shadow-md"
        />
      </div>

      {/* RIGHT - NAV LINKS */}
      <div className="flex flex-wrap justify-center items-center gap-3 mt-3 md:mt-0">
        <Link to="/dashboard" className={linkClasses("/dashboard")}>
          Dashboard
        </Link>

        <Link to="/suggest" className={linkClasses("/suggest")}>
          Suggest
        </Link>

        <Link to="/discover" className={linkClasses("/discover")}>
          Discover
        </Link>

        <Link to="/playlist-builder" className={linkClasses("/playlist-builder")}>
          Create Playlist
        </Link>

        {/* ADMIN ONLY */}
        {role === "admin" && (
          <>
            <Link to="/admin/songs" className={linkClasses("/admin/songs")}>
              Admin Panel
            </Link>
            <Link to="/admin/users" className={linkClasses("/admin/users")}>
              Manage Users
            </Link>
          </>
        )}

        <Link to="/stats" className={linkClasses("/stats")}>
          Stats
        </Link>

        {/* 🔥 LOGOUT: clears token + role + resets Player */}
        <Link
          to="/"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            resetPlayer();   // <<— THIS is what makes the PlayerBar disappear
          }}
          className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all duration-200"
        >
          Logout
        </Link>
      </div>
    </nav>
  );
}
