import { useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  // ✅ Read the role stored during login
  const role = localStorage.getItem("role");

  const linkClasses = (path) =>
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-white text-indigo-600 font-semibold shadow-sm"
        : "text-white hover:text-indigo-200 hover:bg-indigo-700"
    }`;

  return (
    <nav className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 shadow-md py-4 px-8 flex flex-wrap justify-center gap-4">
      <a href="/dashboard" className={linkClasses("/dashboard")}>
        Dashboard
      </a>

      <a href="/suggest" className={linkClasses("/suggest")}>
        Suggest
      </a>

      <a href="/playlist-builder" className={linkClasses("/playlist-builder")}>
        Create Playlist
      </a>

      {/* ✅ Show only for admins */}
      {role === "admin" && (
        <a href="/admin/songs" className={linkClasses("/admin/songs")}>
          Admin Panel
        </a>
      )}
      {role === "admin" && (
        <a href="/admin/users" className={linkClasses("/admin/users")}>
            Manage Users
        </a>
        )}


      <a href="/stats" className={linkClasses("/stats")}>
        Stats
      </a>

      <a
        href="/"
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("role"); // ✅ remove role on logout
        }}
        className="px-4 py-2 rounded-lg text-white hover:bg-red-600 transition-all duration-200"
      >
        Logout
      </a>
    </nav>
  );
}
