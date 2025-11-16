import { useLocation, Link } from "react-router-dom";
import { useContext, useState } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { HiMenu, HiX } from "react-icons/hi";
import logo from "../assets/logoLongWhite.png";

export default function Navbar() {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const { resetPlayer } = useContext(PlayerContext);

  const [open, setOpen] = useState(false);

  const linkClasses = (path) =>
    `block px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-white text-[#5b3a9b] font-semibold shadow-sm"
        : "text-white hover:text-[#d8caff] hover:bg-[#5b3a9b]/40"
    }`;

  return (
    <nav className="w-full bg-[#5b3a9b] shadow-lg py-3 px-6 flex items-center justify-between relative">

      {/* LOGO */}
      <img src={logo} alt="SoundSet Logo" className="h-10" />

      {/* HAMBURGER MENU (shown on tablets + phones) */}
      <button
        className="lg:hidden text-white text-3xl"
        onClick={() => setOpen(!open)}
      >
        {open ? <HiX /> : <HiMenu />}
      </button>

      {/* NAV LINKS */}
      <div
  className={`flex flex-col lg:flex-row lg:static absolute right-0 top-[60px] bg-[#5b3a9b] lg:bg-transparent w-full lg:w-auto 
  gap-2 py-4 lg:py-0 transition-all duration-300 z-50
  ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"}`}
>

        <Link to="/dashboard" className={linkClasses("/dashboard")}>
          Dashboard
        </Link>

        <Link to="/suggest" className={linkClasses("/suggest")}>
          Suggest
        </Link>

        <Link to="/discover" className={linkClasses("/discover")}>
          Discover
        </Link>

        <Link
          to="/playlist-builder"
          className={linkClasses("/playlist-builder")}
        >
          Create Playlist
        </Link>

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

        <Link
          to="/"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            resetPlayer();
          }}
          className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all duration-200"
        >
          Logout
        </Link>
      </div>
    </nav>
  );
}
