import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllBilling, fetchAllMonthlyIncome } from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AdminDashboard = () => {
  const [billingData, setBillingData] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Records", path: "/manage-records" },
    { label: "Notifications", path: "/notification-center" },
    { label: "Profiles", path: "/admin-profiles" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Reports", path: "/reports" },
  ];

  // Fetch billing data
  useEffect(() => {
    const getBilling = async () => {
      try {
        const res = await fetchAllBilling();
        if (res.data.success) setBillingData(res.data.data);
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      } finally {
        setLoading(false);
      }
    };
    getBilling();
  }, []);

  // Fetch monthly income data
  useEffect(() => {
    const getMonthlyIncome = async () => {
      try {
        const res = await fetchAllMonthlyIncome();
        if (res.data.success) setMonthlyIncome(res.data.data);
      } catch (err) {
        console.error("Failed to fetch monthly income:", err);
      }
    };
    getMonthlyIncome();
  }, []);

  // Compute summary stats
  const totalUsers = billingData.length;
  const totalBillAmount = billingData.reduce(
    (sum, b) => sum + Number(b.total_bill || 0),
    0
  );
  const totalBalance = billingData.reduce(
    (sum, b) => sum + Number(b.remaining_balance || 0),
    0
  );
  const totalIncome = monthlyIncome.reduce(
    (sum, m) => sum + Number(m.total_income || 0),
    0
  );

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

      {/* Main Content */}
      <main className="flex-1 p-10">
        {/* Title Bar */}
        <div className="bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
          Admin Dashboard
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-blue-800/40 transition-all">
            <p className="text-blue-400 text-3xl font-bold drop-shadow-md">
              {totalUsers}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Total Users</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-green-800/40 transition-all">
            <p className="text-green-400 text-3xl font-bold drop-shadow-md">
              ₱ {totalBillAmount.toLocaleString()}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Total Bill Amount</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-red-800/40 transition-all">
            <p className="text-red-400 text-3xl font-bold drop-shadow-md">
              ₱ {totalBalance.toLocaleString()}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Total Outstanding Balance</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-yellow-800/40 transition-all">
            <p className="text-yellow-400 text-3xl font-bold drop-shadow-md">
              ₱ {totalIncome.toLocaleString()}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Total Income Collected</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg hover:shadow-purple-800/40 transition-all">
            <p className="text-purple-400 text-3xl font-bold drop-shadow-md">
              {billingData.length > 0
                ? new Date(
                    Math.max(...billingData.map((b) => new Date(b.created_at)))
                  ).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Last Record Created</p>
          </div>
        </div>

        {/* BILLING TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">
            User Billing Records
          </h3>
          {loading ? (
            <p className="text-gray-300">Loading...</p>
          ) : (
            <table className="w-full text-left border-collapse text-gray-300">
              <thead>
                <tr className="bg-white/5">
                  {[
                    "User ID",
                    "Name",
                    "Cubic Used",
                    "Current Bill",
                    "Total Bill",
                    "Payments",
                    "Remaining Balance",
                    "Created At",
                  ].map((col) => (
                    <th
                      key={col}
                      className="border-b border-gray-600 p-2 text-blue-300"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billingData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition">
                    <td className="border-b border-gray-700/50 p-2">{row.user_id}</td>
                    <td className="border-b border-gray-700/50 p-2">{row.name}</td>
                    <td className="border-b border-gray-700/50 p-2">{row.cubic_used}</td>
                    <td className="border-b border-gray-700/50 p-2">₱ {row.current_bill}</td>
                    <td className="border-b border-gray-700/50 p-2">₱ {row.total_bill}</td>
                    <td className="border-b border-gray-700/50 p-2">
                      ₱ {(Number(row.payment_1 || 0) + Number(row.payment_2 || 0)).toLocaleString()}
                    </td>
                    <td className="border-b border-gray-700/50 p-2">₱ {row.remaining_balance}</td>
                    <td className="border-b border-gray-700/50 p-2">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MONTHLY INCOME TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Monthly Income</h3>
          <table className="w-full text-left border-collapse text-gray-300">
            <thead>
              <tr className="bg-white/5">
                {["Month", "Year", "Total Income"].map((col) => (
                  <th
                    key={col}
                    className="border-b border-gray-600 p-2 text-blue-300"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyIncome.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition">
                  <td className="border-b border-gray-700/50 p-2">{row.month}</td>
                  <td className="border-b border-gray-700/50 p-2">{row.year}</td>
                  <td className="border-b border-gray-700/50 p-2">
                    ₱ {Number(row.total_income).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MONTHLY INCOME BAR CHART */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">
            Monthly Income Chart
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={monthlyIncome}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_income" name="Income" fill="#facc15" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
