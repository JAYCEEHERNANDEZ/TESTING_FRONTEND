// ReceiptPage.jsx
import React from "react";
import jsPDF from "jspdf";

const ReceiptPage = () => {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Example content
    doc.setFontSize(16);
    doc.text("SUCOL Water System", 20, 20);
    doc.setFontSize(12);
    doc.text("Receipt for Payment", 20, 30);
    doc.text("Resident: John Doe", 20, 40);
    doc.text("Amount Paid: ₱500", 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);

    doc.save("receipt.pdf");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Payment Receipt</h2>
      <button
        onClick={handleDownloadPDF}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Download PDF
      </button>
    </div>
  );
};

export default ReceiptPage;
