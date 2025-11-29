import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchUserBilling, fetchConsumptionsByUser } from "../api/api.js";

const ResidentDashboard = () => {
  const [billing, setBilling] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get logged-in user's ID
  // Correct key
const userId = localStorage.getItem("user_id");

  /* -------------------------------------------------------
     FETCH USER BILLING RECORDS
  ------------------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    const loadBilling = async () => {
      try {
        const res = await fetchUserBilling(userId);
        setBilling(res.data.data || []);
      } catch (error) {
        console.error("❌ Error loading billing:", error);
      }
    };

    loadBilling();
  }, [userId]);

  /* -------------------------------------------------------
     FETCH USER WATER CONSUMPTION
  ------------------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    const loadConsumptions = async () => {
      try {
        const res = await fetchConsumptionsByUser(userId);
        setConsumptions(res.data.data || []);
      } catch (error) {
        console.error("❌ Error loading consumptions:", error);
      }
    };

    loadConsumptions();
  }, [userId]);

  /* -------------------------------------------------------
     NAVIGATION LINKS
  ------------------------------------------------------- */
  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard" },
    { label: "Bills", path: "/bills" },
    { label: "Payments", path: "/payment" },
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
      <main className="flex-1 p-10 relative">
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
          <span>Resident Dashboard</span>

          {/* Notification Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full relative"
          >
            🔔
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

          {/* Total Consumption */}
         {/* Total Consumption */}
<div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
  <p className="text-blue-400 text-3xl font-bold drop-shadow-md">
    {consumptions.length > 0
      ? consumptions[0].cubic_used // latest entry first
      : 0} m³
  </p>
  <p className="text-gray-300 mt-1 text-sm">Total Consumption</p>
</div>


          {/* Total Bill */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-green-400 text-3xl font-bold drop-shadow-md">
              ₱{" "}
              {billing.reduce(
                (sum, row) => sum + Number(row.current_bill || 0),
                0
              )}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Current Bill</p>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-red-400 text-3xl font-bold drop-shadow-md">
              ₱{" "}
              {billing.reduce(
                (sum, row) => sum + Number(row.remaining_balance || 0),
                0
              )}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Remaing balance</p>
          </div>

          {/* Last Payment */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-yellow-400 text-3xl font-bold drop-shadow-md">
              {billing.length > 0
                ? new Date(billing[0].created_at).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Last Payment</p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ResidentDashboard;
