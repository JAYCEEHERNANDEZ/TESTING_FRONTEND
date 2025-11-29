import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginadminReader } from "../api/api.js";

export default function MeterReaderLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      const res = await loginadminReader({ username, password });
      console.log("Backend response:", res.data);

      if (res.data?.success) {
        if (res.data?.role !== "meter_reader") {
          setError("Access denied. This page is for meter readers only.");
          return;
        }

        setSuccess("Login successful!");

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("name", res.data.name);
        localStorage.setItem("id", res.data.id);

        navigate("/reader-dashboard");
      } else {
        setError(res.data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0f1f] via-[#0b0f24] to-[#1a0545] text-white px-4">

      <div className="bg-[#1e1b2f] shadow-md rounded-3xl p-8 sm:p-12 w-full max-w-md text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 text-orange-200">
          Meter Reader Login
        </h2>

        {error && <p className="text-red-400 mb-4 font-semibold">{error}</p>}
        {success && <p className="text-green-300 mb-4 font-semibold">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Username</label>
            <input
              type="text"
              className="w-full border border-orange-500/50 rounded-xl px-3 py-2 bg-[#0d0b1d] text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-2">Password</label>
            <input
              type="password"
              className="w-full border border-orange-500/50 rounded-xl px-3 py-2 bg-[#0d0b1d] text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-2xl font-semibold shadow-sm transition-transform hover:scale-105 text-white mt-2"
          >
            Login
          </button>
        </form>
      </div>

      {/* Footer / Navigation Links */}
      <div className="mt-6 text-center text-sm sm:text-base text-gray-300">
        <nav className="space-x-3">
          <Link to="/landing-page" className="hover:underline text-orange-300">Home</Link>
          <span>|</span>
          <Link to="/admin-login" className="hover:underline text-orange-300">Admin</Link>
          <span>|</span>
          <Link to="/resident-login" className="hover:underline text-orange-300">Resident</Link>
          <span>|</span>
          <Link to="/meter-reader" className="hover:underline text-orange-300">Meter Reader</Link>
        </nav>
      </div>

    </div>
  );
}
