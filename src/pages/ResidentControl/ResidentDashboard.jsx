import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ResidentLayout from "./ResidentLayout.jsx";
import {
  fetchConsumptionsByUser,
  fetchUserNotices,
  markNoticeAsRead,
} from "../../api/api.js";

const ResidentDashboard = () => {
  const [consumptions, setConsumptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [kpis, setKpis] = useState({
    avgConsumption: 0,
    avgBill: 0,
    complianceRate: 0,
  });

  const userId = localStorage.getItem("user_id");

  // -------------------- Load consumptions --------------------
  useEffect(() => {
    if (userId) loadConsumptions(userId);
  }, [userId]);

  const loadConsumptions = async (userId) => {
    try {
      const res = await fetchConsumptionsByUser(userId);
      const data = res.data?.data || [];

      const currentYear = new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        cubic_used: 0,
        current_bill: 0,
        remaining_balance: 0,
      }));

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

      // Calculate KPIs
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

  // -------------------- Load notifications --------------------
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchUserNotices(userId);
      const data = res.data?.notifications || res.notifications || [];
      const userNotifs = data.filter(
        (n) => n.user_id === null || Number(n.user_id) === Number(userId)
      );
      const sorted = userNotifs.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

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

  // -------------------- Current & Previous Month Data --------------------
  const now = new Date();
  const currentMonthData = consumptions[now.getMonth()] || {};
  const previousMonthData = consumptions[now.getMonth() - 1] || {};

  return (
    <ResidentLayout
      notifications={notifications}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      handleMarkAsRead={handleMarkAsRead}
    >
      {/* CURRENT & PREVIOUS MONTH USAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-600 text-2xl font-bold">
            {currentMonthData?.cubic_used ?? 0} m³
          </p>
          <p className="text-gray-600 mt-1 text-sm">Current Month Usage</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-400 text-2xl font-bold">
            {previousMonthData?.cubic_used ?? 0} m³
          </p>
          <p className="text-gray-600 mt-1 text-sm">Previous Month Usage</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-green-600 text-2xl font-bold">
            ₱ {currentMonthData?.current_bill ?? 0}
          </p>
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

      {/* CONSUMPTION TREND CHART */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-8">
        <h2 className="text-lg font-semibold text-black mb-4">Consumption Trend (This Year)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={consumptions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(m) =>
                new Date(new Date().getFullYear(), m - 1).toLocaleString("default", { month: "short" })
              }
            />
            <YAxis label={{ value: "m³", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => `${value} m³`} />
            <Line type="monotone" dataKey="cubic_used" stroke="#1D4ED8" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ResidentLayout>
  );
};

export default ResidentDashboard;
