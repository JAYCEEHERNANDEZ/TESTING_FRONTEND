import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUserPayments,
  makePayment,
  fetchUserNotifications,
  markNotificationAsRead,
} from "../api/api.js";
import { FaTachometerAlt, FaFileInvoiceDollar, FaMoneyBillWave, FaUserCircle } from "react-icons/fa";

const ResidentPaymentDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [payAmount, setPayAmount] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));
  const navigate = useNavigate();

  /* ------------------ FETCH PAYMENTS ------------------ */
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

  /* ------------------ FETCH NOTIFICATIONS ------------------ */
  const loadNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetchUserNotifications(userId);
      if (res.data.success) setNotifications(res.data.notifications);
    } catch (err) {
      console.error("❌ Error fetching notifications:", err);
    }
  };

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

  /* ------------------ PAYMENT HANDLERS ------------------ */
  const handleChange = (id, paymentField, value) => {
    let numericValue = Number(value);
    if (numericValue < 0) numericValue = 0;
    setPayAmount((prev) => ({
      ...prev,
      [id]: { ...prev[id], [paymentField]: numericValue },
    }));
  };

  const handlePayment = async (record, paymentField) => {
    let currentPayment = 0;

    if (paymentField === "payment_1") {
      currentPayment = Number(payAmount[record.id]?.payment_1 || 0);
      if (currentPayment <= 0 || currentPayment > record.remaining_balance) {
        alert("Invalid Payment 1 amount");
        return;
      }
    }

   if (paymentField === "payment_2") {
  if (Number(record.payment_1) === 0) {
    alert("Cannot pay Payment 2 before Payment 1");
    return;
  }

  // Get what the user typed
  currentPayment = Number(payAmount[record.id]?.payment_2 || 0);

  // Validate before sending
  if (currentPayment !== Number(record.remaining_balance)) {
    alert(`Payment 2 must be exactly ₱${record.remaining_balance}`);
    return; // Stop API call
  }
}

    try {
      // Send only the field being updated
      const payload = { [paymentField]: currentPayment };
      const res = await makePayment(record.id, payload);
      const updatedRecord = res.data.data;

      setPayments((prev) =>
        prev.map((p) =>
          p.id === updatedRecord.id
            ? {
                ...p,
                payment_1: Number(updatedRecord.payment_1 || 0),
                payment_2: Number(updatedRecord.payment_2 || 0),
                remaining_balance: Number(updatedRecord.remaining_balance || 0),
              }
            : p
        )
      );

      setPayAmount((prev) => ({ ...prev, [record.id]: {} }));
      alert(`${paymentField.replace("_", " ").toUpperCase()} successful!`);
    } catch (err) {
      console.error("❌ Payment failed:", err);
      alert(err.response?.data?.message || "Payment failed!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Bills", path: "/bills", icon: <FaFileInvoiceDollar /> },
    { label: "Payments", path: "/payments", icon: <FaMoneyBillWave /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
      >
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

        {/* Navigation */}
        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 pr-0 hover:bg-blue-100 rounded transition-all ${
                sidebarOpen ? "justify-start px-4" : "justify-center"
              }`}
            >
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto mb-4 py-2 px-2 text-center transition-all duration-300 flex flex-col items-center">
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
      <main className="flex-1 p-4 relative m-2 ml-0">
        {/* Header */}
        <div className="flex justify-between items-center bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold text-black">
            Resident Payment Dashboard
          </span>

          {/* Notification */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-green-600 text-2xl font-bold">
              ₱{" "}
              {payments.reduce(
                (sum, row) =>
                  sum + Number(row.payment_1 || 0) + Number(row.payment_2 || 0),
                0
              )}
            </p>
            <p className="text-gray-600 mt-1 text-sm">Total Paid</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-red-600 text-2xl font-bold">
              ₱{" "}
              {payments.reduce(
                (sum, row) => sum + Number(row.remaining_balance || 0),
                0
              )}
            </p>
            <p className="text-gray-600 mt-1 text-sm">Outstanding Balance</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-yellow-600 text-2xl font-bold">
              {payments.length > 0
                ? new Date(payments[0].created_at).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-gray-600 mt-1 text-sm">Last Payment</p>
          </div>
        </div>

        {/* Payment Records */}
        <div className="mt-10 grid gap-6">
          {payments.map((record) => (
            <div
              key={record.id}
              className="bg-white p-6 rounded-xl shadow-lg flex flex-col gap-4"
            >
              <p><strong>Name:</strong> {record.name}</p>
              <p><strong>Previous Reading:</strong> {record.previous_reading} m³</p>
              <p><strong>Current Reading:</strong> {record.present_reading} m³</p>
              <p><strong>Total Bill:</strong> ₱ {record.total_bill}</p>
              <p><strong>Payment 1:</strong> ₱ {Number(record.payment_1) || 0}</p>
              <p><strong>Payment 2:</strong> ₱ {Number(record.payment_2) || 0}</p>
              <p><strong>Remaining Balance:</strong> ₱ {Number(record.remaining_balance) || 0}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={Number(record.remaining_balance) === 0 ? "text-green-400" : "text-red-500"}>
                  {Number(record.remaining_balance) === 0 ? "PAID" : "UNPAID"}
                </span>
              </p>

              {/* Payment 1 Input */}
              {Number(record.remaining_balance) > 0 && Number(record.payment_1) === 0 && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="number"
                    min="0"
                    max={record.remaining_balance}
                    value={payAmount[record.id]?.payment_1 || ""}
                    onChange={(e) => handleChange(record.id, "payment_1", e.target.value)}
                    className="p-2 rounded text-black w-32"
                    placeholder="Enter Payment 1"
                  />
                  <button
                    onClick={() => handlePayment(record, "payment_1")}
                    className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                  >
                    Pay Payment 1
                  </button>
                </div>
              )}

              {/* Payment 2 Input */}
{Number(record.payment_1) > 0 && Number(record.remaining_balance) > 0 && (
  <div className="flex gap-2 items-center mt-2">
    <input
      type="number"
      min="0"
      value={payAmount[record.id]?.payment_2 || ""}
      onChange={(e) => handleChange(record.id, "payment_2", e.target.value)}
      className="p-2 rounded text-black w-32"
      placeholder={`Enter exact remaining: ₱${record.remaining_balance}`}
    />
    <button
      onClick={() => handlePayment(record, "payment_2")}
      className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded"
    >
      Pay Payment 2
    </button>
  </div>
)}

            </div>
          ))}
        </div>
      </main>

      {/* Logout Modal */}
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

export default ResidentPaymentDashboard;
