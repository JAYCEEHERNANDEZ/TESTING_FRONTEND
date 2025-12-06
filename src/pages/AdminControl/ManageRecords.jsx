// ManageRecords.jsx
import React, { useState, useEffect, useRef } from "react";
import SideBarHeader from "./SideBarHeader.jsx";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaReceipt } from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPaymentProofs,
  adminRecordPayment,
  sendNotificationPerUser,
  fetchReceipt,
  fetchAdminNotifications
} from "../../api/api.js";

const ManageRecords = () => {
  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userFilter, setUserFilter] = useState("all"); // all | pending | approved
  const [paymentFilter, setPaymentFilter] = useState("all"); // all | paid | partial | unpaid
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUserId, setNoticeUserId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();
  const userRefs = useRef({});

  // ---------- Fetch all users ----------
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error(err);
        setNotificationMsg({ type: "error", text: "Failed to load users." });
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // ---------- Fetch notifications ----------
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

  // ---------- Expand user and fetch current month record ----------
  const expandUser = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    if (!recordsByUser[userId]) {
      try {
        const res = await fetchUserPaymentProofs(userId);
        const allRecords = res.data.data || [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const currentMonthRecords = allRecords.filter(r => {
          const billingDate = new Date(r.billing_date);
          return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
        });
        setRecordsByUser(prev => ({ ...prev, [userId]: currentMonthRecords }));
      } catch (err) {
        console.error(err);
        setRecordsByUser(prev => ({ ...prev, [userId]: [] }));
        setNotificationMsg({ type: "error", text: `Failed to load records for ${userId}.` });
      }
    }
    setExpandedUserId(userId);
    setTimeout(() => {
      userRefs.current[userId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  // ---------- Handle recording payment ----------
  const handleSubmitPayment = async (userId, paymentId, amount) => {
    if (!amount || Number(amount) <= 0) return;
    try {
      await adminRecordPayment(paymentId, Number(amount));
      setNotificationMsg({ type: "success", text: "Payment recorded successfully." });

      const res = await fetchUserPaymentProofs(userId);
      const allRecords = res.data.data || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthRecords = allRecords.filter(r => {
        const billingDate = new Date(r.billing_date);
        return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
      });
      setRecordsByUser(prev => ({ ...prev, [userId]: currentMonthRecords }));

      setNotifications(prev => prev.filter(n => !(n.title.includes("Payment") && n.user_id === userId)));
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: "error", text: "Failed to record payment." });
    }
  };

  // ---------- Personal notice modal ----------
  const openNoticeModal = (userId) => {
    setNoticeUserId(userId);
    setNoticeTitle("");
    setNoticeMessage("");
    setShowNoticeModal(true);
  };

  const handleSendPersonalNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      setNotificationMsg({ type: "error", text: "Both title and message are required." });
      return;
    }
    setSendingNotice(true);
    try {
      await sendNotificationPerUser({
        user_id: noticeUserId,
        title: noticeTitle,
        message: noticeMessage,
        type: "personal"
      });
      setShowNoticeModal(false);
      setNotificationMsg({ type: "success", text: "Notification sent successfully." });
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: "error", text: "Failed to send notification." });
    } finally {
      setSendingNotice(false);
    }
  };

  // ---------- Generate receipt ----------
  const handleGenerateReceipt = async (userId, consumptionId) => {
    try {
      const res = await fetchReceipt(consumptionId);
      const receiptData = res.data;

      await sendNotificationPerUser({
        user_id: userId,
        title: `Official Receipt: ${receiptData.receipt_number}`,
        message: `Hello ${receiptData.name}, your payment of ₱${receiptData.total_paid} for ${new Date(receiptData.billing_date).toLocaleDateString()} has been confirmed. Receipt Number: ${receiptData.receipt_number}`,
        type: "receipt"
      });

      setNotificationMsg({ type: "success", text: `Receipt generated and sent to ${receiptData.name}` });
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: "error", text: "Failed to generate receipt." });
    }
  };

  // ---------- Payment status ----------
  const getStatus = (record) => {
    const remaining = Number(record.remaining_balance || 0);
    const total = Number(record.total_bill || 0);
    if (remaining === total) return "Unpaid";
    if (remaining > 0 && remaining < total) return "Partial";
    if (remaining === 0) return "Paid";
    return "Unknown";
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Unpaid": return "bg-red-200 text-red-800";
      case "Partial": return "bg-yellow-200 text-yellow-800";
      case "Paid": return "bg-green-200 text-green-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  const activeUsers = users.filter(u => !u.is_deactivated);

  // ---------- Filter users ----------
  const filteredUsers = activeUsers.filter(user => {
    const hasPendingPayment = notifications.some(
      n => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
    );

    // Filter by All/Pending/Approved
    if (userFilter === "pending" && !hasPendingPayment) return false;
    if (userFilter === "approved" && hasPendingPayment) return false;

    // Filter by payment status
    if (paymentFilter !== "all") {
      const record = recordsByUser[user.id]?.[0];
      if (!record || getStatus(record).toLowerCase() !== paymentFilter) return false;
    }

    return true;
  });

  return (
    <SideBarHeader>
      {/* Notification message */}
      {notificationMsg.text && (
        <div className={`p-3 rounded mb-4 font-medium ${notificationMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {notificationMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${userFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setUserFilter("all")}
          >All Users</button>
          <button
            className={`px-3 py-1 rounded ${userFilter === "pending" ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setUserFilter("pending")}
          >Pending Approval</button>
          <button
            className={`px-3 py-1 rounded ${userFilter === "approved" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setUserFilter("approved")}
          >Approved</button>
        </div>

        {/* Payment status dropdown */}
        <select
          className="border rounded px-2 py-1"
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
      {loading ? <p>Loading users...</p> : filteredUsers.length === 0 ? <p>No users found.</p> : (
        filteredUsers.map(user => {
          const hasPendingPayment = notifications.some(
            n => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
          );
          const latestRecord = recordsByUser[user.id]?.[0];
          const paymentStatus = latestRecord ? getStatus(latestRecord) : "Unknown";

          return (
            <div
              key={user.id}
              ref={el => userRefs.current[user.id] = el}
              className={`bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition ${expandedUserId === user.id ? "border-2 border-blue-400" : ""} ${hasPendingPayment ? "border-2 border-yellow-400" : ""}`}
            >
              <div className="flex items-center justify-between">
                <button className="text-lg font-semibold text-blue-600 hover:text-blue-500" onClick={() => expandUser(user.id)}>
                  {user.name}
                </button>

                <div className="flex gap-2 items-center">
                  {latestRecord && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(paymentStatus)}`}>
                      {paymentStatus}
                    </span>
                  )}
                  {hasPendingPayment && (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">
                      Pending Approval
                    </span>
                  )}
                  <button onClick={() => openNoticeModal(user.id)} className="ml-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded shadow hover:shadow-lg flex items-center gap-2">
                    <FaPaperPlane /> Send Notice
                  </button>
                </div>
              </div>

              {/* Expanded Records */}
              {expandedUserId === user.id && latestRecord && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="col-span-2 flex flex-col gap-3 space-y-1.5">
                    {recordsByUser[user.id]?.map(r => (
                      <div key={r.id} className="p-4 bg-gray-50 rounded-lg flex flex-col gap-2 shadow relative hover:shadow-md transition">
                        <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(getStatus(r))}`}>
                          {getStatus(r)}
                        </span>

                        <p><strong>Billing Month:</strong> {new Date(r.billing_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
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
                            <input type="number" className="p-2 border rounded w-1/2 focus:ring-1 focus:ring-blue-500" placeholder="Enter payment amount" onChange={e => r.adminPayment = e.target.value} />
                            <button className="bg-green-600 p-2 rounded hover:bg-green-700 text-white transition" onClick={() => handleSubmitPayment(user.id, r.id, r.adminPayment)}>Record Payment</button>
                          </div>
                        )}

                        {getStatus(r) !== "Unpaid" && (
                          <button className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2" onClick={() => handleGenerateReceipt(user.id, r.id)}>
                            <FaReceipt /> Generate Receipt
                          </button>
                        )}
                      </div>
                    )) || <p>No payment records found.</p>}
                  </div>

                  <div className="col-span-1 p-3 bg-white rounded-lg shadow flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-2 text-center">Payment Proof</h2>
                    {latestRecord?.proof_url ? (
                      <img src={`http://localhost:5000${latestRecord.proof_url}`} alt="Payment Proof" className="w-60 h-70 rounded-lg shadow object-contain" />
                    ) : <p className="text-gray-500 italic">No proof uploaded.</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Personal Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 bg-transparent">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg animate-slide-in">
            <h2 className="text-xl font-bold mb-4 text-blue-700 border-b pb-2">Send Personal Notification</h2>

            <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
            <input type="text" placeholder="Enter notification title" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500" />

            <label className="block mb-2 text-sm font-medium text-gray-700">Message</label>
            <textarea placeholder="Enter notification message" value={noticeMessage} onChange={(e) => setNoticeMessage(e.target.value)} className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-500" />

            <div className="flex justify-end gap-2">
              <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition" onClick={() => setShowNoticeModal(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={handleSendPersonalNotice} disabled={sendingNotice}>
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
