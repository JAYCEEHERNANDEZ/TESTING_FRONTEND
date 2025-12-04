import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBell,
  FaFolderOpen,
  FaUserCog,
  FaUsers,
  FaFileAlt,
} from "react-icons/fa";
import { fetchConsumptions } from "../api/api.js";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [consumptions, setConsumptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [filterMonth, setFilterMonth] = useState(""); // 1-12
  const [filterYear, setFilterYear] = useState(""); // YYYY

  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "Records", path: "/manage-records", icon: <FaFolderOpen /> },
    { label: "Notifications", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/reports", icon: <FaFileAlt /> },
  ];

  useEffect(() => {
    loadConsumptions();
    loadNotifications();

    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      setConsumptions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching consumptions:", err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      const notifs = res.data?.notifications || [];
      const adminNotifs = notifs.filter(n => n.user_id === null);
      setNotifications(adminNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleNotifClick = (notif) => {
    fetch(`/api/notifications/read/${notif.id}`, { method: "POST" });
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, is_read: 1 } : n))
    );

    const userIdMatch = notif.message.match(/User (\d+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;
    if (userId) navigate(`/manage-records?user_id=${userId}`);
  };

  // Filter consumptions by month and year
  const filteredConsumptions = consumptions.filter((c) => {
    const date = new Date(c.billing_date || c.created_at);
    const monthMatch = filterMonth ? date.getMonth() + 1 === Number(filterMonth) : true;
    const yearMatch = filterYear ? date.getFullYear() === Number(filterYear) : true;
    return monthMatch && yearMatch;
  });

  const totalUsers = consumptions.length;
  const totalBill = filteredConsumptions.reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
  const totalBalance = filteredConsumptions.reduce((sum, c) => sum + Number(c.remaining_balance || 0), 0);
  const totalIncome = filteredConsumptions.reduce(
    (sum, c) => sum + Number(c.payment_1 || 0) + Number(c.payment_2 || 0),
    0
  );
  const newUsers = consumptions.filter((c) => {
    const created = new Date(c.created_at);
    const monthMatch = filterMonth ? created.getMonth() + 1 === Number(filterMonth) : true;
    const yearMatch = filterYear ? created.getFullYear() === Number(filterYear) : true;
    return monthMatch && yearMatch;
  }).length;

  // Prepare chart data: last 6 months
  const chartData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthName = d.toLocaleString("default", { month: "short" });
    const monthSum = consumptions
      .filter(c => {
        const date = new Date(c.billing_date);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
    chartData.push({ month: `${monthName} ${year}`, total: monthSum });
  }

  // Get all available years for filter
  const years = Array.from(new Set(consumptions.map(c => new Date(c.billing_date || c.created_at).getFullYear())));

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-950 text-white flex flex-col transition-all duration-300 m-2 rounded-2xl ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}>
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
          {navItems.map(item => (
            <Link key={item.label} to={item.path} className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}>
              <span className="text-blue-600 text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 relative">
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-600 text-white py-4 px-5 rounded-xl shadow mb-6 text-xl font-semibold">
          <span>Admin Dashboard</span>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="bg-blue-500 hover:bg-blue-400 p-2 rounded-full relative">
              🔔
              {notifications.filter(n => n.is_read === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {notifications.filter(n => n.is_read === 0).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-600 text-center">No notifications</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${notif.is_read === 0 ? "bg-blue-50" : ""}`} onClick={() => handleNotifClick(notif)}>
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
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-2 border rounded">
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-2 border rounded">
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mt-2">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-blue-600 text-3xl font-bold">{totalUsers}</p>
            <p className="text-gray-600 mt-1 text-sm">Total Users</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-green-600 text-3xl font-bold">₱ {totalBill.toLocaleString()}</p>
            <p className="text-gray-600 mt-1 text-sm">Overall Bill</p>
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

        {/* 6-Month Consumption Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md mt-6">
          <h2 className="text-lg font-semibold mb-4">Consumption Trend (Last 6 Months)</h2>
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
    </div>
  );
};

export default AdminDashboard;
