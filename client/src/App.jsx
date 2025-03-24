import { Routes, Route } from "react-router-dom";
import LoginForm from "./components/LogIn";
import Landing from "./components/HomePage"; 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginForm />} />
    </Routes>
  );
}
