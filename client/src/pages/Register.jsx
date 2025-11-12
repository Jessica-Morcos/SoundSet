import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ Match the same logo import as in Login.jsx

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const res = await registerUser({ username, password });
    if (res.message === "User registered") {
      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(res.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1c0f2f] via-[#5b3a9b] to-[#9c7df5] p-6">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-10 w-full max-w-md">
        {/* Header with logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="h-30 w-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#1c0f2f]">Create Account</h1>
          <p className="text-gray-600 text-sm mt-1">Join SoundSet today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-black">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c7df5] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c7df5] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9c7df5] outline-none"
            required
          />

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          {success && (
            <p className="text-green-500 text-center text-sm">{success}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#5b3a9b] text-white font-semibold py-3 rounded-lg hover:bg-[#4c2f83] transition"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-[#5b3a9b] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
