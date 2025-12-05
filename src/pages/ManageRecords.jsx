// ManageRecords.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUserCircle,
  FaFolderOpen,
  FaBell,
  FaUsers,
  FaUserCog,
  FaFileAlt,
  FaPaperPlane,
  FaReceipt
} from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPaymentProofs,
  adminRecordPayment,
  fetchOverdueUsers,
  sendNotificationPerUser,
  fetchReceipt,
  sendDeactNotice,
  fetchAdminNotifications
} from "../api/api.js";

const ManageRecords = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userFilter, setUserFilter] = useState("all"); // all | pending | approved

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUserId, setNoticeUserId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();
  const userRefs = useRef({});

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "User Payments", path: "/manage-records", icon: <FaFolderOpen /> },
    { label: "Notifications Center", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/manage-records", icon: <FaFileAlt /> },
  ];

  // Fetch all users
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setNotificationMsg({ type: "error", text: "Failed to load users." });
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Fetch overdue users
  useEffect(() => {
    const loadOverdue = async () => {
      setLoadingOverdue(true);
      try {
        const res = await fetchOverdueUsers();
        setOverdueUsers(res.data.users || []);
      } catch (err) {
        console.error("Error fetching overdue users:", err);
        setNotificationMsg({ type: "error", text: "Failed to load overdue users." });
      } finally {
        setLoadingOverdue(false);
      }
    };
    loadOverdue();
  }, []);

  // Fetch admin notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAdminNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    loadNotifications();
  }, []);

  // Expand user to show records
  const expandUser = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    if (!recordsByUser[userId]) {
      try {
        const res = await fetchUserPaymentProofs(userId);
        setRecordsByUser(prev => ({ ...prev, [userId]: res.data.data || [] }));
      } catch (err) {
        console.error("Error fetching user records:", err);
        setRecordsByUser(prev => ({ ...prev, [userId]: [] }));
        setNotificationMsg({ type: "error", text: `Failed to load records for ${userId}.` });
      }
    }
    setExpandedUserId(userId);
    setTimeout(() => {
      userRefs.current[userId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
    navigate("/");
  };

  const handleSubmitPayment = async (userId, paymentId, amount) => {
    if (!amount || Number(amount) <= 0) return;
    try {
      await adminRecordPayment(paymentId, Number(amount));
      setNotificationMsg({ type: "success", text: "Payment recorded successfully." });

      // Remove payment notifications for this user
      setNotifications(prev => prev.filter(n => !(n.title.includes("Payment") && n.user_id === userId)));

      const res = await fetchUserPaymentProofs(userId);
      setRecordsByUser(prev => ({ ...prev, [userId]: res.data.data || [] }));
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: "error", text: "Failed to record payment." });
    }
  };

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

  const handleSendDeactNotice = async (userId) => {
    setSendingNotice(true);
    try {
      await sendDeactNotice({ user_id: userId });
      setNotificationMsg({ type: "success", text: "Deactivation notice sent successfully!" });
      setOverdueUsers(prev => prev.map(u => u.user_id === userId ? { ...u, notice_sent: true } : u));
    } catch (err) {
      console.error(err);
      setNotificationMsg({ type: "error", text: "Failed to send notice." });
    } finally {
      setSendingNotice(false);
    }
  };

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

  // Filtered users for the filter buttons
  const filteredUsers = activeUsers.filter(user => {
    const hasPendingPayment = notifications.some(
      n => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
    );
    if (userFilter === "pending") return hasPendingPayment;
    if (userFilter === "approved") return !hasPendingPayment;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}>
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
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
            <Link key={item.label} to={item.path} className={`flex items-center gap-2 p-2 pr-0 hover:bg-blue-100 rounded transition-all ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}>
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && <span className="text-lg font-semibold text-blue-500 uppercase mb-2">SUCOL WATER SYSTEM</span>}
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded">
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4 p-8">
        {notificationMsg.text && (
          <div className={`p-3 rounded mb-4 font-medium ${notificationMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {notificationMsg.text}
          </div>
        )}

        <div className="flex gap-6">
          {/* Active Users */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-blue-600 text-white py-4 px-5 rounded-xl shadow mb-2 text-xl font-semibold">
              Users
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded ${userFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setUserFilter("all")}
              >
                All Users
              </button>
              <button
                className={`px-3 py-1 rounded ${userFilter === "pending" ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setUserFilter("pending")}
              >
                Pending Approval
              </button>
              <button
                className={`px-3 py-1 rounded ${userFilter === "approved" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setUserFilter("approved")}
              >
                Approved
              </button>
            </div>

            {loading ? <p>Loading users...</p> : filteredUsers.length === 0 ? <p>No users found.</p> : (
              filteredUsers.map(user => {
                const hasPendingPayment = notifications.some(
                  n => n.user_id === user.id && !n.is_read && n.title.includes("Payment")
                );

                return (
                  <div
                    key={user.id}
                    ref={el => userRefs.current[user.id] = el}
                    className={`bg-white p-4 rounded-lg shadow hover:shadow-lg transition ${expandedUserId === user.id ? "border-2 border-blue-400" : ""} ${hasPendingPayment ? "border-2 border-yellow-400" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <button className="text-lg font-semibold text-blue-600 hover:text-blue-500" onClick={() => expandUser(user.id)}>
                        {user.name}
                      </button>

                      {hasPendingPayment && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800">
                          Pending Approval
                        </span>
                      )}

                      <button onClick={() => openNoticeModal(user.id)} className="ml-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded shadow hover:shadow-lg flex items-center gap-2">
                        <FaPaperPlane /> Send Notice
                      </button>
                    </div>

                    {expandedUserId === user.id && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {/* Records */}
                        <div className="col-span-2 flex flex-col gap-3">
                          {recordsByUser[user.id]?.length > 0 ? recordsByUser[user.id].map(r => (
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
                          )) : <p>No payment records found.</p>}
                        </div>

                        {/* Payment Proof */}
                        <div className="col-span-1 p-3 bg-white rounded-lg shadow flex flex-col items-center">
                          <h2 className="text-lg font-semibold mb-2 text-center">Payment Proof</h2>
                          {recordsByUser[user.id]?.[0]?.proof_url ? (
                            <img src={`http://localhost:5000${recordsByUser[user.id][0].proof_url}`} alt="Payment Proof" className="w-60 h-70 rounded-lg shadow object-contain" />
                          ) : <p className="text-gray-500 italic">No proof uploaded.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Overdue Users */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-red-600 text-white py-4 px-5 rounded-xl shadow mb-6 text-xl font-semibold">
              Overdue / Notice Users
            </div>

            {loadingOverdue ? <p>Loading overdue users...</p> : overdueUsers.length === 0 ? <p>No overdue users or notices.</p> : (
              overdueUsers.map(user => (
                <div key={user.user_id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold text-red-600">{user.name}</p>
                    <p>Remaining Balance: ₱{user.remaining_balance}</p>
                    <p>Billing Date: {new Date(user.billing_date).toLocaleDateString()}</p>
                    <p>Due Date: {new Date(user.due_date).toLocaleDateString()}</p>
                    <p className="text-gray-600 italic">{user.notice_sent ? "Notice already sent" : "Notice pending"}</p>
                  </div>
                  {!user.notice_sent && (
                    <button onClick={() => handleSendDeactNotice(user.user_id)} className="bg-gradient-to-r from-red-500 to-red-700 text-white px-4 py-2 rounded shadow hover:shadow-lg flex items-center gap-2">
                      <FaPaperPlane /> Send Notice
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personal Notice Modal */}
        {showNoticeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      </main>
    </div>
  );
};

export default ManageRecords;
