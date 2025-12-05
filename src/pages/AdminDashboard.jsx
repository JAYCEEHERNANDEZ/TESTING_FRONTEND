import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaFolderOpen,
  FaUserCog,
  FaUsers,
  FaFileAlt,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";
import {
  fetchConsumptions,
  fetchAdminNotifications,
  markAdminNotificationRead,
} from "../api/api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [consumptions, setConsumptions] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const navigate = useNavigate();
  const notifRef = useRef();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "User Payments", path: "/manage-records", icon: <FaFolderOpen /> },
    { label: "Notifications Center", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/manage-records", icon: <FaFileAlt /> },
  ];

  // ---------------- Load Consumptions ----------------
  useEffect(() => {
    const loadConsumptions = async () => {
      try {
        const res = await fetchConsumptions();
        setConsumptions(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching consumptions:", err);
      }
    };
    loadConsumptions();
  }, []);

  // ---------------- Load Admin Notifications + Polling ----------------
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAdminNotifications();
        setAdminNotifications(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching admin notifications:", err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, []);

  // ---------------- Close dropdown when clicking outside ----------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------------- Filter Consumptions ----------------
  const filteredConsumptions = consumptions.filter((c) => {
    const date = new Date(c.billing_date || c.created_at);
    const monthMatch = filterMonth ? date.getMonth() + 1 === Number(filterMonth) : true;
    const yearMatch = filterYear ? date.getFullYear() === Number(filterYear) : true;
    return monthMatch && yearMatch;
  });

  // ---------------- KPIs ----------------
  const now = new Date();
  const last12Months = Array.from({ length: 12 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - i, 1)
  );

  const kpiConsumptions = last12Months.flatMap((monthDate) =>
    consumptions.filter((c) => {
      const date = new Date(c.billing_date || c.created_at);
      return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
    })
  );

  const totalUsers = new Set(kpiConsumptions.map((c) => c.user_id)).size;
  const totalBill = kpiConsumptions.reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
  const totalBalance = kpiConsumptions.reduce((sum, c) => sum + Number(c.remaining_balance || 0), 0);
  const totalIncome = kpiConsumptions.reduce(
    (sum, c) => sum + Number(c.payment_1 || 0) + Number(c.payment_2 || 0),
    0
  );
  const newUsers = kpiConsumptions.filter((c) => {
    const created = new Date(c.created_at);
    return last12Months.some(
      (monthDate) =>
        monthDate.getMonth() === created.getMonth() && monthDate.getFullYear() === created.getFullYear()
    );
  }).length;

  // ---------------- Chart Data ----------------
  const chartData = last12Months
    .slice()
    .reverse()
    .map((monthDate) => {
      const monthSum = consumptions
        .filter((c) => {
          const date = new Date(c.billing_date || c.created_at);
          return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
        })
        .reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
      return {
        month: monthDate.toLocaleString("default", { month: "short", year: "numeric" }),
        total: monthSum,
      };
    });

  const years = Array.from(
    new Set(consumptions.map((c) => new Date(c.billing_date || c.created_at).getFullYear()))
  );

  // ---------------- Logout ----------------
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  // ---------------- Mark notification as read ----------------
  const handleReadNotification = async (notifId) => {
    try {
      await markAdminNotificationRead(notifId);
      setAdminNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 m-2 rounded-2xl ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1
                className="text-2xl font-bold text-blue-600 cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                💧 SWS
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-2xl text-white hover:text-blue-400"
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

        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all ${
                sidebarOpen ? "justify-start px-4" : "justify-center"
              }`}
            >
              <span className="text-blue-600 text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && (
            <span className="text-lg font-semibold text-blue-500 uppercase mb-2">
              SUCOL WATER SYSTEM
            </span>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-white text-blue-600 py-2 px-5 rounded-xl shadow mb-6 text-xl font-semibold">
          <span className="text-xl font-bold">Admin Dashboard</span>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full relative"
            >
              🔔
              {adminNotifications.filter((n) => Number(n.is_read) === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {adminNotifications.filter((n) => Number(n.is_read) === 0).length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {adminNotifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  adminNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${
                        Number(notif.is_read) === 0 ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleReadNotification(notif.id)}
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

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mt-2">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-blue-600 text-3xl font-bold">{totalUsers}</p>
            <p className="text-gray-600 mt-1 text-sm">Total Users (Last 12 Months)</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-green-600 text-3xl font-bold">₱ {totalBill.toLocaleString()}</p>
            <p className="text-gray-600 mt-1 text-sm">Overall Bill (Last 12 Months)</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-red-600 text-3xl font-bold">₱ {totalBalance.toLocaleString()}</p>
            <p className="text-gray-600 mt-1 text-sm">Balance of All Consumers</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-yellow-600 text-3xl font-bold">₱ {totalIncome.toLocaleString()}</p>
            <p className="text-gray-600 mt-1 text-sm">Total Income</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-purple-600 text-3xl font-bold">{newUsers}</p>
            <p className="text-gray-600 mt-1 text-sm">New Users</p>
          </div>
        </div>

        {/* 12-Month Consumption Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md mt-6">
          <h2 className="text-lg font-semibold mb-4">Consumption Trend (Last 12 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
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

export default AdminDashboard;
