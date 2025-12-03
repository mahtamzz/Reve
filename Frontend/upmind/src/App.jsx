import { useEffect } from "react";
import Signup from "./components/SignUp page/Singup"
import Login from "./components/Login page/Login"
import Verification from "./components/Verification/Verification"
import {Route, Routes} from 'react-router-dom'

function App() {
  useEffect(() => {
    // فقط تست: یک بار روی mount
    fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: '123456',
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('REGISTER RESPONSE:', data);
      })
      .catch((err) => console.error(err));
  }, []);

  return(
    <Routes>
      <Route path="/" element={<Signup/>}></Route>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/verification" element={<Verification/>}></Route>
    </Routes>
  )
}

export default App;
