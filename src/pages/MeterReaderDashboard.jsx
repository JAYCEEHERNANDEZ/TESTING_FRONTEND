import React, { useState, useEffect } from "react";
import {
  fetchConsumptions,
  updateConsumption,
  updateConsumptionStatus,
} from "../api/api";
import { Link } from "react-router-dom";

const MeterReaderDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cubicInput, setCubicInput] = useState("");
  const [billingMonth, setBillingMonth] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  /* --------------------------------------
        LOAD ALL CONSUMPTIONS
  -------------------------------------- */
  useEffect(() => {
    loadConsumptions();
  }, []);

  const loadConsumptions = async () => {
    try {
      const res = await fetchConsumptions();
      setCustomers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch consumptions:", err);
    }
  };

  /* --------------------------------------
        BILL COMPUTATION (AUTO)
  -------------------------------------- */
  const computeBill = (cubic) => {
    if (cubic <= 0) return 0;
    if (cubic <= 5) return 270;
    return 270 + (cubic - 5) * 17;
  };

  /* --------------------------------------
        SELECT CUSTOMER
  -------------------------------------- */
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCubicInput("");
    setBillingMonth(customer.billing_month ?? "");
  };

  /* --------------------------------------
        SAVE NEW CONSUMPTION — FINAL LOGIC
        ✔ cubic_input = cubic_used
        ✔ current_reading = cubic_used
        ✔ previous_reading = last cubic_used
        ✔ NO subtraction
  -------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const cubic = Number(cubicInput);
    const previousCubic = Number(selectedCustomer.cubic_used ?? 0);

    if (cubic <= 0) {
      alert("Cubic used must be greater than 0.");
      return;
    }

    const amount = computeBill(cubic);

    const payload = {
      user_id: selectedCustomer.user_id,
      name: selectedCustomer.name,

      previous_reading: previousCubic,  // ✔ last cubic used
      current_reading: cubic,          // ✔ current reading = cubic used
      cubic_used: cubic,               // ✔ cubic used = input

      amount: amount,
      billing_month: billingMonth,
      status: selectedCustomer.status || "unpaid",
    };

    try {
      const res = await updateConsumption(selectedCustomer.id, payload);

      setCustomers(
        customers.map((c) =>
          c.id === selectedCustomer.id ? res.data.data : c
        )
      );

      setSelectedCustomer(res.data.data);

      setSuccessMessage("Consumption saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to update reading:", err);
      setSuccessMessage("Failed to update reading.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  /* --------------------------------------
        TOGGLE STATUS
  -------------------------------------- */
  const toggleStatus = async () => {
    if (!selectedCustomer) return;

    try {
      const newStatus =
        selectedCustomer.status === "paid" ? "unpaid" : "paid";

      const res = await updateConsumptionStatus(
        selectedCustomer.id,
        newStatus
      );

      setCustomers(
        customers.map((c) =>
          c.id === selectedCustomer.id ? res.data.data : c
        )
      );

      setSelectedCustomer(res.data.data);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">

      {/* Sidebar */}
      <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-10">Meter Reader</h2>
        <nav className="flex flex-col gap-4 text-gray-300">
          <Link to="/dashboard" className="hover:text-blue-400">Dashboard</Link>
          <Link to="/record-consumption" className="hover:text-blue-400">Record Consumption</Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10">
        <div className="bg-blue-600/40 text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 mb-6">
          Record Consumption Dashboard
        </div>

        {/* Customer List */}
        {!selectedCustomer && (
          <div className="bg-white/10 border border-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Customers</h3>

            <ul className="space-y-3">
              {customers.map((c) => (
                <li
                  key={c.id}
                  className="p-4 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => selectCustomer(c)}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Selected Customer */}
        {selectedCustomer && (
          <div className="bg-white/10 border border-gray-700 p-6 rounded-xl relative">

            {successMessage && (
              <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded">
                {successMessage}
              </div>
            )}

            <button
              className="mb-6 text-blue-400 underline"
              onClick={() => setSelectedCustomer(null)}
            >
              ← Back to Customers
            </button>

            {/* Customer Details */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">
                Customer Details
              </h3>

              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Previous Reading:</strong> {selectedCustomer.previous_reading}</p>
              <p><strong>Current Reading:</strong> {selectedCustomer.current_reading}</p>
              <p><strong>Cubic Used:</strong> {selectedCustomer.cubic_used ?? 0}</p>
              <p><strong>Total Amount:</strong> ₱{selectedCustomer.amount ?? 0}</p>
              <p><strong>Billing Month:</strong> {selectedCustomer.billing_month}</p>

              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    selectedCustomer.status === "paid"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {selectedCustomer.status}
                </span>
              </p>
            </div>

            {/* Form */}
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Enter Cubic Used</h3>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label className="block mb-1">Cubic Used:</label>
                <input
                  type="number"
                  value={cubicInput}
                  onChange={(e) => setCubicInput(e.target.value)}
                  className="p-2 bg-gray-800 text-white rounded w-full"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1">Billing Month:</label>
                <input
                  type="text"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="p-2 bg-gray-800 text-white rounded w-full"
                  required
                />
              </div>

              <button
                type="submit"
                className="md:col-span-2 bg-blue-500 hover:bg-blue-600 p-2 rounded text-white"
              >
                Save Consumption
              </button>
            </form>

            <button
              onClick={toggleStatus}
              className="mt-4 bg-blue-500 hover:bg-blue-600 p-2 rounded text-white"
            >
              Toggle Status
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeterReaderDashboard;
