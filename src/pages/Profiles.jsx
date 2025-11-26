import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsers } from "../api/api"; // your existing api.js

const Profiles = () => {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchUsers()
      .then((res) => {
        setRecords(res.data.message ?? []);
      })
      .catch((err) => console.error(err));
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Records", path: "/records" },
    { label: "Notification", path: "/notification-center" },
    { label: "Profiles", path: "/profiles" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Reports", path: "/reports" },
  ];

  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">

      {/* Sidebar */}
      <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-blue-400 drop-shadow-lg mb-10 tracking-wide">
          Sucol Water System
        </h2>

        <nav className="flex flex-col gap-4 text-gray-300">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="hover:text-blue-400 hover:translate-x-1 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        
        {/* Title Bar */}
        <div className="bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
          User Profiles
        </div>

        {/* PROFILES TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Usernames</h3>

          <table className="w-full border-collapse text-gray-300">
  <thead>
    <tr className="bg-white/5 border-b border-gray-600">
      <th className="p-3 text-left text-blue-300">Name</th>
      <th className="p-3 text-left text-blue-300">Status</th>
    </tr>
  </thead>

  <tbody>
    {records.length === 0 ? (
      <tr>
        <td colSpan="2" className="p-3 text-center text-gray-500">No users found...</td>
      </tr>
    ) : (
      records.map((rec, index) => (
        <tr
          key={index}
          className="border-b border-gray-700/50 hover:bg-white/5 transition"
        >
          <td className="p-3">{rec.name ?? "N/A"}</td>
          <td className="p-3">
            <span
              className={
                rec.status === "active"
                  ? "text-green-400 font-semibold"
                  : "text-red-400 font-semibold"
              }
            >
              {rec.status ?? "N/A"}
            </span>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>

        </div>

      </main>
    </div>
  );
};

export default Profiles;
