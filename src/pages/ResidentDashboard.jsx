import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUserBilling,
  fetchConsumptionsByUser,
  fetchUserNotifications,
  markNotificationAsRead,
} from "../api/api.js";
import {  
  FaTachometerAlt,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaUserCircle,
} from "react-icons/fa";

const ResidentDashboard = () => {
  const [billing, setBilling] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));
  const navigate = useNavigate();

  /* ----------------------------- FETCH BILLING ----------------------------- */
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

  /* ----------------------------- FETCH CONSUMPTIONS ----------------------------- */
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

  /* ----------------------------- FETCH NOTIFICATIONS ----------------------------- */
  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetchUserNotifications(userId);
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
    }
  };

  /* ----------------------------- MARK NOTIFICATION AS READ ----------------------------- */
  const handleMarkAsRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("❌ Failed to mark notification as read:", err);
    }
  };

  /* ----------------------------- LOGOUT FUNCTION ----------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  /* ----------------------------- NAV ITEMS ----------------------------- */
  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Bills", path: "/bills", icon: <FaFileInvoiceDollar /> },
    { label: "Payments", path: "/payment", icon: <FaMoneyBillWave /> },
  ];

  // Get latest consumption for current month
  const latestConsumption = consumptions[0] || {};
  // Get previous month data
  const prevConsumption = consumptions[1] || {};

latestConsumption.cubic_used_last_month   // Previous Month Usage
latestConsumption.previous_reading        // Previous Month Bill


  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
          ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        {/* Logo / Top */}
        <div className="flex items-center justify-between mt-8 mb-8 px-4 transition-all duration-300">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <h1 className="text-2xl font-bold text-blue-600">💧</h1>
                <h1 className="text-2xl font-bold text-blue-600">SWS</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-2xl text-white hover:text-blue-400 transition-colors"
              >
                ☰
              </button>
            </div>
          ) : (
            <div
              className="flex justify-center w-full cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <h1 className="text-2xl font-bold text-blue-600">💧</h1>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 pr-0 hover:bg-blue-100 rounded transition-all
                ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}
            >
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && (
            <span className="text-lg font-semibold text-blue-500 uppercase mb-2">
              SUCOL WATER SYSTEM
            </span>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 relative m-2 ml-0 ">
        {/* Header */}
        <div className="flex justify-between items-center bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold text-black">Resident Dashboard</span>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
              className="bg-blue-500 hover:bg-blue-200 p-2 rounded-full relative"
            >
              🔔
              {notifications.some((n) => n.is_read === 0) && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {notifications.filter((n) => n.is_read === 0).length}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${
                        notif.is_read === 0 ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-600">{notif.message}</p>
                      <small className="text-gray-500 text-xs">
                        {new Date(notif.created_at).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mt-8">
          {/* Total Consumption (Current Month) */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-blue-600 text-2xl font-bold">{latestConsumption.cubic_used ?? 0} m³</p>
            <p className="text-gray-600 mt-1 text-sm">Total Consumption</p>
          </div>

          {/* Previous Month Consumption */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-blue-400 text-2xl font-bold">
              {latestConsumption.cubic_used_last_month  ?? 0} m³
            </p>
            <p className="text-gray-600 mt-1 text-sm">Previous Month Usage</p>
          </div>

          {/* Current Bill */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-green-600 text-2xl font-bold">₱ {latestConsumption.current_bill ?? 0}</p>
            <p className="text-gray-600 mt-1 text-sm">Current Bill</p>
          </div>

          {/* Previous Month Bill */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-green-400 text-2xl font-bold">₱ {latestConsumption.previous_reading ?? 0}</p>
            <p className="text-gray-600 mt-1 text-sm">Previous Month Bill</p>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-red-600 text-2xl font-bold">₱ {latestConsumption.remaining_balance ?? 0}</p>
            <p className="text-gray-600 mt-1 text-sm">Remaining Balance</p>
          </div>

          {/* Last Payment */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-yellow-600 text-2xl font-bold">
              {latestConsumption.created_at
                ? new Date(latestConsumption.created_at).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-gray-600 mt-1 text-sm">Last Payment</p>
          </div>
        </div>
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Confirm to log out?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
