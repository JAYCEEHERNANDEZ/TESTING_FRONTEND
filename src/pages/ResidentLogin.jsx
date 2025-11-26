import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api.js"; // your axios API

export default function Login() {
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
      const res = await loginUser({ username, password });
      console.log("Backend response:", res.data);

      if (res.data?.success === true && res.data?.token) {
        setSuccess("Login successful!");

        // store token correctly
        localStorage.setItem("token", res.data.token);

        // store role if needed
        localStorage.setItem("role", res.data.role);

        // redirect based on role
        if (res.data.role === "resident") {
          navigate("/resident-dashboard");
        } else if (res.data.role === "admin") {
          navigate("/dashboard");
        } else if (res.data.role === "meter-reader") {
          navigate("/meter-reader-dashboard");
        } else {
          navigate("/"); // fallback
        }
      } else {
        setError(res.data?.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || "Login failed. Check credentials."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Resident Login</h2>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 mb-4 text-center">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Username</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>

      <div className="absolute bottom-4 text-center text-sm w-full">
        <nav className="space-x-3">
          <Link to="/landing-page" className="text-blue-700 hover:underline">
            Home
          </Link>
          <span>|</span>
          <Link to="/admin-login" className="text-blue-700 hover:underline">
            Admin
          </Link>
          <span>|</span>
          <Link to="/resident-login" className="text-blue-700 hover:underline">
            Resident
          </Link>
          <span>|</span>
          <Link to="/meter-reader" className="text-blue-700 hover:underline">
            Meter Reader
          </Link>
        </nav>
      </div>
    </div>
  );
}
