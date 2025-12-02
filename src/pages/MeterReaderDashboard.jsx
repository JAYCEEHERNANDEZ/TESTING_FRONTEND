import React, { useState, useEffect } from "react";
import { fetchConsumptions, updateConsumption } from "../api/api";

const MeterReaderDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentReadingInput, setCurrentReadingInput] = useState("");
  const [calculatedBill, setCalculatedBill] = useState(0);
  const [message, setMessage] = useState("");

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

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCurrentReadingInput("");
    setCalculatedBill(customer.present_reading);
    setMessage("");
  };

  // Billing calculation
  const calculateBill = (cubicUsed) => {
    if (cubicUsed <= 5) return 270;
    return 270 + (cubicUsed - 5) * 17;
  };

  const handleInputChange = (e) => {
    const value = Number(e.target.value);
    setCurrentReadingInput(value);
    setCalculatedBill(calculateBill(value));
  };

  // Check if user can record a new reading (30-day / one per month)
  const canRecord = () => {
    if (!selectedCustomer?.billing_date) return true;

    const lastDate = new Date(selectedCustomer.billing_date);
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
  };

  const nextAllowedDate = selectedCustomer?.billing_date
    ? new Date(new Date(selectedCustomer.billing_date).setDate(new Date(selectedCustomer.billing_date).getDate() + 30))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const newReading = Number(currentReadingInput);
    if (newReading <= 0) {
      setMessage("Current reading must be greater than 0.");
      return;
    }

    const payload = { cubic_used: newReading };

    try {
      const res = await updateConsumption(selectedCustomer.id, payload);
      const updated = res.data.data;

      setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedCustomer(updated);
      setMessage("Reading updated successfully!");
      setCurrentReadingInput("");
      setCalculatedBill(0);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to update reading.";
      setMessage(errMsg);
    }

    setTimeout(() => setMessage(""), 5000);
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
              {customers.map((c) => (
                <li key={c.id}
                    className="p-4 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                    onClick={() => selectCustomer(c)}>
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Selected Customer */}
        {selectedCustomer && (
          <div className="bg-white/10 border border-gray-700 p-6 rounded-xl relative">
            {message && (
              <div className={`absolute top-4 right-4 px-4 py-2 rounded ${message.includes("successfully") ? "bg-green-600" : "bg-red-600"} text-white`}>
                {message}
              </div>
            )}

            <button className="mb-6 text-blue-400 underline"
                    onClick={() => setSelectedCustomer(null)}>
              ← Back to Customers
            </button>

            {/* Customer Details */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-600">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Customer Details</h3>
              <p><strong>Name:</strong> {selectedCustomer.name}</p>
              <p><strong>Previous Bill:</strong> ₱ {selectedCustomer.previous_reading}</p>
              <p><strong>Current Total Bill:</strong> ₱ {selectedCustomer.present_reading}</p>
              <p><strong>Cubic Used Last Month:</strong> {selectedCustomer.cubic_used_last_month} m³</p>
              <p><strong>Current Month Cubic Used:</strong> {selectedCustomer.cubic_used} m³</p>
            </div>

            {/* New Reading Form */}
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Enter Current Reading</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1">Current Reading (m³):</label>
                <input type="number"
                       value={currentReadingInput}
                       onChange={handleInputChange}
                       className="p-2 bg-gray-800 text-white rounded w-full"
                       required
                       disabled={!canRecord()} />
              </div>

              {currentReadingInput > 0 && (
                <div className="md:col-span-2 text-yellow-300 font-semibold">
                  Calculated Bill: ₱ {calculatedBill}
                </div>
              )}

              {!canRecord() && nextAllowedDate && (
                <div className="md:col-span-2 text-red-400 font-semibold">
                  Next allowed recording date: {new Date(nextAllowedDate).toLocaleDateString()}
                </div>
              )}

              <button type="submit"
                      disabled={!canRecord()}
                      className={`md:col-span-2 p-2 rounded text-white ${canRecord() ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600 cursor-not-allowed"}`}>
                Save Reading
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeterReaderDashboard;
  