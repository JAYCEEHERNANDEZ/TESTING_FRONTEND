import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaMoneyBillWave,
  FaUserCircle,
  FaBell,
  FaUsers,
  FaFolderOpen,
  FaUserCog,
} from "react-icons/fa";
import {
  fetchAllUsersAdmin,
  fetchUserPendingPayments,
  adminRecordPayment,
} from "../api/api.js";

const ManageRecords = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [recordsByUser, setRecordsByUser] = useState({});
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "Records", path: "/manage-records", icon: <FaMoneyBillWave /> },
    { label: "Notifications", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Manage Files", path: "/manage-records", icon: <FaFolderOpen /> },
  ];

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

  const handleExpandUser = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    if (!recordsByUser[userId]) {
      try {
        const res = await fetchUserPendingPayments(userId);
        const payments = res.data.data || [];
        const editableRecords = payments.map((p) => ({
          ...p,
          adminPayment: p.remaining_balance,
        }));
        setRecordsByUser((prev) => ({ ...prev, [userId]: editableRecords }));
      } catch (err) {
        console.error("Error fetching user payments:", err);
        setRecordsByUser((prev) => ({ ...prev, [userId]: [] }));
      }
    }
    setExpandedUserId(userId);
  };

  const handlePaymentChange = (userId, paymentId, value) => {
    setRecordsByUser((prev) => ({
      ...prev,
      [userId]: prev[userId].map((r) =>
        r.id === paymentId ? { ...r, adminPayment: Number(value) } : r
      ),
    }));
  };

  const handleSubmitPayment = async (userId, paymentId) => {
    const record = recordsByUser[userId].find((r) => r.id === paymentId);
    if (!record) return;

    try {
      await adminRecordPayment(paymentId, record.adminPayment);
      alert("Payment recorded successfully!");

      // Refresh payments
      const res = await fetchUserPendingPayments(userId);
      const payments = res.data.data || [];
      const updatedRecords = payments.map((p) => ({
        ...p,
        adminPayment: p.remaining_balance,
      }));
      setRecordsByUser((prev) => ({ ...prev, [userId]: updatedRecords }));
    } catch (err) {
      console.error("Error recording payment:", err);
      alert("Failed to record payment.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
          ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1
                className="text-2xl font-bold text-blue-600 cursor-pointer"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                💧 SWS
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-2xl text-white hover:text-blue-400"
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

        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 pr-0 hover:bg-blue-100 rounded transition-all
              ${sidebarOpen ? "justify-start px-4" : "justify-center"}`}
            >
              <span className="text-2xl text-blue-600">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && (
            <span className="text-lg font-semibold text-blue-500 uppercase mb-2">
              SUCOL WATER SYSTEM
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold text-blue-600 mb-6">Manage Payments</h1>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <button
                    className="w-full text-left text-lg font-semibold text-blue-600 hover:text-blue-500"
                    onClick={() => handleExpandUser(user.id)}
                  >
                    {user.name}
                  </button>

                  {expandedUserId === user.id && (
                    <div className="mt-4 flex flex-col gap-3">
                      {recordsByUser[user.id]?.length > 0 ? (
                        recordsByUser[user.id].map((r) => (
                          <div
                            key={r.id}
                            className="p-4 bg-gray-200 rounded-lg flex flex-col gap-2"
                          >
                            <p>
                              Billing Month:{" "}
                              {new Date(r.billing_date).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <p>Previous Reading: {r.previous_reading}</p>
                            <p>Current Reading: {r.present_reading}</p>
                            <p>Consumption: {r.cubic_used} m³</p>
                            <p>Total Bill: ₱{r.total_bill}</p>
                            <p>Payment 1: ₱{r.payment_1}</p>
                            <p>Payment 2: ₱{r.payment_2}</p>
                            <p>Payment Total: ₱{r.payment_total}</p>
                            <p>Remaining Balance: ₱{r.remaining_balance}</p>
                            <p>Reference Code: {r.reference_code || "N/A"}</p>

                            <div className="flex gap-2 mt-2">
                              <input
                                type="number"
                                className="p-2 border rounded w-1/2"
                                value={r.adminPayment}
                                onChange={(e) =>
                                  handlePaymentChange(user.id, r.id, e.target.value)
                                }
                                placeholder="Enter payment amount"
                              />
                              <button
                                className="bg-green-600 p-2 rounded hover:bg-green-700 text-white"
                                onClick={() => handleSubmitPayment(user.id, r.id)}
                              >
                                Record Payment
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No pending payments for this user.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageRecords;
