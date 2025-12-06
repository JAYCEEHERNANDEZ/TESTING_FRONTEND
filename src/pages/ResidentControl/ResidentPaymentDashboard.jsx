import React, { useState, useEffect } from "react";
import { FaHistory } from "react-icons/fa";
import QR from "../../Pictures/qr-code.png";
import {
  fetchUserPayments,
  uploadPaymentProof,
  fetchUserById,
  fetchUserNotificationsPerUser,
  readNotificationPerUser,
  submitReferenceCodeAPI
} from "../../api/api.js";
import ResidentLayout from "./ResidentLayout.jsx";

const ResidentPaymentDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [latestUnpaid, setLatestUnpaid] = useState(null);
  const [currentPaid, setCurrentPaid] = useState({ payment_total: 0, status: "Unpaid" });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const userId = Number(localStorage.getItem("user_id"));

  // ---------------- Load User Data ----------------
  const loadUserData = async () => {
    try {
      const res = await fetchUserById(userId);
      setUserData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Load Payments ----------------
  const loadPayments = async () => {
    try {
      const res = await fetchUserPayments(userId);
      const sorted = res.data.data.sort((a, b) => new Date(b.billing_date) - new Date(a.billing_date));
      setPaymentHistory(sorted);

      // Latest unpaid bill
      const unpaid = sorted.find(p => Number(p.remaining_balance) > 0) || null;
      setLatestUnpaid(unpaid);

      // Current month paid calculation
      const now = new Date();
      const paidThisMonth = sorted.filter(
        p =>
          new Date(p.billing_date).getMonth() === now.getMonth() &&
          new Date(p.billing_date).getFullYear() === now.getFullYear()
      );

      const totalPaidNow = paidThisMonth.reduce((acc, p) => acc + parseFloat(p.payment_total || 0), 0);
      const currentMonthBill = paidThisMonth.reduce((acc, p) => acc + parseFloat(p.total_bill || 0), 0);

      let status = "Unpaid";
      if (totalPaidNow === 0) status = "Unpaid";
      else if (totalPaidNow < currentMonthBill) status = "Partial";
      else status = "Paid";

      setCurrentPaid({ payment_total: totalPaidNow, status });

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
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPayments();
      loadUserData();
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // ---------------- Handlers ----------------
  const handleImageUpload = (e) => setProofImage(e.target.files[0]);

  const handleSubmitProof = async () => {
    if (!latestUnpaid) return setMessage({ type: "error", text: "No unpaid bill found." });
    if (!referenceCode.trim()) return setMessage({ type: "error", text: "Enter GCash reference code!" });
    if (!proofImage) return setMessage({ type: "error", text: "Upload proof image!" });

    const amount = latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0);
    if (amount <= 0) return setMessage({ type: "error", text: "This bill is already fully paid or pending verification." });

    try {
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: latestUnpaid.id,
        reference_code: referenceCode.trim()
      });

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bill_id", latestUnpaid.id);
      formData.append("amount", amount);
      formData.append("payment_type", "full");
      formData.append("proof", proofImage);

      await uploadPaymentProof(formData);

      setMessage({ type: "success", text: "Payment submitted successfully! Waiting for admin verification." });
      resetForm();

      setTimeout(() => {
        loadPayments();
        setMessage({ type: "", text: "" });
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Submission failed. Try again!" });
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await readNotificationPerUser(notifId);
      setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-200 text-green-800";
      case "Partial":
        return "bg-yellow-200 text-yellow-800";
      default:
        return "bg-red-200 text-red-800";
    }
  };

  // ---------------- Render ----------------
  return (
    <ResidentLayout
      notifications={notifications}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      handleMarkAsRead={handleMarkAsRead}
    >
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Latest Unpaid */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <div className="flex items-center justify-between">
                <p className="text-blue-600 text-2xl font-bold">
                  ₱ {latestUnpaid ? (latestUnpaid.remaining_balance - (latestUnpaid.pending_amount || 0)) : 0}
                </p>
                {latestUnpaid && (
                  <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusClass(latestUnpaid.status)}`}>
                    {latestUnpaid.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">Latest Unpaid Bill</p>
              {latestUnpaid && <span className="text-xs text-gray-500">Due: {new Date(latestUnpaid.due_date).toLocaleDateString()}</span>}
            </div>

            {/* Current Month Paid */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <p className="text-green-600 text-2xl font-bold">₱ {currentPaid.payment_total.toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Current Month Paid</p>
              <span className="text-xs text-gray-500">Status: {currentPaid.status}</span>
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
              <input
                type="file"
                accept="image/*"
                className="w-full border p-2 rounded mb-3"
                onChange={handleImageUpload}
              />
              <button
                onClick={handleSubmitProof}
                className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
              >
                Submit Payment
              </button>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 mb-3"
              >
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

        {/* QR Column */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-start">
          <p className="mb-3 text-sm">Scan QR to Pay via GCash</p>
          <img src={QR} alt="GCash QR" className="w-64 h-auto object-contain" />
        </div>
      </div>
    </ResidentLayout>
  );
};

export default ResidentPaymentDashboard;
