import { useState } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Splash from "./components/Splash";
import Login from "./components/Login";
import Verify from "./pages/Verify";
import Home from "./components/Home";
import JoinMeeting from "./components/Features/JoinMeeting";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Verify" element={<Verify/>} />
        <Route path="/Home" element={<Home/>} />
          <Route path="/join/:roomId" element={<JoinMeeting onSendMessage={() => {}} />} />
      </Routes>
    </>
  );
}

export default App;
