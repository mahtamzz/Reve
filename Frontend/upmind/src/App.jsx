import Signup from "./components/SignUp page/Singup"
import Login from "./components/Login page/Login"
import {Route, Routes} from 'react-router-dom'

function App() {
  return(
    <Routes>
      <Route path="/" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
    </Routes>
  )
}

export default App
