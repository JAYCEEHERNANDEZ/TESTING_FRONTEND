import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUserCircle, FaBell, FaHistory, FaCheck } from "react-icons/fa";
import { fetchUserPayments, uploadPaymentProof, fetchUserById, fetchUserNotificationsPerUser, readNotificationPerUser } from "../api/api.js";
import QR from "../Pictures/qr-code.png";

const ResidentPaymentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [latestUnpaid, setLatestUnpaid] = useState(null);
  const [currentPaid, setCurrentPaid] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [proofImage, setProofImage] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));

  // ---------------- Load User Info ----------------
  const loadUserData = async () => {
    try {
      const res = await fetchUserById(userId);
      setUserData(res.data.data);
    } catch (err) {
      console.error("Error fetching user info:", err);
    }
  };

  // ---------------- Load Payments ----------------
  const loadPayments = async () => {
    try {
      const res = await fetchUserPayments(userId);
      const sorted = res.data.data.sort(
        (a, b) => new Date(b.billing_date) - new Date(a.billing_date)
      );
      setPaymentHistory(sorted);

      const unpaid = sorted.find((p) => p.status !== "Paid") || null;
      setLatestUnpaid(unpaid);

      const now = new Date();
      const paidNow = sorted.find(
        (p) =>
          p.status === "Paid" &&
          new Date(p.billing_date).getMonth() === now.getMonth() &&
          new Date(p.billing_date).getFullYear() === now.getFullYear()
      );
      setCurrentPaid(paidNow || null);

      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setReferenceCode("");
    setProofImage(null);
  };

  // ---------------- Load Notifications ----------------
  const loadNotifications = async () => {
    try {
      const res = await fetchUserNotificationsPerUser(userId);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // ---------------- Lifecycle ----------------
  useEffect(() => {
    if (userId) {
      loadPayments();
      loadUserData();
      loadNotifications();
    }
  }, [userId]);

  // ---------------- Handlers ----------------
  const handleImageUpload = (e) => setProofImage(e.target.files[0]);

  const handleSubmitProof = async () => {
    if (!latestUnpaid) return;
    if (!referenceCode.trim()) return alert("Enter GCash reference code!");
    if (!proofImage) return alert("Upload proof image!");

    const amount = latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0);
    if (amount <= 0) return alert("This bill is already fully paid or pending verification.");

    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bill_id", latestUnpaid.id);
      formData.append("amount", amount);
      formData.append("payment_type", "full"); 
      formData.append("reference_code", referenceCode.trim());
      formData.append("proof", proofImage);

      await uploadPaymentProof(formData);
      alert("Payment submitted! Waiting for admin verification.");
      loadPayments();
    } catch (err) {
      console.error(err);
      alert("Submission failed. Try again!");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await readNotificationPerUser(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // ---------------- Helpers ----------------
  const getStatusClass = (status) => {
    switch (status) {
      case "Paid": return "bg-green-200 text-green-800";
      case "Partial": return "bg-yellow-200 text-yellow-800";
      default: return "bg-red-200 text-red-800";
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Payments", path: "/payment", icon: <FaMoneyBillWave /> },
  ];

  // ---------------- Render ----------------
  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
        ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}>
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex justify-between w-full">
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
            <Link key={item.label} to={item.path} className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all
              ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}>
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto mb-4 text-center flex flex-col items-center gap-2">
          {sidebarOpen && <p className="text-lg font-semibold text-blue-500 uppercase mb-2">SUCOL WATER SYSTEM</p>}
          <button className="text-red-500 hover:text-red-400 flex items-center gap-1" onClick={handleLogout}>
            <FaUserCircle className="text-2xl inline" /> {sidebarOpen && "Logout"}
          </button>
          {/* Notification Bell */}
          <div className="relative mt-2">
            <button
              className="text-yellow-400 text-2xl relative"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            >
              <FaBell />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg max-h-96 overflow-y-auto z-50">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-500">No notifications</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 border-b flex justify-between items-start ${notif.is_read ? "bg-gray-100" : "bg-blue-100"}`}
                    >
                      <div>
                        <h4 className="font-semibold">{notif.title}</h4>
                        <p className="text-sm text-gray-700">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="ml-2 bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs"
                        >
                          <FaCheck /> Mark Read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 m-2 ml-0">
        <div className="bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold">Resident Payments</span>
          {userData && (
            <p className="text-sm text-gray-600 mt-1">
              Account Status: <span className={getStatusClass(userData.status || "Unpaid")}>{userData.status || "Unpaid"}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-blue-600 text-xl font-bold">
                    ₱ {latestUnpaid ? (latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0)) : 0}
                  </p>
                  {latestUnpaid && (
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(latestUnpaid.status)}`}>
                      {latestUnpaid.status}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">Latest Unpaid Bill</p>
                {latestUnpaid && <span className="text-xs text-gray-500">Due: {new Date(latestUnpaid.due_date).toLocaleDateString()}</span>}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-green-600 text-xl font-bold">₱ {currentPaid?.payment_total ?? 0}</p>
                <p className="text-gray-600 mt-1">Current Month Paid</p>
                {currentPaid && <span className="text-xs text-gray-500">Status: {currentPaid.status}</span>}
              </div>
            </div>

            {/* Payment Form */}
            {latestUnpaid && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold mb-3">Submit GCash Payment</h3>

                <input
                  type="text"
                  placeholder="Enter GCash reference code"
                  className="w-full p-2 border rounded mb-3"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                />

                <div className="mb-4">
                  <label className="text-sm font-medium">Upload Proof of Payment</label>
                  <input type="file" accept="image/*" className="w-full border p-2 rounded" onChange={handleImageUpload} />
                </div>

                <button onClick={handleSubmitProof} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Submit Payment</button>
              </div>
            )}

            {/* Payment History */}
            {paymentHistory.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <button onClick={() => setShowHistory(!showHistory)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-3">
                  <FaHistory /> {showHistory ? "Hide Payment History" : "Show Payment History"}
                </button>
                {showHistory && (
                  <div className="max-h-96 overflow-y-auto flex flex-col gap-2">
                    {paymentHistory.map((p) => (
                      <div key={p.id} className={`p-3 rounded ${getStatusClass(p.status)}`}>
                        {new Date(p.billing_date).toLocaleDateString("en-US", { year: "numeric", month: "long" })} — ₱{p.current_bill} ({p.status})
                        {p.pending_amount > 0 && <span className="text-xs text-gray-500"> — Pending: ₱{p.pending_amount}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - QR */}
          <div className="lg:w-1/2 bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
            <p className="mb-3 text-sm">Scan QR to Pay via GCash</p>
            <img src={QR} alt="GCash QR" className="w-72 h-120 object-contain" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResidentPaymentDashboard;
