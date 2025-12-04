import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
} from "react-icons/fa";

const ManageCustomers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "Records", path: "/admin-records", icon: <FaFolderOpen /> },
    { label: "Notification", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/admin-profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/reports", icon: <FaFileAlt /> },
  ];

  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });

  // Load all users
  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      if (res.data.success) setCustomers(res.data.message);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCustomer = async () => {
    const { name, username, password } = formData;
    if (!name || !username || !password) {
      alert("All fields are required.");
      return;
    }

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

  return (
    <div className="flex bg-gray-100 min-h-screen text-gray-800">

      {/* SIDEBAR */}
      <aside
        className={`bg-gray-950 text-white flex flex-col m-2 rounded-2xl shadow-md transition-all ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen && (
            <h1 className="text-2xl font-bold text-blue-600">💧 SWS Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl hover:text-blue-400"
          >
            ☰
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="flex items-center gap-3 hover:bg-blue-100 p-2 rounded text-white hover:text-gray-900 transition"
            >
              <span className="text-blue-600 text-xl">{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">

        {/* Title Bar */}
        <div className="bg-blue-600 text-white text-xl font-semibold py-4 px-5 rounded-xl shadow">
          Manage Customers
        </div>

        {/* ADD CUSTOMER */}
        <div className="bg-white p-6 rounded-xl border shadow mt-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Add New Customer
          </h3>

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
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="p-3 rounded-lg border"
            />
          </div>

          <button
            onClick={handleAddCustomer}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow text-white"
          >
            Add Customer
          </button>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="bg-white p-6 rounded-xl border shadow mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">
            Customer List
          </h3>

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

                  <td
                    className={`p-3 font-semibold ${
                      user.is_active ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {user.is_active ? "Active" : "Deactivated"}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-4 py-2 rounded-lg shadow text-white ${
                        user.is_active
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
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
    </div>
  );
};

export default ManageCustomers;
