import React, { useState } from "react";
import { Link } from "react-router-dom";

const ManageRecords = () => {
  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Records", path: "/admin-records" },
    { label: "Notification", path: "/notification-center" },
    { label: "Profiles", path: "/admin-profiles" },
    { label: "Manage Customers", path: "/manage-customers" },
    { label: "Reports", path: "/reports" },
  ];

  const [records, setRecords] = useState([
    {
      id: 1,
      customer: "Juan Dela Cruz",
      month: "January 2025",
      previous: 120,
      current: 150,
      consumption: 30,
      amount: 180,
      status: "Unpaid",
    },
    {
      id: 2,
      customer: "Maria Santos",
      month: "January 2025",
      previous: 80,
      current: 100,
      consumption: 20,
      amount: 120,
      status: "Paid",
    },
  ]);

  const [dialog, setDialog] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const handleDelete = (id) => {
    setDialog({
      show: true,
      title: "Confirm Delete",
      message: "Are you sure you want to delete this record?",
      onConfirm: () => {
        setRecords(records.filter((r) => r.id !== id));
        setDialog({
          show: true,
          title: "Record Deleted",
          message: "The record has been successfully deleted.",
        });
      },
    });
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/5 border-r border-blue-500/20 backdrop-blur-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-10">
          Sucol Water System
        </h2>

        <nav className="flex flex-col gap-4 text-gray-300">
          {navItems.map((item) => (
            <Link key={item.label} to={item.path} className="hover:text-blue-400 transition">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">
        {/* TITLE */}
        <div className="bg-blue-600/40 backdrop-blur-lg text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 shadow-lg">
          Manage Records
        </div>

        {/* RECORDS TABLE */}
        <div className="bg-white/10 backdrop-blur-xl border border-gray-700/40 p-6 rounded-xl shadow-lg mt-10">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">Consumption Records</h3>

          <table className="w-full border-collapse text-gray-300">
            <thead>
              <tr className="bg-white/5 border-b border-gray-600">
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-left">Prev</th>
                <th className="p-3 text-left">Curr</th>
                <th className="p-3 text-left">Consumption</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-700/50 hover:bg-white/5 transition">
                  <td className="p-3">{r.customer}</td>
                  <td className="p-3">{r.month}</td>
                  <td className="p-3">{r.previous}</td>
                  <td className="p-3">{r.current}</td>
                  <td className="p-3 text-blue-300">{r.consumption} m³</td>
                  <td className="p-3">{r.amount} PHP</td>

                  <td
                    className={`p-3 font-semibold ${
                      r.status === "Paid"
                        ? "text-green-400"
                        : r.status === "Unpaid"
                        ? "text-yellow-300"
                        : "text-red-400"
                    }`}
                  >
                    {r.status}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(r.id)}
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

      {/* DIALOG BOX */}
      {dialog.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-8 shadow-xl w-96">
            <h2 className="text-xl font-semibold text-blue-300 mb-3">{dialog.title}</h2>
            <p className="text-gray-300 mb-6">{dialog.message}</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDialog({ ...dialog, show: false })}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Close
              </button>

              {dialog.onConfirm && (
                <button
                  onClick={() => {
                    dialog.onConfirm();
                    setDialog({ ...dialog, show: false });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRecords;
