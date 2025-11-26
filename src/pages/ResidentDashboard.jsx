import React from "react";
import { Link } from "react-router-dom";

const ResidentDashboard = () => {
  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard" },
    { label: "Profile", path: "/profile" },
    { label: "Bills", path: "/bills" },
    { label: "Payments", path: "/payments" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white font-sans">

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

      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Header */}
        <div className="bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
          Resident Dashboard
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            { num: "120 m³", label: "Total Consumption", color: "blue" },
            { num: "₱ 3,600", label: "Total Bill", color: "green" },
            { num: "₱ 1,200", label: "Balance", color: "red" },
            { num: "2025-11-01", label: "Last Payment", color: "yellow" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-blue-800/40 transition-all"
            >
              <p className={`text-${item.color}-400 text-3xl font-bold drop-shadow-md`}>
                {item.num}
              </p>
              <p className="text-gray-300 mt-1 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        {/* CONSUMPTION TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Consumption Records</h3>

          <table className="w-full text-left border-collapse text-gray-300">
            <thead>
              <tr className="bg-white/5">
                {["Month", "Cubic Meter Used", "Bill Amount", "Date of Payment", "Balance", "Action"].map(
                  (col) => (
                    <th key={col} className="border-b border-gray-600 p-2 text-blue-300">
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {[
                { month: "October 2025", used: "30 m³", bill: "₱ 900", date: "2025-10-15", balance: "₱ 0", paid: true },
                { month: "September 2025", used: "28 m³", bill: "₱ 840", date: "—", balance: "₱ 840", paid: false },
                { month: "August 2025", used: "25 m³", bill: "₱ 750", date: "—", balance: "₱ 750", paid: false },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="border-b border-gray-700/50 p-2">{row.month}</td>
                  <td className="border-b border-gray-700/50 p-2">{row.used}</td>
                  <td className="border-b border-gray-700/50 p-2">{row.bill}</td>
                  <td className="border-b border-gray-700/50 p-2">{row.date}</td>
                  <td
                    className={`border-b border-gray-700/50 p-2 ${
                      row.balance === "₱ 0" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {row.balance}
                  </td>
                  <td className="border-b border-gray-700/50 p-2 text-center">
                    {row.paid ? (
                      <button disabled className="bg-gray-300 text-gray-600 px-3 py-1 rounded cursor-not-allowed">
                        Paid
                      </button>
                    ) : (
                      <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                        Pay Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default ResidentDashboard;
