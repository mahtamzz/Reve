import Signup from "./components/SignUp page/Singup"
import Login from "./components/Login page/Login"
import Verification from "./components/Verification/Verification"
import {Route, Routes} from 'react-router-dom'

function App() {
  return(
    <Routes>
      <Route path="/" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/verification" element={<Verification/>}></Route>
    </Routes>
  )
}

export default App
