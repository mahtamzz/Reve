import SignupPage from "@/pages/Signup";
import LoginPage from "@/pages/Login";
import LoginAdmin from "@/components/Login page/Loginadmin";
import VerificationPage from "@/pages/Verification";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "@/components/Forgotpass/ForgotPassword";
import About from "@/components/About/About";
import Services from "@/components/Services/Services";
import Contactus from "@/components/ContactUs/Contactus";
import Dashboardadmin from "./components/Dashboard/Dashboardadmin";
import ResetPassword from "@/components/ResetPassword/ResetPassword";
import OtpLoginPage from "./pages/OtpLoginPage";
import FocusPage from "./pages/FocusPage";
import LandingPage from "./pages/LandingPage";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import GroupChat from "./pages/GroupChat";
import Notifications from "./pages/Notifications";
import ConnectionsPage from "./pages/ConnectionsPage";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import ManageSubjects from "./pages/ManageSubjects";
import { Route, Routes } from "react-router-dom";
import React from "react";


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignupPage/>}/>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/login-otp" element={<OtpLoginPage/>}/>
      <Route path="/admin/login-otp" element={<OtpLoginPage/>}/>
      <Route path="/verification" element={<VerificationPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contactus />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard-admin" element={<Dashboardadmin />} />
      <Route path="/focus" element={<FocusPage />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/groups/:groupId" element={<GroupDetails />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/groups/:groupId/chat" element={<GroupChat />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/connections" element={<ConnectionsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/study/subjects" element={<ManageSubjects />} />
    </Routes>
  );
}

export default React.memo(App);
