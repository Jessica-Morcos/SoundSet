import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ Make sure logo.png is inside /src/assets

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await loginUser({ username, password });

    if (res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      if (res.role === "admin") navigate("/admin/songs");
      else navigate("/dashboard");
    } else {
      setError(res.message || "Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c0f2f] via-[#5b3a9b] to-[#9c7df5] p-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-10 w-full max-w-md">
        {/* Header with logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-30 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1c0f2f]">Welcome Back</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-black">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c7df5] outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c7df5] outline-none"
          />
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#5b3a9b] text-white font-semibold py-3 rounded-lg hover:bg-[#4c2f83] transition"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-4 text-gray-600">
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#5b3a9b] font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
