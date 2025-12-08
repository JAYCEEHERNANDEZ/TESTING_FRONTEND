import React, { useState, useEffect, useRef } from "react";
import SideBarHeader from "./SideBarHeader.jsx";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPaymentProofs,
  adminRecordPayment,
  sendNotificationPerUser,
  fetchReceipt,
  fetchAdminNotifications,
  markAdminNotificationRead,
} from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const ManageRecords = () => {
  usePageTitle("User Payment Records");

  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userFilter, setUserFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUserId, setNoticeUserId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);
  const [stickyMessage, setStickyMessage] = useState(null);

  const userRefs = useRef({});

// Load Users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error(err);
        showStickyMessage("error", "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

// Load Admin Notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAdminNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadNotifications();
  }, []);

 // Load Payment Records for Users
  useEffect(() => {
    const loadUserRecords = async () => {
      try {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        for (const user of users) {
          if (!recordsByUser[user.id]) {
            const res = await fetchUserPaymentProofs(user.id);
            const allRecords = res.data.data || [];
            const currentMonthRecords = allRecords.filter((r) => {
              const billingDate = new Date(r.billing_date);
              return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
            });
            setRecordsByUser((prev) => ({ ...prev, [user.id]: currentMonthRecords }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (users.length) loadUserRecords();
  }, [users]);

// Expand/Collapse User Records
  const expandUser = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

// Determine Payment Status
  const getStatus = (record) => {
    if (!record) return "Unpaid";
    const remaining = Number(record.remaining_balance || 0);
    const total = Number(record.total_bill || 0);
    if (remaining === total) return "Unpaid";
    if (remaining > 0 && remaining < total) return "Partial";
    if (remaining === 0) return "Paid";
    return "Unknown";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Unpaid":
        return "bg-red-200 text-red-800";
      case "Partial":
        return "bg-yellow-200 text-yellow-800";
      case "Paid":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

// Submit Payment
  const handleSubmitPayment = async (userId, paymentId, amount) => {
    if (!amount || Number(amount) <= 0) return;
    try {
      // Record payment
      await adminRecordPayment(paymentId, Number(amount));
      showStickyMessage("success", "Payment recorded successfully.");

      // Refresh user records
      const res = await fetchUserPaymentProofs(userId);
      const allRecords = res.data.data || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthRecords = allRecords.filter((r) => {
        const billingDate = new Date(r.billing_date);
        return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
      });
      setRecordsByUser((prev) => ({ ...prev, [userId]: currentMonthRecords }));

      // Mark related admin notifications as read
      const relatedNotifications = notifications.filter(
        (n) => n.user_id === userId && !n.is_read && n.title.includes("Payment")
      );
      for (const notif of relatedNotifications) {
        await markAdminNotificationRead(notif.id);
      }
      setNotifications((prev) => prev.filter((n) => !(n.user_id === userId && n.title.includes("Payment"))));

      // Generate receipt
      await handleGenerateReceipt(userId, paymentId);

    } catch (err) {
      console.error(err);
      showStickyMessage("error", "Failed to record payment.");
    }
  };

// Generate Receipt and Send Notification
  const handleGenerateReceipt = async (userId, consumptionId) => {
    try {
      const res = await fetchReceipt(consumptionId);
      const receiptData = res.data;
      const today = new Date().toLocaleDateString();

      await sendNotificationPerUser({
        user_id: userId,
        title: `Official Receipt: ${receiptData.receipt_number}`,
        message: `Hello ${receiptData.name}, your payment of ₱${receiptData.total_paid} for ${new Date(
          receiptData.billing_date
        ).toLocaleDateString()} has been confirmed on ${today}. Receipt Number: ${receiptData.receipt_number}`,
        type: "receipt",
      });
    } catch (err) {
      console.error(err);
    }
  };

// Personal Notice Modal
  const openNoticeModal = (userId) => {
    setNoticeUserId(userId);
    setNoticeTitle("");
    setNoticeMessage("");
    setShowNoticeModal(true);
  };

  const handleSendPersonalNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showStickyMessage("error", "Both title and message are required.");
      return;
    }
    setSendingNotice(true);
    try {
      await sendNotificationPerUser({
        user_id: noticeUserId,
        title: noticeTitle,
        message: noticeMessage,
        type: "personal",
      });
      setShowNoticeModal(false);
      showStickyMessage("success", "Notification sent successfully.");
    } catch (err) {
      console.error(err);
      showStickyMessage("error", "Failed to send notification.");
    } finally {
      setSendingNotice(false);
    }
  };

// Sticky Notification
  const showStickyMessage = (type, text) => setStickyMessage({ type, text });
  const dismissStickyMessage = () => setStickyMessage(null);

// Filtering Users
  const activeUsers = users.filter((u) => !u.is_deactivated);
  const filteredUsers = activeUsers.filter((user) => {
    const hasPendingPayment = notifications.some(
      (n) => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
    );

    if (userFilter === "pending" && !hasPendingPayment) return false;
    if (userFilter === "approved" && hasPendingPayment) return false;

    if (paymentFilter !== "all") {
      const record = recordsByUser[user.id]?.[0];
      const status = record ? getStatus(record).toLowerCase() : "unpaid";
      if (status !== paymentFilter.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <SideBarHeader>
      {/* Sticky Notification */}
      {stickyMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg font-semibold flex items-center justify-between gap-4 ${
            stickyMessage.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          <span>{stickyMessage.text}</span>
          <button onClick={dismissStickyMessage} className="text-white hover:text-gray-200">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              className={`px-3 py-1 rounded ${
                userFilter === f
                  ? f === "pending"
                    ? "bg-yellow-400 text-white"
                    : "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => setUserFilter(f)}
            >
              {f === "all" ? "All Users" : f === "pending" ? "Pending Approval" : "Approved"}
            </button>
          ))}
        </div>

        <select
          className="shadow rounded px-2 py-1"
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Users List */}
      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <p>No users found.</p>
      ) : (
        filteredUsers.map((user) => {
          const hasPendingPayment = notifications.some(
            (n) => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
          );
          const latestRecord = recordsByUser[user.id]?.[0];
          const paymentStatus = getStatus(latestRecord);

          return (
            <div
              key={user.id}
              className={`bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition ${
                expandedUserId === user.id ? "border-2 border-blue-400" : ""
              } ${hasPendingPayment ? "border-2 border-yellow-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    className="text-lg font-semibold text-blue-600 hover:text-blue-500"
                    onClick={() => expandUser(user.id)}
                  >
                    {user.name}
                  </button>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(paymentStatus)}`}
                  >
                    {paymentStatus}
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  {hasPendingPayment && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">
                      Pending Approval
                    </span>
                  )}
                  <button
                    onClick={() => openNoticeModal(user.id)}
                    className="ml-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded shadow hover:shadow-lg flex items-center gap-2"
                  >
                    <FaPaperPlane /> Send Notice
                  </button>
                </div>
              </div>

              {/* Expanded Records */}
              {expandedUserId === user.id && latestRecord && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="col-span-2 flex flex-col gap-3 space-y-1.5">
                    {recordsByUser[user.id]?.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 shadow relative hover:shadow-md transition"
                      >
                        <span
                          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                            getStatus(r)
                          )}`}
                        >
                          {getStatus(r)}
                        </span>
                        <p>
                          <strong>Billing Month:</strong>{" "}
                          {new Date(r.billing_date).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p><strong>Previous Reading:</strong> {r.previous_reading}</p>
                        <p><strong>Current Reading:</strong> {r.present_reading}</p>
                        <p><strong>Consumption:</strong> {r.cubic_used} m³</p>
                        <p><strong>Total Bill:</strong> ₱{r.total_bill}</p>
                        <p><strong>Payment 1:</strong> ₱{r.payment_1}</p>
                        <p><strong>Payment 2:</strong> ₱{r.payment_2}</p>
                        <p><strong>Remaining Balance:</strong> ₱{r.remaining_balance}</p>
                        <p><strong>Reference Code:</strong> {r.reference_code || "N/A"}</p>

                        {getStatus(r) !== "Paid" && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              className="p-2 border rounded w-1/2 focus:ring-1 focus:ring-blue-500"
                              placeholder="Enter payment amount"
                              onChange={(e) => (r.adminPayment = e.target.value)}
                            />
                            <button
                              className="bg-green-600 p-2 rounded hover:bg-green-700 text-white transition"
                              onClick={() => handleSubmitPayment(user.id, r.id, r.adminPayment)}
                            >
                              Record Payment
                            </button>
                          </div>
                        )}
                      </div>
                    )) || <p>No payment records found.</p>}
                  </div>

                  <div className="col-span-1 p-3 bg-white rounded-lg shadow flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2 text-center">Payment Proof</h2>
                    {latestRecord?.proof_url ? (
                      <img
                        src={`http://localhost:5000${latestRecord.proof_url}`}
                        alt="Payment Proof"
                        className="w-60 h-70 rounded-lg shadow object-contain"
                      />
                    ) : (
                      <p className="text-gray-500 italic">No proof uploaded.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Personal Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg animate-slide-in">
            <h2 className="text-xl font-bold mb-4 text-blue-700 border-b pb-2">Send Personal Notification</h2>

            <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              placeholder="Enter notification title"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500"
            />

            <label className="block mb-2 text-sm font-medium text-gray-700">Message</label>
            <textarea
              placeholder="Enter notification message"
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                onClick={() => setShowNoticeModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={handleSendPersonalNotice}
                disabled={sendingNotice}
              >
                {sendingNotice ? "Sending..." : "Send Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SideBarHeader>
  );
};

export default ManageRecords;
