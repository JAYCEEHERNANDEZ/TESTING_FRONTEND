import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Pictures/Sucol Logo.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1f] via-[#0b0f24] to-[#1a0545] flex flex-col text-white relative">

      {/* --- TOP RIGHT BUTTONS --- */}
      <div className="absolute top-8 right-10 flex items-center gap-4">


</div>


      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between px-8 lg:px-28 py-20 flex-grow">

        {/* LEFT SIDE */}
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-wide drop-shadow-lg">
            Welcome.
          </h1>

          <p className="text-gray-300 text-xl mt-4 max-w-md">
            Sucol Water System — Efficient water management.
          </p>

          <h2 className="text-3xl font-bold text-white mt-20">
            Log in as:
          </h2>

          {/* RESIDENT BUTTON ONLY */}
          <div className="mt-10 flex flex-col gap-4 w-60 mx-auto lg:mx-0">

            <Link
              to="/resident-login"
              className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl 
              text-white font-semibold text-center shadow-[0_0_15px_#007bff] 
              transition-transform hover:scale-105"
            >
              Resident
            </Link>

          </div>
        </div>

        {/* RIGHT SIDE LOGO */}
        <div className="w-full lg:w-auto mt-16 lg:mt-11 lg:mr-50 flex justify-center lg:justify-end">
          <div className="w-90 h-90 bg-[#0d1024] rounded-3xl shadow-[0_0_40px_#3b82f6] flex items-center justify-center p-6 border border-blue-700/40">
            <img
              src={Logo}
              alt="Sucol Water System Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_#60a5fa] transition-transform duration-300 hover:scale-110"
            />
          </div>
        </div>
      </div>

      {/* BADGES */}
      <div className="px-12 text-center grid grid-cols-2 lg:grid-cols-4 gap-6 text-gray-300 mt-10">
        <div>✔ Reliable Water Service</div>
        <div>✔ Modern Monitoring System</div>
        <div>✔ Community Focused</div>
        <div>✔ Fast & Secure</div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 text-center text-sm text-gray-400 mt-10">
        &copy; {new Date().getFullYear()} Sucol Water System. All rights reserved.
      </footer>

    </div>
  );
}
