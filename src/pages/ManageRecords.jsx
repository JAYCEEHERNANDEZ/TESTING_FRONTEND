import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaUserCircle, FaFolderOpen, FaBell,
  FaUsers, FaUserCog, FaFileAlt
} from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPaymentProofs,
  adminRecordPayment,
  fetchOverdueUsers,
  sendNotificationPerUser
} from "../api/api.js";

const ManageRecords = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);

  // Notice modal state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeUserId, setNoticeUserId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "User Payments", path: "/manage-records", icon: <FaFolderOpen /> },
    { label: "Notifications Center", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/manage-records", icon: <FaFileAlt /> },
  ];

  // ------------------- Fetch Users -------------------
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const res = await fetchAllUsersAdmin();
        setUsers(res.data.data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // ------------------- Fetch Overdue Users -------------------
  const loadOverdueUsers = async () => {
    try {
      setLoadingOverdue(true);
      const res = await fetchOverdueUsers();
      setOverdueUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching overdue users:", err);
    } finally {
      setLoadingOverdue(false);
    }
  };
  useEffect(() => { loadOverdueUsers(); }, []);

  // ------------------- Expand User Records -------------------
  const handleExpandUser = async (userId) => {
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
      }
    }
    setExpandedUserId(userId);
  };

  // ------------------- Logout -------------------
  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
    navigate("/");
  };

  // ------------------- Record Payment -------------------
  const handleSubmitPayment = async (userId, paymentId, amount) => {
    if (!amount || Number(amount) <= 0) return;
    try {
      await adminRecordPayment(paymentId, Number(amount));
      alert("Payment recorded successfully!");
      const res = await fetchUserPaymentProofs(userId);
      setRecordsByUser(prev => ({ ...prev, [userId]: res.data.data || [] }));
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment.");
    }
  };

  // ------------------- Send Personal Notification -------------------
  const openNoticeModal = (userId) => {
    setNoticeUserId(userId);
    setNoticeTitle("");
    setNoticeMessage("");
    setShowNoticeModal(true);
  };

  const handleSendPersonalNotice = async () => {
    if (!noticeTitle || !noticeMessage) {
      alert("Please enter both title and message.");
      return;
    }
    try {
      await sendNotificationPerUser({
        user_id: noticeUserId,
        title: noticeTitle,
        message: noticeMessage,
        type: "personal"
      });
      alert("Notification sent successfully!");
      setShowNoticeModal(false);
    } catch (err) {
      console.error("Error sending notification:", err);
      alert(err.response?.data?.error || "Failed to send notification.");
    }
  };

  // ------------------- Payment Status -------------------
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
      <main className="flex-1 flex gap-6 p-8">

        {/* Active Users Column */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-blue-600 text-white py-4 px-5 rounded-xl shadow mb-6 text-xl font-semibold">
            All Users
          </div>

          {loading ? <p>Loading users...</p> : activeUsers.length === 0 ? <p>No active users found.</p> : (
            activeUsers.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <button
                    className="text-lg font-semibold text-blue-600 hover:text-blue-500"
                    onClick={() => handleExpandUser(user.id)}
                  >
                    {user.name}
                  </button>
                  <button
                    onClick={() => openNoticeModal(user.id)}
                    className="ml-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Send Notice
                  </button>
                </div>

                {expandedUserId === user.id && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="col-span-2 flex flex-col gap-3">
                      {recordsByUser[user.id]?.length > 0 ? recordsByUser[user.id].map(r => (
                        <div key={r.id} className="p-4 bg-gray-200 rounded-lg flex flex-col gap-2 relative">
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
                              <input
                                type="number"
                                className="p-2 border rounded w-1/2"
                                placeholder="Enter payment amount"
                                onChange={e => r.adminPayment = e.target.value}
                              />
                              <button
                                className="bg-green-600 p-2 rounded hover:bg-green-700 text-white"
                                onClick={() => handleSubmitPayment(user.id, r.id, r.adminPayment)}
                              >
                                Record Payment
                              </button>
                            </div>
                          )}
                        </div>
                      )) : <p>No payment records found.</p>}
                    </div>

                    <div className="col-span-1 p-3 bg-white rounded-lg shadow flex flex-col items-center">
                      <h2 className="text-lg font-semibold mb-2 text-center">Payment Proof</h2>
                      {recordsByUser[user.id]?.[0]?.proof_url ? (
                        <img
                          src={`http://localhost:5000${recordsByUser[user.id][0].proof_url}`}
                          alt="Payment Proof"
                          className="w-60 h-70 rounded-lg shadow object-contain"
                        />
                      ) : <p className="text-gray-500 italic">No proof uploaded.</p>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Overdue Users Column */}
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
                  <p className="text-gray-600 italic">
                    {user.notice_sent ? "Notice already sent" : "Notice pending"}
                  </p>
                </div>
                {!user.notice_sent && (
                  <button
                    onClick={() => openNoticeModal(user.user_id)}
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                  >
                    Send Notice
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </main>

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Send Personal Notification</h2>
            <input
              type="text"
              placeholder="Title"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="w-full p-2 border rounded mb-3"
            />
            <textarea
              placeholder="Message"
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className="w-full p-2 border rounded mb-3 h-24"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNoticeModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleSendPersonalNotice} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageRecords;
