import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchUserPayments, makePayment } from "../api/api.js";

const ResidentPaymentDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [payAmount, setPayAmount] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);

  const userId = localStorage.getItem("user_id");

  // -------------------------------
  // Fetch payments for logged-in resident
  // -------------------------------
  useEffect(() => {
    if (!userId) return;

    const loadPayments = async () => {
      try {
        const res = await fetchUserPayments(userId);
        setPayments(res.data.data || []);
      } catch (err) {
        console.error("❌ Error fetching payments:", err);
      }
    };

    loadPayments();
  }, [userId]);

  // -------------------------------
  // Handle input change
  // -------------------------------
  const handleChange = (id, value) => {
    setPayAmount((prev) => ({ ...prev, [id]: value }));
  };

  // -------------------------------
  // Handle payment submission
  // -------------------------------
  const handlePayment = async (record) => {
    const amount = Number(payAmount[record.id] || 0);
    if (amount <= 0 || amount > record.remaining_balance) {
      alert("Invalid payment amount");
      return;
    }

    try {
      const updatedPayment = {
        payment_1: Number((record.payment_1 || 0) + amount),
      };

      // Call backend
      const res = await makePayment(record.id, updatedPayment);

      // Update frontend state
      setPayments((prev) =>
        prev.map((p) =>
          p.id === record.id
            ? {
                ...p,
                payment_1: Number(res.data.data.payment_1 || 0),
                payment_2: Number(res.data.data.payment_2 || 0),
                remaining_balance: Number(res.data.data.remaining_balance || 0),
              }
            : p
        )
      );

      setPayAmount((prev) => ({ ...prev, [record.id]: "" }));
      alert("Payment successful!");
    } catch (err) {
      console.error("❌ Payment failed:", err);
      alert(err.response?.data?.message || "Payment failed!");
    }
  };

  // -------------------------------
  // Sidebar navigation items
  // -------------------------------
  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard" },
    { label: "Bills", path: "/bills" },
    { label: "Payments", path: "/payments" },
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
          <span>Resident Payment Dashboard</span>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="bg-blue-500 hover:bg-blue-600 p-2 rounded-full relative"
          >
            🔔
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {/* Total Paid */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-green-400 text-3xl font-bold drop-shadow-md">
              ₱{" "}
              {payments.reduce(
                (sum, row) =>
                  sum + Number(row.payment_1 || 0) + Number(row.payment_2 || 0),
                0
              )}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Total Paid</p>
          </div>

          {/* Total Outstanding */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-red-400 text-3xl font-bold drop-shadow-md">
              ₱{" "}
              {payments.reduce(
                (sum, row) => sum + Number(row.remaining_balance || 0),
                0
              )}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Outstanding Balance</p>
          </div>

          {/* Last Payment Date */}
          <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg">
            <p className="text-yellow-400 text-3xl font-bold drop-shadow-md">
              {payments.length > 0
                ? new Date(payments[0].created_at).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-gray-300 mt-1 text-sm">Last Payment</p>
          </div>
        </div>

        {/* Payment Records */}
        <div className="mt-10 grid gap-6">
          {payments.map((record) => (
            <div
              key={record.id}
              className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col gap-4"
            >
              <p><strong>Name:</strong> {record.name}</p>
              <p><strong>Total Bill:</strong> ₱ {record.total_bill}</p>
              <p><strong>Paid:</strong> ₱ {(Number(record.payment_1) || 0) + (Number(record.payment_2) || 0)}</p>
              <p><strong>Outstanding:</strong> ₱ {Number(record.remaining_balance) || 0}</p>

              {record.remaining_balance > 0 && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    min="0"
                    max={record.remaining_balance}
                    value={payAmount[record.id] || ""}
                    onChange={(e) => handleChange(record.id, e.target.value)}
                    className="p-2 rounded text-black w-32"
                    placeholder="Enter payment"
                  />
                  <button
                    onClick={() => handlePayment(record)}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                  >
                    Pay
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ResidentPaymentDashboard;
