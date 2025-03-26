import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import LoginForm from "./components/LogIn";
import SignupForm from "./components/Signup";
import ResetPasswordForm from "./components/Form/ResetPassword";
import Landing from "./components/HomePageUnsigned";
import HomePage from "./components/HomePage";
import Projects from "./components/Page/Projects";
import ApiBuilder from "./components/Page/ApiBuilder";

export default function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("auth");
    setIsSignedIn(Boolean(user));
  }, []);

  return (
    <Routes>
      <Route path="/" element={isSignedIn ? <HomePage /> : <Landing />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/reset" element={<ResetPasswordForm />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/generate" element={<ApiBuilder />} />
    </Routes>
  );
}
