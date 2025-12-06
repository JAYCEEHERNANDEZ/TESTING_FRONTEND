// NotificationCenter.jsx
import React, { useState, useEffect } from "react";
import { sendNotification, fetchAllNotifications } from "../../api/api.js";
import SideBarHeader from "./SideBarHeader.jsx"; // reusable sidebar/header

const NotificationCenter = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await fetchAllNotifications();
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

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
    <SideBarHeader>
      {/* Send Notification Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter notification title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 rounded shadow-inner w-full"
          />
          <textarea
            placeholder="Enter message for all customers..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-2 rounded shadow-inner w-full h-24 resize-none"
          />
          {feedback && (
            <p className="text-center text-sm text-green-600">{feedback}</p>
          )}
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
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4 text-blue-700">Sent Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-600">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className="bg-gray-100 p-3 rounded hover:bg-blue-50 transition shadow-sm"
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
    </SideBarHeader>
  );
};

export default NotificationCenter;
