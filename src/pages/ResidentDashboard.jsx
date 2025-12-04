import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUserCircle } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchConsumptionsByUser, fetchUserNotices, markNoticeAsRead } from "../api/api";

const ResidentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [consumptions, setConsumptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [kpis, setKpis] = useState({ avgConsumption: 0, avgBill: 0, complianceRate: 0 });

  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  // -------------------- LOAD CONSUMPTIONS --------------------
  useEffect(() => {
    if (userId) loadConsumptions(userId);
  }, [userId]);

  const loadConsumptions = async (userId) => {
    try {
      const res = await fetchConsumptionsByUser(userId);
      const data = res.data?.data || [];

      const currentYear = new Date().getFullYear();

      // Prepare months 1-12 with default zero
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        cubic_used: 0,
        current_bill: 0,
        remaining_balance: 0,
      }));

      // Fill actual data into months array
      data.forEach((c) => {
        const date = new Date(c.billing_date);
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth();
          months[monthIndex] = {
            month: monthIndex + 1,
            cubic_used: Number(c.cubic_used || 0),
            current_bill: Number(c.current_bill || 0),
            remaining_balance: Number(c.remaining_balance || 0),
          };
        }
      });

      setConsumptions(months);

      // Calculate KPI
      const totalConsumption = months.reduce((acc, m) => acc + m.cubic_used, 0);
      const totalBill = months.reduce((acc, m) => acc + m.current_bill, 0);
      const paidMonths = months.filter((m) => m.remaining_balance === 0).length;

      setKpis({
        avgConsumption: (totalConsumption / 12).toFixed(2),
        avgBill: (totalBill / 12).toFixed(2),
        complianceRate: ((paidMonths / 12) * 100).toFixed(0),
      });
    } catch (err) {
      console.error("Failed to fetch consumptions:", err);
    }
  };

  // -------------------- LOAD NOTIFICATIONS --------------------
  const loadNotifications = async () => {
    try {
      const res = await fetchUserNotices(userId);
      const data = res.data?.notifications || res.notifications || [];

      const userNotifs = data.filter((n) => n.user_id === null || Number(n.user_id) === Number(userId));
      const sorted = userNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(sorted);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // -------------------- MARK AS READ --------------------
  const handleMarkAsRead = async (notifId) => {
    try {
      await markNoticeAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // -------------------- LOGOUT --------------------
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Payments", path: "/payment", icon: <FaMoneyBillWave /> },
  ];

  // Get current and previous month
  const now = new Date();
  const currentMonthData = consumptions[now.getMonth()] || {};
  const previousMonthData = consumptions[now.getMonth() - 1] || {};

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
        ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>💧 SWS</h1>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-white hover:text-blue-400">☰</button>
            </div>
          ) : (
            <div className="flex justify-center w-full cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <h1 className="text-2xl font-bold text-blue-600">💧</h1>
            </div>
          )}
        </div>

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

        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && <span className="text-lg font-semibold text-blue-500 uppercase mb-2">SUCOL WATER SYSTEM</span>}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 relative m-2 ml-0">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold text-black">Resident Dashboard</span>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full relative"
            >
              🔔
              {notifications.filter((n) => Number(n.is_read) === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {notifications.filter((n) => Number(n.is_read) === 0).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${Number(notif.is_read) === 0 ? "bg-blue-50" : ""}`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-600">{notif.message}</p>
                      <small className="text-gray-500 text-xs">{new Date(notif.created_at).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* CURRENT & PREVIOUS MONTH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-blue-600 text-2xl font-bold">{currentMonthData?.cubic_used ?? 0} m³</p>
            <p className="text-gray-600 mt-1 text-sm">Current Month Usage</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-blue-400 text-2xl font-bold">{previousMonthData?.cubic_used ?? 0} m³</p>
            <p className="text-gray-600 mt-1 text-sm">Previous Month Usage</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-green-600 text-2xl font-bold">₱ {currentMonthData?.current_bill ?? 0}</p>
            <p className="text-gray-600 mt-1 text-sm">Current Bill</p>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-blue-600 text-2xl font-bold">{kpis.avgConsumption} m³</p>
            <p className="text-gray-600 mt-1 text-sm">Average Monthly Consumption (Year)</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-green-600 text-2xl font-bold">₱ {kpis.avgBill}</p>
            <p className="text-gray-600 mt-1 text-sm">Average Monthly Bill (Year)</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-red-600 text-2xl font-bold">{kpis.complianceRate}%</p>
            <p className="text-gray-600 mt-1 text-sm">Payment Compliance Rate (Year)</p>
          </div>
        </div>

        {/* CONSUMPTION TREND */}
        <div className="bg-white p-6 rounded-xl shadow-md mt-8">
          <h2 className="text-lg font-semibold text-black mb-4">Consumption Trend (This Year)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={consumptions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(m) => new Date(2023, m - 1).toLocaleString("default", { month: "short" })}
              />
              <YAxis label={{ value: "m³", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={(value) => `${value} m³`} />
              <Line type="monotone" dataKey="cubic_used" stroke="#1D4ED8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Confirm to log out?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleLogout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
