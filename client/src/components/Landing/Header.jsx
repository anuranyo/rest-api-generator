import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Header() {
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authFlag = localStorage.getItem("auth");
    setIsAuth(authFlag === "true");
  }, []);

  const handleLogout = () => {
    // Remove authentication flag from localStorage
    localStorage.removeItem("auth");
    
    // Update authentication state
    setIsAuth(false);

    // Explicitly navigate to the unsigned home page
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold italic text-blue-900 border px-3 py-1 rounded-md border-blue-900"
        >
          api.sandbox
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium text-blue-900">
          <a href="#generate" className="text-lg hover:underline ">
            Docs
          </a>

          {isAuth ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1 text-lg border border-blue-900 rounded-full hover:bg-blue-50"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1 text-lg border border-blue-900 rounded-full hover:bg-blue-50"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}