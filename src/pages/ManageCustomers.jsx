import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsers, registerUser, deleteUser } from "../api/api";  

const ManageCustomers = () => {

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Records", path: "/admin-records" },
    { label: "Notification", path: "/notification-center" },
    { label: "Profiles", path: "/admin-profiles" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Reports", path: "/reports" },
  ];

  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });

  const loadUsers = async () => {
    try {
      const res = await fetchUsers();
      if (res.data.success) {
        setCustomers(res.data.message);
      }
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
    } catch (e) {
      console.error(e);
      alert("Failed to add customer.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await deleteUser(id);
      if (res.data.success) {
        alert("User Removed");
        loadUsers();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">

      {/* SIDEBAR */}
      <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-blue-400 drop-shadow-lg mb-10 tracking-wide">
          Sucol Water System
        </h2>

        <nav className="flex flex-col gap-4 text-gray-300">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="hover:text-blue-400 hover:translate-x-1 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">

        {/* TITLE BAR */}
        <div className="bg-blue-600/40 backdrop-blur-lg text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg shadow-blue-900/40">
          Manage Customers
        </div>

        {/* ADD CUSTOMER */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 mt-8 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-blue-300 mb-4">
            Add New Customer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="p-3 rounded-lg bg-white/5 border border-gray-600 text-white"
            />

            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="p-3 rounded-lg bg-white/5 border border-gray-600 text-white"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="p-3 rounded-lg bg-white/5 border border-gray-600 text-white"
            />
          </div>

          <button
            onClick={handleAddCustomer}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg shadow-lg"
          >
            Add Customer
          </button>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">
            Customer List
          </h3>

          <table className="w-full border-collapse text-gray-300">
            <thead>
              <tr className="bg-white/5 border-b border-gray-600">
                <th className="p-3 text-left text-blue-300">Name</th>
                <th className="p-3 text-left text-blue-300">Username</th>
                <th className="p-3 text-left text-blue-300">Role</th>
                <th className="p-3 text-left text-blue-300">Status</th>
                <th className="p-3 text-left text-blue-300">Actions</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-700/50 hover:bg-white/5 transition"
                >
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.username}</td>
                  <td className="p-3 text-green-300">{c.role}</td>
                  <td className="p-3 text-green-400 font-semibold">{c.status}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow"
                    >
                      Remove
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
