import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchUsers,
  registerUser,
  deactivateUser,
  reactivateUser,
} from "../api/api.js";
import {
  FaTachometerAlt,
  FaBell,
  FaFolderOpen,
  FaUserCog,
  FaUsers,
  FaFileAlt,
  FaUserCircle,
} from "react-icons/fa";

const ManageCustomers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();

  const navItems = [
      { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
      { label: "User Payments", path: "/manage-records", icon: <FaFolderOpen /> },
      { label: "Notifications Center", path: "/notification-center", icon: <FaBell /> },
      { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
      { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
      { label: "Reports", path: "/manage-records", icon: <FaFileAlt /> },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      if (res.data.success) setCustomers(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddCustomer = async () => {
    const { name, username, password } = formData;
    if (!name || !username || !password) return alert("All fields are required.");

    try {
      const res = await registerUser({ name, username, password });
      if (res.data.success) {
        alert("Customer Added!");
        setFormData({ name: "", username: "", password: "" });
        loadUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add customer.");
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        const res = await deactivateUser(user.id);
        if (res.data.success) alert("User deactivated");
      } else {
        const res = await reactivateUser(user.id);
        if (res.data.success) alert("User reactivated");
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to update user status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col m-2 rounded-2xl shadow-md transition-all ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen && <h1 className="text-2xl font-bold text-blue-600">💧 SWS Admin</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl hover:text-blue-400"
          >
            ☰
          </button>
        </div>

        <nav className="flex flex-col gap-3 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all ${
                sidebarOpen ? "justify-start px-4" : "justify-center"
              }`}
            >
              <span className="text-blue-600 text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto mb-4 py-2 px-2 text-center flex flex-col items-center">
          {sidebarOpen && (
            <span className="text-lg font-semibold text-blue-500 uppercase mb-2">
              SUCOL WATER SYSTEM
            </span>
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="bg-blue-600 text-white text-xl font-semibold py-4 px-5 rounded-xl shadow">
          Manage Customers
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-blue-600 text-3xl font-bold">{totalCustomers}</p>
            <p className="text-gray-600 mt-1 text-sm">Total Customers</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <p className="text-green-600 text-3xl font-bold">{activeCustomers}</p>
            <p className="text-gray-600 mt-1 text-sm">Active Customers</p>
          </div>
        </div>

        {/* Add Customer Form */}
        <div className="bg-white p-6 rounded-xl border shadow mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Add New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="p-3 rounded-lg border"
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="p-3 rounded-lg border"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="p-3 rounded-lg border w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? "🙈" : "👁️"}
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
        <div className="bg-white p-6 rounded-xl border shadow mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">Customer List</h3>
          <table className="w-full border-collapse text-gray-800">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left text-blue-700">Name</th>
                <th className="p-3 text-left text-blue-700">Username</th>
                <th className="p-3 text-left text-blue-700">Status</th>
                <th className="p-3 text-left text-blue-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50 transition"
                >
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
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg text-center">
            <p className="text-lg font-semibold mb-4">Confirm to log out?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCustomers;
