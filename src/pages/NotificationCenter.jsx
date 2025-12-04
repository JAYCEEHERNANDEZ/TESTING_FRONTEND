import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  sendNotification,
  fetchAllNotifications,
} from "../api/api.js";

import {
  FaTachometerAlt,
  FaBell,
  FaFolderOpen,
  FaUserCog,
  FaUsers,
  FaFileAlt,
} from "react-icons/fa";

const NotificationCenter = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard", icon: <FaTachometerAlt /> },
    { label: "Records", path: "/records", icon: <FaFolderOpen /> },
    { label: "Notification Center", path: "/notification-center", icon: <FaBell /> },
    { label: "Profiles", path: "/profiles", icon: <FaUserCog /> },
    { label: "Manage Customers", path: "/manage-customers", icon: <FaUsers /> },
    { label: "Reports", path: "/reports", icon: <FaFileAlt /> },
  ];

  const fetchNotifications = async () => {
    try {
      const { data } = await fetchAllNotifications();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    setFeedback("");

    try {
      const { data } = await sendNotification({
        title,
        message,
        user_id: null,
      });

      if (data.success) {
        setFeedback("Notification sent successfully!");
        setTitle("");
        setMessage("");
        fetchNotifications();
      } else {
        setFeedback(data.error || "Failed to send notification.");
      }
    } catch (error) {
      console.error(error);
      setFeedback("Server error.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
          ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
                💧 SWS Admin
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 rounded-xl mb-6 shadow">
          <h1 className="text-xl font-bold text-center">Notification Center</h1>
        </header>

        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow mb-6 border">
          <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border rounded w-full"
            />

            <textarea
              name="message"
              placeholder="Enter message for all customers..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 border rounded w-full h-24 resize-none"
            />

            {feedback && <p className="text-center text-sm text-green-600">{feedback}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50 w-full md:w-1/3"
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>

        {/* Notification List */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-semibold mb-4 text-blue-700">Sent Notifications</h2>

          {notifications.length === 0 ? (
            <p className="text-gray-600">No notifications sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className="bg-gray-100 p-3 rounded hover:bg-blue-50 transition"
                >
                  <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-700">{notif.message}</p>
                  <small className="text-gray-500 text-xs">
                    Sent at: {new Date(notif.created_at).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationCenter;
