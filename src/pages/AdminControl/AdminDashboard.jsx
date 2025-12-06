// AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { fetchConsumptions } from "../../api/api.js";
import SideBarHeader from "./SideBarHeader.jsx";

const AdminDashboard = () => {
  const [consumptions, setConsumptions] = useState([]);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  useEffect(() => {
    loadConsumptions();
  }, []);

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      setConsumptions(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching consumptions:", err);
    }
  };

  const years = Array.from(new Set(consumptions.map(c => new Date(c.billing_date || c.created_at).getFullYear())))
    .sort((a, b) => b - a);

  const filteredConsumptions = consumptions.filter(c => {
    const date = new Date(c.billing_date || c.created_at);
    return (!filterYear || date.getFullYear() === Number(filterYear)) &&
           (!filterMonth || date.getMonth() + 1 === Number(filterMonth));
  });

  const totalUsers = filteredConsumptions.length;
  const totalBill = filteredConsumptions.reduce((sum, c) => sum + Number(c.total_bill || 0), 0);
  const totalBalance = filteredConsumptions.reduce((sum, c) => sum + Number(c.remaining_balance || 0), 0);
  const totalIncome = filteredConsumptions.reduce((sum, c) => sum + Number(c.payment_1 || 0) + Number(c.payment_2 || 0), 0);
  const newUsers = filteredConsumptions.filter(c => {
    const created = new Date(c.created_at);
    return (!filterYear || created.getFullYear() === Number(filterYear)) &&
           (!filterMonth || created.getMonth() + 1 === Number(filterMonth));
  }).length;

  // Prepare data for line chart
  const chartDataMap = {};
  filteredConsumptions.forEach(c => {
    if (!c.billing_date) return;
    const date = new Date(c.billing_date);
    const monthName = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    const key = `${monthName} ${year}`;
    chartDataMap[key] = (chartDataMap[key] || 0) + Number(c.total_bill || 0);
  });

  const chartData = Object.entries(chartDataMap)
    .map(([key, total]) => {
      const [monthStr, yearStr] = key.split(" ");
      const month = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
      const year = Number(yearStr);
      return { monthKey: key, month, year, total };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map(item => ({ month: item.monthKey, total: item.total }));

  return (
    <SideBarHeader>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2 rounded shadow-inner">
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 rounded shadow-inner">
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mt-2">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-blue-600 text-3xl font-bold">{totalUsers}</p>
          <p className="text-gray-600 mt-1 text-sm">Total Users</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-green-600 text-3xl font-bold">₱ {totalBill.toLocaleString()}</p>
          <p className="text-gray-600 mt-1 text-sm">Overall Bill</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-red-600 text-3xl font-bold">₱ {totalBalance.toLocaleString()}</p>
          <p className="text-gray-600 mt-1 text-sm">Balance of All Consumers</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-yellow-600 text-3xl font-bold">₱ {totalIncome.toLocaleString()}</p>
          <p className="text-gray-600 mt-1 text-sm">Total Income</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <p className="text-purple-600 text-3xl font-bold">{newUsers}</p>
          <p className="text-gray-600 mt-1 text-sm">New Users</p>
        </div>
      </div>

      {/* Consumption Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-4">Consumption Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SideBarHeader>
  );
};

export default AdminDashboard;
