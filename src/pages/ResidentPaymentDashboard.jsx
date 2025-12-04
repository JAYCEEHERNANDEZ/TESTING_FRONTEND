import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaMoneyBillWave, FaUserCircle, FaHistory } from "react-icons/fa";
import { fetchUserPayments, submitReferenceCodeAPI } from "../api/api.js";
import QR from "../Pictures/qr-code.png";

const ResidentPaymentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [latestUnpaid, setLatestUnpaid] = useState(null);
  const [currentPaid, setCurrentPaid] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentOption, setPaymentOption] = useState("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("user_id"));

  const loadPayments = async () => {
    try {
      const res = await fetchUserPayments(userId);
      const payments = res.data.data.sort(
        (a, b) => new Date(b.billing_date) - new Date(a.billing_date)
      );

      setPaymentHistory(payments);

      const unpaid = payments.find((p) => Number(p.remaining_balance) > 0);
      setLatestUnpaid(unpaid || null);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const paid = payments.find(
        (p) =>
          Number(p.remaining_balance) === 0 &&
          new Date(p.billing_date).getMonth() === currentMonth &&
          new Date(p.billing_date).getFullYear() === currentYear
      );
      setCurrentPaid(paid || null);

      setPaymentOption("full");
      setPartialAmount("");
      setReferenceCode("");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) loadPayments();
  }, [userId]);

  const handleSubmitProof = async () => {
    if (!referenceCode.trim()) {
      alert("Please enter your GCash reference code!");
      return;
    }
    if (!latestUnpaid) return;

    let amount = latestUnpaid.remaining_balance;

    if (paymentOption === "partial") {
      if (!partialAmount || Number(partialAmount) <= 0) {
        alert("Please enter a valid partial amount.");
        return;
      }
      if (Number(partialAmount) > Number(amount)) {
        alert("Partial amount cannot exceed remaining balance.");
        return;
      }
      amount = Number(partialAmount);
    }

    try {
      await submitReferenceCodeAPI({
        user_id: userId,
        bill_id: latestUnpaid.id,
        amount,
        payment_type: paymentOption,
        reference_code: referenceCode.trim(),
      });

      alert("Reference code submitted! Wait for admin verification.");
      setReferenceCode("");
      setPartialAmount("");
      loadPayments();
    } catch (err) {
      console.error(err);
      alert("Submission failed. Try again!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    navigate("/");
  };

  const navItems = [
    { label: "Dashboard", path: "/resident-dashboard", icon: <FaTachometerAlt /> },
    { label: "Payments", path: "/payment", icon: <FaMoneyBillWave /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside
        className={`bg-gray-950 text-white flex flex-col transition-all duration-300 shadow-md m-2 rounded-2xl
        ${sidebarOpen ? "w-64" : "w-20 overflow-hidden"}`}
      >
        <div className="flex items-center justify-between mt-8 mb-8 px-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>💧 SWS</h1>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl text-white hover:text-blue-400">☰</button>
            </div>
          ) : (
            <div className="flex justify-center w-full cursor-pointer" onClick={() => setSidebarOpen(true)}>
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
          {sidebarOpen && <span className="text-lg font-semibold text-blue-500 uppercase mb-2">SUCOL WATER SYSTEM</span>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 hover:text-red-400 px-2 py-1 rounded"
          >
            <FaUserCircle className="text-2xl" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 relative m-2 ml-0">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-white shadow rounded-xl py-4 px-7 mb-6">
          <span className="text-lg font-semibold text-black">Resident Payments</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Current Month Bill & Paid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-blue-600 text-xl font-bold">₱ {latestUnpaid?.remaining_balance ?? 0}</p>
                <p className="text-gray-600 mt-1 text-sm">Latest Unpaid Bill</p>
                {latestUnpaid && (
                  <span className="text-gray-500 text-xs block mt-2">
                    Due: {new Date(latestUnpaid.due_date).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <p className="text-green-600 text-xl font-bold">₱ {currentPaid?.payment_total ?? 0}</p>
                <p className="text-gray-600 mt-1 text-sm">Current Month Paid</p>
                {currentPaid && (
                  <span className="text-gray-500 text-xs block mt-2">
                    Status: {currentPaid.status}
                  </span>
                )}
              </div>
            </div>

            {/* Latest Unpaid + GCash Reference Submission */}
            {latestUnpaid && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-semibold mb-3">Submit GCash Reference Code</h3>
                {/* Payment Option */}
                <div className="mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="full"
                      checked={paymentOption === "full"}
                      onChange={() => {
                        setPaymentOption("full");
                        setPartialAmount("");
                      }}
                    />
                    Full Payment (₱{latestUnpaid.remaining_balance})
                  </label>
                  <label className="flex items-center gap-2 mt-1">
                    <input
                      type="radio"
                      value="partial"
                      checked={paymentOption === "partial"}
                      onChange={() => setPaymentOption("partial")}
                    />
                    Partial Payment
                  </label>
                  {paymentOption === "partial" && (
                    <input
                      type="number"
                      className="w-full p-2 border rounded mt-2"
                      placeholder="Enter partial amount"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                    />
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Enter GCash reference code"
                  className="w-full p-2 border rounded mb-3"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                />

                <button
                  onClick={handleSubmitProof}
                  className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                  Submit Reference
                </button>
              </div>
            )}

            {/* Show/Hide History + History Table */}
            {paymentHistory.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 mb-3"
                >
                  <FaHistory />
                  {showHistory ? "Hide Payment History" : "Show Payment History"}
                </button>
                {showHistory && (
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                    {paymentHistory.map((p) => (
                      <div
                        key={p.id}
                        className={`p-3 mb-2 rounded ${
                          Number(p.remaining_balance) === 0 ? "bg-green-100" : "bg-yellow-100"
                        }`}
                      >
                        {new Date(p.billing_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                        — ₱{p.current_bill} ({p.status})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - GCash QR */}
          <div className="lg:w-1/2 bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
            <p className="mb-3">Scan QR to Pay via GCash</p>
            <img src={QR} alt="GCash QR" className="w-100 h-100 object-contain" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResidentPaymentDashboard;
