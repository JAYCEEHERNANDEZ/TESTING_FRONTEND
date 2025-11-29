import { BrowserRouter, Routes, Route } from "react-router-dom";
import Adminlogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ResidentLogin from './pages/ResidentLogin.jsx'
import ResidentDashboard from "./pages/ResidentDashboard.jsx";
import MeterReaderLogin from "./pages/MeterReaderLogin.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import NotificationCenter from "./pages/NotificationCenter.jsx";
import Profiles from "./pages/Profiles.jsx"
import ManageCustomers  from "./pages/ManageCustomers.jsx";
import ManageRecords from "./pages/ManageRecords.jsx";
import ReaderDashboard from "./pages/MeterReaderDashboard.jsx"
import Payment from "./pages/ResidentPaymentDashboard.jsx"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<Adminlogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/resident-login" element={<ResidentLogin />} />
        <Route path="/meter-reader" element={<MeterReaderLogin />} />
        <Route path="/resident-dashboard" element={<ResidentDashboard />} />
        <Route path="/notification-center" element={<NotificationCenter />} />
        <Route path="/admin-profiles" element={<Profiles />} />
        <Route path="/manage-customers" element={<ManageCustomers/>} />
        <Route path="/manage-records" element={<ManageRecords/>} />
        <Route path="/reader-dashboard" element={<ReaderDashboard/>} />
        <Route path="/payment" element={<Payment/>} />
        </Routes>
    </BrowserRouter>
  );
}
