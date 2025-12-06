import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

      // Sort data by billing_date ascending
      const sortedData = data
        .map((c) => ({
          ...c,
          billing_date: new Date(c.billing_date),
          cubic_used: Number(c.cubic_used || 0),
          current_bill: Number(c.current_bill || 0),
          remaining_balance: Number(c.remaining_balance || 0),
        }))
        .sort((a, b) => a.billing_date - b.billing_date);

      // Map to chart-friendly format
      const chartData = sortedData.map((c) => ({
        date: c.billing_date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        cubic_used: c.cubic_used,
        current_bill: c.current_bill,
        remaining_balance: c.remaining_balance,
      }));

      setConsumptions(chartData);

      // Calculate KPIs based on all data
      const totalConsumption = chartData.reduce((acc, m) => acc + m.cubic_used, 0);
      const totalBill = chartData.reduce((acc, m) => acc + m.current_bill, 0);
      const paidMonths = chartData.filter((m) => m.remaining_balance === 0).length;

      setKpis({
        avgConsumption: (totalConsumption / chartData.length || 0).toFixed(2),
        avgBill: (totalBill / chartData.length || 0).toFixed(2),
        complianceRate: ((paidMonths / chartData.length) * 100 || 0).toFixed(0),
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
  const currentMonthData = consumptions[consumptions.length - 1] || {};
  const previousMonthData = consumptions[consumptions.length - 2] || {};

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
          <p className="text-gray-600 mt-1 text-sm">Average Consumption</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-green-600 text-2xl font-bold">₱ {kpis.avgBill}</p>
          <p className="text-gray-600 mt-1 text-sm">Average Bill</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-red-600 text-2xl font-bold">{kpis.complianceRate}%</p>
          <p className="text-gray-600 mt-1 text-sm">Payment Compliance</p>
        </div>
      </div>

      {/* OVERALL CONSUMPTION & BILL TREND */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-8">
        <h2 className="text-lg font-semibold text-black mb-4">Overall Usage & Billing Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={consumptions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value, name) =>
                name === "Current Bill" ? `₱${value}` : `${value} m³`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cubic_used"
              stroke="#1D4ED8"
              strokeWidth={3}
              name="Cubic Used"
            />
            <Line
              type="monotone"
              dataKey="current_bill"
              stroke="#DC2626"
              strokeWidth={3}
              name="Current Bill"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ResidentLayout>
  );
};

export default ResidentDashboard;
