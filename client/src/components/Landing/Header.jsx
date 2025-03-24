import { Link } from "react-router-dom";

export default function Header() {
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
          <a href="#generate" className="hover:underline">
            Docs
          </a>
          <Link to="/login" className="px-4 py-1 border border-blue-900 rounded-full hover:bg-blue-50">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
