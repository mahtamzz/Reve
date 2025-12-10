import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import LoginAdmin from "@/components/Login page/Loginadmin";
import VerificationPage from "@/pages/Verification";
import Dashboard from "@/components/Dashboard/Dashboard";
import ForgotPassword from "@/components/Forgotpass/ForgotPassword";
import About from "@/components/About/About";
import Services from "@/components/Services/Services";
import Contactus from "@/components/ContactUs/Contactus";
import Dashboardadmin from "@/components/Dashboard/Dashboardadmin";
import ResetPassword from "@/components/ResetPassword/ResetPassword";
import { Route, Routes } from "react-router-dom";
import React from "react";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/verification" element={<VerificationPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contactus />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard-admin" element={<Dashboardadmin />} />
    </Routes>
  );
}

export default React.memo(App);
