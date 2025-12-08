import React, { useEffect, useState } from "react";
import SideBarHeader from "./SideBarHeader.jsx";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  fetchUsers,
  registerUser,
  deactivateUser,
  reactivateUser,
  fetchOverdueUsers,
  sendDeactNotice,
} from "../../api/api.js";
import usePageTitle from "../usePageTitle";

const ManageCustomers = () => {
  usePageTitle("Manage Customers");
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [sendingNotice, setSendingNotice] = useState(false);

  // ---------- Load users and overdue users ----------
  useEffect(() => {
    loadUsers();
    loadOverdueUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      if (res.data.success) setCustomers(res.data.message);
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch users.");
    }
  };

  const loadOverdueUsers = async () => {
    try {
      const res = await fetchOverdueUsers();
      if (res.data.success) setOverdueUsers(res.data.users);
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch overdue users.");
    }
  };

  // ---------- Sticky notification ----------
  const showNotification = (type, message) => {
    setNotifications([{ type, message }]);
    setTimeout(() => setNotifications([]), 5000); // auto-hide after 5 seconds
  };

  // ---------- Add Customer ----------
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddCustomer = async () => {
    const { name, username, password } = formData;
    if (!name || !username || !password) {
      return showNotification("error", "All fields are required.");
    }

    try {
      const res = await registerUser({ name, username, password });
      if (res.data.success) {
        showNotification("success", "Customer Added Successfully!");
        setFormData({ name: "", username: "", password: "" });
        loadUsers();
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "The username is already taken, or the password is not strong enough.");
    }
  };

  // ---------- Toggle User Status ----------
  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        const res = await deactivateUser(user.id);
        if (res.data.success) showNotification("success", "User deactivated.");
      } else {
        const res = await reactivateUser(user.id);
        if (res.data.success) showNotification("success", "User reactivated.");
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to update user status.");
    }
  };

  // ---------- Send Overdue Notice ----------
  const handleSendOverdueNotice = async (user_id) => {
    setSendingNotice(true);
    try {
      await sendDeactNotice({ user_id });
      showNotification("success", "Notice sent successfully!");
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to send notice.");
    } finally {
      setSendingNotice(false);
    }
  };

  const handleSendNoticeAll = async () => {
    setSendingNotice(true);
    try {
      for (const u of overdueUsers) {
        if (!u.notice_sent) await sendDeactNotice({ user_id: u.user_id });
      }
      showNotification("success", "Notice sent to all overdue users!");
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to send notice to all.");
    } finally {
      setSendingNotice(false);
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;

  return (
    <SideBarHeader>
      {/* ---------- Sticky Notification ---------- */}
      {notifications.length > 0 && (
        <div className={`fixed top-5 right-5 p-4 rounded shadow z-50 transition-all ${
          notifications[0].type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-100 text-red-800"
        }`}>
          {notifications[0].message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Main Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-3 pl-8 rounded-xl shadow-md">
              <p className="text-blue-600 text-3xl font-bold">{totalCustomers}</p>
              <p className="text-gray-600 mt-1 text-sm">Total Customers</p>
            </div>
            <div className="bg-white p-3 pl-8 rounded-xl shadow-md">
              <p className="text-green-600 text-3xl font-bold">{activeCustomers}</p>
              <p className="text-gray-600 mt-1 text-sm">Active Customers</p>
            </div>
          </div>

          {/* Add Customer Form */}
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Add New Customer</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="p-3 rounded-lg shadow-inner"
                />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  className="p-3 rounded-lg shadow-inner"
                />
              </div>
              <div className="flex flex-col relative">
                <label className="mb-1 text-sm font-medium text-gray-700">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="p-3 rounded-lg shadow-inner w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 pt-1 text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button
              onClick={handleAddCustomer}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow text-white"
            >
              Add Customer
            </button>
          </div>

          {/* Customer Table */}
          <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Customer List</h3>
            <table className="w-full text-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left text-blue-700">Name</th>
                  <th className="p-3 text-left text-blue-700">Username</th>
                  <th className="p-3 text-left text-blue-700">Status</th>
                  <th className="p-3 text-left text-blue-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.username}</td>
                    <td className={`p-3 font-semibold ${user.is_active ? "text-green-600" : "text-red-600"}`}>
                      {user.is_active ? "Active" : "Deactivated"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`px-4 py-2 rounded-lg shadow text-white ${
                          user.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {user.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Overdue Users */}
        <div className="w-full lg:w-80 flex-shrink-0 top-20 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">Overdue Users</h3>
              {overdueUsers.length > 0 && (
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  onClick={handleSendNoticeAll}
                  disabled={sendingNotice}
                >
                  {sendingNotice ? "Sending..." : "Send All"}
                </button>
              )}
            </div>
            {overdueUsers.length === 0 && <p className="text-gray-500">No overdue users</p>}
            {overdueUsers.map((u) => (
              <div key={u.user_id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded shadow hover:shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{u.name}</span>
                  <button
                    className={`px-2 py-1 text-xs rounded ${
                      u.notice_sent ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                    onClick={() => handleSendOverdueNotice(u.user_id)}
                    disabled={u.notice_sent || sendingNotice}
                  >
                    {u.notice_sent ? "Sent" : "Send"}
                  </button>
                </div>
                <p className="text-sm text-gray-700">Billing Date: {new Date(u.billing_date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-700">Due Date: {new Date(u.due_date).toLocaleDateString()}</p>
                <p className="text-sm text-red-600 font-semibold">Remaining: ₱{u.remaining_balance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SideBarHeader>
  );
};

export default ManageCustomers;
