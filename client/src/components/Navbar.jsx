import { useLocation } from "react-router-dom";
import logo from "../assets/logoLongWhite.png"; // ✅ Make sure this path matches your project

export default function Navbar() {
  const location = useLocation();
  const role = localStorage.getItem("role");

  const linkClasses = (path) =>
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-white text-[#5b3a9b] font-semibold shadow-sm"
        : "text-white hover:text-[#d8caff] hover:bg-[#5b3a9b]/40"
    }`;

  return (
    <nav className="w-full bg-gradient-to-r from-[#5b3a9b] via-[#5b3a9b] to-[#5b3a9b] shadow-lg py-3 px-8 flex flex-wrap items-center justify-between">
      {/* ✅ Left section - Logo */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="SoundSet Logo"
          className="h-15 w-auto drop-shadow-md"
        />
       
      </div>

      {/* ✅ Right section - Links */}
      <div className="flex flex-wrap justify-center items-center gap-3 mt-3 md:mt-0">
        <a href="/dashboard" className={linkClasses("/dashboard")}>
          Dashboard
        </a>

        <a href="/suggest" className={linkClasses("/suggest")}>
          Suggest
        </a>

        <a href="/playlist-builder" className={linkClasses("/playlist-builder")}>
          Create Playlist
        </a>

        {/* ✅ Admin-only links */}
        {role === "admin" && (
          <>
            <a href="/admin/songs" className={linkClasses("/admin/songs")}>
              Admin Panel
            </a>
            <a href="/admin/users" className={linkClasses("/admin/users")}>
              Manage Users
            </a>
          </>
        )}

        <a href="/stats" className={linkClasses("/stats")}>
          Stats
        </a>

        <a
          href="/"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
          }}
          className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all duration-200"
        >
          Logout
        </a>
      </div>
    </nav>
  );
}
