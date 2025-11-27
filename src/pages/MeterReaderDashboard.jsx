import React, { useState, useEffect } from "react";
import { fetchConsumptions, updateConsumption } from "../api/api";

const MeterReaderDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentBillInput, setCurrentBillInput] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load all consumptions on mount
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

  // Select a customer
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentBillInput(""); // Reset input
  };

  // Submit new reading (bill)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const newBill = Number(currentBillInput);

    if (newBill <= 0) {
      alert("Current bill must be greater than 0.");
      return;
    }

    // Send payload: previous reading = last total bill, current reading = new total bill
    const payload = {
      previous_reading: selectedCustomer.present_reading,
      present_reading: newBill,
      payment_1: Number(selectedCustomer.payment_1 ?? 0),
      payment_2: Number(selectedCustomer.payment_2 ?? 0),
    };

    try {
      const res = await updateConsumption(selectedCustomer.id, payload);
      const updated = res.data.data;

      // Update customer list and selected customer
      setCustomers(customers.map(c => c.id === updated.id ? updated : c));
      setSelectedCustomer(updated);

      setSuccessMessage("Consumption updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setCurrentBillInput("");
    } catch (err) {
      console.error("Failed to update reading:", err.response?.data || err);
      setSuccessMessage("Failed to update consumption.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <div className="flex bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-screen text-white">
      {/* Sidebar */}
      <aside className="w-64 backdrop-blur-xl bg-white/5 border-r border-blue-500/20 shadow-xl p-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-10">Meter Reader</h2>
        <nav className="flex flex-col gap-4 text-gray-300">
          <a href="/dashboard" className="hover:text-blue-400">Dashboard</a>
          <a href="/record-consumption" className="hover:text-blue-400">Record Consumption</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="bg-blue-600/40 text-white text-xl font-semibold py-4 px-5 rounded-xl border border-blue-500/30 mb-6">
          Record Consumption Dashboard
        </div>

        {/* Customer List */}
        {!selectedCustomer && (
          <div className="bg-white/10 border border-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Customers</h3>
            <ul className="space-y-3">
              {customers.map(c => (
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
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Customer Details</h3>
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Previous Bill:</strong> ₱{selectedCustomer.previous_reading}</p>
              <p><strong>Current Bill:</strong> ₱{selectedCustomer.present_reading}</p>
              <p><strong>Cubic Used:</strong> {selectedCustomer.cubic_used} m³</p>
              <p><strong>Total Amount:</strong> ₱{selectedCustomer.total_bill}</p>
              <p><strong>Remaining Balance:</strong> ₱{selectedCustomer.remaining_balance}</p>
              <p><strong>Payment 1:</strong> ₱{selectedCustomer.payment_1}</p>
              <p><strong>Payment 2:</strong> ₱{selectedCustomer.payment_2}</p>
            </div>

            {/* Input Form */}
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Enter Current Bill</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1">Current Bill:</label>
                <input
                  type="number"
                  value={currentBillInput}
                  onChange={(e) => setCurrentBillInput(e.target.value)}
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
          </div>
        )}
      </main>
    </div>
  );
};

export default MeterReaderDashboard;
  