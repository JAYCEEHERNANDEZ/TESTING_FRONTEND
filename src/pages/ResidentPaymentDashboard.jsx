import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUserCircle, FaBell, FaHistory } from "react-icons/fa";
import QR from "../Pictures/qr-code.png";
import {
  fetchUserPayments,
  uploadPaymentProof,
  fetchUserById,
  fetchUserNotificationsPerUser,
  readNotificationPerUser,
  submitReferenceCodeAPI
} from "../api/api.js";

const ResidentPaymentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [latestUnpaid, setLatestUnpaid] = useState(null);
  const [currentPaid, setCurrentPaid] = useState({ payment_total: 0, status: "Unpaid" });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" }); // success/error messages

  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));

  // ---------------- Load User Data ----------------
  const loadUserData = async () => {
    try {
      const res = await fetchUserById(userId);
      setUserData(res.data.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  // ---------------- Load Payments ----------------
  const loadPayments = async () => {
    try {
      const res = await fetchUserPayments(userId);
      const sorted = res.data.data.sort((a, b) => new Date(b.billing_date) - new Date(a.billing_date));
      setPaymentHistory(sorted);

      const unpaid = sorted.find(p => Number(p.remaining_balance) > 0) || null;
      setLatestUnpaid(unpaid);

      const now = new Date();
      const paidThisMonth = sorted.filter(
        p => new Date(p.billing_date).getMonth() === now.getMonth() &&
             new Date(p.billing_date).getFullYear() === now.getFullYear()
      );
      const totalPaidNow = paidThisMonth.reduce((acc, p) => acc + Number(p.payment_total || 0), 0);
      setCurrentPaid({ payment_total: totalPaidNow, status: totalPaidNow > 0 ? "Paid" : "Unpaid" });

      resetForm();
    } catch (err) {
      console.error("Error loading payments:", err);
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

  useEffect(() => {
    if (userId) {
      loadPayments();
      loadUserData();
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [userId]);

  // ---------------- Handlers ----------------
  const handleImageUpload = (e) => setProofImage(e.target.files[0]);

  const handleSubmitReference = async () => {
    if (!latestUnpaid) return setMessage({ type: "error", text: "No unpaid bill found." });
    if (!referenceCode.trim()) return setMessage({ type: "error", text: "Enter GCash reference code!" });

    try {
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: latestUnpaid.id,
        reference_code: referenceCode.trim()
      });

      setMessage({ type: "success", text: "Reference code submitted successfully!" });
      setReferenceCode("");

      setTimeout(() => {
        loadPayments();
        setMessage({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to submit reference code. Try again." });
    }
  };

  const handleSubmitProof = async () => {
    if (!latestUnpaid) return setMessage({ type: "error", text: "No unpaid bill found." });
    if (!referenceCode.trim()) return setMessage({ type: "error", text: "Enter GCash reference code!" });
    if (!proofImage) return setMessage({ type: "error", text: "Upload proof image!" });

    const amount = latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0);
    if (amount <= 0) return setMessage({ type: "error", text: "This bill is already fully paid or pending verification." });

    try {
      // Submit Reference Code
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: latestUnpaid.id,
        reference_code: referenceCode.trim()
      });

      // Upload Proof
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bill_id", latestUnpaid.id);
      formData.append("amount", amount);
      formData.append("payment_type", "full");
      formData.append("proof", proofImage);

      await uploadPaymentProof(formData);

      // Show success message
      setMessage({ type: "success", text: "Payment submitted successfully! Waiting for admin verification." });
      setReferenceCode("");
      setProofImage(null);

      setTimeout(() => {
        loadPayments();
        setMessage({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Submission failed. Try again!" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await readNotificationPerUser(notifId);
      setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

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
          {navItems.map(item => (
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 m-2 ml-0 relative">
        {/* Header */}
        <div className="flex justify-between items-center bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold text-black">Payment Dashboard</span>
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-full relative">
              🔔
              {notifications.filter(n => Number(n.is_read) === 0).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 text-xs text-white flex items-center justify-center">
                  {notifications.filter(n => Number(n.is_read) === 0).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-gray-50 border border-gray-300 rounded shadow-lg z-50 overflow-y-auto max-h-[28rem]">
                {notifications.length === 0 ? <p className="p-4 text-gray-600 text-center">No notifications</p> :
                  notifications.map(notif => (
                    <div key={notif.id} className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 ${Number(notif.is_read) === 0 ? "bg-blue-50" : ""}`} onClick={() => handleMarkAsRead(notif.id)}>
                      <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-600">{notif.message}</p>
                      <small className="text-gray-500 text-xs">{new Date(notif.created_at).toLocaleString()}</small>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
            {message.text}
          </div>
        )}

        {/* Payment Summary and Form */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-blue-600 text-xl font-bold">
                    ₱ {latestUnpaid ? (latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0)) : 0}
                  </p>
                  {latestUnpaid && <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(latestUnpaid.status)}`}>{latestUnpaid.status}</span>}
                </div>
                <p className="text-gray-600 mt-1">Latest Unpaid Bill</p>
                {latestUnpaid && <span className="text-xs text-gray-500">Due: {new Date(latestUnpaid.due_date).toLocaleDateString()}</span>}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-green-600 text-xl font-bold">₱ {currentPaid.payment_total}</p>
                <p className="text-gray-600 mt-1">Current Month Paid</p>
                <span className="text-xs text-gray-500">Status: {currentPaid.status}</span>
              </div>
            </div>

            {latestUnpaid && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold mb-3">Submit GCash Payment</h3>
                <input type="text" placeholder="Enter GCash reference code" className="w-full p-2 border rounded mb-3" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} />
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
                    {paymentHistory.map(p => (
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

          {/* QR Payment */}
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
