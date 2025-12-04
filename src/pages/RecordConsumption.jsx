import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaFolderOpen, FaUserCircle } from "react-icons/fa";
import { fetchConsumptions, addConsumption } from "../api/api.js";

const RecordConsumption = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentReadingInput, setCurrentReadingInput] = useState("");
  const [calculatedBill, setCalculatedBill] = useState(0);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all / paid / unpaid
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/meter-dashboard", icon: <FaTachometerAlt /> },
    { label: "Record Consumption", path: "/record-consumption", icon: <FaFolderOpen /> },
  ];

  useEffect(() => {
    loadConsumptions();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterStatus, customers]);

  const getLatestCustomers = (records) => {
    const map = new Map();
    records.forEach((r) => {
      if (
        !map.has(r.user_id) ||
        new Date(r.billing_date) > new Date(map.get(r.user_id).billing_date)
      ) {
        map.set(r.user_id, r);
      }
    });
    return Array.from(map.values());
  };

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      const latestCustomers = getLatestCustomers(res.data.data || []);
      setCustomers(latestCustomers);
    } catch (err) {
      console.error("Failed to fetch consumptions:", err);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentReadingInput("");
    setCalculatedBill(0);
    setMessage("");
  };

  const calculateBill = (cubicUsed) => {
    if (cubicUsed <= 5) return 270;
    return 270 + (cubicUsed - 5) * 17;
  };

  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    setCurrentReadingInput(value);
    setCalculatedBill(calculateBill(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const cubicUsed = Number(currentReadingInput);
    if (cubicUsed <= 0) {
      setMessage("Current reading must be greater than 0.");
      return;
    }

    const payload = {
      user_id: selectedCustomer.user_id,
      name: selectedCustomer.name,
      cubic_used: cubicUsed,
    };

    try {
      const res = await addConsumption(payload);
      const newRecord = res.data.data;

      setCustomers((prev) => [
        ...prev.filter((c) => c.user_id !== newRecord.user_id),
        newRecord,
      ]);

      setSelectedCustomer(newRecord);
      setMessage("New reading recorded successfully!");
      setCurrentReadingInput("");
      setCalculatedBill(0);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to record reading.";
      setMessage(errMsg);
    }

    setTimeout(() => setMessage(""), 5000);
  };

  const isPaid = (customer) =>
    Number(customer.payment_total || 0) >= Number(customer.total_bill || 0);

  const applyFilter = () => {
    if (filterStatus === "all") {
      setFilteredCustomers(customers);
    } else if (filterStatus === "paid") {
      setFilteredCustomers(customers.filter(isPaid));
    } else if (filterStatus === "unpaid") {
      setFilteredCustomers(customers.filter((c) => !isPaid(c)));
    }
  };

  // -------------------- LOGOUT --------------------
  const handleLogout = () => {
    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 m-2 rounded-2xl ${
          sidebarOpen ? "w-64" : "w-20 overflow-hidden"
        }`}
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
              className={`flex items-center gap-2 p-2 hover:bg-blue-100 rounded transition-all ${
                sidebarOpen ? "justify-start px-4" : "justify-center"
              }`}
            >
              <span className="text-blue-600 text-2xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer with Logout */}
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

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center bg-blue-600 text-white py-4 px-5 rounded-xl shadow mb-6 text-xl font-semibold">
          <span className="text-xl font-bold">Meter Reader Dashboard</span>
        </div>

        {/* Total Customers and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4 items-center">
          <div className="text-xl font-semibold text-gray-800">
            Total Customers: {customers.length}
          </div>

          <div className="flex items-center gap-3">
            <label className="font-semibold text-gray-700">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Customer List or Selected Customer */}
        {!selectedCustomer && (
          <div className="bg-white/10 border border-gray-300 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-blue-600">Customers</h3>
            <ul className="space-y-3">
              {filteredCustomers.map((c) => (
                <li
                  key={c.id}
                  className="p-4 bg-gray-200 rounded hover:bg-gray-200 cursor-pointer flex justify-between"
                  onClick={() => selectCustomer(c)}
                >
                  <span>{c.name}</span>
                  <span
                    className={
                      isPaid(c) ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
                    }
                  >
                    {isPaid(c) ? "Paid" : "Unpaid"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedCustomer && (
          <div className="bg-white/10 border border-gray-300 p-6 rounded-xl relative">
            {message && (
              <div
                className={`absolute top-4 right-4 px-4 py-2 rounded ${
                  message.includes("successfully") ? "bg-green-600" : "bg-red-600"
                } text-white`}
              >
                {message}
              </div>
            )}

            <button
              className="mb-6 text-blue-600 underline"
              onClick={() => setSelectedCustomer(null)}
            >
              ← Back to Customers
            </button>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-300">
              <h3 className="text-xl font-semibold text-blue-600 mb-4">Customer Details</h3>
              <p>
                <strong>Name:</strong> {selectedCustomer.name}
              </p>
              <p>
                <strong>Previous Reading:</strong> {selectedCustomer.previous_reading} m³
              </p>
              <p>
                <strong>Current Reading:</strong> {selectedCustomer.present_reading} m³
              </p>
              <p>
                <strong>Cubic Used Last Month:</strong> {selectedCustomer.cubic_used_last_month} m³
              </p>
              <p>
                <strong>Current Month Cubic Used:</strong> {selectedCustomer.cubic_used} m³
              </p>
              <p>
                <strong>Total Bill:</strong> ₱ {selectedCustomer.total_bill}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={isPaid(selectedCustomer) ? "text-green-600" : "text-red-600"}>
                  {isPaid(selectedCustomer) ? "Paid" : "Unpaid"}
                </span>
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-blue-600">Enter Current Reading</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1">Current Reading (m³):</label>
                <input
                  type="number"
                  value={currentReadingInput}
                  onChange={handleInputChange}
                  className="p-2 bg-gray-100 rounded w-full"
                  required
                />
              </div>

              {currentReadingInput > 0 && (
                <div className="md:col-span-2 text-yellow-600 font-semibold">
                  Calculated Bill: ₱ {calculatedBill}
                </div>
              )}

              <button
                type="submit"
                className="md:col-span-2 p-2 rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Reading
              </button>
            </form>
          </div>
        )}
      </main>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
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

export default RecordConsumption;
