import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NotificationCenter = () => {
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const navItems = [
    { label: "Dashboard", path: "/admin-dashboard" },
    { label: "Records", path: "/records" },
    { label: "Notification Center", path: "/notification-center" },
    { label: "Profiles", path: "/profiles" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Reports", path: "/reports" },
  ];

  // Fetch all sent notifications (admin view)
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/notifications/all"); // adjust if needed
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Send new broadcast notification
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch("/notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"), 
        },
        body: JSON.stringify({ title: "Announcement", message }),
      });

      const data = await res.json();

      if (data.success) {
        setFeedback("Notification sent successfully!");
        setMessage("");
        fetchNotifications(); // refresh list
      } else {
        setFeedback(data.error || "Failed to send notification.");
      }
    } catch (error) {
      setFeedback("Server error.");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white font-sans">

      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 p-10 max-w-6xl mx-auto w-full">

        {/* Header */}
        <header className="bg-blue-600/40 backdrop-blur-lg text-white p-4 rounded-xl mb-6 border border-blue-500/30 shadow-lg shadow-blue-900/40">
          <h1 className="text-xl font-bold text-center drop-shadow-md">
            Notification Center
          </h1>
        </header>

        {/* Notification Form */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl mb-6">
          <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
            <textarea
              name="message"
              placeholder="Enter message for all customers..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 border border-gray-600/50 rounded w-full h-24 resize-none bg-white/5 text-white placeholder-gray-300 backdrop-blur-sm"
            />

            {feedback && (
              <p className="text-center text-sm text-green-400">
                {feedback}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 w-full md:w-1/3 transition-all disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 shadow-lg p-6 rounded-xl">
          <h2 className="font-semibold mb-4 text-blue-300">Sent Notifications</h2>

          {notifications.length === 0 ? (
            <p className="text-gray-400">No notifications sent yet.</p>
          ) : (
            <ul className="space-y-2 text-gray-300">
              {notifications.map((notif, idx) => (
                <li
                  key={idx}
                  className="bg-white/5 p-3 rounded hover:bg-blue-500/10 transition"
                >
                  <p className="text-sm">{notif.message}</p>
                  <small className="text-gray-400 text-xs">
                    Sent at: {new Date(notif.sent_at).toLocaleString()}
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
