// ResidentPaymentDashboard.jsx
import React, { useState, useEffect } from "react";
import { FaHistory, FaTimes } from "react-icons/fa";
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
import usePageTitle from "../usePageTitle";

const ResidentPaymentDashboard = () => {
  usePageTitle("Resident Payment Dashboard");

  const [userData, setUserData] = useState(null);
  const [enforcedUnpaid, setEnforcedUnpaid] = useState(null); // the unpaid bill user must pay (if any, within 2-month limit)
  const [currentMonthBill, setCurrentMonthBill] = useState(null);
  const [currentPaidSummary, setCurrentPaidSummary] = useState({ payment_total: 0, status: "Unpaid" });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [referenceCode, setReferenceCode] = useState("");
  const [proofImage, setProofImage] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [stickyMessage, setStickyMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userId = Number(localStorage.getItem("user_id"));

  // --- Utilities ---
  const startOfMonth = (d) => {
    const dt = new Date(d.getFullYear(), d.getMonth(), 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const addMonths = (d, months) => {
    const dt = new Date(d.getFullYear(), d.getMonth() + months, 1);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  // status -> class
  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-200 text-green-800";
      case "Partial":
        return "bg-yellow-200 text-yellow-800";
      case "Pending":
        return "bg-indigo-200 text-indigo-800";
      default:
        return "bg-red-200 text-red-800"; // Unpaid
    }
  };

  // --- Loaders ---
  useEffect(() => {
    if (!userId) return;
    loadUserData();
    loadPayments();
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    try {
      const res = await fetchUserById(userId);
      if (res?.data?.data) setUserData(res.data.data);
    } catch (err) {
      console.error("loadUserData:", err);
    }
  };

  /**
   * Enforce: only check unpaid bills within the last 2 months (previous month and month-before-previous)
   * - If there are unpaid bills inside that 2-month window, pick the oldest unpaid among them and set as enforcedUnpaid.
   * - Else, allow paying the current month (if any).
   */
  const loadPayments = async () => {
  try {
    const res = await fetchUserPayments(userId);
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    const sorted = list.sort((a, b) => new Date(a.billing_date) - new Date(b.billing_date));
    setPaymentHistory(sorted);

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const twoMonthsAgoStart = addMonths(currentMonthStart, -2);

    const unpaidBills = sorted.filter((p) => Number(p.remaining_balance) > 0);

    // Unpaid bills inside 2-month window (prev month & month-before-prev)
    const unpaidWithinWindow = unpaidBills.filter((p) => {
      const billDate = new Date(p.billing_date);
      billDate.setHours(0, 0, 0, 0);
      return billDate >= twoMonthsAgoStart && billDate < currentMonthStart;
    });

    const oldestUnpaidInWindow = unpaidWithinWindow.length > 0 ? unpaidWithinWindow[0] : null;
    setEnforcedUnpaid(oldestUnpaidInWindow);

    // Current month bill (if any)
    const currentMonth = sorted.find((p) => {
      const d = new Date(p.billing_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }) || null;

    // --- BLOCK current month if previous month unpaid ---
    let currentMonthBlocked = false;
    if (currentMonth && oldestUnpaidInWindow && new Date(oldestUnpaidInWindow.billing_date).getMonth() < now.getMonth()) {
      currentMonthBlocked = true;
    }

    setCurrentMonthBill(currentMonthBlocked ? null : currentMonth);

    // Compute current month summary
    const currentMonthBills = sorted.filter((p) => {
      const d = new Date(p.billing_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalPaid = currentMonthBills.reduce((acc, p) => acc + parseFloat(p.payment_total || 0), 0);
    const totalBill = currentMonthBills.reduce((acc, p) => acc + parseFloat(p.total_bill || 0), 0);

    let status = "Unpaid";
    if (totalPaid > 0 && totalPaid < totalBill) status = "Partial";
    else if (totalPaid >= totalBill && totalBill > 0) status = "Paid";

    // Show "Blocked" if previous month unpaid
    if (currentMonthBlocked) status = "Blocked - Previous Month Unpaid";

    setCurrentPaidSummary({ payment_total: totalPaid, status });

    resetForm();
  } catch (err) {
    console.error("loadPayments:", err);
  }
};


  const loadNotifications = async () => {
    try {
      const res = await fetchUserNotificationsPerUser(userId);
      setNotifications(res?.data?.notifications || []);
    } catch (err) {
      console.error("loadNotifications:", err);
    }
  };

  // --- Form helpers ---
  const resetForm = () => {
    setReferenceCode("");
    setProofImage(null);
  };

  const handleImageUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      setProofImage(null);
      return;
    }
    setProofImage(e.target.files[0]);
  };

  const showStickyMessage = (type, text) => {
    setStickyMessage({ type, text });
    // auto-dismiss after 5s
    setTimeout(() => {
      setStickyMessage(null);
    }, 5000);
  };

  const dismissStickyMessage = () => setStickyMessage(null);

  const handleMarkAsRead = async (notifId) => {
    try {
      await readNotificationPerUser(notifId);
      setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      console.error("handleMarkAsRead:", err);
    }
  };

  // which bill will be paid on submit?
  const billToPay = () => {
    // If there's an enforced unpaid in the 2-month window -> pay that
    if (enforcedUnpaid) return enforcedUnpaid;
    // Else, if there's an unpaid current month bill -> pay current month
    if (currentMonthBill && Number(currentMonthBill.remaining_balance) > 0) return currentMonthBill;
    // Else, try to pick the latest unpaid bill overall (fallback)
    const fallback = paymentHistory.slice().reverse().find((p) => Number(p.remaining_balance) > 0);
    return fallback || null;
  };

  const handleSubmitProof = async () => {
    const selectedBill = billToPay();
    if (!selectedBill) {
      showStickyMessage("error", "No unpaid bill detected to submit proof for.");
      return;
    }

    // If the bill to pay is not the current month and outside the 2-month limit (shouldn't happen due to enforcement), block
    // But we already set enforcedUnpaid to only within 2-month window. However keep a safety check:
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const twoMonthsAgoStart = addMonths(currentMonthStart, -2);
    const billDate = new Date(selectedBill.billing_date);
    billDate.setHours(0, 0, 0, 0);
    if (!(billDate >= twoMonthsAgoStart && billDate < addMonths(currentMonthStart, 1))) {
      // not inside the allowed window (current month or previous two-month window)
      showStickyMessage("error", "This bill is outside the allowed payment window.");
      return;
    }

    if (!referenceCode.trim()) {
      showStickyMessage("error", "Enter GCash reference code!");
      return;
    }
    if (!proofImage) {
      showStickyMessage("error", "Upload proof image!");
      return;
    }

    // Calculate amount to submit: remaining_balance minus pending_amount if any
    const amountToPay = parseFloat(selectedBill.remaining_balance || 0) - parseFloat(selectedBill.pending_amount || 0);
    if (amountToPay <= 0) {
      showStickyMessage("error", "This bill is already fully paid or pending verification.");
      return;
    }

    setSubmitting(true);

    try {
      // submit reference code
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: selectedBill.id,
        reference_code: referenceCode.trim()
      });

      // prepare form data for proof image upload
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bill_id", selectedBill.id);
      formData.append("amount", amountToPay);
      // payment_type: if payment_1 > 0 then this is a "second" payment else "full"
      formData.append("payment_type", selectedBill.payment_1 > 0 ? "second" : "full");
      formData.append("proof", proofImage);

      await uploadPaymentProof(formData);

      showStickyMessage("success", "Payment submitted successfully! Waiting for admin verification.");
      resetForm();
      await loadPayments();
    } catch (err) {
      console.error("handleSubmitProof:", err);
      showStickyMessage("error", "Submission failed. Try again!");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---
  const selectedBill = billToPay();
  const isEnforced = Boolean(enforcedUnpaid);

  return (
    <ResidentLayout
      notifications={notifications}
      showNotifications={showNotifications}
      setShowNotifications={setShowNotifications}
      handleMarkAsRead={handleMarkAsRead}
    >
      {/* Sticky message */}
      {stickyMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-semibold ${
            stickyMessage.type === "success" ? "bg-green-600 text-white" : "bg-red-500 text-white"
          } flex items-center justify-between gap-4`}
        >
          <span>{stickyMessage.text}</span>
          <button onClick={dismissStickyMessage} className="text-white hover:text-gray-200">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Enforced/Latest Unpaid Card */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <div className="flex items-center justify-between">
                <p className="text-blue-600 text-2xl font-bold">
                  ₱{" "}
                  {selectedBill
                    ? ((parseFloat(selectedBill.remaining_balance || 0) - parseFloat(selectedBill.pending_amount || 0)) || 0).toLocaleString()
                    : 0}
                </p>
                {selectedBill && (
                  <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusClass(selectedBill.status)}`}>
                    {selectedBill.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                {isEnforced
                  ? "You must pay the oldest unpaid bill within the last 2 months before proceeding."
                  : "Latest Unpaid / Current Month Balance"}
              </p>
              {selectedBill && (
                <span className="text-xs text-gray-500">
                  {new Date(selectedBill.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — Due:{" "}
                  {new Date(selectedBill.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Current Month Paid summary */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-2 justify-between">
              <p className="text-green-600 text-2xl font-bold">₱ {currentPaidSummary.payment_total.toLocaleString()}</p>
              <p className="text-gray-600 mt-1">Current Month Paid</p>
              <span className="text-xs text-gray-500">Status: {currentPaidSummary.status}</span>
            </div>
          </div>

          {/* Payment Form - only show when there is a bill to pay (selectedBill) */}
          {selectedBill ? (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold mb-3">Submit GCash Payment</h3>

              {/* If enforced: prominently show restriction message */}
              {isEnforced && (
                <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700">
                  You have unpaid bills within the last 2 months. You must pay the oldest of those first before paying newer bills.
                  <div className="text-xs mt-1">Billing month: {new Date(enforcedUnpaid.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
                </div>
              )}

              {/* If payment_1 > 0, show note */}
              {selectedBill.payment_1 > 0 && (
                <p className="mb-3 text-red-600 font-semibold">
                  Note: Next payment must be exactly ₱{selectedBill.remaining_balance}.
                </p>
              )}

              {/* Pending verification */}
              {selectedBill.pending_amount > 0 && (
                <p className="mb-3 text-indigo-700 font-medium">Pending verification: ₱{selectedBill.pending_amount}</p>
              )}

              <input
                type="text"
                placeholder="Enter GCash reference code"
                className="w-full p-2 border rounded mb-3"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                disabled={submitting}
              />

              <input
                type="file"
                accept="image/*"
                className="w-full border p-2 rounded mb-3"
                onChange={handleImageUpload}
                disabled={submitting}
              />

              <button
                onClick={handleSubmitProof}
                className={`w-full ${submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white p-2 rounded`}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <p className="text-gray-700">No unpaid bills found in the enforced 2-months.</p>
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
          <img src={QR} alt="GCash QR" className="w-auto h-auto object-contain" />
        </div>
      </div>
    </ResidentLayout>
  );
};

export default ResidentPaymentDashboard;
