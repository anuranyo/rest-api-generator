import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

import LoginForm from "./components/LogIn";
import SignupForm from "./components/Signup";
import ResetPasswordForm from "./components/Page/ResetPassword";
import SetNewPassword from "./components/Page/SetNewpassword";
import Landing from "./components/HomePageUnsigned";
import HomePage from "./components/HomePage";
import Projects from "./components/Page/Projects";
import ApiBuilder from "./components/Page/ApiBuilder";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default function App() {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public home page or authenticated home page */}
      <Route path="/" element={currentUser ? <HomePage /> : <Landing />} />
      
      {/* Authentication routes */}
      <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginForm />} />
      <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <SignupForm />} />
      <Route path="/reset" element={currentUser ? <Navigate to="/" /> : <ResetPasswordForm />} />
      <Route path="/reset-password/:token" element={currentUser ? <Navigate to="/" /> : <SetNewPassword />} />
      
      {/* Protected routes */}
      <Route path="/projects" element={
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      } />
      <Route path="/generate" element={
        <ProtectedRoute>
          <ApiBuilder />
        </ProtectedRoute>
      } />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}