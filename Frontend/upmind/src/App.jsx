import Signup from "./components/SignUp page/Singup"
import Login from "./components/Login page/Login"
import Verification from "./components/Verification/Verification"
import Dashboard from "./components/Dashboard/Dashboard";
import ForgotPassword from "./components/Forgotpass/ForgotPassword";
import About from "./components/About/About";
import Services from "./components/Services/Services";
import Contactus from "./components/ContactUs/Contactus";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import {Route, Routes} from 'react-router-dom'

function App() {
  return(
    <Routes>
      <Route path="/" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/verification" element={<Verification/>}></Route>
      <Route path="/dashboard" element={<Dashboard/>}></Route>
      <Route path="/forgot-password" element={<ForgotPassword/>}></Route>
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contactus />} />
      <Route path="/reset-password" element={<ResetPassword/>}></Route>
    </Routes>
  )
}

export default App;
