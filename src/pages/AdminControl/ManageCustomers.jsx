// ManageCustomers.jsx
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

// Dialog component
const Dialog = ({ type, message, onClose }) => {
  const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";
  const textColor = type === "success" ? "text-green-700" : "text-red-700";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className={`p-6 rounded-xl shadow-lg w-96 ${bgColor} flex flex-col items-center`}>
        <p className={`text-lg font-semibold ${textColor} mb-4`}>{message}</p>
        <button onClick={onClose} className="px-4 py-2 rounded bg-white hover:opacity-90 shadow">
          OK
        </button>
      </div>
    </div>
  );
};

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [dialog, setDialog] = useState({ show: false, type: "success", message: "" });
  const [overdueUsers, setOverdueUsers] = useState([]);
  const [sendingNotice, setSendingNotice] = useState(false);

  // Load users and overdue users
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
      showDialog("error", "Failed to fetch users.");
    }
  };

  const loadOverdueUsers = async () => {
    try {
      const res = await fetchOverdueUsers();
      if (res.data.success) setOverdueUsers(res.data.users);
    } catch (err) {
      console.error(err);
      showDialog("error", "Failed to fetch overdue users.");
    }
  };

  const showDialog = (type, message) => setDialog({ show: true, type, message });

  // Add customer
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAddCustomer = async () => {
    const { name, username, password } = formData;
    if (!name || !username || !password) return showDialog("error", "All fields are required.");

    try {
      const res = await registerUser({ name, username, password });
      if (res.data.success) {
        showDialog("success", "Customer Added Successfully!");
        setFormData({ name: "", username: "", password: "" });
        loadUsers();
      }
    } catch (err) {
      console.error(err);
      showDialog("error", "Failed to add customer.");
    }
  };

  // Toggle user status
  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        const res = await deactivateUser(user.id);
        if (res.data.success) showDialog("success", "User deactivated");
      } else {
        const res = await reactivateUser(user.id);
        if (res.data.success) showDialog("success", "User reactivated");
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      showDialog("error", "Failed to update user status");
    }
  };

  // Send notice
  const handleSendOverdueNotice = async (user_id) => {
    setSendingNotice(true);
    try {
      await sendDeactNotice({ user_id });
      showDialog("success", "Notice sent successfully!");
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
      showDialog("error", "Failed to send notice.");
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
      showDialog("success", "Notice sent to all overdue users!");
      loadOverdueUsers();
    } catch (err) {
      console.error(err);
      showDialog("error", "Failed to send notice to all.");
    } finally {
      setSendingNotice(false);
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;

  return (
    <SideBarHeader>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Main Content */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto max-h-[calc(vh-80px)]">
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
  {/* Full Name */}
  <div className="flex flex-col">
    <label htmlFor="name" className="mb-1 text-sm font-medium text-gray-700">Full Name</label>
    <input
      type="text"
      id="name"
      name="name"
      placeholder="Enter full name"
      value={formData.name}
      onChange={handleChange}
      className="p-3 rounded-lg shadow-inner"
    />
  </div>

  {/* Username */}
  <div className="flex flex-col">
    <label htmlFor="username" className="mb-1 text-sm font-medium text-gray-700">Username</label>
    <input
      type="text"
      id="username"
      name="username"
      placeholder="Enter username"
      value={formData.username}
      onChange={handleChange}
      className="p-3 rounded-lg shadow-inner"
    />
  </div>

  {/* Password */}
  <div className="flex flex-col relative">
    <label htmlFor="password" className="mb-1 text-sm font-medium text-gray-700">Password</label>
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      placeholder="Enter password"
      value={formData.password}
      onChange={handleChange}
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

            <button onClick={handleAddCustomer} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow text-white">
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
                      <button onClick={() => handleToggleStatus(user)} className={`px-4 py-2 rounded-lg shadow text-white ${user.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
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
        <div className="w-full lg:w-80 flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">Overdue Users</h3>
              {overdueUsers.length > 0 && (
                <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm" onClick={handleSendNoticeAll} disabled={sendingNotice}>
                  {sendingNotice ? "Sending..." : "Send All"}
                </button>
              )}
            </div>
            {overdueUsers.length === 0 && <p className="text-gray-500">No overdue users</p>}
            {overdueUsers.map((u) => (
              <div key={u.user_id} className="flex flex-col gap-1 p-3 bg-gray-50 rounded shadow hover:shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{u.name}</span>
                  <button className={`px-2 py-1 text-xs rounded ${u.notice_sent ? "bg-gray-400 text-white cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700"}`} onClick={() => handleSendOverdueNotice(u.user_id)} disabled={u.notice_sent || sendingNotice}>
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

      {/* Dialog */}
      {dialog.show && <Dialog type={dialog.type} message={dialog.message} onClose={() => setDialog({ ...dialog, show: false })} />}
    </SideBarHeader>
  );
};

export default ManageCustomers;
